import { expect, test } from "@playwright/test";
import { linkFromEmail, signIn, signUpAndVerify, watchProblems } from "./support";

/**
 * The Phase 6 journey in a real browser against the real AI service (its fake
 * provider without a key): an owner switches automatic reading on, the client
 * is told, an uploaded document is read, and the team sees what was read and
 * where it came from, as advisory checks only.
 */

const PASSPORT = Buffer.from("REPUBLIC OF EXAMPLE\nPASSPORT\nSurname: Doe\nDate of expiry: 2031-03-12\n", "utf-8");

test("documents are read automatically only when an owner allows it, and only advise", async ({ browser }) => {
  const run = Date.now();
  const ownerEmail = `reader-${run}@example.test`;
  const clientEmail = `read-client-${run}@example.test`;

  const team = await browser.newPage();
  const teamProblems = watchProblems(team);
  await signUpAndVerify(team, "Rita Reader", ownerEmail);
  await team.goto("/sign-in");
  await signIn(team, ownerEmail);
  await team.getByLabel("Name").fill("Reading Advisors");
  await team.getByRole("button", { name: "Create" }).click();
  await team.getByRole("link", { name: /Reading Advisors/ }).click();

  // Off by default; the owner switches it on.
  const settings = team.getByTestId("ai-settings");
  await expect(settings.getByTestId("ai-status")).toHaveText("Reading is off.");
  await settings.getByRole("button", { name: "Switch reading on" }).click();
  await expect(settings.getByTestId("ai-status")).toHaveText("Reading is on.");

  await team.getByRole("link", { name: "Work", exact: true }).click();
  await team.getByLabel("Title").fill("Onboarding Jane Doe");
  await team.getByRole("button", { name: "Create" }).click();
  await expect(team.getByRole("heading", { name: "Onboarding Jane Doe" })).toBeVisible();

  await team.getByLabel("What is required?").fill("Passport");
  await team.getByLabel("Type", { exact: true }).selectOption("DOCUMENT");
  await team.getByRole("button", { name: "Add a check" }).click();
  await team.getByTestId("rule-editor").locator("select").first().selectOption("DOCUMENT_KIND");
  await expect(team.getByTestId("ai-rule-note")).toContainText("never rejects or accepts");
  await team.getByLabel(/Acceptable kinds of document/).fill("passport");
  await team.getByLabel("Message when it fails (the client sees it for rejected answers)").fill("This does not look like a passport");
  await team.getByRole("button", { name: "Add requirement" }).click();
  await expect(team.getByTestId("requirement-Passport")).toBeVisible();

  await team.getByRole("button", { name: "Ready", exact: true }).click();
  await team.getByRole("button", { name: "Running", exact: true }).click();
  await expect(team.getByTestId("work-status")).toHaveText("Running");
  await team.getByLabel("Client email").fill(clientEmail);
  await team.getByRole("button", { name: "Send request" }).click();
  await expect(team.getByText("Request sent.")).toBeVisible();

  // The client is told that documents may be read automatically.
  const link = await linkFromEmail(clientEmail, "/request", "/request#[A-Za-z0-9_-]+");
  const clientContext = await browser.newContext();
  const client = await clientContext.newPage();
  const clientProblems = watchProblems(client);
  await client.goto(link.replace(/^https?:\/\/[^/]+/, ""));
  await expect(client.getByTestId("reading-notice")).toContainText("make every decision");
  const passport = client.getByTestId("item-Passport");
  await passport.getByLabel("File for Passport").setInputFiles({ name: "passport.txt", mimeType: "text/plain", buffer: PASSPORT });
  await passport.getByRole("button", { name: "Upload" }).click();
  await expect(passport.getByTestId("item-state")).toHaveText("Received");

  // The team sees what was read, as advice.
  const requirement = team.getByTestId("requirement-Passport");
  await expect(async () => {
    await team.reload();
    await expect(requirement.getByTestId("reading")).toContainText("Reads as: passport", { timeout: 2_000 });
  }).toPass({ timeout: 45_000 });
  await expect(requirement.getByTestId("checks")).toContainText("read automatically, advisory");

  await team.goto(new URL(team.url()).pathname.replace(/\/work\/.*$/, ""));
  await expect(team.getByTestId("ai-usage")).toContainText("Today: 1 of");

  expect(teamProblems).toEqual([]);
  expect(clientProblems).toEqual([]);
  await clientContext.close();
});
