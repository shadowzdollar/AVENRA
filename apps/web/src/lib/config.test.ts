import { parseServerConfig } from "./config";

describe("parseServerConfig", () => {
  it("accepts an absolute http(s) URL and removes trailing slashes", () => {
    expect(parseServerConfig({ AVENRA_API_INTERNAL_URL: "http://api.internal:8080/" })).toEqual({
      apiInternalUrl: "http://api.internal:8080",
    });
  });

  it.each([
    ["missing", undefined],
    ["relative", "/api"],
    ["not a URL", "api.internal"],
    ["unsafe scheme", "javascript:alert(1)"],
  ])("rejects a %s API URL", (_case, value) => {
    expect(() => parseServerConfig({ AVENRA_API_INTERNAL_URL: value })).toThrow(
      /Invalid web configuration: AVENRA_API_INTERNAL_URL/,
    );
  });
});
