import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/*
 * The landing page's buttons, as designed in the Lovable prototype (ADR-039),
 * on Avenra's tokens.
 */
const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

const VARIANTS = {
  default: "bg-brand text-background shadow hover:bg-brand/90",
  outline: "border border-border bg-background shadow-sm hover:bg-canvas",
  ghost: "hover:bg-canvas",
  ink: "bg-text-primary text-background shadow-ink hover:bg-text-primary/90 rounded-xl",
  soft: "bg-background text-text-primary border border-border shadow-soft hover:bg-canvas rounded-xl",
  brand: "bg-brand text-background shadow-brand hover:bg-brand/90 rounded-xl",
} as const;

const SIZES = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-11 px-6 text-sm",
  icon: "h-9 w-9",
} as const;

export type Variant = keyof typeof VARIANTS;
export type Size = keyof typeof SIZES;

export function buttonClasses(variant: Variant = "default", size: Size = "default", className = ""): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
}

export function LinkButton({
  href,
  variant,
  size,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)}>
      {children}
    </Link>
  );
}

export function Button({
  variant,
  size,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" {...rest} className={buttonClasses(variant, size, className)} />;
}
