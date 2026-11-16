/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  Key,
  RefreshCw,
  Server,
  ShieldCheck,
  Lock,
  ArrowRight,
  Database,
  } from "lucide-react";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { EnterpriseFaqAccordion } from "@/components/enterprise/EnterpriseFaqAccordion";

function IdempotencyHeroVisual() {
  const [attempt, setAttempt] = useState<number>(1);

  const attempts = [
    {
      seq: 1,
      title: "Attempt 1: Initial Request",
      time: "142ms",
      status: "EXECUTED",
      badge: "201 Created",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      desc: "Acquired Redis key lock. Database transaction committed. State transitioned to DRAFT.",
    },
    {
      seq: 2,
      title: "Attempt 2: Network Timeout Retry",
      time: "1ms",
      status: "DEDUPLICATED",
      badge: "201 Created (Cached)",
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      desc: "Key exists in Redis cache. Returned identical response payload without re-executing side effects.",
    },
    {
      seq: 3,
      title: "Attempt 3: Concurrent Worker Race",
      time: "2ms",
      status: "DEDUPLICATED",
      badge: "201 Created (Cached)",
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      desc: "Zero database duplicate rows created. Exactly-once execution invariant maintained.",
    },
  ];

  const curr = attempts[attempt - 1] ?? attempts[0]!;

  return (
    <div className="w-full max-w-xl rounded-2xl border border-indigo-500/20 bg-canvas-subtle p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-indigo-400" />
          <span className="font-mono text-xs font-semibold tracking-wider text-text-secondary">
            IDEMPOTENCY CONCURRENCY SIMULATOR
          </span>
        </div>
        <span className="rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-[11px] text-indigo-400 border border-indigo-500/20">
          EXACTLY-ONCE SEMANTICS
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        {[1, 2, 3].map((num) => (
          <button
            key={num}
            onClick={() => setAttempt(num)}
            className={`flex-1 rounded-lg py-2 font-mono text-xs transition-colors border ${
              attempt === num
                ? "bg-indigo-500 text-white border-indigo-500 font-bold"
                : "bg-canvas border-border text-text-secondary hover:bg-canvas-subtle"
            }`}
          >
            Request #{num}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-border/80 bg-canvas p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-text-primary">{curr.title}</div>
          <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${curr.color}`}>
            {curr.badge}
          </span>
        </div>
        <p className="mt-2 text-xs text-text-secondary leading-relaxed">{curr.desc}</p>

        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-canvas shadow-sm">
          <div className="relative h-28 w-full overflow-hidden bg-black/40">
            <img src="/images/platform/work-engine.jpg"
              alt="Idempotent State Protection"
              className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            <div className="absolute top-2 right-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
              {curr.badge}
            </div>
            <div className="absolute bottom-2 left-3 text-[11px] font-bold text-white">
              Idempotency Key: idemp_99a81f0284c ({curr.time})
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-text-tertiary pt-2 border-t border-border/40">
        <span className="flex items-center gap-1.5 font-mono">
          <Database className="h-3.5 w-3.5 text-indigo-400" /> PostgreSQL Unique Hash Constraint
        </span>
        <span className="font-mono">ADR-011 Certified</span>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    category: "Idempotency",
    question: "How does Avenra handle identical requests sent concurrently?",
    answer: "Avenra uses a two-phase lock strategy: an initial Redis atomic SETNX with a 15-second TTL prevents concurrent execution in memory, backed by a unique database constraint on `(organization_id, idempotency_key)`. The first thread processes the request and persists the HTTP status code and response payload; subsequent threads wait on the Redis lock or immediately return the stored response.",
  },
  {
    category: "Failure Classification",
    question: "How are retries differentiated between permanent errors and transient faults?",
    answer: "We follow strict HTTP semantic classification. Client errors (400 Bad Request, 422 Unprocessable) represent permanent business logic rejections and are never retried. Network dropouts, 503 Service Unavailable, and database connection timeouts are classified as transient and automatically retried using exponential backoff with full jitter (e.g. 1s, 2s, 4s, 8s, up to 5 attempts).",
  },
  {
    category: "Worker Queues",
    question: "How does the background reminder worker avoid duplicate execution across multiple server replicas?",
    answer: "Background scheduled jobs execute SQL queries utilizing PostgreSQL's `SELECT ... FOR UPDATE SKIP LOCKED`. When replica A claims a batch of 50 pending notifications, replica B immediately skips those locked rows and claims the next available batch without contention or race conditions.",
  },
  {
    category: "Cache TTL",
    question: "How long are idempotency records retained?",
    answer: "Idempotency keys and their serialized response payloads are cached in Redis for 72 hours and permanently retained in the relational audit database, providing long-term audit protection against delayed replay attacks.",
  },
];

export default function IdempotencyPage() {
  return (
    <MarketingLayout
      category="Fault Tolerance"
      badge="ADR-011 Invariant Safety"
      variant="how-it-works"
      title="Idempotency & Retry Classification"
      subtitle="How Avenra classifies external side-effects and eliminates duplicate webhooks, payments, or client notifications during network timeouts."
      breadcrumbs={[
        { label: "How It Works", href: "/how-it-works" },
        { label: "Idempotency & Retries" },
      ]}
      heroVisual={<IdempotencyHeroVisual />}
      stats={[
        { value: "100%", label: "Idempotency", detail: "Enforced across all external calls" },
        { value: "0", label: "Double Sends", detail: "Guaranteed by persistent key cache" },
        { value: "Classified", label: "Retry Strategies", detail: "Transient vs permanent failure logic" },
        { value: "Exponential", label: "Backoff Schedule", detail: "Prevents downstream service thundering" },
      ]}
      features={[
        {
          icon: Key,
          title: "Deterministic Idempotency Keys",
          description: "All client responses, reminder emails, and webhook payloads generate SHA-256 keys based on tenant, entity, and event hash.",
          badge: "KEYS",
        },
        {
          icon: RefreshCw,
          title: "Classified Error Handling",
          description: "Avenra separates transient network errors (which retry with exponential backoff) from permanent 4xx validation rejections.",
          badge: "RETRIES",
        },
        {
          icon: Server,
          title: "Redis Key Deduplication",
          description: "In-flight operations lock idempotency keys in Redis, preventing concurrent duplicate executions from colliding.",
          badge: "REDIS LOCK",
        },
        {
          icon: ShieldCheck,
          title: "Safe Crash Recovery",
          description: "If an application restarts mid-operation, the work item state machine resumes safely without repeating external side effects.",
          badge: "RECOVERY",
        },
      ]}
    >
      <div className="space-y-20">
        {/* The Transient vs Permanent Failure Classification */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Error Taxonomy
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Strict Failure Classification Architecture
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary md:text-base">
              Retrying every failure blindly causes cascading failures and duplicate credit card charges. Avenra partitions errors into two distinct categories.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
                <RefreshCw className="h-4 w-4" /> CATEGORY 1: TRANSIENT FAULTS (AUTO-RETRY)
              </div>
              <ul className="mt-4 space-y-2.5 text-xs text-text-secondary">
                <li>• HTTP 502/503/504 Bad Gateway & Gateway Timeout</li>
                <li>• TCP Connection Reset by Peer (ECONNRESET)</li>
                <li>• S3 Rate Limit / AWS SlowDown 503</li>
                <li>• PostgreSQL Lock Acquisition Timeout</li>
              </ul>
              <div className="mt-4 rounded-lg bg-canvas p-3 font-mono text-[11px] text-text-secondary border border-border">
                Strategy: Exponential backoff with jitter (1s, 2s, 4s, 8s, 16s)
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-canvas-subtle p-6">
              <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-bold">
                <Lock className="h-4 w-4" /> CATEGORY 2: PERMANENT REJECTIONS (ABORT)
              </div>
              <ul className="mt-4 space-y-2.5 text-xs text-text-secondary">
                <li>• HTTP 400 Bad Request / Malformed JSON</li>
                <li>• HTTP 401 Unauthorized / Invalid API Token</li>
                <li>• HTTP 409 Conflict / State Invariant Violation</li>
                <li>• HTTP 422 Unprocessable Entity / Schema Error</li>
              </ul>
              <div className="mt-4 rounded-lg bg-canvas p-3 font-mono text-[11px] text-text-secondary border border-border">
                Strategy: Immediate abort, persist error envelope, alert operator
              </div>
            </div>
          </div>
        </div>

        {/* Technical FAQ */}
        <div className="rounded-3xl border border-border bg-canvas p-8 md:p-12">
          <EnterpriseFaqAccordion
            title="Idempotency & Concurrency FAQ"
            subtitle="Deep engineering answers on distributed locks, Redis lease expiration, and double-send protection."
            items={FAQ_ITEMS}
          />
        </div>

        {/* Next Blueprint */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-canvas-subtle p-6">
          <div>
            <div className="text-xs font-mono text-indigo-400">Next Blueprint in Architecture Series</div>
            <div className="text-base font-bold text-text-primary">AI Safety, Sandboxing & Zero-Retention Policies</div>
          </div>
          <Link
            href="/how-it-works/ai-safety"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600 transition-colors"
          >
            Explore AI Safety <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
