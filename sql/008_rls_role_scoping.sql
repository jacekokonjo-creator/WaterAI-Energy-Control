-- ═══════════════════════════════════════════════════════════════════════════
-- Migracja 008 — zawężenie widoczności ról zewnętrznych
--
-- ⚠️  NIE URUCHAMIAĆ BEZ PRZECZYTANIA. Zmienia polityki RLS na produkcji.
--     Błąd w tym pliku = odcięcie użytkowników od danych albo przeciek.
--     Przed uruchomieniem: kopia zapasowa + test na kopii bazy.
--
-- Problem (z KONTEKST 2026-07-12, punkt „do zrobienia" nr 1–3):
--   1. is_internal() obejmuje salesRepresentative → przedstawiciel handlowy
--      widzi WSZYSTKICH klientów, obiekty, pomiary i faktury. To przeciek
--      danych między klientami, a rola jest ZEWNĘTRZNA.
--   2. Klient widzi dokumenty po client_id zamiast „utworzone przez siebie
--      + udostępnione".
--   3. Back Office nie może zarządzać udostępnieniami (tylko admin + analityk).
--
-- Zasada docelowa: dla ról zewnętrznych (Klient, Sales Rep) żadnych przecieków
-- cudzych danych ani ślepych funkcji.
--
-- Plik jest IDEMPOTENTNY — można uruchomić wielokrotnie.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── 1. Rozdzielenie „wewnętrzny" od „ma dostęp do wszystkiego" ──────────────
-- is_internal() zostaje bez zmian (używane w wielu miejscach), ale dochodzi
-- węższa funkcja dla ról z pełnym wglądem w dane wszystkich klientów.

create or replace function public.is_full_access()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.roles && array['admin','backOffice','energyAnalyst']::text[]
  );
$$;

-- Czy bieżący użytkownik jest opiekunem danego obiektu.
-- WYMAGA kolumny objects.owner_id (patrz krok 2) — bez niej Sales Rep
-- straciłby dostęp do wszystkiego, łącznie z własnymi obiektami.
create or replace function public.is_object_owner(obj_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.objects o
    where o.id = obj_id and o.owner_id = auth.uid()
  );
$$;

-- ── 2. Pole opiekuna obiektu ────────────────────────────────────────────────
alter table public.objects
  add column if not exists owner_id uuid references auth.users(id);

create index if not exists idx_objects_owner on public.objects(owner_id);

-- UWAGA: dopóki owner_id jest puste, Sales Rep nie zobaczy NICZEGO.
-- Przed włączeniem polityk z kroku 3 trzeba uzupełnić opiekunów, np.:
--   update public.objects set owner_id = '<uuid-handlowca>' where id in (...);
-- Krok 3 jest celowo zakomentowany — odkomentować dopiero po uzupełnieniu.

-- ── 3. Zawężenie Sales Rep (ZAKOMENTOWANE — patrz uwaga wyżej) ──────────────
-- drop policy if exists p_obj_internal_all on public.objects;
-- create policy p_obj_scoped on public.objects for select using (
--   public.is_full_access()
--   or public.is_object_owner(id)
--   or public.has_share('object', id)
-- );
--
-- drop policy if exists p_cli_internal_all on public.clients;
-- create policy p_cli_scoped on public.clients for select using (
--   public.is_full_access()
--   or exists (select 1 from public.objects o
--              where o.client_id = clients.id and o.owner_id = auth.uid())
-- );
--
-- drop policy if exists p_read_internal_all on public.readings;
-- create policy p_read_scoped on public.readings for select using (
--   public.is_full_access()
--   or public.is_object_owner(object_id)
--   or exists (select 1 from public.objects o
--              join public.clients c on c.id = o.client_id
--              where o.id = readings.object_id and c.auth_user_id = auth.uid())
-- );

-- ── 4. Back Office zarządza udostępnieniami ─────────────────────────────────
-- Rozszerzenie is_analyst_or_admin() o backOffice, zgodnie z docelowym
-- modelem ról. Nazwa funkcji zostaje (używana w politykach resource_shares).
create or replace function public.is_analyst_or_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.roles && array['admin','energyAnalyst','backOffice']::text[]
  );
$$;

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- PO URUCHOMIENIU — lista kontrolna:
--   [ ] Zalogować się jako admin        → widzi wszystko
--   [ ] Zalogować się jako backOffice   → widzi wszystko + zarządza udostępnieniami
--   [ ] Zalogować się jako energyAnalyst→ bez zmian
--   [ ] Zalogować się jako salesRep     → widzi TYLKO przypisane obiekty
--   [ ] Zalogować się jako client       → widzi tylko swoje
--   [ ] Sprawdzić, że faktury i raporty nadal się otwierają dla każdej roli
-- ═══════════════════════════════════════════════════════════════════════════
