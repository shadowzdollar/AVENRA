# Phase 11: Billing

**Status:** Complete (2026-10-29)
**Guidelines:** §110, §111, §99, §103, §121 (Phase 11)
**Master Project:** §23

## Goal

Avenra can be sold without pricing logic leaking into the product. Each
organization has a subscription to a plan; the plan's entitlements decide how
much it may add; usage is metered into records a bill can be recalculated
from; plan changes and payment state come from a billing provider through
signed, idempotent events. Customers keep access to their records whatever
their payment state.

## Decisions (recorded in ADRs; product defaults marked)

- Plans, entitlements, subscription state machine, metering and the provider
  port (ADR-037)
- Product defaults: new organizations start on a 30-day Starter trial; limits
  per plan as in `Plan`; reading, finishing work and exporting never depend
  on payment

## Exit checklist

| # | Criterion | Evidence | Done |
|---|---|---|---|
| 11.1 | ADR for billing | ADR-037 | ☑ |
| 11.2 | Plans and entitlements in one place; no pricing in business code | `Plan` (limits only; prices stay at the provider); business modules call `platform.entitlements.Entitlements` only; `BillingRulesTest` | ☑ |
| 11.3 | Entitlements enforced at members, work, integrations, storage and AI | Checks in `InvitationService`, `WorkService`, `IntegrationService`, `InformationService` (team uploads) and `Ai` (skips); `BillingIT.limitsAreEnforcedWhereThingsAreAdded`, `BillingEntitlementsTest` | ☑ |
| 11.4 | Subscription state through a state machine; inactive subscriptions refuse additions but keep records available | `SubscriptionStatus`, `Subscriptions`, `Standing`; `BillingIT.anInactiveSubscriptionRefusesAdditionsButKeepsRecordsAvailable`, `…providerEventsAreAppliedOnceAndInOrder` (refused move), `BillingRulesTest` | ☑ |
| 11.5 | Metering: append-only daily usage records, recorded once per day and metric | `usage_records` (append-only), `DailyBilling`; `BillingIT.theDailyJobRecordsUsageOnceAndLetsTimeSettleTheSubscription` | ☑ |
| 11.6 | Billing integration: provider port, checkout and cancel, signed idempotent events, out-of-order safe | `BillingProvider` port (`none`, `fake`), `ProviderEvents`, `WebhookSignature`; `BillingIT.aCheckoutChangesThePlanWhenTheProviderConfirms`, `…providerEventsAreAppliedOnceAndInOrder` (repeat, stale), `…unsignedOrOldEventsAreRefused` | ☑ |
| 11.7 | Permissions (`billing.read`, `billing.manage`), audit, tenant isolation | `BillingIT.aCheckoutChanges…` (admin cannot change, manager cannot read, stranger 404); audit actions `billing.*`; `WorkRowLevelSecurityIT` (subscriptions, billing_events, usage_records) | ☑ |
| 11.8 | Web: billing page (plan, usage against limits, change plan, cancel) | `/organizations/{id}/billing`; `e2e/billing.spec.ts`; `billing.test.ts` | ☑ |
| 11.9 | Threat model for billing | `docs/security/threat-model-billing.md` | ☑ |

## Hardening record

- Local runs of every CI check (`make check`: API 112 unit and 182 integration
  tests, web 58, AI service 82) and the browser journeys (9/9) against a
  production web build.
- Found and fixed while hardening: the provider-event signature was checked
  against an empty body, because the injected request proxy hid the cached raw
  body. Browser journeys failed because the local mail catcher hung on about
  one connection in ten (reverse DNS lookups); the email job now logs the
  failure's type, which it used to drop.

## Deferrals

| Item | Reason | Phase |
|---|---|---|
| A real payment provider (Stripe) | Needs an account, a dependency review (§99) and its webhook signatures; the port and fake provider are ready | When an account exists |
| Prices, invoices and taxes | Prices are not fixed before customer evidence (Master Project §23); invoices come from the provider | With the real provider |
| CI green on `main` after the merge | GitHub Actions does not start jobs (billing) | When billing is fixed |
