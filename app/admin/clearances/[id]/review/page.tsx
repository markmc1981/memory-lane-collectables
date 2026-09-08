import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CandidateReview, type CandidateView } from "./candidate-review";
import type { RiskFlag } from "@/lib/ai/types";

type Props = { params: Promise<{ id: string }> };

export default async function ReviewPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: clearance } = await supabase
    .from("clearance_jobs")
    .select("id, reference, job_number")
    .eq("id", id)
    .maybeSingle();
  if (!clearance) notFound();

  const { data: rows } = await supabase
    .from("candidate_items")
    .select(
      "id, label, category_guess, confidence, quantity, risk_flags, suggested_asking_price, status, source_media_id"
    )
    .eq("clearance_id", id)
    .order("confidence", { ascending: false, nullsFirst: false });

  // One signed URL per distinct source photo.
  const mediaIds = [
    ...new Set((rows ?? []).map((r) => r.source_media_id).filter(Boolean)),
  ] as string[];

  const { data: mediaRows } = mediaIds.length
    ? await supabase
        .from("clearance_media")
        .select("id, storage_path")
        .in("id", mediaIds)
    : { data: [] };

  const urlByMedia = new Map<string, string | null>();
  await Promise.all(
    (mediaRows ?? []).map(async (m) => {
      const { data } = await supabase.storage
        .from("clearance-media")
        .createSignedUrl(m.storage_path, 3600);
      urlByMedia.set(m.id, data?.signedUrl ?? null);
    })
  );

  const candidates: CandidateView[] = (rows ?? []).map((r) => ({
    id: r.id,
    label: r.label,
    categoryGuess: r.category_guess,
    confidence: r.confidence,
    quantity: r.quantity,
    riskFlags: (r.risk_flags ?? []) as RiskFlag[],
    suggestedAskingPrice: r.suggested_asking_price,
    status: r.status,
    photoUrl: r.source_media_id
      ? (urlByMedia.get(r.source_media_id) ?? null)
      : null,
  }));

  const toReview = candidates.filter((c) => c.status === "detected").length;

  return (
    <div>
      <Link
        href={`/admin/clearances/${id}`}
        className="text-sm text-muted hover:text-ink"
      >
        &larr; {clearance.job_number ?? clearance.reference}
      </Link>
      <h1 className="mt-3 font-display text-2xl text-ink">Review candidates</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        {toReview} awaiting a decision. Approve creates a product and lists it on
        the Memory Lane site; nothing is published without you.
      </p>

      {candidates.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-muted">
          No candidates yet — run detection on the clearance first.
        </p>
      ) : (
        <CandidateReview clearanceId={id} candidates={candidates} />
      )}
    </div>
  );
}
