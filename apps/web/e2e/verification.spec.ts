import { expect, test } from "@playwright/test";
import { linkFromEmail, signIn, signUpAndVerify, watchProblems } from "./support";

/**
 * The Phase 5 journey in a real browser (criterion 5.12): a team defines checks
 * for what it asks, a client sees exactly what is wrong straight away, a
 * passing answer is accepted automatically where the team allowed it, a person
 * accepts the rest, and completion produces a sealed, intact proof.
 */

const PDF = Buffer.from("%PDF-1.7\n% certificate\n%%EOF\n", "ascii");
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

test("checks give clients immediate feedback and completion is proven", async ({ browser }) => {
  const run = Date.now();
  const ownerEmail = `verifier-${run}@example.test`;
  const clientEmail = `verified-client-${run}@example.test`;

  const team = await browser.newPage();
  const teamProblems = watchProblems(team);
  await signUpAndVerify(team, "Vera Verifier", ownerEmail);
  await team.goto("/sign-in");
  await signIn(team, ownerEmail);
  await team.getByLabel("Name").fill("Checked Advisors");
  await team.getByRole("button", { name: "Create" }).click();
  await team.getByRole("link", { name: /Checked Advisors/ }).click();
  await team.getByRole("link", { name: "Work", exact: true }).click();
  await team.getByLabel("Title").fill("KYC for Initech");
  await team.getByRole("button", { name: "Create" }).click();
  await expect(team.getByRole("heading", { name: "KYC for Initech" })).toBeVisible();

  // A company number with a format check, accepted automatically when it passes.
  await team.getByLabel("What is required?").fill("Company number");
  await team.getByLabel("Type", { exact: true }).selectOption("TEXT");
  await team.getByRole("button", { name: "Add a check" }).click();
  await team.getByLabel("Pattern (regular expression for the whole answer)").fill("[0-9]{8}");
  await team.getByLabel("Message when it fails (the client sees it for rejected answers)").fill("Use the 8-digit registered number");
  await team.getByLabel("Who accepts answers").selectOption("AUTOMATIC");
  await team.getByRole("button", { name: "Add requirement" }).click();
  await expect(team.getByTestId("requirement-Company number").getByTestId("verification-policy")).toContainText(
    "1 check · accepted automatically when every check passes",
  );

  // A certificate that must be a PDF, accepted by a person.
  await team.getByLabel("What is required?").fill("Certificate");
  await team.getByLabel("Type", { exact: true }).selectOption("DOCUMENT");
  await team.getByRole("button", { name: "Add a check" }).click();
  await team.getByLabel("PDF").check();
  await team.getByLabel("Message when it fails (the client sees it for rejected answers)").fill("Send the certificate as a PDF");
  await team.getByRole("button", { name: "Add requirement" }).click();
  await expect(team.getByTestId("requirement-Certificate")).toBeVisible();
  await expect(team.getByTestId("completion-criteria")).toContainText("Every required item is accepted");

  await team.getByRole("button", { name: "Ready", exact: true }).click();
  await team.getByRole("button", { name: "Running", exact: true }).click();
  await expect(team.getByTestId("work-status")).toHaveText("Running");
  await team.getByLabel("Client email").fill(clientEmail);
  await team.getByRole("button", { name: "Send request" }).click();
  await expect(team.getByText("Request sent.")).toBeVisible();

  // The client, without an account.
  const link = await linkFromEmail(clientEmail, "/request", "/request#[A-Za-z0-9_-]+");
  const clientContext = await browser.newContext();
  const client = await clientContext.newPage();
  const clientProblems = watchProblems(client);
  await client.goto(link.replace(/^https?:\/\/[^/]+/, ""));
  await expect(client.getByRole("heading", { name: "Checked Advisors needs some information" })).toBeVisible();

  const number = client.getByTestId("item-Company number");
  await client.getByLabel("Answer for Company number").fill("1234");
  await number.getByRole("button", { name: "Send" }).click();
  await expect(number.getByTestId("problems")).toContainText("Use the 8-digit registered number");
  await expect(number.getByTestId("item-state")).toHaveText("Needs correction");
  await client.getByLabel("Answer for Company number").fill("12345678");
  await number.getByRole("button", { name: "Send" }).click();
  await expect(number.getByTestId("item-state")).toHaveText("Accepted");

  const certificate = client.getByTestId("item-Certificate");
  await certificate.getByLabel("File for Certificate").setInputFiles({ name: "certificate.png", mimeType: "image/png", buffer: PNG });
  await certificate.getByRole("button", { name: "Upload" }).click();
  await expect(certificate.getByTestId("problems")).toContainText("Send the certificate as a PDF");
  await certificate.getByLabel("File for Certificate").setInputFiles({ name: "certificate.pdf", mimeType: "application/pdf", buffer: PDF });
  await certificate.getByRole("button", { name: "Upload" }).click();
  await expect(certificate.getByTestId("item-state")).toHaveText("Received");

  // The team sees the structured checks, accepts the certificate and completes the work.
  await team.reload();
  const numberRow = team.getByTestId("requirement-Company number");
  await expect(numberRow.getByTestId("requirement-state")).toHaveText("Accepted");
  await expect(numberRow.getByText("decided by the checks")).toBeVisible();
  const certificateRow = team.getByTestId("requirement-Certificate");
  await expect(certificateRow.getByTestId("checks-status")).toContainText("Checks passed");
  await certificateRow.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(certificateRow.getByTestId("requirement-state")).toHaveText("Accepted");
  await expect(team.getByTestId("work-status")).toHaveText("Running", { timeout: 15_000 });
  await expect(team.getByTestId("completion-criteria")).not.toContainText("still to accept", { timeout: 15_000 });
  await team.reload();
  await team.getByRole("button", { name: "Completed", exact: true }).click();
  await expect(team.getByTestId("work-status")).toHaveText("Completed");
  await expect(team.getByTestId("manifest-integrity")).toContainText("Intact");
  await expect(team.getByTestId("manifest-sha256")).toContainText(/SHA-256 [0-9a-f]{64}/);
  await expect(team.getByTestId("evidence")).toContainText("system decision");

  expect(teamProblems, "team page problems").toEqual([]);
  // Rejected uploads answer 201 with problems; nothing else should fail.
  expect(clientProblems, "client page problems").toEqual([]);
  await clientContext.close();
});
