# Administration

How an organization runs itself (ADR-036). Code: `organization/application/AdministrationService`,
`audit/AuditHistory`, `platform/administration`; schema `V11__administration.sql`;
web: `/organizations/{id}/administration`.

## Purpose and responsibilities

- Show what happened and who did it: the audit history, filtered, paged and
  exported as CSV.
- Keep the organization's settings: its name and how long request links stay
  valid by default.
- Show what each role may do, from the code that enforces it.
- Show usage and health without any module reading another's tables.

## How it works

1. The organization module authorizes every request and enters the
   organization's scope.
2. History comes from the audit module (`AuditHistory`), newest first, 50 per
   page; the cursor is the last entry's time and id.
3. Usage and health come from every `UsageContributor` and
   `HealthContributor`: organization (members, invitations), work (clients,
   work, open high exceptions), documents (count, size, quarantined), AI
   (calls and tokens today), integrations (active, paused, failed deliveries)
   and the platform (failed jobs, oldest waiting job, failed emails).
4. Health is `ATTENTION` when any check needs it, otherwise `OK`.

## Adding a figure or check

Implement `UsageContributor` or `HealthContributor` in the module that owns
the data, read only that module's tables, and give the bean an `@Order` so the
page stays stable.

## Operations

- Exports are limited to 10,000 rows; narrow the filter for more.
- Health covers one organization over 24 hours; platform health stays in
  actuator, metrics and traces.
