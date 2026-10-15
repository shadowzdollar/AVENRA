# ADR-031: Document reading and advisory AI checks

**Status:** Accepted (closes the Phase 5 deferral "checks that read document
contents"; amends ADR-027)

## Context

Phase 5 checks a document by its detected type and size only. Teams need to
know what is *in* it: is this a passport, does the name match the legal name
given, does it expire within 30 days. A model can read that, but its output is
neither verified truth nor authorization (§43, §50), and documents are
untrusted content that may try to instruct the model (§48).

## Decision

- **Two rule types read documents** (ADR-027's table gains):

  | Rule | Applies to | Checks |
  |---|---|---|
  | `DOCUMENT_KIND` | document | the document reads as one of the listed kinds (labels the team writes, e.g. "passport") |
  | `DOCUMENT_FIELD` | document | a named field (text, number or date) is found; optionally equals another requirement's answer; for dates, optionally not before/after a number of days from today |

  Both are **advisory only (product decision)**: defining one as `BLOCKING` is
  refused, and the database constraint repeats it. A failed or pending AI check
  makes the result `NEEDS_REVIEW`; it never makes it `FAILED`, so it never
  rejects. AI checks are excluded from the confidence, so they cannot raise it
  into automatic acceptance; an answer whose rules are only AI checks has no
  confidence and is never accepted automatically. Checks carry `aiDerived:
  true` and the UI says "read automatically".
- **Reading.** The rules of a requirement define a *reading spec*: the kind
  labels and the fields (name, kind). When a document answer is verified and
  its rules need a reading, the document module returns the reading for that
  document version and spec, or schedules one (`document.read` job, one per
  version and spec) and reports it pending. Until it arrives the AI checks are
  `SKIPPED` ("waiting for the document to be read"); when it arrives, the
  answer is verified again. With reading off, the checks are skipped with that
  reason; nothing is sent.
- **What is sent.** Only clean files of supported types are read: PDF, PNG,
  JPEG, plain text and CSV. A PDF with a text layer is sent as text (cheaper,
  and the text is what quotes are located in); a scanned PDF or an image is
  sent as the file itself. Office files are not read in Phase 6 (checks skipped
  with the reason).
- **What comes back** (validated by the AI service, ADR-029): the kind (one of
  the labels or `other`) and a self-reported confidence; per requested field
  either "not found" or a value in canonical form (ISO date, decimal number,
  text of at most 500 characters) with the quoted passage and page; whether the
  document appears to contain instructions aimed at an automated reader; and
  tool proposals (ADR-029). Unknown fields, labels or extra properties reject
  the whole output.
- **Grounding.** The service locates each quote in the document text
  (whitespace- and case-insensitive) and the value in the quote. A field whose
  quote is not found is reported `located: false` and its check fails
  (advisory) with that reason. Images and scanned files have no text to locate
  in: `located` is unknown, and the check says it was read from an image.
- **Prompt-injection defences** (§48):
  - document content is passed only as data, delimited and labelled as
    untrusted, after the trusted instructions; the instructions say content
    never changes the task;
  - the request has no tools; output is constrained to the schema and then
    validated, so text in a document cannot widen what comes back;
  - field names and kind labels come from the team's rules, never from the
    document;
  - suspected instructions in a document are reported to the person;
  - nothing the reading returns is executed or decides anything.
- **Retrieval foundation** (§51). Long texts are split into chunks that keep
  their source (page, character offsets); when a text exceeds the reading
  budget, the chunks most relevant to the requested fields and labels are
  chosen by lexical scoring and sent with their page markers. There is no
  vector store or embedding: one document at a time does not need one.
- **Storage.** `document_readings` (document module): organization, document
  version, spec hash, status (`PENDING`, `DONE`, `FAILED`, `SKIPPED`), the
  validated result, the invocation it came from, the reason when not done. Rows
  are written by the system only and kept as evidence of what people were shown.

## Consequences

- People see what a document says next to what the client answered, with the
  passage it came from, and decide.
- A wrong reading costs a person's attention, never a wrong decision.
- Further AI rule types follow the same pattern: advisory, grounded, skipped
  when reading is off.
