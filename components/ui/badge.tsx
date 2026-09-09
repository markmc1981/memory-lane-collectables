import { clsx } from "@/lib/ui/clsx";

type Tone = "neutral" | "accent" | "highlight" | "positive" | "critical";

// tint background + dark text — never the raw accent as a fill at this scale.
const tones: Record<Tone, string> = {
  neutral: "bg-paper-dim text-paper-muted",
  accent: "bg-accent-tint text-accent-dark",
  highlight: "bg-accent-2-tint text-accent-2-dark",
  positive: "bg-[color-mix(in_srgb,var(--color-positive)_16%,white)] text-positive",
  critical: "bg-[color-mix(in_srgb,var(--color-critical)_14%,white)] text-critical",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
