import { createClient } from "@/lib/supabase/server";

export default async function ReservationsPage() {
  const supabase = await createClient();

  const { data: reservations } = await supabase
    .from("reservations")
    .select(
      "id, customer_name, postcode, fulfilment_method, status, expires_at, stock_items(stock_number)"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">
        Reservations
      </h1>

      <div className="divide-y divide-[var(--line)]">
        {(reservations ?? []).map((r) => (
          <div key={r.id} className="py-3 text-sm flex justify-between">
            <span>
              {r.customer_name} &middot; {r.postcode} &middot;{" "}
              {r.fulfilment_method}
            </span>
            <span className="text-[var(--muted)]">{r.status}</span>
          </div>
        ))}
        {(reservations ?? []).length === 0 && (
          <p className="text-sm text-[var(--muted)] py-3">
            No reservations yet.
          </p>
        )}
      </div>
    </div>
  );
}
