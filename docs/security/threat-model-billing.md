# Threat model: billing (Phase 11)

**Scope:** plans, entitlements, subscriptions, provider events, usage records
(ADR-037).
**Method:** STRIDE; each threat names its control and evidence. Reviewed
2026-10-29.

## Threats and controls

| # | Threat | Control | Evidence |
|---|---|---|---|
| B1 | **Spoofing:** a forged provider event upgrades or reactivates a subscription | HMAC-SHA256 over the exact raw body with the provider's signing secret, constant-time comparison; no secret, no events; the provider path must match the configured provider | `BillingIT.unsignedOrOldEventsAreRefused` (bad, wrong-secret and tampered signatures 401), `BillingEntitlementsTest.signaturesCover…` |
| B2 | **Replay:** a captured event is sent again later, or the provider retries | Timestamps older than five minutes are refused; events are stored once per provider and id, and their jobs are keyed the same way | `BillingIT.unsignedOrOldEventsAreRefused` (10-minute-old signature 401), `…providerEventsAreAppliedOnceAndInOrder` (repeat not applied again) |
| B3 | **Tampering:** out-of-order events roll the state back | An event older than the last applied is recorded as stale and changes nothing; transitions outside the state machine are recorded as refused | `BillingIT.providerEventsAreAppliedOnceAndInOrder` (STALE, REFUSED) |
| B4 | **Elevation of privilege:** a member changes the plan or reads another organization's billing | `billing.manage` (owners) to change, `billing.read` to see; organization scope and row-level security on subscriptions, events and usage records | `BillingIT.aCheckoutChangesThePlan…` (admin 403 to change, manager 403 to read, stranger 404), `WorkRowLevelSecurityIT` |
| B5 | **Elevation of privilege:** a limit bypassed by asking another way | Limits checked in the service that adds (invitations, work, integrations, team uploads, assistant calls), not in the web; pending invitations count as members | `BillingIT.limitsAreEnforcedWhereThingsAreAdded`, `BillingEntitlementsTest` |
| B6 | **Denial of service (to the customer):** a payment problem locks people out of their own records | Inactive subscriptions refuse only additions; reading, finishing work and exporting stay available; a grace period follows a trial or a missed payment | `BillingIT.anInactiveSubscriptionRefusesAdditionsButKeepsRecordsAvailable`, `BillingRulesTest` |
| B7 | **Repudiation:** a plan or status changes without a trace | Checkout, cancellation and every subscription change are audited; every provider event is kept with its outcome | `BillingIT` (audit actions), `billing_events` (append-only) |
| B8 | **Tampering:** usage records are rewritten to change a bill | Usage records are append-only (the application role cannot update or delete them), one per organization, metric and day | `V12__billing.sql`, `BillingIT.theDailyJobRecordsUsageOnce…` |
| B9 | **Misconfiguration:** the fake provider runs in production | Startup fails when the fake provider is configured in production or without a signing secret; the default provider is `none` | `Providers.billingProvider` |

## Accepted risks

| Risk | Decision | Revisit |
|---|---|---|
| Uploads by clients through request links are not counted against the storage limit before they are stored | Accepted: clients finishing work must not be refused; request-link uploads are rate limited and counted in usage | With the real provider |
| A cancellation is recorded locally before the provider confirms it | Accepted: Avenra initiated it; the provider's later events are applied in order | With the real provider |
