import { describe, expect, it } from "vitest";
import { amount, fullness, standingText } from "./billing";

const base = { plan: "STARTER" as const, inGoodStanding: true, cancelAtPeriodEnd: false, provider: "fake", updatedAt: "2026-10-20T10:00:00Z" };

describe("billing", () => {
  it("shows amounts as people read them", () => {
    expect(amount("members", 5)).toBe("5");
    expect(amount("documents.bytes", 5 * 1024 ** 3)).toBe("5.0 GB");
    expect(amount("documents.bytes", 512)).toBe("512 bytes");
    expect(amount("work.open", undefined)).toBe("Unlimited");
  });

  it("measures how full a limit is", () => {
    expect(fullness(1, 4)).toBe(25);
    expect(fullness(9, 4)).toBe(100);
    expect(fullness(9, undefined)).toBe(0);
  });

  it("says where the subscription stands", () => {
    expect(standingText({ ...base, status: "TRIALING", trialEndsAt: "2026-11-19T10:00:00Z" })).toContain("Trial until November 19, 2026");
    expect(standingText({ ...base, status: "ACTIVE", cancelAtPeriodEnd: true })).toContain("ends at the end of the period");
    expect(standingText({ ...base, status: "PAST_DUE", inGoodStanding: false })).toContain("records stay available");
    expect(standingText({ ...base, status: "CANCELED", inGoodStanding: false })).toContain("Canceled");
  });
});
