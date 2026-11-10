"use client";

import {
  Database,
  Key,
  Lock,
  ShieldAlert,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseSecurityAuditViewer } from "@/components/enterprise/EnterpriseSecurityAuditViewer";
import { EnterpriseCaseStudy } from "@/components/enterprise/EnterpriseCaseStudy";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";
import { EnterpriseImageCard } from "@/components/enterprise/EnterpriseImageCard";

const SECURITY_LEADER_FAQS = [
  {
    category: "Zero-Trust Isolation",
    question: "Why is PostgreSQL Row-Level Security superior to traditional application-level tenant isolation?",
    answer: "Most SaaS applications isolate tenants using application-level `WHERE organization_id = ?` query filters written by software developers. A single missed filter, improper join, or SQL injection vulnerability exposes all tenant records. Avenra sets the PostgreSQL session context `app.current_organization_id` derived exclusively from cryptographically signed session cookies (ADR-005). The database kernel evaluates the RLS policy on every single query, making cross-tenant data leaks physically impossible.",
    technicalDetails: "Zero trust in client-supplied HTTP headers: reverse proxy drops all external `X-Tenant-ID` headers at the edge.",
  },
  {
    category: "Cloud Custody",
    question: "Can our infosec team verify that files never reside on third-party vendor hard drives?",
    answer: "Yes. In enterprise deployments, Avenra streams uploaded files directly to your firm's private AWS S3, Cloudflare R2, or MinIO bucket using presigned URLs or in-memory reverse-proxy streams. File binaries never touch an unencrypted disk, and your team maintains exclusive control over the KMS master encryption key.",
    technicalDetails: "Supports AWS KMS Customer Managed Keys (CMK) with multi-region replication and automated 90-day rotation.",
  },
  {
    category: "Malware & Stream Defense",
    question: "How does Avenra prevent zero-day malware or malicious macros from infecting firm storage?",
    answer: "Incoming client upload byte streams are piped directly across a local UNIX domain socket to a dedicated ClamAV antivirus container in memory before reaching storage. If an infected file or macro is detected, the stream is aborted immediately with HTTP 422 Unprocessable Entity, and an incident alert is fired.",
    technicalDetails: "Zero disk writing: files are analyzed purely in ephemeral stream buffers.",
  },
];

export function SecurityLeadersHeroVisual() {
  return (
    <EnterpriseImageCard
      src="/images/solutions/security-leaders.jpg"
      alt="Zero-Trust Infrastructure Perimeter and Key Custody"
      title="Zero-Trust Infrastructure Perimeter"
      subtitle="Kernel-level PostgreSQL tenant isolation, KMS envelope encryption, and stream antivirus defense"
      badge="RLS ENFORCED"
      badgeVariant="success"
      highlights={[
        { label: "Database Isolation", value: "PostgreSQL 18 RLS" },
        { label: "Envelope Encryption", value: "AES-256-GCM KMS" },
        { label: "Cross-Tenant Risk", value: "0 Invariant" },
      ]}
    />
  );
}

export default function SecurityLeadersSolutionsPage() {
  return (
    <MarketingLayout
      variant="solutions"
      category="Role Solutions"
      badge="IT & Security Architects"
      title="Architectural Defense-in-Depth for Enterprise CISOs & Security Leaders"
      subtitle="Complete sovereign data custody, kernel-level PostgreSQL tenant isolation, zero multi-tenant database cross-talk, and full cryptographic provenance for enterprise IT."
      breadcrumbs={[
        { label: "Solutions", href: "/solutions" },
        { label: "IT & Security Architects" },
      ]}
      heroVisual={<SecurityLeadersHeroVisual />}
      stats={[
        { value: "Postgres RLS", label: "Tenant Isolation", detail: "Enforced at kernel database level" },
        { value: "Customer S3", label: "Data Custody", detail: "Files stay in your cloud bucket" },
        { value: "AES-256", label: "Encryption", detail: "Key rotation & envelope encryption" },
        { value: "Air-Gapped", label: "AI Service", detail: "Zero model data retention" },
      ]}
      features={[
        {
          icon: Lock,
          title: "PostgreSQL Row-Level Security (RLS)",
          description: "Tenant isolation is enforced directly by database policies on every table. Client-supplied tenant IDs are never trusted.",
          badge: "ADR-005",
        },
        {
          icon: Database,
          title: "Sovereign Cloud Storage",
          description: "All uploaded files and evidence packs write directly to your designated AWS S3, Cloudflare R2, or MinIO storage bucket.",
          badge: "CUSTODY",
        },
        {
          icon: ShieldAlert,
          title: "Inline Malware Scanning",
          description: "ClamAV inspects every uploaded file stream in real time before files are permitted into permanent storage.",
        },
        {
          icon: Key,
          title: "AES-256-GCM Key Rotation",
          description: "Sensitive tokens and secrets are protected with authenticated encryption and transparent multi-key rotation schedules.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Threat Model & Perimeter Architecture */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              The Defense-in-Depth Blueprint
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Engineered to Satisfy the Most Rigorous Vendor Risk Assessments
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              When enterprise Chief Information Security Officers review traditional workflow tools like Zapier or Jira, they find critical red flags: unencrypted webhooks, shared database instances without row isolation, and vendor-owned file repositories. Avenra was engineered to pass CISO audits on day one:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">PERIMETER 01</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Kernel Tenant Isolation</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                PostgreSQL RLS ensures that cross-tenant queries are blocked inside the database engine. Even if application code has a bug, data cannot leak across tenants.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">PERIMETER 02</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Sovereign KMS Custody</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Customer files live in your private AWS S3 bucket encrypted with your KMS Key. Avenra engineers possess zero keys and zero plaintext access.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">PERIMETER 03</span>
              <h3 className="mt-2 text-sm font-bold text-text-primary">Zero-Persistence AI</h3>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Python AI microservice runs statelessly in an isolated sandbox with no attached disks or database connection. Zero client bytes are retained or trained on.
              </p>
            </div>
          </div>
        </div>

        {/* Continuous Controls Audit Ledger */}
        <div>
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Automated Code Controls
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Continuous Infosec & Code-Level Controls Ledger
            </h2>
            <p className="mt-1 text-xs text-text-secondary md:text-sm">
              Inspect how security invariants are tested automatically in our CI/CD pipeline against real PostgreSQL 18 and S3 containers.
            </p>
          </div>
          <EnterpriseSecurityAuditViewer />
        </div>

        {/* CISO Case Study */}
        <div>
          <EnterpriseCaseStudy
            industry="Enterprise Financial Technology"
            clientType="Global FinTech & Banking Platform (CISO Review)"
            badge="PASSED CISO RISK ASSESSMENT IN 7 DAYS"
            title="Meeting Strict Tier-1 Bank Vendor Security Requirements with Sovereign AWS Custody"
            challenge="To partner with Tier-1 commercial banks, the firm needed an external client document intake platform that could pass extensive third-party penetration testing and vendor security reviews. Generic workflow platforms were rejected because files were stored in shared vendor databases without KMS key custody."
            solution="The CISO selected Avenra. The platform was deployed with direct sovereign AWS S3 integration encrypted with the bank's AWS KMS keys. Avenra's kernel-level PostgreSQL RLS and ephemeral AI memory architecture satisfied all zero-trust isolation requirements."
            outcomes={[
              { metric: "100%", label: "CISO Review Approval", detail: "Approved by 4 global commercial banks" },
              { metric: "0 Bytes", label: "Third-Party Storage", detail: "All documents remain in bank S3 bucket" },
              { metric: "Zero Hits", label: "Third-Party Penetration Tests", detail: "Clean bill of health on RLS and CSP" },
              { metric: "Automated", label: "Audit Preparation", detail: "Continuous evidence export" },
            ]}
            quote={{
              text: "Avenra is the first workflow platform that actually understands enterprise security. Their kernel-level RLS, customer KMS custody, and zero-persistence AI architecture set the standard for enterprise SaaS.",
              author: "Marcus Chen, CISSP",
              role: "Chief Information Security Officer",
              firm: "Vanguard FinTech Solutions",
            }}
            beforeAfter={[
              {
                before: "Bank infosec teams rejected generic SaaS tools because client tax files and IDs were stored in shared vendor cloud buckets.",
                after: "All files upload directly to bank-owned S3 buckets using customer-managed AWS KMS envelope encryption.",
              },
              {
                before: "Application-level tenant isolation failed CISO penetration tests due to SQL injection vulnerability risks.",
                after: "Native PostgreSQL 18 Row-Level Security policies filter data at the database kernel level.",
              },
              {
                before: "AI document intelligence models raised severe data leakage concerns under bank privacy covenants.",
                after: "Avenra's air-gapped, zero-persistence AI container guarantees zero disk caching and zero model training.",
              },
            ]}
          />
        </div>

        {/* Security FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="CISO & Enterprise Security Architecture FAQ"
            subtitle="Deep architectural answers regarding encryption standards, penetration testing, and zero-trust boundaries."
            items={SECURITY_LEADER_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
