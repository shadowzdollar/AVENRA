import { expect, test } from "@playwright/test";
import { signIn, signUpAndVerify, watchProblems } from "./support";

/**
 * The Phase 12 journey in a real browser: an owner creates work and sees it in
 * the organization's analytics, by period and by type of work.
 */
test("an owner sees how the organization's work is going", async ({ page }) => {
  const email = `analyst-${Date.now()}@example.test`;
  const problems = watchProblems(page);
  await signUpAndVerify(page, "Ana Analyst", email);
  await page.goto("/sign-in");
  await signIn(page, email);
  await page.getByLabel("Name").fill("Measured Advisors");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: /Measured Advisors/ }).click();
  await page.waitForURL(/\/organizations\/[0-9a-f-]+$/);
  const organization = page.url();

  await page.getByRole("link", { name: "Work", exact: true }).click();
  await page.getByRole("link", { name: "New work" }).first().click();
  await page.getByLabel("Title").fill("Quarterly filing");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name: "Quarterly filing" })).toBeVisible();

  await page.goto(organization);
  await page.getByRole("link", { name: "Analytics" }).click();
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
  await expect(page.getByTestId("metric-work.completed")).toContainText("0");
  await expect(page.getByTestId("metric-work.created")).toContainText("1");
  await expect(page.getByTestId("metric-work.completion_time_median")).toContainText("—");
  await expect(page.getByTestId("work-types")).toContainText("Untyped");
  await expect(page.getByText("Work completed per week")).toBeVisible();
  await expect(page.getByText("Quarterly filing")).toHaveCount(0);

  await page.getByLabel("Period").selectOption("7");
  await expect(page.getByTestId("metric-work.created")).toContainText("1");

  expect(problems).toEqual([]);
});
