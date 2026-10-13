# Phase 3: Core business objects

**Status:** In progress
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
| 3.2 | All operations contract-first; conformance (permissions, public endpoints, schemas, rate limits) passes | CI | ☐ |
| 3.3 | Every new tenant-owned table has `organization_id` and row-level security, proven as the runtime role | Integration tests | ☐ |
| 3.4 | Tenant isolation through the API for every new resource (§137) | Integration tests | ☐ |
| 3.5 | Work lifecycle: only allowed transitions; invalid ones rejected with a clear code; history recorded | Unit + integration tests | ☐ |
| 3.6 | Completeness: each work shows required vs satisfied requirements, computed server-side | Integration tests | ☐ |
| 3.7 | Information items keep source, provenance and verification state; values never silently overwritten | Integration tests | ☐ |
| 3.8 | Documents: allow-listed types by file signature, 25 MB limit, SHA-256 checksum, versioning (never overwritten), tenant-scoped storage keys, downloads only through authorized API calls | Integration tests | ☐ |
| 3.9 | Malware: every upload scanned; infected files blocked, quarantined and audited; scanner unavailable → upload refused (fail closed) | Integration tests with the EICAR test file | ☐ |
| 3.10 | Request links: 256-bit, stored hashed, expiring, revocable, scoped to their requirements only, rate-limited, every use audited | Integration tests | ☐ |
| 3.11 | Review: accept/reject with reason; permission-checked; audited | Integration tests | ☐ |
| 3.12 | Web flows work end to end in a browser, including the client submission page | End-to-end test | ☐ |
| 3.13 | Threat model updated for documents and request links | `docs/security/` | ☐ |
| 3.14 | CI green; hardening pass recorded | CI, this file | ☐ |

## Declared deferrals

| Item | Why | Closes in |
|---|---|---|
| Lifecycle transitions triggered by jobs and execution | Needs the job engine (ADR-007) | Phase 4 |
| Automated verification rules and confidence | Phase 5 scope | Phase 5 |
| Document text extraction and AI classification | AI foundation | Phase 6 |
| Rescanning stored files when signatures update | Needs scheduled jobs | Phase 4 |

## Hardening record

_To be completed at phase close._
