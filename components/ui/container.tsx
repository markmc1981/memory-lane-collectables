import { clsx } from "@/lib/ui/clsx";

type Width = "prose" | "default" | "wide";

const widths: Record<Width, string> = {
  prose: "max-w-2xl",
  default: "max-w-5xl",
  wide: "max-w-6xl",
};

/**
 * Horizontal page gutter + max width. One place to change the site's
 * measure. Generous padding on mobile; the operations app leans on this too.
 */
export function Container({
  width = "default",
  className,
  children,
}: {
  width?: Width;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx("mx-auto w-full px-5 sm:px-8", widths[width], className)}>
      {children}
    </div>
  );
}
