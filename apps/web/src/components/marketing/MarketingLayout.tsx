"use client";

import type { ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand";
import { Header } from "@/components/landing/Header";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface StatItem {
  value: string;
  label: string;
  detail?: string;
}

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

export type MarketingVariant =
  | "platform"
  | "solutions"
  | "how-it-works"
  | "security"
  | "integrations"
  | "pricing"
  | "docs";

export interface MarketingLayoutProps {
  category: string;
  badge?: string;
  title: string;
  subtitle: string;
  breadcrumbs: BreadcrumbItem[];
  stats?: StatItem[];
  features?: FeatureItem[];
  heroVisual?: ReactNode;
  variant?: MarketingVariant;
  children: ReactNode;
}

export function MarketingLayout({
  category,
  badge,
  title,
  subtitle,
  breadcrumbs,
  stats,
  features,
  heroVisual,
  variant = "platform",
  children,
}: MarketingLayoutProps) {
  const styles = {
    platform: {
      heroGlow: "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.18),rgba(255,255,255,0))]",
      badgeBg: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
      accentBorder: "border-cyan-500/20",
      pillColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    solutions: {
      heroGlow: "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.18),rgba(255,255,255,0))]",
      badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
      accentBorder: "border-emerald-500/20",
      pillColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    "how-it-works": {
      heroGlow: "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.18),rgba(255,255,255,0))]",
      badgeBg: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
      accentBorder: "border-indigo-500/20",
      pillColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    security: {
      heroGlow: "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.18),rgba(255,255,255,0))]",
      badgeBg: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
      accentBorder: "border-green-500/20",
      pillColor: "text-green-400 bg-green-500/10 border-green-500/20",
    },
    integrations: {
      heroGlow: "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.16),rgba(255,255,255,0))]",
      badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
      accentBorder: "border-amber-500/20",
      pillColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    pricing: {
      heroGlow: "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,119,6,0.16),rgba(255,255,255,0))]",
      badgeBg: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
      accentBorder: "border-yellow-500/20",
      pillColor: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    },
    docs: {
      heroGlow: "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(168,85,247,0.16),rgba(255,255,255,0))]",
      badgeBg: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
      accentBorder: "border-purple-500/20",
      pillColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
  }[variant];

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-brand/20">
      {/* Header with MegaMenu */}
      <div className="pt-4">
        <Header />
      </div>

      {/* Hero Section */}
      <section className={`relative overflow-hidden border-b border-border/60 ${styles.heroGlow} px-4 sm:px-6 lg:px-8 pb-20 pt-12 md:pb-28 md:pt-16`}>
        {/* Subtle patterned background grid */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(#888_1px,transparent_1px)] bg-size-[28px_28px] opacity-[0.03] dark:opacity-[0.07]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[1680px] w-full">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumbs" className="mb-8 flex items-center gap-1.5 text-xs text-text-secondary">
            <Link href="/" className="hover:text-text-primary transition-colors">
              Home
            </Link>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.label} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3 text-text-tertiary" />
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-text-primary transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-text-primary">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>

          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Content Column */}
            <div className={heroVisual ? "lg:col-span-6" : "lg:col-span-10 lg:col-start-2 text-center"}>
              {/* Category & Badge Pills */}
              <div className={`flex flex-wrap items-center gap-2.5 ${!heroVisual && "justify-center"}`}>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${styles.badgeBg}`}>
                  <Sparkles className="h-3.5 w-3.5" />
                  {category}
                </span>
                {badge && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-canvas/80 px-2.5 py-0.5 text-[11px] font-mono font-medium text-text-secondary backdrop-blur">
                    {badge}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                  <Star className="h-3 w-3 fill-emerald-500" /> Built for professional firms
                </span>
              </div>

              {/* Title */}
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl md:text-6xl md:leading-[1.08]">
                {title}
              </h1>

              {/* Subtitle */}
              <p className={`mt-5 text-base leading-relaxed text-text-secondary sm:text-lg md:text-xl ${!heroVisual && "mx-auto max-w-3xl"}`}>
                {subtitle}
              </p>

              {/* Action Buttons */}
              <div className={`mt-8 flex flex-wrap items-center gap-4 ${!heroVisual && "justify-center"}`}>
                <Link
                  href="/sign-up"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-background shadow-lg shadow-brand/20 transition-all hover:bg-brand/90 hover:shadow-brand/30 hover:-translate-y-0.5"
                >
                  Start your free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/solutions"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-canvas px-6 text-sm font-semibold text-text-primary shadow-sm transition-all hover:bg-canvas-subtle hover:border-border-hover"
                >
                  Explore Practice Solutions
                </Link>
              </div>

              {/* What a new organization gets, all true of the product today */}
              <ul className={`mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/40 pt-6 text-xs text-text-secondary ${!heroVisual && "justify-center"}`}>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 30-day free trial</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> No credit card</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Clients answer without an account</li>
              </ul>
            </div>

            {/* Right Hero Visual Column */}
            {heroVisual && (
              <div className="lg:col-span-6 flex justify-center lg:justify-end">
                {heroVisual}
              </div>
            )}
          </div>

          {/* Stats Bar */}
          {stats && stats.length > 0 && (
            <div className="mt-16 grid grid-cols-2 gap-4 rounded-3xl border border-border/80 bg-canvas/70 p-6 backdrop-blur-md sm:grid-cols-4 md:p-8">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`flex flex-col ${i > 0 ? "border-l border-border/60 pl-4 md:pl-6" : ""}`}
                >
                  <span className="font-mono text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
                    {stat.value}
                  </span>
                  <span className="mt-1 text-xs font-bold text-text-secondary">
                    {stat.label}
                  </span>
                  {stat.detail && (
                    <span className="mt-1 text-[11px] text-text-tertiary">
                      {stat.detail}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-[1680px] w-full px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        {/* Highlight Feature Cards (if provided) */}
        {features && features.length > 0 && (
          <section className="mb-20">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs font-mono font-bold text-brand uppercase tracking-widest">
                Core Capabilities
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                Engineered for High-Consequence Execution
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group relative flex flex-col justify-between rounded-2xl border border-border bg-canvas p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-background transition-colors">
                          <Icon className="h-5 w-5" />
                        </div>
                        {feature.badge && (
                          <span className="rounded-full bg-canvas-subtle border border-border px-2 py-0.5 text-[10px] font-mono font-bold text-text-tertiary group-hover:text-brand transition-colors">
                            {feature.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-4 text-base font-bold text-text-primary">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Detailed Page Content */}
        {children}
      </main>

      {/* Signature Landing Page Final CTA Section */}
      <section className="relative overflow-hidden bg-cta-wash border-t border-border px-6 pb-28 pt-24 text-center">
        {/* Glow orb */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-brand/10 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Join the Work Execution Revolution
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl md:text-6xl md:leading-[1.06]">
            From intent to <br className="hidden sm:inline" />completed work.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
            Find, collect, and verify the information your client work depends on — then seal it into a cryptographic proof ledger with humans in control.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-8 text-sm font-bold text-background shadow-xl shadow-brand/25 transition-all hover:bg-brand/90 hover:-translate-y-0.5"
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/solutions"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-brand/40 bg-background/80 px-8 text-sm font-semibold text-brand backdrop-blur transition-all hover:bg-background hover:border-brand"
            >
              Talk to our team
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free 30-day trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Every organization isolated in the database
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Signature Landing Page Giant Footer */}
      <footer className="bg-canvas border-t border-border px-4 sm:px-6 lg:px-8 pb-12 pt-16">
        <div className="mx-auto max-w-[1680px] w-full">
          {/* Top Wordmark Row */}
          <div className="flex items-start justify-between gap-6 border-b border-border/80 pb-12">
            <BrandLogo markOnly className="size-12 shrink-0 text-brand" />
            <span className="select-none text-[18vw] font-semibold leading-[0.8] tracking-[-0.06em] text-text-primary md:text-[150px] opacity-90">
              avenra
            </span>
          </div>

          {/* Links Directory Grid */}
          <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_2.2fr]">
            {/* Brand Column */}
            <div>
              <div className="flex items-center gap-2.5">
                <BrandLogo className="h-7 w-auto" />
              </div>
              <p className="mt-4 max-w-xs text-xs leading-relaxed text-text-secondary">
                The business work execution platform. Turning fragmented information, requests, and processes into verified completed work.
              </p>
              <p className="mt-3 text-xs font-semibold text-text-primary">
                From Intent to Completed Work.
              </p>

              {/* Status Indicator */}
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                AI reading stays off until an owner turns it on
              </div>
            </div>

            {/* Categorized Link Columns */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {/* Product */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-primary">Product</p>
                <ul className="mt-4 space-y-2.5 text-xs text-text-secondary">
                  <li><Link href="/platform" className="hover:text-brand transition-colors">Platform Hub</Link></li>
                  <li><Link href="/platform/work-engine" className="hover:text-brand transition-colors">Work State Engine</Link></li>
                  <li><Link href="/platform/verification-engine" className="hover:text-brand transition-colors">Verification Rules</Link></li>
                  <li><Link href="/platform/evidence-locker" className="hover:text-brand transition-colors">Evidence Locker</Link></li>
                  <li><Link href="/platform/document-intelligence" className="hover:text-brand transition-colors">Document AI</Link></li>
                  <li><Link href="/platform/client-portal" className="hover:text-brand transition-colors">Client Portals</Link></li>
                  <li><Link href="/platform/compliance" className="hover:text-brand transition-colors">Compliance Engine</Link></li>
                </ul>
              </div>

              {/* Solutions */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-primary">Solutions</p>
                <ul className="mt-4 space-y-2.5 text-xs text-text-secondary">
                  <li><Link href="/solutions/legal" className="hover:text-brand transition-colors">Legal Practices</Link></li>
                  <li><Link href="/solutions/accounting" className="hover:text-brand transition-colors">Accounting & Tax</Link></li>
                  <li><Link href="/solutions/consulting" className="hover:text-brand transition-colors">Consulting SOWs</Link></li>
                  <li><Link href="/solutions/financial-services" className="hover:text-brand transition-colors">Financial Lending</Link></li>
                  <li><Link href="/solutions/healthcare" className="hover:text-brand transition-colors">Healthcare Networks</Link></li>
                  <li><Link href="/solutions/managing-partners" className="hover:text-brand transition-colors">Managing Partners</Link></li>
                  <li><Link href="/solutions/security-leaders" className="hover:text-brand transition-colors">Security Leaders</Link></li>
                </ul>
              </div>

              {/* Architecture & Trust */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-primary">Architecture</p>
                <ul className="mt-4 space-y-2.5 text-xs text-text-secondary">
                  <li><Link href="/how-it-works" className="hover:text-brand transition-colors">How It Works</Link></li>
                  <li><Link href="/how-it-works/state-machines" className="hover:text-brand transition-colors">State Machines</Link></li>
                  <li><Link href="/how-it-works/architecture" className="hover:text-brand transition-colors">Spring Modulith</Link></li>
                  <li><Link href="/security" className="hover:text-brand transition-colors">Trust Center</Link></li>
                  <li><Link href="/security/tenant-isolation" className="hover:text-brand transition-colors">PostgreSQL RLS</Link></li>
                  <li><Link href="/security/cryptography" className="hover:text-brand transition-colors">Cryptography</Link></li>
                  <li><Link href="/security/whitepaper" className="hover:text-brand transition-colors">Whitepaper</Link></li>
                </ul>
              </div>

              {/* Connectors & Company */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-primary">Ecosystem</p>
                <ul className="mt-4 space-y-2.5 text-xs text-text-secondary">
                  <li><Link href="/integrations" className="hover:text-brand transition-colors">Integrations Hub</Link></li>
                  <li><Link href="/integrations/storage" className="hover:text-brand transition-colors">S3 Cloud Storage</Link></li>
                  <li><Link href="/integrations/automation" className="hover:text-brand transition-colors">Zapier & Make</Link></li>
                  <li><Link href="/integrations/api" className="hover:text-brand transition-colors">REST API & SDKs</Link></li>
                  <li><Link href="/docs" className="hover:text-brand transition-colors">Documentation</Link></li>
                  <li><Link href="/pricing" className="hover:text-brand transition-colors">Pricing & Plans</Link></li>
                  <li><Link href="/customers" className="hover:text-brand transition-colors">Customer Stories</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Copyright and Legal Row */}
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/80 pt-8 sm:flex-row text-xs text-text-secondary">
            <div>
              © {new Date().getFullYear()} Avenra Inc. All rights reserved. Sovereign work execution for enterprise operations.
            </div>
            <div className="flex gap-6">
              <Link href="/security/privacy" className="hover:text-text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/security/compliance" className="hover:text-text-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="/security" className="hover:text-text-primary transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
