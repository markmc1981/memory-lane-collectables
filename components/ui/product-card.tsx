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

/**
 * The storefront's workhorse. Photo-led, minimal chrome — a hairline, no
 * drop shadow, a whisper of movement on hover. The image does the selling.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  const isSold = product.status === "sold";
  const isReserved = product.status === "reserved";

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded bg-surface-sunk">
        {product.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.photoUrl}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-[--ease] group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-sm text-muted">
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

      <div className="pt-3">
        {product.categoryName && (
          <p className="overline mb-1">{product.categoryName}</p>
        )}
        <h3 className="font-display text-lg leading-snug text-ink">
          {product.title}
        </h3>
        <div className="mt-1 flex items-baseline gap-2 text-sm">
          <span className={isSold ? "text-muted line-through" : "text-ink"}>
            {formatPrice(product.askingPrice, product.currency)}
          </span>
          {product.foundIn && (
            <span className="text-muted">· Found in {product.foundIn}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
