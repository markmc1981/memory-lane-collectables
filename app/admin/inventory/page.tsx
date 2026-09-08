import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/ui/format";
import { createClient } from "@/lib/supabase/server";

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("stock_items")
    .select(
      "id, stock_number, title, status, asking_price, currency, created_at, product_pages(slug)"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-ink">Inventory</h1>

      {(items ?? []).length === 0 ? (
        <EmptyState title="No stock yet">
          Items appear here once you approve a candidate from a clearance.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line-soft text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">SKU</th>
                <th className="px-4 py-2.5 font-medium">Item</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Price</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {(items ?? []).map((it) => {
                const page = it.product_pages as unknown as {
                  slug: string;
                } | null;
                return (
                  <tr key={it.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                      {it.stock_number}
                    </td>
                    <td className="px-4 py-3 text-ink">{it.title ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral">
                        {String(it.status).replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatPrice(it.asking_price, it.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {page?.slug && (
                        <Link
                          href={`/product/${page.slug}`}
                          className="text-xs text-accent underline underline-offset-4"
                          target="_blank"
                        >
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
