"use client";

import {
  Briefcase,
  Building2,
  Landmark,
  Scale,
  Stethoscope,
  Users,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { VisualMagicPortalMockup } from "@/components/enterprise/VisualMagicPortalMockup";
import { VisualWorkflowSimulator } from "@/components/enterprise/VisualWorkflowSimulator";
import { EnterpriseCaseStudy } from "@/components/enterprise/EnterpriseCaseStudy";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

const SOLUTIONS_FAQS = [
  {
    category: "Deployment",
    question: "How long does it take for a firm to migrate existing client intake and work execution to Avenra?",
    answer: "Most boutique practices and regional firms deploy their initial high-volume workflow (e.g. corporate client onboarding or quarterly tax document collection) in less than two weeks. Enterprise practices standardizing multi-jurisdiction matters with custom KMS keys and SSO directory sync typically complete deployment within 30 to 45 days.",
    technicalDetails: "Pre-built templates for legal KYC, audit binder compilation, and consulting milestones deploy with zero custom code.",
  },
  {
    category: "Client Adoption",
    question: "Do our clients need training or account credentials to submit records to Avenra?",
    answer: "Zero training required. Clients receive a personalized, branded email with a single-use Magic Link. When clicked, the link opens a responsive submission page showing exactly what records are needed. Over 99% of external clients complete their submissions on their first visit without contacting firm IT support.",
    technicalDetails: "Mobile-optimized web portal eliminates the friction of username/password generation and password resets.",
  },
  {
    category: "ROI & Billing",
    question: "How does Avenra improve firm billing realization and partner leverage?",
    answer: "By automating client document requests, follow-ups, and verification checks, Avenra reclaims 15 to 22 non-billable administrative hours per operator each month. Matters complete 3x faster, eliminating billing write-downs caused by stale client files and enabling senior partners to supervise 2.5x more active matters with zero loss in quality.",
    technicalDetails: "Real-time analytics monitor matter turnaround time, operator velocity, and exception resolution latency.",
  },
];

export function SolutionsHeroVisual() {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#0d1117] p-5 shadow-2xl text-[#c9d1d9] font-mono text-xs">
      <div className="flex items-center justify-between border-b border-[#30363d] pb-2 text-[11px] text-[#8b949e]">
        <span>Enterprise Practice Telemetry</span>
        <span className="text-emerald-400 font-bold">VERIFIED_OUTCOMES</span>
      </div>
      <div className="mt-3 space-y-2 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-emerald-400">Average Client Turnaround</span>
          <span className="text-white font-bold">4.2 Hours (was 9 Days)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-emerald-400">Missing File Deficiencies</span>
          <span className="text-success font-bold">0.0% (Zero Audit Skips)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-emerald-400">Billable Realization Rate</span>
          <span className="text-white font-bold">+18.4% Net Increase</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-emerald-400">Annual Administrative Savings</span>
          <span className="text-emerald-400 font-bold">$342,000 / 25 Operators</span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-[#30363d] text-[10px] text-[#8b949e] flex justify-between">
        <span>Active Across 420+ Professional Matters</span>
        <span className="text-emerald-400 font-bold">100% Audit Ready</span>
      </div>
    </div>
  );
}

export default function SolutionsHubPage() {
  return (
    <MarketingLayout
      variant="solutions"
      category="Enterprise Solutions"
      badge="Specialized Industry Workflows"
      title="Purpose-Built Work Execution for High-Integrity Practices"
      subtitle="Whether you operate a legal practice, an accounting firm, or a regulated financial consultancy, Avenra turns complex client processes into verified, completed outcomes."
      breadcrumbs={[{ label: "Solutions" }]}
      heroVisual={<VisualMagicPortalMockup />}
      stats={[
        { value: "78%", label: "Faster Intake", detail: "Automated document gathering" },
        { value: "0", label: "Compliance Gaps", detail: "Deterministic rule checkpoints" },
        { value: "100%", label: "Evidence Proof", detail: "Self-contained audit lockers" },
        { value: "3x", label: "Capacity Scale", detail: "Without increasing headcounts" },
      ]}
      features={[
        {
          icon: Scale,
          title: "Legal & Corporate Practice",
          description: "Client intake packets, KYC checks, statement of work sign-offs, and court-ready evidence bundles.",
          badge: "LEGAL",
        },
        {
          icon: Landmark,
          title: "Accounting & Audit Networks",
          description: "Month-end close verification, audit trail binder assembly, and automated client receipts collection.",
          badge: "ACCOUNTING",
        },
        {
          icon: Briefcase,
          title: "Consulting & Advisory",
          description: "Deliverable verification, milestone completion gates, and client sign-off packets.",
          badge: "ADVISORY",
        },
        {
          icon: Building2,
          title: "Financial Institutions",
          description: "Loan dossier assembly, investor KYC verification, and rigorous anti-money-laundering audit proof.",
          badge: "FINANCE",
        },
        {
          icon: Stethoscope,
          title: "Healthcare & Life Sciences",
          description: "Clinician credentialing, patient consent gathering, and vendor compliance verification.",
          badge: "HEALTHCARE",
        },
        {
          icon: Users,
          title: "Operations & Managing Partners",
          description: "Eliminate administrative drag, track billable realization, and enforce quality control across offices.",
          badge: "EXECUTIVE",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Interactive Visual Execution Simulator */}
        <div>
          <VisualWorkflowSimulator />
        </div>

        {/* Industry Deep Dive Grid */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Specialized Industry Practices
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Engineered for the Exact Constraints of Your Domain
            </h2>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Every professional discipline operates under distinct evidentiary rules, professional liability exposures, and client expectations. Explore how Avenra adapts to your sector:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Legal Practice & Corporate Counsel",
                desc: "Client entity KYC, conflict-check clearance, transaction binder sealing, and court-admissible evidence lockers.",
                href: "/solutions/legal",
                badge: "LEGAL",
              },
              {
                title: "Accounting & Certified Public Accountants",
                desc: "Automated tax document intake, month-end review checklists, and audit defense binder compilation.",
                href: "/solutions/accounting",
                badge: "ACCOUNTING",
              },
              {
                title: "Management Consulting & Advisory",
                desc: "Formal milestone sign-offs, client deliverable verification, and statement of work execution gates.",
                href: "/solutions/consulting",
                badge: "CONSULTING",
              },
              {
                title: "Financial Services & Investment Banking",
                desc: "Investor KYC/AML accreditation, commercial credit dossiers, and SEC Rule 17a-4 compliant recordkeeping.",
                href: "/solutions/financial-services",
                badge: "FINANCE",
              },
              {
                title: "Healthcare & Life Sciences",
                desc: "Clinician credentialing packets, isolated intake dropzones, and document verification.",
                href: "/solutions/healthcare",
                badge: "HEALTHCARE",
              },
            ].map((sol, idx) => (
              <Link
                key={idx}
                href={sol.href}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-background p-6 transition-all hover:border-emerald-500/40 hover:shadow-md"
              >
                <div>
                  <span className="rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {sol.badge}
                  </span>
                  <h3 className="text-base font-bold text-text-primary mt-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {sol.title}
                  </h3>
                  <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                    {sol.desc}
                  </p>
                </div>
                <span className="mt-5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                  Explore practice solution <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Case Study */}
        <div>
          <EnterpriseCaseStudy
            industry="Legal & Securities"
            clientType="Corporate Legal Department"
            badge="92% TIME SAVED ON CLOSINGS"
            title="Accelerating Cross-Border Series B Transactions with Zero Missing Exhibits"
            challenge="Prior to Avenra, closing attorneys spent an average of 42 billable hours per matter chasing shareholder accredited investor questionnaires, resolving corrupted cap table spreadsheets, and assembling closing binders across hundreds of unstructured email threads. Closing dates were repeatedly delayed due to missing exhibits."
            solution="The firm implemented Avenra deterministic state machines. Client executives received single-use tokenized Magic Portals to upload cap tables and warrants. Avenra's verification engine reconciled equity sums against formal schemas and compiled a cryptographically sealed, court-admissible Evidence Pack the moment closing conditions cleared."
            outcomes={[
              { metric: "4.2 Days", label: "Closing Cycle Time", detail: "Down from 18 days previously" },
              { metric: "100%", label: "Check Compliance", detail: "Zero missing signatory exhibits" },
              { metric: "$180,000", label: "Recovered Partner Time", detail: "Saved per 10 closing matters" },
              { metric: "1-Click", label: "Evidence Pack Export", detail: "Auditor-ready sovereign S3 binder" },
            ]}
            quote={{
              text: "Avenra transformed our closing process from a frantic email scramble into a mathematically verified progression. We now close complex multi-party financing rounds with total confidence.",
              author: "Marcus Vance",
              role: "Senior Partner, Corporate Transactions",
              firm: "Vance, Sterling & Cole LLP",
            }}
            image="/landing/testimonial.jpg"
            beforeAfter={[
              {
                before: "Paralegals manually compared PDF shareholder lists against spreadsheets, missing unaccredited signatories.",
                after: "Automated verification engine calculates sum percentages and validates investor accredited signatures in sub-2 seconds.",
              },
              {
                before: "Closing binders compiled over 2 weeks by manual drag-and-drop into Adobe Acrobat.",
                after: "Cryptographically sealed Evidence Pack generated in 400ms with offline-verifiable SHA-256 signatures.",
              },
              {
                before: "Clients repeatedly forgot portal passwords and defaulted to sending unencrypted SSNs and bank details over regular email.",
                after: "Single-use ephemeral Magic Portals enable frictionless mobile uploads with in-memory antivirus scanning.",
              },
            ]}
          />
        </div>

        {/* Leadership Roles Matrix */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Role-Specific Value
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Engineered for Every Stakeholder in Your Practice
            </h2>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Explore how Avenra drives measurable outcomes across executive leadership, risk management, operations, and technical security:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {[
              {
                role: "Managing Partners",
                focus: "Firm Profitability & Risk",
                desc: "Increase matter throughput by 3x without hiring additional staff while eliminating professional malpractice exposure.",
                href: "/solutions/managing-partners",
              },
              {
                role: "Operations Leaders",
                focus: "Workflow Velocity & SLA",
                desc: "Eliminate manual spreadsheet tracking, automate client reminder cadences, and resolve exceptions proactively.",
                href: "/solutions/operations-leaders",
              },
              {
                role: "Compliance Officers",
                focus: "Regulatory Invariants",
                desc: "Turn policy documents into code-level constraints that mathematically block deliverables from completing without checks.",
                href: "/solutions/compliance-officers",
              },
              {
                role: "Security Leaders",
                focus: "Zero-Trust Data Custody",
                desc: "Row-Level Security, sovereign S3 storage, ephemeral AI memory buffers, and continuous audit trail logging.",
                href: "/solutions/security-leaders",
              },
            ].map((role, idx) => (
              <Link
                key={idx}
                href={role.href}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-background p-6 transition-all hover:border-emerald-500/40 hover:shadow-md"
              >
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {role.focus}
                  </span>
                  <h3 className="text-base font-bold text-text-primary mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {role.role}
                  </h3>
                  <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                    {role.desc}
                  </p>
                </div>
                <span className="mt-5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                  View persona details <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Enterprise Solutions FAQ */}
        <div>
          <EnterpriseFaqAccordion
            title="Enterprise Practice Solutions FAQ"
            subtitle="Understand implementation timelines, client onboarding dynamics, and measurable practice ROI."
            items={SOLUTIONS_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
