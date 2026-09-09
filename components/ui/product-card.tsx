import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/ui/format";

export type ProductCardData = {
  slug: string;
  title: string;
  categoryName?: string | null;
  askingPrice?: number | null;
  currency?: string;
  status?: string | null;
  photoUrl?: string | null;
  foundIn?: string | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const isSold = product.status === "sold";
  const isReserved = product.status === "reserved";

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-paper-line bg-surface transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-paper-dim">
        {product.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.photoUrl}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 ease-[--ease] group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-sm text-paper-muted">
              Photograph to follow
            </span>
          </div>
        )}
        {(isSold || isReserved) && (
          <div className="absolute left-3 top-3">
            <Badge tone={isSold ? "neutral" : "highlight"}>
              {isSold ? "Sold" : "Reserved"}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.categoryName && (
          <p className="overline mb-1">{product.categoryName}</p>
        )}
        <h3 className="font-display text-lg leading-snug text-ink transition-colors group-hover:text-accent-dark">
          {product.title}
        </h3>
        <div className="mt-auto pt-2 flex items-baseline gap-2 text-sm">
          <span className={isSold ? "text-paper-muted line-through" : "text-ink"}>
            {formatPrice(product.askingPrice, product.currency)}
          </span>
          {product.foundIn && (
            <span className="text-paper-muted">· Found in {product.foundIn}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
