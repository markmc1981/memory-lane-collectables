/**
 * The one place environment variables are read. Everything else imports from
 * here — never `process.env.X` scattered through the app (see
 * MEMORYLANE_MASTER_PLAN.md §13).
 *
 * Platforms like Vercel can set a variable to an empty string when it's left
 * blank in the dashboard. `env()` treats empty / whitespace-only as "not
 * set" so `??` fallbacks behave the way you'd expect.
 */
function env(key: string): string | undefined {
  const value = process.env[key];
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function required(key: string): string {
  const value = env(key);
  if (value === undefined) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Copy .env.example to .env.local and fill it in.`
    );
  }
  return value;
}

export const config = {
  site: {
    /** Canonical origin, no trailing slash. */
    url:
      env("NEXT_PUBLIC_SITE_URL") ?? "https://memorylanecollectables.co.uk",
  },
  supabase: {
    url: required("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    /** Server-only. Undefined until a job needs to bypass RLS. */
    serviceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY"),
  },
} as const;

/** Non-throwing lookup for optional integrations (AI keys, Stripe, email…). */
export { env as optionalEnv };
