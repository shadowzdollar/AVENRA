import { expect, test } from "@playwright/test";
import { signIn, signUpAndVerify, watchProblems } from "./support";

/**
 * The Phase 9 journey in a real browser: a plan waiting for approval tells the
 * person who can approve it, in the header and on the notifications page; the
 * notification leads to the work; preferences are saved.
 */
test("people are told what needs them and choose how", async ({ page }) => {
  const email = `notified-${Date.now()}@example.test`;
  const problems = watchProblems(page);
  await signUpAndVerify(page, "Nora Notified", email);
  await page.goto("/sign-in");
  await signIn(page, email);
  await page.getByLabel("Name").fill("Notified Advisors");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: /Notified Advisors/ }).click();
  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Switch planning on" }).click();
  await expect(page.getByTestId("planning-status")).toHaveText("Planning is on.");

  await page.getByRole("link", { name: "Work", exact: true }).click();
  await page.getByRole("link", { name: "New work" }).first().click();
  await page.getByLabel("Title").fill("Onboarding Nina Novak");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name: "Onboarding Nina Novak" })).toBeVisible();
  await page.getByRole("button", { name: "Ready", exact: true }).click();
  await page.getByRole("button", { name: "Running", exact: true }).click();
  await page.getByTestId("assistant").getByRole("button", { name: "Plan this work with the assistant" }).click();
  await expect(page.getByTestId("agent-run-status")).toHaveText("Waiting for your decision", { timeout: 20_000 });

  await expect(async () => {
    await page.reload();
    await expect(page.getByTestId("notification-bell")).toHaveText("Notifications (1)", { timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await page.getByTestId("notification-bell").click();
  const list = page.getByTestId("notifications");
  await expect(list).toContainText("A plan waits for your decision");
  await list.getByRole("link", { name: "Open" }).click();
  await expect(page.getByRole("heading", { name: "Onboarding Nina Novak" })).toBeVisible();
  await expect(page.getByTestId("notification-bell")).toHaveText("Notifications");

  await page.getByLabel("Account menu").click();
  await page.getByRole("link", { name: "Account" }).click();
  const preferences = page.getByTestId("notification-preferences");
  const answers = preferences.getByLabel("Answers from clients");
  await expect(answers).not.toBeChecked();
  await answers.check();
  await page.reload();
  await expect(page.getByTestId("notification-preferences").getByLabel("Answers from clients")).toBeChecked();
  expect(problems).toEqual([]);
});
