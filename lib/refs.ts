import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Sequential human references, per calendar year:
 *   clearances:   CLR-2026-0001
 *   stock items:  ML-2026-0001   (the SKU; the "ML" is Memory Lane, the
 *                 brand a customer sees on a marketplace listing)
 *
 * The job/clearance number is NOT embedded in the SKU — the two are linked
 * by `stock_items.job_id`. See MEMORYLANE_MASTER_PLAN.md §10 (decision D1).
 *
 * These count existing rows for the year and add one. Fine at this volume;
 * if two clearances are created in the same second this could collide, in
 * which case the unique constraint rejects the second and the caller retries.
 */

async function nextSequential(
  supabase: SupabaseClient,
  table: string,
  column: string,
  prefix: string
): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .like(column, `${prefix}-${year}-%`);

  const next = (count ?? 0) + 1;
  return `${prefix}-${year}-${String(next).padStart(4, "0")}`;
}

export function nextClearanceReference(supabase: SupabaseClient) {
  return nextSequential(supabase, "clearance_jobs", "reference", "CLR");
}

export function nextStockNumber(supabase: SupabaseClient) {
  return nextSequential(supabase, "stock_items", "stock_number", "ML");
}

/** A URL slug from a title, de-collided by the caller if needed. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}
