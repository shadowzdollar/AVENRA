import { expect, test } from "@playwright/test";
import { watchProblems } from "./support";

/**
 * The sign-up and sign-in pages guide before the API decides (ADR-039): the
 * password checklist mirrors the server's rules, a mistyped mail domain is
 * caught, and a password can be shown.
 */
test("sign-up and sign-in guide people before the API decides", async ({ page }) => {
  const problems = watchProblems(page);
  await page.goto("/sign-up");
  await page.getByLabel("Work email").fill("jane@gmial.com");
  await page.getByRole("button", { name: "jane@gmail.com" }).click();
  await expect(page.getByLabel("Work email")).toHaveValue("jane@gmail.com");

  const guidance = page.getByTestId("password-guidance");
  await page.getByLabel("Password").fill("aaaa");
  await expect(guidance).toContainText("Too short");
  await page.getByLabel("Password").fill("Correct horse battery 7");
  await expect(guidance).toContainText("Very strong");
  await expect(guidance.getByText("At least 12 characters")).toHaveClass(/text-success/);

  await page.getByRole("button", { name: "Show the characters" }).click();
  await expect(page.getByLabel("Password")).toHaveAttribute("type", "text");

  await page.goto("/sign-in");
  await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
  await expect(page.getByText("Two-step verification")).toBeVisible();
  expect(problems).toEqual([]);
});
