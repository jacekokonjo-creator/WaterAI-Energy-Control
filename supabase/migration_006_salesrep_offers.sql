-- ═══════════════════════════════════════════════════════════════════════════
-- WaterAI Energy Control — migracja 006: Sales Representative tworzy OFERTY
-- Wersja: 006 · 2026-07-28
--
-- Powód:
--   `index.html` (roleModules) daje roli salesRepresentative kafelek Symulacji,
--   ale RLS z migracji 003 przepuszcza INSERT do `simulations` wyłącznie dla
--   is_staff() (admin / backOffice / energyAnalyst). Efekt: handlowiec buduje
--   ofertę, mostek dostaje 42501, pokazuje alert „nie udało się zapisać we
--   wspólnej bazie" i rekord zostaje TYLKO w localStorage jego przeglądarki —
--   niewidoczny dla nikogo innego. Czyli funkcja ślepa, wbrew zasadzie
--   nadrzędnej: żadnych niedziałających funkcji dla ról zewnętrznych.
--
-- Zakres:
--   • salesRepresentative: pełne prawa do WŁASNYCH ofert (created_by = auth.uid()).
--   • Cudzych ofert nadal nie widzi — poza tymi udostępnionymi mu w „Widoczności"
--     (istniejąca polityka p_sim_share_r; ta migracja jej nie rusza).
--   • Bez zmian dla admin / backOffice / energyAnalyst.
--   • Raporty ESCO, okresy bazowe, analizy, faktury — NIE ZMIENIANE. Zgodnie
--     z uzgodnionym modelem ról to produkty Energy Analysta; handlowiec ma je
--     widzieć wyłącznie przez udostępnienie.
--
-- UWAGA PROJEKTOWA (nie usuwać — łatwo się na tym przejechać):
--   Polityka SELECT jest tu OBOWIĄZKOWA, nie kosmetyczna. Mostek zapisuje przez
--   `insert(row).select('id').single()` (js/supabase-bridge.js, linia 165).
--   Bez prawa odczytu własnego wiersza INSERT przechodzi, ale `.select()` wraca
--   pusty i `.single()` rzuca błąd — użytkownik zobaczy dokładnie ten sam alert,
--   tylko z inną treścią.
--
--   `created_by` uzupełnia się samo: kolumna ma `default auth.uid()`, a mostek
--   jej nie wysyła. Wartości domyślne liczone są PRZED `with check`, więc
--   warunek przechodzi bez żadnej zmiany w JS.
--
-- Idempotentne: można uruchomić wielokrotnie (drop policy if exists → create).
-- Uruchomienie: Supabase → SQL Editor → wklej całość → Run.
-- Wymaga wcześniej: migration_003_visibility_simulations.sql.
-- Po uruchomieniu: twardy refresh aplikacji (Ctrl+Shift+R).
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists p_sim_sales_i on simulations;
drop policy if exists p_sim_sales_r on simulations;
drop policy if exists p_sim_sales_u on simulations;
drop policy if exists p_sim_sales_d on simulations;

-- INSERT: handlowiec zakłada ofertę zawsze na siebie.
create policy p_sim_sales_i on simulations for insert
  with check (app_role() = 'salesRepresentative' and created_by = auth.uid());

-- SELECT: widzi swoje. (Udostępnione mu — przez p_sim_share_r z migracji 003.)
create policy p_sim_sales_r on simulations for select
  using (app_role() = 'salesRepresentative' and created_by = auth.uid());

-- UPDATE: edytuje swoje i nie może ich „przepisać" na kogoś innego.
create policy p_sim_sales_u on simulations for update
  using      (app_role() = 'salesRepresentative' and created_by = auth.uid())
  with check (app_role() = 'salesRepresentative' and created_by = auth.uid());

-- DELETE: kasuje swoje. Bez tego usunięcie w UI kończy się po cichu (RLS zwraca
-- 0 wierszy, nie błąd), mostek czyści swoją mapę _rowIds, a wiersz zostaje
-- w bazie na zawsze i wraca przy następnym logowaniu.
create policy p_sim_sales_d on simulations for delete
  using (app_role() = 'salesRepresentative' and created_by = auth.uid());

-- ── Weryfikacja (opcjonalnie) ───────────────────────────────────────────────
-- select policyname, cmd from pg_policies
-- where tablename = 'simulations' order by policyname;
