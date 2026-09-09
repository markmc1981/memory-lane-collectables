/**
 * The one place environment variables are read.
 *
 * `NEXT_PUBLIC_*` vars MUST be accessed as static `process.env.NEXT_PUBLIC_X`
 * literals — Next only inlines them into the browser bundle that way. Never
 * read them through a helper/dynamic key, or they come back undefined in the
 * client and anything importing this module crashes on load.
 *
 * Server-only vars go through `env()` (dynamic is fine — server has the real
 * `process.env`).
 */

// --- public: inlined at build time, safe in the browser ---
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

function clean(v: string | undefined): string | undefined {
  if (v == null) return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

/** Server-only var lookup — dynamic key is fine on the server. */
function env(key: string): string | undefined {
  return clean(process.env[key]);
}

export const config = {
  site: {
    /** Canonical origin, no trailing slash. */
    url: clean(NEXT_PUBLIC_SITE_URL) ?? "https://memorylanecollectables.co.uk",
  },
  supabase: {
    // Empty string fallback rather than a throw: a missing value here is a
    // deploy misconfiguration, and the Supabase client will surface it
    // clearly on first use — better than crashing every page that imports
    // this module.
    url: clean(NEXT_PUBLIC_SUPABASE_URL) ?? "",
    anonKey: clean(NEXT_PUBLIC_SUPABASE_ANON_KEY) ?? "",
    /** Server-only. Undefined until a job needs to bypass RLS. */
    serviceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY"),
  },
  stripe: {
    /** Server-only secret key (sk_test_… or sk_live_…). */
    secretKey: env("STRIPE_SECRET_KEY"),
    /** whsec_… — verifies webhook signatures. */
    webhookSecret: env("STRIPE_WEBHOOK_SECRET"),
    /** True when checkout can actually run. */
    get enabled() {
      return Boolean(this.secretKey);
    },
  },
} as const;

/** Non-throwing lookup for optional server integrations (AI keys, email…). */
export { env as optionalEnv };
