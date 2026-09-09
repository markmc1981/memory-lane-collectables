"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/ui/format";
import { startCheckout, type CheckoutState } from "./actions";

const initial: CheckoutState = { error: null };

export function BuyBox({
  slug,
  price,
  currency,
  courierPrice,
  deliveryNote,
  checkoutEnabled,
}: {
  slug: string;
  price: number | null;
  currency: string;
  courierPrice: number | null;
  deliveryNote: string | null;
  checkoutEnabled: boolean;
}) {
  const [fulfilment, setFulfilment] = useState<"collection" | "courier">(
    "collection"
  );
  const [state, formAction, pending] = useActionState(startCheckout, initial);

  const total =
    price == null
      ? null
      : price + (fulfilment === "courier" ? (courierPrice ?? 0) : 0);

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-2xl text-ink">
          {formatPrice(price, currency)}
        </span>
        {total != null && total !== price && (
          <span className="text-sm text-muted">
            {formatPrice(total, currency)} with delivery
          </span>
        )}
      </div>

      {price == null ? (
        <p className="mt-4 text-sm text-muted">
          This piece is priced on request —{" "}
          <Link
            href={`/product/${slug}/reserve`}
            className="text-accent underline underline-offset-4"
          >
            enquire here
          </Link>
          .
        </p>
      ) : (
        <form action={formAction} className="mt-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="fulfilment" value={fulfilment} />

          <fieldset className="mb-4 space-y-2 text-sm">
            <label className="flex items-center justify-between gap-2 rounded border border-line px-3 py-2 has-[:checked]:border-ink">
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="f"
                  checked={fulfilment === "collection"}
                  onChange={() => setFulfilment("collection")}
                />
                Collection near Airdrie
              </span>
              <span className="text-muted">Free</span>
            </label>

            {courierPrice != null ? (
              <label className="flex items-center justify-between gap-2 rounded border border-line px-3 py-2 has-[:checked]:border-ink">
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="f"
                    checked={fulfilment === "courier"}
                    onChange={() => setFulfilment("courier")}
                  />
                  Courier delivery
                </span>
                <span className="text-muted">
                  {formatPrice(courierPrice, currency)}
                </span>
              </label>
            ) : (
              <p className="rounded border border-dashed border-line px-3 py-2 text-xs text-muted">
                {deliveryNote ??
                  "Larger item — collection only, or contact us to arrange delivery."}
              </p>
            )}
          </fieldset>

          {state.error && (
            <p className="mb-3 text-sm text-critical">{state.error}</p>
          )}

          {checkoutEnabled ? (
            <Button type="submit" size="lg" fullWidth disabled={pending}>
              {pending ? "Taking you to checkout…" : "Buy it now"}
            </Button>
          ) : (
            <Button href={`/product/${slug}/reserve`} size="lg" fullWidth>
              Reserve this item
            </Button>
          )}

          <p className="mt-3 text-center text-xs text-muted">
            Secure payment by card, Apple Pay or Google Pay.{" "}
            <Link
              href={`/product/${slug}/reserve`}
              className="underline underline-offset-2"
            >
              Or ask a question
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
