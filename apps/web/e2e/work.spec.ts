import { expect, test } from "@playwright/test";
import { linkFromEmail, signIn, signUpAndVerify, watchProblems } from "./support";

/**
 * The Phase 3 and 4 journey in a real browser (criteria 3.12 and 4.15): a team
 * defines work and what it requires, asks a client for it through a request
 * link, the client answers without an account (a virus is refused), the
 * platform moves the work between waiting and running on its own and opens
 * review tasks, and the team reviews until the work is complete. No CSP
 * violations or script errors anywhere.
 */

const PDF = Buffer.from("%PDF-1.7\n% statement\n%%EOF\n", "ascii");
// The EICAR test file: harmless, detected by every scanner. Assembled here so
// this source file is not flagged itself.
const EICAR = Buffer.from("X5O!P%@AP[4\\PZX54(P^)7CC)7}$" + "EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*", "ascii");

test("define work, collect from a client through a link, review to complete", async ({ browser }) => {
  const run = Date.now();
  const ownerEmail = `team-${run}@example.test`;
  const clientEmail = `client-${run}@example.test`;

  const team = await browser.newPage();
  const teamProblems = watchProblems(team);
  await signUpAndVerify(team, "Tara Team", ownerEmail);
  await team.goto("/sign-in");
  await signIn(team, ownerEmail);
  await team.getByLabel("Name").fill("Northwind Advisors");
  await team.getByRole("button", { name: "Create" }).click();
  await team.getByRole("link", { name: /Northwind Advisors/ }).click();

  // A client, then work for that client.
  await team.getByRole("link", { name: "Clients", exact: true }).click();
  await team.getByLabel("Client name").fill("Acme Ltd");
  await team.getByRole("button", { name: "Add client" }).click();
  await expect(team.getByRole("listitem").getByText("Acme Ltd")).toBeVisible();
  await team.getByRole("link", { name: "Work", exact: true }).click();
  await team.getByRole("link", { name: "New work" }).first().click();
  await team.getByLabel("Title").fill("Onboarding Acme");
  await team.getByLabel("Client").selectOption({ label: "Acme Ltd" });
  await team.getByRole("button", { name: "Create" }).click();
  await expect(team.getByRole("heading", { name: "Onboarding Acme" })).toBeVisible();
  await expect(team.getByTestId("work-status")).toHaveText("Draft");

  // What the work requires.
  await team.getByLabel("What is required?").fill("Bank statement");
  await team.getByLabel("Type").selectOption("DOCUMENT");
  await team.getByRole("button", { name: "Add requirement" }).click();
  await expect(team.getByTestId("requirement-Bank statement")).toBeVisible();
  await team.getByLabel("What is required?").fill("Company number");
  await team.getByLabel("Type").selectOption("TEXT");
  await team.getByRole("button", { name: "Add requirement" }).click();
  await expect(team.getByTestId("requirement-Company number")).toBeVisible();
  await expect(team.getByTestId("completeness")).toContainText("0 of 2 accepted");

  // Lifecycle: start the work.
  await team.getByRole("button", { name: "Ready", exact: true }).click();
  await expect(team.getByTestId("work-status")).toHaveText("Ready");
  await team.getByRole("button", { name: "Running", exact: true }).click();
  await expect(team.getByTestId("work-status")).toHaveText("Running");

  // Ask the client.
  await team.getByLabel("Client email").fill(clientEmail);
  await team.getByLabel("Message (optional)").fill("Please send these by Friday.");
  await team.getByRole("button", { name: "Send request" }).click();
  await expect(team.getByText("Request sent.")).toBeVisible();
  await expect(team.getByText(clientEmail)).toBeVisible();
  // Phase 4: the platform moves the work to waiting on its own and says what happens next.
  await expect(team.getByTestId("work-status")).toHaveText("Waiting for information", { timeout: 15_000 });
  await expect(team.getByTestId("next-action")).toContainText("client still has to provide 2 items");
  await expect(team.getByText("automatic (information.requested)")).toBeVisible({ timeout: 15_000 });

  // The client, in a separate browser context with no account.
  const link = await linkFromEmail(clientEmail, "/request", "/request#[A-Za-z0-9_-]+");
  const clientContext = await browser.newContext();
  const client = await clientContext.newPage();
  const clientProblems = watchProblems(client);
  await client.goto(link.replace(/^https?:\/\/[^/]+/, ""));
  await expect(client.getByRole("heading", { name: "Northwind Advisors needs some information" })).toBeVisible();
  await expect(client.getByText("Please send these by Friday.")).toBeVisible();
  // The token left the address bar.
  expect(new URL(client.url()).hash).toBe("");

  await client.getByLabel("Answer for Company number").fill("09876543");
  await client.getByRole("button", { name: "Send" }).click();
  await expect(client.getByTestId("item-Company number").getByTestId("item-state")).toHaveText("Received");

  // A virus is refused, and nothing is recorded.
  const statement = client.getByTestId("item-Bank statement");
  await statement.getByLabel("File for Bank statement").setInputFiles({ name: "statement.txt", mimeType: "text/plain", buffer: EICAR });
  await statement.getByRole("button", { name: "Upload" }).click();
  await expect(statement.getByRole("alert")).toContainText("malware");
  await expect(statement.getByTestId("item-state")).toHaveText("Missing");

  await statement.getByLabel("File for Bank statement").setInputFiles({ name: "statement.pdf", mimeType: "application/pdf", buffer: PDF });
  await statement.getByRole("button", { name: "Upload" }).click();
  await expect(statement.getByTestId("item-state")).toHaveText("Received");
  await expect(client.getByText("everything requested has been sent")).toBeVisible();

  // Everything answered: the work resumes by itself, with a review task per answer.
  await team.reload();
  await expect(team.getByTestId("work-status")).toHaveText("Running", { timeout: 15_000 });
  await expect(team.getByText("automatic (information.received)")).toBeVisible({ timeout: 15_000 });
  await expect(team.getByText("Review: Company number")).toBeVisible({ timeout: 15_000 });
  await expect(team.getByText("closes when reviewed").first()).toBeVisible();
  await expect(team.getByTestId("next-action")).toContainText("Review 2 answers");
  await expect(team.getByTestId("executions")).toContainText("work.advance");

  // The team reviews: rejects one answer, which the client corrects.
  const number = team.getByTestId("requirement-Company number");
  await expect(number.getByTestId("requirement-state")).toHaveText("Awaiting review");
  await expect(number.getByText("from client link")).toBeVisible();
  await number.getByLabel("Reason for rejecting (shown to the client)").fill("Use the registered number");
  await number.getByRole("button", { name: "Reject" }).click();
  await expect(number.getByTestId("requirement-state")).toHaveText("Needs correction");
  // The client was asked to correct it: the work waits again.
  await expect(team.getByTestId("work-status")).toHaveText("Waiting for information", { timeout: 15_000 });

  await client.reload();
  await expect(client.getByText("Please correct this: Use the registered number")).toBeVisible();
  await client.getByLabel("Answer for Company number").fill("01234567");
  await client.getByRole("button", { name: "Send" }).click();
  await expect(client.getByTestId("item-Company number").getByTestId("item-state")).toHaveText("Received");

  await team.reload();
  await expect(team.getByTestId("work-status")).toHaveText("Running", { timeout: 15_000 });
  const statementRow = team.getByTestId("requirement-Bank statement");
  // The uploaded file downloads as an attachment.
  const download = team.waitForEvent("download");
  await statementRow.getByRole("link", { name: "statement.pdf" }).click();
  expect((await download).suggestedFilename()).toBe("statement.pdf");
  await statementRow.getByRole("button", { name: "Accept" }).click();
  await expect(statementRow.getByTestId("requirement-state")).toHaveText("Accepted");
  await team.getByTestId("requirement-Company number").getByRole("button", { name: "Accept" }).click();
  await expect(team.getByTestId("completeness")).toContainText("2 of 2 accepted");

  await team.getByRole("button", { name: "Completed", exact: true }).click();
  await expect(team.getByTestId("work-status")).toHaveText("Completed");

  // Finished work closes its links.
  await client.reload();
  await expect(client.getByText("This link is invalid, has expired or was withdrawn")).toBeVisible();

  expect(teamProblems, "team page problems").toEqual([]);
  // The client's virus upload answers 422 and the closed link 404; Chrome logs both.
  expect(clientProblems.filter((problem) => !/status of (404|422)/.test(problem)), "client page problems").toEqual([]);
  await clientContext.close();
});
