import type { components } from "@avenra/contracts";

type DocumentReading = components["schemas"]["DocumentReading"];

const PROPOSALS: Record<components["schemas"]["AiProposal"]["tool"], string> = {
  request_clearer_copy: "Ask the client for a clearer copy",
  flag_for_review: "Look at this document closely",
};

/**
 * What an automatic reading found in a document (ADR-031), with the passage each value came from.
 * Shown as information for a person; nothing here decides anything.
 */
export function ReadingView({ reading }: { reading: DocumentReading }) {
  if (reading.status === "PENDING") {
    return <p className="text-sm text-text-secondary">Reading the document…</p>;
  }
  if (reading.status !== "DONE") {
    return (
      <p className="text-sm text-text-secondary" data-testid="reading-unavailable">
        Not read automatically{reading.reason ? `: ${reading.reason}` : "."}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border p-2 text-sm" data-testid="reading">
      <p className="text-text-secondary">
        Read automatically{reading.model ? ` (${reading.model})` : ""}. Check it against the document before deciding.
      </p>
      {reading.instructionsDetected ? (
        <p className="text-warning" data-testid="reading-instructions">
          The document contains text addressed to an automated reader. It was ignored; look at the document yourself.
        </p>
      ) : null}
      {reading.kind ? (
        <p>
          Reads as: <span className="font-medium">{reading.kind.label}</span>
        </p>
      ) : null}
      {reading.fields.length > 0 ? (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5">
          {reading.fields.map((field) => (
            <div key={field.name} className="contents">
              <dt className="text-text-secondary">{field.name}</dt>
              <dd>
                {field.found ? (
                  <>
                    <span className="font-medium">{field.value}</span>
                    {field.quote ? (
                      <span className="text-text-secondary">
                        {" "}
                        — “{field.quote}”{field.page ? `, page ${field.page}` : ""}
                      </span>
                    ) : null}
                    {field.located === false ? <span className="text-error"> · passage not found in the document</span> : null}
                    {field.located === undefined || field.located === null ? (
                      <span className="text-text-secondary"> · read from an image</span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-text-secondary">not found</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {reading.proposals.length > 0 ? (
        <ul className="text-text-secondary" data-testid="reading-proposals">
          {reading.proposals.map((proposal, index) => (
            <li key={index}>
              Suggestion: {PROPOSALS[proposal.tool]} — {proposal.reason}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
