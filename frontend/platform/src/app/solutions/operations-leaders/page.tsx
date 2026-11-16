"use client";

import {
  Clock,
  Gauge,
  ShieldAlert,
  Zap,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseCaseStudy } from "@/components/enterprise/EnterpriseCaseStudy";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";
import { EnterpriseImageCard } from "@/components/enterprise/EnterpriseImageCard";

const OPS_FAQS = [
  {
    category: "Throughput & SLAs",
    question: "How does Avenra identify and resolve operational bottlenecks before client SLAs are breached?",
    answer: "Avenra measures state transition dwell time at each node in the deliverable graph. If a matter remains in `AWAITING_CLIENT_INPUT` or `EVALUATING_CHECKS` longer than expected thresholds, the item automatically surfaces in the Operations Leader's Central Exceptions Queue with root-cause diagnostics (e.g. 'Client failed to upload certified W-9 after 2 reminders').",
    technicalDetails: "Real-time analytics calculate median completion velocity, operator workload distribution, and automated reminder conversion rates.",
  },
  {
    category: "Staff Onboarding",
    question: "How does Avenra help new operations staff become productive without months of apprenticeship?",
    answer: "Traditional firms rely on tribal knowledge: senior staff know which email to send and which checklist to verify. Avenra codifies standard operating procedures directly into deterministic state machines. New operators cannot accidentally skip a validation check or approve an incomplete deliverable because the system physically enforces the required preconditions.",
    technicalDetails: "Cuts operator onboarding ramp time from 90 days to under 2 weeks.",
  },
  {
    category: "Capacity Scaling",
    question: "Can our firm handle 3x more client engagements without tripling administrative overhead?",
    answer: "Yes. By automating repetitive client document chasing, stream antivirus inspection, and initial schema extraction, Avenra reduces non-billable operator time by 80%. A single operations team member can oversee 150 active matters simultaneously compared to 35 in traditional spreadsheet-driven environments.",
    technicalDetails: "Enables linear revenue growth with flat administrative overhead.",
  },
];

export function OperationsHeroVisual() {
  return (
    <EnterpriseImageCard
      src="/images/solutions/operations-leaders.jpg"
      alt="Operations Control Plane and Velocity Metrics"
      title="Operations Control Plane"
      subtitle="Cross-team velocity tracking, automated exception triage, and real-time SLA compliance"
      badge="REAL TIME SLA"
      badgeVariant="success"
      highlights={[
        { label: "Active Work Items", value: "1,420 Tracked" },
        { label: "On-Time SLA", value: "99.1% Compliance" },
        { label: "Intake Latency", value: "3.4 Hours" },
      ]}
    />
  );
}

export default function OperationsLeadersSolutionsPage() {
  return (
    <MarketingLayout
      variant="solutions"
      category="Role Solutions"
      badge="Operations & COOs"
      title="Complete Throughput Visibility for Operations Leaders"
      subtitle="Eliminate operational blind spots. Track deliverable velocity, catch exception logjams in real time, and scale team capacity without proportional headcount increases."
      breadcrumbs={[
        { label: "Solutions", href: "/solutions" },
        { label: "Operations Leaders" },
      ]}
      heroVisual={<OperationsHeroVisual />}
      stats={[
        { value: "3x", label: "Work Throughput", detail: "Automated collection & validation" },
        { value: "< 15min", label: "Resolution Time", detail: "Centralized exceptions inbox" },
        { value: "Real-Time", label: "SLA Monitoring", detail: "Zero hidden backlogs" },
        { value: "80%", label: "Manual Drag Cut", detail: "Automated follow-up cadence" },
      ]}
      features={[
        {
          icon: Gauge,
          title: "Real-Time Work Analytics",
          description: "Monitor weekly completion counts, automation rates, median turnaround times, and team intervention frequencies.",
          badge: "VISIBILITY",
        },
        {
          icon: ShieldAlert,
          title: "Centralized Exceptions Inbox",
          description: "Instead of searching across hundreds of email threads, all blocked work items surface in a unified triage queue.",
          badge: "TRIAGE",
        },
        {
          icon: Clock,
          title: "Client Response Latency Tracking",
          description: "Identify exactly which clients or requests are causing project delays with automated response time metrics.",
        },
        {
          icon: Zap,
          title: "Predictable Scaling",
          description: "Standardize your firm's operating procedures into deterministic state machines that new team members execute effortlessly.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Operations Control Plane Architecture */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              The Control Plane Blueprint
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              From Reactive Firefighting to Continuous Operational Flow
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              In most professional firms, operations managers spend Monday mornings compiling spreadsheet updates from team members and attempting to find out why matters are stalled. Avenra replaces guesswork with real-time operational telemetry:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">CAPABILITY 01</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Instant Bottleneck Detection</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Visual heatmaps expose exactly which stage in your deliverable lifecycle is accumulating inventory or causing client response drag.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">CAPABILITY 02</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Unified Exception Triage</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Rather than checking individual matters, operators manage work by exception. Items with missing files, failed schemas, or client inquiries surface in one queue.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">CAPABILITY 03</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Deterministic Capacity Scale</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Because business rules and verification checkpoints are hardcoded into state machines, junior operators execute with the quality of 10-year veterans.
              </p>
            </div>
          </div>
        </div>

        {/* Operations Case Study */}
        <div>
          <EnterpriseCaseStudy
            industry="Professional Services Operations"
            clientType="Multi-Discipline Consulting Network (350 Practitioners)"
            badge="3X CAPACITY WITH 0 NEW HIRES"
            title="Standardizing Operations Across 6 Regional Offices with 99.1% On-Time SLA Delivery"
            challenge="Operating across six regional offices, the firm suffered from fragmented operational procedures. Each office used different spreadsheets and intake forms. Matters frequently fell through the cracks when staff took vacation, causing 25% of client deliverables to breach contractual SLAs."
            solution="The COO deployed Avenra as the unified firm-wide work execution engine. All client requests and deliverables were routed through standardized state machines. The central operations leadership dashboard monitored live dwell time, while the automated exceptions queue alerted regional managers to stuck matters before SLAs were breached."
            outcomes={[
              { metric: "74% → 99.1%", label: "On-Time SLA Delivery", detail: "Virtually eliminated delayed deliverable penalties" },
              { metric: "3x", label: "Matter Throughput Scale", detail: "Scaled engagement volume without hiring admin staff" },
              { metric: "15 min", label: "Median Exception Triage", detail: "Blocked work resolved within minutes" },
              { metric: "100%", label: "Standardized Process", detail: "All offices execute identical verified state machines" },
            ]}
            quote={{
              text: "Avenra gave us the single pane of glass we had been trying to build for five years. We can see every active matter across our six offices, and our operators resolve exceptions before clients even notice.",
              author: "Sandra Hayes",
              role: "Chief Operating Officer",
              firm: "Meridian Global Advisory",
            }}
            beforeAfter={[
              {
                before: "Regional practice managers spent 8 hours every Friday updating status spreadsheets for executive review.",
                after: "Real-time analytics dashboard displays live matter velocity, SLA compliance, and operator workload with zero manual prep.",
              },
              {
                before: "When staff took unexpected leave, matters sat dormant in personal email inboxes for days.",
                after: "All requests exist in a shared, tenant-isolated state machine; team members seamlessly reassign tasks in 1 click.",
              },
              {
                before: "Quality control was checked manually by partners after deliverables were already submitted to clients.",
                after: "Deterministic verification rules physically block unverified deliverables from leaving the system.",
              },
            ]}
          />
        </div>

        {/* Operations FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="Operations Leadership & Throughput FAQ"
            subtitle="Learn how Avenra gives COOs and Operations Directors total visibility and control over matter delivery."
            items={OPS_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
