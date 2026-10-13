# ADR-019: Document storage and access

**Status:** Accepted

## Context

Documents are business evidence (Guidelines §23–§24). Files must be stored in
S3-compatible storage with metadata in PostgreSQL (§10), never exposed through
public buckets, and treated as untrusted input (§65). The product owner chose
business document types up to 25 MB.

## Decision

- **Through the API:** uploads and downloads stream through the API, which
  authorizes every request. No presigned or public URLs in Phase 3; the bucket
  is private and reachable only by the API.
- **Keys:** `org/{organizationId}/documents/{documentId}/v{version}`, so
  storage access is tenant-scoped by construction (ADR-005).
- **Accepted types** are decided by **file signature**, never by the name or
  the declared content type: PDF, OOXML (DOCX, XLSX, PPTX: ZIP with the
  matching OOXML part), PNG, JPEG, CSV and plain text (valid UTF-8, no NUL
  bytes). The stored content type is the detected one.
- **Limits:** 25 MB per file (configurable), enforced while streaming.
- **Integrity:** SHA-256 computed while streaming and stored; downloads can
  be verified against it.
- **Versioning:** a new upload for the same document creates a new version;
  versions are never overwritten or deleted by normal operations (§23).
- **Downloads** are served with `Content-Disposition: attachment`,
  `X-Content-Type-Options: nosniff` and the detected type, so browsers never
  render untrusted files inline.
- **Quarantine:** a version is not downloadable until the malware scan marks it
  clean (ADR-021).

## Alternatives

- **Presigned URLs** — deferred: efficient for large files, but adds a second
  authorization path; revisit with large-file needs.
- **Detect types by extension** — rejected: trivially spoofed.
- **Apache Tika for detection** — rejected for now: large dependency for a
  short allow-list of signatures (§99).

## Consequences

- The API carries file bandwidth; 25 MB files are acceptable for the wedge.
- Adding a file type means adding a signature check and a test.
