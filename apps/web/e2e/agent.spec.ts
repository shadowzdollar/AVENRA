import { expect, test } from "@playwright/test";
import { signIn, signUpAndVerify, watchProblems } from "./support";

/**
 * The Phase 7 journey in a real browser against the real AI service (its fake
 * provider): an owner switches planning on, the assistant proposes a plan,
 * nothing happens until it is approved, the reversible steps run, and the email
 * to the client waits for its own approval and is refused because the work has
 * no client address, without the assistant inventing one.
 */
test("the assistant proposes, people approve, the gateway decides", async ({ page }) => {
  const run = Date.now();
  const email = `planner-${run}@example.test`;
  const problems = watchProblems(page);
  await signUpAndVerify(page, "Paula Planner", email);
  await page.goto("/sign-in");
  await signIn(page, email);
  await page.getByLabel("Name").fill("Planned Advisors");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: /Planned Advisors/ }).click();

  await expect(page.getByTestId("planning-status")).toHaveText("Planning is off.");
  await page.getByRole("button", { name: "Switch planning on" }).click();
  await expect(page.getByTestId("planning-status")).toHaveText("Planning is on.");

  await page.getByRole("link", { name: "Work", exact: true }).click();
  await page.getByLabel("Title").fill("Onboarding Jane Doe");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name: "Onboarding Jane Doe" })).toBeVisible();
  await page.getByRole("button", { name: "Ready", exact: true }).click();
  await page.getByRole("button", { name: "Running", exact: true }).click();

  const assistant = page.getByTestId("assistant");
  await assistant.getByRole("button", { name: "Plan this work with the assistant" }).click();
  await expect(assistant.getByTestId("agent-run-status")).toHaveText("Waiting for your decision", { timeout: 20_000 });
  await expect(assistant.getByTestId("agent-step-1")).toContainText("Passport or national identity card");
  await expect(assistant).toContainText("high risk");
  await expect(page.getByText("Nothing is required yet.")).toBeVisible();

  await assistant.getByRole("button", { name: "Approve the plan", exact: true }).click();
  await expect(page.getByTestId("requirement-Passport or national identity card")).toBeVisible({ timeout: 20_000 });
  await expect(assistant.getByTestId("agent-run-status")).toHaveText("Waiting for your decision", { timeout: 20_000 });
  await assistant.getByRole("button", { name: "Approve this step" }).click();
  await expect(assistant.getByTestId("agent-run-status")).toHaveText("Failed", { timeout: 20_000 });
  await expect(assistant).toContainText("no email address");

  expect(problems).toEqual([]);
});
