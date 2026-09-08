const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Money, formatted once, consistently. Whole pounds show no decimals
 * (£249, not £249.00); anything with pence shows both (£12.50).
 */
export function formatPrice(
  amount: number | null | undefined,
  currency = "GBP"
): string {
  if (amount == null) return "Price on request";
  if (currency !== "GBP") {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(
      amount
    );
  }
  return gbp.format(amount);
}

/** A price range for valuations: "£140 – £175". */
export function formatPriceRange(
  low: number | null | undefined,
  high: number | null | undefined
): string {
  if (low == null && high == null) return "—";
  if (low == null) return formatPrice(high);
  if (high == null) return formatPrice(low);
  return `${formatPrice(low)} – ${formatPrice(high)}`;
}
