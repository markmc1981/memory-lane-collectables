import { clsx } from "@/lib/ui/clsx";

type Tone = "neutral" | "accent" | "highlight" | "positive" | "critical";

const tones: Record<Tone, string> = {
  neutral: "border-line text-ink-soft bg-surface",
  accent: "border-transparent text-on-accent bg-accent",
  highlight: "border-transparent text-highlight bg-highlight-tint",
  positive: "border-transparent text-on-accent bg-positive",
  critical: "border-transparent text-on-accent bg-critical",
};

/**
 * Small status/label pill. Used for condition, stock status, "New", "Sale".
 * Keep the tone palette tight — a page with five badge colours reads cheap.
 */
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
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wider",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
