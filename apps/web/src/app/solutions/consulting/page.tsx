"use client";

import {
  CheckCircle2,
  FileCheck,
  FolderLock,
  Users,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseCaseStudy } from "@/components/enterprise/EnterpriseCaseStudy";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

const CONSULTING_FAQS = [
  {
    category: "Milestone Defense",
    question: "How does Avenra eliminate client billing disputes over deliverable completion?",
    answer: "In professional advisory, clients often delay invoice payments by claiming deliverables were not formally accepted or requirements were omitted. Avenra routes finished deliverable decks, financial models, and research briefs through an explicit Client Review Packet. The client executive provides a cryptographically logged digital sign-off. Avenra seals this approval with a SHA-256 package hash, generating an indisputable proof binder tied directly to the milestone invoice.",
    technicalDetails: "Zero ambiguous verbal sign-offs. Audit trail logs client IP, timestamp, executive email, and exact file version accepted.",
  },
  {
    category: "Scope Creep",
    question: "How does Avenra prevent scope creep during multi-phase consulting engagements?",
    answer: "Each statement of work (SOW) is modeled as a state machine with explicit preconditions for each phase. Phase 2 work cannot be initiated in the system until Phase 1 deliverables have satisfied all verification gates and achieved formal client acceptance. Any additional out-of-scope requests submitted by client staff are routed to a Change Request queue rather than diluting engagement margins.",
    technicalDetails: "Enforces contractual boundary integrity between consecutive delivery sprints.",
  },
  {
    category: "Client Review Portals",
    question: "Can multiple client stakeholders (e.g. CEO, CFO, General Counsel) sign off in parallel or sequence?",
    answer: "Yes. Review links support multi-stakeholder approval matrices. You can configure sequential routing (e.g., Lead Director reviews first, followed by Chief Financial Officer sign-off) or parallel quorum voting (e.g., approval requires sign-offs from any 2 of 3 executive sponsors).",
    technicalDetails: "Real-time visibility into which stakeholder is currently holding the review token.",
  },
];

export function ConsultingHeroVisual() {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#0d1117] p-5 shadow-2xl text-[#c9d1d9] font-mono text-xs">
      <div className="flex items-center justify-between border-b border-[#30363d] pb-2 text-[11px] text-[#8b949e]">
        <span>Milestone Sign-Off Gate</span>
        <span className="text-emerald-400 font-bold">CLIENT_ACCEPTED</span>
      </div>
      <div className="mt-3 space-y-1.5 text-[11px]">
        <div className="text-emerald-400">Milestone: Phase 2 Supply Chain Optimization Model</div>
        <div className="text-[#7ee787]">✓ Final Deliverable Deck (v3.2) Reviewed</div>
        <div className="text-[#7ee787]">✓ Client Executive Acceptance: signed by COO at 16:42 UTC</div>
        <div className="text-[#7ee787]">✓ Automated Invoice Trigger Dispatched ($145,000 Milestone)</div>
        <div className="text-cyan-400">✓ Sealed Proof Package Generated: evd_phase2_signoff.zip</div>
      </div>
      <div className="mt-3 pt-2 border-t border-[#30363d] text-[10px] text-[#8b949e] flex justify-between">
        <span>Zero Unbilled Milestone Drift</span>
        <span className="text-emerald-400 font-bold">100% Margin Protected</span>
      </div>
    </div>
  );
}

export default function ConsultingSolutionsPage() {
  return (
    <MarketingLayout
      variant="solutions"
      category="Industry Solution"
      badge="Consulting & Advisory Practices"
      title="Verified Client Deliverables & Milestone Sign-Off Execution"
      subtitle="Eliminate scope disputes, delayed invoicing, and unpaid milestone write-downs. Avenra turns complex consulting engagements into verifiable milestones with explicit client sign-off gates."
      breadcrumbs={[
        { label: "Solutions", href: "/solutions" },
        { label: "Consulting & Advisory" },
      ]}
      heroVisual={<ConsultingHeroVisual />}
      stats={[
        { value: "100%", label: "Sign-Off Certainty", detail: "Explicit client approval tokens" },
        { value: "3x", label: "Faster Billing", detail: "Milestones trigger verified invoices" },
        { value: "0", label: "Scope Disputes", detail: "Complete deliverable evidence pack" },
        { value: "Full", label: "Client History", detail: "All feedback and files in one timeline" },
      ]}
      features={[
        {
          icon: CheckCircle2,
          title: "Milestone Completion Gates",
          description: "Deliverables cannot be finalized until all requirements, peer reviews, and client approvals are explicitly verified.",
          badge: "GATES",
        },
        {
          icon: FileCheck,
          title: "Client Review Packets",
          description: "Clients receive clean, branded review links to preview final deliverables, submit comments, or provide formal approval.",
          badge: "REVIEW",
        },
        {
          icon: FolderLock,
          title: "Permanent Deliverable Evidence",
          description: "Finished decks, models, and research reports are sealed into evidence lockers for permanent reference.",
        },
        {
          icon: Users,
          title: "Multi-Stakeholder Sign-Offs",
          description: "Route approvals through multiple client decision-makers in sequential or parallel order.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Milestone Lifecycle Architecture */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              The Advisory Execution Blueprint
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              From Draft Deliverable to Cash in Bank
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              In advisory engagements, ambiguous email handoffs cause client executives to delay sign-offs, question billing line items, and request out-of-scope revisions for free. Avenra establishes crystal-clear proof of delivery that both consulting partners and client CFOs respect:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">PHASE 01</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Deliverable Verification</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Consulting teams upload deliverables (spreadsheets, slide decks, models). Internal peer review checks verify that all contractual SOW requirements are satisfied.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">PHASE 02</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Single-Use Review Packet</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Client executive sponsors receive a branded, tokenized review link to inspect final assets and provide formal approval with no login friction.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">PHASE 03</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Sealed Proof & Billing Trigger</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Formal client sign-off compiles an Evidence Pack, seals the milestone in the audit ledger, and automatically fires an ERP webhook to invoice the client.
              </p>
            </div>
          </div>
        </div>

        {/* Consulting Case Study */}
        <div>
          <EnterpriseCaseStudy
            industry="Management Consulting"
            clientType="Global Strategy & Operations Advisory"
            badge="100% ON-TIME MILESTONE INVOICING"
            title="Eliminating $1.2M in Annual Milestone Write-Downs Across 85 Client Engagements"
            challenge="Managing complex organizational transformation projects across large enterprise clients frequently led to 45-day invoice delays. Client procurement teams claimed deliverables were never formally received or that additional iterations were owed before payments could be approved."
            solution="The advisory firm standardized all engagement delivery on Avenra. Every project milestone was governed by formal state machine checkpoints. Deliverables were presented through client review portals requiring explicit executive sign-offs before the next engagement phase commenced."
            outcomes={[
              { metric: "45 Days → 2 Days", label: "Invoice Approval Velocity", detail: "Immediate payment clearance upon sign-off" },
              { metric: "$1.2 Million", label: "Recovered Cash Flow", detail: "Eliminated annual dispute write-downs" },
              { metric: "0", label: "Scope Disputes", detail: "Contractual boundaries enforced by system gates" },
              { metric: "100%", label: "Client Transparency", detail: "Executives praise the structured portal experience" },
            ]}
            quote={{
              text: "Avenra completely eliminated the ambiguity around deliverable completion. Our clients love the structured review portal, and our CFO loves that milestone invoices clear in 48 hours instead of 60 days.",
              author: "Jonathan Pierce",
              role: "Senior Partner, Global Operations",
              firm: "Pierce, Harrington & Associates",
            }}
            beforeAfter={[
              {
                before: "Draft deliverables sent via email attachments with no formal tracking of which version was reviewed.",
                after: "All deliverables reviewed through versioned Magic Portals with explicit changelogs and audit timestamps.",
              },
              {
                before: "Client billing teams pushed back on invoices, claiming deliverables were still pending revision.",
                after: "Every invoice is accompanied by a sealed Avenra Evidence Pack proving exact date, time, and identity of client executive sign-off.",
              },
              {
                before: "Engagement managers spent 15 hours per week manually compiling weekly status reports in PowerPoint.",
                after: "Real-time state machine dashboard surfaces live milestone progress and pending client reviews automatically.",
              },
            ]}
          />
        </div>

        {/* Consulting FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="Consulting & Advisory Solutions FAQ"
            subtitle="Explore how Avenra protects consulting margins, accelerates cash flow, and eliminates client disputes."
            items={CONSULTING_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
