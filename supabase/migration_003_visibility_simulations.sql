-- ═══════════════════════════════════════════════════════════════════════════
-- WaterAI Energy Control — migracja 003: Symulacje oszczędności + zakładka
-- „Widoczność" + NOWA MACIERZ RÓL (ustalenia 2026-07-07)
-- Wersja: 003 · 2026-07-07
--
-- Zakres:
--   1. Nowa tabela `simulations` (wzorzec hybrydowy jsonb, WaterAIBridge).
--   2. Kolumna `created_by` na tabelach domenowych (autor rekordu — potrzebna
--      dla reguły „energyAnalyst nie usuwa cudzych").
--   3. `resource_shares` rozszerzone o typy 'invoice' i 'simulation'.
--   4. RLS przepisane wg nowej macierzy ról:
--        admin               — wszystko, widzi wszystko
--        backOffice          — wszystko, widzi wszystko
--        energyAnalyst       — wszystko OPRÓCZ usuwania cudzych rekordów
--                              i zakładania kont (konta i tak pilnuje p_profiles_admin)
--        salesRepresentative — dodaje klientów i obiekty (edytuje tylko własne);
--                              PLIKI (okresy bazowe, analizy, raporty ESCO,
--                              faktury, symulacje) widzi TYLKO udostępnione
--        client              — pliki TYLKO udostępnione; swoje obiekty
--                              i odczyty (readings) bez zmian
--
-- Uwaga: rekordy sprzed migracji mają created_by = NULL — takie usuwa tylko
-- admin/backOffice (autor nieznany, więc bezpieczny domyślny zakaz dla analityka).
--
-- Uruchomienie: Supabase → SQL Editor → wklej całość → Run.
-- Wymaga wcześniejszych: schema.sql, 002_auth.sql, 003_grants.sql,
-- migration_002_readings.sql.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. NOWA TABELA: SYMULACJE OSZCZĘDNOŚCI ───────────────────────────────────
-- Model z arkusza „ZYSK": parametry wejściowe + scenariusze w `data` jsonb,
-- wyniki liczone na żywo we froncie (nie przechowujemy tabeli lat).

create table if not exists simulations (   -- waterai_simulations_v1
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  object_id  uuid references objects(id) on delete set null,
  created_by uuid default auth.uid() references profiles(id),
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists simulations_client_idx on simulations (client_id);
create index if not exists simulations_object_idx on simulations (object_id);

create trigger t_touch_simulations before update on simulations
  for each row execute function touch_updated_at();

alter table simulations enable row level security;

-- ── 2. AUTOR REKORDU (created_by) NA TABELACH DOMENOWYCH ─────────────────────
-- default auth.uid() → mostek (WaterAIBridge) nie wymaga żadnych zmian przy
-- INSERT; istniejące wiersze zostają z NULL (autor nieznany).

alter table measurements    add column if not exists created_by uuid default auth.uid() references profiles(id);
alter table analyses        add column if not exists created_by uuid default auth.uid() references profiles(id);
alter table esco_reports    add column if not exists created_by uuid default auth.uid() references profiles(id);
alter table base_periods    add column if not exists created_by uuid default auth.uid() references profiles(id);
alter table intensity_bases add column if not exists created_by uuid default auth.uid() references profiles(id);
alter table invoices        add column if not exists created_by uuid default auth.uid() references profiles(id);
alter table readings        add column if not exists created_by uuid default auth.uid() references profiles(id);
alter table clients         add column if not exists created_by uuid default auth.uid() references profiles(id);
alter table objects         add column if not exists created_by uuid default auth.uid() references profiles(id);

-- ── 3. RESOURCE_SHARES: nowe typy zasobów ────────────────────────────────────

alter table resource_shares drop constraint if exists resource_shares_resource_type_check;
alter table resource_shares add constraint resource_shares_resource_type_check
  check (resource_type in ('esco_report','base_period','analysis','invoice','simulation','measurement'));

-- ── 4. FUNKCJE POMOCNICZE NOWEJ MACIERZY ─────────────────────────────────────

-- Personel z pełnym wglądem w pliki (salesRep JUŻ NIE — widzi tylko udostępnione).
create or replace function is_staff() returns boolean
language sql stable as
$$ select app_role() in ('admin','backOffice','energyAnalyst') $$;

-- Pełne prawo usuwania (energyAnalyst usuwa wyłącznie własne rekordy).
create or replace function can_delete_any() returns boolean
language sql stable as
$$ select app_role() in ('admin','backOffice') $$;

-- ── 5. RLS — PRZEPISANIE POLITYK ─────────────────────────────────────────────

-- 5a. KLIENCI: staff pełny (delete wg autora); salesRep czyta, dodaje,
--     edytuje własnych; client czyta swojego.
drop policy if exists p_clients_internal on clients;
drop policy if exists p_clients_own      on clients;

create policy p_cli_staff_rw on clients for select using (is_staff());
create policy p_cli_staff_i  on clients for insert with check (is_staff());
create policy p_cli_staff_u  on clients for update using (is_staff()) with check (is_staff());
create policy p_cli_del      on clients for delete
  using (can_delete_any() or (app_role() = 'energyAnalyst' and created_by = auth.uid()));
create policy p_cli_sales_r  on clients for select using (app_role() = 'salesRepresentative');
create policy p_cli_sales_i  on clients for insert with check (app_role() = 'salesRepresentative');
create policy p_cli_sales_u  on clients for update
  using (app_role() = 'salesRepresentative' and created_by = auth.uid())
  with check (app_role() = 'salesRepresentative' and created_by = auth.uid());
create policy p_cli_client_r on clients for select using (id = app_client_id());

-- 5b. OBIEKTY: analogicznie.
drop policy if exists p_objects_internal on objects;
drop policy if exists p_objects_own      on objects;

create policy p_obj_staff_rw on objects for select using (is_staff());
create policy p_obj_staff_i  on objects for insert with check (is_staff());
create policy p_obj_staff_u  on objects for update using (is_staff()) with check (is_staff());
create policy p_obj_del      on objects for delete
  using (can_delete_any() or (app_role() = 'energyAnalyst' and created_by = auth.uid()));
create policy p_obj_sales_r  on objects for select using (app_role() = 'salesRepresentative');
create policy p_obj_sales_i  on objects for insert with check (app_role() = 'salesRepresentative');
create policy p_obj_sales_u  on objects for update
  using (app_role() = 'salesRepresentative' and created_by = auth.uid())
  with check (app_role() = 'salesRepresentative' and created_by = auth.uid());
create policy p_obj_client_r on objects for select using (client_id = app_client_id());

-- 5c. PLIKI — wspólny wzorzec dla: measurements (protokoły TYM / okres bazowy),
--     analyses, esco_reports, base_periods, invoices, simulations:
--       select : staff LUB udostępnione (view)
--       insert : staff
--       update : staff LUB udostępnione (edit)
--       delete : admin/backOffice LUB energyAnalyst na własnych rekordach
--     UWAGA: klient NIE ma już automatycznego wglądu w pliki po client_id —
--     obowiązuje wyłącznie model udostępnieniowy (ustalenie 2026-07-07).

-- measurements (protokoły TYM)
drop policy if exists p_meas_int_r  on measurements;
drop policy if exists p_meas_int_w  on measurements;
drop policy if exists p_meas_client on measurements;
create policy p_meas_staff_r on measurements for select using (is_staff());
create policy p_meas_staff_i on measurements for insert with check (is_staff());
create policy p_meas_staff_u on measurements for update using (is_staff()) with check (is_staff());
create policy p_meas_del     on measurements for delete
  using (can_delete_any() or (app_role() = 'energyAnalyst' and created_by = auth.uid()));
create policy p_meas_share_r on measurements for select using (has_share('measurement', id, 'view'));
create policy p_meas_share_u on measurements for update using (has_share('measurement', id, 'edit'));

-- analyses
drop policy if exists p_an_int_r  on analyses;
drop policy if exists p_an_int_w  on analyses;
drop policy if exists p_an_client on analyses;
create policy p_an_staff_r on analyses for select using (is_staff());
create policy p_an_staff_i on analyses for insert with check (is_staff());
create policy p_an_staff_u on analyses for update using (is_staff()) with check (is_staff());
create policy p_an_del     on analyses for delete
  using (can_delete_any() or (app_role() = 'energyAnalyst' and created_by = auth.uid()));
create policy p_an_share_r on analyses for select using (has_share('analysis', id, 'view'));
create policy p_an_share_u on analyses for update using (has_share('analysis', id, 'edit'));

-- esco_reports
drop policy if exists p_esco_int_r       on esco_reports;
drop policy if exists p_esco_int_w       on esco_reports;
drop policy if exists p_esco_shared      on esco_reports;
drop policy if exists p_esco_shared_edit on esco_reports;
create policy p_esco_staff_r on esco_reports for select using (is_staff());
create policy p_esco_staff_i on esco_reports for insert with check (is_staff());
create policy p_esco_staff_u on esco_reports for update using (is_staff()) with check (is_staff());
create policy p_esco_del     on esco_reports for delete
  using (can_delete_any() or (app_role() = 'energyAnalyst' and created_by = auth.uid()));
create policy p_esco_share_r on esco_reports for select using (has_share('esco_report', id, 'view'));
create policy p_esco_share_u on esco_reports for update using (has_share('esco_report', id, 'edit'));

-- base_periods
drop policy if exists p_bp_int_r  on base_periods;
drop policy if exists p_bp_int_w  on base_periods;
drop policy if exists p_bp_shared on base_periods;
create policy p_bp_staff_r on base_periods for select using (is_staff());
create policy p_bp_staff_i on base_periods for insert with check (is_staff());
create policy p_bp_staff_u on base_periods for update using (is_staff()) with check (is_staff());
create policy p_bp_del     on base_periods for delete
  using (can_delete_any() or (app_role() = 'energyAnalyst' and created_by = auth.uid()));
create policy p_bp_share_r on base_periods for select using (has_share('base_period', id, 'view'));
create policy p_bp_share_u on base_periods for update using (has_share('base_period', id, 'edit'));

-- invoices (dotąd: zapis tylko admin/backOffice — teraz pełny staff, delete wg autora)
drop policy if exists p_inv_int    on invoices;
drop policy if exists p_inv_client on invoices;
create policy p_inv_staff_r on invoices for select using (is_staff());
create policy p_inv_staff_i on invoices for insert with check (is_staff());
create policy p_inv_staff_u on invoices for update using (is_staff()) with check (is_staff());
create policy p_inv_del     on invoices for delete
  using (can_delete_any() or (app_role() = 'energyAnalyst' and created_by = auth.uid()));
create policy p_inv_share_r on invoices for select using (has_share('invoice', id, 'view'));
create policy p_inv_share_u on invoices for update using (has_share('invoice', id, 'edit'));

-- simulations (nowa)
create policy p_sim_staff_r on simulations for select using (is_staff());
create policy p_sim_staff_i on simulations for insert with check (is_staff());
create policy p_sim_staff_u on simulations for update using (is_staff()) with check (is_staff());
create policy p_sim_del     on simulations for delete
  using (can_delete_any() or (app_role() = 'energyAnalyst' and created_by = auth.uid()));
create policy p_sim_share_r on simulations for select using (has_share('simulation', id, 'view'));
create policy p_sim_share_u on simulations for update using (has_share('simulation', id, 'edit'));

-- 5d. intensity_bases / regression_sensors: staff (bez salesRep), delete wg autora.
drop policy if exists p_ib_int on intensity_bases;
create policy p_ib_staff_r on intensity_bases for select using (is_staff());
create policy p_ib_staff_w on intensity_bases for insert with check (is_staff());
create policy p_ib_staff_u on intensity_bases for update using (is_staff()) with check (is_staff());
create policy p_ib_del     on intensity_bases for delete
  using (can_delete_any() or (app_role() = 'energyAnalyst' and created_by = auth.uid()));

drop policy if exists p_rs_int on regression_sensors;
create policy p_rsens_staff on regression_sensors for all using (is_staff()) with check (is_staff());

-- 5e. resource_shares: zarządza admin + backOffice + energyAnalyst (= is_staff);
--     każdy użytkownik widzi wpisy dotyczące jego konta.
drop policy if exists p_shares_mgr  on resource_shares;
drop policy if exists p_shares_self on resource_shares;
create policy p_shares_mgr  on resource_shares for all    using (is_staff()) with check (is_staff());
create policy p_shares_self on resource_shares for select using (user_id = auth.uid());

-- readings (Pomiary) — BEZ ZMIAN: wpisują wszystkie role wewnętrzne + klient
-- na swoich obiektach (decyzja z migracji 002, potwierdzona 2026-07-07:
-- klient nadal automatycznie widzi swoje obiekty i odczyty).

-- ── 6. KONIEC ────────────────────────────────────────────────────────────────
-- Po uruchomieniu: twardy refresh aplikacji (Ctrl+Shift+R).
