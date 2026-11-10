"use client";

import { ChevronDown, HelpCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";

export interface FaqItem {
  question: string;
  answer: string;
  category?: string;
  technicalDetails?: string;
}

export function EnterpriseFaqAccordion({
  title = "Enterprise Procurement & Architectural FAQ",
  subtitle = "Direct, technically rigorous answers for Chief Information Security Officers, Legal Counsel, and Enterprise Architects.",
  items,
}: {
  title?: string;
  subtitle?: string;
  items: FaqItem[];
}) {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  function toggle(idx: number) {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-canvas overflow-hidden shadow-card">
      <div className="border-b border-border bg-background px-6 py-6 md:px-8">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-5 text-brand" />
          <span className="text-xs font-bold uppercase tracking-wider text-brand">
            Frequently Asked Questions
          </span>
        </div>
        <h3 className="mt-1 text-xl font-bold text-text-primary md:text-2xl">
          {title}
        </h3>
        <p className="mt-1 text-xs text-text-secondary md:text-sm max-w-3xl">
          {subtitle}
        </p>
      </div>

      <div className="divide-y divide-border">
        {items.map((item, idx) => {
          const isOpen = openIndices.includes(idx);
          return (
            <div key={idx} className="bg-background/40 hover:bg-background/80 transition-colors">
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full p-6 text-left flex items-start justify-between gap-4 focus-visible:outline-none"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-surface text-brand font-mono text-xs font-bold mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    {item.category && (
                      <span className="rounded bg-canvas px-2 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider mb-1 inline-block border border-border">
                        {item.category}
                      </span>
                    )}
                    <h4 className="text-sm md:text-base font-bold text-text-primary">
                      {item.question}
                    </h4>
                  </div>
                </div>
                <ChevronDown
                  className={`size-5 text-text-secondary shrink-0 transition-transform duration-200 mt-1 ${
                    isOpen ? "rotate-180 text-brand" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-1 text-xs leading-relaxed text-text-secondary md:text-sm md:pl-15">
                  <p className="whitespace-pre-line text-text-secondary">
                    {item.answer}
                  </p>

                  {item.technicalDetails && (
                    <div className="mt-4 rounded-xl border border-border bg-canvas p-4 font-mono text-xs text-text-primary">
                      <div className="flex items-center gap-2 text-brand font-bold text-[11px] mb-1.5 font-sans uppercase tracking-wider">
                        <ShieldCheck className="size-4" /> Technical & Compliance Proof
                      </div>
                      <p className="leading-relaxed font-mono text-[11px]">
                        {item.technicalDetails}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
