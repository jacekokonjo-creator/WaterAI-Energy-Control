-- ═══════════════════════════════════════════════════════════════════════════
-- WaterAI Energy Control — migracja 004: Dokumenty + Kalendarz na wspólną bazę
-- Wersja: 004 · 2026-07-12
--
-- Dodaje: tabele `documents`, `doc_folders`, `calendar_events` (wzorzec
-- hybrydowy jsonb, zgodny z WaterAIBridge) + bucket Storage `document-files`
-- na pliki dokumentów (w rekordzie tylko ścieżka `storagePath`).
--
-- Powód: te moduły żyły dotąd wyłącznie w localStorage (twardy limit ~5 MB,
-- incydent „The quota has been exceeded" 2026-07-12) i nie miały kopii w chmurze.
--
-- Uruchomienie: Supabase → SQL Editor → wklej całość → Run.
-- Wymaga wcześniejszych migracji: schema.sql → 002 → 003.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. TABELE ────────────────────────────────────────────────────────────────

create table if not exists doc_folders (   -- waterai_doc_folders_v1
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references clients(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists doc_folders_client_idx on doc_folders (client_id);

create table if not exists documents (     -- waterai_documents_v1
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  object_id  uuid references objects(id) on delete set null,
  data       jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists documents_client_idx on documents (client_id);
create index if not exists documents_object_idx on documents (object_id);

create table if not exists calendar_events ( -- waterai_calendar_v1
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references clients(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists calendar_client_idx on calendar_events (client_id);

-- ── 2. RLS ───────────────────────────────────────────────────────────────────
-- Zgodnie z dotychczasową praktyką dla dokumentów/kalendarza: pełny dostęp
-- dla ról wewnętrznych (is_internal()). Udostępnianie klientom pojedynczych
-- dokumentów przez resource_shares — do rozbudowy wg roadmapy (osobna migracja).

alter table doc_folders     enable row level security;
alter table documents       enable row level security;
alter table calendar_events enable row level security;

create policy p_docf_int_all on doc_folders for all
  using (is_internal()) with check (is_internal());

create policy p_docs_int_all on documents for all
  using (is_internal()) with check (is_internal());

create policy p_cal_int_all on calendar_events for all
  using (is_internal()) with check (is_internal());

-- ── 3. STORAGE — bucket na pliki dokumentów ──────────────────────────────────

insert into storage.buckets (id, name, public)
values ('document-files', 'document-files', false)
on conflict (id) do nothing;

create policy p_docfile_read on storage.objects for select to authenticated
  using (bucket_id = 'document-files');

create policy p_docfile_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'document-files');

create policy p_docfile_update on storage.objects for update to authenticated
  using (bucket_id = 'document-files');

create policy p_docfile_delete on storage.objects for delete to authenticated
  using (bucket_id = 'document-files');
