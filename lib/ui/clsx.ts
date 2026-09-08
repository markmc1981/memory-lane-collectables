/**
 * Tiny classnames joiner — no dependency needed. Filters falsy values so
 * `clsx("a", cond && "b", undefined)` works.
 */
export function clsx(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
