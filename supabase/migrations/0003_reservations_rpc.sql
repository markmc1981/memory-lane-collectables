-- Memory Lane Collectables — Phase 2/7: let the public storefront create a
-- reservation without exposing internal ids. A SECURITY DEFINER function
-- resolves the product slug to a stock item server-side and inserts the
-- reservation; the public role never touches stock_items directly.
--
-- Run once in the Supabase SQL editor, after 0002.

create or replace function create_reservation(
  p_slug text,
  p_name text,
  p_email text,
  p_phone text,
  p_postcode text,
  p_fulfilment fulfilment_method
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock_item_id uuid;
  v_status stock_status;
  v_reservation_id uuid;
begin
  if coalesce(trim(p_name), '') = ''
     or coalesce(trim(p_email), '') = ''
     or coalesce(trim(p_postcode), '') = '' then
    raise exception 'Name, email and postcode are required.';
  end if;

  select s.id, s.status
    into v_stock_item_id, v_status
  from product_pages p
  join stock_items s on s.id = p.stock_item_id
  where p.slug = p_slug;

  if v_stock_item_id is null then
    raise exception 'That item could not be found.';
  end if;

  if v_status not in ('listed', 'reserved') then
    raise exception 'That item is no longer available to reserve.';
  end if;

  insert into reservations (
    stock_item_id, customer_name, customer_email, customer_phone,
    postcode, fulfilment_method, status
  ) values (
    v_stock_item_id, trim(p_name), trim(p_email), nullif(trim(p_phone), ''),
    trim(p_postcode), p_fulfilment, 'pending'
  )
  returning id into v_reservation_id;

  return v_reservation_id;
end;
$$;

revoke all on function create_reservation(text, text, text, text, text, fulfilment_method) from public;
grant execute on function create_reservation(text, text, text, text, text, fulfilment_method) to anon, authenticated;
