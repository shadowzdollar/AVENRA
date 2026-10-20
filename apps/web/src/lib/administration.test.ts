import { describe, expect, it } from "vitest";
import { actor, auditQuery, detailsText, exportHref, NO_FILTER } from "./administration";

const event = { id: "e", occurredAt: "2026-10-20T10:00:00Z", action: "organization.renamed", details: {} };

describe("administration", () => {
  it("sends only the filters a person filled in", () => {
    expect(auditQuery(NO_FILTER)).toEqual({});
    expect(auditQuery({ ...NO_FILTER, action: " work. " })).toEqual({ action: "work." });
  });

  it("makes the end date include the chosen day", () => {
    const query = auditQuery({ ...NO_FILTER, from: "2026-10-01", to: "2026-10-01" });
    expect(new Date(query.to ?? "").getTime() - new Date(query.from ?? "").getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("links the export with the same filter", () => {
    expect(exportHref("o", NO_FILTER)).toBe("/api/v1/organizations/o/audit-events/export");
    expect(exportHref("o", { ...NO_FILTER, action: "work." })).toBe("/api/v1/organizations/o/audit-events/export?action=work.");
  });

  it("names who acted", () => {
    expect(actor({ ...event, actorName: "Ada", actorUserId: "u" })).toBe("Ada");
    expect(actor({ ...event, actorUserId: "u" })).toBe("A former member");
    expect(actor(event)).toBe("Avenra or a client");
  });

  it("shows details on one line", () => {
    expect(detailsText({ ...event, details: { requestLinkDays: 30, workId: "w" } })).toBe("requestLinkDays: 30, workId: w");
  });
});
