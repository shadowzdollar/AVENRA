/* eslint-disable @next/next/no-img-element */
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

export interface EnterpriseImageHighlight {
  label: string;
  value: string;
}

export interface EnterpriseImageCardProps {
  src: string;
  alt: string;
  badge?: string;
  badgeVariant?: "success" | "brand" | "warning" | "cyan";
  title: string;
  subtitle?: string;
  highlights?: EnterpriseImageHighlight[];
  className?: string;
  imageClassName?: string;
}

export function EnterpriseImageCard({
  src,
  alt,
  badge = "ENTERPRISE VERIFIED",
  badgeVariant = "brand",
  title,
  subtitle,
  highlights,
  className = "",
  imageClassName = "h-56 sm:h-72",
}: EnterpriseImageCardProps) {
  const badgeClasses = {
    brand: "bg-brand/10 text-brand border-brand/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  }[badgeVariant];

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-2xl transition-all duration-300 hover:border-border hover:shadow-cyan-500/5 ${className}`}
    >
      {/* Window Titlebar */}
      <div className="flex items-center justify-between border-b border-border/70 bg-canvas-subtle/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-500/80" />
            <span className="size-2.5 rounded-full bg-amber-500/80" />
            <span className="size-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 text-xs font-semibold text-text-secondary truncate max-w-[200px] sm:max-w-xs">
            {title}
          </span>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClasses}`}
        >
          <ShieldCheck className="size-3 shrink-0" />
          <span>{badge}</span>
        </span>
      </div>

      {/* Image Showcase */}
      <div className={`relative w-full overflow-hidden bg-black/40 ${imageClassName}`}>
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Subtle bottom gradient to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Floating caption pill */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <div className="rounded-xl bg-black/70 px-3 py-1.5 backdrop-blur-md border border-white/10 text-white">
            <p className="text-xs font-semibold leading-tight">{title}</p>
            {subtitle ? (
              <p className="text-[11px] text-zinc-300 leading-tight mt-0.5 line-clamp-1">{subtitle}</p>
            ) : null}
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-emerald-500/90 px-2 py-1 text-[10px] font-bold text-white shadow-md">
            <CheckCircle2 className="size-3" /> Active Guard
          </span>
        </div>
      </div>

      {/* Highlights Footer */}
      {highlights && highlights.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-border/60 border-t border-border/70 bg-canvas/60 text-xs">
          {highlights.map((h) => (
            <div key={h.label} className="p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                {h.label}
              </span>
              <span className="mt-0.5 block font-semibold text-text-primary text-[11px] truncate">
                {h.value}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Large banner visual for section walkthroughs
 */
export function EnterpriseSectionImage({
  src,
  alt,
  badge,
  title,
  description,
  bullets,
}: {
  src: string;
  alt: string;
  badge: string;
  title: string;
  description: string;
  bullets?: string[];
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 md:p-8 shadow-2xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-bold text-brand uppercase tracking-wider">
            <Sparkles className="size-3.5" /> {badge}
          </span>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            {title}
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {description}
          </p>
          {bullets && bullets.length > 0 ? (
            <ul className="space-y-2 pt-2">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-xs font-medium text-text-secondary">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="lg:col-span-7">
          <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-2xl border border-border shadow-xl">
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-3 py-1 text-[11px] text-white/90 backdrop-blur-md border border-white/10">
              Verified Production Pipeline
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
