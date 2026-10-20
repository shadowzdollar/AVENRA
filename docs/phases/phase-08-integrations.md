# Phase 8: Integrations

**Status:** In progress
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
| 8.1 | ADR for the integration model, credentials, events and the two integrations | | ☐ |
| 8.2 | Integrations share one model: connection, authentication, capabilities, events, actions | | ☐ |
| 8.3 | Credentials are encrypted at rest, never returned or logged, rotatable and revocable | | ☐ |
| 8.4 | Integration events are versioned, identifiable, timestamped, traceable and tenant-aware, without secrets or client documents in webhook payloads | | ☐ |
| 8.5 | Webhooks are signed with a timestamp; each event has an id for receivers' idempotency | | ☐ |
| 8.6 | Webhook targets are restricted to public HTTPS addresses (no internal hosts, checked at send time) | | ☐ |
| 8.7 | Deliveries are recorded, retried when retryable, and a failing connection is paused and announced | | ☐ |
| 8.8 | Completed work's manifest and accepted documents are exported to the configured bucket and verified | | ☐ |
| 8.9 | Only `integration.manage` changes connections; `integration.read` sees them; tenants are isolated | | ☐ |
| 8.10 | Web: manage connections and see deliveries | | ☐ |
| 8.11 | Threat model for integrations | | ☐ |

## Deferrals

| Item | Reason | Phase |
|---|---|---|
| CRM, calendar and project-management integrations | Need OAuth applications with each vendor and customer evidence of which ones matter (Guidelines §121: no dozens of integrations before evidence) | When a customer asks |
| Inbound integration events (e.g. CRM record updated) | No inbound integration yet | With the first one |
| CI green on `main` after the merge | GitHub Actions does not start jobs (billing) | When billing is fixed |
