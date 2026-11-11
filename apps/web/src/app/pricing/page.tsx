"use client";

import { Fragment, useState } from "react";
import {
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Building2,
  User,
  Landmark,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { InteractiveRoiCalculator } from "@/components/enterprise/InteractiveRoiCalculator";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

interface PricingTier {
  id: string;
  name: string;
  badge?: string;
  icon: typeof User;
  monthlyPrice: number | null;
  annualPrice: number | null;
  periodText: string;
  description: string;
  idealFor: string;
  features: string[];
  cta: string;
  href: string;
  highlight: boolean;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    badge: "BOUTIQUE PRACTICES",
    icon: User,
    monthlyPrice: 49,
    annualPrice: 39,
    periodText: "per seat / month",
    description: "For boutique legal, accounting, and advisory teams standardizing client intake and document verification.",
    idealFor: "Up to 5 operators standardizing early onboarding pipelines",
    features: [
      "Up to 5 active automated workflows",
      "Unlimited external client magic links (100% free)",
      "Automated follow-up cadence reminders",
      "Standard document verification (Regex, schema, format)",
      "ClamAV inline virus & malware scanning",
      "Tamper-proof evidence audit trail (90 days)",
      "Signed webhook delivery with HMAC signatures",
      "Standard email technical support",
    ],
    cta: "Start 14-Day Free Trial",
    href: "/sign-up",
    highlight: false,
  },
  {
    id: "business",
    name: "Business",
    badge: "MOST POPULAR",
    icon: Building2,
    monthlyPrice: 129,
    annualPrice: 99,
    periodText: "per seat / month",
    description: "For established practices running multi-party client deliverables with AI OCR, approvals, and direct storage export.",
    idealFor: "Growing firms needing end-to-end exception resolution and audit trails",
    features: [
      "Unlimited active workflows and parallel execution",
      "Unlimited external client magic links (100% free)",
      "AI document reading & automated OCR extraction",
      "Direct export to your cloud storage (S3 / R2 / Wasabi)",
      "Human-in-the-loop exception routing & approvals",
      "Continuous immutable evidence ledger & sealed manifests",
      "Role-based access control (Partner, Ops Lead, Reviewer)",
      "Automated webhook retries with replay protection",
      "Priority email & Slack technical support",
    ],
    cta: "Start Business Trial",
    href: "/sign-up",
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: "INSTITUTIONAL GRADE",
    icon: Landmark,
    monthlyPrice: null,
    annualPrice: null,
    periodText: "annual institutional contract",
    description: "For organizations requiring custom volume scaling, dedicated tenant isolation, SOC2 compliance packs, and custom MSAs.",
    idealFor: "Large legal, financial, and accounting firms with strict compliance",
    features: [
      "Everything in Business, with customized workflow throughput",
      "Dedicated PostgreSQL schema & tenant isolation",
      "Custom Master Services Agreement (MSA) & DPA",
      "Custom SSO / SAML 2.0 integration (Okta, Entra ID)",
      "Custom verification rule engines & declarative checks",
      "24/7 engineer-led technical escalation SLA (99.95%)",
      "White-glove migration and dedicated solutions engineer",
      "Quarterly compliance & evidence verification reviews",
    ],
    cta: "Talk to Enterprise Sales",
    href: "/solutions",
    highlight: false,
  },
];

const COMPARISON_CATEGORIES = [
  {
    name: "Core Platform & Execution",
    features: [
      { name: "Deterministic State Machine Engine", starter: "Included", business: "Included", enterprise: "Dedicated Cluster" },
      { name: "Parallel Active Workflows", starter: "5 Workflows", business: "Unlimited", enterprise: "Custom Volume" },
      { name: "External Client Magic Portals", starter: "Unlimited (Free)", business: "Unlimited (Free)", enterprise: "Unlimited (Free)" },
      { name: "Automated Cadence Reminders", starter: "Included", business: "Included", enterprise: "Custom Branding" },
      { name: "Idempotency & Replay Protection", starter: "Included", business: "Included", enterprise: "Included" },
    ],
  },
  {
    name: "Verification & Intelligence",
    features: [
      { name: "Schema & Rule-Based Checks", starter: "Standard", business: "Advanced", enterprise: "Custom Declarative" },
      { name: "AI Document Reading & OCR", starter: "—", business: "Included", enterprise: "High-Volume Pipeline" },
      { name: "Cross-Record Reconciliation", starter: "—", business: "Included", enterprise: "Custom Systems" },
      { name: "Human-in-the-Loop Approvals", starter: "Basic", business: "Multi-Role Routing", enterprise: "Custom Hierarchy" },
      { name: "Inline ClamAV Virus Scanning", starter: "Included", business: "Included", enterprise: "Included" },
    ],
  },
  {
    name: "Evidence, Storage & Custody",
    features: [
      { name: "Direct Storage Export (Your S3/R2)", starter: "—", business: "Included", enterprise: "Dedicated Bucket" },
      { name: "Cryptographic Evidence Trail", starter: "90 Days", business: "Unlimited", enterprise: "Immutable WORM" },
      { name: "Sealed Completion Manifests", starter: "Standard PDF", business: "PDF + JSON-LD", enterprise: "Auditor Export API" },
      { name: "PostgreSQL Row-Level Security", starter: "Shared Tenant RLS", business: "Shared Tenant RLS", enterprise: "Dedicated Schema" },
    ],
  },
  {
    name: "Security, Governance & Support",
    features: [
      { name: "Two-Factor Auth (TOTP)", starter: "Included", business: "Included", enterprise: "Enforced Policy" },
      { name: "Enterprise SSO (SAML 2.0)", starter: "—", business: "Add-on", enterprise: "Included (Okta/Entra)" },
      { name: "Uptime SLA Guarantee", starter: "99.5%", business: "99.9%", enterprise: "99.95% Contractual" },
      { name: "Support Channels", starter: "Standard Email", business: "Priority Email & Slack", enterprise: "Dedicated Engineer 24/7" },
      { name: "Procurement Legal MSA & DPA", starter: "Standard Terms", business: "Standard Terms", enterprise: "Custom Negotiated" },
    ],
  },
];

const FAQ_ITEMS = [
  {
    category: "Licensing",
    question: "Do our external clients have to pay for an account to upload documents?",
    answer: "No. External clients never pay and never need an account. Client magic links are 100% free and unlimited across all pricing plans. You pay only for internal operators who manage deliverables and verify work.",
  },
  {
    category: "Overages",
    question: "Are there unexpected per-gigabyte or per-deliverable overage fees?",
    answer: "No. Avenra does not charge arbitrary data ingestion penalties. Because client files stream directly to your own private cloud S3 bucket on Business and Enterprise plans, you pay cloud storage costs directly to your provider (e.g. AWS or Cloudflare) at true wholesale rates.",
  },
  {
    category: "Trials",
    question: "What is included during the 14-day free trial?",
    answer: "The 14-day free trial provides full access to all Business tier capabilities, including client magic portals, the verification engine, AI document extraction, and webhook integrations, with zero credit card required upfront.",
  },
  {
    category: "Enterprise MSAs",
    question: "Can enterprise clients negotiate custom Master Services Agreements (MSAs)?",
    answer: "Yes. Enterprise accounts include procurement review, custom legal and security MSAs, custom Data Processing Addendums (DPAs), and direct vendor onboarding support.",
  },
  {
    category: "Billing Cycles",
    question: "How does annual billing work?",
    answer: "Annual billing gives you two months free (a 20% discount across all operator seats). You can add or remove operator seats during the year with prorated adjustments.",
  },
];

function PricingHeroVisual({ billingCycle, onToggle }: { billingCycle: "annual" | "monthly"; onToggle: (cycle: "annual" | "monthly") => void }) {
  return (
    <div className="w-full max-w-xl rounded-3xl border border-border bg-background p-6 shadow-float">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-brand" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-primary">
            Plan Estimator &amp; ROI
          </span>
        </div>
        <div className="flex items-center rounded-xl bg-canvas p-1 border border-border">
          <button
            type="button"
            onClick={() => onToggle("monthly")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              billingCycle === "monthly" ? "bg-text-primary text-background shadow-soft" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => onToggle("annual")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-all flex items-center gap-1.5 ${
              billingCycle === "annual" ? "bg-text-primary text-background shadow-soft" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <span>Annual</span>
            <span className="rounded bg-success/20 px-1 py-0.2 text-[9px] font-bold text-success">-20%</span>
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border/80 bg-canvas p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-text-primary">Firm Benchmark (25 Operators)</div>
            <div className="text-[11px] text-text-secondary">Based on Top 50 CPA &amp; Law telemetry</div>
          </div>
          <span className="font-mono text-sm font-bold text-success">+$168,000 / yr net gain</span>
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2.5 text-center font-mono text-[11px]">
          <div className="rounded-xl bg-background p-2.5 border border-border/60 shadow-soft">
            <div className="text-text-secondary text-[10px] font-sans">Turnaround</div>
            <div className="text-success font-bold text-xs mt-0.5">-68%</div>
          </div>
          <div className="rounded-xl bg-background p-2.5 border border-border/60 shadow-soft">
            <div className="text-text-secondary text-[10px] font-sans">Chasing Time</div>
            <div className="text-success font-bold text-xs mt-0.5">-14 hrs/wk</div>
          </div>
          <div className="rounded-xl bg-background p-2.5 border border-border/60 shadow-soft">
            <div className="text-text-secondary text-[10px] font-sans">Audit Readiness</div>
            <div className="text-brand font-bold text-xs mt-0.5">Instant</div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-[11px] text-text-secondary pt-3 border-t border-border">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-brand" />
          <span>Transparent Seat Pricing · Zero Ingestion Fees</span>
        </span>
        <span className="font-semibold text-brand">Client Portals Free</span>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");
  const isAnnual = billingCycle === "annual";

  return (
    <MarketingLayout
      category="Transparent Investment"
      badge="Enterprise Predictability"
      variant="pricing"
      title="Predictable Pricing for Institutional Trust"
      subtitle="Invest in mathematical correctness, client speed, and zero audit risk. Unlimited client magic links and zero hidden ingestion penalties."
      breadcrumbs={[{ label: "Pricing" }]}
      heroVisual={<PricingHeroVisual billingCycle={billingCycle} onToggle={setBillingCycle} />}
      stats={[
        { value: "$0", label: "Client Surcharge", detail: "Clients access links 100% free" },
        { value: "Direct S3", label: "No Storage Markups", detail: "Files stream directly to your bucket" },
        { value: "14 Days", label: "Free Trial", detail: "Zero credit card required upfront" },
        { value: "99.95%", label: "Uptime SLA", detail: "Enterprise contract backed" },
      ]}
    >
      <div className="space-y-24">
        {/* Interactive Billing Toggle */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="inline-flex items-center rounded-2xl border border-border bg-canvas p-1.5 shadow-soft">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-xl px-5 py-2 text-xs font-semibold transition-all ${
                !isAnnual
                  ? "bg-text-primary text-background shadow-ink"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Monthly billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold transition-all ${
                isAnnual
                  ? "bg-text-primary text-background shadow-ink"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <span>Annual billing</span>
              <span className="rounded-full bg-success-surface px-2 py-0.5 text-[10px] font-bold text-success">
                SAVE 20%
              </span>
            </button>
          </div>
          <p className="text-xs text-text-secondary">
            {isAnnual ? "Billed annually · 2 months free applied" : "Billed monthly · Switch to annual anytime"}
          </p>
        </div>

        {/* Tier Cards Grid */}
        <div className="grid gap-8 lg:grid-cols-3 lg:items-stretch">
          {PRICING_TIERS.map((tier) => {
            const TierIcon = tier.icon;
            const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;
            const savingsText = isAnnual && tier.monthlyPrice && tier.annualPrice
              ? `Save $${(tier.monthlyPrice - tier.annualPrice) * 12}/yr per seat`
              : null;

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 ${
                  tier.highlight
                    ? "border-2 border-brand bg-background shadow-float ring-4 ring-brand/10 lg:-translate-y-2 z-10"
                    : "border border-border bg-canvas hover:border-brand/30 hover:bg-background hover:shadow-card"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-background shadow-brand">
                    <Sparkles className="size-3" />
                    <span>{tier.badge}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex size-8 items-center justify-center rounded-xl ${tier.highlight ? "bg-brand text-background" : "bg-brand-surface text-brand"}`}>
                        <TierIcon className="size-4" />
                      </span>
                      <h3 className="text-xl font-bold text-text-primary">{tier.name}</h3>
                    </div>
                    {!tier.highlight && tier.badge && (
                      <span className="rounded-full bg-canvas-subtle px-2.5 py-0.5 text-[10px] font-bold uppercase text-text-secondary">
                        {tier.badge}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-text-secondary min-h-[2.5rem]">
                    {tier.description}
                  </p>

                  <div className="mt-5 border-y border-border py-4">
                    <div className="flex items-baseline gap-2">
                      {price !== null ? (
                        <>
                          <span className="text-4xl font-extrabold tracking-tight text-text-primary">
                            ${price}
                          </span>
                          <span className="text-xs text-text-secondary">{tier.periodText}</span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold tracking-tight text-text-primary">Custom</span>
                      )}
                    </div>
                    {savingsText && (
                      <p className="mt-1 text-[11px] font-semibold text-success">{savingsText}</p>
                    )}
                  </div>

                  <div className="mt-3 text-[11px] font-medium text-text-secondary">
                    <span className="font-semibold text-text-primary">Ideal for: </span>
                    {tier.idealFor}
                  </div>

                  <ul className="mt-6 space-y-3 text-xs text-text-secondary">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check className="size-4 shrink-0 text-brand mt-0.5" />
                        <span className="leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-border/60">
                  <Link
                    href={tier.href}
                    className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-center text-xs font-bold transition-all shadow-soft active:scale-[0.985] ${
                      tier.highlight
                        ? "bg-brand text-background hover:bg-brand/90 hover:shadow-brand font-semibold"
                        : "border border-border bg-background text-text-primary hover:bg-canvas hover:border-text-secondary/40"
                    }`}
                  >
                    <span>{tier.cta}</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Client Guarantee Callout */}
        <div className="rounded-3xl border border-brand/30 bg-brand-surface p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-soft">
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-background shadow-brand">
              <Zap className="size-6" />
            </span>
            <div>
              <h4 className="text-base font-bold text-text-primary">
                External Client Magic Links Are Always 100% Free &amp; Unlimited
              </h4>
              <p className="mt-0.5 text-xs text-text-secondary">
                You never pay per-client fees or upload surcharges. Only internal team operators who configure workflows and verify deliverables require a seat.
              </p>
            </div>
          </div>
          <Link
            href="/sign-up"
            className="shrink-0 rounded-xl bg-text-primary px-5 py-2.5 text-xs font-semibold text-background shadow-ink hover:bg-black transition-all"
          >
            Start Free Trial
          </Link>
        </div>

        {/* Feature Comparison Matrix */}
        <div className="rounded-3xl border border-border bg-canvas p-6 sm:p-10 shadow-card">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-brand">
                Comprehensive Plan Breakdown
              </div>
              <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                Compare Plan Capabilities
              </h2>
            </div>
            <span className="text-xs text-text-secondary">All prices in USD · Zero hidden data charges</span>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-secondary uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Capability</th>
                  <th className="py-3 px-4 text-center font-semibold">Starter</th>
                  <th className="py-3 px-4 text-center font-bold text-brand bg-brand-surface/40 rounded-t-xl">
                    Business (Most Popular)
                  </th>
                  <th className="py-3 px-4 text-center font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-[12px]">
                {COMPARISON_CATEGORIES.map((cat) => (
                  <Fragment key={cat.name}>
                    <tr className="bg-canvas/80">
                      <td colSpan={4} className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[10px] text-brand">
                        {cat.name}
                      </td>
                    </tr>
                    {cat.features.map((f) => (
                      <tr key={f.name} className="hover:bg-background/60 transition-colors">
                        <td className="py-3 px-4 font-medium text-text-primary">
                          {f.name}
                        </td>
                        <td className="py-3 px-4 text-center text-text-secondary">
                          {f.starter === "Included" ? <Check className="size-4 text-brand mx-auto" /> : f.starter}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-text-primary bg-brand-surface/20">
                          {f.business === "Included" ? <Check className="size-4 text-brand mx-auto" /> : f.business}
                        </td>
                        <td className="py-3 px-4 text-center text-text-secondary">
                          {f.enterprise === "Included" ? <Check className="size-4 text-brand mx-auto" /> : f.enterprise}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Embedded Interactive ROI Calculator */}
        <div>
          <InteractiveRoiCalculator />
        </div>

        {/* Technical & Procurement FAQ */}
        <div>
          <EnterpriseFaqAccordion
            title="Pricing, Licensing &amp; Procurement FAQ"
            subtitle="Straightforward answers regarding operator seats, client magic portals, private cloud S3 custody, and custom enterprise contracts."
            items={FAQ_ITEMS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
