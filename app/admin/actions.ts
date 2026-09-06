"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createJob(formData: FormData) {
  const supabase = await createClient();

  const job_number = formData.get("job_number") as string;
  const town = formData.get("town") as string;
  const collection_date = formData.get("collection_date") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("clearance_jobs").insert({
    job_number,
    town,
    collection_date,
    created_by: user?.id ?? null,
  });

  if (error) {
    // Surfacing this cleanly (a toast, a form error) is a follow-up —
    // for now this keeps the failure visible in server logs rather than
    // silently losing the job.
    console.error("createJob failed:", error.message);
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

/**
 * Generates the next sequential stock number for the current year, e.g.
 * CMS-2026-0001 — see decision-log.md for why the job number isn't
 * embedded in the string itself.
 */
export async function getNextStockNumber(): Promise<string> {
  const supabase = await createClient();
  const year = new Date().getFullYear();

  const { count } = await supabase
    .from("stock_items")
    .select("id", { count: "exact", head: true })
    .like("stock_number", `CMS-${year}-%`);

  const next = (count ?? 0) + 1;
  return `CMS-${year}-${String(next).padStart(4, "0")}`;
}

export async function createStockItem(jobId: string) {
  const supabase = await createClient();
  const stock_number = await getNextStockNumber();

  const { data, error } = await supabase
    .from("stock_items")
    .insert({
      job_id: jobId,
      stock_number,
      status: "awaiting_intake",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  redirect(`/admin/jobs/${jobId}/items/${data.id}`);
}
