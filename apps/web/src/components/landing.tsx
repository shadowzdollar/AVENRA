"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Database,
  FileCheck2,
  FileSearch,
  FileText,
  FolderOpen,
  Inbox,
  Landmark,
  Mail,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  UserPlus,
  Webhook,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/brand";
import { buttonClass } from "@/components/ui";
import { api, unwrap } from "@/lib/api";
import { sessionKey } from "@/lib/session";

const NAV = [
  { label: "Platform", href: "#platform" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Use cases", href: "#use-cases" },
  { label: "Plans", href: "#plans" },
];

/** Signed in people go straight to their work; nobody is redirected. */
function useSignedIn(): boolean {
  const session = useQuery({ queryKey: sessionKey, queryFn: async () => unwrap(await api.GET("/api/v1/auth/session")), retry: false });
  return session.isSuccess;
}

function Header() {
  const [open, setOpen] = useState(false);
  const signedIn = useSignedIn();
  const actions = signedIn ? (
    <Link href="/organizations" className={buttonClass("primary", "sm")}>
      Open your workspace
    </Link>
  ) : (
    <>
      <Link href="/sign-in" className={buttonClass("secondary", "sm")}>
        Sign in
      </Link>
      <Link href="/sign-up" className={buttonClass("primary", "sm")}>
        Get started
      </Link>
    </>
  );
  return (
    <header className="relative z-30 mx-auto w-[min(86%,1160px)]">
      <div className="flex h-[62px] items-center justify-between gap-6 rounded-[13px] border border-border bg-background px-[18px] shadow-card">
        <Link href="/" aria-label="Avenra home">
          <BrandLogo />
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {NAV.map((link) => (
            <a key={link.href} href={link.href} className="text-xs font-medium transition-colors hover:text-brand">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">{actions}</div>
        <button type="button" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-lg border border-border bg-background p-4 shadow-float md:hidden">
          {NAV.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="block py-2 text-sm">
              {link.label}
            </a>
          ))}
          <div className="mt-3 flex gap-2">{actions}</div>
        </div>
      ) : null}
    </header>
  );
}

/** Kinds of sources around the hero, as generic icons (ADR-039: no third-party marks). */
const ORBIT: { icon: LucideIcon; label: string; position: string }[] = [
  { icon: Mail, label: "Email", position: "left-[22%] top-[6%]" },
  { icon: FileText, label: "Documents", position: "left-[14%] top-[26%]" },
  { icon: MessageSquare, label: "Client answers", position: "left-[21%] top-[46%] max-md:hidden" },
  { icon: Inbox, label: "Requests", position: "left-[8%] top-[59%] max-md:hidden" },
  { icon: Database, label: "Records", position: "left-[20%] top-[77%]" },
  { icon: Webhook, label: "Webhooks", position: "right-[20%] top-[6%]" },
  { icon: FolderOpen, label: "Storage", position: "right-[12%] top-[24%]" },
  { icon: ShieldCheck, label: "Checks", position: "right-[19%] top-[46%] max-md:hidden" },
  { icon: FileCheck2, label: "Evidence", position: "right-[7%] top-[59%] max-md:hidden" },
  { icon: CheckCircle2, label: "Approvals", position: "right-[19%] top-[77%]" },
];

function Hero() {
  return (
    <section className="relative mx-[5px] overflow-hidden rounded-t-[7px] bg-hero-wash pt-4">
      <Header />
      <div className="relative mx-auto h-[max(600px,calc(100svh-62px))] max-w-[1440px]">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-[41%] aspect-square w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand/20 md:w-[84%]" />
          <div className="absolute left-1/2 top-[41%] aspect-square w-[105%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-brand/15 md:w-[70%]" />
          <div className="absolute left-1/2 top-[41%] aspect-square w-[83%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-brand/10 md:w-[55%]" />
        </div>
        {ORBIT.map(({ icon: Icon, label, position }) => (
          <div key={label} title={label} className={`absolute z-[6] grid size-9 place-items-center rounded-full border-4 border-background/75 bg-background shadow-card md:size-[59px] ${position}`}>
            <Icon className="size-4 text-brand md:size-6" aria-label={label} />
          </div>
        ))}
        <div className="relative z-[5] pt-10 text-center">
          <div className="inline-flex items-center gap-4 rounded-full bg-background px-3.5 py-1.5 text-[11px] shadow-soft md:text-xs">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-brand" /> People in control
            </span>
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="size-4 text-success" /> Evidence for every result
            </span>
          </div>
          <h1 className="mx-auto mt-6 text-[38px] font-semibold leading-[1.08] md:text-[52px]">
            <span className="text-brand">From intent</span> to
            <br />
            completed work.
          </h1>
          <p className="mx-auto mt-4 max-w-md px-8 text-[13px] leading-relaxed md:text-[15px]">
            Find, collect and verify the information your client work depends on, then carry it to a verified result.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/sign-up" className={`${buttonClass("primary")} h-10 px-6`}>
              Get started
            </Link>
            <a href="#how-it-works" className={`${buttonClass("secondary")} h-10 border-brand px-6 text-brand`}>
              See how it works
            </a>
          </div>
          <ActivityStack />
        </div>
      </div>
    </section>
  );
}

/** An illustration of what Avenra reports; example content, not customers. */
function ActivityStack() {
  const rows = [
    { icon: CheckCircle2, title: "Client onboarding verified", detail: "All required items accepted · evidence sealed", width: "w-[280px] md:w-[314px]", offset: "left-[30px] md:left-[77px] top-[26px] z-[3]" },
    { icon: AlertTriangle, title: "An answer needs a second look", detail: "Registration number does not match · routed to the owner", width: "w-[256px] md:w-[279px]", offset: "left-[45px] md:left-[94px] top-[87px] z-[2]" },
    { icon: Send, title: "Reminder sent", detail: "Two items still missing · link valid 6 more days", width: "w-[233px] md:w-[257px]", offset: "left-[55px] md:left-[102px] top-[147px] z-[1]" },
  ];
  return (
    <div className="relative mx-auto mt-4 h-[218px] w-[340px] text-left md:h-[227px] md:w-[470px]" aria-label="Example of Avenra's activity">
      <div aria-hidden className="absolute inset-0 -rotate-[4deg] rounded-[100px_100px_120px_120px] bg-brand-surface" />
      {rows.map(({ icon: Icon, title, detail, width, offset }) => (
        <div key={title} className={`absolute flex h-[59px] items-center gap-2.5 rounded-[9px] border border-border bg-background px-3 shadow-float ${width} ${offset}`}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-surface">
            <Icon className="size-4 text-brand" />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-[11px] font-semibold">{title}</strong>
            <span className="mt-1 block truncate text-[10px] text-text-secondary">{detail}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Audience() {
  return (
    <section className="relative z-10 mx-[5px] -mt-10 rounded-t-[55px] bg-background px-6 pb-8 pt-6 md:rounded-t-[100px] md:px-[8%]">
      <p className="text-center text-xs text-text-secondary">Built for operations teams at professional services firms</p>
      <div className="mx-auto mt-5 flex max-w-[1180px] flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[15px] font-semibold md:justify-between">
        {["Law firms", "Accounting", "Consulting", "Engineering", "Compliance", "Advisory"].map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
    </section>
  );
}

function SectionTitle({ title, subtitle, align = "center" }: { title: string; subtitle: string; align?: "center" | "left" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-xl text-center" : "max-w-xl"}>
      <h2 className="text-3xl font-semibold tracking-[-0.03em] md:text-[40px] md:leading-[1.1]">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">{subtitle}</p>
    </div>
  );
}

function Platform() {
  return (
    <section id="platform" className="mx-auto max-w-6xl px-6 py-24">
      <SectionTitle
        title="Why operations teams trust Avenra"
        subtitle="Built around the state of the work, not triggers and rules. Every step is explained, checked and backed by evidence."
      />
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        <div className="md:row-span-2">
          <div className="relative flex h-[520px] flex-col items-center overflow-hidden rounded-3xl bg-auth-wash p-6">
            <div className="mt-10 flex size-24 items-center justify-center rounded-3xl bg-background/40 shadow-float">
              <BrandLogo markOnly className="size-16" />
            </div>
            <div className="mt-10 grid w-full grid-cols-3 gap-3">
              {["Partner", "Ops lead", "Client", "Finance", "Reviewer", "Avenra"].map((role, index) => (
                <div
                  key={role}
                  className={`flex aspect-square flex-col items-center justify-center rounded-xl border border-border bg-background/80 text-[10px] font-medium text-text-secondary shadow-soft ${index % 2 ? "translate-y-4" : ""}`}
                >
                  {role === "Avenra" ? <BrandLogo markOnly className="mb-1 size-6" /> : <User className="mb-1 size-5 text-text-primary" />}
                  {role}
                </div>
              ))}
            </div>
            <span className="absolute bottom-6 inline-flex items-center gap-2 rounded-full bg-text-primary px-4 py-2 text-xs font-medium text-background">
              <Sparkles className="size-3.5" /> Approved by people
            </span>
          </div>
          <h3 className="mt-4 text-[15px] font-semibold">Human control, by design</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
            The assistant proposes; people approve. High-risk steps need their own approval, and every action is recorded.
          </p>
        </div>

        <div>
          <div className="h-[250px] overflow-hidden rounded-3xl bg-canvas p-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Collecting", ["Engagement letter", "Proof of address"]],
                ["Reviewing", ["Tax registration", "Signed agreement"]],
              ].map(([column, cards]) => (
                <div key={column as string} className="rounded-xl bg-background p-2.5 shadow-soft">
                  <p className="text-[11px] font-semibold">{column as string}</p>
                  {(cards as string[]).map((card) => (
                    <div key={card} className="mt-2 rounded-lg border border-border p-2">
                      <p className="text-[10px] font-medium">{card}</p>
                      <p className="mt-1.5 flex items-center gap-1 text-[9px] text-text-secondary">
                        <Clock className="size-2.5" />
                        Due in 3 days
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <h3 className="mt-4 text-[15px] font-semibold">Work, not applications</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">See what is complete, what is missing and what is blocked, across every client, in one place.</p>
        </div>

        <div>
          <div className="flex h-[250px] flex-col items-center justify-center rounded-3xl bg-canvas p-5">
            <div className="w-full max-w-[260px] rounded-xl bg-background p-3 shadow-card">
              <div className="flex items-center justify-between text-[10px] text-text-secondary">
                <span className="font-medium text-text-primary">Exception</span>
                <MoreHorizontal className="size-3" />
              </div>
              <div className="mt-2 flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-warning-surface">
                  <AlertTriangle className="size-3 text-warning" />
                </span>
                <p className="text-[10px] leading-snug text-text-secondary">
                  <span className="font-medium text-text-primary">Request expired incomplete.</span> Two required documents never arrived.
                </p>
              </div>
            </div>
            <span className="-mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-surface px-3 py-1.5 text-[11px] font-medium text-brand shadow-soft">
              <ShieldCheck className="size-3.5" /> Routed to the owner
            </span>
          </div>
          <h3 className="mt-4 text-[15px] font-semibold">Exceptions, explained</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">Missing, late or inconsistent information is surfaced with the reason, routed to the right person and resolved.</p>
        </div>

        <div className="md:col-span-2">
          <div className="overflow-hidden rounded-3xl bg-canvas p-5">
            <div className="rounded-xl bg-background shadow-soft">
              <p className="border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Evidence trail</p>
              <div className="border-l-2 border-brand bg-brand-surface px-4 py-2 text-[11px]">
                Result: <span className="font-semibold">All onboarding requirements accepted</span>
              </div>
              {[
                ["Certificate of incorporation", "Client upload", "Accepted"],
                ["Signed engagement letter", "Client upload", "Accepted"],
                ["Beneficial owner ID", "Client upload", "Awaiting review"],
                ["Billing contact", "Client answer", "Accepted"],
              ].map(([item, source, state]) => (
                <div key={item} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-t border-border px-4 py-2.5 text-[11px]">
                  <span>{item}</span>
                  <span className="hidden rounded-md bg-canvas px-2 py-0.5 text-[10px] text-text-secondary sm:inline">{source}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${state === "Accepted" ? "bg-success-surface text-success" : "bg-warning-surface text-warning"}`}>{state}</span>
                </div>
              ))}
            </div>
          </div>
          <h3 className="mt-4 text-[15px] font-semibold">Evidence for every result</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
            Every completion carries its sources, checks, decisions and times, sealed so that &ldquo;done&rdquo; can be proven.
          </p>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    title: "Define the work",
    body: "Say what needs to be true: “Collect and verify everything required from this client before the engagement starts.” Add what is required, who owns it and by when.",
  },
  {
    title: "Collect and request",
    body: "Send a client one secure link for exactly what is missing. No account needed; reminders follow automatically until it is complete.",
  },
  {
    title: "Verify and resolve",
    body: "Answers and documents are checked for completeness and consistency; malware is scanned for. Exceptions are explained and routed, and sensitive steps wait for approval.",
  },
  {
    title: "Complete with evidence",
    body: "The work closes with a clear completion state and a sealed evidence trail, filed where you keep records if you choose.",
  },
];

function Workflow() {
  const [active, setActive] = useState(0);
  const step = STEPS[active] ?? STEPS[0]!;
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
      <SectionTitle title="Your work, carried to completion" subtitle="Four stages from intent to a verified result, with people informed and in control at every step." />
      <div className="mt-12 grid grid-cols-2 gap-2 md:grid-cols-4" role="tablist">
        {STEPS.map((item, index) => (
          <button
            key={item.title}
            type="button"
            role="tab"
            aria-selected={index === active}
            onClick={() => setActive(index)}
            className={`border-b-2 pb-3 text-[13px] transition-colors ${index === active ? "border-text-primary font-medium" : "border-border text-text-secondary hover:text-text-primary"}`}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="mt-8 rounded-[32px] bg-canvas p-3">
        <div className="grid gap-6 rounded-3xl border border-border bg-background p-8 md:grid-cols-[0.8fr_1.2fr]" role="tabpanel">
          <div className="flex flex-col">
            <p className="text-xs font-medium text-brand">Step {active + 1}</p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight">{step.title}</h3>
            <div className="flex-1" />
            <p className="mt-10 max-w-sm text-sm leading-relaxed text-text-secondary">{step.body}</p>
            <Link href="/sign-up" className={`${buttonClass("ink")} mt-6 w-fit`}>
              Get started
            </Link>
          </div>
          <FlowCanvas />
        </div>
      </div>
    </section>
  );
}

function FlowNode({ icon: Icon, label, title, tone, chips, className }: { icon: LucideIcon; label: string; title: string; tone: string; chips?: string[]; className: string }) {
  return (
    <div className={`absolute w-44 rounded-xl border border-border bg-background p-2.5 shadow-soft md:w-48 ${className}`}>
      <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${tone}`}>
        <Icon className="size-3.5" />
        {label}
      </span>
      <p className="mt-1.5 text-[11px]">{title}</p>
      {chips ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {chips.map((chip) => (
            <span key={chip} className="rounded border border-border px-1.5 py-0.5 text-[9px] text-text-secondary">
              {chip}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FlowCanvas() {
  return (
    <div className="relative h-[400px] overflow-hidden rounded-2xl bg-canvas bg-grid" aria-hidden>
      <FlowNode icon={Target} label="Intent" title="Onboard the client before the engagement" tone="text-brand" className="left-4 top-6" />
      <FlowNode icon={ShieldCheck} label="Verify" title="Check what was collected" tone="text-success" chips={["Identity", "Tax ID", "Contract", "Billing"]} className="left-4 top-[160px]" />
      <FlowNode icon={Sparkles} label="Plan" title="Assistant proposes what to ask" tone="text-warning" className="left-4 top-[300px]" />
      <FlowNode icon={Send} label="Request" title="Ask the client for missing documents" tone="text-brand" className="left-[200px] top-[60px] md:left-[300px]" />
      <FlowNode icon={AlertTriangle} label="Exception" title="Route a mismatch to its owner" tone="text-warning" className="left-[200px] top-[170px] md:left-[300px]" />
      <FlowNode icon={CheckCircle2} label="Complete" title="Seal the evidence and file it" tone="text-success" className="left-[200px] top-[280px] md:left-[300px]" />
    </div>
  );
}

const USE_CASES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: UserPlus, title: "Client onboarding made reliable.", body: "Collect, verify and approve everything a new client engagement needs, without chasing." },
  { icon: FolderOpen, title: "Document collection, finished.", body: "Request, track and check documents across clients until every requirement is met." },
  { icon: BarChart3, title: "Recurring reporting on time.", body: "Gather inputs from people each cycle, reconcile them, and deliver with evidence." },
  { icon: FileSearch, title: "Compliance evidence, ready.", body: "Assemble verifiable evidence for audits and reviews, with a complete trail of every check." },
];

function UseCases() {
  return (
    <section id="use-cases" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="max-w-md text-3xl font-semibold tracking-[-0.03em] md:text-[34px] md:leading-[1.15]">Discover how Avenra moves client work forward.</h2>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {USE_CASES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex h-[300px] flex-col rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-card">
            <Icon className="size-11 text-brand" strokeWidth={1.25} />
            <div className="flex-1" />
            <h3 className="text-[15px] font-semibold">{title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">{body}</p>
            <a href="#how-it-works" className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium">
              See how it works
              <span className="flex size-5 items-center justify-center rounded-full bg-text-primary text-background">
                <ArrowRight className="size-3" />
              </span>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

const CONNECTIONS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Mail, title: "Email and secure links", body: "Clients answer and upload through one link per request. No account, no password." },
  { icon: Webhook, title: "Signed webhooks", body: "Tell your CRM or practice system when work completes or an answer arrives, signed and retried." },
  { icon: FolderOpen, title: "Storage export", body: "File the proof of completed work in your own S3-compatible bucket, checked after writing." },
];

function Connections() {
  return (
    <section className="bg-canvas py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionTitle title="Connected to the systems you already use" subtitle="Avenra does not replace your CRM, documents or email. It connects to them and turns the information they hold into finished work." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {CONNECTIONS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-background p-6 shadow-soft">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-surface">
                <Icon className="size-5 text-brand" />
              </span>
              <h3 className="mt-5 text-[15px] font-semibold">{title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The plans' limits as the billing module defines them (ADR-037); prices are agreed, not listed. */
const PLANS: { icon: LucideIcon; name: string; description: string; featured?: boolean; features: string[]; action: string }[] = [
  {
    icon: User,
    name: "Starter",
    description: "For smaller teams beginning with a few kinds of work.",
    features: ["5 members", "100 pieces of open work", "2 integrations", "5 GB of documents", "500 assistant calls a month", "30-day trial"],
    action: "Start a trial",
  },
  {
    icon: Building2,
    name: "Business",
    description: "For firms running Avenra across projects and teams.",
    featured: true,
    features: ["25 members", "1,000 pieces of open work", "10 integrations", "50 GB of documents", "5,000 assistant calls a month", "Upgrade from your workspace"],
    action: "Start a trial",
  },
  {
    icon: Landmark,
    name: "Enterprise",
    description: "For organizations that need more scale and governance.",
    features: ["No set limits", "Everything in Business", "Agreed with us"],
    action: "Create an account",
  },
];

function Plans() {
  return (
    <section id="plans" className="mx-auto max-w-6xl px-6 py-24">
      <SectionTitle title="Plans that grow with the work" subtitle="Start on a 30-day trial. Your records stay yours and readable whatever your plan." />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {PLANS.map(({ icon: Icon, name, description, featured, features, action }) => (
          <div key={name} className={`flex flex-col rounded-3xl p-7 ${featured ? "border border-border bg-canvas shadow-card" : ""}`} data-testid={`landing-plan-${name}`}>
            <div className="flex items-center gap-2">
              <Icon className="size-5" />
              <span className="font-semibold">{name}</span>
            </div>
            <p className="mt-3 text-[13px] text-text-secondary">{description}</p>
            <ul className="mt-7 space-y-2.5">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-[13px]">
                  <span className="flex size-4 items-center justify-center rounded-full bg-canvas">
                    <Check className="size-2.5" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="flex-1" />
            <Link href="/sign-up" className={`${buttonClass(featured ? "ink" : "secondary")} mt-10 h-10 w-full`}>
              {action}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-auth-wash px-6 pb-24 pt-24 text-center">
      <h2 className="mx-auto max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.035em] md:text-6xl">
        From intent to <br />
        completed work.
      </h2>
      <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-text-secondary">Give Avenra a defined piece of business work. Get back a verified result, and the evidence to prove it.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/sign-up" className={`${buttonClass("ink")} h-10 px-6`}>
          Get started
        </Link>
        <Link href="/sign-in" className={`${buttonClass("secondary")} h-10 px-6`}>
          Sign in
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-canvas px-6 pb-10 pt-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-6">
          <BrandLogo markOnly className="size-10" />
          <span className="select-none text-[18vw] font-semibold leading-[0.8] tracking-[-0.06em] md:text-[150px]" aria-hidden>
            avenra
          </span>
        </div>
        <div className="mt-16 grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="max-w-xs text-[13px] leading-relaxed text-text-secondary">
              The business work execution platform. Turning fragmented information, requests and processes into verified completed work.
            </p>
            <p className="mt-4 text-[12px] font-medium">From Intent to Completed Work.</p>
          </div>
          <div className="grid grid-cols-2 gap-6 border-t border-border pt-6">
            <div>
              <p className="text-[13px] font-semibold">Product</p>
              <ul className="mt-3 space-y-2 text-[12px] text-text-secondary">
                {NAV.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="hover:text-text-primary">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[13px] font-semibold">Account</p>
              <ul className="mt-3 space-y-2 text-[12px] text-text-secondary">
                <li>
                  <Link href="/sign-in" className="hover:text-text-primary">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="hover:text-text-primary">
                    Create an account
                  </Link>
                </li>
                <li>
                  <Link href="/forgot-password" className="hover:text-text-primary">
                    Reset your password
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-14 text-[12px] text-text-secondary">© {new Date().getFullYear()} Avenra. All rights reserved.</p>
      </div>
    </footer>
  );
}

/** The public page (ADR-039): the Lovable design with Avenra's own, accurate content. */
export function Landing() {
  return (
    <main className="bg-background">
      <Hero />
      <Audience />
      <Platform />
      <Workflow />
      <UseCases />
      <Connections />
      <Plans />
      <FinalCta />
      <Footer />
    </main>
  );
}
