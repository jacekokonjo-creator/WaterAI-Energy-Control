-- ═══════════════════════════════════════════════════════════════════════════
-- WaterAI Energy Control — migracja 004: Dokumenty + Kalendarz na wspólną bazę
-- Wersja: 004-r2 · 2026-07-12
--
-- Tabele `documents`, `doc_folders`, `calendar_events` istnieją od schema.sql
-- (założone na zapas) — ta migracja DOPASOWUJE je do mostka WaterAIBridge:
-- dodaje brakujące kolumny (documents.object_id, calendar_events.client_id,
-- created_by wszędzie), indeksy oraz bucket Storage `document-files`.
-- Polityki RLS tabel już istnieją w schema.sql (p_doc_int, p_df_int, p_cal_int)
-- — nie są tu duplikowane. Całość idempotentna (można uruchamiać wielokrotnie).
--
-- Uruchomienie: Supabase → SQL Editor → wklej całość → Run.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. BRAKUJĄCE KOLUMNY ─────────────────────────────────────────────────────

alter table documents
  add column if not exists object_id uuid references objects(id) on delete set null,
  add column if not exists created_by uuid default auth.uid();

alter table doc_folders
  add column if not exists created_by uuid default auth.uid();

alter table calendar_events
  add column if not exists client_id uuid references clients(id) on delete cascade,
  add column if not exists created_by uuid default auth.uid();

-- ── 2. INDEKSY ───────────────────────────────────────────────────────────────

create index if not exists documents_client_idx on documents (client_id);
create index if not exists documents_object_idx on documents (object_id);
create index if not exists doc_folders_client_idx on doc_folders (client_id);
create index if not exists calendar_client_idx on calendar_events (client_id);

-- ── 3. STORAGE — bucket na pliki dokumentów ──────────────────────────────────

insert into storage.buckets (id, name, public)
values ('document-files', 'document-files', false)
on conflict (id) do nothing;

drop policy if exists p_docfile_read   on storage.objects;
drop policy if exists p_docfile_insert on storage.objects;
drop policy if exists p_docfile_update on storage.objects;
drop policy if exists p_docfile_delete on storage.objects;

create policy p_docfile_read on storage.objects for select to authenticated
  using (bucket_id = 'document-files');

create policy p_docfile_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'document-files');

create policy p_docfile_update on storage.objects for update to authenticated
  using (bucket_id = 'document-files');

create policy p_docfile_delete on storage.objects for delete to authenticated
  using (bucket_id = 'document-files');
