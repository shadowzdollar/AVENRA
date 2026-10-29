# ADR-037: Billing, plans and entitlements

**Status:** Accepted

## Context

Guidelines §110–§111 and Phase 11: plans, entitlements, metering,
subscription state and a billing integration, separated from business logic,
with no pricing scattered through the code. The Master Project (§23) names
Starter, Business and Enterprise and says prices must not be fixed before
customer evidence exists. No payment provider account exists yet.

## Decision

- **Module.** `billing` owns plans, subscriptions, entitlements and usage
  records. Business modules ask it one question through `Entitlements`
  ("may this organization add one more X?") and never look at plans
  themselves.
- **Plans are code; prices are not.** `Plan` (STARTER, BUSINESS, ENTERPRISE)
  defines limits per dimension: members, open work, active integrations,
  stored bytes and AI calls per month (**product defaults**, changeable in
  one place). Prices live only in the billing provider; Avenra stores the
  provider's price reference per plan in configuration.
- **Subscription** (one per organization, tenant-owned): plan, status, trial
  end, current period end, cancel-at-period-end, provider customer and
  subscription references. Status changes go through a state machine:

  | From | To |
  |---|---|
  | TRIALING | ACTIVE, PAST_DUE, CANCELED |
  | ACTIVE | PAST_DUE, CANCELED |
  | PAST_DUE | ACTIVE, CANCELED |
  | CANCELED | ACTIVE (a new subscription at the provider) |

  New organizations start on a STARTER trial of 30 days (**product
  default**).
- **Entitlements.** A limit is checked before the action that would exceed it
  (inviting, creating work, connecting an integration, storing a file,
  calling the assistant), against usage reported by the owning module's
  `UsageContributor` figures (ADR-036), so counting stays with the data. The
  refusal is `PLAN_LIMIT_REACHED` (HTTP 409) naming the limit. When the
  subscription is not in good standing (trial ended unpaid, past due beyond
  the grace period, canceled), adding things is refused with
  `SUBSCRIPTION_INACTIVE`, while reading, finishing work and exporting stay
  available: a customer's records are never held hostage.
- **Metering.** A daily job records each organization's usage figures as
  append-only usage records (organization, metric, day, value), one per day
  and metric, so a bill can be recalculated from the records alone.
- **Billing integration.** A `BillingProvider` port: start a checkout for a
  plan, cancel at period end. Provider events (subscription created, updated,
  payment failed, canceled) arrive at a signed webhook, are stored once by
  their event id and applied through the state machine; replays and
  out-of-order events (older than the last applied) change nothing. A `fake`
  provider (local and tests) completes checkouts at once through the same
  event path. A real provider (Stripe) is a later step: it needs an account,
  its own dependency review (§99) and its signature scheme.
- **Permissions.** `billing.read` sees the plan, usage and limits;
  `billing.manage` (owners) changes the plan or cancels. Every change is
  audited.

## Consequences

- Adding a limit is one enum entry plus the check at the action.
- Changing prices needs no release; changing limits does, on purpose.
- Until a real provider is connected, no money moves.
