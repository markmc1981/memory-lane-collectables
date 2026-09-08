import { clsx } from "@/lib/ui/clsx";

/**
 * The considered version of "there's nothing here yet". Used on the
 * storefront before items are listed and throughout the operations app.
 * An empty state should reassure, not look broken.
 */
export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-dashed border-line bg-surface/60 px-6 py-14 text-center",
        className
      )}
    >
      <p className="font-display text-xl text-ink">{title}</p>
      {children && (
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{children}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
