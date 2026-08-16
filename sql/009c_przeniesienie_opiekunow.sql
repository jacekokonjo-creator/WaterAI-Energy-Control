-- ═══════════════════════════════════════════════════════════════════════════
-- 009c — PRZENIESIENIE ISTNIEJĄCYCH OPIEKUNÓW DO POLA ownerId
--
-- Obiekty mają już pole `salesRepresentative` z imieniem i nazwiskiem.
-- Ten skrypt dopasowuje je do kont (profiles.full_name) i zapisuje uuid
-- w `data->>'ownerId'`, którego używa RLS w migracji 008.
--
-- Zamiast 009b (ręczne wpisywanie e-maili) — 009b zostaje na wypadek
-- obiektów, których nie da się dopasować automatycznie.
--
-- BEZPIECZEŃSTWO: skrypt przerywa się, jeśli którykolwiek obiekt ma wpisanego
-- handlowca, którego NIE da się dopasować do konta. Lepiej nie zrobić nic,
-- niż przypisać część i zostawić niepewność, co się udało.
--
-- Idempotentny — można uruchamiać wielokrotnie.
-- Gdzie: Supabase → SQL Editor → wklej całość → Run.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── KROK 1: kontrola dopasowania ───────────────────────────────────────────
do $$
declare
  niedopasowane text;
  ile_ok int;
begin
  select string_agg(distinct o.data->>'salesRepresentative', ', ')
    into niedopasowane
  from objects o
  left join profiles p on p.full_name = o.data->>'salesRepresentative'
  where coalesce(o.data->>'salesRepresentative', '') <> ''
    and p.id is null;

  if niedopasowane is not null then
    raise exception
      'PRZERWANO: nie dopasowano do kont następujących osób: %. '
      'Załóż im konta albo użyj sql/009b_przypisanie_opiekunow.sql '
      'do ręcznego przypisania.', niedopasowane;
  end if;

  select count(*) into ile_ok
  from objects o
  join profiles p on p.full_name = o.data->>'salesRepresentative';

  raise notice 'Do przypisania: % obiektów', ile_ok;
end $$;

-- ── KROK 2: zapis opiekuna ─────────────────────────────────────────────────
-- Nadpisuje ownerId wartością wynikającą z pola salesRepresentative.
update objects o
set data = jsonb_set(o.data, '{ownerId}', to_jsonb(p.id::text), true),
    updated_at = now()
from profiles p
where p.full_name = o.data->>'salesRepresentative'
  and coalesce(o.data->>'salesRepresentative', '') <> ''
  and coalesce(o.data->>'ownerId', '') is distinct from p.id::text;

commit;


-- ── KONTROLA PO URUCHOMIENIU ───────────────────────────────────────────────
-- Każdy obiekt powinien mieć opiekuna. Kolumna „widzi_wszystko" pokazuje,
-- czy dana osoba i tak ma pełny dostęp (admin / backOffice / energyAnalyst) —
-- dla nich przypisanie jest tylko informacją, nie ograniczeniem.

select
  coalesce(u.email, '‼ BRAK OPIEKUNA')          as opiekun,
  coalesce(p.role, '—')                          as rola,
  case when p.role in ('admin','backOffice','energyAnalyst')
       then 'tak (pełny dostęp)' else 'nie — widzi tylko swoje' end
                                                 as widzi_wszystko,
  count(*)                                       as obiektow,
  string_agg(o.data->>'name', ', ' order by o.data->>'name') as lista
from objects o
left join auth.users u on u.id = (o.data->>'ownerId')::uuid
left join profiles   p on p.id = (o.data->>'ownerId')::uuid
group by u.email, p.role
order by (u.email is null) desc, p.role, u.email;
