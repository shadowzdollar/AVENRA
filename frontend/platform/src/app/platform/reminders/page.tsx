"use client";

import {
  Clock,
  History,
  Mail,
  ShieldCheck,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";
import { EnterpriseImageCard } from "@/components/enterprise/EnterpriseImageCard";

const REMINDER_FAQS = [
  {
    category: "Cadence",
    question: "How does Avenra prevent embarrassing duplicate reminders if a client submits right as a job fires?",
    answer: "Avenra uses transactional status locks in PostgreSQL. Before sending any email, the reminder scheduler acquires a row-level lock on the request and verifies that the state is still `AWAITING_CLIENT_INPUT`. If the client uploaded files or completed the portal 1 millisecond earlier, the request state has already transitioned to `EVALUATING_CHECKS`, and the reminder job immediately aborts without dispatching.",
    technicalDetails: "Zero race condition emails. Enforced via SELECT FOR UPDATE SKIP LOCKED in Spring Scheduled execution.",
  },
  {
    category: "Customization",
    question: "Can different reminder schedules be assigned based on client tier or matter urgency?",
    answer: "Yes. Reminder profiles can be configured at the organization, client, or individual deliverable level. For high-urgency M&A transactions, schedules can nudge every 24 hours with escalation to partner SMS; for standard annual accounting filings, schedules can nudge weekly over 30 days.",
    technicalDetails: "Profiles specify interval offsets (e.g., [48h, 96h, 168h]), escalation CC recipients, and automatic pause conditions.",
  },
  {
    category: "Compliance",
    question: "Does Avenra keep records of reminders for legal due diligence?",
    answer: "Yes. Every reminder dispatch records the message ID, recipient email, template version, UTC timestamp, and deliverability status directly into the work item's audit ledger. This provides incontrovertible proof that your firm exercised due diligence in requesting required records.",
    technicalDetails: "Records included in the final Evidence Locker export under `audit-summary.html`.",
  },
];

export function RemindersHeroVisual() {
  return (
    <EnterpriseImageCard
      src="/images/platform/reminders.jpg"
      alt="Adaptive Reminder Cadence and Follow-up Scheduler"
      title="Adaptive Follow-up Scheduler"
      subtitle="Automated respectful follow-up cadences with instant auto-pause on client upload"
      badge="CADENCE ACTIVE"
      badgeVariant="cyan"
      highlights={[
        { label: "Dispatch Cadence", value: "Smart Spaced" },
        { label: "Auto-Pause", value: "Instant on Upload" },
        { label: "Duplicate Sends", value: "0 Invariant" },
      ]}
    />
  );
}

export default function RemindersPage() {
  return (
    <MarketingLayout
      variant="platform"
      category="Platform Subsystem"
      badge="Automated Escalation"
      title="Intelligent Client Follow-ups & Reminders"
      subtitle="Stop chasing clients manually for missing files. Avenra schedules polite, escalating reminders with guaranteed idempotency so clients are never spammed twice."
      breadcrumbs={[
        { label: "Platform", href: "/platform" },
        { label: "Reminders & Follow-ups" },
      ]}
      heroVisual={<RemindersHeroVisual />}
      stats={[
        { value: "80%", label: "Less Follow-up Work", detail: "Automated gentle reminder cadence" },
        { value: "0", label: "Duplicate Emails", detail: "Idempotent scheduled jobs" },
        { value: "1-Click", label: "Manual Nudge", detail: "Operators can send instant reminders" },
        { value: "Full", label: "Delivery Tracking", detail: "Sent timestamps and open events recorded" },
      ]}
      features={[
        {
          icon: Clock,
          title: "Adaptive Cadence Scheduling",
          description: "Reminders dispatch on sensible schedules (e.g. Day 2, Day 5, Day 9) and halt the instant the client answers.",
          badge: "ADAPTIVE",
        },
        {
          icon: ShieldCheck,
          title: "Idempotency Protection",
          description: "Both manual nudges and background jobs share identical idempotency keys, eliminating double-sends.",
          badge: "SAFE",
        },
        {
          icon: Mail,
          title: "Direct Reply Handling",
          description: "If a client replies via email instead of clicking the link, incoming emails are mapped to the work item.",
        },
        {
          icon: History,
          title: "Audited Follow-up History",
          description: "Every reminder dispatch is logged in the work timeline, providing clear evidence of due diligence.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Escalation Sequence Showcase */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Cadence Architecture
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              How the Multi-Stage Follow-up Engine Operates
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              When client requests stall, projects lose momentum and billable hours are wasted manually checking email threads. Avenra introduces automated, respectful, and deterministic escalation:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="rounded bg-brand-surface px-2 py-0.5 text-[10px] font-bold text-brand uppercase">
                Stage 1: Friendly Notice
              </span>
              <h3 className="mt-3 text-sm font-bold text-text-primary">Day 2 Polite Nudge</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Reminds the client of the pending request with a direct 1-click magic link, list of missing items, and expected completion timeframe.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="rounded bg-warning-surface px-2 py-0.5 text-[10px] font-bold text-warning uppercase">
                Stage 2: Priority Warning
              </span>
              <h3 className="mt-3 text-sm font-bold text-text-primary">Day 5 Deadline Warning</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Highlights specific upcoming deadlines (such as filing cutoffs or closing dates) and offers direct operator contact for questions.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="rounded bg-danger-surface px-2 py-0.5 text-[10px] font-bold text-danger uppercase">
                Stage 3: Executive Alert
              </span>
              <h3 className="mt-3 text-sm font-bold text-text-primary">Day 8 Partner Escalation</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Alerts internal managing partners and CCs the client executive sponsor, surfacing the delay before it impacts deliverable delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Reminders FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="Intelligent Reminders & Scheduling FAQ"
            subtitle="Learn how Avenra eliminates manual client chasing while protecting client relationships."
            items={REMINDER_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
