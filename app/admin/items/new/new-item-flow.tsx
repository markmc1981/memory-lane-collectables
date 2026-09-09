"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { publicImageUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CONFIDENCE_TEXT, confidenceLabel } from "@/lib/ai/types";
import { analyseNewItem, publishNewItem, type ItemDraft } from "../actions";

const tone = {
  high: "positive",
  likely: "accent",
  possible: "neutral",
  review: "critical",
} as const;

export function NewItemFlow() {
  const supabase = createClient();
  const [paths, setPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    const added: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `new/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("listing-images")
        .upload(path, file, { upsert: false });
      if (error) setError(error.message);
      else added.push(path);
    }
    setPaths((p) => [...p, ...added]);
    setUploading(false);
  }

  async function analyse() {
    setAnalysing(true);
    setError(null);
    try {
      setDraft(await analyseNewItem(paths));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not identify the item.");
    } finally {
      setAnalysing(false);
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Photos */}
      <section>
        <h2 className="mb-2 font-display text-lg text-ink">
          1 · Photos of the item
        </h2>
        {paths.length > 0 && (
          <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {paths.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p}
                src={publicImageUrl(p) ?? ""}
                alt=""
                className="aspect-square w-full rounded object-cover"
              />
            ))}
          </div>
        )}
        <label className="inline-block cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            disabled={uploading || analysing}
            onChange={(e) => upload(e.target.files)}
          />
          <span className="inline-flex h-10 items-center rounded bg-accent px-4 text-sm font-medium text-on-accent">
            {uploading
              ? "Uploading…"
              : paths.length
                ? "Add another photo"
                : "Add photos"}
          </span>
        </label>
        <p className="mt-2 text-xs text-muted">
          A few angles helps. Everything here is treated as the same one item.
        </p>
      </section>

      {/* Analyse */}
      {paths.length > 0 && !draft && (
        <div className="mt-6">
          <Button onClick={analyse} size="lg" disabled={analysing}>
            {analysing ? "Identifying…" : "Identify this item"}
          </Button>
          {analysing && (
            <p className="mt-2 text-xs text-muted">
              Looking at the photos, working out what it is, and drafting the
              listing. ~15–20 seconds.
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-critical">{error}</p>}

      {/* Draft -> publish */}
      {draft && (
        <form action={publishNewItem} className="mt-8 grid gap-4">
          {paths.map((p) => (
            <input key={p} type="hidden" name="photo_path" value={p} />
          ))}

          {draft.identification && (
            <div className="rounded-lg border border-line bg-accent-tint/40 p-3 text-sm">
              <Badge
                tone={tone[confidenceLabel(draft.identification.confidence)]}
              >
                {CONFIDENCE_TEXT[confidenceLabel(draft.identification.confidence)]}
              </Badge>
              <p className="prose-warm mt-2">{draft.identification.summary}</p>
              {draft.identification.visibleMarkings && (
                <p className="mt-1 text-xs text-muted">
                  Markings: {draft.identification.visibleMarkings}
                </p>
              )}
            </div>
          )}

          <Row label="Title">
            <input
              name="title"
              required
              defaultValue={draft.title}
              className="h-10 w-full rounded border border-line bg-surface px-3 outline-none focus:border-ink"
            />
          </Row>
          <Row label="Category">
            <input
              name="category"
              defaultValue={draft.category ?? ""}
              className="h-10 w-full rounded border border-line bg-surface px-3 outline-none focus:border-ink"
            />
          </Row>
          <div className="grid grid-cols-2 gap-4">
            <Row label="Asking price (£)">
              <input
                name="asking_price"
                inputMode="decimal"
                defaultValue={draft.suggestedPrice ?? ""}
                className="h-10 w-full rounded border border-line bg-surface px-3 outline-none focus:border-ink"
              />
            </Row>
            <Row label="Courier price (£) — blank = collection only">
              <input
                name="courier_price"
                inputMode="decimal"
                className="h-10 w-full rounded border border-line bg-surface px-3 outline-none focus:border-ink"
              />
            </Row>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Row label="Maker">
              <input
                name="maker"
                defaultValue={draft.identification?.maker ?? ""}
                className="h-10 w-full rounded border border-line bg-surface px-3 outline-none focus:border-ink"
              />
            </Row>
            <Row label="Era">
              <input
                name="era"
                defaultValue={draft.identification?.era ?? ""}
                className="h-10 w-full rounded border border-line bg-surface px-3 outline-none focus:border-ink"
              />
            </Row>
          </div>
          <Row label="Material">
            <input
              name="material"
              defaultValue={draft.identification?.material ?? ""}
              className="h-10 w-full rounded border border-line bg-surface px-3 outline-none focus:border-ink"
            />
          </Row>
          <Row label="Description">
            <textarea
              name="description"
              rows={8}
              defaultValue={draft.description}
              className="w-full rounded border border-line bg-surface px-3 py-2 outline-none focus:border-ink"
            />
          </Row>
          <Row label="Condition notes">
            <textarea
              name="condition_notes"
              rows={3}
              defaultValue={draft.identification?.condition ?? ""}
              className="w-full rounded border border-line bg-surface px-3 py-2 outline-none focus:border-ink"
            />
          </Row>

          <Button type="submit" size="lg" className="self-start">
            List it on the shop
          </Button>
          <p className="text-2xs text-muted">
            AI cost for this item: ~{Math.max(draft.costPence, 1)}p. You can
            polish photos (studio backdrop) on the item afterwards.
          </p>
        </form>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      {children}
    </label>
  );
}
