import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClearance } from "../actions";

export default function NewClearancePage() {
  return (
    <div className="max-w-lg">
      <Link
        href="/admin/clearances"
        className="text-sm text-muted hover:text-ink"
      >
        &larr; Clearances
      </Link>
      <h1 className="mt-3 font-display text-2xl text-ink">New clearance</h1>
      <p className="mt-2 text-sm text-muted">
        A reference (CLR-{new Date().getFullYear()}-…) is generated
        automatically. No customer address or personal details are needed here.
      </p>

      <form action={createClearance} className="mt-8 grid gap-4">
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">
            Internal name <span className="text-critical">*</span>
          </span>
          <input
            name="name"
            required
            placeholder="e.g. Newton Mearns — September 2026"
            className="h-11 w-full rounded border border-line bg-surface px-3 outline-none focus:border-ink"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">
            Town <span className="text-critical">*</span>
          </span>
          <input
            name="town"
            required
            placeholder="e.g. Newton Mearns"
            className="h-11 w-full rounded border border-line bg-surface px-3 outline-none focus:border-ink"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">Collection date</span>
          <input
            name="collection_date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="h-11 w-full rounded border border-line bg-surface px-3 outline-none focus:border-ink"
          />
        </label>

        <Button type="submit" size="lg" className="mt-2">
          Create clearance
        </Button>
      </form>
    </div>
  );
}
