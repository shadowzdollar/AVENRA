# Phase 8: Integrations

**Status:** Complete (2026-10-20)
**Guidelines:** §54–§58, §66, §68–§69, §99, §103, §121 (Phase 8)
**Master Project:** §12 steps 11–12, §21

## Goal

Avenra's results reach the systems firms already use, through one common
integration model. Two integrations serve the wedge directly: **webhooks**
tell another system the moment something happens (work completed, an answer
received, a request expired), signed so the receiver can trust them; and an
**S3-compatible storage export** files the proof of completed work (the sealed
manifest and the accepted documents) in a bucket the firm owns. Credentials
are encrypted, never shown again, rotatable and revocable. Every delivery is
recorded and retried when it fails for a passing reason.

## Decisions (recorded in ADRs; product defaults marked)

- Integration model, credentials, outbound events, webhooks and storage export
  (ADR-034)
- Product defaults: events are delivered at least once with up to 8 attempts
  over about a day; a connection that keeps failing is paused and announced
  (admins are notified from Phase 9); webhook targets must be HTTPS public addresses (local development
  may allow plain HTTP to loopback by configuration)

## Steps

1. ADR-034 and this phase file
2. Contract: connections, capabilities, deliveries, test delivery, rotation
3. Database: connections, subscriptions, deliveries with row-level security
4. API: `integration` module (registry of providers, encrypted credentials,
   integration events from domain events, delivery jobs, signing, address
   checks, storage export on completion)
5. Web: integration settings (create, test, rotate, pause, delete, deliveries)
6. Threat model, subsystem documentation, hardening pass and phase close

## Exit checklist

| # | Criterion | Evidence | Done |
|---|---|---|---|
| 8.1 | ADR for the integration model, credentials, events and the two integrations | ADR-034 | ☑ |
| 8.2 | Integrations share one model: connection, authentication, capabilities, events, actions | `Provider` with declared capabilities; one connection, credential and delivery model for both providers; fan-out asks for capabilities (`Deliveries.integrationFanout`) | ☑ |
| 8.3 | Credentials are encrypted at rest, never returned or logged, rotatable and revocable | `IntegrationsIT.domainFactsBecomeSignedWebhooksWithoutAnswerValues` (secret shown once, absent from lists and ciphertext), `…completedWorkIsExported…` (storage secret never returned), `…onlyManagersOfIntegrationsChangeThemAndSecretsRotateAndRevoke` (rotation changes the signature; revocation deletes the ciphertext, database constraint) | ☑ |
| 8.4 | Integration events are versioned, identifiable, timestamped, traceable and tenant-aware, without secrets or client documents in webhook payloads | `IntegrationEvent` (id, type, version, time, organization); `IntegrationsIT.domainFactsBecome…` (no answer values); request expiry without the recipient address (`Fanout`) | ☑ |
| 8.5 | Webhooks are signed with a timestamp; each event has an id for receivers' idempotency | `IntegrationsIT.domainFactsBecome…` (signature verified by the receiver, timestamp, event id), `AddressPolicyTest.signaturesFollowTheDocumentedFormat`, `e2e/integrations.spec.ts` | ☑ |
| 8.6 | Webhook targets are restricted to public HTTPS addresses (no internal hosts, checked at send time) | `AddressPolicyTest` (19 cases), `IntegrationsIT.connectionsOnlyReachPublicHttpsAddresses`; checked again in `WebhookSender` and `StorageExporter` before each attempt; loopback setting refused in production | ☑ |
| 8.7 | Deliveries are recorded, retried when retryable, and a failing connection is paused and announced | `IntegrationsIT.failingDeliveriesAreRetriedThenTheConnectionIsPausedAndCanBeResumed` (3 attempts, paused after 2, audited, resumed and redelivered), `…aRefusedEventIsNotRetried` | ☑ |
| 8.8 | Completed work's manifest and accepted documents are exported to the configured bucket and verified | `IntegrationsIT.completedWorkIsExportedToTheBucketAndVerified` (manifest identical, document SHA-256 identical, read back by the exporter) | ☑ |
| 8.9 | Only `integration.manage` changes connections; `integration.read` sees them; tenants are isolated | `IntegrationsIT.onlyManagers…` (manager may read, not change; stranger 404), `WorkRowLevelSecurityIT` (both tables) | ☑ |
| 8.10 | Web: manage connections and see deliveries | `/organizations/{id}/integrations`; `e2e/integrations.spec.ts`; `integrations.test.ts` | ☑ |
| 8.11 | Threat model for integrations | `docs/security/threat-model-integrations.md` | ☑ |

## Hardening record

- Local runs of every CI check (`make check`: API 105 unit and 162
  integration tests, web 48, AI service 82) and the browser journeys (6/6)
  against a production web build.
- Found and fixed while hardening: `format: uri` with a length limit broke
  request validation (now a string with a pattern); the generated model turns
  a missing `events` list into an empty one, which emptied a connection's
  subscriptions on pause (now "unchanged"); the export test failed late in the
  suite because the SeaweedFS test container runs out of volumes for new
  buckets (the test now uses the shared bucket under its own folder); exports
  also send each object with an explicit SHA-256 the service checks, like
  stored documents; the CI smoke containers
  needed loopback webhooks for the browser test (allowed there only).
- A work exception for a failing connection would have made the work module
  depend on integrations and the reverse; the pause is announced as an event
  for Phase 9 notifications instead (ADR-034).

## Deferrals

| Item | Reason | Phase |
|---|---|---|
| CRM, calendar and project-management integrations | Need OAuth applications with each vendor and customer evidence of which ones matter (Guidelines §121: no dozens of integrations before evidence) | When a customer asks |
| Inbound integration events (e.g. CRM record updated) | No inbound integration yet | With the first one |
| CI green on `main` after the merge | GitHub Actions does not start jobs (billing) | When billing is fixed |
