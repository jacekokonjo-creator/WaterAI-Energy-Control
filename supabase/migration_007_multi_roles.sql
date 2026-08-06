-- ═══════════════════════════════════════════════════════════════════════════
-- WaterAI Energy Control — migracja 007: WIELE RÓL NA UŻYTKOWNIKA
-- Wersja: 007 · 2026-08-06
--
-- Zakres:
--   • profiles.roles text[] — użytkownik może mieć kilka ról jednocześnie.
--   • profiles.role zostaje jako roracyjna „rola główna" = roles[1]
--     (zgodność wstecz: stary kod czytający `role` dalej działa).
--   • Uprawnienia = SUMA uprawnień wszystkich ról (OR).
--   • Wszystkie polityki porównujące app_role() = '...' przeniesione na
--     has_role() / has_any_role() — bez tego wielorolowość NIE działa.
--   • 'client' jest wyłączna: nie łączy się z rolami wewnętrznymi.
--
-- Idempotentne. Uruchomienie: Supabase → SQL Editor → wklej całość → Run.
-- Wymaga: schema.sql, migration_003, migration_005, migration_006.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. KOLUMNA ────────────────────────────────────────────────────────────
alter table profiles add column if not exists roles text[];

update profiles
   set roles = array[coalesce(role, 'client')]
 where roles is null or coalesce(array_length(roles, 1), 0) = 0;

alter table profiles alter column roles set not null;
alter table profiles alter column roles set default array['client'];

-- ── 2. OGRANICZENIA ───────────────────────────────────────────────────────
alter table profiles drop constraint if exists chk_roles_allowed;
alter table profiles add  constraint chk_roles_allowed
  check ( roles <@ array['admin','backOffice','energyAnalyst','salesRepresentative','client'] );

alter table profiles drop constraint if exists chk_roles_nonempty;
alter table profiles add  constraint chk_roles_nonempty
  check ( coalesce(array_length(roles, 1), 0) >= 1 );

-- 'client' jest rolą OGRANICZAJĄCĄ (widzi wyłącznie własnego klienta przez
-- client_id). Suma uprawnień z rolą wewnętrzną zniosłaby tę izolację, więc
-- kombinacja jest zabroniona na poziomie bazy.
alter table profiles drop constraint if exists chk_roles_client_exclusive;
alter table profiles add  constraint chk_roles_client_exclusive
  check ( not ('client' = any(roles) and coalesce(array_length(roles, 1), 0) > 1) );

-- client_id ma sens tylko dla konta klienta.
alter table profiles drop constraint if exists chk_client_id_only_for_client;
alter table profiles add  constraint chk_client_id_only_for_client
  check ( client_id is null or 'client' = any(roles) );

-- ── 3. SYNCHRONIZACJA role <-> roles ──────────────────────────────────────
-- Stary kod pisze `role`, nowy pisze `roles`. Trigger utrzymuje spójność
-- w obie strony, żeby nie dało się doprowadzić do rozjazdu.
create or replace function sync_profile_roles() returns trigger
language plpgsql as $fn$
begin
  if tg_op = 'UPDATE'
     and new.role is distinct from old.role
     and new.roles is not distinct from old.roles then
    -- legacy: zapisano samo `role` → awansuj je na rolę główną
    new.roles := array[new.role] || array_remove(new.roles, new.role);
  elsif new.roles is null or coalesce(array_length(new.roles, 1), 0) = 0 then
    new.roles := array[coalesce(new.role, 'client')];
  end if;

  -- deduplikacja z zachowaniem kolejności
  select array_agg(r order by ord) into new.roles
    from (select distinct on (r) r, ord
            from unnest(new.roles) with ordinality as t(r, ord)
           order by r, ord) s;

  new.role := new.roles[1];
  return new;
end $fn$;

drop trigger if exists trg_sync_profile_roles on profiles;
create trigger trg_sync_profile_roles before insert or update on profiles
  for each row execute function sync_profile_roles();

-- ── 4. FUNKCJE POMOCNICZE ─────────────────────────────────────────────────
create or replace function app_roles() returns text[]
language sql stable security definer set search_path = public as
$$ select coalesce(roles, array[]::text[]) from profiles where id = auth.uid() $$;

create or replace function has_role(r text) returns boolean
language sql stable as
$$ select r = any(app_roles()) $$;

create or replace function has_any_role(rs text[]) returns boolean
language sql stable as
$$ select app_roles() && rs $$;

-- app_role() zostaje (rola główna) wyłącznie dla zgodności wstecz.
-- NIE używać go w nowych politykach — patrz nagłówek.
create or replace function app_role() returns text
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

create or replace function is_internal() returns boolean
language sql stable as
$$ select has_any_role(array['admin','backOffice','energyAnalyst','salesRepresentative']) $$;

create or replace function is_analyst_or_admin() returns boolean
language sql stable as
$$ select has_any_role(array['admin','energyAnalyst']) $$;

create or replace function is_staff() returns boolean
language sql stable as
$$ select has_any_role(array['admin','backOffice','energyAnalyst']) $$;

create or replace function can_delete_any() returns boolean
language sql stable as
$$ select has_any_role(array['admin','backOffice']) $$;

-- ── 5. BLOKADA ESKALACJI (przebudowa migracji 005) ────────────────────────
-- KRYTYCZNE: stara wersja pilnowała kolumny `role`. Gdyby została, Back Office
-- mógłby wpisać 'admin' do `roles` z pominięciem strażnika.
drop policy if exists p_profiles_bo_i on profiles;
create policy p_profiles_bo_i on profiles
  for insert
  with check ( has_role('backOffice') and not ('admin' = any(coalesce(roles, array['client']))) );

drop policy if exists p_profiles_bo_u on profiles;
create policy p_profiles_bo_u on profiles
  for update
  using      ( has_role('backOffice') and not ('admin' = any(coalesce(roles, array['client']))) )
  with check ( has_role('backOffice') and not ('admin' = any(coalesce(roles, array['client']))) );

drop policy if exists p_profiles_bo_d on profiles;
create policy p_profiles_bo_d on profiles
  for delete
  using ( has_role('backOffice') and not ('admin' = any(coalesce(roles, array['client']))) );

-- ── 6. PRZEBUDOWA POLITYK Z app_role() = '...' ────────────────────────────
-- Wygenerowane automatycznie ze schema.sql / migration_003 / migration_006.

drop policy if exists p_profiles_admin on profiles;
create policy p_profiles_admin  on profiles for all    using (has_role('admin')) with check (has_role('admin'));

drop policy if exists p_srcm_edit on source_measurements;
create policy p_srcm_edit       on source_measurements for update using (is_analyst_or_admin() or (has_role('backOffice') and created_by = auth.uid()));

drop policy if exists p_srcm_client_w on source_measurements;
create policy p_srcm_client_w on source_measurements for insert
  with check (
    has_role('client')
    and verified = false
    and created_by = auth.uid()
    and exists (select 1 from objects o where o.id = object_id and o.client_id = app_client_id())
  );

drop policy if exists p_meas_int_w on measurements;
create policy p_meas_int_w on measurements for all using (has_any_role(array['admin','energyAnalyst','backOffice'])) with check (has_any_role(array['admin','energyAnalyst','backOffice']));

drop policy if exists p_inv_int on invoices;
create policy p_inv_int on invoices for all using (is_internal()) with check (has_any_role(array['admin','backOffice']));

drop policy if exists p_be_int on billing_entities;
create policy p_be_int on billing_entities for all using (is_internal()) with check (has_any_role(array['admin','backOffice']));

drop policy if exists p_cli_del on clients;
create policy p_cli_del      on clients for delete
  using (can_delete_any() or (has_role('energyAnalyst') and created_by = auth.uid()));

drop policy if exists p_cli_sales_r on clients;
create policy p_cli_sales_r  on clients for select using (has_role('salesRepresentative'));

drop policy if exists p_cli_sales_i on clients;
create policy p_cli_sales_i  on clients for insert with check (has_role('salesRepresentative'));

drop policy if exists p_cli_sales_u on clients;
create policy p_cli_sales_u  on clients for update
  using (has_role('salesRepresentative') and created_by = auth.uid())
  with check (has_role('salesRepresentative') and created_by = auth.uid());

drop policy if exists p_obj_del on objects;
create policy p_obj_del      on objects for delete
  using (can_delete_any() or (has_role('energyAnalyst') and created_by = auth.uid()));

drop policy if exists p_obj_sales_r on objects;
create policy p_obj_sales_r  on objects for select using (has_role('salesRepresentative'));

drop policy if exists p_obj_sales_i on objects;
create policy p_obj_sales_i  on objects for insert with check (has_role('salesRepresentative'));

drop policy if exists p_obj_sales_u on objects;
create policy p_obj_sales_u  on objects for update
  using (has_role('salesRepresentative') and created_by = auth.uid())
  with check (has_role('salesRepresentative') and created_by = auth.uid());

drop policy if exists p_meas_del on measurements;
create policy p_meas_del     on measurements for delete
  using (can_delete_any() or (has_role('energyAnalyst') and created_by = auth.uid()));

drop policy if exists p_an_del on analyses;
create policy p_an_del     on analyses for delete
  using (can_delete_any() or (has_role('energyAnalyst') and created_by = auth.uid()));

drop policy if exists p_esco_del on esco_reports;
create policy p_esco_del     on esco_reports for delete
  using (can_delete_any() or (has_role('energyAnalyst') and created_by = auth.uid()));

drop policy if exists p_bp_del on base_periods;
create policy p_bp_del     on base_periods for delete
  using (can_delete_any() or (has_role('energyAnalyst') and created_by = auth.uid()));

drop policy if exists p_inv_del on invoices;
create policy p_inv_del     on invoices for delete
  using (can_delete_any() or (has_role('energyAnalyst') and created_by = auth.uid()));

drop policy if exists p_sim_del on simulations;
create policy p_sim_del     on simulations for delete
  using (can_delete_any() or (has_role('energyAnalyst') and created_by = auth.uid()));

drop policy if exists p_ib_del on intensity_bases;
create policy p_ib_del     on intensity_bases for delete
  using (can_delete_any() or (has_role('energyAnalyst') and created_by = auth.uid()));

drop policy if exists p_sim_sales_i on simulations;
create policy p_sim_sales_i on simulations for insert
  with check (has_role('salesRepresentative') and created_by = auth.uid());

drop policy if exists p_sim_sales_r on simulations;
create policy p_sim_sales_r on simulations for select
  using (has_role('salesRepresentative') and created_by = auth.uid());

drop policy if exists p_sim_sales_u on simulations;
create policy p_sim_sales_u on simulations for update
  using      (has_role('salesRepresentative') and created_by = auth.uid())
  with check (has_role('salesRepresentative') and created_by = auth.uid());

drop policy if exists p_sim_sales_d on simulations;
create policy p_sim_sales_d on simulations for delete
  using (has_role('salesRepresentative') and created_by = auth.uid());


-- ── 7. WERYFIKACJA ────────────────────────────────────────────────────────
-- a) nikt nie został bez roli / z rozjechanym role vs roles:
--    select id, role, roles from profiles where role is distinct from roles[1];
-- b) żadna polityka nie używa już app_role():
--    select policyname, tablename from pg_policies
--     where schemaname='public' and (qual like '%app_role()%' or with_check like '%app_role()%');
--    -- oczekiwany wynik: 0 wierszy
-- c) macierz kont:
--    select u.email, p.roles from profiles p join auth.users u on u.id = p.id order by u.email;
