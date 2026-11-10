"use client";

import { useState } from "react";
import {
  Check,
  ShieldCheck,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { InteractiveRoiCalculator } from "@/components/enterprise/InteractiveRoiCalculator";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function PricingHeroVisual() {
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");

  return (
    <div className="w-full max-w-xl rounded-2xl border border-yellow-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-yellow-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            ENTERPRISE ROI ESTIMATOR
          </span>
        </div>
        <div className="flex items-center rounded-lg bg-canvas p-1 border border-border">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`rounded px-2.5 py-1 font-mono text-[11px] transition-colors ${
              billingCycle === "monthly" ? "bg-yellow-500 text-black font-bold" : "text-text-secondary"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`rounded px-2.5 py-1 font-mono text-[11px] transition-colors flex items-center gap-1 ${
              billingCycle === "annual" ? "bg-yellow-500 text-black font-bold" : "text-text-secondary"
            }`}
          >
            Annual <span className="text-[9px] text-emerald-400 font-bold">(-20%)</span>
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border/80 bg-canvas p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-text-primary">Average Firm Transformation (40 Staff)</div>
            <div className="text-[11px] text-text-secondary">Based on Top 50 CPA & Law telemetry</div>
          </div>
          <span className="font-mono text-sm font-bold text-emerald-400">+$248,000 / yr</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
          <div className="rounded-lg bg-canvas-subtle p-2 border border-border/60">
            <div className="text-text-tertiary text-[10px]">Turnaround</div>
            <div className="text-emerald-400 font-bold text-xs">-68%</div>
          </div>
          <div className="rounded-lg bg-canvas-subtle p-2 border border-border/60">
            <div className="text-text-tertiary text-[10px]">Follow-up Time</div>
            <div className="text-emerald-400 font-bold text-xs">-14 hrs/wk</div>
          </div>
          <div className="rounded-lg bg-canvas-subtle p-2 border border-border/60">
            <div className="text-text-tertiary text-[10px]">Audit Prep</div>
            <div className="text-emerald-400 font-bold text-xs">Instant</div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-yellow-400" /> Transparent Seat Pricing • No Hidden Ingestion Fees
        </span>
        <span className="font-mono">Enterprise Grade</span>
      </div>
    </div>
  );
}

const TIERS = [
  {
    name: "Starter",
    badge: "STARTER",
    price: "$49",
    period: "per organization / month",
    description: "For boutique legal and accounting practices standardizing client intake and document verification.",
    features: [
      "Up to 3 active workflows",
      "Client onboarding & document collection",
      "Expiring passwordless client request links",
      "Automated cadence follow-up reminders",
      "Standard verification checks (regex, schema, ClamAV)",
      "Tamper-proof evidence trail (90 days)",
      "Signed webhook events delivery",
    ],
    cta: "Start 30-Day Free Trial",
    href: "/sign-up",
    highlight: false,
  },
  {
    name: "Business",
    badge: "MOST POPULAR",
    price: "$129",
    period: "per organization / month",
    description: "For firms running Avenra across projects with exception management and storage export.",
    features: [
      "Unlimited active workflows",
      "AI document reading (opt-in per organization)",
      "Export to your S3-compatible bucket",
      "Webhook delivery with automated retries and HMAC",
      "Exception routing, human tasks & approvals",
      "Full immutable evidence history & sealed manifests",
      "Role-based capabilities and team invitations",
    ],
    cta: "Start Business Trial",
    href: "/sign-up",
    highlight: true,
  },
  {
    name: "Enterprise",
    badge: "CUSTOM",
    price: "Custom",
    period: "annual commitment",
    description: "For organizations needing advanced governance, higher limits, and custom onboarding.",
    features: [
      "Everything in Business",
      "Custom limits for workflows and storage",
      "Dedicated organization isolation controls",
      "Priority assistance with custom schema modeling",
      "Advanced audit export and analytics reporting",
      "Tailored migration and team onboarding",
      "Direct engineer-led technical support",
    ],
    cta: "Talk to our team",
    href: "/solutions",
    highlight: false,
  },
];

const COMPARISON_DIMENSIONS = [
  { category: "Core Platform", feature: "Finite State Machine Engine", starter: "Yes", pro: "Yes", enterprise: "Yes" },
  { category: "Core Platform", feature: "Unlimited Client Magic Links", starter: "Yes", pro: "Yes", enterprise: "Yes" },
  { category: "Core Platform", feature: "Inline ClamAV Virus Scanning", starter: "Yes", pro: "Yes", enterprise: "Yes" },
  { category: "Verification", feature: "Rule & Schema Verification", starter: "Standard", pro: "Advanced", enterprise: "Custom Declarative" },
  { category: "Verification", feature: "AI Document Reading (Opt-In)", starter: "—", pro: "Included", enterprise: "High Volume" },
  { category: "Storage", feature: "S3 Storage Export (Your Bucket)", starter: "—", pro: "Yes", enterprise: "Yes" },
  { category: "Storage", feature: "Sealed Completion Manifests", starter: "90 Days", pro: "Unlimited", enterprise: "Unlimited" },
  { category: "Security", feature: "PostgreSQL Row-Level Security", starter: "Yes", pro: "Yes", enterprise: "Yes" },
  { category: "Security", feature: "Append-Only Audit Ledger", starter: "Yes", pro: "Yes", enterprise: "Yes" },
  { category: "Security", feature: "TOTP Two-Step Verification", starter: "Yes", pro: "Yes", enterprise: "Yes" },
  { category: "Support", feature: "Support Channels", starter: "Email", pro: "Priority Email", enterprise: "Dedicated Team" },
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
    answer: "No. Avenra does not charge arbitrary data ingestion penalties. Because client files stream directly to your own private cloud S3 bucket on Professional and Enterprise plans, you pay cloud storage costs directly to your provider (e.g. AWS or Cloudflare) at true wholesale rates.",
  },
  {
    category: "Trials",
    question: "What is included during the 30-day free trial?",
    answer: "The 30-day free trial provides full access to all Professional tier capabilities, including client magic portals, the verification engine, AI document extraction, and webhook integrations, with zero credit card required upfront.",
  },
  {
    category: "Enterprise MSAs",
    question: "Can enterprise clients negotiate custom Master Services Agreements (MSAs)?",
    answer: "Yes. Enterprise accounts include procurement review, custom legal and security MSAs, custom Data Processing Addendums (DPAs), and direct vendor onboarding support.",
  },
];

export default function PricingPage() {
  return (
    <MarketingLayout
      category="Transparent Investment"
      badge="Enterprise Predictability"
      variant="pricing"
      title="Predictable Pricing for Institutional Trust"
      subtitle="Invest in mathematical correctness, client speed, and zero audit risk. Unlimited client magic links and zero hidden ingestion penalties."
      breadcrumbs={[{ label: "Pricing" }]}
      heroVisual={<PricingHeroVisual />}
      stats={[
        { value: "$0", label: "Client Surcharge", detail: "Clients access links 100% free" },
        { value: "Direct S3", label: "No Storage Markups", detail: "Files go straight to your bucket" },
        { value: "14 Days", label: "Free Trial", detail: "No credit card required" },
        { value: "Continuous", label: "Uptime SLA", detail: "Enterprise contract backed" },
      ]}
    >
      <div className="space-y-20">
        {/* Tier Cards Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col justify-between rounded-3xl border p-8 md:p-10 transition-all ${
                tier.highlight
                  ? "border-yellow-500/50 bg-canvas shadow-2xl ring-1 ring-yellow-500/20"
                  : "border-border bg-canvas hover:border-border-hover"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-yellow-500 px-4 py-1 text-[11px] font-bold text-black uppercase tracking-wider">
                  {tier.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-text-primary">{tier.name}</h3>
                  {!tier.highlight && (
                    <span className="font-mono text-[10px] font-bold text-text-tertiary uppercase">
                      {tier.badge}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-text-secondary min-h-[3rem]">
                  {tier.description}
                </p>

                <div className="mt-6 border-y border-border py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-extrabold tracking-tight text-text-primary">
                      {tier.price}
                    </span>
                    <span className="text-xs text-text-tertiary font-mono">{tier.period}</span>
                  </div>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-text-secondary">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-yellow-400 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href={tier.href}
                  className={`block w-full rounded-xl py-3 text-center text-xs font-bold transition-all shadow-sm ${
                    tier.highlight
                      ? "bg-yellow-500 text-black hover:bg-yellow-400 font-extrabold"
                      : "bg-canvas-subtle border border-border text-text-primary hover:bg-border/40"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Matrix */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="font-mono text-xs font-bold text-yellow-400 uppercase tracking-widest">
                Comprehensive Comparison
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                Compare Plan Capabilities
              </h2>
            </div>
            <span className="font-mono text-xs text-text-tertiary">All prices in USD</span>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-tertiary uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4 text-center">Starter</th>
                  <th className="py-3 px-4 text-center text-yellow-400 font-bold">Professional</th>
                  <th className="py-3 px-4 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                {COMPARISON_DIMENSIONS.map((row) => (
                  <tr key={row.feature} className="hover:bg-canvas-subtle">
                    <td className="py-3.5 px-4 font-sans text-xs font-medium text-text-primary">
                      <span className="text-[10px] text-text-tertiary block font-mono uppercase">{row.category}</span>
                      {row.feature}
                    </td>
                    <td className="py-3.5 px-4 text-center text-text-secondary">{row.starter}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-yellow-400">{row.pro}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-400">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Embedded Interactive ROI Calculator */}
        <div>
          <InteractiveRoiCalculator />
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Pricing & Procurement FAQ"
            subtitle="Straightforward answers regarding seat licensing, storage custody, and custom enterprise contracts."
            items={FAQ_ITEMS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
