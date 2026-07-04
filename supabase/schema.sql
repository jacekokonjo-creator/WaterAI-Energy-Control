-- ═══════════════════════════════════════════════════════════════════════════
-- WaterAI Energy Control — schemat Supabase (migracja z localStorage)
-- Wersja: 001 · 2026-07-05
--
-- MODEL HYBRYDOWY: każda tabela ma kolumny relacyjne potrzebne do
-- bezpieczeństwa (RLS) i filtrowania (id, client_id, object_id, …)
-- + kolumnę `data jsonb` z resztą pól w kształcie 1:1 z obecnym localStorage.
-- Dzięki temu podmiana wnętrza getAll/saveAll w modułach JS jest minimalna,
-- a obiekty wracają do frontendu w niezmienionym kształcie.
--
-- Uruchomienie: Supabase → SQL Editor → wklej całość → Run.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. KLIENCI I OBIEKTY ─────────────────────────────────────────────────────

create table clients (
  id         uuid primary key default gen_random_uuid(),
  data       jsonb not null default '{}'::jsonb,   -- regon, status, adres, dane FV, settlementModel, escoShare, …
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table objects (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,   -- źródła ciepła, dane TYM, …
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on objects (client_id);

-- ── 2. UŻYTKOWNICY (profil = rozszerzenie auth.users) ───────────────────────

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       text not null default 'client'
             check (role in ('admin','backOffice','energyAnalyst','salesRepresentative','client')),
  client_id  uuid references clients(id),          -- wypełnione TYLKO dla role='client'
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Funkcje pomocnicze dla RLS (security definer = czytają profil mimo RLS).
create or replace function app_role() returns text
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

create or replace function app_client_id() returns uuid
language sql stable security definer set search_path = public as
$$ select client_id from profiles where id = auth.uid() $$;

create or replace function is_internal() returns boolean
language sql stable as
$$ select app_role() in ('admin','backOffice','energyAnalyst','salesRepresentative') $$;

create or replace function is_analyst_or_admin() returns boolean
language sql stable as
$$ select app_role() in ('admin','energyAnalyst') $$;

-- ── 3. POMIARY ŹRÓDŁOWE (nowa zakładka „Pomiary") ────────────────────────────
-- Czyste odczyty z terenu, oddzielone od protokołów TYM.
-- Klient MOŻE dodawać odczyty na własnych obiektach → wchodzą jako verified=false
-- i nie trafiają do obliczeń, dopóki analityk/admin ich nie zatwierdzi.

create table source_measurements (
  id          uuid primary key default gen_random_uuid(),
  object_id   uuid not null references objects(id) on delete cascade,
  measured_at timestamptz not null default now(),  -- zawsze UTC; UI wyświetla lokalnie
  type        text not null,                        -- 'supplyTemp','returnTemp','heatConsumption','meterReading','outdoorTemp','other'
  value       numeric not null,
  unit        text not null,
  note        text,
  photos      text[] not null default '{}',         -- ścieżki w Storage (bucket: measurement-photos)
  verified    boolean not null default false,
  created_by  uuid not null references profiles(id),
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  created_at  timestamptz not null default now()
);
create index on source_measurements (object_id, measured_at);
create index on source_measurements (verified) where verified = false;  -- kolejka „do zatwierdzenia"

-- ── 4. TABELE 1:1 Z OBECNYMI MODUŁAMI localStorage ──────────────────────────

create table measurements (          -- waterai_measurements_v2 (protokoły TYM)
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null references objects(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table analyses (              -- waterai_analyses_v1
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null references objects(id) on delete cascade,
  type text, status text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table esco_reports (          -- waterai_esco_reports_v1 (dotąd dług techn. — tu dostaje moduł)
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  object_id uuid references objects(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table base_periods (          -- waterai_base_periods_v1
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null references objects(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table intensity_bases (       -- waterai_intensity_base_v1
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table invoices (              -- waterai_invoices_v1
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table billing_entities (      -- waterai_billing_entities_*
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table documents (             -- waterai_documents_v1 (pliki → Storage, tu metadane)
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  folder_id uuid,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table doc_folders (           -- waterai_doc_folders_v1
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table calendar_events (       -- waterai_calendar_v1
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table regression_sensors (    -- waterai_regression_sensors_<objectId> (dotąd dług techn.)
  object_id uuid primary key references objects(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ── 5. UDOSTĘPNIANIE (macierz: konto × zasób × podgląd/edycja) ───────────────

create table resource_shares (
  id            uuid primary key default gen_random_uuid(),
  resource_type text not null check (resource_type in ('esco_report','base_period','analysis')),
  resource_id   uuid not null,
  user_id       uuid not null references profiles(id) on delete cascade,
  permission    text not null default 'view' check (permission in ('view','edit')),
  shared_by     uuid not null references profiles(id),
  shared_at     timestamptz not null default now(),
  emailed_at    timestamptz,                        -- ostatnia wysyłka mailem (przyszłość: EspoCRM/Edge Function)
  unique (resource_type, resource_id, user_id)
);
create index on resource_shares (user_id);

create or replace function has_share(rtype text, rid uuid, perm text) returns boolean
language sql stable as $$
  select exists (
    select 1 from resource_shares s
    where s.resource_type = rtype and s.resource_id = rid and s.user_id = auth.uid()
      and (perm = 'view' or s.permission = 'edit')
  )
$$;

-- ── 6. RLS — MACIERZ UPRAWNIEŃ ───────────────────────────────────────────────
-- admin / energyAnalyst : pełny odczyt i zapis
-- backOffice            : pełny odczyt; zapis pomiarów i danych operacyjnych
-- salesRepresentative   : tylko odczyt
-- client                : widzi wyłącznie swojego klienta / swoje obiekty
--                         + zasoby udostępnione przez resource_shares;
--                         dodaje pomiary źródłowe (verified=false) na swoich obiektach

alter table clients             enable row level security;
alter table objects             enable row level security;
alter table profiles            enable row level security;
alter table source_measurements enable row level security;
alter table measurements        enable row level security;
alter table analyses            enable row level security;
alter table esco_reports        enable row level security;
alter table base_periods        enable row level security;
alter table intensity_bases     enable row level security;
alter table invoices            enable row level security;
alter table billing_entities    enable row level security;
alter table documents           enable row level security;
alter table doc_folders         enable row level security;
alter table calendar_events     enable row level security;
alter table regression_sensors  enable row level security;
alter table resource_shares     enable row level security;

-- profiles: każdy widzi siebie; wewnętrzni widzą wszystkich; zarządza admin
create policy p_profiles_self   on profiles for select using (id = auth.uid() or is_internal());
create policy p_profiles_admin  on profiles for all    using (app_role() = 'admin') with check (app_role() = 'admin');

-- clients / objects: wewnętrzni wszystko; klient tylko swoje (odczyt)
create policy p_clients_internal on clients for all    using (is_internal()) with check (is_internal());
create policy p_clients_own      on clients for select using (id = app_client_id());
create policy p_objects_internal on objects for all    using (is_internal()) with check (is_internal());
create policy p_objects_own      on objects for select using (client_id = app_client_id());

-- pomiary źródłowe:
create policy p_srcm_internal_r on source_measurements for select using (is_internal());
create policy p_srcm_internal_w on source_measurements for insert with check (is_internal());
create policy p_srcm_edit       on source_measurements for update using (is_analyst_or_admin() or (app_role()='backOffice' and created_by = auth.uid()));
create policy p_srcm_delete     on source_measurements for delete using (is_analyst_or_admin());
-- klient: widzi pomiary swoich obiektów, dodaje TYLKO na swoich obiektach i TYLKO verified=false
create policy p_srcm_client_r on source_measurements for select
  using (exists (select 1 from objects o where o.id = object_id and o.client_id = app_client_id()));
create policy p_srcm_client_w on source_measurements for insert
  with check (
    app_role() = 'client'
    and verified = false
    and created_by = auth.uid()
    and exists (select 1 from objects o where o.id = object_id and o.client_id = app_client_id())
  );

-- zatwierdzanie pomiarów pilnowane dodatkowo triggerem (żeby klient/backOffice
-- nie mógł UPDATE-em przestawić verified):
create or replace function guard_verify() returns trigger language plpgsql as $$
begin
  if new.verified is distinct from old.verified and not is_analyst_or_admin() then
    raise exception 'Tylko analityk lub admin może zatwierdzać pomiary';
  end if;
  if new.verified and not old.verified then
    new.verified_by := auth.uid(); new.verified_at := now();
  end if;
  return new;
end $$;
create trigger t_srcm_verify before update on source_measurements
  for each row execute function guard_verify();

-- wzorzec dla tabel domenowych: wewnętrzni pełny dostęp (odczyt wszyscy
-- wewnętrzni, zapis analityk/admin/backOffice), klient odczyt swoich danych
-- + zasoby z resource_shares.
create policy p_meas_int_r on measurements for select using (is_internal());
create policy p_meas_int_w on measurements for all using (app_role() in ('admin','energyAnalyst','backOffice')) with check (app_role() in ('admin','energyAnalyst','backOffice'));
create policy p_meas_client on measurements for select
  using (exists (select 1 from objects o where o.id = object_id and o.client_id = app_client_id()));

create policy p_an_int_r on analyses for select using (is_internal());
create policy p_an_int_w on analyses for all using (is_analyst_or_admin()) with check (is_analyst_or_admin());
create policy p_an_client on analyses for select
  using (has_share('analysis', id, 'view')
     or exists (select 1 from objects o where o.id = object_id and o.client_id = app_client_id()));

create policy p_esco_int_r on esco_reports for select using (is_internal());
create policy p_esco_int_w on esco_reports for all using (is_analyst_or_admin()) with check (is_analyst_or_admin());
create policy p_esco_shared on esco_reports for select
  using (has_share('esco_report', id, 'view') or client_id = app_client_id());
create policy p_esco_shared_edit on esco_reports for update
  using (has_share('esco_report', id, 'edit'));

create policy p_bp_int_r on base_periods for select using (is_internal());
create policy p_bp_int_w on base_periods for all using (is_analyst_or_admin()) with check (is_analyst_or_admin());
create policy p_bp_shared on base_periods for select
  using (has_share('base_period', id, 'view')
     or exists (select 1 from objects o where o.id = object_id and o.client_id = app_client_id()));

create policy p_ib_int on intensity_bases for all using (is_internal()) with check (is_analyst_or_admin());
create policy p_inv_int on invoices for all using (is_internal()) with check (app_role() in ('admin','backOffice'));
create policy p_inv_client on invoices for select using (client_id = app_client_id());
create policy p_be_int on billing_entities for all using (is_internal()) with check (app_role() in ('admin','backOffice'));
create policy p_doc_int on documents for all using (is_internal()) with check (is_internal());
create policy p_doc_client on documents for select using (client_id = app_client_id());
create policy p_df_int on doc_folders for all using (is_internal()) with check (is_internal());
create policy p_cal_int on calendar_events for all using (is_internal()) with check (is_internal());
create policy p_rs_int on regression_sensors for all using (is_internal()) with check (is_analyst_or_admin());

-- resource_shares: zarządza analityk/admin; użytkownik widzi swoje udostępnienia
create policy p_shares_mgr  on resource_shares for all    using (is_analyst_or_admin()) with check (is_analyst_or_admin());
create policy p_shares_self on resource_shares for select using (user_id = auth.uid());

-- ── 7. STORAGE ────────────────────────────────────────────────────────────────
-- Utworzyć w panelu Supabase dwa PRYWATNE buckety:
--   measurement-photos  (zdjęcia z zakładki Pomiary; ścieżka: <object_id>/<uuid>.jpg)
--   documents           (pliki z modułu Dokumenty)
-- Polityki Storage (Storage → Policies) lustrzane do tabel:
--   measurement-photos: INSERT dla authenticated (wewnętrzni + klient na swoich
--   obiektach), SELECT jak p_srcm_*; documents: jak p_doc_*.

-- ── 8. updated_at automatycznie ──────────────────────────────────────────────
create or replace function touch_updated_at() returns trigger language plpgsql as
$$ begin new.updated_at := now(); return new; end $$;

do $$ declare t text;
begin
  foreach t in array array['clients','objects','measurements','analyses','esco_reports',
    'base_periods','intensity_bases','invoices','billing_entities','documents',
    'doc_folders','calendar_events','regression_sensors']
  loop
    execute format('create trigger t_touch_%s before update on %I for each row execute function touch_updated_at()', t, t);
  end loop;
end $$;
