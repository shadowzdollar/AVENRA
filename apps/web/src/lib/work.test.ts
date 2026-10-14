import { describe, expect, it } from "vitest";
import { completenessSummary, formatBytes, needsReason, statusLabel } from "./work";

describe("work helpers", () => {
  it("summarises completeness", () => {
    expect(completenessSummary({ required: 4, accepted: 1, awaitingReview: 1, missing: 1, rejected: 1, complete: false })).toEqual({
      text: "1 of 4 accepted",
      ratio: 0.25,
    });
    expect(completenessSummary({ required: 0, accepted: 0, awaitingReview: 0, missing: 0, rejected: 0, complete: true }).ratio).toBe(0);
  });

  it("requires reasons only for stopping states", () => {
    expect(needsReason("BLOCKED")).toBe(true);
    expect(needsReason("CANCELLED")).toBe(true);
    expect(needsReason("RUNNING")).toBe(false);
    expect(statusLabel("WAITING_FOR_INFORMATION")).toBe("Waiting for information");
  });

  it("formats sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
