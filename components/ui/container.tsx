import { clsx } from "@/lib/ui/clsx";

type Width = "prose" | "default" | "wide";

/**
 * Page gutter + measure. `wide` is the site standard (84rem, matches
 * .container-wide); narrower options for article/form pages.
 */
export function Container({
  width = "wide",
  className,
  children,
}: {
  width?: Width;
  className?: string;
  children: React.ReactNode;
}) {
  if (width === "wide") {
    return <div className={clsx("container-wide", className)}>{children}</div>;
  }
  return (
    <div
      className={clsx(
        "mx-auto w-full px-5 sm:px-10",
        width === "prose" ? "max-w-2xl" : "max-w-5xl",
        className
      )}
    >
      {children}
    </div>
  );
}
