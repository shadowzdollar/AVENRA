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
