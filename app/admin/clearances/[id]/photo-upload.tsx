"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { recordUploadedMedia } from "../actions";

type Status = "idle" | "uploading" | "done" | "error";

export function PhotoUpload({ clearanceId }: { clearanceId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [message, setMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setStatus("uploading");
    setProgress({ done: 0, total: files.length });
    setMessage(null);

    const uploaded: { path: string; name: string }[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${clearanceId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("clearance-media")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }
      uploaded.push({ path, name: file.name });
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    try {
      await recordUploadedMedia(clearanceId, uploaded);
      setStatus("done");
      setMessage(`${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} added.`);
      startTransition(() => router.refresh());
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not save photos.");
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-line bg-surface p-5 text-center">
      <label className="block cursor-pointer">
        <input
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          disabled={status === "uploading"}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="inline-flex h-11 items-center rounded bg-accent px-5 text-sm font-medium text-on-accent">
          {status === "uploading"
            ? `Uploading ${progress.done}/${progress.total}…`
            : "Add photos"}
        </span>
      </label>
      <p className="mt-2 text-xs text-muted">
        Take photos now or pick from your camera roll. Multiple at once is fine.
      </p>
      {message && (
        <p
          className={`mt-2 text-xs ${
            status === "error" ? "text-critical" : "text-positive"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
