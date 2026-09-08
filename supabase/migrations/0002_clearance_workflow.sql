-- Memory Lane Collectables — Phase 2: the clearance -> candidate -> product
-- workflow. Run once in the Supabase SQL editor, after 0001.
--
-- Adds: clearance references + status, brands, AI job/result audit trail,
-- clearance media + extracted frames, candidate items (the "possible object"
-- an AI detects, before a human approves it), candidate photos, and the
-- product attribute columns a promoted candidate fills in. Plus the three
-- storage buckets and their policies.

-- ---------------------------------------------------------------------
-- Clearances: a stable reference (CLR-2026-0001) + a lifecycle status.
-- The old free-text `job_number` becomes an optional external/legacy ref.
-- ---------------------------------------------------------------------

create type clearance_status as enum (
  'active',      -- being worked / items still coming in
  'processing',  -- capture done, items being identified & reviewed
  'catalogued',  -- every candidate resolved
  'archived'
);

alter table clearance_jobs
  add column reference text unique,
  add column status clearance_status not null default 'active';

alter table clearance_jobs alter column job_number drop not null;

-- ---------------------------------------------------------------------
-- Brands — a light lookup, helps search and reporting later.
-- ---------------------------------------------------------------------

create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- AI audit trail — every AI call is a job with an immutable result, so we
-- can always answer "which AI decision produced this value?".
-- ---------------------------------------------------------------------

create type ai_job_type as enum (
  'detect', 'identify', 'research', 'write_listing', 'enhance_image'
);
create type ai_job_status as enum ('queued', 'running', 'succeeded', 'failed');

create table ai_jobs (
  id uuid primary key default gen_random_uuid(),
  type ai_job_type not null,
  subject_type text not null,            -- 'clearance' | 'candidate_item' | 'stock_item'
  subject_id uuid not null,
  provider text not null,                -- 'claude' | 'openai' | 'gemini' | 'mock'
  model text,
  status ai_job_status not null default 'queued',
  cost_pence integer,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create index ai_jobs_subject_idx on ai_jobs (subject_type, subject_id);
create index ai_jobs_status_idx on ai_jobs (status);

create table ai_results (
  id uuid primary key default gen_random_uuid(),
  ai_job_id uuid not null references ai_jobs (id) on delete cascade,
  prompt_version text,
  confidence numeric(3, 2) check (confidence between 0 and 1),
  raw jsonb not null,
  evidence jsonb,                        -- photo/frame/mark ids that fed it
  created_at timestamptz not null default now()
);
create index ai_results_job_idx on ai_results (ai_job_id);

-- ---------------------------------------------------------------------
-- Clearance media: the raw uploads (photos now, video walkthroughs in
-- Phase 6) and, for video, the frames pulled out of them.
-- ---------------------------------------------------------------------

create type media_kind as enum ('photo', 'video');
create type media_processing_status as enum (
  'uploaded', 'processing', 'processed', 'failed'
);

create table clearance_media (
  id uuid primary key default gen_random_uuid(),
  clearance_id uuid not null references clearance_jobs (id) on delete cascade,
  kind media_kind not null,
  storage_path text not null,           -- path in the clearance-media bucket
  original_filename text,
  duration_seconds numeric(8, 2),
  processing_status media_processing_status not null default 'uploaded',
  uploaded_by uuid references staff (id),
  created_at timestamptz not null default now()
);
create index clearance_media_clearance_idx on clearance_media (clearance_id);

create table media_frames (
  id uuid primary key default gen_random_uuid(),
  clearance_media_id uuid not null references clearance_media (id) on delete cascade,
  storage_path text not null,
  timestamp_ms integer,
  sharpness_score numeric(6, 3),
  is_selected boolean not null default true,
  created_at timestamptz not null default now()
);
create index media_frames_media_idx on media_frames (clearance_media_id);

-- ---------------------------------------------------------------------
-- Candidate items — a POSSIBLE saleable object the AI spotted. Never a
-- live product. A human approves/edits/merges/ignores each one; approving
-- promotes it to a stock_item (which mints the SKU).
-- ---------------------------------------------------------------------

create type candidate_status as enum (
  'detected', 'merged', 'promoted', 'ignored', 'needs_better_photo'
);

create table candidate_items (
  id uuid primary key default gen_random_uuid(),
  clearance_id uuid not null references clearance_jobs (id) on delete cascade,
  source_media_id uuid references clearance_media (id) on delete set null,
  source_frame_id uuid references media_frames (id) on delete set null,
  bounding_box jsonb,                    -- {x,y,w,h} normalised 0..1, or null
  label text not null,                   -- AI's short description
  category_guess text,
  confidence numeric(3, 2) check (confidence between 0 and 1),
  quantity integer not null default 1,   -- grouped sets ("6 dining chairs")
  risk_flags jsonb not null default '[]'::jsonb,
  suggested_asking_price numeric(10, 2),
  status candidate_status not null default 'detected',
  merged_into_id uuid references candidate_items (id) on delete set null,
  promoted_stock_item_id uuid references stock_items (id) on delete set null,
  notes text,
  reviewed_by uuid references staff (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index candidate_items_clearance_idx on candidate_items (clearance_id);
create index candidate_items_status_idx on candidate_items (status);

create trigger candidate_items_set_updated_at
  before update on candidate_items
  for each row execute function set_updated_at();

create table candidate_photos (
  id uuid primary key default gen_random_uuid(),
  candidate_item_id uuid not null references candidate_items (id) on delete cascade,
  storage_path text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index candidate_photos_candidate_idx on candidate_photos (candidate_item_id);

-- ---------------------------------------------------------------------
-- stock_items: the attribute columns a real product carries. Kept as
-- real columns (not one JSON blob) because we filter/sort/report on them.
-- ---------------------------------------------------------------------

alter table stock_items
  add column title text,
  add column subtitle text,
  add column brand_id uuid references brands (id),
  add column maker text,
  add column model text,
  add column era text,
  add column material text,
  add column colour text,
  add column style text,
  add column dimensions jsonb,
  add column condition_grade text,
  add column condition_notes text,
  add column risk_flags jsonb not null default '[]'::jsonb,
  add column promoted_from_candidate_id uuid references candidate_items (id);

-- ---------------------------------------------------------------------
-- Row Level Security — every new table is staff-only, same as 0001.
-- ---------------------------------------------------------------------

alter table brands enable row level security;
alter table ai_jobs enable row level security;
alter table ai_results enable row level security;
alter table clearance_media enable row level security;
alter table media_frames enable row level security;
alter table candidate_items enable row level security;
alter table candidate_photos enable row level security;

create policy "staff full access" on brands for all using (is_active_staff());
create policy "staff full access" on ai_jobs for all using (is_active_staff());
create policy "staff full access" on ai_results for all using (is_active_staff());
create policy "staff full access" on clearance_media for all using (is_active_staff());
create policy "staff full access" on media_frames for all using (is_active_staff());
create policy "staff full access" on candidate_items for all using (is_active_staff());
create policy "staff full access" on candidate_photos for all using (is_active_staff());

-- ---------------------------------------------------------------------
-- Storage buckets. Two private (raw captures, per-item originals) and one
-- public (processed images the storefront shows).
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('clearance-media', 'clearance-media', false),
  ('item-photos', 'item-photos', false),
  ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "staff manage clearance-media" on storage.objects
  for all
  using (bucket_id = 'clearance-media' and is_active_staff())
  with check (bucket_id = 'clearance-media' and is_active_staff());

create policy "staff manage item-photos" on storage.objects
  for all
  using (bucket_id = 'item-photos' and is_active_staff())
  with check (bucket_id = 'item-photos' and is_active_staff());

create policy "staff manage listing-images" on storage.objects
  for all
  using (bucket_id = 'listing-images' and is_active_staff())
  with check (bucket_id = 'listing-images' and is_active_staff());

create policy "public read listing-images" on storage.objects
  for select
  using (bucket_id = 'listing-images');
