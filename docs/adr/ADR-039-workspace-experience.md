# ADR-039: Workspace experience and design system

**Status:** Accepted
**Amends:** Guidelines §144.2 (adds four neutral and status surface tokens)

## Context

The product owner designed the public site and the signed-in workspace in
Lovable (`frontend/`, a TanStack Start prototype on sample data) from the
reference templates in `templates/`. It is a design and feature reference,
not the production frontend: the production web app stays `apps/web`
(Next.js, ADR-013 same-origin API, ADR-011 security baseline, the typed
contract client). The prototype shows pages the web app does not have yet
(an overview, organization-wide requests, approvals and evidence) and a
workspace layout (sidebar, header, panels) that the current pages do not
follow.

## Decision

- **Adopt the design, not the code.** `apps/web` takes the prototype's
  layout, typography and components, rebuilt on our tokens and components;
  the prototype's runtime (TanStack Start, Radix, shadcn, recharts, Lovable
  error reporting, Google Fonts) is not imported. `frontend/` stays in the
  repository as the design reference and is not built or deployed.
- **Tokens.** §144.2 gains four tokens the design needs:

  | Token | Hex | Purpose |
  |---|---|---|
  | `--color-canvas` | `#F8F9FB` | Off-white workspace background behind panels (§144.1 neutral) |
  | `--color-success-surface` | `#ECFDF3` | Background of success pills |
  | `--color-warning-surface` | `#FFFAEB` | Background of warning pills |
  | `--color-error-surface` | `#FEF3F2` | Background of error pills |

  Status surfaces carry the status colour's meaning only; they are never
  decoration (§144.3).
- **Workspace.** Organization pages share one shell: a sidebar (Overview,
  Work, Requests, Approvals; Exceptions, Evidence, Analytics; Integrations,
  Team, Settings, Billing), a header (search, notifications, the person and
  the organization switcher), panels and pills. Links stay under
  `/organizations/{id}/…`, so emails and notifications keep working.
- **Honest content in the product.** Every number on a signed-in page comes
  from the API; nothing is sample data. Integrations show the providers that
  exist (ADR-034). Sign-in offers what the identity module supports (no social
  or SSO buttons until they exist).
- **The landing page is the owner's design, unchanged in layout, decoration
  and style** (ported from the prototype with its own CSS). Its logo bubbles
  show services Avenra works with today: S3-compatible storage for the
  evidence export, automation tools that receive its signed webhooks, and
  Gmail. Its testimonials and prices are the owner's placeholder copy, marked
  in the code, to be confirmed before launch (Master Project §23 on prices).
- **API additions (contract first, ADR-008):** organization-wide request
  links (with the work they belong to and how much was answered), a manual
  reminder on a request link (the same job and key as the scheduled
  reminders, so a reminder is never sent twice), organization-wide agent
  runs by status (the approvals inbox), organization-wide evidence, and a
  title search on the work list.
- **Two new dependencies.** `lucide-react` (icons). §99: (1) needed — the
  design uses some forty icons on every page; (2) the stack has no icon set,
  and hand-drawn SVGs would duplicate a maintained library; (3) maintained —
  frequent releases, large community; (4) security history — no advisories;
  it ships static SVG components with no runtime behaviour; (5) lock-in —
  none, icons are plain components and replaceable one by one; (6) cost —
  tree-shaken, only imported icons are bundled.
  `react-icons` (third-party logo marks on the landing page, as in the
  design): (1) needed for the services' official marks; (2) no logo set in
  the stack; (3) maintained, widely used; (4) no advisories, static SVG
  components; (5) no lock-in, used in one file; (6) tree-shaken, only the ten
  imported marks are bundled.

- **Amends ADR-038:** organization analytics are no longer cached. The
  overview reads them on every visit, and a five-minute cache showed figures
  that ignored work created a moment before. The queries are indexed per
  organization and the default rate limit still applies.

## Consequences

- The prototype can keep evolving in Lovable; changes are carried over by
  hand, on purpose, page by page.
- Pages gain features only where the API has them; the rest is not shown.
