-- ─────────────────────────────────────────────────────────────────────────
-- migration_010_note_translations.sql
-- Pamięć podręczna tłumaczeń maszynowych treści wpisywanych przez analityka
-- (uwagi do protokołu TYM, notatki okresu bazowego).
--
-- Po co tabela, skoro tłumaczy Edge Function: opis metodyki ma po kilka tysięcy
-- znaków i jest oglądany wielokrotnie (analiza + raport ESCO + wydruk, przez
-- wielu odbiorców). Bez cache każde otwarcie widoku = płatne wywołanie API.
-- Klucz = sha256(tekst źródłowy) + język docelowy, więc ten sam opis tłumaczy
-- się raz na język, a poprawka opisu tworzy nowy wpis (stary zostaje nietknięty).
--
-- Idempotentne — można puścić wielokrotnie.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists note_translations (
  hash        text primary key,          -- sha256(source) || ':' || lang
  lang        text        not null,
  source      text        not null,
  translated  text        not null,
  provider    text,                      -- 'deepl' | 'anthropic'
  created_at  timestamptz not null default now()
);

create index if not exists note_translations_lang_idx on note_translations (lang);

alter table note_translations enable row level security;

-- Odczyt: każdy zalogowany. To tłumaczenia tekstów, które użytkownik i tak widzi
-- w oryginale w dokumencie, do którego ma dostęp — nie ma tu danych wrażliwych
-- ponad to, co już przepuszcza RLS na measurements / analyses.
drop policy if exists p_nt_read on note_translations;
create policy p_nt_read on note_translations
  for select using (auth.uid() is not null);

-- Zapis: WYŁĄCZNIE Edge Function przez service_role (omija RLS).
-- Brak polityki insert/update/delete = brak zapisu z przeglądarki.
