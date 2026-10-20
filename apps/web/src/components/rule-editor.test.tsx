import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { highRiskWaiting, isActive, planNeedsApproval, RUN_STATUS } from "./agent-run";
import { formatCost } from "./ai-settings";
import { ChecksView } from "./checks-view";
import { ReadingView } from "./reading-view";
import { cleanRule, newRule, RULES_FOR_KIND, RuleEditor } from "./rule-editor";

describe("cleanRule", () => {
  it("keeps only the fields of the rule's type", () => {
    expect(cleanRule({ type: "PATTERN", severity: "BLOCKING", message: " Use 8 digits ", pattern: "[0-9]{8}", values: [], min: "1" })).toEqual({
      type: "PATTERN",
      severity: "BLOCKING",
      message: "Use 8 digits",
      pattern: "[0-9]{8}",
    });
    expect(cleanRule({ type: "FILE_TYPE", severity: "ADVISORY", message: "PDF", contentTypes: [] })).toEqual({
      type: "FILE_TYPE",
      severity: "ADVISORY",
      message: "PDF",
    });
  });

  it("offers checks that fit the kind of answer", () => {
    expect(RULES_FOR_KIND.DOCUMENT).toEqual(["FILE_TYPE", "FILE_SIZE", "DOCUMENT_KIND", "DOCUMENT_FIELD"]);
    expect(RULES_FOR_KIND.BOOLEAN).toEqual([]);
    expect(RULES_FOR_KIND.TEXT).toContain("PATTERN");
  });
});

describe("RuleEditor", () => {
  it("adds a check suited to the answer and edits it", () => {
    const onChange = vi.fn();
    render(<RuleEditor kind="DOCUMENT" rules={[]} onChange={onChange} others={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Add a check" }));
    expect(onChange).toHaveBeenCalledWith([{ type: "FILE_TYPE", severity: "BLOCKING", message: "" }]);
  });

  it("only offers other answers of the same kind for consistency checks", () => {
    render(
      <RuleEditor
        kind="TEXT"
        rules={[{ type: "EQUALS_REQUIREMENT", severity: "BLOCKING", message: "Must match" }]}
        onChange={() => {}}
        others={[
          { id: "a", title: "Legal name", kind: "TEXT" },
          { id: "b", title: "Start date", kind: "DATE" },
        ]}
      />,
    );
    expect(screen.getByRole("option", { name: "Legal name" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Start date" })).toBeNull();
  });
});

describe("ChecksView", () => {
  it("shows every check and waits visibly for related answers", () => {
    render(
      <ChecksView
        result={{
          id: "r",
          itemId: "i",
          status: "NEEDS_REVIEW",
          confidence: 0.5,
          checks: [
            { rule: "PATTERN", outcome: "PASSED", severity: "BLOCKING", message: "Use 8 digits", aiDerived: false },
            { rule: "EQUALS_REQUIREMENT", outcome: "SKIPPED", severity: "BLOCKING", message: "Must match", aiDerived: false },
          ],
          evidence: [],
          method: "RULES",
          rulesVersion: 1,
          createdAt: "2026-10-14T10:00:00Z",
        }}
      />,
    );
    expect(screen.getByTestId("checks-status")).toHaveTextContent("Needs a closer look · confidence 50%");
    expect(screen.getByText(/Must match \(waiting for the related answer\)/)).toBeInTheDocument();
  });
});

describe("AI document rules", () => {
  it("are always advisory, whatever the rule says", () => {
    expect(newRule("DOCUMENT_KIND").severity).toBe("ADVISORY");
    expect(cleanRule({ type: "DOCUMENT_FIELD", severity: "BLOCKING", message: " Name ", field: "Surname", fieldKind: "TEXT", values: ["x"] })).toEqual({
      type: "DOCUMENT_FIELD",
      severity: "ADVISORY",
      message: "Name",
      field: "Surname",
      fieldKind: "TEXT",
    });
  });

  it("explain that they only flag, and that reading may be off", () => {
    render(
      <RuleEditor
        kind="DOCUMENT"
        rules={[{ type: "DOCUMENT_KIND", severity: "ADVISORY", message: "Not a passport", values: ["passport"] }]}
        onChange={() => {}}
        others={[]}
        readingEnabled={false}
      />,
    );
    expect(screen.getByTestId("ai-rule-note")).toHaveTextContent("never rejects or accepts");
    expect(screen.getByTestId("ai-rule-note")).toHaveTextContent("switched off");
    expect(screen.getByDisplayValue("Flag for review")).toBeDisabled();
  });

  it("offer only answers of the field's kind to compare with", () => {
    render(
      <RuleEditor
        kind="DOCUMENT"
        rules={[{ type: "DOCUMENT_FIELD", severity: "ADVISORY", message: "Name differs", field: "Surname", fieldKind: "TEXT" }]}
        onChange={() => {}}
        others={[
          { id: "a", title: "Legal name", kind: "TEXT" },
          { id: "b", title: "Start date", kind: "DATE" },
        ]}
      />,
    );
    expect(screen.getByRole("option", { name: "Legal name" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Start date" })).toBeNull();
  });
});

describe("ReadingView", () => {
  it("shows what was read, where it came from, and warnings", () => {
    render(
      <ReadingView
        reading={{
          status: "DONE",
          kind: { label: "passport", confidence: 0.9 },
          fields: [
            { name: "Surname", kind: "TEXT", found: true, value: "Doe", quote: "Surname: Doe", page: 1, located: true },
            { name: "Given names", kind: "TEXT", found: true, value: "Jane", quote: "Jane", located: false },
            { name: "Tax number", kind: "TEXT", found: false },
          ],
          instructionsDetected: true,
          proposals: [{ tool: "flag_for_review", risk: "LOW", reason: "Text for an AI reader." }],
          model: "claude-sonnet-5-5",
        }}
      />,
    );
    expect(screen.getByTestId("reading")).toHaveTextContent("Reads as: passport");
    expect(screen.getByText(/“Surname: Doe”, page 1/)).toBeInTheDocument();
    expect(screen.getByText(/passage not found in the document/)).toBeInTheDocument();
    expect(screen.getByText("not found")).toBeInTheDocument();
    expect(screen.getByTestId("reading-instructions")).toBeInTheDocument();
    expect(screen.getByTestId("reading-proposals")).toHaveTextContent("Suggestion: Look at this document closely");
  });

  it("says why a document was not read", () => {
    render(<ReadingView reading={{ status: "SKIPPED", reason: "Automatic document reading is switched off.", fields: [], instructionsDetected: false, proposals: [] }} />);
    expect(screen.getByTestId("reading-unavailable")).toHaveTextContent("switched off");
  });
});

describe("ChecksView with AI checks", () => {
  it("marks them as read automatically and shows what was read", () => {
    render(
      <ChecksView
        result={{
          id: "r",
          itemId: "i",
          status: "NEEDS_REVIEW",
          checks: [{ rule: "DOCUMENT_FIELD", outcome: "FAILED", severity: "ADVISORY", message: "Name differs", detail: 'read "Roe" from "Surname: Roe"', aiDerived: true }],
          evidence: [],
          method: "RULES",
          rulesVersion: 1,
          createdAt: "2026-10-15T10:00:00Z",
        }}
      />,
    );
    expect(screen.getByTestId("checks-status")).toHaveTextContent("Needs a closer look");
    expect(screen.getByTestId("checks-status")).not.toHaveTextContent("confidence");
    expect(screen.getByText(/read automatically, advisory/)).toBeInTheDocument();
    expect(screen.getByText(/Surname: Roe/)).toBeInTheDocument();
  });
});

describe("formatCost", () => {
  it("shows small amounts precisely", () => {
    expect(formatCost(540)).toBe("$0.0005");
    expect(formatCost(2_500_000)).toBe("$2.50");
  });
});

describe("agent runs", () => {
  const step = (position: number, risk: "MEDIUM" | "HIGH", status: "PROPOSED" | "SUCCEEDED" = "PROPOSED") => ({
    id: `s${position}`,
    position,
    tool: risk === "HIGH" ? ("send_information_request" as const) : ("create_requirement" as const),
    risk,
    input: {},
    status,
    needsOwnApproval: risk === "HIGH",
    attempts: 0,
  });
  const run = (status: "AWAITING_APPROVAL" | "RUNNING" | "COMPLETED", steps: ReturnType<typeof step>[]) => ({
    id: "r",
    workId: "w",
    capability: "information.plan" as const,
    status,
    startedByUserId: "u",
    budget: {
      maxModelCalls: 1,
      maxToolCalls: 20,
      maxSideEffects: 1,
      maxCostMicros: 200000,
      deadline: "2026-10-20T10:00:00Z",
      modelCalls: 1,
      toolCalls: 0,
      sideEffects: 0,
      costMicros: 0,
    },
    steps,
    createdAt: "2026-10-20T09:00:00Z",
  });

  it("asks for the plan's approval first, then for each high-risk step", () => {
    const fresh = run("AWAITING_APPROVAL", [step(1, "MEDIUM"), step(2, "HIGH")]);
    expect(planNeedsApproval(fresh)).toBe(true);
    expect(highRiskWaiting(fresh).map((s) => s.id)).toEqual(["s2"]);
    const atTheEmail = run("AWAITING_APPROVAL", [step(1, "MEDIUM", "SUCCEEDED"), step(2, "HIGH")]);
    expect(planNeedsApproval(atTheEmail)).toBe(false);
    expect(highRiskWaiting(atTheEmail)).toHaveLength(1);
  });

  it("keeps polling only while the run moves on its own", () => {
    expect(isActive(run("RUNNING", []))).toBe(true);
    expect(isActive(run("AWAITING_APPROVAL", []))).toBe(false);
    expect(isActive(run("COMPLETED", []))).toBe(false);
    expect(isActive(undefined)).toBe(false);
    expect(RUN_STATUS.AWAITING_APPROVAL).toBe("Waiting for your decision");
  });
});
