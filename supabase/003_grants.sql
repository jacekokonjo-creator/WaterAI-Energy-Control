-- ═══════════════════════════════════════════════════════════════════════════
-- 003 — Uprawnienia (GRANT) do tabel dla ról aplikacyjnych Supabase.
-- Powód: logowanie zwracało "permission denied for table profiles [42501]" —
-- rola `authenticated` nie miała uprawnień do tabel w schemacie public
-- (domyślne przywileje projektu nie objęły tabel z 001/schema.sql).
-- RLS (schema.sql, sekcja 6) NADAL decyduje, które wiersze kto widzi —
-- GRANT otwiera tylko dostęp do tabeli jako takiej.
-- ═══════════════════════════════════════════════════════════════════════════

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables    in schema public to authenticated;
grant usage, select                 on all sequences in schema public to authenticated;
grant execute                       on all functions in schema public to anon, authenticated;

-- automatycznie dla obiektów tworzonych w przyszłości:
alter default privileges in schema public grant select, insert, update, delete on tables    to authenticated;
alter default privileges in schema public grant usage, select                  on sequences to authenticated;
alter default privileges in schema public grant execute                        on functions to anon, authenticated;
