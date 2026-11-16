import { createHmac } from "node:crypto";
import { createServer, type IncomingHttpHeaders } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test } from "@playwright/test";
import { signIn, signUpAndVerify, watchProblems } from "./support";

/**
 * The Phase 8 journey in a real browser: an owner connects a webhook, sees the
 * signing secret once, sends a test, and the receiver can verify the signature.
 * The receiver runs on loopback, which local development allows (ADR-034).
 */
test("a webhook is connected, tested and signed", async ({ page }) => {
  const received: { headers: IncomingHttpHeaders; body: string }[] = [];
  const server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk: Buffer) => (body += chunk.toString("utf-8")));
    request.on("end", () => {
      received.push({ headers: request.headers, body });
      response.writeHead(204).end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/hook`;

  try {
    const email = `integrator-${Date.now()}@example.test`;
    const problems = watchProblems(page);
    await signUpAndVerify(page, "Ivan Integrator", email);
    await page.goto("/sign-in");
    await signIn(page, email);
    await page.getByLabel("Name").fill("Connected Advisors");
    await page.getByRole("button", { name: "Create" }).click();
    await page.getByRole("link", { name: /Connected Advisors/ }).click();
    await page.getByRole("link", { name: "Integrations" }).click();
    await expect(page.getByRole("heading", { name: "Integrations" })).toBeVisible();

    await page.getByLabel("Name").fill("Our CRM");
    await page.getByLabel("Address (HTTPS)").fill(url);
    await page.getByLabel("An answer was received").check();
    await page.getByRole("button", { name: "Connect" }).click();
    const secretText = await page.getByTestId("signing-secret").textContent();
    const secret = /whsec_[0-9a-f]{64}/.exec(secretText ?? "")?.[0];
    expect(secret).toBeTruthy();

    const connection = page.getByTestId("connection-Our CRM");
    await expect(connection.getByTestId("connection-status")).toHaveText("Active");
    await connection.getByRole("button", { name: "Send a test" }).click();
    await expect(connection.getByTestId("deliveries")).toContainText("delivered", { timeout: 20_000 });

    expect(received).toHaveLength(1);
    const [hook] = received;
    const signature = String(hook?.headers["avenra-signature"]);
    const timestamp = signature.slice(2, signature.indexOf(","));
    const expected = createHmac("sha256", secret ?? "").update(`${timestamp}.${hook?.body}`).digest("hex");
    expect(signature).toBe(`t=${timestamp},v1=${expected}`);
    expect(hook?.headers["avenra-event-type"]).toBe("integration.test");

    // The secret is not shown again after a reload.
    await page.reload();
    await expect(page.getByTestId("signing-secret")).toHaveCount(0);
    expect(problems).toEqual([]);
  } finally {
    server.close();
  }
});
