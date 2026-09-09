"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe, toMinorUnits } from "@/lib/stripe";
import { config } from "@/lib/config";

export type CheckoutState = { error: string | null };

export async function startCheckout(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const slug = String(formData.get("slug") ?? "");
  const fulfilment =
    String(formData.get("fulfilment") ?? "collection") === "courier"
      ? "courier"
      : "collection";

  if (!stripe) {
    return { error: "Online payment isn't switched on yet — please use the enquiry option." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_checkout_item", {
    p_slug: slug,
  });
  const item = Array.isArray(data) ? data[0] : data;

  if (error || !item) return { error: "That item could not be found." };
  if (!item.is_available) {
    return { error: "Sorry — that item is no longer available." };
  }
  if (item.asking_price == null) {
    return { error: "This item doesn't have a price set — please enquire instead." };
  }

  const deliveryPrice =
    fulfilment === "courier" ? Number(item.courier_price ?? 0) : 0;
  if (fulfilment === "courier" && !item.courier_price) {
    return { error: "Courier delivery isn't available for this item." };
  }

  const currency = (item.currency ?? "GBP").toLowerCase();
  const line_items: {
    price_data: {
      currency: string;
      product_data: { name: string };
      unit_amount: number;
    };
    quantity: number;
  }[] = [
    {
      price_data: {
        currency,
        product_data: { name: item.title },
        unit_amount: toMinorUnits(Number(item.asking_price)),
      },
      quantity: 1,
    },
  ];
  if (deliveryPrice > 0) {
    line_items.push({
      price_data: {
        currency,
        product_data: { name: "Courier delivery" },
        unit_amount: toMinorUnits(deliveryPrice),
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    phone_number_collection: { enabled: true },
    ...(fulfilment === "courier"
      ? { shipping_address_collection: { allowed_countries: ["GB"] } }
      : {}),
    metadata: {
      stock_item_id: item.stock_item_id,
      slug,
      fulfilment,
      item_price: String(item.asking_price),
      delivery_price: String(deliveryPrice),
      currency: item.currency ?? "GBP",
    },
    success_url: `${config.site.url}/product/${slug}/bought?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.site.url}/product/${slug}`,
  });

  if (!session.url) return { error: "Could not start checkout. Please try again." };
  redirect(session.url);
}
