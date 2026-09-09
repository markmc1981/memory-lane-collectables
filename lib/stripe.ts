import "server-only";
import Stripe from "stripe";
import { config } from "@/lib/config";

/**
 * Stripe client, or null when no key is configured (so the site still runs
 * and checkout just shows "coming soon"). Server-only — the secret key
 * must never reach the browser.
 */
export const stripe = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey)
  : null;

/** GBP major units -> pence (Stripe wants integer minor units). */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}
