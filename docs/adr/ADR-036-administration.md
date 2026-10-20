# ADR-036: Administration, usage and health

**Status:** Accepted

## Context

Guidelines §121 Phase 10 asks for audit history, organization settings,
permissions, integration administration, usage and system health. The data
lives in many modules, and §128 and ADR-026 keep each module the only reader
of its tables.

## Decision

- **Audit history** is served by the audit module's `AuditHistory` (it owns
  `audit_events`) and authorized by the organization module (`audit.read`):
  filters by action prefix, person and time window; newest first; pages of 50
  with an opaque cursor (time and id); CSV export of the filtered history, at
  most 10,000 rows per export. Details are shown as stored; they never hold
  secrets by construction (§59).
- **Organization settings**: the name and the default validity of client
  request links (`requestLinkDays`, 1–30, the most a single request may ask for, **product default** 14), used when a
  request does not name its own. Changes need `organization.manage` and are
  audited.
- **Permissions administration**: the role-to-permission matrix is served from
  the code that enforces it (`Role`), so it cannot drift; role changes stay
  with members (`members.manage`).
- **Usage and health contributors.** The platform defines `UsageContributor`
  and `HealthContributor`; each module reports figures about its own data for
  one organization. The administration view (organization module) collects
  them; nobody reads another module's tables.
- **Health** is per organization, over the last 24 hours: failed jobs and the
  oldest waiting job, failed emails, paused integrations and failed
  deliveries, quarantined files, open high-severity exceptions. Status
  `ATTENTION` when any check needs it, otherwise `OK`. Platform health for
  operators stays in actuator, metrics and traces.
- Usage and health need `organization.manage`.

## Consequences

- A new module adds its figures by implementing a contributor.
- The administration page is a view; every action still goes through the
  module that owns it.
