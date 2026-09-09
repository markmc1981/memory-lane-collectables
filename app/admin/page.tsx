import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

async function counts() {
  const supabase = await createClient();
  const [candidates, stock, clearances, reservations] = await Promise.all([
    supabase
      .from("candidate_items")
      .select("id", { count: "exact", head: true })
      .eq("status", "detected"),
    supabase.from("stock_items").select("id", { count: "exact", head: true }),
    supabase
      .from("clearance_jobs")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "processing"]),
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);
  return {
    candidates: candidates.count ?? 0,
    stock: stock.count ?? 0,
    clearances: clearances.count ?? 0,
    reservations: reservations.count ?? 0,
  };
}

export default async function Dashboard() {
  const c = await counts();
  const supabase = await createClient();
  const { data: recent } = await supabase
    .from("clearance_jobs")
    .select("id, reference, job_number, town, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const tiles = [
    { label: "Awaiting review", value: c.candidates, href: "/admin/review" },
    { label: "Open clearances", value: c.clearances, href: "/admin/clearances" },
    { label: "Items in stock", value: c.stock, href: "/admin/inventory" },
    {
      label: "Pending reservations",
      value: c.reservations,
      href: "/admin/reservations",
    },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Dashboard</h1>
        <div className="flex gap-2">
          <Button href="/admin/items/new" size="sm">
            + Add an item
          </Button>
          <Button href="/admin/clearances/new" size="sm" variant="secondary">
            New clearance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="rounded-lg border border-line bg-surface p-4 transition-colors hover:border-ink"
          >
            <p className="font-display text-3xl text-ink">{t.value}</p>
            <p className="mt-1 text-xs text-muted">{t.label}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 mb-3 font-display text-lg text-ink">
        Recent clearances
      </h2>
      <div className="divide-y divide-line-soft rounded-lg border border-line bg-surface">
        {(recent ?? []).length === 0 && (
          <p className="px-4 py-6 text-sm text-muted">
            No clearances yet.{" "}
            <Link
              href="/admin/clearances/new"
              className="text-accent underline underline-offset-4"
            >
              Start one
            </Link>
            .
          </p>
        )}
        {(recent ?? []).map((j) => (
          <Link
            key={j.id}
            href={`/admin/clearances/${j.id}`}
            className="flex items-center justify-between px-4 py-3 text-sm hover:bg-surface-sunk"
          >
            <span>
              <span className="font-medium text-ink">
                {j.job_number ?? j.reference}
              </span>
              <span className="text-muted"> · {j.town}</span>
            </span>
            <span className="text-xs text-muted">{j.reference}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
