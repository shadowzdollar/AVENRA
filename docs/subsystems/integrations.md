# Integrations

Connections to other systems (ADR-034). Code: `apps/api/.../integration`;
schema `V9__integrations.sql`; web: `/organizations/{id}/integrations`.

## Purpose and responsibilities

- Tell other systems when something happens (signed webhooks).
- File the proof of completed work in the organization's own bucket.
- Keep credentials safe and every delivery accountable.

## Inputs and outputs

- **In:** domain facts (`WorkEvents.Completed`, `InformationEvents.AnswerReceived`,
  `InformationEvents.RequestExpiredIncomplete`); people's changes to connections.
- **Out:** HTTPS POSTs with signed integration events; objects in an
  S3-compatible bucket; delivery records; `IntegrationEvents.ConnectionPaused`.

## How it works

1. A listener turns a domain fact into an integration event (id, type,
   version, time, organization, small data) and queues a fan-out job, so facts
   recorded in a client's request-link scope reach the organization's scope.
2. The fan-out job records one delivery per subscribed active connection (and
   per storage export for completed work), once per event and connection, and
   schedules each.
3. The delivery job checks the connection, checks the address again, sends
   (webhook) or exports and reads back (storage), and records the outcome.
   Retryable failures back off; others fail; a connection with repeated
   failures is paused.

## Receiving Avenra webhooks

Headers: `Avenra-Event-Id`, `Avenra-Event-Type`, `Avenra-Signature:
t=<unix>,v1=<hex>`. Compute HMAC-SHA256 with the signing secret over
`<t>.<raw body>`, compare in constant time, refuse timestamps older than five
minutes, and ignore event ids already processed. Answer 2xx quickly; 408, 429
and 5xx are retried.

## Failure modes

| Failure | Behaviour |
|---|---|
| Receiver down, slow, 429 or 5xx | Retried with backoff (up to 8 attempts) |
| Receiver answers 4xx | Fails at once |
| Address now internal or not HTTPS | Fails at once |
| Repeated failures | Connection paused and announced; resume and redeliver |
| Export object differs after writing | Export fails; nothing is reported as delivered |
| Connection revoked | Pending deliveries fail; nothing more is sent |

## Operations

- Metric `avenra.integration.deliveries` (provider, outcome).
- Settings: `avenra.integrations.*` (attempts, backoff, pause threshold,
  timeout); `allow-loopback-http` only for local development and tests.
