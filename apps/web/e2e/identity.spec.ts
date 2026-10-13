import { expect, test, type Page } from "@playwright/test";

/**
 * The Phase 2 journey in a real browser (criterion 2.15): sign up, confirm the
 * email from the message that actually arrived, sign in, create an
 * organization, invite a colleague who joins with limited permissions, and
 * sign out. Every page must load without CSP violations or script errors.
 */

const MAILPIT = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:18025";
const PASSWORD = "plum-orbit-violin-42";

type MailpitSummary = { ID: string; Subject: string };

/** The newest link to {@code path} in an email sent to {@code to}. */
async function linkFromEmail(to: string, path: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const search = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const { messages } = (await search.json()) as { messages: MailpitSummary[] };
    for (const summary of messages) {
      const message = (await (await fetch(`${MAILPIT}/api/v1/message/${summary.ID}`)).json()) as { Text: string };
      const link = new RegExp(`https?://[^\\s]+${path}\\?token=[A-Za-z0-9_-]+`).exec(message.Text);
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
function watchProblems(page: Page): string[] {
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

async function signUpAndVerify(page: Page, name: string, email: string) {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

  await page.goto(await linkFromEmail(email, "/verify-email"));
  await expect(page.getByText("Your email address is confirmed")).toBeVisible();
}

async function signIn(page: Page, email: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("sign up, organize, invite a colleague, and sign out", async ({ browser }) => {
  const run = Date.now();
  const ownerEmail = `owner-${run}@example.test`;
  const colleagueEmail = `colleague-${run}@example.test`;

  const owner = await browser.newPage();
  const ownerProblems = watchProblems(owner);

  // Owner: account, sign-in, organization.
  await signUpAndVerify(owner, "Olivia Owner", ownerEmail);
  await owner.goto("/sign-in");
  await signIn(owner, ownerEmail);
  await expect(owner.getByRole("heading", { name: "Organizations" })).toBeVisible();
  await expect(owner.getByText("You are not a member of any organization yet")).toBeVisible();

  await owner.getByLabel("Name").fill("Acme Advisory");
  await owner.getByRole("button", { name: "Create" }).click();
  await owner.getByRole("link", { name: /Acme Advisory/ }).click();
  await expect(owner.getByRole("heading", { name: "Acme Advisory" })).toBeVisible();
  await expect(owner.getByRole("cell", { name: "Olivia Owner" })).toBeVisible();

  // Owner invites a colleague as a member.
  await owner.getByLabel("Email").fill(colleagueEmail);
  await owner.getByLabel("Role", { exact: true }).selectOption("MEMBER");
  await owner.getByRole("button", { name: "Send invitation" }).click();
  await expect(owner.getByText(`${colleagueEmail} · member · pending`)).toBeVisible();

  // Colleague: own account, then the invitation link, which asks them to sign in first.
  const colleague = await (await browser.newContext()).newPage();
  const colleagueProblems = watchProblems(colleague);
  await signUpAndVerify(colleague, "Colin Colleague", colleagueEmail);
  await colleague.goto(await linkFromEmail(colleagueEmail, "/accept-invitation"));
  await expect(colleague).toHaveURL(/\/sign-in\?next=/);
  await signIn(colleague, colleagueEmail);
  await colleague.getByRole("button", { name: "Accept invitation" }).click();

  await expect(colleague.getByRole("heading", { name: "Acme Advisory" })).toBeVisible();
  await expect(colleague.getByRole("cell", { name: "Olivia Owner" })).toBeVisible();
  // A member can see the team but has no member-management controls.
  await expect(colleague.getByRole("button", { name: "Send invitation" })).toHaveCount(0);
  await expect(colleague.getByRole("combobox")).toHaveCount(0);

  // The owner now sees the colleague as a member.
  await owner.reload();
  await expect(owner.getByRole("cell", { name: "Colin Colleague" })).toBeVisible();

  // Sessions are listed on the account page; signing out returns to sign-in.
  await owner.goto("/account");
  await expect(owner.getByText("this device")).toBeVisible();
  await owner.getByRole("button", { name: "Sign out", exact: true }).first().click();
  await expect(owner).toHaveURL(/\/sign-in/);
  await owner.goto("/");
  await expect(owner).toHaveURL(/\/sign-in/);

  expect(ownerProblems, "owner page problems").toEqual([]);
  expect(colleagueProblems, "colleague page problems").toEqual([]);
});
