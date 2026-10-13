# ADR-012: TypeScript 5.9 for the JavaScript workspace

**Status:** Accepted

## Context

TypeScript 7 (the native Go compiler) is the current `latest` release. It
does not provide the JavaScript compiler API that tools such as
`openapi-typescript` depend on; `openapi-typescript` declares
`peerDependencies: typescript ^5.x`. ADR-008 requires TypeScript types to be
generated from the OpenAPI contract.

## Decision

- The whole pnpm workspace uses **TypeScript 5.9.3**, pinned exactly.
- Strict mode everywhere (Guidelines §83).
- Revisit when the contract generator and the Next.js/ESLint toolchain
  support TypeScript 7.

## Alternatives

- **TypeScript 7 for the web app, 5.9 only for generation** — rejected: two
  compilers in one workspace, with different type-checking behavior.
- **A different generator** — rejected: `openapi-typescript` plus
  `openapi-fetch` is the smallest well-maintained option that produces
  types without runtime code generation.

## Consequences

- One compiler version across the workspace.
- An upgrade to TypeScript 7 becomes one deliberate change later.
