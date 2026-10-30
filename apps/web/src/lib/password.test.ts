import { describe, expect, it } from "vitest";
import { emailSuggestion, passwordChecks, strength } from "./password";

describe("password guidance", () => {
  it("mirrors the API's rules", () => {
    const met = (password: string, email = "jane@firm.test") => passwordChecks(password, email).map((check) => check.met);
    expect(met("short")).toEqual([false, true, true]);
    expect(met("aaaaaaaaaaaaaa")).toEqual([true, false, true]);
    expect(met("jane@firm.test")).toEqual([true, true, false]);
    expect(met("janejanejane", "janejanejane@firm.test")).toEqual([true, true, false]);
    expect(met("correct horse battery")).toEqual([true, true, true]);
    expect(met("x".repeat(129))[0]).toBe(false);
  });

  it("rates length first, then variety", () => {
    expect(strength("").score).toBe(0);
    expect(strength("abc").label).toBe("Too short");
    expect(strength("abcdefghijkl").label).toBe("Fair");
    expect(strength("abcdefghijklmnop").label).toBe("Strong");
    expect(strength("Correct horse battery 9").label).toBe("Very strong");
  });

  it("suggests a common mail domain one or two letters off", () => {
    expect(emailSuggestion("jane@gmial.com")).toBe("jane@gmail.com");
    expect(emailSuggestion("jane@outlok.com")).toBe("jane@outlook.com");
    expect(emailSuggestion("jane@gmail.com")).toBeNull();
    expect(emailSuggestion("jane@northwind-legal.com")).toBeNull();
    expect(emailSuggestion("not an email")).toBeNull();
  });
});
