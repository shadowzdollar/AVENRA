import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The colour tokens must match Guidelines §144.2 (as amended by ADR-039) exactly, and no other colour
 * may exist, so the design system cannot drift one component at a time.
 */
const approvedTokens: Record<string, string> = {
  "--color-background": "#ffffff",
  "--color-text-primary": "#0b0d0f",
  "--color-text-secondary": "#667085",
  "--color-brand": "#2563eb",
  "--color-brand-surface": "#eff6ff",
  "--color-border": "#e5e7eb",
  "--color-success": "#16a34a",
  "--color-warning": "#d97706",
  "--color-error": "#dc2626",
  // ADR-039 amends §144.2 with these four.
  "--color-canvas": "#f8f9fb",
  "--color-success-surface": "#ecfdf3",
  "--color-warning-surface": "#fffaeb",
  "--color-error-surface": "#fef3f2",
};

// Vitest runs from apps/web; under jsdom import.meta.url is not a file URL.
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const theme = /@theme\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? "";

describe("design tokens", () => {
  it("removes Tailwind's default palette", () => {
    expect(theme).toMatch(/--color-\*:\s*initial;/);
  });

  it("defines exactly the approved colour tokens with the approved values", () => {
    const defined = Object.fromEntries(
      [...theme.matchAll(/(--color-[a-z-]+):\s*(#[0-9a-fA-F]{6});/g)].map(([, name, value]) => [
        name,
        value?.toLowerCase(),
      ]),
    );
    expect(defined).toEqual(approvedTokens);
  });

  it("uses Inter as the primary typeface", () => {
    expect(theme).toMatch(/--font-sans:\s*"Inter Variable"/);
  });
});
