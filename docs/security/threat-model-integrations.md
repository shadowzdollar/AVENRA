# Threat model: integrations (Phase 8)

**Scope:** connections, credentials, integration events, webhook deliveries
and storage exports (ADR-034). **Method:** STRIDE; each threat names its
control and evidence. Reviewed 2026-10-20.

## Assets

- Connection credentials (webhook signing secrets, storage keys)
- Data leaving Avenra: event payloads, completion manifests, documents
- The internal network the API runs in

## Threats and controls

| # | Threat | Control | Evidence |
|---|---|---|---|
| I1 | **Information disclosure (SSRF):** a connection targets internal services (metadata endpoint, databases, admin consoles) | HTTPS only; every resolved address must be public; checked at creation and again before each delivery; no redirects; user info in URLs refused; loopback over HTTP only by a setting refused in production | `AddressPolicyTest` (14 internal ranges, mixed resolutions, HTTP, user info), `IntegrationsIT.connectionsOnlyReachPublicHttpsAddresses`, startup check in `IntegrationService` |
| I2 | **Information disclosure:** credentials leak | Sealed with AES-GCM bound to the connection id; never returned (only the generated webhook secret, once); hints show nothing secret; never logged | `IntegrationsIT.domainFactsBecomeSignedWebhooks…` (secret absent from lists and ciphertext), `…completedWorkIsExported…` (secret key absent) |
| I3 | **Spoofing:** a receiver accepts forged events | HMAC-SHA256 signature over timestamp and body with a per-connection secret; event id for idempotency; documented verification | `IntegrationsIT.domainFactsBecomeSignedWebhooks…` (signature verified), `AddressPolicyTest.signaturesFollow…`, `e2e/integrations.spec.ts` |
| I4 | **Repudiation / tampering:** deliveries rewritten | A delivery's event is insert-only; only outcome columns change; changes to connections are audited | V9 grants, `IntegrationsIT` audit assertions |
| I5 | **Information disclosure:** client data in event payloads | Payloads hold identifiers and titles only; answer values and recipient addresses never leave in events | `IntegrationsIT.domainFactsBecomeSignedWebhooksWithoutAnswerValues` |
| I6 | **Elevation:** a non-admin connects a system | `integration.manage` (owners and admins) for every change; `integration.read` to see; not found for other tenants | `IntegrationsIT.onlyManagersOfIntegrationsChangeThem…` |
| I7 | **Denial of service:** a failing receiver keeps the job engine busy | Bounded attempts with exponential backoff; 4xx fail at once; a connection is paused after repeated failures; 10-second timeout | `IntegrationsIT.failingDeliveriesAreRetriedThenTheConnectionIsPaused…`, `…aRefusedEventIsNotRetried` |
| I8 | **Tampering:** a storage export is incomplete or altered in transit | Every object is read back and its SHA-256 compared before the export counts as delivered | `IntegrationsIT.completedWorkIsExportedToTheBucketAndVerified` |
| I9 | **Revocation does not stick** | Revoking deletes the ciphertext (database constraint) and stops deliveries | `IntegrationsIT.onlyManagers…` (revoked: no secret, not listed) |

## Accepted and open risks

| Risk | Decision | Revisit |
|---|---|---|
| DNS rebinding between the address check and the HTTP connection | Accepted for now: the window is milliseconds and the check runs before every attempt; pinning the resolved address needs a custom connector | Phase 13 security testing |
| A receiver that is slow but answers in time ties up a job slot for 10 seconds | Accepted at current scale | When integration volume grows |
| An organization exports documents to a bucket it misconfigured as public | The organization's responsibility; the UI says where data goes | Phase 12 (compliance) |
