import type { ButtonHTMLAttributes, ComponentType, InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand";
import { IntegrationBubble } from "@/components/landing/Integrations";

/*
 * Small, accessible building blocks on the design tokens (Guidelines §144,
 * ADR-039). Neutral by default; Avenra Blue only for primary actions, links,
 * focus and selection; status colours only for real states.
 */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "ink" | "danger";
  size?: "md" | "sm";
  busy?: boolean;
};

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

export const BUTTON_STYLES = {
  primary: "bg-brand text-background shadow-brand hover:opacity-90",
  secondary: "border border-border bg-background text-text-primary hover:bg-canvas",
  ghost: "text-text-primary hover:bg-canvas",
  ink: "bg-text-primary text-background hover:opacity-90",
  danger: "border border-border bg-background text-error hover:bg-error-surface",
} as const;

export const BUTTON_SIZES = { md: "h-9 px-4 text-[13px]", sm: "h-8 px-3 text-[12px]" } as const;

/** The button look for a link, so navigation stays a link. */
export function buttonClass(variant: keyof typeof BUTTON_STYLES = "primary", size: keyof typeof BUTTON_SIZES = "md"): string {
  return `${BUTTON_BASE} ${BUTTON_STYLES[variant]} ${BUTTON_SIZES[size]}`;
}

export function Button({ variant = "primary", size = "md", busy = false, disabled, children, className = "", ...rest }: ButtonProps) {
  return (
    <button {...rest} disabled={disabled === true || busy} aria-busy={busy} className={`${buttonClass(variant, size)} ${className}`}>
      {busy ? "Working…" : children}
    </button>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  icon?: ComponentType<{ className?: string }> | undefined;
};

export const INPUT_CLASS =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none transition placeholder:text-text-secondary focus:border-brand focus:ring-2 focus:ring-brand-surface aria-invalid:border-error";

export function Field({ label, hint, error, icon: Icon, ...input }: FieldProps) {
  const id = useId();
  const described = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </label>
      <div className="relative">
        {Icon ? <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" /> : null}
        <input
          id={id}
          {...input}
          aria-invalid={error ? true : undefined}
          aria-describedby={described}
          className={`${INPUT_CLASS} ${Icon ? "pl-9" : ""}`}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-[12px] text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12px] text-text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Alert({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-error/30 bg-error-surface text-error",
    success: "border-success/30 bg-success-surface text-success",
    info: "border-border bg-canvas text-text-secondary",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-[13px] ${styles}`}>
      {children}
    </div>
  );
}

/** A surface for one topic on a page. */
export function Panel({
  title,
  actions,
  children,
  className = "",
  flush = false,
}: {
  title?: string | undefined;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** No inner padding, for tables that run to the edges. */
  flush?: boolean;
}) {
  return (
    <section className={`rounded-2xl border border-border bg-background shadow-soft ${className}`}>
      {title || actions ? (
        <div className="flex items-center justify-between gap-4 px-5 pt-5">
          {title ? <h2 className="text-[15px] font-semibold">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      <div className={flush ? "pt-3" : "p-5"}>{children}</div>
    </section>
  );
}

/** Kept for existing pages: a titled panel. */
export function Card({ title, children, actions }: { title?: string | undefined; children: ReactNode; actions?: ReactNode }) {
  return (
    <Panel title={title} actions={actions}>
      {children}
    </Panel>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string | undefined; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-[13px] text-text-secondary">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export type Tone = "neutral" | "brand" | "success" | "warning" | "error";

export const PILL_TONES: Record<Tone, string> = {
  neutral: "bg-canvas text-text-primary",
  brand: "bg-brand-surface text-brand",
  success: "bg-success-surface text-success",
  warning: "bg-warning-surface text-warning",
  error: "bg-error-surface text-error",
};

/** A short state label. Status tones only for real states (§144.3). */
export function Pill({ tone = "neutral", children, testId }: { tone?: Tone; children: ReactNode; testId?: string }) {
  return (
    <span data-testid={testId} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${PILL_TONES[tone]}`}>
      {children}
    </span>
  );
}

/** A headline number with what it means. */
export function Stat({
  label,
  value,
  note,
  icon: Icon,
  testId,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  icon?: ComponentType<{ className?: string }> | undefined;
  testId?: string | undefined;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-soft" data-testid={testId}>
      <div className="flex items-center gap-3">
        {Icon ? (
          <span className="flex size-9 items-center justify-center rounded-full bg-brand-surface">
            <Icon className="size-4 text-brand" />
          </span>
        ) : null}
        <span className="flex-1 text-[13px] font-medium">{label}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {note ? <p className="mt-2 text-[12px] text-text-secondary">{note}</p> : null}
    </div>
  );
}

/** Initials in a circle, for people. */
export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "?";
  return (
    <span aria-hidden className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-canvas text-[10px] font-semibold ${className}`}>
      {initials}
    </span>
  );
}

export const TABLE = {
  wrap: "overflow-x-auto",
  table: "w-full text-left text-[13px]",
  th: "border-b border-border px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-secondary",
  td: "border-b border-border px-4 py-3.5 align-middle",
  row: "transition-colors hover:bg-canvas",
};

/** An on/off setting with its own label (a checkbox with the switch role). */
export function Switch({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description?: string | undefined;
  checked: boolean;
  disabled?: boolean | undefined;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-[13px] font-medium">{label}</span>
        {description ? <span className="block text-[12px] text-text-secondary">{description}</span> : null}
      </label>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer relative h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-border transition before:absolute before:left-0.5 before:top-0.5 before:size-4 before:rounded-full before:bg-background before:shadow-soft before:transition checked:bg-brand checked:before:translate-x-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children }: { icon?: ComponentType<{ className?: string }>; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      {Icon ? (
        <span className="flex size-10 items-center justify-center rounded-xl bg-canvas">
          <Icon className="size-5 text-text-secondary" />
        </span>
      ) : null}
      <p className="text-[14px] font-medium">{title}</p>
      {children ? <div className="max-w-sm text-[13px] text-text-secondary">{children}</div> : null}
    </div>
  );
}

/**
 * Sign-in, sign-up and similar flows: the form on the left, Avenra's idea on
 * the right (every source, one outcome).
 */
export function AuthLayout({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string | undefined;
  icon?: ComponentType<{ className?: string }> | undefined;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-auth-wash p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl gap-4 rounded-3xl bg-background p-4 shadow-float md:grid-cols-2">
        <div className="flex flex-col p-4 md:p-6">
          <Link href="/" aria-label="Avenra home" className="self-start">
            <BrandLogo />
          </Link>
          <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
            {Icon ? (
              <div className="relative mx-auto mb-2 flex size-28 items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-grid opacity-70 [mask-image:radial-gradient(circle,black,transparent_70%)]" />
                <span className="relative flex size-12 items-center justify-center rounded-xl bg-brand shadow-brand">
                  <Icon className="size-5 text-background" />
                </span>
              </div>
            ) : null}
            <h1 className={`text-xl font-semibold tracking-tight ${Icon ? "text-center" : ""}`}>{title}</h1>
            {subtitle ? <p className={`mt-1 text-[13px] text-text-secondary ${Icon ? "text-center" : ""}`}>{subtitle}</p> : null}
            <div className="mt-8">{children}</div>
          </main>
        </div>
        <AuthIllustration />
      </div>
    </div>
  );
}

function AuthIllustration() {
  return (
    <div className="relative hidden flex-col overflow-hidden rounded-2xl bg-auth-wash p-8 md:flex" aria-hidden>
      <p className="text-center text-xl font-semibold tracking-tight">
        Every source. <span className="text-brand">One outcome.</span>
      </p>
      <div className="relative flex-1">
        <div className="absolute left-1/2 top-1/2 size-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-background/80" />
        <div className="absolute left-1/2 top-1/2 size-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-background/80" />
        <div className="absolute left-1/2 top-1/2 size-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-background/80 bg-background/20" />
        <div className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background shadow-float">
          <BrandLogo markOnly className="size-10" />
        </div>
        <SourceRing />
      </div>
      <p className="mx-auto max-w-sm text-center text-[13px] leading-relaxed text-text-secondary">
        Works with <span className="font-semibold italic text-text-primary">Gmail, Amazon S3, Zapier and Make</span> and the systems your firm
        already runs on, turning their information into verified completed work.
      </p>
      <div className="mt-6 flex justify-center gap-1.5">
        <span className="h-1 w-6 rounded-full bg-brand" />
        <span className="h-1 w-3 rounded-full bg-background" />
        <span className="h-1 w-3 rounded-full bg-background" />
      </div>
    </div>
  );
}

/** Services Avenra works with, around the mark (the Lovable sign-in design, ADR-039). */
export function SourceRing() {
  return (
    <>
      {RING.map(({ name, position }) => (
        <div key={name} className={`absolute ${position}`}>
          <IntegrationBubble name={name} size="sm" className="rounded-full" />
        </div>
      ))}
    </>
  );
}

const RING = [
  { name: "Gmail", position: "left-[46%] top-[6%]" },
  { name: "Zapier", position: "left-[6%] top-[32%]" },
  { name: "Amazon S3", position: "left-[34%] top-[26%]" },
  { name: "Make", position: "right-[4%] top-[30%]" },
  { name: "Cloudflare R2", position: "right-[22%] top-[22%]" },
  { name: "n8n", position: "left-[12%] top-[66%]" },
  { name: "Backblaze B2", position: "right-[30%] top-[64%]" },
  { name: "MinIO", position: "right-[8%] top-[76%]" },
];
