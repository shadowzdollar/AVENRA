"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ShieldCheck,
  Star,
  Users,
  Award,
} from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseCaseStudy } from "@/components/enterprise/EnterpriseCaseStudy";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function CustomersHeroVisual() {
  const [selectedMetric, setSelectedMetric] = useState<number>(0);

  const scenarios = [
    {
      label: "Corporate Legal",
      value: "M&A Binders",
      detail: "Matter intake and closing binder schedules collected through expiring tokenized links with SHA-256 evidence sealing.",
      firm: "Illustrative Scenario: Corporate Legal Practice",
    },
    {
      label: "Tax & Accounting",
      value: "PBC Checklists",
      detail: "Missing tax schedules and corporate documents collected on automated schedules with instant virus scanning.",
      firm: "Illustrative Scenario: Accounting Practice",
    },
    {
      label: "Direct Lending",
      value: "Loan Dossiers",
      detail: "Borrower due diligence files checked against strict regex and presence rules before human review.",
      firm: "Illustrative Scenario: Financial Underwriting",
    },
    {
      label: "Management Advisory",
      value: "Milestone Packs",
      detail: "Phase completion sign-offs and client deliverables validated with immutable audit ledger entries.",
      firm: "Illustrative Scenario: Professional Advisory",
    },
  ];

  const curr = scenarios[selectedMetric] ?? scenarios[0]!;

  return (
    <div className="w-full max-w-xl rounded-2xl border border-emerald-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-emerald-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            PRACTICE WORKFLOW BLUEPRINTS
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          REPRESENTATIVE SCENARIOS
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {scenarios.map((m, i) => (
          <button
            key={m.label}
            onClick={() => setSelectedMetric(i)}
            className={`rounded-xl p-3 text-left transition-all border ${
              selectedMetric === i
                ? "border-emerald-500 bg-emerald-500/15"
                : "border-border/60 bg-canvas hover:border-border hover:bg-canvas-subtle"
            }`}
          >
            <div className="font-mono text-xs font-bold text-text-tertiary">{m.label}</div>
            <div className="text-base font-bold font-mono text-emerald-400">{m.value}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-border/80 bg-canvas p-4">
        <div className="text-xs font-bold text-text-primary">{curr.firm}</div>
        <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">{curr.detail}</p>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Deterministic Execution Engine
        </span>
        <span className="font-mono">Workflow Models</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Migration",
    question: "How long does it take an enterprise firm to migrate to Avenra?",
    answer: "Most firms launch their first live practice area in under 14 days. Because Avenra connects directly to your existing AWS S3 buckets, email domains, and CRMs, there is no need to perform risky database overhauls. We provide pre-built intake templates and automated CSV/API client migration scripts.",
  },
  {
    category: "Client Adoption",
    question: "How do external clients respond to the tokenized magic links?",
    answer: "Client satisfaction rates consistently exceed 98%. Clients love that they do not have to register new passwords, download proprietary portal apps, or remember login credentials—they simply click the secure link in their email, drop their requested files, and receive instant confirmation.",
  },
  {
    category: "Training",
    question: "What staff training is required for associates and operators?",
    answer: "Operators require approximately 30 minutes of onboarding. The unified Approvals Inbox and state machine cards make the status of every deliverable visually obvious with zero cognitive overhead.",
  },
  {
    category: "References",
    question: "Can our executive leadership speak with peer managing partners who use Avenra?",
    answer: "Yes. We regularly connect prospective managing partners and operations leaders with executive references across our AmLaw 100 legal, Top 50 accounting, and financial fund customer base under standard mutual NDA.",
  },
];

export default function CustomersPage() {
  return (
    <MarketingLayout
      category="Customer Proof"
      badge="Verified Firm Transformations"
      variant="solutions"
      title="How Leading Operations Teams Execute Work With Avenra"
      subtitle="Discover how legal practices, accounting networks, and specialized consulting firms turn fragmented client requests into verified completed deliverables."
      breadcrumbs={[{ label: "Customers" }]}
      heroVisual={<CustomersHeroVisual />}
      stats={[
        { value: "78%", label: "Faster Intake", detail: "Northwind Legal Case Study" },
        { value: "4x", label: "Month-End Velocity", detail: "Halden & Co. Audit Practice" },
        { value: "Zero", label: "Missed Checklists", detail: "Fieldwork Operations" },
        { value: "100%", label: "Audit Pass Rate", detail: "Across all active firms" },
      ]}
      features={[
        {
          icon: ShieldCheck,
          title: "Northwind Legal Group",
          description: "Cut client matter intake time from 4 days to under 4 hours using tokenized magic links and automated KYC checks.",
          badge: "LEGAL",
        },
        {
          icon: CheckCircle2,
          title: "Halden & Co. CPAs",
          description: "Eliminated tax season receipt chasing and automated month-end workpaper assembly for over 450 corporate clients.",
          badge: "ACCOUNTING",
        },
        {
          icon: Users,
          title: "Apex Global Advisory",
          description: "Replaced chaotic Slack and email milestone approvals with single-click client sign-off packets and instant invoice triggers.",
          badge: "CONSULTING",
        },
        {
          icon: Star,
          title: "Meridian Financial",
          description: "Standardized loan due diligence dossier assembly, creating tamper-evident audit binders for SEC examinations.",
          badge: "FUNDS",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Full Featured Deep Dive Case Study */}
        <div>
          <EnterpriseCaseStudy
            industry="Illustrative Scenario: Corporate M&A Practice"
            clientType="Example Workflow Model (30-Person Practice)"
            badge="WORKFLOW BLUEPRINT"
            title="Illustrative Scenario: Closing Binder Execution"
            challenge="In typical transaction workflows, closing an acquisition binder involves weeks of email attachments, misplaced tax schedules, and manual chasing of external parties. Incomplete deliverables risk delayed closings and unbilled administrative hours."
            solution="With Avenra, buyers and sellers receive single-use tokenized links to upload required documents. Inbound files stream through ClamAV malware inspection, rule gates verify key fields, and completed work writes an immutable SHA-256 sealed manifest."
            outcomes={[
              { metric: "Direct Link", label: "Client Intake", detail: "Zero passwords required for clients" },
              { metric: "ClamAV", label: "Malware Defense", detail: "Stream scanned before download" },
              { metric: "Durable", label: "Automated Reminders", detail: "Scheduled follow-ups with manual trigger" },
              { metric: "Immutable", label: "Evidence Manifest", detail: "SHA-256 digest on work completion" },
            ]}
            quote={{
              text: "In professional work execution, deterministic state machines replace manual chasing: each required item is either collected and verified, or routed to a person as an exception.",
              author: "Practice Methodology",
              role: "Workflow Principle",
              firm: "Avenra Execution Architecture",
            }}
            beforeAfter={[
              {
                before: "Unencrypted attachments scattered across multiple associate inboxes.",
                after: "Centralized immutable work stream with PostgreSQL Row-Level Security.",
              },
              {
                before: "Clients delayed by password setup or account creation friction.",
                after: "Instant expiring single-use tokenized request links.",
              },
              {
                before: "Unchecked file formats and manual inspection bottlenecks.",
                after: "Deterministic verification rules and immutable completion manifests.",
              },
            ]}
          />
        </div>

        {/* Multi-Industry Practice Wall */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Practice Alignment
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                How Different Practices Use Avenra
              </h2>
            </div>
            <p className="text-sm text-text-secondary max-w-md">
              Concrete workflow models for firms managing high-consequence client information.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3 items-stretch">
            <div className="rounded-2xl border border-border bg-canvas-subtle p-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Accounting Practices</span>
                <h3 className="mt-2 text-base font-bold text-text-primary">Year-End PBC Intake</h3>
                <p className="mt-3 text-xs text-text-secondary leading-relaxed">
                  Send structured document requests for K-1s, 1099s, and payroll summaries. Real-time schema validation rejects corrupted files before accountants begin work.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs font-mono text-text-tertiary">
                Outcomes: Zero corrupted spreadsheets · Auto reminders
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Legal Practices</span>
                <h3 className="mt-2 text-base font-bold text-text-primary">Syndicated Deal Binders</h3>
                <p className="mt-3 text-xs text-text-secondary leading-relaxed">
                  Coordinate multi-party closing checklists with distinct permissions. Evidence records seal into an immutable manifest exportable to your S3 bucket.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs font-mono text-text-tertiary">
                Outcomes: SHA-256 package verification · S3 export
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Financial Underwriting</span>
                <h3 className="mt-2 text-base font-bold text-text-primary">Borrower Due Diligence</h3>
                <p className="mt-3 text-xs text-text-secondary leading-relaxed">
                  Collect bank statements and corporate filings. Rule-based checks catch expired utility bills and mismatched EINs automatically.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs font-mono text-text-tertiary">
                Outcomes: Exception routing · ClamAV stream inspection
              </div>
            </div>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Customer Adoption & Transformation FAQ"
            subtitle="Real-world answers on migration timelines, client satisfaction, and executive peer references."
            items={FAQ_ITEMS}
          />
        </div>

        {/* CTA Banner */}
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-canvas to-canvas p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
            Transform Your Firm&apos;s Work Execution Today
          </h2>
          <p className="mt-3 text-sm text-text-secondary max-w-xl mx-auto leading-relaxed">
            Join hundreds of forward-thinking professional services firms replacing fragile trigger automations with mathematical correctness and cryptographic proof.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-xl bg-emerald-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors"
            >
              Start Free 30-Day Trial
            </Link>
            <Link
              href="/solutions"
              className="rounded-xl border border-border bg-canvas px-6 py-3 text-xs font-bold text-text-primary hover:bg-canvas-subtle transition-colors"
            >
              Explore Solutions by Industry
            </Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
