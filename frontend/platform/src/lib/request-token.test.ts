import { describe, expect, it, vi } from "vitest";
import { readRequestToken } from "./request-token";

function browser(hash: string, stored: string | null = null) {
  const storage = new Map<string, string>(stored ? [["avenra.request-token", stored]] : []);
  return {
    location: { hash, pathname: "/request" } as Location,
    history: { replaceState: vi.fn() } as unknown as History,
    sessionStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => void storage.set(key, value),
    } as unknown as Storage,
    storage,
  };
}

describe("readRequestToken", () => {
  const token = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJ0123456";

  it("takes the token from the fragment and removes it from the address bar", () => {
    const b = browser(`#${token}`);
    expect(readRequestToken(b)).toBe(token);
    expect(b.history.replaceState).toHaveBeenCalledWith(null, "", "/request");
    expect(b.storage.get("avenra.request-token")).toBe(token);
  });

  it("falls back to the token kept for this tab", () => {
    expect(readRequestToken(browser("", token))).toBe(token);
  });

  it("rejects anything that is not a token", () => {
    expect(readRequestToken(browser("#short"))).toBeNull();
    expect(readRequestToken(browser("#<script>alert(1)</script>xxxxxxxxxxxxxxxx"))).toBeNull();
    expect(readRequestToken(browser("", "bad token"))).toBeNull();
  });
});
