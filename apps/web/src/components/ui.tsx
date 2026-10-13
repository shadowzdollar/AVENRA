import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";

/*
 * Small, accessible building blocks on the design tokens (Guidelines §144).
 * Neutral by default; Avenra Blue only for primary actions and focus; status
 * colours only for real states.
 */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  busy?: boolean;
};

export function Button({ variant = "primary", busy = false, disabled, children, className = "", ...rest }: ButtonProps) {
  const styles = {
    primary: "bg-brand text-background hover:opacity-90",
    secondary: "border border-border bg-background text-text-primary hover:bg-brand-surface",
    danger: "border border-border bg-background text-error hover:bg-brand-surface",
  }[variant];
  return (
    <button
      {...rest}
      disabled={disabled === true || busy}
      aria-busy={busy}
      className={`inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {busy ? "Working…" : children}
    </button>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
};

export function Field({ label, hint, error, ...input }: FieldProps) {
  const id = useId();
  const described = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        {...input}
        aria-invalid={error ? true : undefined}
        aria-describedby={described}
        className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-surface aria-invalid:border-error"
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Alert({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-error text-error",
    success: "border-success text-success",
    info: "border-border text-text-secondary",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-md border px-3 py-2 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export function Card({ title, children, actions }: { title?: string | undefined; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-background p-5">
      {title || actions ? (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title ? <h2 className="text-base font-semibold">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Centered page for sign-in, sign-up and similar flows. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string | undefined; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- see page.tsx: the CSP blocks next/image's inline style */}
          <img src="/avenra-symbol.png" alt="" width={28} height={28} />
          <span className="text-base font-semibold tracking-tight">Avenra</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-text-secondary">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
