import { describe, expect, it } from "vitest";
import { destination, EVENT_LABELS, statusText } from "./integrations";

const base = {
  id: "c",
  name: "CRM",
  status: "ACTIVE" as const,
  capabilities: [],
  events: [],
  consecutiveFailures: 0,
  createdAt: "2026-10-20T10:00:00Z",
  updatedAt: "2026-10-20T10:00:00Z",
};

describe("integrations", () => {
  it("describes where data goes without secrets", () => {
    expect(destination({ ...base, provider: "WEBHOOK", settings: { url: "https://hooks.example/avenra" } })).toBe("https://hooks.example/avenra");
    expect(
      destination({ ...base, provider: "S3_EXPORT", settings: { endpoint: "https://s3.example:9000", bucket: "records", prefix: "avenra/" } }),
    ).toBe("s3.example:9000 · records/avenra/");
    expect(destination({ ...base, provider: "S3_EXPORT", settings: { bucket: "records", prefix: "" } })).toBe("AWS S3 · records/");
  });

  it("says why a connection is paused", () => {
    expect(statusText({ ...base, provider: "WEBHOOK", settings: {}, status: "PAUSED", consecutiveFailures: 5 })).toBe("Paused after 5 failed deliveries");
    expect(statusText({ ...base, provider: "WEBHOOK", settings: {}, status: "PAUSED" })).toBe("Paused");
    expect(EVENT_LABELS["work.completed"]).toBe("Work completed");
  });
});
