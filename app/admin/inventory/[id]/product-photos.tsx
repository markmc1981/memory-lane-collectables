"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { enhancePhoto } from "@/lib/ui/enhance-photo";
import {
  addProductPhotos,
  addEnhancedPhoto,
  setPrimaryPhoto,
  deletePhoto,
} from "../actions";

type Photo = {
  id: string;
  path: string;
  url: string | null;
  isPrimary: boolean;
  isEnhanced: boolean;
};

export function ProductPhotos({
  stockItemId,
  photos,
}: {
  stockItemId: string;
  photos: Photo[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const done: { path: string }[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${stockItemId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("listing-images")
        .upload(path, file, { upsert: false });
      if (!error) done.push({ path });
    }
    await addProductPhotos(stockItemId, done);
    setBusy(false);
    start(() => router.refresh());
  }

  async function enhance(photo: Photo) {
    if (!photo.url) return;
    setWorking(photo.id);
    setError(null);
    try {
      const blob = await enhancePhoto(photo.url);
      const path = `${stockItemId}/${crypto.randomUUID()}-studio.jpg`;
      const { error: upErr } = await supabase.storage
        .from("listing-images")
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (upErr) throw new Error(upErr.message);
      await addEnhancedPhoto(stockItemId, path, photo.id);
      start(() => router.refresh());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not clean up that photo."
      );
    } finally {
      setWorking(null);
    }
  }

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((p) => (
          <div key={p.id}>
            <div className="relative">
              {p.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.url}
                  alt=""
                  className={`aspect-square w-full rounded object-cover ${
                    p.isPrimary ? "ring-2 ring-accent" : ""
                  }`}
                />
              ) : (
                <div className="aspect-square w-full rounded bg-surface-sunk" />
              )}
              {p.isPrimary && (
                <span className="absolute left-1 top-1 rounded bg-accent px-1.5 text-2xs text-on-accent">
                  main
                </span>
              )}
              {p.isEnhanced && (
                <span className="absolute right-1 top-1 rounded bg-ink/70 px-1.5 text-2xs text-on-accent">
                  studio
                </span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
              {!p.isEnhanced && (
                <button
                  onClick={() => enhance(p)}
                  disabled={working === p.id}
                  className="rounded bg-accent px-2 py-1 font-medium text-on-accent disabled:opacity-60"
                >
                  {working === p.id ? "Working…" : "✨ Studio backdrop"}
                </button>
              )}
              {!p.isPrimary && (
                <button
                  onClick={() =>
                    start(async () => {
                      await setPrimaryPhoto(stockItemId, p.id);
                      router.refresh();
                    })
                  }
                  className="rounded border border-line px-2 py-1 hover:border-ink"
                >
                  Make main
                </button>
              )}
              <button
                onClick={() =>
                  start(async () => {
                    await deletePhoto(stockItemId, p.id, p.path);
                    router.refresh();
                  })
                }
                className="rounded border border-line px-2 py-1 text-muted hover:border-critical hover:text-critical"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mb-2 text-xs text-critical">{error}</p>}

      <label className="inline-block cursor-pointer">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={busy}
          onChange={(e) => upload(e.target.files)}
        />
        <span className="inline-flex h-9 items-center rounded border border-line px-3 text-sm hover:border-ink">
          {busy ? "Uploading…" : "Add photos"}
        </span>
      </label>
      <p className="mt-2 text-2xs text-muted">
        Hover a photo → “Studio backdrop” cuts the item out and drops it on a
        clean background. The original is kept.
      </p>
    </div>
  );
}
