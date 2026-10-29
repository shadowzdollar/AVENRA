import { describe, expect, it } from "vitest";
import { change, duration, formatValue } from "./analytics";

describe("analytics", () => {
  it("shows durations people can read", () => {
    expect(duration(30)).toBe("30 s");
    expect(duration(720)).toBe("12 min");
    expect(duration(7200)).toBe("2.0 h");
    expect(duration(2 * 86_400)).toBe("2.0 days");
  });

  it("formats values by unit and shows a dash when nothing was measured", () => {
    expect(formatValue("PERCENT", 50)).toBe("50%");
    expect(formatValue("COUNT", 1200)).toBe("1,200");
    expect(formatValue("BYTES", 2048)).toBe("2.0 KB");
    expect(formatValue("SECONDS", undefined)).toBe("—");
  });

  it("describes the change from the period before", () => {
    expect(change("COUNT", 5, 3)).toBe("up from 3");
    expect(change("PERCENT", 40, 50)).toBe("down 10 points");
    expect(change("COUNT", 2, 2)).toBe("same as the period before");
    expect(change("COUNT", 2, undefined)).toBeNull();
  });
});
