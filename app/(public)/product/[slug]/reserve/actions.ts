"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ReserveState = { error: string | null };

export async function createReservation(
  _prev: ReserveState,
  formData: FormData
): Promise<ReserveState> {
  const slug = String(formData.get("slug") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const postcode = String(formData.get("postcode") ?? "").trim();
  const fulfilment =
    String(formData.get("fulfilment") ?? "collection") === "delivery"
      ? "delivery"
      : "collection";

  if (!name || !email || !postcode) {
    return { error: "Please fill in your name, email and postcode." };
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "That email address doesn't look right." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_reservation", {
    p_slug: slug,
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_postcode: postcode,
    p_fulfilment: fulfilment,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(`/product/${slug}/reserve/done`);
}
