# `@avenra/contracts`

The Avenra API contract. `openapi/avenra.v1.yaml` is the **source of truth**
for the API (ADR-008): the backend's Java interfaces and DTOs and this
package's TypeScript client are generated from it.

## Changing the API

1. Edit `openapi/avenra.v1.yaml` first, before any backend or frontend code.
2. `make contract-check` lints the contract, runs the lint-rule self-test,
   regenerates the TypeScript types and type-checks.
3. `make api-verify` regenerates the Java interfaces. A controller that no
   longer matches the contract does not compile.

Generated code is not committed (`src/generated/`, `apps/api/target/`).

## Rules enforced by `redocly.yaml`

Besides Redocly's `recommended-strict` rules, every operation must declare
what Guidelines §32 requires but OpenAPI cannot express:

| Extension | Values |
|---|---|
| `x-avenra-permission` | `public` or a permission such as `work.read` |
| `x-avenra-audit` | `required` or `none` |
| `x-avenra-idempotency` | `safe`, `idempotent` or `key-required` |
| `x-avenra-rate-limit` | `default` or a named policy |

Every path starts with `/api/v<N>/`. Every operation defines `4XX` responses,
which use the shared `ErrorResponse` schema.

`test/lint-rules.selftest.mjs` lints a deliberately broken contract and fails
unless every Avenra rule reports it.

## Contract tests in the backend

`ContractConformanceIT` checks the running API against this file:

- every generated API interface has an implementation
- anonymous access matches `x-avenra-permission` for every operation, and the
  security configuration makes nothing public that the contract does not
- responses (success and errors) conform to their schemas

## Using the client

```ts
import { createAvenraClient } from "@avenra/contracts";

const api = createAvenraClient({ baseUrl: "http://localhost:8080" });
const { data, error } = await api.GET("/api/v1/meta");
```

## Notes

- OpenAPI 3.1 support in `openapi-generator` is still marked beta. The
  generated Java is compiled with warnings as errors and checked by the
  contract tests above, which limits the risk.
- Breaking-change detection against the last released contract runs in CI
  (Phase 1 step 12).

## Accepted breaking changes

CI fails on breaking changes against `main` (stricter than ADR-008, which
compares with the last released contract). Before the first release, an
intentional change may be accepted by adding its oasdiff message to
`accepted-breaking-changes.txt`, with the reason recorded here. Nothing is
released yet, so no client is affected by these entries.

| Change | Reason | Added |
|---|---|---|
| `INCONSISTENT_INFORMATION` added to the exception `type` enum (4 operations) | Phase 5 (ADR-027): an accepted answer that stops passing its checks raises this exception. Clients must treat exception types they do not know as a generic exception. | 2026-10-15 |

| `DOCUMENT_KIND` and `DOCUMENT_FIELD` added to the rule `type` and check `rule` enums (36 operation/property pairs) | Phase 6 (ADR-031): advisory rules that read the document. Clients must show rule types they do not know as a generic check. | 2026-10-15 |
| `work.plan` added to the AI invocation `purpose` enum | Phase 7 (ADR-033): planning calls are recorded like readings. Clients must show purposes they do not know as a generic call. | 2026-10-20 |
