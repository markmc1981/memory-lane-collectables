"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createReservation, type ReserveState } from "./actions";

const initial: ReserveState = { error: null };

function Field({
  label,
  name,
  type = "text",
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-muted">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="h-10 w-full rounded border border-line bg-surface px-3 outline-none focus:border-ink"
      />
    </label>
  );
}

export function ReserveForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState(
    createReservation,
    initial
  );

  return (
    <form action={formAction} className="mt-8 grid max-w-lg gap-4">
      <input type="hidden" name="slug" value={slug} />
      <Field label="Your name" name="name" />
      <Field label="Email" name="email" type="email" />
      <Field label="Phone (optional)" name="phone" type="tel" required={false} />
      <Field label="Postcode" name="postcode" />
      <fieldset className="text-sm">
        <legend className="mb-1.5 text-muted">Collection or delivery?</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="fulfilment"
              value="collection"
              defaultChecked
            />
            Collection
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="fulfilment" value="delivery" />
            Delivery
          </label>
        </div>
      </fieldset>

      {state.error && (
        <p className="text-sm text-critical">{state.error}</p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Reserve this item"}
      </Button>
      <p className="text-xs text-muted">
        We&rsquo;ll email you within a day to confirm collection or delivery and
        arrange payment. No payment is taken now.
      </p>
    </form>
  );
}
