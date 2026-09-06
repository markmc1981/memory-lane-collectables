import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createJob } from "./actions";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("clearance_jobs")
    .select("id, job_number, town, collection_date")
    .order("collection_date", { ascending: false });

  const { data: statusCounts } = await supabase
    .from("stock_items")
    .select("status");

  const counts = (statusCounts ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">
        Jobs &amp; stock
      </h1>

      <div className="flex gap-3 mb-8 flex-wrap">
        {Object.entries(counts).length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No stock recorded yet — create a job below, then add items to it.
          </p>
        ) : (
          Object.entries(counts).map(([status, count]) => (
            <span
              key={status}
              className="text-xs rounded-full border border-[var(--line)] px-3 py-1"
            >
              {status.replace(/_/g, " ")}: {count}
            </span>
          ))
        )}
      </div>

      <form
        action={createJob}
        className="border border-[var(--line)] rounded-lg p-5 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        <input
          name="job_number"
          placeholder="Job number (e.g. J-2026-014)"
          required
          className="border border-[var(--line)] rounded-md px-3 py-2 text-sm sm:col-span-1"
        />
        <input
          name="town"
          placeholder="Town"
          required
          className="border border-[var(--line)] rounded-md px-3 py-2 text-sm sm:col-span-1"
        />
        <input
          name="collection_date"
          type="date"
          required
          className="border border-[var(--line)] rounded-md px-3 py-2 text-sm sm:col-span-1"
        />
        <button
          type="submit"
          className="sm:col-span-3 rounded-md bg-[var(--accent)] text-[var(--accent-ink)] py-2 font-medium text-sm"
        >
          + New clearance job
        </button>
      </form>

      <div className="divide-y divide-[var(--line)]">
        {(jobs ?? []).map((job) => (
          <Link
            key={job.id}
            href={`/admin/jobs/${job.id}`}
            className="flex justify-between py-3 text-sm"
          >
            <span>
              {job.job_number} &middot; {job.town}
            </span>
            <span className="text-[var(--muted)]">
              {job.collection_date}
            </span>
          </Link>
        ))}
        {(jobs ?? []).length === 0 && (
          <p className="text-sm text-[var(--muted)] py-3">
            No jobs yet — add your first one above.
          </p>
        )}
      </div>
    </div>
  );
}
