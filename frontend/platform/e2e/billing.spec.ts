import { expect, test } from "@playwright/test";
import { signIn, signUpAndVerify, watchProblems } from "./support";

/**
 * The Phase 11 journey in a real browser: a new organization is on a trial,
 * its use is shown against the plan, the owner chooses a larger plan, and the
 * (fake) provider's confirmation makes it active.
 */
test("an owner moves from the trial to a paid plan", async ({ page }) => {
  const email = `payer-${Date.now()}@example.test`;
  const problems = watchProblems(page);
  await signUpAndVerify(page, "Pat Payer", email);
  await page.goto("/sign-in");
  await signIn(page, email);
  await page.getByLabel("Name").fill("Paying Advisors");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: /Paying Advisors/ }).click();
  await page.getByRole("link", { name: "Billing" }).click();
  await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();

  await expect(page.getByTestId("current-plan")).toHaveText("Starter");
  await expect(page.getByTestId("subscription-standing")).toContainText("Trial until");
  await expect(page.getByTestId("entitlement-members")).toContainText("1 of 5");

  await page.getByTestId("plan-BUSINESS").getByRole("button", { name: "Choose Business" }).click();
  await expect(page).toHaveURL(/\/billing\?checkout=returned$/);
  await expect(page.getByTestId("current-plan")).toHaveText("Business", { timeout: 20_000 });
  await expect(page.getByTestId("subscription-standing")).toContainText("Active");
  await expect(page.getByTestId("plan-BUSINESS")).toContainText("Your plan");
  await expect(page.getByTestId("entitlement-members")).toContainText("1 of 25");
  await expect(page.getByTestId("plan-ENTERPRISE")).toContainText("Talk to us");

  expect(problems).toEqual([]);
});
