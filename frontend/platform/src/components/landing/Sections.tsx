"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Building2,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  FileCheck,
  FileSearch,
  FolderOpen,
  Landmark,
  Lock,
  MoreHorizontal,
  MousePointer2,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brand";
import { IntegrationBubble } from "./Integrations";
import { LinkButton } from "./button";
const testimonial = "/landing/testimonial.jpg";

function SectionTitle({ title, sub, align = "center" }: { title: string; sub: string; align?: "center" | "left" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-xl text-center" : "max-w-xl"}>
      <h2 className="text-3xl font-semibold tracking-[-0.03em] text-text-primary md:text-[40px] md:leading-[1.1]">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">{sub}</p>
    </div>
  );
}

/* ---------------- Platform (bento) ---------------- */
export function Platform() {
  return (
    <section id="platform" className="mx-auto max-w-[1680px] w-full px-4 sm:px-6 lg:px-8 py-24">
      <SectionTitle
        title="Why operations teams trust Avenra"
        sub="Built around the state of the work — not triggers and rules. Every step is explained, verified, and backed by evidence."
      />
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {/* Human control */}
        <div className="md:row-span-2">
          <div className="relative flex h-[520px] flex-col items-center overflow-hidden rounded-3xl bg-feature-wash p-6">
            <div className="mt-10 flex size-24 items-center justify-center rounded-3xl bg-background/30 shadow-float backdrop-blur">
              <BrandLogo markOnly className="size-16" />
            </div>
            <div className="mt-10 grid w-full grid-cols-3 gap-3">
              {["Partner", "Ops lead", "Client", "Finance", "Reviewer", "Avenra"].map((r, i) => (
                <div key={r} className={`flex aspect-square flex-col items-center justify-center rounded-xl border border-border bg-background/80 text-[10px] font-medium text-text-secondary shadow-soft ${i % 2 ? "translate-y-4" : ""}`}>
                  {r === "Avenra" ? <BrandLogo markOnly className="mb-1 size-6" /> : <User className="mb-1 size-5 text-text-primary" />}
                  {r}
                </div>
              ))}
            </div>
            <span className="absolute bottom-6 inline-flex items-center gap-2 rounded-full bg-text-primary px-4 py-2 text-xs font-medium text-background shadow-ink">
              <Sparkles className="size-3.5" /> Human-approved execution
            </span>
          </div>
          <h3 className="mt-4 text-[15px] font-semibold">Human control, by design</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
            Sensitive actions pause for approval. Every person sees what Avenra is doing, why, and what it needs from them.
          </p>
        </div>

        {/* Work board */}
        <div>
          <div className="h-[250px] overflow-hidden rounded-3xl bg-canvas p-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Collecting", "4", [["Engagement letter", "Northwind"], ["Proof of address", "Halden & Co."]]],
                ["Verifying", "3", [["Tax registration", "Meridian"], ["Signed SOW", "Brightline"]]],
              ].map(([col, n, items]) => (
                <div key={col as string} className="rounded-xl bg-background p-2.5 shadow-soft">
                  <div className="flex items-center justify-between text-[11px] font-semibold">{col as string}<span className="text-text-secondary">{n as string}</span></div>
                  {(items as string[][]).map(([t, c]) => (
                    <div key={t} className="mt-2 rounded-lg border border-border p-2">
                      <p className="text-[10px] font-medium">{t}</p>
                      <p className="mt-0.5 text-[9px] text-text-secondary">{c}</p>
                      <div className="mt-1.5 flex items-center gap-1 text-[9px] text-text-secondary"><Clock className="size-2.5" />Due Oct 30</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <h3 className="mt-4 text-[15px] font-semibold">Work, not applications</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
            See what&apos;s complete, what&apos;s missing, and what&apos;s blocked — across every client and project, in one place.
          </p>
        </div>

        {/* Exceptions */}
        <div>
          <div className="flex h-[250px] flex-col items-center justify-center rounded-3xl bg-canvas p-5">
            <div className="w-full max-w-[260px] rounded-xl bg-background p-3 shadow-card">
              <div className="flex items-center justify-between text-[10px] text-text-secondary"><span className="font-medium text-text-primary">Exception</span><MoreHorizontal className="size-3" /></div>
              <div className="mt-2 flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-warning-surface"><AlertTriangle className="size-3 text-warning" /></span>
                <p className="text-[10px] leading-snug text-text-secondary"><span className="font-medium text-text-primary">VAT ID mismatch.</span> Invoice shows GB 482 1190, registry returns GB 482 1109.</p>
              </div>
              <div className="mt-2 flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-canvas text-[8px] font-semibold">JM</span>
                <p className="text-[10px] leading-snug text-text-secondary">Routed to client finance contact for confirmation.</p>
              </div>
            </div>
            <span className="-mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-surface px-3 py-1.5 text-[11px] font-medium text-brand shadow-soft">
              <ShieldCheck className="size-3.5" /> Explain this exception
            </span>
          </div>
          <h3 className="mt-4 text-[15px] font-semibold">Exceptions, explained</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
            Inconsistent or ambiguous information is surfaced with the reason, routed to the right person, and resolved.
          </p>
        </div>

        {/* Evidence */}
        <div className="md:col-span-2">
          <div className="overflow-hidden rounded-3xl bg-canvas p-5">
            <div className="rounded-xl bg-background shadow-soft">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Evidence trail</p>
                <span className="rounded-md border border-border px-2 py-0.5 text-[10px]">Northwind Legal · Q4</span>
              </div>
              <div className="border-l-2 border-brand bg-brand-surface px-4 py-2 text-[11px]">Outcome: <span className="font-semibold">All onboarding requirements verified</span></div>
              {[
                ["Certificate of incorporation", "Client upload", "Verified", "09:42"],
                ["Signed engagement letter", "Client upload", "Verified", "10:15"],
                ["Beneficial owner ID", "Client upload", "Pending review", "11:03"],
                ["Billing contact", "Client answer", "Verified", "11:20"],
              ].map(([d, s, st, t]) => (
                <div key={d} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-t border-border px-4 py-2.5 text-[11px]">
                  <span className="flex items-center gap-2"><span className="size-3 rounded border border-border" />{d}</span>
                  <span className="hidden rounded-md bg-canvas px-2 py-0.5 text-[10px] text-text-secondary sm:inline">{s}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${st === "Verified" ? "bg-success-surface text-success" : "bg-warning-surface text-warning"}`}>{st}</span>
                  <span className="tabular-nums text-text-secondary">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <h3 className="mt-4 text-[15px] font-semibold">Evidence for every result</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
            Every completion carries its sources, checks, approvals, and timestamps — so &ldquo;done&rdquo; actually means done.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Workflow tabs ---------------- */
const steps = [
  { tab: "Define the outcome", title: "Define the outcome", body: "Tell Avenra what needs to be true — \"Collect and verify everything required from this client before the next milestone.\" It works out the requirements, people, systems, and deadlines." },
  { tab: "Collect & request", title: "Find and collect", body: "Avenra searches connected sources for what already exists, identifies what's missing, and sends clear requests to the right people — then follows up." },
  { tab: "Verify & resolve", title: "Verify and resolve", body: "Completeness, consistency, formats, and relationships between records are checked. Exceptions are explained and routed — sensitive actions pause for approval." },
  { tab: "Complete with evidence", title: "Complete with evidence", body: "Permitted actions are executed, the outcome is verified, and the work closes with a clear completion state and a full evidence trail." },
];

export function Workflow() {
  const [active, setActive] = useState(0);
  const s = steps[active]!;
  return (
    <section id="how-it-works" className="mx-auto max-w-[1680px] w-full px-4 sm:px-6 lg:px-8 py-24">
      <SectionTitle title="Your work, carried to completion" sub="Four stages from intent to a verified outcome — with people informed and in control at every step." />
      <div className="mt-12 grid grid-cols-2 gap-2 md:grid-cols-4">
        {steps.map((st, i) => (
          <button key={st.tab} onClick={() => setActive(i)} className={`border-b-2 pb-3 text-[13px] transition-colors ${i === active ? "border-text-primary font-medium text-text-primary" : "border-border text-text-secondary hover:text-text-primary"}`}>
            {st.tab}
          </button>
        ))}
      </div>
      <div className="mt-8 rounded-[32px] bg-canvas p-3">
        <div className="grid gap-6 rounded-3xl border border-border bg-background p-8 md:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col">
            <p className="text-xs font-medium text-brand">Step {active + 1}</p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight">{s.title}</h3>
            <div className="flex-1" />
            <p className="mt-10 max-w-sm text-sm leading-relaxed text-text-secondary">{s.body}</p>
            <LinkButton href="/sign-up" variant="ink" className="mt-6 w-fit">Get started</LinkButton>
          </div>
          <FlowCanvas />
        </div>
      </div>
    </section>
  );
}

function FlowNode({ icon: Icon, label, title, tone, chips, className = "" }: { icon: LucideIcon; label: string; title: string; tone: string; chips?: string[]; className?: string }) {
  return (
    <div className={`w-48 rounded-xl border bg-background p-2.5 shadow-soft ${className}`}>
      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${tone}`}><Icon className="size-3.5" />{label}</span>
        <MoreHorizontal className="size-3 text-text-secondary" />
      </div>
      <p className="mt-1.5 text-[11px] text-text-primary">{title}</p>
      {chips && <div className="mt-2 flex flex-wrap gap-1">{chips.map((c) => <span key={c} className="rounded border border-border px-1.5 py-0.5 text-[9px] text-text-secondary">{c}</span>)}</div>}
    </div>
  );
}

function FlowCanvas() {
  return (
    <div className="relative h-[400px] overflow-hidden rounded-2xl bg-canvas bg-grid">
      <svg className="absolute inset-0 size-full" aria-hidden="true">
        <path d="M110 80 V170" className="stroke-border" strokeWidth="2" fill="none" />
        <path d="M110 230 V300" className="stroke-border" strokeWidth="2" fill="none" />
        <path d="M206 200 H260 V90 H300" className="stroke-success" strokeWidth="1.5" fill="none" />
        <path d="M260 200 H300" className="stroke-success" strokeWidth="1.5" fill="none" />
        <path d="M260 200 V300 H300" className="stroke-success" strokeWidth="1.5" fill="none" />
      </svg>
      <FlowNode icon={Target} label="Intent" title="Client onboarding before milestone 2" tone="text-brand" className="absolute left-4 top-6" />
      <FlowNode icon={ShieldCheck} label="Verify" title="Validate collected information" tone="text-success" chips={["Identity", "Tax ID", "Contract", "Billing"]} className="absolute left-4 top-[160px] border-success/50" />
      <FlowNode icon={Sparkles} label="Understand" title="Extract requirements from SOW" tone="text-warning" className="absolute left-4 top-[300px]" />
      <FlowNode icon={Send} label="Request" title="Ask client for missing ID documents" tone="text-brand" className="absolute left-[300px] top-[60px]" />
      <FlowNode icon={AlertTriangle} label="Exception" title="Route VAT mismatch to finance" tone="text-warning" className="absolute left-[300px] top-[170px]" />
      <FlowNode icon={CheckCircle2} label="Execute" title="Create matter in practice system" tone="text-success" className="absolute left-[300px] top-[280px]" />
      <span className="absolute left-[220px] top-[210px] flex items-center gap-1 rounded-full bg-text-primary px-2 py-1 text-[10px] text-background shadow-ink">
        <MousePointer2 className="size-3" />Ops lead
      </span>
    </div>
  );
}

/* ---------------- Use cases & Real-World Workflows ---------------- */

type IndustryCategory = "all" | "legal" | "accounting" | "compliance";

interface WorkflowCardData {
  id: string;
  category: "legal" | "accounting" | "compliance";
  categoryLabel: string;
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
  renderMockup: () => React.ReactNode;
}

const workflowCases: WorkflowCardData[] = [
  {
    id: "onboarding",
    category: "legal",
    categoryLabel: "Legal & Advisory Intake",
    icon: UserPlus,
    title: "Client onboarding made reliable.",
    body: "Collect, verify, and approve everything a new client engagement needs — without chasing documents, missed IDs, or stalled billing.",
    href: "/solutions/legal",
    renderMockup: () => (
      <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-canvas p-4 text-xs shadow-soft">
        <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-brand-surface text-brand">
              <UserPlus className="size-3.5" />
            </span>
            <span className="font-semibold text-text-primary">Engagement Intake #ONB-419</span>
          </div>
          <span className="rounded-full bg-success-surface px-2 py-0.5 text-[10px] font-semibold text-success">
            3/3 Verified
          </span>
        </div>
        <div className="space-y-2 py-2">
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-2.5 py-1.5">
            <span className="text-[11px] font-medium text-text-primary">Engagement Letter</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-text-secondary">
              DocuSign · <CheckCircle2 className="size-3.5 text-success" />
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-2.5 py-1.5">
            <span className="text-[11px] font-medium text-text-primary">Beneficial Ownership (BOI)</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-text-secondary">
              Okta Verify · <CheckCircle2 className="size-3.5 text-success" />
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-2.5 py-1.5">
            <span className="text-[11px] font-medium text-text-primary">Retainer Payment</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-text-secondary">
              $7,500 · Stripe · <CheckCircle2 className="size-3.5 text-success" />
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border/80 pt-2 text-[10px] text-text-secondary">
          <span>Turnaround: <strong className="font-semibold text-text-primary">4.8 hrs</strong> (was 14 days)</span>
          <span className="font-medium text-brand">Matter Live</span>
        </div>
      </div>
    ),
  },
  {
    id: "collection",
    category: "accounting",
    categoryLabel: "Document Intelligence",
    icon: FolderOpen,
    title: "Document collection, finished.",
    body: "Request, track, and validate client records across practice systems, inspecting signatures, tax IDs, and statements on arrival.",
    href: "/platform/document-intelligence",
    renderMockup: () => (
      <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-canvas p-4 text-xs shadow-soft">
        <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-brand-surface text-brand">
              <FileCheck className="size-3.5" />
            </span>
            <span className="font-semibold text-text-primary">Form_1040_Sched_C.pdf</span>
          </div>
          <span className="rounded-full bg-brand-surface px-2 py-0.5 text-[10px] font-semibold text-brand">
            Auto-Extracted
          </span>
        </div>
        <div className="space-y-2 py-2">
          <div className="rounded-lg border border-border bg-background p-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-secondary">EIN Validation:</span>
              <span className="font-mono font-medium text-text-primary">84-XXXX129 · Match ✓</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-text-secondary">Gross Receipts:</span>
              <span className="font-mono font-medium text-text-primary">$1,420,850 · Verified ✓</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px] text-text-secondary">
            <Lock className="size-3 text-brand" />
            <span>Encrypted in iManage &amp; SeaweedFS</span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border/80 pt-2 text-[10px] text-text-secondary">
          <span>Confidence: <strong className="font-semibold text-text-primary">99.8%</strong></span>
          <span className="font-mono text-[9px] text-text-secondary">SHA-256: 8f4a...92b1</span>
        </div>
      </div>
    ),
  },
  {
    id: "reporting",
    category: "accounting",
    categoryLabel: "Operations & Month-End",
    icon: BarChart3,
    title: "Recurring reporting on time.",
    body: "Gather cross-system inputs each cycle, reconcile variances, route exceptions to the right reviewer, and deliver with evidence.",
    href: "/solutions/accounting",
    renderMockup: () => (
      <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-canvas p-4 text-xs shadow-soft">
        <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-warning-surface text-warning">
              <Activity className="size-3.5" />
            </span>
            <span className="font-semibold text-text-primary">Q3 Distribution Cycle</span>
          </div>
          <span className="rounded-full bg-warning-surface px-2 py-0.5 text-[10px] font-semibold text-warning">
            Exception Handled
          </span>
        </div>
        <div className="space-y-2 py-2">
          <div>
            <div className="flex justify-between text-[11px] font-medium">
              <span className="text-text-secondary">Reconciliation Progress</span>
              <span className="text-text-primary">94%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full w-[94%] rounded-full bg-brand" />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background p-2 text-[10px]">
            <p className="font-medium text-text-primary">Variance Solved · Rate Discrepancy</p>
            <p className="mt-0.5 text-text-secondary">Routed to Ops Lead (Marcus O.) · Approved in 4m</p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border/80 pt-2 text-[10px] text-text-secondary">
          <span>Sources: <strong className="font-semibold text-text-primary">Xero + Karbon</strong></span>
          <span className="font-medium text-success">Balanced ✓</span>
        </div>
      </div>
    ),
  },
  {
    id: "compliance",
    category: "compliance",
    categoryLabel: "Continuous Audit Vault",
    icon: FileSearch,
    title: "Compliance evidence, ready.",
    body: "Assemble verifiable evidence for audits and statutory reviews, with a cryptographic trail linking every check to its origin.",
    href: "/platform/evidence-locker",
    renderMockup: () => (
      <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-canvas p-4 text-xs shadow-soft">
        <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-success-surface text-success">
              <ShieldCheck className="size-3.5" />
            </span>
            <span className="font-semibold text-text-primary">Audit Bundle #EV-2026-881</span>
          </div>
          <span className="rounded-full bg-success-surface px-2 py-0.5 text-[10px] font-semibold text-success">
            SOC2 / ISO Ready
          </span>
        </div>
        <div className="space-y-2 py-2">
          <div className="rounded-lg border border-border bg-background p-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-secondary">Security Controls:</span>
              <span className="font-mono font-medium text-text-primary">18 of 18 Passed ✓</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-text-secondary">Sign-off Chain:</span>
              <span className="font-mono font-medium text-text-primary">3 Partners Signed ✓</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px] text-text-secondary">
            <span className="flex items-center gap-1.5">
              <CheckCheck className="size-3.5 text-success" /> Tamper Seal Intact
            </span>
            <span className="font-mono text-[9px]">ed25519</span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border/80 pt-2 text-[10px] text-text-secondary">
          <span>Audit Export: <strong className="font-semibold text-text-primary">PDF + JSON-LD</strong></span>
          <span className="font-semibold text-brand">1-Click Export →</span>
        </div>
      </div>
    ),
  },
];

const categoryTabs: { id: IndustryCategory; label: string }[] = [
  { id: "all", label: "All Engagements" },
  { id: "legal", label: "Legal & Advisory" },
  { id: "accounting", label: "Accounting & Tax" },
  { id: "compliance", label: "Compliance & Audit" },
];

export function UseCases() {
  const [activeCategory, setActiveCategory] = useState<IndustryCategory>("all");

  const visibleCases = activeCategory === "all"
    ? workflowCases
    : workflowCases.filter((w) => w.category === activeCategory);

  return (
    <section id="use-cases" className="mx-auto max-w-[1680px] w-full px-4 sm:px-6 lg:px-8 py-24">
      {/* Header with Eyebrow, Title & Interactive Filters */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-canvas px-3.5 py-1 text-xs font-semibold text-text-secondary shadow-soft">
            <Sparkles className="size-3.5 text-brand" />
            <span className="tracking-wide uppercase">Real-World Execution</span>
          </div>
          <h2 className="mt-3.5 text-3xl font-semibold tracking-[-0.03em] text-text-primary sm:text-4xl md:text-[42px] md:leading-[1.12]">
            Discover how Avenra moves client work forward.
          </h2>
          <p className="mt-3.5 text-[15px] leading-relaxed text-text-secondary">
            Explore how modern legal, accounting, and consulting firms eliminate document chasing, orchestrate multi-party sign-offs, and seal every client outcome with verifiable proof.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-canvas p-1.5 shadow-soft">
          {categoryTabs.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-text-primary text-background shadow-ink"
                  : "text-text-secondary hover:text-text-primary hover:bg-background"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bento Grid of 4 Interactive Workflow Cards */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {visibleCases.map((u) => (
          <div
            key={u.id}
            className="group flex flex-col justify-between rounded-3xl border border-border bg-background p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-card"
          >
            {/* Top Interactive Software Micro-UI */}
            <div className="h-[210px] w-full overflow-hidden">
              {u.renderMockup()}
            </div>

            {/* Bottom Content Narrative */}
            <div className="mt-5 flex flex-1 flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-brand">
                    {u.categoryLabel}
                  </span>
                  <u.icon className="size-4 text-text-secondary transition-colors group-hover:text-brand" />
                </div>
                <h3 className="mt-2 text-[16px] font-semibold leading-snug text-text-primary group-hover:text-brand transition-colors">
                  {u.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
                  {u.body}
                </p>
              </div>

              <Link
                href={u.href}
                className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-text-primary transition-colors group-hover:text-brand"
              >
                <span>Explore workflow</span>
                <span className="flex size-5 items-center justify-center rounded-full bg-canvas text-text-primary group-hover:bg-brand group-hover:text-background transition-all">
                  <ArrowUpRight className="size-3" />
                </span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Executive KPI Strip */}
      <div className="mt-14 rounded-3xl border border-border bg-canvas p-6 sm:p-8 shadow-soft">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col border-b border-border pb-5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Intake Turnaround</span>
            <span className="mt-2 text-3xl font-bold tracking-tight text-text-primary lg:text-4xl">4.8 hrs</span>
            <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">Reduced from 14-day manual email chasing cycles</p>
          </div>
          <div className="flex flex-col border-b border-border pb-5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Verification Coverage</span>
            <span className="mt-2 text-3xl font-bold tracking-tight text-text-primary lg:text-4xl">100%</span>
            <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">Every deliverable sealed with immutable audit trail</p>
          </div>
          <div className="flex flex-col border-b border-border pb-5 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Ecosystem Partners</span>
            <span className="mt-2 text-3xl font-bold tracking-tight text-text-primary lg:text-4xl">32+</span>
            <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">Live enterprise integrations across CRM, docs, and billing</p>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Missed Deadlines</span>
            <span className="mt-2 text-3xl font-bold tracking-tight text-text-primary lg:text-4xl">0</span>
            <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">Zero dropped requirements or unverified completions</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Testimonials ---------------- */
/* Placeholder copy from the design; replace with real customers' words before launch. */
const quotes = [
  { date: "12 Sep 2026", text: "We used to spend the first two weeks of every engagement chasing documents. Avenra closes onboarding in days — and we can see exactly why something is still open.", name: "Sarah Chen", role: "Head of Operations, Northwind Legal", initials: "SC" },
  { date: "28 Sep 2026", text: "The exception handling is what sold us. It doesn't just flag a mismatch — it explains it and routes it to the person who can fix it.", name: "Marcus Okafor", role: "Practice Manager, Halden & Co.", initials: "MO" },
  { date: "06 Oct 2026", text: "Our partners trust the completion state because the evidence is right there. That's never been true of any tool we've used.", name: "Amina Uwase", role: "COO, Meridian Advisory", initials: "AU" },
];

export function Testimonials() {
  return (
    <section id="customers" className="bg-canvas py-24">
      <div className="mx-auto max-w-[1680px] w-full px-4 sm:px-6 lg:px-8">
        <SectionTitle align="left" title="Trusted by operations leaders" sub="Early design partners on what changed when work started finishing itself — verifiably." />
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          <QuoteCard q={quotes[0]!} />
          <div className="overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element -- the CSP blocks next/image's inline style */}
            <img src={testimonial} alt="Design partner portrait" loading="lazy" width={768} height={960} className="h-full min-h-[320px] w-full object-cover" />
          </div>
          <QuoteCard q={quotes[1]!} />
          <QuoteCard q={quotes[2]!} />
        </div>
      </div>
    </section>
  );
}

function QuoteCard({ q }: { q: (typeof quotes)[number] }) {
  return (
    <div className="flex min-h-[320px] flex-col rounded-2xl bg-canvas p-6">
      <p className="text-[12px] font-medium">{q.date}</p>
      <div className="flex-1" />
      <p className="text-[13px] leading-relaxed text-text-primary">&ldquo;{q.text}&rdquo;</p>
      <div className="mt-6 flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-background text-[11px] font-semibold shadow-soft">{q.initials}</span>
        <div>
          <p className="text-[13px] font-semibold">{q.name}</p>
          <p className="text-[11px] text-text-secondary">{q.role}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Integrations orbit ---------------- */
const orbit = [
  { name: "Gmail", pos: "left-[14%] top-[22%]" },
  { name: "Zapier", pos: "left-[30%] top-[46%]" },
  { name: "Make", pos: "left-[8%] top-[52%]" },
  { name: "Amazon S3", pos: "left-[22%] top-[76%]" },
  { name: "n8n", pos: "left-[43%] top-[80%]" },
  { name: "Cloudflare R2", pos: "right-[18%] top-[26%]" },
  { name: "Backblaze B2", pos: "right-[8%] top-[50%]" },
  { name: "DigitalOcean Spaces", pos: "right-[30%] top-[64%]" },
  { name: "MinIO", pos: "right-[20%] top-[82%]" },
  { name: "Wasabi", pos: "right-[40%] top-[44%]" },
];

export function IntegrationsOrbit() {
  return (
    <section className="mx-auto max-w-[1680px] w-full px-4 sm:px-6 lg:px-8 py-24">
      <SectionTitle title="Connected to the systems you already use" sub="Avenra doesn't replace your CRM, documents, or email. It connects them — and turns the information inside them into finished work." />
      <div className="relative mx-auto mt-10 h-[460px] max-w-6xl overflow-hidden">
        <div className="absolute left-1/2 top-10 size-[900px] -translate-x-1/2 rounded-full border border-border" />
        <div className="absolute left-1/2 top-[110px] size-[700px] -translate-x-1/2 rounded-full border border-border" />
        <div className="absolute left-1/2 top-[190px] size-[540px] -translate-x-1/2 rounded-full border border-dashed border-brand/20" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2">
          <div className="flex size-28 items-center justify-center rounded-full bg-background shadow-float ring-8 ring-canvas">
            <BrandLogo markOnly className="size-14" />
          </div>
        </div>
        {orbit.map((o) => (
          <div key={o.name} className={`absolute ${o.pos}`}><IntegrationBubble name={o.name} size="sm" /></div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Pricing ---------------- */
/* Prices and features from the design; confirm against the billing plans (ADR-037) before launch. */
const plans = [
  { icon: User, name: "Starter", desc: "For smaller teams beginning with a few workflows.", monthly: 49, features: ["Up to 3 active workflows", "Client onboarding & document collection", "Verification checks", "Evidence trail (90 days)", "5 integrations", "Email support"] },
  { icon: Building2, name: "Business", desc: "For firms running Avenra across projects and teams.", monthly: 129, featured: true, features: ["Unlimited workflows", "Exception routing & approvals", "Recurring reporting", "Full evidence history", "All standard integrations", "Role-based access", "Priority support"] },
  { icon: Landmark, name: "Enterprise", desc: "For organizations needing governance and isolation.", monthly: null, features: ["Everything in Business", "Advanced governance controls", "Custom governance controls", "Custom integrations", "Dedicated isolation options", "Dedicated success manager"] },
];

export function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="mx-auto max-w-[1680px] w-full px-4 sm:px-6 lg:px-8 py-24">
      <SectionTitle title="Simple, transparent pricing" sub="Start with one workflow. Expand as Avenra proves its value. No surprises." />
      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-xl bg-canvas p-1">
          {["Monthly", "Yearly"].map((p, i) => (
            <button key={p} onClick={() => setYearly(i === 1)} className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${yearly === (i === 1) ? "bg-text-primary text-background shadow-ink" : "text-text-secondary"}`}>{p}</button>
          ))}
        </div>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className={`flex flex-col rounded-3xl p-7 ${p.featured ? "border border-border bg-canvas shadow-card" : ""}`}>
            <div className="flex items-center gap-2"><p.icon className="size-5" /><span className="font-semibold">{p.name}</span></div>
            <p className="mt-3 text-[13px] text-text-secondary">{p.desc}</p>
            <p className="mt-5">
              {p.monthly ? (
                <><span className="text-3xl font-semibold tracking-tight">${yearly ? Math.round(p.monthly * 0.8) : p.monthly}</span><span className="text-[13px] text-text-secondary"> /seat/month</span></>
              ) : (
                <span className="text-3xl font-semibold tracking-tight">Custom</span>
              )}
            </p>
            <ul className="mt-7 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[13px]"><span className="flex size-4 items-center justify-center rounded-full bg-canvas"><Check className="size-2.5" /></span>{f}</li>
              ))}
            </ul>
            <div className="flex-1" />
            <LinkButton href="/sign-up" variant={p.featured ? "ink" : "soft"} size="lg" className="mt-10 w-full">{p.monthly ? "Get started" : "Talk to sales"}</LinkButton>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- CTA + Footer ---------------- */
export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-cta-wash px-6 pb-32 pt-24 text-center">
      <h2 className="mx-auto max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.035em] md:text-6xl">From intent to <br />completed work.</h2>
      <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-text-secondary">
        Give Avenra a defined piece of business work. Get back a verified outcome — and the evidence to prove it.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <LinkButton href="/sign-up" variant="ink" size="lg">Get started</LinkButton>
        <LinkButton href="/organizations" variant="soft" size="lg"><Play className="size-3.5" />See the product</LinkButton>
      </div>
      <div className="relative mx-auto mt-14 h-28 max-w-2xl">
        {([["Gmail", "left-0 top-0"], ["Amazon S3", "left-[16%] top-14"], ["Zapier", "left-1/2 top-20 -translate-x-1/2"], ["Cloudflare R2", "right-[16%] top-14"], ["n8n", "right-0 top-0"]] as const).map(([n, p]) => (
          <div key={n} className={`absolute ${p}`}><IntegrationBubble name={n} size="sm" /></div>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  const cols = {
    Product: ["Platform", "Integrations", "Security", "Changelog", "Pricing"],
    Resources: ["Documentation", "Guides", "Help center", "API reference", "Status"],
    Company: ["About", "Careers", "Privacy policy", "Terms of service", "Contact"],
  };
  return (
    <footer className="bg-canvas px-4 sm:px-6 lg:px-8 pb-10 pt-16">
      <div className="mx-auto max-w-[1680px] w-full">
        <div className="flex items-start justify-between gap-6">
          <BrandLogo markOnly className="size-10" />
          <span className="select-none text-[18vw] font-semibold leading-[0.8] tracking-[-0.06em] text-text-primary md:text-[150px]">avenra</span>
        </div>
        <div className="mt-16 grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="max-w-xs text-[13px] leading-relaxed text-text-secondary">The business work execution platform. Turning fragmented information, requests, and processes into verified completed work.</p>
            <p className="mt-4 text-[12px] font-medium">From Intent to Completed Work.</p>
          </div>
          <div className="grid grid-cols-3 gap-6 border-t border-border pt-6">
            {Object.entries(cols).map(([h, items]) => (
              <div key={h}>
                <p className="text-[13px] font-semibold">{h}</p>
                <ul className="mt-3 space-y-2">{items.map((i) => <li key={i}><a href="#" className="text-[12px] text-text-secondary hover:text-text-primary">{i}</a></li>)}</ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-14 text-[12px] text-text-secondary">© 2026 Avenra. All rights reserved.</p>
      </div>
    </footer>
  );
}
