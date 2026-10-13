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

- **Upload path:** the API spools the upload to a private temporary file
  (enforcing the size limit and computing the checksum as it reads), detects
  the type, scans it (ADR-021), then writes it to storage with a known length
  and deletes the temporary file.

## Dependency: AWS SDK for Java v2, S3 module (Guidelines §99)

1. **Need:** an S3 client with request signing (SigV4); writing our own
   signing code is security-sensitive and not our business.
2. **Alternatives:** MinIO client (smaller, single vendor), in-house SigV4
   (rejected above).
3. **Maintenance:** maintained by AWS, frequent releases, Apache-2.0.
4. **Security:** wide use and a public advisory process; only the `s3` and
   `url-connection-client` artifacts, with the Netty and Apache HTTP clients
   excluded to keep the surface small.
5. **Size:** a few MB of jars; acceptable for the API.
6. **Exit:** used only behind the `DocumentStorage` interface; swapping it
   touches one class.

Version 2.55.10 (the 7-day release-age rule applies, ADR-006), managed
through the SDK's BOM.

## Alternatives

- **Presigned URLs** — deferred: efficient for large files, but adds a second
  authorization path; revisit with large-file needs.
- **Detect types by extension** — rejected: trivially spoofed.
- **Apache Tika for detection** — rejected for now: large dependency for a
  short allow-list of signatures (§99).

## Consequences

- The API carries file bandwidth; 25 MB files are acceptable for the wedge.
- Adding a file type means adding a signature check and a test.
