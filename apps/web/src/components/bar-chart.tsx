"use client";

import { useState } from "react";

export type Bar = { label: string; value: number };

const HEIGHT = 120;
const GAP = 2;
const RADIUS = 4;

/** A bar whose top corners are rounded and whose base sits flat on the baseline. */
function barPath(x: number, width: number, height: number): string {
  const r = Math.min(RADIUS, width / 2, height);
  const top = HEIGHT - height;
  return `M${x},${HEIGHT} V${top + r} Q${x},${top} ${x + r},${top} H${x + width - r} Q${x + width},${top} ${x + width},${top + r} V${HEIGHT} Z`;
}

/**
 * One series of bars over time, with a tooltip on hover or focus and the same
 * numbers as a table for people who prefer (or need) one.
 */
export function BarChart({ title, bars, format }: { title: string; bars: Bar[]; format: (value: number) => string }) {
  const [active, setActive] = useState<number | null>(null);
  const width = Math.max(bars.length * 24, 240);
  const slot = width / Math.max(bars.length, 1);
  const max = Math.max(...bars.map((bar) => bar.value), 0);
  const shown = active === null ? null : bars[active];
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm font-medium">{title}</figcaption>
      {bars.length === 0 ? (
        <p className="text-sm text-text-secondary">No data for this period yet.</p>
      ) : (
        <>
          <div className="relative">
            <svg viewBox={`0 0 ${width} ${HEIGHT}`} className="h-32 w-full" preserveAspectRatio="none" role="img" aria-label={title}>
              {bars.map((bar, index) => {
                const height = max === 0 ? 0 : Math.max((bar.value / max) * (HEIGHT - 8), bar.value > 0 ? 2 : 0);
                const x = index * slot + GAP / 2;
                return (
                  <g key={bar.label}>
                    {/* The hit target is the whole slot, bigger than the bar. */}
                    <rect
                      x={index * slot}
                      y={0}
                      width={slot}
                      height={HEIGHT}
                      fill="transparent"
                      tabIndex={0}
                      aria-label={`${bar.label}: ${format(bar.value)}`}
                      onMouseEnter={() => setActive(index)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(index)}
                      onBlur={() => setActive(null)}
                    />
                    {height > 0 ? (
                      <path d={barPath(x, slot - GAP, height)} fill="var(--color-brand)" opacity={active === null || active === index ? 1 : 0.5} pointerEvents="none" />
                    ) : null}
                  </g>
                );
              })}
              <line x1={0} x2={width} y1={HEIGHT - 0.5} y2={HEIGHT - 0.5} stroke="var(--color-border)" strokeWidth={1} />
            </svg>
            {shown ? (
              <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-background px-2 py-1 text-xs shadow-sm" role="status">
                <span className="text-text-secondary">{shown.label}</span> <span className="font-medium tabular-nums">{format(shown.value)}</span>
              </div>
            ) : null}
          </div>
          <div className="flex justify-between text-xs text-text-secondary">
            <span>{bars[0]?.label}</span>
            <span>Highest: {format(max)}</span>
            <span>{bars[bars.length - 1]?.label}</span>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer text-text-secondary">Show as a table</summary>
            <table className="mt-2 w-full text-left">
              <tbody>
                {bars.map((bar) => (
                  <tr key={bar.label} className="border-t border-border">
                    <td className="py-1">{bar.label}</td>
                    <td className="py-1 text-right tabular-nums">{format(bar.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </figure>
  );
}
