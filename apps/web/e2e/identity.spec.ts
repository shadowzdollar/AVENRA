import { expect, test } from "@playwright/test";
import { linkFromEmail, signIn, signUpAndVerify, watchProblems } from "./support";

/**
 * The Phase 2 journey in a real browser (criterion 2.15): sign up, confirm the
 * email from the message that actually arrived, sign in, create an
 * organization, invite a colleague who joins with limited permissions, and
 * sign out. Every page must load without CSP violations or script errors.
 */

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
