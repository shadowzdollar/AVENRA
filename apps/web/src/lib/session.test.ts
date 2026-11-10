import { safeNext } from "./session";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));

describe("safeNext", () => {
  it("allows same-origin paths", () => {
    expect(safeNext("/organizations/123?tab=members")).toBe("/organizations/123?tab=members");
  });

  it.each([
    ["missing", null],
    ["absolute URL", "https://evil.example/phish"],
    ["protocol-relative URL", "//evil.example/phish"],
    ["relative without slash", "evil.example"],
    ["javascript URL", "javascript:alert(1)"],
    // Browsers treat a backslash after the slash like a second slash.
    ["backslash URL", "/\\evil.example/phish"],
  ])("falls back to the organizations for a %s", (_case, value) => {
    expect(safeNext(value)).toBe("/organizations");
  });
});
