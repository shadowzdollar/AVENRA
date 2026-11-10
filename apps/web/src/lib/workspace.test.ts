import { describe, expect, it } from "vitest";
import { greeting, navigation } from "./workspace";

describe("workspace navigation", () => {
  it("shows only what the permissions allow", () => {
    const viewer = navigation("o", new Set(["organization.read", "members.read", "work.read", "information.read"]));
    const labels = viewer.flatMap((group) => group.items.map((item) => item.label));
    expect(labels).toEqual(["Overview", "Work", "Clients", "Requests", "Approvals", "Exceptions", "Evidence", "Team", "Settings"]);
    expect(labels).not.toContain("Billing");
    expect(labels).not.toContain("Analytics");
  });

  it("links inside the organization and drops empty groups", () => {
    const nobody = navigation("o", new Set());
    expect(nobody).toEqual([{ label: "Work", items: [{ label: "Overview", href: "/organizations/o", icon: "overview", exact: true }] }]);
  });

  it("greets by the time of day", () => {
    expect(greeting(new Date(2026, 9, 29, 9))).toBe("Good morning");
    expect(greeting(new Date(2026, 9, 29, 14))).toBe("Good afternoon");
    expect(greeting(new Date(2026, 9, 29, 20))).toBe("Good evening");
  });
});
