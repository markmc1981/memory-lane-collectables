import Link from "next/link";
import { NewItemFlow } from "./new-item-flow";

export default function NewItemPage() {
  return (
    <div>
      <Link href="/admin/inventory" className="text-sm text-muted hover:text-ink">
        &larr; Inventory
      </Link>
      <h1 className="mt-3 font-display text-2xl text-ink">Add an item</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Photograph one thing, and Memory Lane identifies it, prices it, writes
        the listing, and puts it on the shop. Nothing goes live until you press
        the button.
      </p>
      <NewItemFlow />
    </div>
  );
}
