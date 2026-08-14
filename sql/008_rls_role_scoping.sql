-- ═══════════════════════════════════════════════════════════════════════════
-- Migracja 008 — zawężenie widoczności ról zewnętrznych
--
-- ⚠️  URUCHAMIAĆ DOPIERO PO PRZYPISANIU OPIEKUNÓW (skrypt 009a).
--     Bez tego handlowcy stracą dostęp do wszystkiego.
--     Przed uruchomieniem: kopia zapasowa bazy.
--
-- Problem (KONTEKST, sekcja „Model ról", punkt otwarty):
--   `is_internal()` obejmuje salesRepresentative, więc handlowiec — rola
--   ZEWNĘTRZNA — widzi wszystkich klientów, obiekty, pomiary i faktury.
--   To przeciek danych między klientami.
--
-- Opiekun obiektu trzymany jest w `objects.data->>'ownerId'` (uuid użytkownika),
-- spójnie z resztą schematu, gdzie dane rekordu żyją w kolumnie jsonb `data`.
-- Dzięki temu pole jest zapisywalne także z poziomu aplikacji.
--
-- Skrypt ma wbudowany BEZPIECZNIK: przerwie się, jeśli żaden obiekt nie ma
-- opiekuna. Jest idempotentny — można uruchomić wielokrotnie.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── 1. Funkcje pomocnicze ──────────────────────────────────────────────────

-- Role z pełnym wglądem we wszystkie dane. `is_internal()` zostaje bez zmian
-- (używane w wielu miejscach); to jego węższy odpowiednik, BEZ handlowca.
create or replace function public.is_full_access()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.role in ('admin','backOffice','energyAnalyst')
           or (p.data->'roles') ?| array['admin','backOffice','energyAnalyst'])
  );
$$;

-- Czy bieżący użytkownik jest opiekunem danego obiektu.
create or replace function public.is_object_owner(obj_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.objects o
    where o.id = obj_id
      and (o.data->>'ownerId')::uuid = auth.uid()
  );
$$;

-- ── 2. Indeks na opiekunie ─────────────────────────────────────────────────
create index if not exists idx_objects_owner
  on public.objects (((data->>'ownerId')::uuid));

-- ── 3. BEZPIECZNIK ─────────────────────────────────────────────────────────
-- Przerywa migrację, jeśli ŻADEN obiekt nie ma opiekuna — to znak, że
-- skrypt 009a nie został wykonany, a włączenie polityk odcięłoby handlowców
-- od wszystkich danych.
do $$
declare n int;
begin
  select count(*) into n from public.objects where data->>'ownerId' is not null;
  if n = 0 then
    raise exception
      'PRZERWANO: żaden obiekt nie ma przypisanego opiekuna (data->>''ownerId''). '
      'Uruchom najpierw sql/009a_lista_obiektow.sql i przypisz opiekunów, '
      'inaczej handlowcy stracą dostęp do wszystkich danych.';
  end if;
  raise notice 'Obiektów z przypisanym opiekunem: %', n;
end $$;

-- ── 4. Widoczność obiektów ─────────────────────────────────────────────────
drop policy if exists p_obj_internal_all on public.objects;
drop policy if exists p_obj_scoped on public.objects;
create policy p_obj_scoped on public.objects for select using (
  public.is_full_access()
  or public.is_object_owner(id)
  or public.has_share('object', id)
  or exists (select 1 from public.profiles p
             where p.id = auth.uid() and p.client_id = objects.client_id)
);

-- ── 5. Widoczność klientów ─────────────────────────────────────────────────
-- Handlowiec widzi klienta, jeśli opiekuje się choć jednym jego obiektem.
drop policy if exists p_cli_internal_all on public.clients;
drop policy if exists p_cli_scoped on public.clients;
create policy p_cli_scoped on public.clients for select using (
  public.is_full_access()
  or exists (select 1 from public.objects o
             where o.client_id = clients.id
               and (o.data->>'ownerId')::uuid = auth.uid())
  or exists (select 1 from public.profiles p
             where p.id = auth.uid() and p.client_id = clients.id)
);

-- ── 6. Widoczność pomiarów ─────────────────────────────────────────────────
drop policy if exists p_read_internal_all on public.readings;
drop policy if exists p_read_scoped on public.readings;
create policy p_read_scoped on public.readings for select using (
  public.is_full_access()
  or public.is_object_owner(object_id)
  or exists (select 1 from public.objects o
             join public.profiles p on p.client_id = o.client_id
             where o.id = readings.object_id and p.id = auth.uid())
);

-- ── 7. Back Office zarządza udostępnieniami ────────────────────────────────
-- Zgodnie z modelem ról (KONTEKST_PROJEKTU.md). Nazwa funkcji zostaje
-- (używana w politykach resource_shares), zmienia się tylko zakres.
create or replace function public.is_analyst_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.role in ('admin','energyAnalyst','backOffice')
           or (p.data->'roles') ?| array['admin','energyAnalyst','backOffice'])
  );
$$;

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- LISTA KONTROLNA — zalogować się kolejno jako:
--   [ ] admin               → widzi wszystko
--   [ ] backOffice          → widzi wszystko + zarządza udostępnieniami
--   [ ] energyAnalyst       → bez zmian
--   [ ] salesRepresentative → widzi TYLKO przypisane obiekty i ich klientów
--   [ ] client              → widzi tylko swoje
--   [ ] faktury i raporty otwierają się dla każdej roli
--
-- WYCOFANIE (gdyby coś poszło nie tak):
--   drop policy if exists p_obj_scoped  on public.objects;
--   drop policy if exists p_cli_scoped  on public.clients;
--   drop policy if exists p_read_scoped on public.readings;
--   …i przywrócić poprzednie polityki z migracji 003.
-- ═══════════════════════════════════════════════════════════════════════════
