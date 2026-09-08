import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { CONFIDENCE_TEXT, confidenceLabel } from "@/lib/ai/types";

const tone = {
  high: "positive",
  likely: "accent",
  possible: "neutral",
  review: "critical",
} as const;

export default async function NeedsReviewPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("candidate_items")
    .select(
      "id, label, confidence, risk_flags, clearance_id, clearance_jobs(reference, job_number)"
    )
    .eq("status", "detected")
    .order("confidence", { ascending: true, nullsFirst: true });

  const grouped = new Map<
    string,
    { ref: string; name: string | null; items: NonNullable<typeof rows> }
  >();
  for (const r of rows ?? []) {
    const j = r.clearance_jobs as unknown as {
      reference: string;
      job_number: string | null;
    } | null;
    const key = r.clearance_id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        ref: j?.reference ?? "",
        name: j?.job_number ?? null,
        items: [],
      });
    }
    grouped.get(key)!.items.push(r);
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-ink">Needs review</h1>
      <p className="mb-6 text-sm text-muted">
        Candidates waiting on a decision, lowest confidence first.
      </p>

      {grouped.size === 0 ? (
        <EmptyState title="Nothing waiting">
          When you run detection on a clearance, the items it finds land here.
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([id, g]) => (
            <div
              key={id}
              className="rounded-lg border border-line bg-surface"
            >
              <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
                <p className="text-sm font-medium text-ink">
                  {g.name ?? g.ref}{" "}
                  <span className="text-muted">· {g.items.length} to review</span>
                </p>
                <Button href={`/admin/clearances/${id}/review`} size="sm">
                  Review
                </Button>
              </div>
              <ul className="divide-y divide-line-soft">
                {g.items.slice(0, 6).map((c) => {
                  const l = c.confidence
                    ? confidenceLabel(c.confidence)
                    : "review";
                  return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm"
                    >
                      <span className="truncate text-ink-soft">{c.label}</span>
                      <Badge tone={tone[l]}>{CONFIDENCE_TEXT[l]}</Badge>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
