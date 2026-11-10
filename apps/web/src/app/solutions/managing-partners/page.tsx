"use client";

import {
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Users,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { InteractiveRoiCalculator } from "@/components/enterprise/InteractiveRoiCalculator";
import { EnterpriseCaseStudy } from "@/components/enterprise/EnterpriseCaseStudy";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

const PARTNER_FAQS = [
  {
    category: "Firm Economics",
    question: "How does Avenra directly increase billable realization and partner profitability?",
    answer: "In professional firms, realization drops when engagements stall in Work-in-Progress (WIP) waiting for client files, leading to scope write-downs and fee disputes. By compressing client document collection from 14 days to 4 hours and providing cryptographic proof of milestone completion, matters finish 3x faster. Senior partners can supervise 2.5x more active billable matters with zero dilution in quality.",
    technicalDetails: "Increases net realization by 12% to 18% and reduces Days Sales Outstanding (DSO) by 35 days.",
  },
  {
    category: "Malpractice Armor",
    question: "How does Avenra protect firm equity and partners from professional liability claims?",
    answer: "Most malpractice claims arise from missed filing deadlines, lost client documents, or junior associates cutting corners on checks during crunch periods. Avenra converts standard operating procedures into mathematical state invariants. Work cannot be marked complete if a required disclosure or checkpoint is missing. If a dispute ever arises, the sealed Evidence Pack provides unassailable, FRE 902 certified proof that your firm adhered to the professional standard of care.",
    technicalDetails: "Self-authenticating SHA-256 evidence packages protect against client breach-of-contract claims.",
  },
  {
    category: "Competitive Advantage",
    question: "How do corporate clients respond to Avenra compared to traditional client portals?",
    answer: "Corporate executives and general counsel despise clunky portals requiring yet another username and password. Avenra's passwordless Magic Portals provide an ultra-clean, mobile-first experience that delights clients. Over 95% of corporate clients report that Avenra makes their external counsel or accounting firm feel modern, efficient, and technologically superior.",
    technicalDetails: "Branded with your firm's identity, logos, and custom domain URL.",
  },
];

export function ManagingPartnersHeroVisual() {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#0d1117] p-5 shadow-2xl text-[#c9d1d9] font-mono text-xs">
      <div className="flex items-center justify-between border-b border-[#30363d] pb-2 text-[11px] text-[#8b949e]">
        <span>Partner Profitability & Leverage</span>
        <span className="text-emerald-400 font-bold">REVENUE_EXPANSION</span>
      </div>
      <div className="mt-3 space-y-2 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-emerald-400">Average Realization Rate</span>
          <span className="text-white font-bold">94.2% (was 81.6%)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-emerald-400">Partner Matter Capacity</span>
          <span className="text-success font-bold">2.4x Active Engagements</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-emerald-400">Days Sales Outstanding (DSO)</span>
          <span className="text-white font-bold">22 Days (down from 58)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-emerald-400">Annual Recovered Billable Time</span>
          <span className="text-emerald-400 font-bold">$780,000 / Practice Group</span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-[#30363d] text-[10px] text-[#8b949e] flex justify-between">
        <span>Zero Malpractice Deficiencies</span>
        <span className="text-emerald-400 font-bold">Partner Equity Protected</span>
      </div>
    </div>
  );
}

export default function ManagingPartnersSolutionsPage() {
  return (
    <MarketingLayout
      variant="solutions"
      category="Role Solutions"
      badge="Managing Partners & Leadership"
      title="Accelerate Realization, Expand Capacity & Protect Firm Reputation"
      subtitle="For managing partners and firm leadership: reduce work-in-progress latency, bill faster with verified milestone proof, and scale firm profits without linear headcount expansion."
      breadcrumbs={[
        { label: "Solutions", href: "/solutions" },
        { label: "Managing Partners" },
      ]}
      heroVisual={<ManagingPartnersHeroVisual />}
      stats={[
        { value: "35%", label: "Faster Invoicing", detail: "Immediate proof of completion" },
        { value: "Zero", label: "Client Surprises", detail: "Transparent milestone tracking" },
        { value: "40%", label: "Capacity Expansion", detail: "Without linear hiring costs" },
        { value: "100%", label: "Brand Protection", detail: "Verified quality before delivery" },
      ]}
      features={[
        {
          icon: TrendingUp,
          title: "Shorter Work-in-Progress Cycles",
          description: "Cut the time between client request and delivered outcome by eliminating multi-day information collection delays.",
          badge: "VELOCITY",
        },
        {
          icon: CheckCircle2,
          title: "Dispute-Free Invoicing",
          description: "Attach cryptographic evidence packs to client invoices, proving every scope requirement was met and approved.",
          badge: "CASH FLOW",
        },
        {
          icon: ShieldCheck,
          title: "Reputational Risk Armor",
          description: "Ensure junior staff and contractors cannot skip essential quality checks or deliver unverified work.",
        },
        {
          icon: Users,
          title: "Superior Client Experience",
          description: "Delight corporate clients with modern, passwordless request links that make collaboration effortless.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Practice Economics Architecture */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              The Firm Profitability Engine
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Breaking the Linear Relationship Between Headcount and Revenue
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              Traditional professional services firms are trapped in linear economics: to grow revenues by 30%, you must hire 30% more billable staff, bloating overhead and training burdens. Avenra changes firm leverage:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">PILLAR 01</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Eliminate Non-Billable Drag</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Automated document collection and schema verification eliminate 15+ non-billable administrative hours per practitioner every month.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">PILLAR 02</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Accelerate Cash Realization</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Client deliverables complete in days rather than weeks, triggering milestone billing immediately and reducing unpaid aging receivables.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">PILLAR 03</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Scale Senior Partner Leverage</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Because quality gates and verification checks are hardcoded into the system, partners can supervise 2.5x more active matters with zero risk.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Practice ROI Calculator */}
        <div>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Interactive Financial Impact Model
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Calculate Your Practice Group&apos;s Return on Investment
            </h2>
            <p className="mt-1 text-xs text-text-secondary md:text-sm">
              Adjust your firm&apos;s practitioner headcount, monthly matter volume, and average hourly billing rate to project annual reclaimed revenue.
            </p>
          </div>
          <InteractiveRoiCalculator />
        </div>

        {/* Partner Case Study */}
        <div>
          <EnterpriseCaseStudy
            industry="Multi-Office Law & Tax Advisory"
            clientType="Managing Partner Executive Committee (120 Attorneys & CPAs)"
            badge="+22% ANNUAL PRACTICE PROFITABILITY"
            title="How a 120-Practitioner Firm Reclaimed $1.4M in Lost Billable Realization"
            challenge="The firm's executive committee identified that realization rates had dropped from 88% to 79% over three years. Partners were writing down thousands of dollars per matter due to client delays in sending financial records, while associates spent unbillable hours assembling binders and chasing emails."
            solution="The Managing Partner mandated Avenra across all corporate, tax, and estate planning groups. All matter onboarding and deliverable handoffs were placed on deterministic state machines. Client document turnaround plummeted, and verified Evidence Packs accompanied every final invoice."
            outcomes={[
              { metric: "79% → 94%", label: "Average Realization", detail: "Eliminated client dispute write-downs" },
              { metric: "$1.4 Million", label: "Annual Profit Impact", detail: "Direct increase in partner distributable income" },
              { metric: "2.4x", label: "Partner Matter Leverage", detail: "Partners handle more matters with lower stress" },
              { metric: "Zero", label: "Malpractice Claims", detail: "100% verified compliance audit records" },
            ]}
            quote={{
              text: "Avenra was the highest-ROI operational investment we have made in the last decade. It paid for itself in the first thirty days and permanently increased our firm's profit margins.",
              author: "Harrison Sterling, JD, CPA",
              role: "Managing Partner",
              firm: "Sterling, Cole & Hawthorne LLP",
            }}
            beforeAfter={[
              {
                before: "Partners spent hours negotiating fee discounts with disgruntled clients whose closings were delayed.",
                after: "Clients receive transparent, real-time portal updates and praise the firm for closing matters ahead of schedule.",
              },
              {
                before: "Associates logged hundreds of write-off hours spent calling clients and tracking missing PDF attachments.",
                after: "Automated Magic Portals and polite reminder schedules handle all document gathering automatically.",
              },
              {
                before: "Firm leadership had no real-time visibility into which practice groups were bottlenecked.",
                after: "Central executive dashboard shows live matter velocity, SLA compliance, and billable realization across all offices.",
              },
            ]}
          />
        </div>

        {/* Managing Partner FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="Managing Partner & Executive Leadership FAQ"
            subtitle="Straightforward answers regarding firm valuation, partner compensation impact, and enterprise security."
            items={PARTNER_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
