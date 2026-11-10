"use client";

import { TrendingUp, Building2, Quote, ArrowRight } from "lucide-react";
import Link from "next/link";

export interface CaseStudyProps {
  industry: string;
  clientType: string;
  badge: string;
  title: string;
  challenge: string;
  solution: string;
  outcomes: {
    metric: string;
    label: string;
    detail: string;
  }[];
  quote: {
    text: string;
    author: string;
    role: string;
    firm: string;
  };
  image?: string;
  beforeAfter: {
    before: string;
    after: string;
  }[];
}

export function EnterpriseCaseStudy({
  industry,
  clientType,
  badge,
  title,
  challenge,
  solution,
  outcomes,
  quote,
  image,
  beforeAfter,
}: CaseStudyProps) {
  return (
    <div className="rounded-3xl border border-border bg-canvas overflow-hidden shadow-card">
      {/* Header Banner */}
      <div className="border-b border-border bg-background px-6 py-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-surface text-brand">
              <Building2 className="size-5" />
            </span>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
                {industry} Case Study · {clientType}
              </span>
              <h3 className="text-xl font-bold text-text-primary md:text-2xl mt-0.5">
                {title}
              </h3>
            </div>
          </div>
          <span className="rounded-full bg-success-surface px-3 py-1 text-xs font-bold text-success flex items-center gap-1.5">
            <TrendingUp className="size-3.5" /> {badge}
          </span>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border border-b border-border bg-canvas">
        {outcomes.map((item, idx) => (
          <div key={idx} className="p-6 flex flex-col justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
              {item.metric}
            </span>
            <div className="mt-2">
              <span className="text-xs font-bold text-brand block">{item.label}</span>
              <span className="text-[11px] text-text-secondary mt-0.5 block">{item.detail}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Body: Challenge & Solution */}
      <div className="p-6 md:p-8 grid gap-8 md:grid-cols-12 bg-background/50 border-b border-border">
        <div className="md:col-span-6 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-danger">
            The Operational Bottleneck
          </span>
          <h4 className="text-base font-bold text-text-primary">
            Manual Follow-ups & Unenforced Document Checklists
          </h4>
          <p className="text-xs leading-relaxed text-text-secondary md:text-sm">
            {challenge}
          </p>
        </div>

        <div className="md:col-span-6 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-success">
            The Avenra Implementation
          </span>
          <h4 className="text-base font-bold text-text-primary">
            Deterministic Finite State Machines & Sovereign Evidence Lockers
          </h4>
          <p className="text-xs leading-relaxed text-text-secondary md:text-sm">
            {solution}
          </p>
        </div>
      </div>

      {/* Before vs After Walkthrough */}
      <div className="p-6 md:p-8 bg-canvas border-b border-border">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-4">
          Workflow Transformation Comparison
        </h4>
        <div className="space-y-3">
          {beforeAfter.map((row, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 rounded-xl border border-border overflow-hidden text-xs">
              <div className="p-3.5 md:col-span-6 bg-danger-surface/10 border-b md:border-b-0 md:border-r border-border flex items-start gap-2.5">
                <span className="font-bold text-danger shrink-0">Legacy:</span>
                <span className="text-text-secondary">{row.before}</span>
              </div>
              <div className="p-3.5 md:col-span-6 bg-success-surface/10 flex items-start gap-2.5">
                <span className="font-bold text-success shrink-0">With Avenra:</span>
                <span className="text-text-primary font-medium">{row.after}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quote Callout */}
      <div className="p-6 md:p-8 bg-background flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5 max-w-3xl">
          {image ? (
            /* eslint-disable-next-line @next/next/no-img-element -- CSP safe img */
            <img
              src={image}
              alt={quote.author}
              className="h-16 w-16 rounded-2xl object-cover shrink-0 ring-2 ring-border shadow-md"
            />
          ) : (
            <Quote className="size-8 text-brand shrink-0 opacity-40 mt-1" />
          )}
          <div>
            <p className="text-sm italic text-text-primary leading-relaxed md:text-base">
              &quot;{quote.text}&quot;
            </p>
            <div className="mt-2 text-xs">
              <span className="font-bold text-text-primary">{quote.author}</span>
              <span className="text-text-secondary"> · {quote.role}, {quote.firm}</span>
            </div>
          </div>
        </div>

        <Link
          href="/sign-up"
          className="shrink-0 inline-flex h-10 items-center justify-center rounded-xl bg-brand px-5 text-xs font-semibold text-background shadow transition-colors hover:bg-brand/90"
        >
          Replicate this workflow <ArrowRight className="ml-1.5 size-3.5" />
        </Link>
      </div>
    </div>
  );
}
