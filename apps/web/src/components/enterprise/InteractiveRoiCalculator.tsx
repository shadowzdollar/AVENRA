"use client";

import {
  Calculator,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function InteractiveRoiCalculator() {
  const [operators, setOperators] = useState(15);
  const [monthlyWorkItems, setMonthlyWorkItems] = useState(80);
  const [hourlyRate, setHourlyRate] = useState(250);

  // Benchmarks derived from professional services time-motion audits:
  // - Traditional workflow: 3.8 hours per deliverable spent chasing emails, checking formats, manual filing.
  // - Avenra automated collection & verification: reduced to 0.6 hours per deliverable (3.2 hours saved).
  const hoursSavedPerItem = 3.2;
  const monthlyHoursSaved = Math.round(monthlyWorkItems * hoursSavedPerItem);
  const monthlyRevenueSaved = Math.round(monthlyHoursSaved * hourlyRate);
  const annualRevenueReclaimed = monthlyRevenueSaved * 12;

  // Audit risk protection value (prevented write-offs / dispute deductions: ~2.5% of billable revenue)
  const disputeReductionAnnual = Math.round(monthlyWorkItems * 12 * 450);

  return (
    <div className="rounded-3xl border border-border bg-canvas overflow-hidden shadow-card">
      <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Calculator className="size-5 text-brand" />
          <span className="text-sm font-bold text-text-primary">
            Enterprise ROI & Throughput Calculator
          </span>
        </div>
        <span className="rounded-full bg-brand-surface px-2.5 py-0.5 text-[10px] font-bold text-brand">
          BASED ON BILLABLE BENCHMARKS
        </span>
      </div>

      <div className="p-6 md:p-10 grid gap-10 md:grid-cols-12">
        {/* Sliders Input Column */}
        <div className="md:col-span-6 space-y-6">
          {/* Slider 1: Operators */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-text-primary">Active Billable Operators</span>
              <span className="text-brand font-bold text-sm">{operators} operators</span>
            </div>
            <input
              type="range"
              min={3}
              max={150}
              step={1}
              value={operators}
              onChange={(e) => setOperators(Number(e.target.value))}
              className="w-full accent-brand h-2 rounded-lg bg-border cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-text-secondary">
              <span>3 boutique</span>
              <span>75 mid-market</span>
              <span>150+ enterprise</span>
            </div>
          </div>

          {/* Slider 2: Monthly Work Deliverables */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-text-primary">Monthly Client Deliverables / Matters</span>
              <span className="text-brand font-bold text-sm">{monthlyWorkItems} matters / mo</span>
            </div>
            <input
              type="range"
              min={10}
              max={500}
              step={5}
              value={monthlyWorkItems}
              onChange={(e) => setMonthlyWorkItems(Number(e.target.value))}
              className="w-full accent-brand h-2 rounded-lg bg-border cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-text-secondary">
              <span>10 / mo</span>
              <span>250 / mo</span>
              <span>500+ / mo</span>
            </div>
          </div>

          {/* Slider 3: Hourly Rate */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-text-primary">Blended Hourly Billing Rate</span>
              <span className="text-brand font-bold text-sm">${hourlyRate} / hour</span>
            </div>
            <input
              type="range"
              min={100}
              max={650}
              step={25}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="w-full accent-brand h-2 rounded-lg bg-border cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-text-secondary">
              <span>$100/hr junior</span>
              <span>$350/hr senior</span>
              <span>$650/hr partner</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 text-xs text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary block mb-1">
              Methodology & Measurement:
            </span>
            Calculated by eliminating manual email follow-ups, document validation friction, and unverified deliverable disputes. Assumes 3.2 hours reclaimed per completed client deliverable.
          </div>
        </div>

        {/* Calculated Results Column */}
        <div className="md:col-span-6 flex flex-col justify-between rounded-2xl border border-border bg-background p-6 md:p-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
              Projected Annual Impact
            </span>
            <div className="mt-4">
              <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary">
                ${annualRevenueReclaimed.toLocaleString()}
              </span>
              <span className="text-xs text-text-secondary block mt-1 font-medium">
                Annual billable capacity reclaimed from administrative drag
              </span>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-6">
              <div>
                <span className="text-2xl font-bold text-text-primary">
                  {monthlyHoursSaved.toLocaleString()} hrs
                </span>
                <span className="text-xs text-text-secondary block mt-0.5">
                  Monthly hours saved
                </span>
              </div>
              <div>
                <span className="text-2xl font-bold text-text-primary">
                  ${disputeReductionAnnual.toLocaleString()}
                </span>
                <span className="text-xs text-text-secondary block mt-0.5">
                  Dispute & audit risk savings
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex flex-col gap-3">
            <Link
              href="/sign-up"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand text-xs font-semibold text-background shadow transition-colors hover:bg-brand/90"
            >
              Start Reclaiming Billable Hours →
            </Link>
            <p className="text-center text-[11px] text-text-secondary">
              Typical payback period: 18 days from rollout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
