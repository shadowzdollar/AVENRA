# Threat model: documents and client request links (Phase 3)

**Scope:** clients, projects, work and its lifecycle, requirements and
information items, document upload, storage and download, malware scanning,
and request links that let people without an account answer (ADR-018 to
ADR-021). Builds on the identity and tenancy model
([threat-model-identity.md](threat-model-identity.md)), whose controls still
apply.
**Method:** STRIDE per component; each threat names its control and the test
that proves it. Reviewed 2026-10-14.

## Assets

- Client documents and submitted values (business evidence)
- Request-link tokens (a bearer credential for one link)
- The integrity of the record: who submitted what, when, and how it was reviewed
- The private document bucket
- Availability of the API for everything that is not an upload

## Trust boundaries

1. Anonymous browser → web server → API (`/api/v1/client-requests/*`, the only
   public business operations)
2. API → ClamAV (`clamd` over TCP, private network)
3. API → S3-compatible storage (private bucket, API credentials only)
4. Uploaded file content → every component that reads it (untrusted data)

## Threats and controls

| # | Threat (STRIDE) | Control | Evidence |
|---|---|---|---|
| D1 | **Spoofing:** guessing a request-link token | 256-bit random tokens; only SHA-256 hashes stored; public operations rate-limited per address and fail closed when Redis is down | `RequestLinksIT.unknownExpired…`, `RateLimitIT` |
| D2 | **Spoofing:** a leaked or forwarded link used later | Links expire (≤ 30 days, enforced by a database check), can be revoked, stop working when the work is finished; every open and submission is audited with the link id | `RequestLinksIT`, `WorkRowLevelSecurityIT.expiredAndRevokedLinks…` |
| D3 | **Information disclosure:** the token reaches logs, history or referrers | Token only in the email, in the URL fragment (never sent to servers); the page moves it out of the address bar; the API takes it in a header and never returns it; paths, not headers, are logged | `RequestLinksIT` (no token in responses), `request-token.test.ts`, e2e (empty fragment after open) |
| D4 | **Elevation of privilege:** a link holder reaches other requirements, work, clients or files | The link scope exposes only its requirements; application checks plus row-level security on the link token hash (no user, no organization in scope); no download operation for link holders | `RequestLinksIT.theClientSeesOnlyWhatWasAsked…`, `WorkRowLevelSecurityIT.aRequestLinkExposes…`, `…CanOnlyAddItems…` |
| D5 | **Elevation of privilege:** cross-tenant access to Phase 3 resources through the API | Every operation goes through `OrganizationAccess` (membership → permission → tenant scope); non-members get 404, also with another tenant's ids under the caller's own organization | `WorkFlowIT.anotherTenantCannotReach…`, `DocumentsIT.documentsOfAnotherTenant…` |
| D6 | **Elevation of privilege:** cross-tenant access through an application bug | Row-level security on every new table as the runtime role; composite `(organization_id, id)` references make cross-tenant links impossible; mutation-checked (policies deliberately broken make the tests fail) | `WorkRowLevelSecurityIT` |
| D7 | **Tampering:** rewriting evidence (values, files, history) | Items, document versions and transitions are insert-only for the runtime role; only review columns of an item can change (column privileges); corrections are new items | `WorkRowLevelSecurityIT.historyCannotBeRewritten`, `WorkFlowIT.submissionsAreNeverOverwritten…` |
| D8 | **Tampering:** arbitrary status changes | Status changes only through the lifecycle with an expected status; final states cannot be left; completion requires accepted requirements and closed tasks; unknown JSON fields are rejected | `WorkStatusTest`, `WorkFlowIT.theLifecycle…`, `…statusCannotBeSet…` |
| D9 | **Elevation of privilege:** members acting beyond their role | Explicit permissions per operation (`work.update`, `information.collect`, `information.verify`, …); the contract declares them and conformance tests check public versus authenticated | `WorkFlowIT.permissionsFollowRoles`, `ContractConformanceIT` |
| D10 | **Tampering/Elevation:** malware delivered to staff | Every upload scanned by ClamAV before storage; infected files stored only under `quarantine/`, never served, audited; scanner failures refuse the upload (fail closed) | `DocumentsIT.malwareIsBlocked…`, `RequestLinksIT.malwareFromAClient…`, `ScannerUnavailableIT`, `ClamdScannerTest`, e2e (EICAR) |
| D11 | **Tampering:** disguised file types (executables, macro documents, polyglots) | Type decided by content against a short allow-list; ZIP accepted only as OOXML with its main part; macro-enabled packages rejected; text must be valid UTF-8 without control bytes; the stored type is the detected one | `FileTypesTest`, `DocumentsIT.typesAreDecidedByContent…` |
| D12 | **Elevation of privilege:** stored XSS through downloaded files | Downloads always `attachment`, detected content type, `nosniff`, `Content-Security-Policy: default-src 'none'; sandbox`, `no-store`; file names sanitized (no paths, quotes, control characters; extension matches the type) | `DocumentsIT.anAcceptedFile…`, `FileNamesTest`, e2e download |
| D13 | **Tampering:** path traversal or key injection in storage | Keys are built only from server-generated ids (`org/{org}/documents/{doc}/v{n}`); the database checks that each key starts with its own organization | `DocumentsIT` (key), V4 check constraint |
| D14 | **Information disclosure:** the bucket exposed directly | Private bucket reachable only with API credentials; no presigned or public URLs; downloads only through authorized, audited API calls | `DocumentsIT` (`document.downloaded` audited) |
| D15 | **Denial of service:** large or many uploads | Size limit enforced while reading (request envelope at the edge, exact file size while spooling); per-user and per-address upload rate limits; scanning outside database transactions | `DocumentsIT.filesOverTheLimit…`, `PlatformWebIT.RequestSizeLimits` |
| D16 | **Denial of service:** scanner outage takes the product down | Scanner is not part of readiness; only uploads stop; availability published as `avenra.malware_scanner.available` for alerting (ADR-021 amended) | `ScannerUnavailableIT.theRestOfTheApiStaysReady…` |
| D17 | **Tampering:** email header injection through names in subjects | Control characters stripped from subjects; recipients with control characters rejected | `EmailMessage` (constructor) |
| D18 | **Repudiation:** denying a submission, review or download | Audit events for every create, transition, submission, upload, review, link use, malware detection and download, with source attribution on items | `WorkFlowIT`, `RequestLinksIT`, `DocumentsIT` (audit assertions) |
| D19 | **Tampering:** duplicate side effects on retry | Idempotency keys for creates; repeated submissions, uploads, reviews, transitions and revocations are harmless | `WorkFlowIT`, `DocumentsIT.everyUpload…`, `RequestLinksIT` |
| D20 | **Information disclosure:** document content treated as instructions | Content is stored and served as data only; nothing parses it beyond the type signature in Phase 3 (extraction and AI arrive in Phase 6 with their own controls) | Design (Guidelines §143) |

## Accepted and open risks

| Risk | Decision | Revisit |
|---|---|---|
| Files stored before a signature update are not rescanned | Declared deferral; needs scheduled jobs | Phase 4 |
| Synchronous scanning holds an API thread for the scan (seconds for 25 MB) | Accepted for the wedge; move to jobs with a pending state | Phase 4 (ADR-021) |
| A request link is a bearer credential: anyone holding it can answer | Accepted (ADR-020): review decides what is accepted; expiry, revocation, audit and masking limit the damage | After customer evidence (client accounts for repeat clients) |
| ClamAV detection is signature-based and misses novel malware | Accepted; files are never rendered inline and only allow-listed types are accepted | Phase 13 (consider a second engine) |
| Quarantined files stay in the bucket indefinitely | Accepted until retention rules exist | Phase 10 (Guidelines §113) |
| File contents travel to clamd unencrypted (clamd has no TLS) | Accepted: clamd must run next to the API on a private network (ADR-021); the one Semgrep suppression points here | Phase 13 (deployment topology) |
| Server-side encryption depends on the storage provider (requested on AWS; configured by the operator elsewhere) | Configured in deployment | Phase 13 |
