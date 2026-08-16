-- ═══════════════════════════════════════════════════════════════════════════
-- 009b — PRZYPISANIE OPIEKUNÓW OBIEKTÓW
--
-- Uzupełnij kolumnę z adresem e-mail przy każdym obiekcie i uruchom całość.
-- Skrypt jest IDEMPOTENTNY — można uruchamiać wielokrotnie, poprawiając wpisy.
--
-- Obiekt, przy którym zostawisz NULL, NIE dostanie opiekuna. Po włączeniu
-- migracji 008 nie zobaczy go żaden handlowiec (role wewnętrzne widzą wszystko).
--
-- Gdzie: Supabase → SQL Editor → wklej → Run.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

with przypisania (object_id, email) as (values
  -- ──────────────────────────────────────────────────────────────────────────
  -- KLIENT / OBIEKT                                    → WPISZ E-MAIL HANDLOWCA
  -- ──────────────────────────────────────────────────────────────────────────

  -- A Premium Services s.r.o. / Hotel Premium Bussines        [SK]
  ('3ac8d838-9837-429d-b431-58f2367f8e26'::uuid, NULL),

  -- Aplend s.r.o. / Hotel Luizja Major                        [SK]
  ('eadbec05-f61a-4759-ae59-056f07b935a2'::uuid, NULL),

  -- Aplend s.r.o. / Wellness Hotel Borovica                   [SK]
  ('52034231-4d80-4c1d-9611-4ed1166e56c5'::uuid, NULL),

  -- Artn Sp z o.o. / Fabryka Norblina                         [PL]
  ('0382018e-531d-4dba-8dd7-ff436b00f49f'::uuid, NULL),

  -- Concordia Design Sp. z o.o. / Concordia Design Wrocław    [PL]
  ('94a6cbb1-5c7e-48a8-a7a6-b6feb8bac411'::uuid, NULL),

  -- Gmina Gostyń OSiR / OSiR Gostyń                           [PL]
  ('2c1d3f7c-4098-47c8-8bf1-96575b39c3f3'::uuid, NULL),

  -- Hotel Wena Restauracja Sp. z o.o. / Hotel Wena            [PL]
  ('d6058487-d87d-4506-9d58-83901eba0e82'::uuid, NULL),

  -- Janom Investments a.s. / Restauracja PRI Lipe             [SK]
  ('e9879368-0400-482c-a3b4-387af54768ff'::uuid, NULL),

  -- MIDAS GROUP sp z o.o. / Blue Park                         [PL]
  ('2f38c639-23aa-4b9a-a9f2-9c2fd95aa605'::uuid, NULL),

  -- Panorama Servis s.r.o. / Hotel Panorama                   [SK]
  ('b0c23d0a-15a1-4079-adc6-d6c3c8ffc090'::uuid, NULL),

  -- PKP Wrocław / PKP Kąty Wrocławskie                        [PL]
  ('61a00677-58b4-4689-929c-199d577f3cb1'::uuid, NULL),

  -- SM Kościuszki w Kielcach / Spółdzielnia Kościuszki        [PL]
  ('c12a1363-e1af-4f2b-9f9a-c8ca7fdfc50c'::uuid, NULL),

  -- SM Zagórze Sosnowiec / Spółdzielnia Zagórze               [PL]
  ('08810e5a-3171-41d4-b116-8309c6f47536'::uuid, NULL),

  -- Student Depot sp z o.o. / Student Depot Lublin Apartamenty [PL]
  ('fb197144-a349-48bd-b1b4-4e6495def26c'::uuid, NULL),

  -- ZZOZ w Ostrowie Wielkopolskim / Szpital w Ostrowie Wlkp.  [PL]
  ('7ab29a8b-fa04-4bbc-8a2c-ecbc6b57d389'::uuid, NULL)
),
rozwiazane as (
  select p.object_id, u.id as user_id, p.email
  from przypisania p
  left join auth.users u on lower(u.email) = lower(p.email)
  where p.email is not null
)
-- Kontrola: e-mail wpisany, ale nieznaleziony w bazie → literówka.
, kontrola as (
  select string_agg(email, ', ') as zle
  from rozwiazane where user_id is null
)
update objects o
set data = jsonb_set(o.data, '{ownerId}', to_jsonb(r.user_id::text), true),
    updated_at = now()
from rozwiazane r, kontrola k
where o.id = r.object_id
  and r.user_id is not null
  and (k.zle is null or k.zle = '');

commit;


-- ── KONTROLA PO URUCHOMIENIU ───────────────────────────────────────────────
-- Powinna pokazać każdy obiekt z przypisanym opiekunem.
-- „‼ BRAK OPIEKUNA" = obiekt niewidoczny dla żadnego handlowca po migracji 008.

select
  coalesce(u.email, '‼ BRAK OPIEKUNA')  as opiekun,
  c.data->>'name'                       as klient,
  o.data->>'name'                       as obiekt
from objects o
join clients c on c.id = o.client_id
left join auth.users u on u.id = (o.data->>'ownerId')::uuid
order by (u.email is null) desc, u.email, c.data->>'name';


-- ── LITEROWKI W E-MAILACH ──────────────────────────────────────────────────
-- Jeśli powyższa kontrola pokazuje BRAK OPIEKUNA mimo wpisanego e-maila,
-- sprawdź, czy adres istnieje:
--
--   select email from auth.users where email ilike '%fragment%';
