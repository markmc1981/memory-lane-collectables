-- Memory Lane Collectables — Phase 9 (brought forward): real checkout.
-- Customers buy a single item outright via Stripe Checkout. Run after 0003.

-- ---------------------------------------------------------------------
-- Per-item delivery. courier_price null => no courier option shown
-- (collection only). Large items: leave courier_price null and set
-- delivery_note to explain.
-- ---------------------------------------------------------------------

alter table stock_items
  add column courier_price numeric(10, 2),
  add column delivery_note text;

-- Expose the two new fields (and a few more) on the public storefront view.
-- Column set changes, so drop + recreate rather than CREATE OR REPLACE.
drop view if exists public_products;
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
  s.courier_price,
  s.delivery_note,
  s.maker,
  s.era,
  s.material,
  s.dimensions,
  s.condition_notes,
  s.subtitle,
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

-- ---------------------------------------------------------------------
-- Orders + payments
-- ---------------------------------------------------------------------

create type order_status as enum (
  'pending_payment', 'paid', 'fulfilled', 'cancelled', 'refunded'
);

create type payment_status as enum (
  'pending', 'succeeded', 'failed', 'refunded'
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,          -- MLO-2026-0001
  stock_item_id uuid not null references stock_items (id),
  customer_name text,
  customer_email text,
  customer_phone text,
  shipping_address jsonb,                     -- from Stripe, when courier
  fulfilment_method fulfilment_method not null,
  item_price numeric(10, 2) not null,
  delivery_price numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  currency text not null default 'GBP',
  status order_status not null default 'pending_payment',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index orders_stock_item_idx on orders (stock_item_id);
create index orders_status_idx on orders (status);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  provider text not null default 'stripe',
  provider_ref text,                          -- payment intent / charge id
  amount numeric(10, 2) not null,
  currency text not null default 'GBP',
  status payment_status not null default 'pending',
  raw jsonb,
  created_at timestamptz not null default now()
);
create index payments_order_idx on payments (order_id);

alter table orders enable row level security;
alter table payments enable row level security;
create policy "staff full access" on orders for all using (is_active_staff());
create policy "staff full access" on payments for all using (is_active_staff());

-- ---------------------------------------------------------------------
-- Public checkout: resolve a product slug to what the checkout needs,
-- without exposing stock_items to the public role.
-- ---------------------------------------------------------------------

create or replace function get_checkout_item(p_slug text)
returns table (
  stock_item_id uuid,
  title text,
  asking_price numeric,
  courier_price numeric,
  currency text,
  is_available boolean
)
language sql
security definer
set search_path = public
as $$
  select
    s.id,
    coalesce(s.title, p.meta_title),
    s.asking_price,
    s.courier_price,
    s.currency,
    (s.status = 'listed')
  from product_pages p
  join stock_items s on s.id = p.stock_item_id
  where p.slug = p_slug;
$$;

revoke all on function get_checkout_item(text) from public;
grant execute on function get_checkout_item(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Record a completed order from the Stripe webhook. security definer so
-- the webhook (running as the anon key) can write orders + mark the item
-- sold. Idempotent on the checkout session id.
-- ---------------------------------------------------------------------

create or replace function record_paid_order(
  p_session_id text,
  p_payment_intent text,
  p_stock_item_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address jsonb,
  p_fulfilment fulfilment_method,
  p_item_price numeric,
  p_delivery_price numeric,
  p_currency text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_year int := extract(year from now());
  v_seq int;
  v_order_number text;
begin
  -- Already processed? Return the existing order.
  select id into v_order_id from orders
    where stripe_checkout_session_id = p_session_id;
  if v_order_id is not null then
    return v_order_id;
  end if;

  select count(*) + 1 into v_seq from orders
    where order_number like 'MLO-' || v_year || '-%';
  v_order_number := 'MLO-' || v_year || '-' || lpad(v_seq::text, 4, '0');

  insert into orders (
    order_number, stock_item_id, customer_name, customer_email,
    customer_phone, shipping_address, fulfilment_method, item_price,
    delivery_price, total, currency, status,
    stripe_checkout_session_id, stripe_payment_intent_id, paid_at
  ) values (
    v_order_number, p_stock_item_id, p_customer_name, p_customer_email,
    p_customer_phone, p_shipping_address, p_fulfilment, p_item_price,
    p_delivery_price, p_item_price + coalesce(p_delivery_price, 0),
    coalesce(p_currency, 'GBP'), 'paid',
    p_session_id, p_payment_intent, now()
  )
  returning id into v_order_id;

  insert into payments (order_id, provider, provider_ref, amount, currency, status)
  values (
    v_order_id, 'stripe', p_payment_intent,
    p_item_price + coalesce(p_delivery_price, 0),
    coalesce(p_currency, 'GBP'), 'succeeded'
  );

  -- Item is now sold — this also removes it from the storefront view.
  update stock_items set status = 'sold' where id = p_stock_item_id;
  update product_pages set sold_at = now() where stock_item_id = p_stock_item_id;

  insert into activity_log (stock_item_id, event_type, event_detail, actor)
  values (p_stock_item_id, 'sold', jsonb_build_object('order_number', v_order_number), 'system');

  return v_order_id;
end;
$$;

revoke all on function record_paid_order(text, text, uuid, text, text, text, jsonb, fulfilment_method, numeric, numeric, text) from public;
grant execute on function record_paid_order(text, text, uuid, text, text, text, jsonb, fulfilment_method, numeric, numeric, text) to anon, authenticated;
