# Avenra Web (`apps/web`)

Next.js (App Router), React 19, strict TypeScript 5.9 (ADR-012), Tailwind CSS
4, TanStack Query. The API client is generated from the contract
(`@avenra/contracts`, ADR-008).

## Commands

From the repository root:

```bash
make web-dev     # development server on :3000 (needs `make api-run`; /api/* is forwarded to it)
make web-check   # lint (zero warnings), type check, unit tests
make web-build   # production build
```

## Configuration

| Variable | Purpose |
|---|---|
| `AVENRA_API_INTERNAL_URL` | Where the web server forwards `/api/*` (ADR-013). Server-side only, read at runtime, validated on first use. |

The browser talks only to the web application's own origin. Session cookies
are first-party, CORS is not involved, and the API can stay on a private
network. One image works in every environment.

## Rules

- **Colours come only from the design tokens** in `src/app/globals.css`
  (Guidelines §144.2). Tailwind's default palette is removed, and
  `design-tokens.test.ts` fails if a token value drifts from the Guidelines.
- **State** (Guidelines §4.1): server state in TanStack Query, UI state in
  local React state, URL state in route parameters. No global store without a
  documented reason.
- **No `any`**, no floating promises, no `dangerouslySetInnerHTML`, no console
  logging (ESLint, zero warnings).
- **Security headers**: static headers in `next.config.ts`. A per-request
  Content-Security-Policy with a nonce in `src/proxy.ts`: scripts and styles
  only from our origin or with the nonce, network access only to our origin
  and the API, no framing. Pages therefore render per request; a statically
  pre-rendered page could not carry the nonce.
- **No inline `style` attributes** (the CSP blocks them). This is why the logo
  uses a plain `<img>` instead of `next/image`.
- **Fonts are self-hosted** (`@fontsource-variable/inter`): no build-time
  download and no requests to third parties from users' browsers.

## Verified behaviour (Phase 1)

A production build served with `next start` and loaded in headless Chrome,
with the API running, renders "Connected to avenra-api (v1)" with zero CSP
violations. Every script carries the request's nonce. A control page that
breaks its CSP confirmed the violations would have been reported.
