import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/ui/format";
import { createClient } from "@/lib/supabase/server";

const tone = {
  pending_payment: "neutral",
  paid: "accent",
  fulfilled: "positive",
  cancelled: "neutral",
  refunded: "critical",
} as const;

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_email, fulfilment_method, total, currency, status, created_at, stock_items(stock_number, title, id)"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-ink">Orders</h1>

      {(orders ?? []).length === 0 ? (
        <EmptyState title="No orders yet">
          When a customer buys an item on the shop, the order appears here and
          the item is marked sold automatically.
        </EmptyState>
      ) : (
        <div className="divide-y divide-line-soft rounded-lg border border-line bg-surface">
          {(orders ?? []).map((o) => {
            const item = o.stock_items as unknown as {
              stock_number: string;
              title: string;
              id: string;
            } | null;
            return (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {o.order_number}
                    <span className="text-muted"> · {item?.title}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {o.customer_name} · {o.customer_email} ·{" "}
                    {o.fulfilment_method} · {item?.stock_number}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">
                    {formatPrice(o.total, o.currency)}
                  </span>
                  <Badge tone={tone[o.status as keyof typeof tone]}>
                    {String(o.status).replace(/_/g, " ")}
                  </Badge>
                  {item?.id && (
                    <Link
                      href={`/admin/inventory/${item.id}`}
                      className="text-xs text-accent underline underline-offset-4"
                    >
                      Item
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
