# Billing

Plans, entitlements, subscriptions and usage records (ADR-037). Code:
`apps/api/.../billing`, `platform/entitlements`; schema `V12__billing.sql`;
web: `/organizations/{id}/billing`.

## Purpose and responsibilities

- Decide how much an organization may add, from its plan, without pricing in
  business code.
- Keep the subscription's state, changed only through its state machine.
- Record daily usage so a bill can be recalculated.
- Take plan changes and payment state from the billing provider.

## How it works

1. A new organization gets a Starter trial in the transaction that creates it.
2. Modules call `Entitlements.requireRoom` before adding members, work,
   integrations or files; the assistant calls `hasRoom` and skips. Use comes
   from the modules' usage figures (ADR-036).
3. A checkout asks the provider for a payment page; the provider's event
   (webhook, or the fake provider at once) is queued as a job of the
   organization and applied through the state machine.
4. A daily job per organization records usage and lets time settle the
   subscription (trials ending, cancellations taking effect).

## Provider events

`POST /api/v1/billing/providers/{provider}/events` with
`Avenra-Billing-Signature: t=<unix>,v1=<hex HMAC-SHA256 of "<t>.<raw body>">`.
Events older than five minutes are refused; each event id is applied once;
an event older than the last applied is stored as stale.

## Failure modes

| Failure | Behaviour |
|---|---|
| Bad or old signature | 401; nothing stored |
| Event for an unknown organization | Acknowledged, logged, ignored |
| Event the state machine forbids | Stored as refused; subscription unchanged |
| Provider down at checkout | The checkout fails; nothing changes |
| Trial ended or payment missed | Seven days of grace, then additions are refused; records stay available |

## Operations

- Settings: `avenra.billing.provider` (`none` or `fake`; `fake` refused in
  production), `avenra.billing.webhook-secret`.
- Metric `avenra.billing.events` (type, outcome).
