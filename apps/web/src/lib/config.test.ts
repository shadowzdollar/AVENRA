import { parsePublicConfig } from "./config";

describe("parsePublicConfig", () => {
  it("accepts an absolute http(s) URL and removes trailing slashes", () => {
    expect(parsePublicConfig({ NEXT_PUBLIC_AVENRA_API_URL: "https://api.avenra.test/" })).toEqual({
      apiUrl: "https://api.avenra.test",
    });
  });

  it.each([
    ["missing", undefined],
    ["relative", "/api"],
    ["not a URL", "api.avenra.test"],
    ["unsafe scheme", "javascript:alert(1)"],
  ])("rejects a %s API URL", (_case, value) => {
    expect(() => parsePublicConfig({ NEXT_PUBLIC_AVENRA_API_URL: value })).toThrow(
      /Invalid web configuration: NEXT_PUBLIC_AVENRA_API_URL/,
    );
  });
});
