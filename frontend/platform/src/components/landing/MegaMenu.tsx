"use client";

import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  FileSearch,
  FileText,
  FolderLock,
  Inbox,
  Landmark,
  Layers,
  Lock,
  Mail,
  Scale,
  Send,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import Link from "next/link";

export type MegaMenuCategory = "platform" | "solutions" | "how-it-works" | "integrations" | "security";

interface MegaItemProps {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
  href: string;
  badge?: string | undefined;
  onClick?: (() => void) | undefined;
}

function MegaItem({ icon: Icon, title, description, href, badge, onClick }: MegaItemProps) {
  return (
    <Link
      href={href}
      {...(onClick ? { onClick } : {})}
      className="group flex items-start gap-3 rounded-xl p-2.5 transition-all duration-150 hover:bg-canvas"
    >
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-text-primary shadow-sm transition-colors group-hover:border-brand/40 group-hover:text-brand">
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-text-primary group-hover:text-brand transition-colors">
            {title}
          </span>
          {badge && (
            <span className="rounded bg-brand-surface px-1.5 py-0.5 text-[9px] font-bold text-brand">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] leading-relaxed text-text-secondary line-clamp-2">
          {description}
        </p>
      </div>
    </Link>
  );
}

export function PlatformMenu({ onClose }: { onClose?: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-12">
      <div className="md:col-span-5 flex flex-col gap-2">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          Core Engine
        </div>
        <MegaItem
          icon={Workflow}
          title="Work Execution Engine"
          description="Strict finite state machine execution. Replaces fragile triggers with verifiable business states."
          href="/platform/work-engine"
          badge="CORE"
          onClick={onClose}
        />
        <MegaItem
          icon={CheckCircle2}
          title="Verification Engine"
          description="Deterministic multi-point validation before work reaches approval. Zero silent deferrals."
          href="/platform/verification-engine"
          onClick={onClose}
        />
        <MegaItem
          icon={FolderLock}
          title="Evidence Locker"
          description="Tamper-proof audit packages with SHA-256 signatures, S3 export, and full audit provenance."
          href="/platform/evidence-locker"
          badge="PROOF"
          onClick={onClose}
        />
        <MegaItem
          icon={FileSearch}
          title="Document Intelligence"
          description="Privacy-first schema extraction from client PDFs, spreadsheets, and invoices without data leakage."
          href="/platform/document-intelligence"
          onClick={onClose}
        />
      </div>

      <div className="md:col-span-4 flex flex-col gap-2">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          Human & Agent Collaboration
        </div>
        <MegaItem
          icon={Cpu}
          title="Agent Automation"
          description="Autonomous AI workers running in restricted sandboxes under explicit permission boundaries."
          href="/platform/agent-execution"
          onClick={onClose}
        />
        <MegaItem
          icon={Inbox}
          title="Client Information Portal"
          description="Magic-link client requests to securely gather answers, files, and confirmations without logins."
          href="/platform/client-portal"
          onClick={onClose}
        />
        <MegaItem
          icon={Send}
          title="Intelligent Reminders"
          description="Automated cadence to unblock client requests without double-prompting or manual follow-ups."
          href="/platform/reminders"
          onClick={onClose}
        />
        <MegaItem
          icon={ShieldAlert}
          title="Exceptions & Approvals Inbox"
          description="Centralized exception management with audit trails and human-in-the-loop overrides."
          href="/platform/compliance"
          onClick={onClose}
        />
      </div>

      <div className="md:col-span-3 flex flex-col justify-between rounded-2xl border border-border bg-feature-wash p-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-surface px-2.5 py-1 text-[10px] font-semibold text-brand">
            <Sparkles className="size-3" /> Architecture Spotlight
          </span>
          <h4 className="mt-3 text-sm font-semibold text-text-primary">
            Why State Machines Outperform Triggers
          </h4>
          <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
            Discover why professional services firms choose state-driven systems over brittle Zapier/Make loops.
          </p>
        </div>
        <Link
          href="/how-it-works/state-machines"
          {...(onClose ? { onClick: onClose } : {})}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
        >
          Read the architectural decision <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}

export function SolutionsMenu({ onClose }: { onClose?: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-12">
      <div className="md:col-span-5 flex flex-col gap-2">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          Solutions by Industry
        </div>
        <MegaItem
          icon={Scale}
          title="Legal & Compliance Operations"
          description="Automated statement of work execution, KYC validation, retainer tracking, and audit-ready binders."
          href="/solutions/legal"
          onClick={onClose}
        />
        <MegaItem
          icon={Landmark}
          title="Accounting & Audit Firms"
          description="Month-end closing packets, receipt validation, transaction evidence, and client follow-ups."
          href="/solutions/accounting"
          onClick={onClose}
        />
        <MegaItem
          icon={Briefcase}
          title="Consulting & Advisory"
          description="Deliverable verification, client milestone sign-offs, and automated project intake workflows."
          href="/solutions/consulting"
          onClick={onClose}
        />
        <MegaItem
          icon={Building2}
          title="Financial Services & Funds"
          description="Investor onboarding, loan application pack assembly, and strict regulatory evidence trails."
          href="/solutions/financial-services"
          onClick={onClose}
        />
        <MegaItem
          icon={Stethoscope}
          title="Healthcare & Biotech Ops"
          description="Clinician credential verification, Consent gathering & document intake, and vendor compliance checks."
          href="/solutions/healthcare"
          onClick={onClose}
        />
      </div>

      <div className="md:col-span-4 flex flex-col gap-2">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          Tailored by Role
        </div>
        <MegaItem
          icon={Zap}
          title="Operations Directors"
          description="Track work throughput, eliminate manual bottlenecks, and maintain strict SLAs."
          href="/solutions/operations-leaders"
          onClick={onClose}
        />
        <MegaItem
          icon={ShieldCheck}
          title="Chief Compliance Officers"
          description="Guaranteed policy enforcement, cryptographic proof of review, and zero non-compliance."
          href="/solutions/compliance-officers"
          onClick={onClose}
        />
        <MegaItem
          icon={Users}
          title="Managing Partners"
          description="Accelerate billing velocity, reduce client response latency, and protect firm reputation."
          href="/solutions/managing-partners"
          onClick={onClose}
        />
        <MegaItem
          icon={Lock}
          title="IT & Security Leaders"
          description="Complete data custody, strict PostgreSQL RLS, dedicated S3 storage, and tenant isolation."
          href="/solutions/security-leaders"
          onClick={onClose}
        />
      </div>

      <div className="md:col-span-3 flex flex-col justify-between rounded-2xl border border-border bg-feature-wash p-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
            Case Study
          </span>
          <h4 className="mt-2 text-sm font-semibold text-text-primary">
            Northwind Legal Cut Client Intake Delays by 78%
          </h4>
          <p className="mt-2 text-xs text-text-secondary leading-relaxed">
            See how a 120-person legal practice automated their intake verification and eliminated missing document ping-pong.
          </p>
        </div>
        <Link
          href="/customers"
          {...(onClose ? { onClick: onClose } : {})}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
        >
          View all customer stories <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}

export function HowItWorksMenu({ onClose }: { onClose?: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-12">
      <div className="md:col-span-5 flex flex-col gap-2">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          The 4-Stage Work Cycle
        </div>
        <MegaItem
          icon={Inbox}
          title="1. Capture Intent"
          description="Ingest requests from email, forms, or APIs. Automatically structure unstructured business demands."
          href="/how-it-works/intent-capture"
          onClick={onClose}
        />
        <MegaItem
          icon={FileText}
          title="2. Collect & Validate"
          description="Gather missing documents and data via secure client request portals with automated verification."
          href="/how-it-works/information-gathering"
          onClick={onClose}
        />
        <MegaItem
          icon={CheckCircle2}
          title="3. Execute & Verify"
          description="Multi-point rule validation and deterministic agent execution before final approval."
          href="/how-it-works/verification"
          onClick={onClose}
        />
        <MegaItem
          icon={FolderLock}
          title="4. Prove & Archive"
          description="Generate cryptographically signed evidence packs archived directly to your own cloud storage."
          href="/how-it-works/evidence-delivery"
          onClick={onClose}
        />
      </div>

      <div className="md:col-span-4 flex flex-col gap-2">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          Deep Principles
        </div>
        <MegaItem
          icon={Layers}
          title="Finite State Machines"
          description="Why state transitions guarantee consistency and prevent unauthorized status jumps."
          href="/how-it-works/state-machines"
          onClick={onClose}
        />
        <MegaItem
          icon={Shield}
          title="Human-in-the-Loop Safeguards"
          description="AI suggests; authorized operators decide. Full approval gates for all consequential actions."
          href="/how-it-works/human-in-the-loop"
          onClick={onClose}
        />
        <MegaItem
          icon={Server}
          title="Idempotency & Retries"
          description="All external side-effects are classified and safe from accidental duplication."
          href="/how-it-works/idempotency"
          onClick={onClose}
        />
        <MegaItem
          icon={Cpu}
          title="Air-Gapped AI Isolation"
          description="The AI service owns zero business data and operates purely as a stateless inference worker."
          href="/how-it-works/ai-safety"
          onClick={onClose}
        />
      </div>

      <div className="md:col-span-3 flex flex-col justify-between rounded-2xl border border-border bg-feature-wash p-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
            Engineering Authority
          </span>
          <h4 className="mt-2 text-sm font-semibold text-text-primary">
            Avenra Architecture Guidelines
          </h4>
          <p className="mt-2 text-xs text-text-secondary leading-relaxed">
            Read how we engineered a high-integrity platform from first principles with contract-first OpenAPI and strict tenant boundaries.
          </p>
        </div>
        <Link
          href="/how-it-works/architecture"
          {...(onClose ? { onClick: onClose } : {})}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
        >
          Explore system architecture <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}

export function IntegrationsMenu({ onClose }: { onClose?: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-12">
      <div className="md:col-span-6 flex flex-col gap-2">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          Ecosystem Connections
        </div>
        <MegaItem
          icon={Database}
          title="S3-Compatible Cloud Storage"
          description="Archive evidence packages directly to AWS S3, Cloudflare R2, MinIO, Backblaze B2, or Wasabi."
          href="/integrations/storage"
          onClick={onClose}
        />
        <MegaItem
          icon={Workflow}
          title="Workflow Automation"
          description="Trigger and receive verified work payloads with Zapier, Make, and self-hosted n8n instances."
          href="/integrations/automation"
          onClick={onClose}
        />
        <MegaItem
          icon={Mail}
          title="Email & Communication"
          description="Ingest incoming client emails through Gmail and SMTP with SPF, DKIM, and DMARC verification."
          href="/integrations/communications"
          onClick={onClose}
        />
        <MegaItem
          icon={Code2}
          title="REST API & Webhooks"
          description="Full OpenAPI v1 contracts, typed TypeScript client SDKs, and signed HMAC webhooks."
          href="/integrations/api"
          onClick={onClose}
        />
      </div>

      <div className="md:col-span-6 flex flex-col justify-between rounded-2xl border border-border bg-feature-wash p-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand">
            Developer First
          </span>
          <h4 className="mt-2 text-sm font-semibold text-text-primary">
            Contract-First API Architecture
          </h4>
          <p className="mt-2 text-xs text-text-secondary leading-relaxed">
            Every endpoint is defined in open OpenAPI v1 specifications before implementation. Explore interactive API documentation, schemas, and typed SDKs.
          </p>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/docs"
            {...(onClose ? { onClick: onClose } : {})}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-brand px-4 text-xs font-semibold text-background shadow transition-colors hover:bg-brand/90"
          >
            Read API Docs
          </Link>
          <Link
            href="/integrations"
            onClick={() => onClose?.()}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-semibold text-text-primary transition-colors hover:bg-canvas"
          >
            All 10+ Integrations
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SecurityMenu({ onClose }: { onClose?: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-12">
      <div className="md:col-span-6 flex flex-col gap-2">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          Security Baseline & Trust
        </div>
        <MegaItem
          icon={Lock}
          title="Zero-Trust Tenant Isolation"
          description="Every tenant query enforces PostgreSQL Row Level Security (RLS) checked directly in the engine."
          href="/security/tenant-isolation"
          onClick={onClose}
        />
        <MegaItem
          icon={FolderLock}
          title="Cryptographic Proof & SHA-256"
          description="Immutable evidence packages with cryptographic checksums, preserving full chain of custody."
          href="/security/cryptography"
          onClick={onClose}
        />
        <MegaItem
          icon={Server}
          title="Data Custody & Local Storage"
          description="Your client documents live in your own S3 bucket. Avenra never sells or mines your records."
          href="/security/privacy"
          onClick={onClose}
        />
        <MegaItem
          icon={ShieldCheck}
          title="Compliance & Audit Alignment"
          description="Immutable audit logging, zero arbitrary status writes, and role-free explicit permissions."
          href="/security/compliance"
          onClick={onClose}
        />
      </div>

      <div className="md:col-span-6 flex flex-col justify-between rounded-2xl border border-border bg-feature-wash p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-success-surface text-success">
              <ShieldCheck className="size-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Enterprise Trust Center
            </span>
          </div>
          <h4 className="mt-3 text-sm font-semibold text-text-primary">
            Rigorous Defense-in-Depth
          </h4>
          <p className="mt-2 text-xs text-text-secondary leading-relaxed">
            From AES-256-GCM encryption key rotation to ClamAV upload malware scanning and strict CSP headers, security is an invariant, not an afterthought.
          </p>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/security"
            onClick={() => onClose?.()}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-brand px-4 text-xs font-semibold text-background shadow transition-colors hover:bg-brand/90"
          >
            Visit Trust Center
          </Link>
          <Link
            href="/security/whitepaper"
            onClick={() => onClose?.()}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-semibold text-text-primary transition-colors hover:bg-canvas"
          >
            Download Whitepaper
          </Link>
        </div>
      </div>
    </div>
  );
}
