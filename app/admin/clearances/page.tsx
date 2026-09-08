import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";

const statusTone = {
  active: "accent",
  processing: "highlight",
  catalogued: "positive",
  archived: "neutral",
} as const;

export default async function ClearancesPage() {
  const supabase = await createClient();
  const { data: clearances } = await supabase
    .from("clearance_jobs")
    .select("id, reference, job_number, town, collection_date, status")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">Clearances</h1>
        <Button href="/admin/clearances/new" size="sm">
          New clearance
        </Button>
      </div>

      {(clearances ?? []).length === 0 ? (
        <EmptyState
          title="No clearances yet"
          action={
            <Button href="/admin/clearances/new" size="sm">
              Start your first clearance
            </Button>
          }
        >
          A clearance groups everything you recover from one job — photos,
          detected items, and the products they become.
        </EmptyState>
      ) : (
        <div className="divide-y divide-line-soft rounded-lg border border-line bg-surface">
          {(clearances ?? []).map((j) => (
            <Link
              key={j.id}
              href={`/admin/clearances/${j.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-surface-sunk"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">
                  {j.job_number ?? j.reference}
                </p>
                <p className="text-xs text-muted">
                  {j.reference} · {j.town} · {j.collection_date}
                </p>
              </div>
              <Badge tone={statusTone[j.status as keyof typeof statusTone]}>
                {j.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
