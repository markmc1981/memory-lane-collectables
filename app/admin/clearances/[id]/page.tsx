import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { PhotoUpload } from "./photo-upload";
import { ClearancePhotos } from "./clearance-photos";
import { runDetection } from "../actions";

type Props = { params: Promise<{ id: string }> };

export default async function ClearancePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: clearance } = await supabase
    .from("clearance_jobs")
    .select("id, reference, job_number, town, collection_date, status")
    .eq("id", id)
    .maybeSingle();
  if (!clearance) notFound();

  const { data: media } = await supabase
    .from("clearance_media")
    .select("id, storage_path, original_filename, processing_status")
    .eq("clearance_id", id)
    .order("created_at", { ascending: true });

  const photos = await Promise.all(
    (media ?? []).map(async (m) => {
      const { data } = await supabase.storage
        .from("clearance-media")
        .createSignedUrl(m.storage_path, 3600);
      return {
        id: m.id,
        url: data?.signedUrl ?? null,
        scanned: m.processing_status === "processed",
      };
    })
  );

  const unscanned = (media ?? []).filter(
    (m) => m.processing_status === "uploaded"
  ).length;

  const { data: candidateRows } = await supabase
    .from("candidate_items")
    .select("status")
    .eq("clearance_id", id);

  const candidates = candidateRows ?? [];
  const detected = candidates.filter((c) => c.status === "detected").length;
  const promoted = candidates.filter((c) => c.status === "promoted").length;
  const hasPhotos = (media ?? []).length > 0;
  const hasCandidates = candidates.length > 0;

  const analyseSingle = runDetection.bind(null, id, "single");
  const analyseMulti = runDetection.bind(null, id, "multi");

  return (
    <div>
      <Link
        href="/admin/clearances"
        className="text-sm text-muted hover:text-ink"
      >
        &larr; Clearances
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl text-ink">
          {clearance.job_number ?? clearance.reference}
        </h1>
        <Badge tone="neutral">{clearance.reference}</Badge>
        <Badge tone="accent">{clearance.status}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">
        {clearance.town} · {clearance.collection_date}
      </p>

      {/* Step 1 — capture */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg text-ink">
          1 · Photos{" "}
          <span className="text-sm text-muted">({media?.length ?? 0})</span>
        </h2>
        <PhotoUpload clearanceId={id} />

        {photos.length > 0 && (
          <ClearancePhotos
            clearanceId={id}
            photos={photos.map((p, i) => ({
              id: p.id,
              path: (media ?? [])[i]?.storage_path ?? "",
              url: p.url,
              scanned: p.scanned,
            }))}
          />
        )}
      </section>

      {/* Step 2 — detect */}
      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg text-ink">2 · Find items</h2>
        <div className="rounded-lg border border-line bg-surface p-5">
          {!hasPhotos ? (
            <p className="text-sm text-muted">Add photos first.</p>
          ) : unscanned === 0 ? (
            <p className="text-sm text-muted">
              All {media?.length} photo{media?.length === 1 ? "" : "s"} scanned.
              Add more photos and they&rsquo;ll be analysed next — the ones
              already done aren&rsquo;t re-scanned.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-ink-soft">
                {unscanned} new photo{unscanned === 1 ? "" : "s"} to analyse.
                What&rsquo;s in {unscanned === 1 ? "it" : "them"}?
              </p>
              <div className="flex flex-wrap gap-2">
                <form action={analyseSingle}>
                  <Button type="submit" size="md">
                    One item
                  </Button>
                </form>
                <form action={analyseMulti}>
                  <Button type="submit" size="md" variant="secondary">
                    Several items — find them all
                  </Button>
                </form>
              </div>
              <p className="text-2xs text-muted">
                <strong>One item</strong>: the photos are all of a single thing
                to list — anything else in shot is ignored.{" "}
                <strong>Several items</strong>: a room or a group — every
                saleable object becomes its own candidate. Nothing is listed
                without you approving it.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Step 3 — review */}
      {hasCandidates && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg text-ink">3 · Review</h2>
          <div className="flex items-center justify-between rounded-lg border border-line bg-surface p-5">
            <p className="text-sm text-ink-soft">
              {detected} awaiting review · {promoted} listed
            </p>
            <Button href={`/admin/clearances/${id}/review`} size="sm">
              Open review
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
