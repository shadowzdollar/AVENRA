import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { watchProblems } from "./support";

/**
 * Every public product page renders under the production CSP without script
 * errors or blocked styles, carries the shared footer, and links only to pages
 * that exist. The list is read from the app directory, so a new page is
 * covered without editing this file.
 */

const MARKETING_SECTIONS = ["platform", "solutions", "how-it-works", "security", "integrations", "pricing", "docs", "customers"];

function pagesUnder(directory: string, route: string): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      routes.push(...pagesUnder(path, `${route}/${entry}`));
    } else if (entry === "page.tsx") {
      routes.push(route);
    }
  }
  return routes;
}

const currentDir = fileURLToPath(new URL(".", import.meta.url));
const appDirectory = join(currentDir, "..", "src", "app");
const routes = ["/", ...MARKETING_SECTIONS.flatMap((section) => pagesUnder(join(appDirectory, section), `/${section}`))];

test("every public page renders cleanly with the shared footer", async ({ page, request }) => {
  test.setTimeout(240_000);
  const problems = watchProblems(page);
  const internalLinks = new Set<string>();

  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1").first(), route).toBeVisible();
    if (route !== "/") {
      await expect(page.locator("footer").getByText("avenra", { exact: true }), route).toBeVisible();
    }
    for (const href of await page.locator("a[href^='/']").evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""))) {
      internalLinks.add(href.split("#")[0] ?? href);
    }
  }

  const broken: string[] = [];
  for (const href of internalLinks) {
    if (href === "" || href.startsWith("/api/")) {
      continue;
    }
    const response = await request.get(href, { maxRedirects: 0 });
    if (response.status() >= 400) {
      broken.push(`${href} → ${response.status()}`);
    }
  }

  expect(broken).toEqual([]);
  expect(problems).toEqual([]);
});
