import { describe, expect, it } from "vitest";
import { CATEGORY_LABELS, unreadLabel } from "./notifications";

describe("notifications", () => {
  it("counts unread notifications in the header", () => {
    expect(unreadLabel(undefined)).toBe("Notifications");
    expect(unreadLabel(0)).toBe("Notifications");
    expect(unreadLabel(3)).toBe("Notifications (3)");
    expect(unreadLabel(250)).toBe("Notifications (99+)");
  });

  it("names every category", () => {
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(6);
    expect(CATEGORY_LABELS.escalation).toContain("unattended");
  });
});
