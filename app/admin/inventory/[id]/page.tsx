import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { publicImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { updateProduct } from "../actions";
import type { StockStatus } from "../statuses";
import { StatusControl } from "./status-control";
import { ProductPhotos } from "./product-photos";

type Props = { params: Promise<{ id: string }> };

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  wide,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  wide?: boolean;
}) {
  return (
    <label className={`block text-sm ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-muted">{label}</span>
      <input
        name={name}
        type={type}
        inputMode={type === "text" ? undefined : "decimal"}
        defaultValue={defaultValue ?? ""}
        className="h-10 w-full rounded border border-line bg-surface px-3 outline-none focus:border-ink"
      />
    </label>
  );
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("stock_items")
    .select(
      "id, stock_number, title, subtitle, status, asking_price, minimum_acceptable_price, quick_sale_price, courier_price, delivery_note, maker, era, material, condition_notes, storage_location, job_id, product_pages(slug, public_description), clearance_jobs(reference, job_number, town)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!item) notFound();

  const page = item.product_pages as unknown as {
    slug: string;
    public_description: string;
  } | null;
  const clearance = item.clearance_jobs as unknown as {
    reference: string;
    job_number: string | null;
    town: string;
  } | null;

  const { data: photoRows } = await supabase
    .from("item_photos")
    .select("id, storage_path, is_primary")
    .eq("stock_item_id", id)
    .order("is_primary", { ascending: false });

  const photos = (photoRows ?? []).map((p) => ({
    id: p.id,
    path: p.storage_path,
    url: publicImageUrl(p.storage_path),
    isPrimary: p.is_primary,
  }));

  return (
    <div>
      <Link
        href="/admin/inventory"
        className="text-sm text-muted hover:text-ink"
      >
        &larr; Inventory
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl text-ink">
            {item.title ?? "Untitled"}
          </h1>
          <Badge tone="neutral">{item.stock_number}</Badge>
        </div>
        <StatusControl id={id} status={item.status as StockStatus} />
      </div>

      {clearance && (
        <p className="mt-1 text-sm text-muted">
          From{" "}
          <Link
            href={`/admin/clearances/${item.job_id}`}
            className="text-accent underline underline-offset-4"
          >
            {clearance.job_number ?? clearance.reference}
          </Link>{" "}
          · {clearance.town}
          {page?.slug && (
            <>
              {" · "}
              <Link
                href={`/product/${page.slug}`}
                target="_blank"
                className="text-accent underline underline-offset-4"
              >
                view on shop
              </Link>
            </>
          )}
        </p>
      )}

      <section className="mt-6">
        <h2 className="mb-3 font-display text-lg text-ink">Photos</h2>
        <ProductPhotos stockItemId={id} photos={photos} />
      </section>

      <form action={updateProduct} className="mt-8">
        <input type="hidden" name="id" value={id} />
        <h2 className="mb-3 font-display text-lg text-ink">Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" name="title" defaultValue={item.title} wide />
          <Field label="Subtitle" name="subtitle" defaultValue={item.subtitle} wide />
          <Field
            label="Asking price (£)"
            name="asking_price"
            type="number"
            defaultValue={item.asking_price}
          />
          <Field
            label="Quick-sale price (£, internal)"
            name="quick_sale_price"
            type="number"
            defaultValue={item.quick_sale_price}
          />
          <Field
            label="Minimum acceptable (£, internal)"
            name="minimum_acceptable_price"
            type="number"
            defaultValue={item.minimum_acceptable_price}
          />
          <Field label="Storage location" name="storage_location" defaultValue={item.storage_location} />
          <Field
            label="Courier price (£) — blank = collection only"
            name="courier_price"
            type="number"
            defaultValue={item.courier_price}
          />
          <Field
            label="Delivery note (shown if no courier price)"
            name="delivery_note"
            defaultValue={item.delivery_note}
            wide
          />
          <Field label="Maker" name="maker" defaultValue={item.maker} />
          <Field label="Era" name="era" defaultValue={item.era} />
          <Field label="Material" name="material" defaultValue={item.material} />
          <Field
            label="Condition notes"
            name="condition_notes"
            defaultValue={item.condition_notes}
            wide
          />
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-muted">
              Public description (shown on the shop)
            </span>
            <textarea
              name="description"
              rows={5}
              defaultValue={page?.public_description ?? ""}
              className="w-full rounded border border-line bg-surface px-3 py-2 outline-none focus:border-ink"
            />
          </label>
        </div>
        <Button type="submit" size="md" className="mt-5">
          Save changes
        </Button>
      </form>
    </div>
  );
}
