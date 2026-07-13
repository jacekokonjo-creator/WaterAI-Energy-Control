-- ═══════════════════════════════════════════════════════════════════════════
-- WaterAI Energy Control — migracja 005: Back Office zakłada/zarządza kontami
-- Wersja: 005 · 2026-07-13
--
-- Zakres:
--   • Back Office (rola 'backOffice') może TWORZYĆ, EDYTOWAĆ i BLOKOWAĆ konta
--     użytkowników — z WYJĄTKIEM kont z rolą 'admin'.
--   • Back Office NIE może utworzyć konta admina ani podnieść cudzej roli do
--     'admin' (blokada eskalacji uprawnień). Kontami admina zarządza wyłącznie
--     administrator (istniejąca polityka p_profiles_admin — bez zmian).
--   • Odczyt listy kont Back Office ma już przez p_profiles_self / is_internal().
--
-- Uwaga o Auth: samo konto logowania powstaje przez signUp (Supabase Auth) po
--   stronie aplikacji; te polityki dotyczą wyłącznie tabeli `profiles` (profil
--   bez którego konto i tak nie zaloguje się do aplikacji).
--
-- KLIENT + FAKTURY: NIE wymaga zmian SQL. Widoczność faktur dla klienta jest już
--   egzekwowana przez p_inv_share_r on invoices (has_share('invoice', id,'view'))
--   z migracji 003 — klient widzi faktury udostępnione mu w „Widoczności".
--
-- Idempotentne: można uruchomić wielokrotnie (drop policy if exists → create).
-- Uruchomienie: Supabase → SQL Editor → wklej całość → Run.
-- Wymaga wcześniej: schema.sql (profiles, app_role(), is_internal()).
-- ═══════════════════════════════════════════════════════════════════════════

alter table profiles enable row level security;

-- INSERT: Back Office zakłada konta z dowolną rolą OPRÓCZ 'admin'.
drop policy if exists p_profiles_bo_i on profiles;
create policy p_profiles_bo_i on profiles
  for insert
  with check ( app_role() = 'backOffice' and coalesce(role, 'client') <> 'admin' );

-- UPDATE: Back Office edytuje konta nie-admin i NIE może podnieść roli do 'admin'.
--   using      → rekord przed zmianą nie może być adminem
--   with check → rekord po zmianie nie może być adminem
drop policy if exists p_profiles_bo_u on profiles;
create policy p_profiles_bo_u on profiles
  for update
  using      ( app_role() = 'backOffice' and coalesce(role, 'client') <> 'admin' )
  with check ( app_role() = 'backOffice' and coalesce(role, 'client') <> 'admin' );

-- DELETE: Back Office blokuje (usuwa profil) konta nie-admin.
drop policy if exists p_profiles_bo_d on profiles;
create policy p_profiles_bo_d on profiles
  for delete
  using ( app_role() = 'backOffice' and coalesce(role, 'client') <> 'admin' );

-- Weryfikacja (opcjonalnie): lista polityk na profiles
-- select policyname, cmd from pg_policies where tablename = 'profiles' order by policyname;
