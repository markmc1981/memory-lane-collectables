import Link from "next/link";
import { clsx } from "@/lib/ui/clsx";

type Variant = "primary" | "secondary" | "ghost" | "link" | "on-dark";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-150 disabled:opacity-55 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-ink hover:bg-accent-dark hover:text-paper",
  secondary:
    "border-2 border-ink text-ink hover:bg-ink hover:text-paper",
  "on-dark":
    "border-2 border-paper/40 text-paper hover:bg-paper hover:text-ink",
  ghost: "text-ink hover:bg-paper-dim",
  link: "rounded-none text-accent-dark underline decoration-accent/40 underline-offset-4 hover:decoration-accent-dark px-0 font-medium",
};

const sizes: Record<Size, string> = {
  sm: "text-sm px-4 min-h-9",
  md: "text-sm px-5 min-h-11",
  lg: "text-base px-7 min-h-12",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
  };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const {
    variant = "primary",
    size = "md",
    fullWidth,
    className,
    children,
    ...rest
  } = props;

  const cls = clsx(
    base,
    variants[variant],
    variant !== "link" && sizes[size],
    fullWidth && "w-full",
    className
  );

  if ("href" in props && props.href !== undefined) {
    const { href, ...anchorRest } = rest as Omit<ButtonAsLink, keyof CommonProps>;
    return (
      <Link href={href} className={cls} {...anchorRest}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={cls}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
