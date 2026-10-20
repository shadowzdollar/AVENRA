import { expect, test } from "@playwright/test";
import { signIn, signUpAndVerify, watchProblems } from "./support";

/**
 * The Phase 10 journey in a real browser: an owner changes the organization's
 * settings, sees usage and health, reads the roles matrix, finds the change in
 * the audit history and exports it.
 */
test("an owner administers the organization", async ({ page }) => {
  const email = `administrator-${Date.now()}@example.test`;
  const problems = watchProblems(page);
  await signUpAndVerify(page, "Ada Administrator", email);
  await page.goto("/sign-in");
  await signIn(page, email);
  await page.getByLabel("Name").fill("Administered Advisors");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: /Administered Advisors/ }).click();
  await page.getByRole("link", { name: "Administration" }).click();
  await expect(page.getByRole("heading", { name: "Administration" })).toBeVisible();

  await page.getByLabel("Request links valid for (days)").fill("21");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Settings saved.")).toBeVisible();

  await expect(page.getByTestId("usage-members")).toHaveText("1");
  await expect(page.getByTestId("health-status")).toHaveText("Everything looks fine.");
  await expect(page.getByRole("cell", { name: "audit.read" })).toBeVisible();

  const history = page.getByTestId("audit-history");
  await page.getByLabel("Action starts with").fill("organization.");
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(history).toContainText("organization.settings_changed");
  await expect(history).toContainText("requestLinkDays: 21");
  await expect(history).toContainText("Ada Administrator");

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export CSV" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^audit-.*\.csv$/);

  expect(problems).toEqual([]);
});
