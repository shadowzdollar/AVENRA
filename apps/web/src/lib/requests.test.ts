import { describe, expect, it } from "vitest";
import { requestState } from "./requests";

const now = new Date("2026-10-29T12:00:00Z");
const base = {
  id: "l",
  workId: "w",
  recipientEmail: "c@x.test",
  requirementIds: ["a", "b"],
  status: "ACTIVE" as const,
  createdAt: "2026-10-20T12:00:00Z",
  expiresAt: "2026-11-10T12:00:00Z",
  remindersSent: 0,
};

describe("request state", () => {
  it("is answered once every requested item has an answer", () => {
    expect(requestState({ ...base, answeredCount: 2 }, now)).toBe("ANSWERED");
    expect(requestState({ ...base, answeredCount: 1 }, now)).toBe("WAITING");
  });

  it("warns two days before an unanswered request expires", () => {
    expect(requestState({ ...base, expiresAt: "2026-10-30T12:00:00Z" }, now)).toBe("EXPIRING");
  });

  it("shows revoked and expired requests as over", () => {
    expect(requestState({ ...base, status: "REVOKED", answeredCount: 2 }, now)).toBe("REVOKED");
    expect(requestState({ ...base, status: "EXPIRED" }, now)).toBe("EXPIRED");
  });
});
