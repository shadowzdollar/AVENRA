import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChecksView } from "./checks-view";
import { cleanRule, RULES_FOR_KIND, RuleEditor } from "./rule-editor";

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
    expect(RULES_FOR_KIND.DOCUMENT).toEqual(["FILE_TYPE", "FILE_SIZE"]);
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
            { rule: "PATTERN", outcome: "PASSED", severity: "BLOCKING", message: "Use 8 digits" },
            { rule: "EQUALS_REQUIREMENT", outcome: "SKIPPED", severity: "BLOCKING", message: "Must match" },
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
