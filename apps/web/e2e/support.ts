import { expect, type Page } from "@playwright/test";

/** Shared steps for the browser end-to-end tests. */

export const MAILPIT = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:18025";
export const PASSWORD = "plum-orbit-violin-42";

type MailpitSummary = { ID: string; Subject: string };

/** The newest link to {@code path} in an email sent to {@code to}. */
export async function linkFromEmail(to: string, path: string, pattern = `${path}\\?token=[A-Za-z0-9_-]+`): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const search = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const { messages } = (await search.json()) as { messages: MailpitSummary[] };
    for (const summary of messages) {
      const message = (await (await fetch(`${MAILPIT}/api/v1/message/${summary.ID}`)).json()) as { Text: string };
      const link = new RegExp(`https?://[^\\s]+${pattern}`).exec(message.Text);
      if (link) {
        return link[0];
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No ${path} email for ${to}`);
}

/**
 * Collects CSP violations, uncaught script errors and failed requests on a
 * page. The one expected failure is the session check answering 401 when
 * signed out, which is how the app knows to show sign-in; Chrome logs it.
 */
export function watchProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    const expectedSignedOut = /Failed to load resource: .*status of 401/.test(text);
    if (message.type() === "error" && !expectedSignedOut) {
      problems.push(text);
    }
  });
  page.on("pageerror", (error) => problems.push(error.message));
  return problems;
}

export async function signUpAndVerify(page: Page, name: string, email: string) {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

  await page.goto(await linkFromEmail(email, "/verify-email"));
  await expect(page.getByText("Your email address is confirmed")).toBeVisible();
}

export async function signIn(page: Page, email: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
}
