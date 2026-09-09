"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteClearancePhoto } from "../actions";

type Photo = {
  id: string;
  path: string;
  url: string | null;
  scanned: boolean;
};

export function ClearancePhotos({
  clearanceId,
  photos,
}: {
  clearanceId: string;
  photos: Photo[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((p) => (
        <div key={p.id}>
          <div className="relative">
            {p.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.url}
                alt=""
                className="aspect-square w-full rounded object-cover"
              />
            ) : (
              <div className="aspect-square w-full rounded bg-surface-sunk" />
            )}
            {p.scanned && (
              <span className="absolute right-1 top-1 rounded bg-positive px-1.5 text-2xs text-on-accent">
                scanned
              </span>
            )}
          </div>
          <button
            onClick={() =>
              start(async () => {
                await deleteClearancePhoto(clearanceId, p.id, p.path);
                router.refresh();
              })
            }
            disabled={pending}
            className="mt-1.5 rounded border border-line px-2 py-1 text-xs text-muted hover:border-critical hover:text-critical"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
