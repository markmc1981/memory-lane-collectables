"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CONFIDENCE_TEXT, RISK_FLAG_TEXT, confidenceLabel } from "@/lib/ai/types";
import type { RiskFlag } from "@/lib/ai/types";
import { bulkReviewCandidates, promoteCandidate } from "../../actions";

export type CandidateView = {
  id: string;
  label: string;
  categoryGuess: string | null;
  confidence: number | null;
  quantity: number;
  riskFlags: RiskFlag[];
  suggestedAskingPrice: number | null;
  status: string;
  photoUrl: string | null;
};

const confidenceTone = {
  high: "positive",
  likely: "accent",
  possible: "neutral",
  review: "critical",
} as const;

export function CandidateReview({
  clearanceId,
  candidates,
}: {
  clearanceId: string;
  candidates: CandidateView[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toReview = candidates.filter((c) => c.status === "detected");
  const done = candidates.filter((c) => c.status !== "detected");

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function runBulk(action: "ignore" | "needs_better_photo") {
    if (selected.size === 0) return;
    startTransition(async () => {
      await bulkReviewCandidates(clearanceId, [...selected], action);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="sticky top-16 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface px-4 py-3 shadow-sm lg:top-4">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex-1" />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => runBulk("needs_better_photo")}
            disabled={pending}
          >
            Needs better photo
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => runBulk("ignore")}
            disabled={pending}
          >
            Ignore selected
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {toReview.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-muted">
          Every candidate has been dealt with.
        </p>
      ) : (
        <ul className="space-y-3">
          {toReview.map((c) => {
            const label = c.confidence
              ? confidenceLabel(c.confidence)
              : "review";
            return (
              <li
                key={c.id}
                className="overflow-hidden rounded-lg border border-line bg-surface"
              >
                <div className="flex gap-3 p-3">
                  <label className="flex shrink-0 items-start pt-1">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggle(c.id)}
                      className="h-4 w-4"
                    />
                  </label>

                  {c.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.photoUrl}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 shrink-0 rounded bg-surface-sunk" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">
                      {c.label}
                      {c.quantity > 1 && (
                        <span className="text-muted"> ×{c.quantity}</span>
                      )}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge tone={confidenceTone[label]}>
                        {CONFIDENCE_TEXT[label]}
                      </Badge>
                      {c.categoryGuess && (
                        <span className="text-xs text-muted">
                          {c.categoryGuess}
                        </span>
                      )}
                      {c.suggestedAskingPrice != null && (
                        <span className="text-xs text-muted">
                          · suggested £{c.suggestedAskingPrice}
                        </span>
                      )}
                    </div>
                    {c.riskFlags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {c.riskFlags.map((f) => (
                          <Badge key={f} tone="highlight">
                            {RISK_FLAG_TEXT[f]}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          setExpanded(expanded === c.id ? null : c.id)
                        }
                      >
                        {expanded === c.id ? "Cancel" : "Approve & list"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          startTransition(async () => {
                            await bulkReviewCandidates(
                              clearanceId,
                              [c.id],
                              "ignore"
                            );
                            router.refresh();
                          })
                        }
                        disabled={pending}
                      >
                        Ignore
                      </Button>
                    </div>
                  </div>
                </div>

                {expanded === c.id && (
                  <form
                    action={promoteCandidate}
                    className="grid gap-3 border-t border-line-soft bg-surface-sunk/40 p-4"
                  >
                    <input type="hidden" name="candidate_id" value={c.id} />
                    <input
                      type="hidden"
                      name="clearance_id"
                      value={clearanceId}
                    />
                    <label className="block text-sm">
                      <span className="mb-1 block text-muted">
                        Product title
                      </span>
                      <input
                        name="title"
                        required
                        defaultValue={c.label}
                        className="h-10 w-full rounded border border-line bg-surface px-3 outline-none focus:border-ink"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-muted">
                        Asking price (£)
                      </span>
                      <input
                        name="asking_price"
                        inputMode="decimal"
                        defaultValue={c.suggestedAskingPrice ?? ""}
                        className="h-10 w-full rounded border border-line bg-surface px-3 outline-none focus:border-ink"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-muted">
                        Description (optional for now)
                      </span>
                      <textarea
                        name="description"
                        rows={3}
                        className="w-full rounded border border-line bg-surface px-3 py-2 outline-none focus:border-ink"
                      />
                    </label>
                    <Button type="submit" size="md" className="self-start">
                      Create product &amp; publish
                    </Button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {done.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-muted">
            {done.length} already handled
          </summary>
          <ul className="mt-3 space-y-1.5">
            {done.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded border border-line-soft bg-surface px-3 py-2 text-sm"
              >
                <span className="text-ink-soft">{c.label}</span>
                <Badge tone="neutral">{c.status.replace(/_/g, " ")}</Badge>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
