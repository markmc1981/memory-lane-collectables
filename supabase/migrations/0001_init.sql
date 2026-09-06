-- Memory Lane Collectables / C Mac Sales — initial schema (Phase 1)
-- Mirrors claude/database-schema.md in the project docs. Run this once in
-- the Supabase SQL editor (or via `supabase db push` if you're using the CLI).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------

create type staff_role as enum ('owner', 'staff');

create type stock_status as enum (
  'awaiting_intake', 'awaiting_identification', 'awaiting_review',
  'ready_to_list', 'listed', 'reserved', 'sold',
  'donated', 'recycled', 'disposed', 'returned'
);

create type photo_type as enum ('original', 'ai_edited', 'listing');

create type identification_provider as enum ('claude', 'openai', 'gemini', 'manual');
create type identification_status as enum ('suggested', 'confirmed', 'rejected', 'needs_review');

create type price_research_source as enum (
  'ebay_active', 'ebay_sold_manual', 'vinted_manual',
  'auction_house_manual', 'other_manual'
);

create type listing_platform as enum ('c_mac_website', 'ebay', 'etsy', 'vinted', 'facebook_marketplace');
create type listing_status as enum ('draft', 'active', 'ended', 'sold');

create type fulfilment_method as enum ('collection', 'delivery');
create type reservation_status as enum ('pending', 'confirmed', 'expired', 'cancelled');

-- ---------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------

create table staff (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role staff_role not null default 'staff',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table clearance_jobs (
  id uuid primary key default gen_random_uuid(),
  job_number text not null unique,
  customer_address text, -- internal only, never exposed publicly
  town text not null,
  collection_date date not null,
  notes text,
  created_by uuid references staff (id),
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references categories (id)
);

create table stock_items (
  id uuid primary key default gen_random_uuid(),
  stock_number text not null unique,
  job_id uuid not null references clearance_jobs (id),
  status stock_status not null default 'awaiting_intake',
  holder_id uuid references staff (id),
  storage_location text,
  ownership_arrangement text default 'C Mac Sales owned',
  acquisition_cost numeric(10, 2), -- internal only
  minimum_acceptable_price numeric(10, 2), -- internal only
  asking_price numeric(10, 2),
  quick_sale_price numeric(10, 2),
  currency text not null default 'GBP',
  category_id uuid references categories (id),
  confirmed_identification_id uuid, -- fk added after identifications exists
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table item_photos (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null references stock_items (id) on delete cascade,
  type photo_type not null,
  storage_path text not null,
  is_primary boolean not null default false,
  alt_text text,
  taken_by uuid references staff (id),
  created_at timestamptz not null default now()
);

create table identifications (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null references stock_items (id) on delete cascade,
  provider identification_provider not null,
  suggested_brand text,
  suggested_maker text,
  suggested_model text,
  suggested_era text,
  suggested_material text,
  suggested_category_id uuid references categories (id),
  suggested_description text,
  confidence_score numeric(3, 2) check (confidence_score between 0 and 1),
  status identification_status not null default 'suggested',
  raw_response jsonb,
  reviewed_by uuid references staff (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table stock_items
  add constraint stock_items_confirmed_identification_fkey
  foreign key (confirmed_identification_id) references identifications (id);

create table price_research (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null references stock_items (id) on delete cascade,
  source price_research_source not null,
  is_verified_sold boolean not null default false,
  source_url text,
  title text,
  price numeric(10, 2),
  currency text not null default 'GBP',
  condition_noted text,
  date_checked date not null default current_date,
  entered_by uuid references staff (id),
  created_at timestamptz not null default now()
);

create table price_suggestions (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null references stock_items (id) on delete cascade,
  suggested_quick_sale_price numeric(10, 2),
  suggested_asking_price numeric(10, 2),
  estimated_fees jsonb,
  estimated_net_return numeric(10, 2),
  based_on_research_ids uuid[],
  insufficient_data boolean not null default false,
  approved_by uuid references staff (id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

-- The public-facing record for an item. Kept separate from stock_items so
-- the page (and its URL/SEO fields) survives after the item is sold.
create table product_pages (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null unique references stock_items (id) on delete cascade,
  slug text not null unique,
  meta_title text not null,
  meta_description text,
  public_description text not null,
  is_indexable boolean not null default true,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table listings (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null references stock_items (id) on delete cascade,
  platform listing_platform not null,
  external_listing_id text,
  external_url text,
  listing_title text,
  listing_description text,
  status listing_status not null default 'draft',
  published_at timestamptz,
  ended_at timestamptz
);

create table reservations (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null references stock_items (id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  postcode text not null,
  fulfilment_method fulfilment_method not null,
  status reservation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '48 hours'),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  stock_item_id uuid not null references stock_items (id) on delete cascade,
  event_type text not null,
  event_detail jsonb,
  actor text not null, -- staff id as text, or 'system' / 'ai'
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------

create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger stock_items_set_updated_at
  before update on stock_items
  for each row execute function set_updated_at();

create trigger product_pages_set_updated_at
  before update on product_pages
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security — staff get full access via their own login;
-- the public site never talks to these tables directly (see the
-- public_products view below), except reservations (insert-only).
-- ---------------------------------------------------------------------

create function is_active_staff() returns boolean as $$
  select exists (
    select 1 from staff where id = auth.uid() and active
  );
$$ language sql stable security definer;

alter table staff enable row level security;
alter table clearance_jobs enable row level security;
alter table categories enable row level security;
alter table stock_items enable row level security;
alter table item_photos enable row level security;
alter table identifications enable row level security;
alter table price_research enable row level security;
alter table price_suggestions enable row level security;
alter table product_pages enable row level security;
alter table listings enable row level security;
alter table reservations enable row level security;
alter table activity_log enable row level security;

create policy "staff full access" on staff for all using (is_active_staff());
create policy "staff full access" on clearance_jobs for all using (is_active_staff());
create policy "staff full access" on categories for all using (is_active_staff());
create policy "staff full access" on stock_items for all using (is_active_staff());
create policy "staff full access" on item_photos for all using (is_active_staff());
create policy "staff full access" on identifications for all using (is_active_staff());
create policy "staff full access" on price_research for all using (is_active_staff());
create policy "staff full access" on price_suggestions for all using (is_active_staff());
create policy "staff full access" on product_pages for all using (is_active_staff());
create policy "staff full access" on listings for all using (is_active_staff());
create policy "staff full access" on activity_log for all using (is_active_staff());

-- Categories are harmless to read publicly (needed for category pages/nav).
create policy "anyone can read categories" on categories for select using (true);

-- Staff can read/manage all reservations; a customer can only create one —
-- confirming, cancelling or browsing other people's reservations is a
-- staff-only action via the admin app.
create policy "staff full access" on reservations for all using (is_active_staff());
create policy "anyone can create a reservation" on reservations
  for insert
  with check (status = 'pending');

-- ---------------------------------------------------------------------
-- Public storefront view — the ONLY thing the public site is allowed to
-- query. Runs with this migration's privileges (a plain view's default
-- behaviour), so it can safely join the tables above despite their RLS
-- while only ever exposing the columns listed here.
-- ---------------------------------------------------------------------

create view public_products as
select
  p.slug,
  p.meta_title,
  p.meta_description,
  p.public_description,
  p.is_indexable,
  p.sold_at,
  p.updated_at,
  s.asking_price,
  s.currency,
  s.status,
  c.name as category_name,
  c.slug as category_slug,
  (
    select ph.storage_path from item_photos ph
    where ph.stock_item_id = s.id and ph.type = 'listing' and ph.is_primary
    limit 1
  ) as primary_photo_path
from product_pages p
join stock_items s on s.id = p.stock_item_id
left join categories c on c.id = s.category_id
where s.status in ('listed', 'reserved', 'sold');

grant select on public_products to anon, authenticated;
grant select on categories to anon, authenticated;
grant insert on reservations to anon, authenticated;
