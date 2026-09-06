import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ jobId: string; itemId: string }> };

export default async function ItemPage({ params }: Props) {
  const { jobId, itemId } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("stock_items")
    .select("stock_number, status, asking_price, storage_location")
    .eq("id", itemId)
    .single();

  return (
    <div className="max-w-2xl">
      <Link href={`/admin/jobs/${jobId}`} className="text-sm text-[var(--muted)]">
        &larr; Back to job
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mt-2 mb-1">
        {item?.stock_number}
      </h1>
      <p className="text-sm text-[var(--muted)] mb-8">
        Status: {item?.status.replace(/_/g, " ")}
      </p>

      <div className="rounded-lg border border-dashed border-[var(--line)] p-8 text-center text-[var(--muted)] text-sm">
        <p className="font-medium text-[var(--ink)] mb-1">
          Photo capture, AI identification and price research land here next
        </p>
        <p>
          This is the intake-flow wireframe screen 02–03 (see the project
          docs) — the record already exists with a stock number; the camera
          and AI review UI are the next build step.
        </p>
      </div>
    </div>
  );
}
