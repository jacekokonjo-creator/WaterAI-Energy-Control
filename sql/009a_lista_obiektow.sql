-- ═══════════════════════════════════════════════════════════════════════════
-- 009a — LISTA OBIEKTÓW DO PRZYPISANIA OPIEKUNÓW
--
-- Czyta tylko dane (SELECT). Niczego nie zmienia — można uruchamiać bez obaw.
--
-- Gdzie uruchomić: Supabase → SQL Editor → wklej → Run.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── KROK 1: Kto jest handlowcem? ───────────────────────────────────────────
-- Wypisuje konta z rolą salesRepresentative. Potrzebujesz stąd adresów e-mail
-- do kroku 3. Jeśli lista jest pusta — żadne konto nie ma jeszcze tej roli.

select
  p.full_name                                as handlowiec,
  u.email,
  coalesce(p.data->>'roles', p.role)         as role
from profiles p
join auth.users u on u.id = p.id
where p.role = 'salesRepresentative'
   or (p.data->'roles') ? 'salesRepresentative'
order by p.full_name nulls last;


-- ── KROK 2: Lista obiektów ─────────────────────────────────────────────────
-- Wszystkie obiekty z nazwą klienta. Kolumna „opiekun_teraz" pokazuje stan
-- obecny — przed uruchomieniem migracji 008 będzie wszędzie pusta.

select
  c.data->>'name'                            as klient,
  o.data->>'name'                            as obiekt,
  o.data->>'address'                         as adres,
  coalesce(u.email, '—')                     as opiekun_teraz,
  o.id                                       as object_id
from objects o
join clients c on c.id = o.client_id
left join auth.users u on u.id = (o.data->>'ownerId')::uuid
order by c.data->>'name', o.data->>'name';


-- ── KROK 3: Gotowy formularz do uzupełnienia ───────────────────────────────
-- To zapytanie WYPISUJE gotowe polecenia UPDATE — po jednym na obiekt.
-- Skopiuj wynik (kolumna „polecenie"), wklej do nowego okna SQL Editor,
-- podmień 'WPISZ@EMAIL' na adres właściwego handlowca i uruchom.
--
-- Obiekty bez opiekuna zostaw z pominięciem — po prostu usuń ich wiersze.

select
  '-- ' || (c.data->>'name') || ' / ' || (o.data->>'name') || E'\n' ||
  'update objects set data = jsonb_set(data, ''{ownerId}'', to_jsonb(' ||
  '(select id::text from auth.users where email = ''WPISZ@EMAIL'')' ||
  ')) where id = ''' || o.id || ''';'
  as polecenie
from objects o
join clients c on c.id = o.client_id
order by c.data->>'name', o.data->>'name';


-- ── KROK 4: Kontrola po przypisaniu ────────────────────────────────────────
-- Uruchom po wykonaniu poleceń z kroku 3. Pokazuje, ile obiektów
-- ma opiekuna, a ile nie. Obiekty bez opiekuna NIE będą widoczne
-- dla żadnego handlowca po włączeniu polityk z migracji 008.

select
  coalesce(u.email, '‼ BRAK OPIEKUNA')       as opiekun,
  count(*)                                   as liczba_obiektow,
  string_agg(o.data->>'name', ', ' order by o.data->>'name') as obiekty
from objects o
left join auth.users u on u.id = (o.data->>'ownerId')::uuid
group by u.email
order by (u.email is null) desc, u.email;
