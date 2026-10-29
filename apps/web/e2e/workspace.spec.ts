import { expect, test } from "@playwright/test";
import { signIn, signUpAndVerify, watchProblems } from "./support";

/**
 * The designed workspace on real data (ADR-039): the public page, the
 * overview, defining work, the organization-wide requests with a reminder,
 * the approvals, exceptions and evidence inboxes, and search.
 */
test("the workspace shows the organization's real work across its pages", async ({ page }) => {
  const problems = watchProblems(page);
  const email = `workspace-${Date.now()}@example.test`;
  const clientEmail = `client-${Date.now()}@example.test`;

  // The public page, signed out.
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /From intent\s+to\s+completed work\./ }).first()).toBeVisible();
  await expect(page.getByTestId("landing-plan-Starter")).toContainText("30-day trial");
  await expect(page.getByText("$")).toHaveCount(0);

  await signUpAndVerify(page, "Wanda Workspace", email);
  await page.goto("/sign-in");
  await signIn(page, email);
  await expect(page).toHaveURL(/\/organizations$/);
  await page.getByLabel("Name").fill("Workspace Advisors");
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: /Workspace Advisors/ }).click();

  // The overview, on an empty organization.
  await expect(page.getByRole("heading", { name: "Workspace Advisors" })).toBeVisible();
  await expect(page.getByTestId("overview-open")).toContainText("0");
  await expect(page.getByTestId("needs-attention")).toContainText("0 open exceptions");

  // A client, then work defined on its own page.
  await page.getByRole("link", { name: "Clients", exact: true }).click();
  await page.getByLabel("Client name").fill("Globex Ltd");
  await page.getByRole("button", { name: "Add client" }).click();
  await expect(page.getByRole("listitem").getByText("Globex Ltd")).toBeVisible();
  await page.getByRole("link", { name: "New work" }).first().click();
  await expect(page.getByRole("heading", { name: "Define new work" })).toBeVisible();
  await page.getByLabel("Title").fill("Onboard Globex");
  await page.getByRole("button", { name: "Client onboarding" }).click();
  await page.getByLabel("Client").selectOption({ label: "Globex Ltd" });
  await page.getByRole("button", { name: "Create work" }).click();
  await expect(page.getByRole("heading", { name: "Onboard Globex" })).toBeVisible();
  await expect(page.getByText("Client onboarding")).toBeVisible();

  // What it needs, and a request to the client.
  await page.getByLabel("What is required?").fill("Certificate of incorporation");
  await page.getByLabel("Type").selectOption("DOCUMENT");
  await page.getByRole("button", { name: "Add requirement" }).click();
  await page.getByRole("button", { name: "Ready", exact: true }).click();
  await page.getByRole("button", { name: "Running", exact: true }).click();
  await expect(page.getByTestId("work-status")).toHaveText("Running");
  await page.getByLabel("Client email").fill(clientEmail);
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Request sent.")).toBeVisible();

  // Requests across all work: the new request, and a reminder that is refused because it is too soon.
  await page.getByRole("link", { name: "Requests" }).click();
  const requests = page.getByTestId("requests");
  await expect(requests).toContainText("Onboard Globex");
  await expect(requests).toContainText("0 of 1");
  await expect(page.getByTestId("requests-waiting")).toContainText("1");
  await requests.getByRole("button", { name: "Remind" }).click();
  await expect(page.getByText("The recipient heard from you less than an hour ago.")).toBeVisible();

  // The inboxes are empty, and say so.
  await page.getByRole("link", { name: "Approvals" }).click();
  await expect(page.getByText("Nothing waiting for a decision")).toBeVisible();
  await page.getByRole("link", { name: "Exceptions" }).click();
  await expect(page.getByText("No open exceptions")).toBeVisible();
  await page.getByRole("link", { name: "Evidence" }).click();
  await expect(page.getByRole("heading", { name: "Evidence" })).toBeVisible();

  // Search from the header finds the work by its title.
  await page.getByLabel("Search work").fill("globex");
  await page.getByLabel("Search work").press("Enter");
  await expect(page.getByTestId("work-list")).toContainText("Onboard Globex");

  // Back on the overview, the work counts.
  await page.getByRole("link", { name: "Overview" }).click();
  await expect(page.getByTestId("overview-open")).toContainText("1");

  // Signed in, the public page offers the way back in.
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Open your workspace" }).first()).toBeVisible();

  // The one expected failure: the reminder refused as too soon (409).
  expect(problems.filter((problem) => !(problem.includes("409") && problem.includes("/reminders")))).toEqual([]);
});
