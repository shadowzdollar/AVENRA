"use client";

import {
  Clock,
  FileUp,
  Key,
  ShieldCheck,
  } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";
import { VisualMagicPortalMockup } from "@/components/enterprise/VisualMagicPortalMockup";

const CLIENT_PORTAL_FAQS = [
  {
    category: "Security",
    question: "How secure are passwordless magic links compared to traditional client portal logins?",
    answer: "Avenra Magic Links are significantly more secure than traditional portal accounts for external clients. Traditional portals suffer from weak, reused client passwords, lack of MFA, and stale sessions. Avenra generates cryptographically random, 256-bit high-entropy tokens signed with an HMAC-SHA256 secret. The link grants single-purpose access only to the specific requested questionnaire or file upload slot and automatically self-destructs upon completion or expiration.",
    technicalDetails: "Tokens are stored as cryptographic hashes in PostgreSQL. Replay attacks are blocked by single-use token invalidation.",
  },
  {
    category: "Client Experience",
    question: "What does the external client see when they click an Avenra request link?",
    answer: "The client lands on a fast, beautifully branded responsive portal tailored with your firm's logo and color palette. There are zero ads, zero requests to create a password, and zero third-party tracking scripts. The portal clearly lists the requested documents with sample previews, accepted formats, and an instant drag-and-drop uploader that confirms receipt immediately.",
    technicalDetails: "Loads in < 250ms on mobile and desktop. Optimized for high-net-worth clients, enterprise CFOs, and executives.",
  },
  {
    category: "Malware Defense",
    question: "What happens if a client mistakenly uploads an infected document or macro-enabled virus?",
    answer: "Every byte uploaded through an Avenra portal is streamed directly across an in-memory UNIX socket to our local ClamAV daemon before saving to storage. If a virus or macro payload is detected, the upload is terminated with an immediate client-friendly warning, and the security team receives an incident report.",
    technicalDetails: "Infected files never touch your S3 bucket or internal disks. Quarantined in memory.",
  },
];

export default function ClientPortalPage() {
  return (
    <MarketingLayout
      variant="platform"
      category="Platform Subsystem"
      badge="Zero-Password Magic Links"
      title="Tokenized Client Information & Document Portals"
      subtitle="Eliminate the friction of client logins. Send single-use, cryptographically signed magic links to securely collect documents, answers, and sign-offs in hours, not weeks."
      breadcrumbs={[
        { label: "Platform", href: "/platform" },
        { label: "Client Portal" },
      ]}
      heroVisual={<VisualMagicPortalMockup />}
      stats={[
        { value: "0", label: "Passwords to Remember", detail: "Zero client account registration needed" },
        { value: "1-Click", label: "Client Access", detail: "Secure cryptographic token in URL" },
        { value: "72h", label: "Default Expiration", detail: "Automated link rotation & invalidation" },
        { value: "Instant", label: "Antivirus Scan", detail: "ClamAV stream validation on upload" },
      ]}
      features={[
        {
          icon: Key,
          title: "Passwordless Magic Tokens",
          description: "Clients open a personalized, clean submission page directly from their email with no friction or sign-up required.",
          badge: "ZERO FRICTION",
        },
        {
          icon: FileUp,
          title: "Drag-and-Drop Ingestion",
          description: "Clients upload required files directly from desktop or mobile. Files stream straight to virus scanning and private S3 storage.",
          badge: "SAFE UPLOAD",
        },
        {
          icon: Clock,
          title: "Automated Link Expiry",
          description: "Tokens automatically expire upon completion or after a configurable window. Expired links can be refreshed in 1 click.",
        },
        {
          icon: ShieldCheck,
          title: "Tenant Scoped Security",
          description: "Clients can only view and answer the specific request they were sent. Full cross-tenant isolation is enforced server-side.",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Comparison: Traditional Portal vs Avenra Magic Portals */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Experience Comparison
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl mt-1">
              Why High-Net-Worth & Enterprise Clients Prefer Magic Portals
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              Forcing busy corporate executives or private wealth clients to register an account, remember a password, configure 2FA, and navigate a clunky portal leads to missed deadlines and manual email workarounds that break security:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-danger/30 bg-danger-surface/10 p-6 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-danger">
                Traditional Client Portal Platforms
              </span>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-danger font-bold">✕</span>
                  <span>Forces clients to invent passwords they will forget by the next engagement.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-danger font-bold">✕</span>
                  <span>Generic login pages expose other clients to enumeration attacks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-danger font-bold">✕</span>
                  <span>Stale sessions remain active indefinitely on client personal devices.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-danger font-bold">✕</span>
                  <span>Frustrated clients bypass the portal and email sensitive files as unencrypted attachments.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-success/30 bg-success-surface/10 p-6 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-success">
                Avenra Cryptographic Magic Portals
              </span>
              <ul className="space-y-2 text-xs text-text-primary">
                <li className="flex items-start gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span>Zero passwords: single-use, high-entropy cryptographic token delivers instant access.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span>Single-purpose scope: client sees only their specific matter and required documents.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span>Self-destructing tokens: automatically invalidates upon completion or TTL expiration.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span>99.4% completion rate: zero login friction means clients upload documents in minutes.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Portal FAQs */}
        <div>
          <EnterpriseFaqAccordion
            title="Client Magic Portals & Security FAQ"
            subtitle="Explore how tokenized portals protect client privacy while maximizing completion velocity."
            items={CLIENT_PORTAL_FAQS}
          />
        </div>
      </div>
    </MarketingLayout>
  );
}
