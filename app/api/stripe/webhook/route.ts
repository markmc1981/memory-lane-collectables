import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { config } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Stripe calls this after a successful payment. We verify the signature,
 * then record the order + mark the item sold via a security-definer RPC.
 * Idempotent: Stripe retries, and record_paid_order no-ops on a session it
 * has already seen.
 */
export async function POST(req: Request) {
  if (!stripe || !config.stripe.webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      config.stripe.webhookSecret
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Signature check failed: ${err instanceof Error ? err.message : err}` },
      { status: 400 }
    );
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const m = session.metadata ?? {};
  const shipping =
    session.collected_information?.shipping_details ??
    (session as unknown as { shipping_details?: unknown }).shipping_details ??
    null;

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_paid_order", {
    p_session_id: session.id,
    p_payment_intent:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
    p_stock_item_id: m.stock_item_id,
    p_customer_name:
      session.customer_details?.name ?? null,
    p_customer_email: session.customer_details?.email ?? null,
    p_customer_phone: session.customer_details?.phone ?? null,
    p_shipping_address: shipping,
    p_fulfilment: m.fulfilment === "courier" ? "delivery" : "collection",
    p_item_price: Number(m.item_price ?? 0),
    p_delivery_price: Number(m.delivery_price ?? 0),
    p_currency: m.currency ?? "GBP",
  });

  if (error) {
    // 500 so Stripe retries.
    console.error("record_paid_order failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
