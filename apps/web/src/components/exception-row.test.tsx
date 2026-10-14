import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { components } from "@avenra/contracts";
import { ExceptionRow } from "./exception-row";

type WorkException = components["schemas"]["WorkException"];

const open: WorkException = {
  id: "8a5c2b6e-1d2f-4a8b-9c0d-1e2f3a4b5c6d",
  type: "REQUEST_EXPIRED_INCOMPLETE",
  severity: "MEDIUM",
  description: "The request expired with 2 required items still missing.",
  source: { type: "request_link", id: "x" },
  status: "OPEN",
  createdAt: "2026-10-14T10:00:00Z",
  allowedTransitions: ["DISMISSED", "IN_PROGRESS", "RESOLVED", "WAITING"],
};

function show(exception: WorkException, canUpdate = true) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ExceptionRow ids={{ organizationId: "org" }} exception={exception} canUpdate={canUpdate} />
    </QueryClientProvider>,
  );
}

describe("ExceptionRow", () => {
  it("says what happened and offers only the allowed moves", () => {
    show(open);
    expect(screen.getByText(open.description)).toBeInTheDocument();
    expect(screen.getByTestId("exception-status")).toHaveTextContent("open");
    expect(screen.getByRole("button", { name: "Working on it" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Resolve" })).toBeDisabled();
  });

  it("asks for a resolution before closing", () => {
    show(open);
    fireEvent.change(screen.getByLabelText("Resolution (needed to resolve or dismiss)"), {
      target: { value: "Called the client" },
    });
    expect(screen.getByRole("button", { name: "Resolve" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeEnabled();
  });

  it("shows closed exceptions without actions, and none to viewers", () => {
    show({ ...open, status: "RESOLVED", allowedTransitions: [], resolution: "Sorted" });
    expect(screen.getByText("Resolution: Sorted")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("offers no actions to people who may not change work", () => {
    show(open, false);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
