-- ═══════════════════════════════════════════════════════════════════════════
-- WaterAI Energy Control — migracja 002: zakładka „Pomiary" (readings)
-- Wersja: 002 · 2026-07-05
--
-- Dodaje: tabelę `readings` (wzorzec hybrydowy jsonb, zgodny z WaterAIBridge),
-- polityki RLS oraz bucket Storage `reading-attachments` na załączniki
-- (PDF faktur, zrzuty z aplikacji, zdjęcia liczników).
--
-- Uruchomienie: Supabase → SQL Editor → wklej całość → Run.
-- Wymaga wcześniejszego uruchomienia schema.sql (funkcje is_internal itd.).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. TABELA ────────────────────────────────────────────────────────────────

create table if not exists readings (   -- waterai_readings_v1
  id         uuid primary key default gen_random_uuid(),
  object_id  uuid not null references objects(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists readings_object_idx on readings (object_id);

-- ── 2. RLS ───────────────────────────────────────────────────────────────────
-- Zgodnie z ustaleniem: pomiary mogą WPISYWAĆ wszystkie role wewnętrzne
-- (admin, backOffice, energyAnalyst, salesRepresentative) ORAZ klient
-- na własnych obiektach. Klient edytuje/usuwa tylko wpisy, które sam dodał.

alter table readings enable row level security;

create policy p_rd_int_all on readings for all
  using (is_internal()) with check (is_internal());

create policy p_rd_client_r on readings for select
  using (exists (select 1 from objects o where o.id = readings.object_id and o.client_id = app_client_id()));

create policy p_rd_client_w on readings for insert
  with check (exists (select 1 from objects o where o.id = readings.object_id and o.client_id = app_client_id()));

create policy p_rd_client_u on readings for update
  using (data->>'enteredById' = auth.uid()::text
         and exists (select 1 from objects o where o.id = readings.object_id and o.client_id = app_client_id()));

create policy p_rd_client_d on readings for delete
  using (data->>'enteredById' = auth.uid()::text
         and exists (select 1 from objects o where o.id = readings.object_id and o.client_id = app_client_id()));

-- ── 3. STORAGE — bucket na załączniki pomiarów ───────────────────────────────

insert into storage.buckets (id, name, public)
values ('reading-attachments', 'reading-attachments', false)
on conflict (id) do nothing;

create policy p_rdatt_read on storage.objects for select to authenticated
  using (bucket_id = 'reading-attachments');

create policy p_rdatt_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'reading-attachments');

create policy p_rdatt_delete on storage.objects for delete to authenticated
  using (bucket_id = 'reading-attachments' and public.is_internal());
