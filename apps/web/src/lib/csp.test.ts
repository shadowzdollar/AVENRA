import { buildContentSecurityPolicy } from "./csp";

function directives(policy: string): Map<string, string> {
  return new Map(
    policy.split("; ").map((directive) => {
      const [name = "", ...values] = directive.split(" ");
      return [name, values.join(" ")];
    }),
  );
}

describe("buildContentSecurityPolicy", () => {
  const production = directives(
    buildContentSecurityPolicy({ nonce: "abc123", apiOrigin: "https://api.avenra.test", development: false }),
  );

  it("allows scripts only from our origin or with the nonce, never eval or inline", () => {
    const scripts = production.get("script-src");
    expect(scripts).toContain("'nonce-abc123'");
    expect(scripts).not.toContain("unsafe-eval");
    expect(scripts).not.toContain("unsafe-inline");
  });

  it("lets the browser talk only to our origin and the API", () => {
    expect(production.get("connect-src")).toBe("'self' https://api.avenra.test");
  });

  it("forbids framing, plugins and foreign form targets", () => {
    expect(production.get("frame-ancestors")).toBe("'none'");
    expect(production.get("object-src")).toBe("'none'");
    expect(production.get("form-action")).toBe("'self'");
    expect(production.has("upgrade-insecure-requests")).toBe(true);
  });

  it("allows eval only in development", () => {
    const development = directives(
      buildContentSecurityPolicy({ nonce: "n", apiOrigin: "http://localhost:8080", development: true }),
    );
    expect(development.get("script-src")).toContain("'unsafe-eval'");
    expect(development.has("upgrade-insecure-requests")).toBe(false);
  });
});
