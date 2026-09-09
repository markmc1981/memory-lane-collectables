import { clsx } from "@/lib/ui/clsx";

/**
 * A cartouche monogram — an "ML" set in a thin oval frame, the way an old
 * dealer's hallmark or a bookplate would look. `currentColor` drives the
 * letters; the frame is a touch lighter. Sizes with font-size / the `size`
 * prop so it works in the header and as a standalone mark.
 */
export function LogoMark({
  className,
  title = "Memory Lane Collectables",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 84"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
    >
      {/* outer + inner frame */}
      <ellipse
        cx="60"
        cy="42"
        rx="57"
        ry="39"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="1.4"
      />
      <ellipse
        cx="60"
        cy="42"
        rx="52"
        ry="34.5"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="1"
      />
      {/* little diamond finials top & bottom */}
      <path
        d="M60 1.5l3 3-3 3-3-3 3-3zM60 76.5l3 3-3 3-3-3 3-3z"
        fill="currentColor"
        fillOpacity="0.5"
      />
      {/* ML monogram */}
      <text
        x="60"
        y="43"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontWeight: 500,
          fontSize: "38px",
          letterSpacing: "-0.02em",
        }}
      >
        ML
      </text>
    </svg>
  );
}

/** Mark + wordmark, stacked. Used in the header and footer. */
export function Logo({
  className,
  tone = "light",
}: {
  className?: string;
  /** "light" = for a light background (dark text); "dark" = for a dark band. */
  tone?: "light" | "dark";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2.5 leading-none",
        tone === "dark" ? "text-paper" : "text-ink",
        className
      )}
    >
      <LogoMark className="h-9 w-auto shrink-0 text-accent" />
      <span className="flex flex-col">
        <span className="font-display text-[1.15rem] tracking-tight">
          Memory Lane
        </span>
        <span
          className={clsx(
            "text-2xs font-semibold uppercase tracking-[0.22em]",
            tone === "dark" ? "text-ink-muted" : "text-paper-muted"
          )}
        >
          Collectables
        </span>
      </span>
    </span>
  );
}
