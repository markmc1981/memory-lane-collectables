"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { addProductPhotos, setPrimaryPhoto, deletePhoto } from "../actions";

type Photo = { id: string; path: string; url: string | null; isPrimary: boolean };

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

  return (
    <div>
      <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((p) => (
          <div key={p.id} className="group relative">
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
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 rounded-b bg-ink/70 p-1 text-2xs text-on-accent opacity-0 transition-opacity group-hover:opacity-100">
              {!p.isPrimary && (
                <button
                  onClick={() =>
                    start(async () => {
                      await setPrimaryPhoto(stockItemId, p.id);
                      router.refresh();
                    })
                  }
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
                className="ml-auto"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
}
