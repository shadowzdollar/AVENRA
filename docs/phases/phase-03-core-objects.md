# Phase 3: Core business objects

**Status:** Complete (2026-10-14)
**Guidelines:** §10, §15, §19–§24, §30, §38, §59, §64–§65, §128, §136–§137
**Master Project:** §11–§12 (client/project coordination, the example workflow)

## Goal

A team can record its clients and projects, define a piece of work, list
exactly what information it requires, collect that information from the
client through a secure request link (no client account needed), and see at
any moment what is complete, what is missing and what is under review. Every
file is scanned for malware before anyone can open it, every value keeps its
provenance, and all of it is tenant-isolated like Phase 2.

Execution (state machines driven by jobs) is Phase 4; automated verification
is Phase 5. Phase 3 delivers the objects, their controlled lifecycles and the
manual collection and review loop on which those phases build.

## Decisions taken with the product owner (2026-10-13)

- Client request links in Phase 3 (secure, expiring, single-purpose, no account)
- ClamAV scanning; files quarantined until clean
- Business document types (PDF, OOXML Word/Excel/PowerPoint, CSV, plain
  text, PNG, JPEG), at most 25 MB per file

## Steps

1. ADRs: work model and lifecycle, document storage and access, client request
   links, malware scanning
2. Contract: clients, projects, work, tasks, requirements, information items,
   documents, request links; public request-link operations
3. Database: tenant-owned tables with row-level security; document versions
   with checksums; provenance columns (§136)
4. Clients and projects
5. Work with a controlled lifecycle (§19) and tasks with completion conditions (§20)
6. Requirements (§21) and completeness per work
7. Information items with source, type, confidence, freshness and
   verification state (§22)
8. Documents (§23): versioned, checksummed, stored in S3-compatible storage
   under tenant-scoped keys, content-type detection by file signature, size
   limits, scanned by ClamAV before release (§65)
9. Client request links: create, send, open, submit answers and files, revoke;
   rate-limited and audited
10. Review loop: accept or reject a submission with a reason (manual; automated
    verification is Phase 5)
11. Web: clients, projects, work detail with requirements and completeness,
    request-link management, and the public client submission page
12. Hardening pass and phase close

## Exit checklist

| # | Criterion | Evidence | Done |
|---|---|---|---|
| 3.1 | ADRs for work model, document storage, request links, malware scanning | ADR-018, ADR-019, ADR-020 and ADR-021 (the last two decided with the product owner) | ☑ |
| 3.2 | All operations contract-first; conformance (permissions, public endpoints, schemas, rate limits) passes | CI run 38514767239; `ContractConformanceIT` (every interface implemented, public endpoints match the contract exactly, anonymous access, rate-limit policies); oasdiff: additions only | ☑ |
| 3.3 | Every new tenant-owned table has `organization_id` and row-level security, proven as the runtime role | `WorkRowLevelSecurityIT` (all 11 tables, runtime role, mutation-checked: three broken policies made four tests fail) | ☑ |
| 3.4 | Tenant isolation through the API for every new resource (§137) | `WorkFlowIT.anotherTenantCannotReach…`, `DocumentsIT.documentsOfAnotherTenant…`, `RequestLinksIT` | ☑ |
| 3.5 | Work lifecycle: only allowed transitions; invalid ones rejected with a clear code; history recorded | `WorkStatusTest` (every pair against ADR-018), `WorkFlowIT.theLifecycle…` (`INVALID_TRANSITION`, `STATUS_CHANGED`, reasons, history, final states, `WORK_CLOSED`) | ☑ |
| 3.6 | Completeness: each work shows required vs satisfied requirements, computed server-side | `CompletenessTest`, `WorkFlowIT.completenessIsComputed…` (incl. `REQUIREMENTS_INCOMPLETE`, `TASKS_OPEN`) | ☑ |
| 3.7 | Information items keep source, provenance and verification state; values never silently overwritten | `WorkFlowIT.submissionsAreNeverOverwritten…`, `WorkRowLevelSecurityIT.historyCannotBeRewritten` (column privileges) | ☑ |
| 3.8 | Documents: allow-listed types by file signature, 25 MB limit, SHA-256 checksum, versioning (never overwritten), tenant-scoped storage keys, downloads only through authorized API calls | `DocumentsIT` (content types, limit, SHA-256, versions, keys, attachment headers), `FileTypesTest`, `FileNamesTest` | ☑ |
| 3.9 | Malware: every upload scanned; infected files blocked, quarantined and audited; scanner unavailable → upload refused (fail closed) | `DocumentsIT.malwareIsBlocked…`, `RequestLinksIT.malwareFromAClient…`, `ScannerUnavailableIT`, `ClamdScannerTest`; real ClamAV 1.5.4 with EICAR | ☑ |
| 3.10 | Request links: 256-bit, stored hashed, expiring, revocable, scoped to their requirements only, rate-limited, every use audited | `RequestLinksIT`, `WorkRowLevelSecurityIT.aRequestLink…`, `request-token.test.ts`; rate limits fail closed (`client-requests`, `client-uploads`) | ☑ |
| 3.11 | Review: accept/reject with reason; permission-checked; audited | `WorkFlowIT` (accept, reject with reason, `NOT_AWAITING_REVIEW`, `permissionsFollowRoles`, audit) | ☑ |
| 3.12 | Web flows work end to end in a browser, including the client submission page | `e2e/work.spec.ts`: team defines work, client answers without an account, EICAR refused, review loop, completion closes the link; zero CSP or script errors | ☑ |
| 3.13 | Threat model updated for documents and request links | [threat-model-documents-requests.md](../security/threat-model-documents-requests.md) (20 threats) | ☑ |
| 3.14 | CI green; hardening pass recorded | CI run 38514767239 on PR #20: all 10 jobs green, including both browser journeys against the built images and clean image scans; hardening record below | ☑ |

## Declared deferrals

| Item | Why | Closes in |
|---|---|---|
| Lifecycle transitions triggered by jobs and execution | Needs the job engine (ADR-007) | Phase 4 |
| Automated verification rules and confidence | Phase 5 scope | Phase 5 |
| Document text extraction and AI classification | AI foundation | Phase 6 |
| Rescanning stored files when signatures update | Needs scheduled jobs | Phase 4 |
| Asynchronous scanning with a pending state (synchronous in Phase 3) | Needs the job engine (ADR-021) | Phase 4 |
| Requirements and information items live in the `work` module; §128 names a separate information module | One module keeps Phase 3 simple; split when verification (evidence, rules) is added to that data | Phase 5 |
| Request-link emails are sent after commit, not from a durable outbox | As for Phase 2 emails (ADR-015); the team can create a new link | Phase 4 |

## Hardening record

Phase 3 Guidelines sections re-read and checked against the code on
2026-10-14.

| Section | Rule | Result |
|---|---|---|
| §10 | S3-compatible storage; metadata in the database; controlled access; no public buckets | Met. Private bucket, API-only access, metadata and keys in `document_versions` |
| §15, §19 | Work with the listed fields and states; controlled transitions only | Met. All §19 fields; one status write path behind the state machine; unknown JSON fields rejected |
| §20 | Tasks with a clear completion condition | Met. Required `completionCondition`; kinds beyond `HUMAN` arrive with execution |
| §21 | Requirements; completeness rather than task counts | Met. Server-computed completeness drives the completion guard |
| §22, §136 | Information with source, value, type, confidence, freshness, verification, provenance | Met. Source type and id, received time, reviewer, review time and reason, confidence column (set in Phase 5) |
| §23 | Documents versioned, checksummed, never silently overwritten | Met. Insert-only versions, SHA-256, extraction state column for Phase 6 |
| §24 | Evidence first-class | Partly, as planned: the reviewed item is the evidence in Phase 3; the Evidence entity arrives with verification (ADR-018) |
| §30 | Idempotent side effects | Met. Keys for creates; repeats of submissions, uploads, reviews, transitions, revocations are harmless; a repeated link creation does not resend the email |
| §38 | Migrations only; FKs; intentional indexes; UTC; UUIDs | Met. V4 with composite tenant references, indexes per access path |
| §59 | Audit important actions | Met. Every create, transition, submission, upload, review, link use, malware detection and download |
| §64–§65 | Validate at every boundary; files untrusted | Met. Contract validation, typed value checks, content-based types, size limits, scanning, no execution or parsing beyond signatures |
| §128 | Modules own their data | Met for `work` and `document`; information split declared above |
| §137 | Tenant isolation tests, including files | Met at API and database level (mutation-checked); files covered by `DocumentsIT` |

Findings fixed during the phase, before merge:

- Unknown JSON fields were silently ignored everywhere, so `additionalProperties:
  false` in the contract was not enforced (found by `WorkFlowIT` sending a
  `status` field to the update operation); Jackson now rejects them.
- The scanner was part of readiness, so a ClamAV outage would have taken the
  whole API out of service; it is now a metric, and only uploads stop
  (ADR-021 amended).
- Macro-enabled OOXML packages passed as DOCX/XLSX; refused now (ADR-019).
- Semgrep flagged the plain clamd socket; clamd has no TLS, so the private
  network requirement is now explicit in ADR-021 and the threat model.
- The OpenAPI generator emits a Jackson 2 annotation for `uniqueItems`; removed
  from the contract (the server de-duplicates).
- Two tracked files were corrupted by stray editor input and swept into a
  commit; restored, and commits now stage explicit paths.
