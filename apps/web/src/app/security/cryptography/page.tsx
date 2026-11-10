"use client";

import { useState } from "react";
import {
  Fingerprint,
  FolderLock,
  Key,
  ShieldCheck,
  ArrowRight,
  } from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { InteractiveEvidenceInspector } from "@/components/enterprise/InteractiveEvidenceInspector";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function CryptographyHeroVisual() {
  const [encrypting, setEncrypting] = useState<boolean>(false);

  return (
    <div className="w-full max-w-xl rounded-2xl border border-emerald-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-emerald-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            ENVELOPE ENCRYPTION PIPELINE
          </span>
        </div>
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400 border border-emerald-500/20">
          NIST SP 800-38D
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-border/80 bg-canvas p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-primary">AES-256-GCM Cipher Execution</span>
          <button
            onClick={() => setEncrypting(!encrypting)}
            className="rounded-lg bg-emerald-500 px-3 py-1 font-mono text-xs font-bold text-white hover:bg-emerald-600 transition-colors"
          >
            {encrypting ? "Show Plaintext" : "Execute Encryption"}
          </button>
        </div>

        <div className="mt-3 rounded-lg bg-black/70 p-3 font-mono text-[11px] text-emerald-300 border border-white/5">
          <div className="text-text-tertiary text-[10px] mb-1">
            {encrypting ? "# Encrypted Ciphertext + Auth Tag" : "# Unencrypted Buffer (In-Memory Only)"}
          </div>
          {encrypting ? (
            <div className="space-y-1 text-indigo-300 break-all text-[10px]">
              <div><strong>Cipher:</strong> 8f2a99d0e14a8721c0...9182ba01</div>
              <div><strong>IV (96-bit CSPRNG):</strong> c9182fa18012ba99</div>
              <div className="text-emerald-400"><strong>Auth Tag (128-bit):</strong> 4e1a029ba821cd</div>
              <div className="text-text-tertiary">KMS Key ID: arn:aws:kms:us-east-1:1234:key/avenra-prod</div>
            </div>
          ) : (
            <div className="text-text-secondary whitespace-pre text-[11px]">{`{\n  "matter_id": "mat_2026_901a",\n  "client_name": "Apex Holdings",\n  "retained_earnings": 1420500.00\n}`}</div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Authenticated Ciphertext Integrity
        </span>
        <span className="font-mono">FIPS 140-3 Compliant</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Encryption Standards",
    question: "Why does Avenra use AES-256-GCM authenticated encryption?",
    answer: "AES-256 in Galois/Counter Mode (GCM) provides both confidentiality (encryption) and authenticity (integrity checking) in a single cryptographic primitive. Any unauthorized attempt to tamper with ciphertext bits causes the 128-bit authentication tag to fail verification during decryption, instantly rejecting corrupted data before application consumption.",
  },
  {
    category: "Key Rotation",
    question: "How does Avenra manage encryption key rotation without breaking historical evidence packages?",
    answer: "We utilize Envelope Encryption. Each deliverable artifact is encrypted with a unique single-use Data Encryption Key (DEK). The DEK is encrypted under your master Key Encryption Key (KEK) managed in AWS KMS or HashiCorp Vault. When the master KEK rotates, existing packages remain cryptographically valid because the encrypted DEK header preserves its key version ID.",
  },
  {
    category: "BYOK / HYOK",
    question: "Do you support Bring Your Own Key (BYOK) or Hold Your Own Key (HYOK)?",
    answer: "Yes. Enterprise customers can configure AWS KMS or GCP Cloud KMS Key ARNs that remain within their own corporate cloud accounts. Avenra requests data keys over encrypted TLS via your IAM policies, allowing you to revoke access or audit key usage in CloudTrail at any time.",
  },
  {
    category: "Quantum Readiness",
    question: "What is Avenra's strategy for post-quantum cryptographic transitions?",
    answer: "Our evidence packages utilize hybrid signature schemes incorporating both classical Ed25519/SHA-256 signatures and post-quantum stateful hash-based algorithms (XMSS / LMS) following NIST SP 800-208 recommendations.",
  },
];

export default function CryptographySecurityPage() {
  return (
    <MarketingLayout
      category="Security Deep Dive"
      badge="Cryptographic Integrity"
      variant="security"
      title="Cryptographic Proof & SHA-256 Package Verification"
      subtitle="How Avenra implements cryptographic hashing and envelope encryption to guarantee complete tamper-evidence and chain-of-custody verification."
      breadcrumbs={[
        { label: "Security & Trust", href: "/security" },
        { label: "Cryptographic Proof" },
      ]}
      heroVisual={<CryptographyHeroVisual />}
      stats={[
        { value: "SHA-256", label: "Hashing Standard", detail: "Computed per file & per package" },
        { value: "AES-256-GCM", label: "Envelope Encryption", detail: "Authenticated key rotation" },
        { value: "Offline", label: "Auditor Verification", detail: "Zero dependence on live servers" },
        { value: "HMAC", label: "Webhook Signatures", detail: "Payload authenticity verified" },
      ]}
      features={[
        {
          icon: Fingerprint,
          title: "Deterministic Document Hashes",
          description: "Every file uploaded by a client or generated by an agent is hashed immediately upon receipt, recording its exact fingerprint.",
          badge: "FINGERPRINT",
        },
        {
          icon: FolderLock,
          title: "Package Manifest Integrity",
          description: "The evidence locker manifest links every document hash into a root package checksum, exposing any tampering instantly.",
          badge: "CHAIN OF CUSTODY",
        },
        {
          icon: Key,
          title: "Multi-Generation Key Rotation",
          description: "Data encryption keys are rotated automatically. Old keys are retained in read-only mode to decrypt historical audit records.",
          badge: "ROTATION",
        },
        {
          icon: ShieldCheck,
          title: "Signed Delivery Notifications",
          description: "All outgoing webhooks carry SHA-256 HMAC headers, allowing your firewalls to verify authenticity before processing.",
          badge: "HMAC",
        },
      ]}
    >
      <div className="space-y-20">
        {/* Interactive Evidence Locker Inspector */}
        <div>
          <InteractiveEvidenceInspector />
        </div>

        {/* Cryptographic Standards Specification */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Algorithm Suite
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              NIST-Standard Cryptographic Primitives
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
              Avenra never relies on proprietary crypto. Every security mechanism uses peer-reviewed, industry-standard cryptographic algorithms.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <span className="font-mono text-xs font-bold text-emerald-400">At-Rest Encryption</span>
              <h4 className="mt-1 font-bold text-text-primary text-base">AES-256-GCM</h4>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Hardware-accelerated AES-NI authenticated cipher providing 256-bit security with authenticated tag validation.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <span className="font-mono text-xs font-bold text-emerald-400">In-Transit Encryption</span>
              <h4 className="mt-1 font-bold text-text-primary text-base">TLS 1.3 / Perfect Forward Secrecy</h4>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Mandatory TLS 1.3 with ECDHE key exchange. Obsolete ciphers and SSL/TLS 1.0/1.1 are permanently disabled.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <span className="font-mono text-xs font-bold text-emerald-400">Digital Signatures</span>
              <h4 className="mt-1 font-bold text-text-primary text-base">Ed25519 & SHA-256</h4>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                High-speed, collision-resistant Edwards-curve digital signatures providing tamper-evident manifest verification.
              </p>
            </div>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Cryptography & Verification FAQ"
            subtitle="Deep engineering answers on key management, cipher implementation, and envelope encryption."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-emerald-400">Next Security Subsystem</div>
            <div className="text-base font-bold text-text-primary">Data Sovereignty & Privacy Safeguards</div>
          </div>
          <Link
            href="/security/privacy"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors"
          >
            Explore Data Privacy <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
