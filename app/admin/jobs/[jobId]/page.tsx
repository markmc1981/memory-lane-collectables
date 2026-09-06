import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createStockItem } from "../../actions";

type Props = { params: Promise<{ jobId: string }> };

export default async function JobPage({ params }: Props) {
  const { jobId } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("clearance_jobs")
    .select("job_number, town, collection_date")
    .eq("id", jobId)
    .single();

  const { data: items } = await supabase
    .from("stock_items")
    .select("id, stock_number, status")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  const addItem = createStockItem.bind(null, jobId);

  return (
    <div className="max-w-2xl">
      <Link href="/admin" className="text-sm text-[var(--muted)]">
        &larr; All jobs
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mt-2 mb-1">
        {job?.job_number}
      </h1>
      <p className="text-sm text-[var(--muted)] mb-6">
        {job?.town} &middot; {job?.collection_date}
      </p>

      <form action={addItem} className="mb-8">
        <button
          type="submit"
          className="rounded-md bg-[var(--accent)] text-[var(--accent-ink)] px-4 py-2 text-sm font-medium"
        >
          + Add item
        </button>
      </form>

      <div className="divide-y divide-[var(--line)]">
        {(items ?? []).map((item) => (
          <Link
            key={item.id}
            href={`/admin/jobs/${jobId}/items/${item.id}`}
            className="flex justify-between py-3 text-sm"
          >
            <span>{item.stock_number}</span>
            <span className="text-[var(--muted)]">
              {item.status.replace(/_/g, " ")}
            </span>
          </Link>
        ))}
        {(items ?? []).length === 0 && (
          <p className="text-sm text-[var(--muted)] py-3">
            No items logged for this job yet.
          </p>
        )}
      </div>
    </div>
  );
}
