# AVENRA --- BUILDING GUIDELINES & TECHNICAL MASTER SPECIFICATION

> **Product:** Avenra\
> **Category:** Business Work Execution Platform\
> **Initial Market:** Professional Services\
> **Initial Wedge:** Information-heavy client/project coordination\
> **Technical Objective:** Build the core platform to approximately 85%
> technical completeness before major field-driven evolution\
> **Document Type:** Technical Master Specification\
> **Status:** Approved implementation baseline

------------------------------------------------------------------------

# 1. Purpose of This Document

This document defines how Avenra is to be designed, built, tested,
secured, deployed, operated, and evolved.

The previous Master Project Document defines:

-   the problem
-   the market
-   the product
-   the vision
-   the brand
-   the business model
-   the product philosophy

This document defines the technical system that turns that product
definition into software.

It is intentionally prescriptive.

When implementation decisions are made, this document should be treated
as the default engineering authority unless a documented architectural
decision changes it.

------------------------------------------------------------------------

# 2. Core Engineering Principle

Avenra is not primarily a CRUD application with an AI chat box.

It is a **business work execution system**.

The architecture must therefore represent:

-   work
-   intent
-   state
-   information
-   evidence
-   actions
-   approvals
-   exceptions
-   integrations
-   execution history

The system must be able to answer:

1.  What work exists?
2.  Why does it exist?
3.  Who owns it?
4.  What information is required?
5.  What information has been received?
6.  What has been verified?
7.  What remains uncertain?
8.  What actions have been attempted?
9.  What actions succeeded?
10. What requires human intervention?
11. What evidence supports completion?
12. Is the work actually complete?

------------------------------------------------------------------------

# 3. Architecture Decision

## 3.1 Initial Architecture: Modular Monolith + Workers

Avenra should begin as a **modular monolith with asynchronous workers**,
not as a large microservices ecosystem.

This is deliberate.

Microservices introduce:

-   distributed failure
-   network complexity
-   deployment complexity
-   observability overhead
-   data consistency problems
-   duplicated infrastructure
-   slower development

Avenra needs strong domain boundaries before it needs many independently
deployed services.

The initial system should therefore have:

``` text
                    ┌─────────────────────┐
                    │      Web Client      │
                    │      Next.js         │
                    └──────────┬──────────┘
                               │
                         HTTPS / API
                               │
                    ┌──────────▼──────────┐
                    │   Avenra Backend    │
                    │    Spring Boot      │
                    │                     │
                    │ ┌─────────────────┐ │
                    │ │ Identity        │ │
                    │ │ Organizations    │ │
                    │ │ Work            │ │
                    │ │ Information     │ │
                    │ │ Verification    │ │
                    │ │ Execution       │ │
                    │ │ Approvals       │ │
                    │ │ Integrations    │ │
                    │ │ Notifications   │ │
                    │ │ Audit           │ │
                    │ │ Billing         │ │
                    │ └─────────────────┘ │
                    └───────┬─────┬──────┘
                            │     │
                ┌───────────┘     └────────────┐
                ▼                              ▼
        ┌──────────────┐              ┌────────────────┐
        │ PostgreSQL   │              │ Redis / Queue  │
        └──────────────┘              └───────┬────────┘
                                              │
                                  ┌───────────▼──────────┐
                                  │ Background Workers   │
                                  │ Execution / Jobs     │
                                  └───────────┬──────────┘
                                              │
                           ┌──────────────────┼──────────────────┐
                           ▼                  ▼                  ▼
                    ┌────────────┐    ┌────────────┐    ┌────────────┐
                    │ AI Service │    │ Integrations│   │ Object     │
                    │ Python     │    │ / External  │   │ Storage    │
                    └────────────┘    │ Systems     │   └────────────┘
                                      └────────────┘
```

The architecture must allow future extraction of high-load modules into
services without requiring a rewrite.

------------------------------------------------------------------------

# 4. Technology Stack

## 4.1 Frontend

### Primary

-   Next.js
-   React
-   TypeScript
-   Tailwind CSS
-   accessible component primitives
-   TanStack Query for server-state management
-   Zod for client-side boundary validation where appropriate

The frontend must be strongly typed.

Avoid unnecessary client-side state.

Prefer:

``` text
Server state → TanStack Query
UI state → local React state
Form state → form library / controlled state
URL state → route/search parameters
Global state → only when genuinely necessary
```

Do not turn the frontend into a second backend.

------------------------------------------------------------------------

# 5. Backend

## 5.1 Primary Backend

**Java + Spring Boot**

Reasons:

-   strong enterprise ecosystem
-   excellent typing
-   mature security tooling
-   mature database access
-   strong testing ecosystem
-   good concurrency support
-   suitable for enterprise SaaS
-   aligns with Avenra's long-term enterprise positioning

Use:

-   Spring Boot
-   Spring Web
-   Spring Security
-   Spring Data JPA where appropriate
-   Hibernate
-   Bean Validation
-   Flyway
-   Jackson
-   Testcontainers
-   Micrometer/OpenTelemetry integration

The backend must be organized around business modules, not around random
technical folders.

------------------------------------------------------------------------

# 6. AI Service

## 6.1 Python AI Layer

AI-specific workloads may be implemented in Python.

Use Python for:

-   document processing
-   extraction
-   AI orchestration
-   evaluation pipelines
-   model-specific processing
-   embedding generation
-   retrieval workflows
-   specialized data processing

The AI service must not own the business database.

The Java backend remains the authoritative business system.

The AI layer receives controlled requests and returns structured
results.

------------------------------------------------------------------------

# 7. Database

## PostgreSQL

PostgreSQL is the primary system of record.

It stores:

-   organizations
-   users
-   memberships
-   roles
-   work
-   tasks
-   projects
-   clients
-   requirements
-   submissions
-   verification records
-   approvals
-   executions
-   integrations
-   audit events
-   billing records
-   configuration
-   metadata

PostgreSQL Row-Level Security may be used as an additional
tenant-isolation layer. PostgreSQL supports row policies that restrict
which rows can be selected or modified, including separate `USING` and
`WITH CHECK` behavior. citeturn0search10

Application-level authorization remains mandatory even when
database-level security is enabled.

------------------------------------------------------------------------

# 8. Cache and Short-Lived State

## Redis

Redis is permitted for:

-   caching
-   rate limiting
-   distributed locks
-   short-lived job state
-   idempotency keys
-   session-related ephemeral state
-   queue support where appropriate

Redis must not become the source of truth for business records.

If losing Redis would permanently lose business data, the architecture
is wrong.

------------------------------------------------------------------------

# 9. Messaging and Background Processing

Avenra will perform many operations asynchronously.

Examples:

-   sending notifications
-   processing documents
-   AI extraction
-   integration synchronization
-   scheduled follow-ups
-   retrying failed actions
-   generating reports
-   verification
-   long-running execution

These operations must not block normal HTTP requests.

Initial implementation may use a durable job queue backed by Redis or a
managed queue.

A message broker such as Kafka should only be introduced when actual
scale or event-stream requirements justify it.

Do not add Kafka merely because Avenra is an "enterprise" platform.

------------------------------------------------------------------------

# 10. Object Storage

Object storage should be S3-compatible.

Use it for:

-   uploaded documents
-   generated files
-   evidence files
-   report artifacts
-   integration payload archives where permitted
-   document-processing intermediates

Database records should store metadata and references, not large binary
files.

Files must be accessed through controlled authorization.

Never expose private storage buckets directly to users.

------------------------------------------------------------------------

# 11. Architecture Layers

The backend should follow clear layers.

``` text
API
 ↓
Application
 ↓
Domain
 ↓
Infrastructure
```

## API Layer

Responsible for:

-   HTTP
-   authentication context
-   request validation
-   response serialization
-   API error mapping

## Application Layer

Responsible for:

-   use cases
-   orchestration
-   transactions
-   permissions
-   command handling

## Domain Layer

Responsible for:

-   business rules
-   entities
-   value objects
-   domain services
-   state transitions

## Infrastructure Layer

Responsible for:

-   database
-   external APIs
-   queues
-   storage
-   email
-   AI providers
-   observability

Business rules must not depend directly on infrastructure
implementations.

------------------------------------------------------------------------

# 12. Domain Modules

The backend should initially contain these major modules.

``` text
identity
organization
workspace
client
project
work
task
information
document
requirement
verification
execution
approval
exception
integration
notification
audit
billing
analytics
administration
ai
```

Not every module needs to be a separate deployable service.

They are domain boundaries.

------------------------------------------------------------------------

# 13. Repository Structure

Recommended monorepo:

``` text
avenra/
├── apps/
│   ├── web/
│   ├── api/
│   └── ai/
│
├── packages/
│   ├── contracts/
│   ├── ui/
│   ├── config/
│   └── shared-types/
│
├── infrastructure/
│   ├── docker/
│   ├── terraform/
│   ├── monitoring/
│   └── environments/
│
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── api/
│   ├── security/
│   └── product/
│
├── scripts/
│
├── tests/
│   ├── integration/
│   ├── e2e/
│   └── performance/
│
├── .github/
│   └── workflows/
│
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

The exact framework-specific source layout may differ inside each
application.

------------------------------------------------------------------------

# 14. Package Boundaries

A module must not freely access another module's internal
implementation.

Bad:

``` text
work → directly manipulates verification repository internals
```

Good:

``` text
work → application command → verification interface
```

Public module contracts should be explicit.

This reduces coupling and makes future service extraction possible.

------------------------------------------------------------------------

# 15. Domain Model

The most important entities are:

``` text
Organization
User
Membership
Role
Client
Project
Work
Task
Requirement
InformationItem
Document
Submission
Verification
Exception
Approval
Execution
ExecutionStep
Integration
Connection
Notification
AuditEvent
Evidence
Workflow
WorkflowRun
AIInvocation
UsageRecord
Subscription
```

------------------------------------------------------------------------

# 16. Organization and Tenant Model

Every customer organization is a tenant.

Core tenant-owned records should contain:

``` text
organization_id
```

unless ownership is inherited through a parent entity.

The application must never trust a tenant ID supplied by an untrusted
client.

The authenticated identity determines which organizations the user may
access.

Tenant context must be established server-side.

------------------------------------------------------------------------

# 17. Identity Model

Users belong to organizations through memberships.

Conceptually:

``` text
User
  │
  ├── Membership → Organization
  │
  └── Role(s)
```

Do not assume:

``` text
user.organization_id
```

is sufficient for the long term.

A user may eventually belong to multiple organizations.

------------------------------------------------------------------------

# 18. Roles and Permissions

Start with:

-   Owner
-   Admin
-   Manager
-   Member
-   Viewer

Permission checks must be capability-based.

Examples:

``` text
work.read
work.create
work.update
work.execute
work.approve
work.delete

information.read
information.collect
information.verify

integration.read
integration.manage

billing.read
billing.manage

organization.manage
members.manage

audit.read
```

Do not implement authorization using scattered checks such as:

``` java
if (user.isAdmin()) ...
```

Prefer explicit permissions.

------------------------------------------------------------------------

# 19. Work Entity

`Work` is one of the central concepts of Avenra.

It should represent a business objective that needs completion.

Conceptual fields:

``` text
id
organization_id
project_id
title
description
type
priority
status
owner_id
requested_by
due_at
started_at
completed_at
completion_reason
created_at
updated_at
```

Possible states:

``` text
DRAFT
READY
RUNNING
WAITING_FOR_INFORMATION
WAITING_FOR_APPROVAL
BLOCKED
FAILED
COMPLETED
CANCELLED
```

State transitions must be controlled.

Do not allow arbitrary status mutation from the frontend.

------------------------------------------------------------------------

# 20. Task Model

Tasks represent discrete units of work inside a larger objective.

A task may be:

-   human
-   automated
-   AI-assisted
-   integration-driven
-   approval-based

Every task must have a clear completion condition.

------------------------------------------------------------------------

# 21. Requirement Model

A requirement describes something that must be satisfied before work can
proceed.

Example:

``` text
Requirement:
Client tax document

Expected:
PDF

Required:
Yes

Verification:
Document exists + required fields present
```

Requirements are important because Avenra should reason about
completeness rather than merely task count.

------------------------------------------------------------------------

# 22. Information Model

Information should have:

-   source
-   value
-   type
-   confidence
-   freshness
-   verification state
-   owner/context
-   evidence reference

Conceptually:

``` text
Information
    ↓
Source
    ↓
Evidence
    ↓
Verification
```

The platform must preserve provenance whenever practical.

------------------------------------------------------------------------

# 23. Document Model

Documents require:

-   metadata
-   storage reference
-   content type
-   source
-   uploader
-   extraction state
-   verification state
-   version
-   checksum
-   timestamps

Documents should support versioning.

Never silently overwrite important business evidence.

------------------------------------------------------------------------

# 24. Evidence

Evidence should be a first-class concept.

Evidence may be:

-   a document
-   a database record
-   an API response
-   an email
-   a submitted form
-   a human approval
-   an execution result

A verification result should be able to point back to evidence.

------------------------------------------------------------------------

# 25. Verification Model

Verification should produce structured results.

Example:

``` json
{
  "status": "VERIFIED",
  "confidence": 0.97,
  "checks": [
    {
      "name": "document_present",
      "passed": true
    },
    {
      "name": "required_fields",
      "passed": true
    }
  ],
  "evidence": ["..."]
}
```

Confidence alone is never sufficient for high-risk decisions.

------------------------------------------------------------------------

# 26. Exception Model

Exceptions are normal business states.

An exception should contain:

``` text
id
work_id
type
severity
description
source
status
assigned_to
resolution
created_at
resolved_at
```

Possible states:

``` text
OPEN
IN_PROGRESS
WAITING
RESOLVED
DISMISSED
```

The product should treat exception handling as a core capability rather
than an error screen.

------------------------------------------------------------------------

# 27. Approval Model

Approvals should be explicit.

An approval should contain:

``` text
requested_by
approver
reason
scope
decision
decision_at
evidence
```

Possible decisions:

``` text
APPROVED
REJECTED
REQUEST_CHANGES
```

Approval actions must be auditable.

------------------------------------------------------------------------

# 28. Execution Model

An execution is an attempt to perform an action.

It should record:

``` text
execution_id
work_id
step_id
actor
action
target
input_reference
started_at
completed_at
status
result
error
retry_count
```

Possible statuses:

``` text
PENDING
RUNNING
SUCCEEDED
FAILED
CANCELLED
REQUIRES_APPROVAL
```

An execution must not be considered successful merely because the API
call returned.

Where possible, the resulting state should be verified.

------------------------------------------------------------------------

# 29. Execution State Machine

The execution engine should follow a controlled state machine.

``` text
PLANNED
   ↓
AUTHORIZED
   ↓
READY
   ↓
RUNNING
   ├──→ WAITING
   ├──→ REQUIRES_APPROVAL
   ├──→ FAILED
   └──→ SUCCEEDED
             ↓
          VERIFIED
             ↓
         COMPLETED
```

No arbitrary state jumps.

------------------------------------------------------------------------

# 30. Idempotency

All external side effects must be designed with idempotency in mind.

Examples:

-   sending requests
-   creating external records
-   updating external systems
-   generating invoices
-   triggering notifications

A retry must not accidentally execute the same side effect twice.

Use:

-   idempotency keys
-   unique operation IDs
-   external request IDs
-   state checks

where appropriate.

------------------------------------------------------------------------

# 31. API Design

Use REST for the primary public API.

Base:

``` text
/api/v1
```

Examples:

``` text
GET    /organizations
GET    /organizations/{id}
POST   /work
GET    /work/{id}
PATCH  /work/{id}
POST   /work/{id}/execute
POST   /work/{id}/approve
GET    /work/{id}/events

GET    /projects
POST   /projects

GET    /requirements
POST   /requirements

GET    /integrations
POST   /integrations/{type}/connect
DELETE /integrations/{id}

GET    /audit/events
```

Use resource-oriented endpoints.

Avoid RPC-style endpoint explosion unless the action genuinely
represents a command.

------------------------------------------------------------------------

# 32. API Rules

Every endpoint must define:

-   authentication requirement
-   authorization requirement
-   request schema
-   response schema
-   error behavior
-   idempotency requirements
-   audit requirements
-   rate limits where appropriate

Never expose database entities directly as API contracts.

Use DTOs.

------------------------------------------------------------------------

# 33. API Versioning

Public APIs use:

``` text
/api/v1
```

Breaking changes require a new version.

Internal APIs may evolve faster but must still have explicit contracts.

------------------------------------------------------------------------

# 34. Error Handling

Use structured errors.

Example:

``` json
{
  "code": "WORK_NOT_APPROVABLE",
  "message": "The work cannot be approved in its current state.",
  "requestId": "..."
}
```

Never return internal stack traces to clients.

Every request should have a correlation/request ID.

------------------------------------------------------------------------

# 35. Authentication

Authentication should support:

-   email/password initially
-   secure password hashing
-   email verification
-   password reset
-   session management
-   optional MFA
-   OAuth/OIDC providers later
-   enterprise SSO later

Never store plaintext passwords.

Use established security libraries rather than custom cryptography.

------------------------------------------------------------------------

# 36. Authorization

Authorization must occur server-side.

The frontend may hide buttons for usability, but hiding a button is not
security.

Every protected operation must validate:

``` text
Identity
→ Organization membership
→ Permission
→ Resource ownership/access
→ Action policy
```

------------------------------------------------------------------------

# 37. Tenant Isolation

Tenant isolation must exist at multiple layers:

``` text
Application authorization
        +
Database constraints / policies
        +
Storage isolation
        +
Integration credential isolation
        +
Cache key isolation
        +
Logging isolation
```

A cache key must never accidentally allow one tenant to retrieve another
tenant's data.

Example:

``` text
tenant:{organizationId}:work:{workId}
```

rather than:

``` text
work:{workId}
```

------------------------------------------------------------------------

# 38. Database Rules

Use migrations only.

Recommended migration system:

**Flyway**

Rules:

-   schema changes are versioned
-   migrations are immutable after release
-   destructive migrations require explicit review
-   production migrations must be tested
-   database indexes must be intentional
-   foreign keys must be used where appropriate
-   timestamps use UTC
-   IDs use UUIDs or another globally safe identifier strategy

------------------------------------------------------------------------

# 39. Database Naming

Use consistent naming.

Recommended:

``` text
snake_case
```

Examples:

``` text
organization_id
created_at
updated_at
completed_at
```

Do not mix:

``` text
createdAt
created_at
CreatedAt
```

inside the database.

------------------------------------------------------------------------

# 40. Transaction Rules

Transactions should protect business invariants.

A single business command should generally execute within a transaction
when multiple records must remain consistent.

Do not hold database transactions open while:

-   waiting for AI
-   calling slow external APIs
-   waiting for human input
-   performing large file processing

Use durable state and asynchronous execution instead.

------------------------------------------------------------------------

# 41. AI Architecture

AI should be treated as an external reasoning capability inside a
controlled execution system.

Conceptually:

``` text
User Intent
    ↓
Work Context
    ↓
Policy / Permissions
    ↓
AI Planning
    ↓
Structured Plan
    ↓
Validation
    ↓
Tool Selection
    ↓
Execution
    ↓
Verification
    ↓
Evidence
```

The model must not have unrestricted access to the entire platform.

------------------------------------------------------------------------

# 42. AI Provider Abstraction

Never tightly couple the business domain to one AI provider.

Use an internal abstraction such as:

``` text
AIProvider
 ├── generate()
 ├── structuredOutput()
 ├── embed()
 └── classify()
```

Possible providers can then be implemented behind the interface.

The business system should not contain provider-specific assumptions
everywhere.

------------------------------------------------------------------------

# 43. Structured AI Outputs

Prefer structured output over free-form text.

Example:

``` json
{
  "intent": "COLLECT_CLIENT_DOCUMENTS",
  "requirements": [
    {
      "name": "financial_statement",
      "required": true
    }
  ],
  "confidence": 0.93
}
```

Validate model output before accepting it.

Never directly execute arbitrary model-generated code or commands.

------------------------------------------------------------------------

# 44. Agent Architecture

Avenra should initially use a **central orchestrator with specialized
capabilities**, rather than uncontrolled autonomous agents.

Conceptually:

``` text
                    Orchestrator
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
 Information         Verification      Planning
 Capability          Capability         Capability
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ▼
                    Tool Gateway
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
     Email             CRM              Storage
```

This makes permissions, tracing, policy enforcement, and failure
handling more manageable.

------------------------------------------------------------------------

# 45. Tool Gateway

Agents must access external capabilities through a controlled tool
gateway.

Every tool must define:

-   tool name
-   description
-   input schema
-   output schema
-   permissions
-   risk level
-   audit requirements
-   timeout
-   retry policy
-   idempotency behavior

Example:

``` text
create_client_record
send_information_request
read_project
upload_document
update_project_status
request_approval
```

Do not allow the model to call arbitrary URLs or arbitrary system
commands.

------------------------------------------------------------------------

# 46. Tool Risk Levels

Every tool should have a risk classification.

### LOW

Read-only operations.

### MEDIUM

Reversible modifications.

### HIGH

External side effects or sensitive modifications.

### CRITICAL

Financial, legal, security, destructive, or irreversible operations.

High-risk tools require stronger authorization and potentially human
approval.

------------------------------------------------------------------------

# 47. AI Permission Model

An agent should have:

``` text
Identity
+
Tenant
+
Role
+
Allowed Tools
+
Allowed Resources
+
Allowed Actions
+
Policy Constraints
```

Never use:

> "The AI can do anything the user can do."

unless explicitly justified and controlled.

Prefer scoped capabilities.

------------------------------------------------------------------------

# 48. Prompt Injection Defense

External business content must be treated as untrusted input.

A document or email can contain instructions that attempt to manipulate
the model.

The system must distinguish:

``` text
Trusted system instructions
Trusted application policy
Trusted user intent
Untrusted external content
```

External content must not automatically become an instruction source.

This is especially important because current OWASP agentic guidance
identifies risks such as goal hijacking, tool misuse, privilege abuse,
memory poisoning, and cascading failures.
citeturn0search1turn0search2

------------------------------------------------------------------------

# 49. AI Memory

Do not give agents unrestricted persistent memory.

Memory should be:

-   scoped
-   typed
-   permissioned
-   attributable
-   auditable
-   expirable where appropriate

Separate:

``` text
conversation context
workflow state
business records
learned preferences
long-term memory
```

Do not confuse these.

Business records belong in the business system of record, not hidden
inside model memory.

------------------------------------------------------------------------

# 50. AI Hallucination Controls

AI output must be checked through:

-   schema validation
-   source grounding
-   deterministic rules
-   confidence thresholds
-   evidence requirements
-   human approval
-   post-action verification

For critical workflows:

``` text
AI proposes
→ deterministic validation
→ human approval
→ execution
→ verification
```

------------------------------------------------------------------------

# 51. Retrieval and Documents

If retrieval-augmented generation is used:

``` text
Document
 ↓
Ingestion
 ↓
Parsing
 ↓
Chunking
 ↓
Metadata
 ↓
Embedding
 ↓
Vector/index storage
 ↓
Retrieval
 ↓
Context validation
 ↓
AI
```

Every retrieved fact should retain source metadata where practical.

Do not build a vector database into the architecture before a real
retrieval use case exists.

------------------------------------------------------------------------

# 52. AI Evaluation

Every important AI workflow needs evaluation.

Track:

-   accuracy
-   extraction accuracy
-   classification accuracy
-   tool-selection accuracy
-   false positives
-   false negatives
-   refusal correctness
-   latency
-   cost
-   human correction rate

Maintain representative evaluation datasets.

Never rely solely on manual impressions.

------------------------------------------------------------------------

# 53. AI Cost Controls

Track AI usage per:

``` text
organization
workflow
user
model
operation
```

Record:

-   input tokens
-   output tokens
-   model
-   latency
-   estimated cost
-   success
-   retries

AI spending must be observable before the product reaches significant
scale.

------------------------------------------------------------------------

# 54. Integration Architecture

Integrations must use a common abstraction.

``` text
Integration
   │
   ├── Connection
   ├── Authentication
   ├── Capabilities
   ├── Events
   ├── Actions
   └── Sync
```

Each integration should define capabilities.

Example:

``` text
CRM
 ├── read_customer
 ├── create_customer
 ├── update_customer
 └── search_customer
```

The execution engine should depend on capabilities rather than
provider-specific details.

------------------------------------------------------------------------

# 55. Integration Credentials

Credentials must be:

-   encrypted
-   access-controlled
-   never returned to normal clients
-   never written to logs
-   rotatable
-   revocable

Prefer OAuth where supported.

API keys must be treated as secrets.

------------------------------------------------------------------------

# 56. Notifications

Notification channels may include:

-   email
-   in-app notifications
-   future communication integrations

Notifications must support:

-   retries
-   deduplication
-   delivery status
-   user preferences
-   templates
-   audit history where appropriate

------------------------------------------------------------------------

# 57. Event Model

Avenra should distinguish between:

### Domain Events

Business facts.

Example:

``` text
WorkCompleted
DocumentReceived
ApprovalGranted
ExceptionResolved
```

### Integration Events

External system changes.

Example:

``` text
CRMRecordUpdated
EmailReceived
```

### Technical Events

Infrastructure events.

Example:

``` text
JobFailed
WorkerStarted
```

Do not mix these concepts.

------------------------------------------------------------------------

# 58. Event Guidelines

Events should be:

-   immutable
-   versioned
-   identifiable
-   timestamped
-   traceable
-   tenant-aware

Event payloads should not contain secrets.

------------------------------------------------------------------------

# 59. Audit Logging

Audit logs are mandatory for important business actions.

Record:

``` text
actor
organization
action
resource
timestamp
request_id
source
before
after
reason
```

Audit records should be append-oriented.

Users should not be able to modify audit history through normal product
APIs.

------------------------------------------------------------------------

# 60. Observability

Avenra must be observable from the beginning.

Use OpenTelemetry as the vendor-neutral telemetry foundation for traces,
metrics, and logs. OpenTelemetry explicitly supports correlated
telemetry across systems and is designed to avoid coupling
instrumentation to one observability vendor.
citeturn0search0turn0search8

Every meaningful execution should be traceable across:

``` text
HTTP request
 → application command
 → database operation
 → queue job
 → AI invocation
 → tool call
 → external API
 → verification
```

------------------------------------------------------------------------

# 61. Required Telemetry

Track:

### Logs

-   errors
-   warnings
-   important business events
-   security events

### Metrics

-   request latency
-   error rate
-   queue depth
-   job duration
-   execution success
-   AI latency
-   AI cost
-   verification rate
-   integration failures

### Traces

-   request flows
-   background jobs
-   AI operations
-   integration operations
-   long-running workflows

OpenTelemetry's current specification covers tracing, metrics, logs,
context propagation, and semantic conventions. citeturn0search14

------------------------------------------------------------------------

# 62. Logging Rules

Never log:

-   passwords
-   access tokens
-   API keys
-   raw secrets
-   private credentials
-   unnecessary personal information
-   full sensitive documents

Use structured logs.

Example:

``` json
{
  "level": "INFO",
  "event": "work.completed",
  "organizationId": "...",
  "workId": "...",
  "requestId": "..."
}
```

------------------------------------------------------------------------

# 63. Security Architecture

Security must follow defense in depth.

Layers:

``` text
Identity
 ↓
Authorization
 ↓
Tenant isolation
 ↓
Input validation
 ↓
Business policy
 ↓
Tool permissions
 ↓
Network controls
 ↓
Secrets management
 ↓
Audit
 ↓
Monitoring
```

Agentic applications introduce additional risks beyond conventional web
applications, so Avenra's AI execution layer must explicitly address
agent identity, tool misuse, privilege boundaries, runtime control, and
traceability. OWASP's 2026 agentic guidance and Agent Control Standard
emphasize inspectability, traceability, and runtime control.
citeturn0search1turn0search3

------------------------------------------------------------------------

# 64. Input Validation

Validate at every trust boundary.

Boundaries include:

-   browser → API
-   API → application
-   application → database
-   application → AI
-   AI → tool
-   integration → application
-   uploaded file → parser
-   webhook → application

Never trust external payloads.

------------------------------------------------------------------------

# 65. File Security

Uploaded files must be treated as untrusted.

Controls should include:

-   content-type validation
-   size limits
-   extension checks
-   malware scanning where appropriate
-   isolated processing
-   safe parsing
-   storage isolation
-   access authorization

Do not execute uploaded files.

------------------------------------------------------------------------

# 66. Webhook Security

Webhook endpoints must support:

-   signature validation
-   timestamp/replay protection
-   idempotency
-   rate limiting
-   payload validation
-   event authorization

Never trust a webhook merely because it comes from a known URL.

------------------------------------------------------------------------

# 67. Rate Limiting

Rate-limit:

-   authentication
-   password reset
-   public endpoints
-   expensive AI operations
-   integration endpoints
-   file uploads
-   webhook endpoints
-   administrative operations

Limits should be tenant-aware where appropriate.

------------------------------------------------------------------------

# 68. Secrets Management

Development secrets may use environment variables.

Production secrets must use a dedicated secret-management solution.

Never commit:

``` text
.env
private keys
API tokens
OAuth secrets
database passwords
```

to Git.

Provide:

``` text
.env.example
```

containing placeholders only.

------------------------------------------------------------------------

# 69. Encryption

Use TLS for network communication.

Sensitive stored data should use encryption at rest through
infrastructure/database/storage capabilities.

Particularly sensitive integration credentials should have
application-level encryption where appropriate.

Encryption keys must not be stored alongside the encrypted secrets.

------------------------------------------------------------------------

# 70. Backups and Recovery

Production must have:

-   automated database backups
-   backup retention
-   recovery testing
-   object-storage durability strategy
-   documented recovery procedures

A backup that has never been restored is not proven.

Test restoration periodically.

------------------------------------------------------------------------

# 71. API Security

All protected APIs require authentication.

Additional controls:

-   authorization
-   input validation
-   rate limits
-   audit
-   secure headers
-   CORS policy
-   CSRF protection where applicable
-   request size limits
-   timeout limits

------------------------------------------------------------------------

# 72. Frontend Security

Frontend rules:

-   never store sensitive tokens unnecessarily
-   do not expose secrets in client bundles
-   validate user-controlled content
-   escape/render untrusted content safely
-   use secure cookie settings where cookies are used
-   enforce authorization on the backend
-   avoid dangerous HTML injection
-   never trust route parameters for authorization

------------------------------------------------------------------------

# 73. Testing Strategy

Testing is not a final phase.

It is continuous.

Testing layers:

``` text
Unit
 ↓
Integration
 ↓
Contract
 ↓
End-to-End
 ↓
Security
 ↓
Performance
 ↓
AI Evaluation
```

------------------------------------------------------------------------

# 74. Unit Tests

Unit tests cover:

-   domain rules
-   state transitions
-   validation
-   permission decisions
-   business calculations
-   deterministic AI preprocessing
-   utility logic

Do not create meaningless tests that simply increase coverage numbers.

------------------------------------------------------------------------

# 75. Integration Tests

Integration tests cover:

-   database behavior
-   repositories
-   queues
-   object storage
-   external integration adapters
-   authentication
-   authorization
-   transaction behavior

Use Testcontainers where appropriate.

------------------------------------------------------------------------

# 76. API Contract Tests

API contracts should verify:

-   request schema
-   response schema
-   authorization
-   error formats
-   version compatibility

Contracts prevent frontend/backend drift.

------------------------------------------------------------------------

# 77. End-to-End Tests

Critical user journeys must be tested.

Example:

``` text
Create organization
→ invite member
→ create client
→ create project
→ create work
→ define requirements
→ collect information
→ verify information
→ approve
→ execute
→ verify
→ complete
```

This is the core Avenra journey.

------------------------------------------------------------------------

# 78. Security Testing

Security testing should include:

-   dependency scanning
-   secret scanning
-   static analysis
-   API authorization testing
-   tenant-isolation testing
-   injection testing
-   authentication testing
-   file-upload testing
-   webhook testing
-   AI prompt-injection testing
-   tool-permission testing

Agentic security must be treated as a lifecycle concern covering design,
development, deployment, and runtime operations.
citeturn0search2turn0search37

------------------------------------------------------------------------

# 79. AI Security Testing

Test for:

-   prompt injection
-   indirect prompt injection
-   tool misuse
-   privilege escalation
-   malicious documents
-   malicious emails
-   data exfiltration
-   memory poisoning
-   unauthorized actions
-   hallucinated actions
-   unsafe retries
-   cascading failures

The AI layer must fail safely.

------------------------------------------------------------------------

# 80. Performance Testing

Test:

-   API latency
-   database performance
-   queue throughput
-   concurrent users
-   document processing
-   AI latency
-   integration latency
-   long-running workflows

Performance targets should be based on actual product requirements.

Do not optimize prematurely.

------------------------------------------------------------------------

# 81. Coding Standards

## General

Code must be:

-   readable
-   typed
-   modular
-   testable
-   documented where necessary
-   free of unnecessary duplication

Avoid clever code.

Prefer boring code that is easy to maintain.

------------------------------------------------------------------------

# 82. Java Rules

Use:

-   immutable DTOs where appropriate
-   clear service boundaries
-   constructor injection
-   explicit transactions
-   domain-focused methods
-   validation at boundaries
-   meaningful exceptions

Avoid:

-   field injection
-   giant services
-   giant controllers
-   business logic in controllers
-   static global state
-   excessive inheritance
-   unnecessary abstractions

Prefer composition.

------------------------------------------------------------------------

# 83. TypeScript Rules

Use strict TypeScript.

Avoid:

``` typescript
any
```

unless there is a documented reason.

Prefer:

``` typescript
unknown
```

with validation.

Types should describe business contracts rather than merely mirror
implementation details.

------------------------------------------------------------------------

# 84. Python Rules

Use:

-   type hints
-   isolated virtual environments
-   linting
-   formatting
-   tests
-   explicit dependency versions

AI code must remain understandable by the engineering team.

------------------------------------------------------------------------

# 85. API Naming

Use predictable names.

Prefer:

``` text
POST /work
GET /work/{id}
PATCH /work/{id}
```

rather than inconsistent alternatives such as:

``` text
/createWork
/getWorkData
/updateWorkInformation
```

------------------------------------------------------------------------

# 86. Git Rules

Use Git for all source code.

Branch strategy:

``` text
main
develop
feature/*
fix/*
chore/*
security/*
```

For a small team, a simplified trunk-based strategy may eventually
replace `develop`.

Every merge should pass:

-   build
-   tests
-   lint
-   security checks

------------------------------------------------------------------------

# 87. Commit Rules

Commits should describe intent.

Examples:

``` text
feat(work): add work state transitions
fix(auth): prevent cross-tenant access
feat(ai): add structured requirement extraction
test(execution): add retry idempotency coverage
chore(ci): add dependency scanning
```

Avoid:

``` text
update
fix stuff
changes
final
new
```

------------------------------------------------------------------------

# 88. Pull Request Rules

Every substantial change should explain:

-   problem
-   solution
-   architectural impact
-   security impact
-   tests
-   migration requirements
-   deployment requirements

Large changes should be split when possible.

------------------------------------------------------------------------

# 89. Architecture Decision Records

Important architecture choices must be recorded in:

``` text
docs/adr/
```

Each ADR should contain:

``` text
Context
Decision
Alternatives
Consequences
Status
```

Examples:

``` text
ADR-001 Modular Monolith
ADR-002 PostgreSQL
ADR-003 AI Provider Abstraction
ADR-004 Central Agent Orchestrator
ADR-005 Multi-Tenant Model
```

------------------------------------------------------------------------

# 90. Environment Strategy

Use at least:

``` text
local
development
staging
production
```

### Local

For developer work.

### Development

Shared development environment.

### Staging

Production-like testing.

### Production

Customer traffic.

Never test experimental destructive changes directly in production.

------------------------------------------------------------------------

# 91. Configuration

Configuration must be environment-specific.

Never hard-code:

-   URLs
-   credentials
-   API keys
-   database passwords
-   model keys
-   environment-specific identifiers

Use configuration management.

------------------------------------------------------------------------

# 92. CI/CD

Every pull request should run:

``` text
Checkout
 ↓
Dependency installation
 ↓
Lint
 ↓
Type checks
 ↓
Unit tests
 ↓
Integration tests
 ↓
Security scans
 ↓
Build
```

Merges to the deployment branch should trigger deployment to the
appropriate environment.

Production deployment should have controlled approval.

------------------------------------------------------------------------

# 93. Containerization

Production services should be containerized.

Containers should:

-   run as non-root where possible
-   use minimal base images
-   pin important dependencies
-   expose only required ports
-   have health checks
-   avoid storing persistent business data locally

------------------------------------------------------------------------

# 94. Health Checks

Services should expose:

``` text
/health
```

and preferably distinguish:

``` text
liveness
readiness
```

A service can be alive but not ready to receive traffic.

------------------------------------------------------------------------

# 95. Deployment Architecture

Initial deployment may use managed cloud infrastructure.

Conceptually:

``` text
CDN / Edge
     ↓
Frontend
     ↓
API
     ↓
Workers
     ↓
PostgreSQL
Redis
Object Storage
AI Providers
External Integrations
Observability
```

The infrastructure should be portable enough to avoid unnecessary vendor
lock-in.

------------------------------------------------------------------------

# 96. Infrastructure as Code

Infrastructure should eventually be defined through IaC.

Recommended:

**Terraform**

Infrastructure should include:

-   networking
-   databases
-   storage
-   queues
-   secrets
-   compute
-   monitoring
-   DNS
-   environments

Do not make production infrastructure dependent on one person's terminal
history.

------------------------------------------------------------------------

# 97. Database Deployment Rules

Before database migrations reach production:

1.  run locally
2.  run in CI
3.  run in staging
4.  verify rollback/recovery strategy
5.  inspect performance impact
6.  deploy with monitoring

Large migrations must be designed for zero or minimal downtime.

------------------------------------------------------------------------

# 98. Feature Flags

Use feature flags for:

-   experimental workflows
-   AI capabilities
-   risky integrations
-   gradual rollouts
-   customer-specific beta features

Feature flags must have ownership and removal plans.

Do not create permanent flag pollution.

------------------------------------------------------------------------

# 99. Dependency Management

Dependencies must be:

-   justified
-   maintained
-   security-monitored
-   version-controlled

Avoid adding libraries for trivial functionality.

Before adding a dependency ask:

1.  Do we actually need it?
2.  Can the existing stack solve it?
3.  Is it maintained?
4.  What is its security history?
5.  Does it create lock-in?
6.  Does it increase bundle or runtime cost?

------------------------------------------------------------------------

# 100. Documentation Rules

Every major subsystem must document:

-   purpose
-   responsibilities
-   inputs
-   outputs
-   dependencies
-   security considerations
-   failure modes
-   operational considerations

Documentation belongs close to the code and in:

``` text
docs/
```

when it describes system-level behavior.

------------------------------------------------------------------------

# 101. Observability Naming

Telemetry names must be consistent.

Examples:

``` text
avenra.work.created
avenra.work.completed
avenra.execution.started
avenra.execution.failed
avenra.ai.request
avenra.integration.request
avenra.verification.completed
```

Telemetry must contain enough context to diagnose failures without
leaking sensitive data.

------------------------------------------------------------------------

# 102. Reliability Principles

Every external dependency can fail.

Design for:

-   timeouts
-   retries
-   exponential backoff
-   circuit breaking where appropriate
-   idempotency
-   dead-letter handling
-   partial failure
-   graceful degradation

Never retry blindly.

Retries can create duplicate side effects.

------------------------------------------------------------------------

# 103. Retry Policy

Retries should distinguish:

### Retryable

-   temporary network failure
-   rate limit
-   temporary provider outage

### Non-retryable

-   invalid credentials
-   invalid request
-   authorization failure
-   permanent validation error

### Human-required

-   ambiguous information
-   approval required
-   policy violation

------------------------------------------------------------------------

# 104. Long-Running Workflows

Long-running workflows must not depend on a single HTTP request.

Use persisted workflow state.

Example:

``` text
Work
 ↓
Step 1 complete
 ↓
Waiting for client
 ↓
Reminder scheduled
 ↓
Response received
 ↓
Verification
 ↓
Approval
 ↓
Execution
 ↓
Completion
```

The system must survive:

-   process restarts
-   worker crashes
-   deployments
-   network failures

------------------------------------------------------------------------

# 105. Scheduling

Scheduled work may include:

-   reminders
-   recurring information collection
-   periodic verification
-   report generation
-   integration synchronization

Schedules must be persisted.

Never depend on in-memory timers for business-critical schedules.

------------------------------------------------------------------------

# 106. Notifications and Human Tasks

When a human must act, the system should create an explicit human task.

A human task should contain:

-   context
-   required action
-   reason
-   deadline
-   evidence
-   available choices

Do not simply send:

> "Something needs attention."

Tell the user exactly what is needed.

------------------------------------------------------------------------

# 107. UX Rules for Execution

The UI must expose execution state clearly.

Every work item should communicate:

``` text
Status
Progress
Current step
Blocked reason
Next action
Owner
Deadline
Evidence
Approval requirement
```

A user should never need to inspect logs to understand normal business
progress.

------------------------------------------------------------------------

# 108. UX Rules for AI

When AI is involved, the interface should make clear:

-   what AI proposed
-   what was verified
-   what was executed
-   what remains uncertain
-   what requires approval

Do not present AI guesses as deterministic facts.

------------------------------------------------------------------------

# 109. Audit UX

Authorized users should be able to inspect:

``` text
Timeline
Actor
Action
Reason
Evidence
Result
```

For sensitive workflows, the audit trail is part of the product.

------------------------------------------------------------------------

# 110. Billing Architecture

Billing must be separated from core business logic.

Track:

``` text
Subscription
Plan
Usage
Entitlement
Invoice reference
Payment state
```

Do not scatter pricing logic throughout the application.

Use an internal entitlement layer.

------------------------------------------------------------------------

# 111. Usage Metering

Potential usage dimensions:

-   active users
-   workflows
-   executions
-   documents processed
-   AI usage
-   integrations
-   storage
-   automation volume

Usage records must be immutable or append-oriented.

Billing calculations should be reproducible.

------------------------------------------------------------------------

# 112. Analytics

Product analytics should measure:

-   activation
-   workflow creation
-   workflow completion
-   human intervention
-   time to completion
-   failed executions
-   information collection
-   verification
-   retention

Analytics must respect privacy and customer data boundaries.

------------------------------------------------------------------------

# 113. Data Retention

Different data classes may require different retention.

Define policies for:

-   audit events
-   documents
-   logs
-   AI traces
-   user data
-   deleted accounts
-   integration records

Deletion must be deliberate.

Do not retain sensitive data forever simply because storage is cheap.

------------------------------------------------------------------------

# 114. Privacy by Design

Collect only what the product needs.

Principles:

-   least data
-   least privilege
-   clear purpose
-   controlled retention
-   access transparency
-   deletion capability
-   auditability

Privacy requirements must be reviewed as Avenra expands into different
markets.

------------------------------------------------------------------------

# 115. Disaster Recovery

Define:

``` text
RPO
RTO
Backup frequency
Restore procedure
Incident owner
Communication process
```

The exact targets should evolve with customer requirements.

------------------------------------------------------------------------

# 116. Incident Management

Security or reliability incidents require:

1.  Detection
2.  Containment
3.  Investigation
4.  Mitigation
5.  Recovery
6.  Communication
7.  Root-cause analysis
8.  Preventive action

Maintain incident records.

------------------------------------------------------------------------

# 117. Production Access

Production access must be limited.

Prefer:

-   individual accounts
-   MFA
-   least privilege
-   temporary elevated access
-   audit logs

Never share production credentials between developers.

------------------------------------------------------------------------

# 118. Development Workflow

Recommended sequence:

``` text
Understand requirement
        ↓
Define domain behavior
        ↓
Define API contract
        ↓
Define data changes
        ↓
Implement backend
        ↓
Implement tests
        ↓
Implement frontend
        ↓
Integrate
        ↓
Observe
        ↓
Review
        ↓
Merge
```

Do not begin by blindly generating hundreds of files with an AI coding
agent.

------------------------------------------------------------------------

# 119. AI Coding Assistant Rules

AI coding assistants may be used aggressively.

However, generated code must:

-   follow architecture
-   pass tests
-   pass lint
-   follow security rules
-   avoid duplicated abstractions
-   avoid invented dependencies
-   preserve tenant isolation
-   include appropriate error handling
-   include tests for important behavior

The engineer remains responsible for generated code.

------------------------------------------------------------------------

# 120. No "Magic" Architecture

Do not allow AI-generated systems to introduce:

-   unexplained global state
-   hidden background jobs
-   undocumented database tables
-   arbitrary agent tools
-   uncontrolled retries
-   provider-specific business logic
-   insecure shortcuts

Every major architectural decision must be understandable by a human
engineer.

------------------------------------------------------------------------

# 121. Implementation Order

The platform should be built in controlled phases.

## Phase 1 --- Foundation

Build:

-   repository
-   development environments
-   CI
-   frontend shell
-   backend shell
-   database
-   migrations
-   configuration
-   logging
-   health checks
-   basic observability

------------------------------------------------------------------------

## Phase 2 --- Identity

Build:

-   users
-   authentication
-   organizations
-   memberships
-   roles
-   permissions
-   tenant isolation

------------------------------------------------------------------------

## Phase 3 --- Core Business Objects

Build:

-   clients
-   projects
-   work
-   tasks
-   requirements
-   information
-   documents

------------------------------------------------------------------------

## Phase 4 --- Work Execution

Build:

-   state machines
-   execution records
-   background jobs
-   retries
-   scheduling
-   human tasks
-   exceptions

------------------------------------------------------------------------

## Phase 5 --- Verification

Build:

-   verification rules
-   evidence
-   confidence
-   validation
-   verification workflows
-   completion criteria

------------------------------------------------------------------------

## Phase 6 --- AI Foundation

Build:

-   AI provider abstraction
-   structured outputs
-   prompt management
-   AI invocation records
-   AI evaluation
-   retrieval foundations
-   controlled tool calling

------------------------------------------------------------------------

## Phase 7 --- Agent Execution

Build:

-   orchestrator
-   planning
-   tool gateway
-   tool permissions
-   approval gates
-   execution tracing
-   failure handling

------------------------------------------------------------------------

## Phase 8 --- Integrations

Build initial integrations around the actual wedge.

Potential categories:

-   email
-   cloud storage
-   CRM
-   calendar
-   project management

Do not build dozens of integrations before customer evidence.

------------------------------------------------------------------------

## Phase 9 --- Notifications

Build:

-   email
-   in-app notifications
-   reminders
-   escalation
-   notification preferences

------------------------------------------------------------------------

## Phase 10 --- Audit and Administration

Build:

-   audit history
-   organization settings
-   permissions administration
-   integration administration
-   usage
-   system health

------------------------------------------------------------------------

## Phase 11 --- Billing

Build:

-   plans
-   entitlements
-   metering
-   subscription state
-   billing integration

------------------------------------------------------------------------

## Phase 12 --- Analytics

Build:

-   operational analytics
-   workflow metrics
-   customer analytics
-   usage analytics

------------------------------------------------------------------------

## Phase 13 --- Production Hardening

Complete:

-   security testing
-   load testing
-   backup recovery
-   observability
-   alerting
-   incident procedures
-   deployment automation
-   documentation

------------------------------------------------------------------------

# 122. 85% Technical Completion Definition

The platform reaches the intended 85% engineering milestone when the
following are substantially functional:

``` text
Identity                  ██████████
Multi-tenancy             ██████████
Authorization             ██████████
Core business model       ██████████
Work management           ██████████
Information management    ██████████
Verification              ██████████
Execution engine          ██████████
Human approval            ██████████
AI foundation             ██████████
Agent/tool control        ██████████
Initial integrations      ██████████
Notifications             ██████████
Auditability              ██████████
Security foundation       ██████████
Observability             ██████████
Testing                   ██████████
Deployment                ██████████
Administration            ██████████
Billing foundation        ██████████
Analytics foundation     ██████████
```

The remaining 15% is expected to be shaped heavily by real customers.

------------------------------------------------------------------------

# 123. Definition of Done

A feature is not complete because the code compiles.

A feature is done when:

-   requirements are clear
-   API is defined
-   authorization exists
-   tenant isolation is verified
-   validation exists
-   business rules are implemented
-   tests exist
-   errors are handled
-   audit requirements are implemented
-   observability exists
-   security implications are reviewed
-   documentation is updated
-   deployment works

------------------------------------------------------------------------

# 124. Definition of Production Ready

Avenra is production-ready for a capability when:

``` text
Functionality
+
Security
+
Testing
+
Observability
+
Failure handling
+
Documentation
+
Recovery
```

are all acceptable.

------------------------------------------------------------------------

# 125. Architecture Anti-Patterns

Avoid:

### Giant Service

One service containing the entire business.

### Giant Controller

Controllers containing business logic.

### AI Everywhere

Calling an LLM for deterministic problems.

### Database as API

Exposing database structures directly.

### Shared Tenant Cache

Cache keys without tenant isolation.

### Uncontrolled Agent

Model can execute arbitrary actions.

### Synchronous Everything

Long workflows inside HTTP requests.

### Microservice Theater

Multiple services without a real scaling or ownership reason.

### Copy-Paste Integrations

Each integration implementing its own completely different execution
model.

### Hidden State

Important workflow state stored only inside queues, prompts, or frontend
state.

------------------------------------------------------------------------

# 126. When to Split a Service

A module should become a separate service only when at least one strong
reason exists:

-   independent scaling
-   independent deployment
-   security isolation
-   different runtime requirements
-   operational ownership
-   failure isolation
-   substantial resource consumption

Do not split simply because the codebase is large.

------------------------------------------------------------------------

# 127. Future Service Candidates

If Avenra reaches sufficient scale, likely extraction candidates
include:

``` text
AI Service
Document Processing Service
Execution Worker Service
Integration Service
Notification Service
Analytics Service
Billing Service
```

The core business API may remain centralized longer.

------------------------------------------------------------------------

# 128. Data Ownership

Each module owns its business data.

Examples:

``` text
Identity → users/memberships
Work → work/tasks
Information → information/requirements
Verification → verification/evidence
Execution → execution records
Integration → connections
Billing → subscriptions/usage
```

Other modules should interact through contracts.

------------------------------------------------------------------------

# 129. Security Boundary for AI

The AI system must be considered an untrusted decision component.

Even if the model is highly capable:

``` text
Model output
≠
Authorized action
```

The authorization system must independently determine whether the
proposed action is allowed.

This separation is mandatory.

------------------------------------------------------------------------

# 130. Agent Runtime Control

Every agent execution should have:

``` text
agent_id
organization_id
user_context
work_id
allowed_tools
allowed_resources
policy
budget
timeout
trace_id
```

The runtime must be able to terminate an execution.

Avenra should never depend on an agent eventually stopping on its own.

------------------------------------------------------------------------

# 131. Agent Budgets

Each workflow may have:

-   maximum execution time
-   maximum model calls
-   maximum tool calls
-   maximum retries
-   maximum cost
-   maximum external side effects

If the budget is exceeded:

``` text
STOP
→ record reason
→ create exception
→ request human intervention
```

------------------------------------------------------------------------

# 132. Approval Gates

Approval should be required when:

-   action is high-risk
-   policy says approval is required
-   AI confidence is insufficient
-   information is inconsistent
-   action is irreversible
-   customer policy requires human authorization

Approval gates must be explicit in the workflow state.

------------------------------------------------------------------------

# 133. Verification After Execution

Never assume:

``` text
API returned 200
=
Business outcome achieved
```

Where possible:

``` text
Execute
 ↓
Read resulting state
 ↓
Compare expected state
 ↓
Verify
 ↓
Complete
```

This is one of Avenra's core differentiators.

------------------------------------------------------------------------

# 134. Business State vs Technical State

Keep these separate.

Technical:

``` text
HTTP 200
job succeeded
API call completed
```

Business:

``` text
client record updated
required document received
project requirement satisfied
approval completed
work completed
```

Avenra is ultimately responsible for business state.

------------------------------------------------------------------------

# 135. Integration Failure Philosophy

If an external system fails:

Do not hide the failure.

Show:

``` text
What failed
Why
What was attempted
Whether anything changed
What will happen next
Whether retry is safe
```

This is critical for trust.

------------------------------------------------------------------------

# 136. Data Provenance

Whenever information enters Avenra, attempt to record:

``` text
source
source_type
source_id
retrieved_at
extracted_by
verified_by
confidence
```

This makes AI-assisted execution more trustworthy.

------------------------------------------------------------------------

# 137. Testing Tenant Isolation

Create automated tests proving:

``` text
Tenant A cannot read Tenant B
Tenant A cannot modify Tenant B
Tenant A cannot retrieve Tenant B's files
Tenant A cannot use Tenant B's integrations
Tenant A cannot see Tenant B's analytics
Tenant A cannot access Tenant B's audit events
```

These tests are mandatory.

------------------------------------------------------------------------

# 138. Testing Agent Permissions

For every high-risk tool, test:

``` text
authorized → allowed
unauthorized → denied
wrong tenant → denied
wrong resource → denied
missing approval → denied
expired authorization → denied
```

------------------------------------------------------------------------

# 139. Testing Workflow Recovery

Test:

-   worker crash
-   API restart
-   database connection loss
-   queue duplication
-   integration timeout
-   AI provider timeout
-   user abandonment
-   deployment during workflow

The workflow must recover without silently losing state.

------------------------------------------------------------------------

# 140. Product-Level Testing

The most important tests should simulate real business outcomes.

Example:

``` text
Client requires 5 documents
        ↓
2 already exist
        ↓
3 missing
        ↓
Avenra requests 3
        ↓
Client sends 2
        ↓
One document invalid
        ↓
Avenra identifies issue
        ↓
Requests correction
        ↓
Correct document received
        ↓
All 5 verified
        ↓
Approval required
        ↓
Human approves
        ↓
External system updated
        ↓
Result verified
        ↓
Work completed
```

This scenario should eventually become a flagship end-to-end test.

------------------------------------------------------------------------

# 141. Development Milestones

## Milestone A

A user can:

-   create an organization
-   invite a user
-   create a client
-   create a project
-   create work

## Milestone B

A user can:

-   define requirements
-   upload information
-   track missing information
-   verify information

## Milestone C

Avenra can:

-   execute background work
-   create human tasks
-   request approval
-   record execution

## Milestone D

Avenra can:

-   use AI for structured reasoning
-   call controlled tools
-   enforce permissions
-   record AI decisions

## Milestone E

Avenra can:

-   connect external systems
-   execute actions
-   verify outcomes

## Milestone F

Avenra can:

-   operate securely
-   monitor itself
-   recover from failures
-   support real customers

------------------------------------------------------------------------

# 142. Documentation Deliverables

The project should eventually contain:

``` text
README.md
ARCHITECTURE.md
SECURITY.md
CONTRIBUTING.md

docs/
├── architecture/
│   ├── system-overview.md
│   ├── domain-model.md
│   ├── execution-engine.md
│   ├── ai-architecture.md
│   └── integration-architecture.md
│
├── security/
│   ├── threat-model.md
│   ├── authentication.md
│   ├── authorization.md
│   └── ai-security.md
│
├── api/
│   └── api-guidelines.md
│
└── adr/
    ├── ADR-001-modular-monolith.md
    ├── ADR-002-postgresql.md
    └── ...
```

------------------------------------------------------------------------

# 143. Engineering Golden Rules

1.  **The backend is the source of truth.**
2.  **The database is the business system of record.**
3.  **The frontend never provides security.**
4.  **Every tenant boundary is enforced server-side.**
5.  **AI output is not automatically truth.**
6.  **AI cannot bypass authorization.**
7.  **External content is untrusted.**
8.  **High-risk actions require stronger controls.**
9.  **Every important side effect is auditable.**
10. **Every important external action must be idempotent.**
11. **Long-running work is asynchronous.**
12. **Business state must survive restarts.**
13. **Evidence matters.**
14. **Verification matters.**
15. **Human intervention is a valid state.**
16. **Do not build microservices without a reason.**
17. **Do not add dependencies without a reason.**
18. **Do not use AI where deterministic code is better.**
19. **Do not sacrifice security for speed.**
20. **Do not sacrifice maintainability for AI-generated code volume.**
21. **Measure completed work, not lines of code.**
22. **Build the platform, not a demo.**
23. **Prefer explicit behavior over magic.**
24. **Every architectural shortcut must have a documented reason.**
25. **The system must be explainable to its engineers and customers.**

------------------------------------------------------------------------

# 144. Final Technical Architecture

The target architecture can be summarized as:

``` text
                         AVENRA
                           │
              ┌────────────┴────────────┐
              │                         │
          Next.js                    API Gateway
          Web App                       │
                                        ▼
                              Spring Boot Backend
                                        │
        ┌───────────────┬───────────────┼────────────────┐
        │               │               │                │
     Identity          Work         Information       Execution
        │               │               │                │
        └───────────────┴───────┬───────┴────────────────┘
                                │
                         Domain Services
                                │
                    ┌───────────┴───────────┐
                    │                       │
                PostgreSQL               Redis/Jobs
                    │                       │
                    │                  Background Workers
                    │                       │
                    │              ┌────────┼────────┐
                    │              │        │        │
                    │             AI    Integrations Storage
                    │              │        │        │
                    └──────────────┴────────┴────────┘
                                │
                         Verification
                                │
                         Human Approval
                                │
                          Audit / Evidence
                                │
                         Observability
```

------------------------------------------------------------------------

# 144. Visual Design System

The implementation must use the approved Avenra visual system. This section
is the engineering source of truth for applying the brand palette in the UI.
The Master Project defines the brand direction; these tokens define how it is
implemented.

## 144.1 Neutral-First Color Philosophy

Avenra is intentionally **predominantly neutral**. The application should
feel black, white, and gray before it feels blue. Color is used to communicate
hierarchy, interaction, state, and identity rather than decoration.

Target visual balance:

- **~85% Neutral:** white, off-white, obsidian, gray, and borders
- **~10% Avenra Blue:** primary actions, active states, links, progress,
  selected states, and important interactive elements
- **~5% Status colors:** success, warning, and error states when meaningful

These percentages are design guidance, not a mathematical requirement for
every screen. A screen may legitimately use more or less blue when its
workflow requires it, but the overall product must remain restrained.

## 144.2 Approved Color Tokens

| Token | Hex | Purpose |
|---|---|---|
| `--color-background` | `#FFFFFF` | Main application background and clean surfaces |
| `--color-text-primary` | `#0B0D0F` | Headings, primary text, strong navigation |
| `--color-text-secondary` | `#667085` | Metadata, descriptions, secondary text |
| `--color-brand` | `#2563EB` | Primary actions, links, active/selected states, progress |
| `--color-brand-surface` | `#EFF6FF` | Subtle blue-tinted action/selection/AI surfaces |
| `--color-border` | `#E5E7EB` | Borders, dividers, input boundaries |
| `--color-success` | `#16A34A` | Verified, completed, successful states |
| `--color-warning` | `#D97706` | Attention, pending review, non-blocking risk |
| `--color-error` | `#DC2626` | Failed, blocked, destructive/error states |

Do not introduce arbitrary brand colors in individual components. If a new
semantic color is genuinely required, add it to the design system first.

## 144.3 Color Application Rules

1. **Neutral first.** White, gray, and obsidian should form the majority of
   every normal application screen.
2. **Blue is intentional.** Use Avenra Blue when something is interactive,
   active, selected, actionable, or meaningfully highlighted.
3. **Do not make every component blue.** A blue button should sit inside a
   mostly neutral interface.
4. **Status colors have meaning.** Green, amber, and red communicate actual
   operational states; they are never decorative accents.
5. **No neon UI.** Do not use neon blue, glowing borders, cyberpunk effects,
   or excessive gradients.
6. **Hierarchy comes from typography and spacing first.** Color should support
   hierarchy rather than replace it.
7. **Marketing may be more expressive.** The public website can use more blue
   than the application, but must preserve the same identity.

## 144.4 Logo, Wordmark, and Favicon

The **standalone symbol is the Avenra logo**. `Avenra` is the wordmark. The
full symbol + wordmark combination is the primary brand lockup. The tagline
is optional supporting copy and is not part of the logo.

Approved usage:

- Logo symbol: Avenra Blue `#2563EB`
- Wordmark: Obsidian `#0B0D0F`
- Tagline: Slate `#667085`
- Favicon/app icon: **symbol only**, no text
- Favicon/app icon container: compact square treatment with strong contrast

The favicon must remain recognizable at very small sizes. Never place the
full `Avenra` wordmark or tagline inside the favicon.

## 144.5 Typography

Primary UI typeface: **Inter**.

Typography, whitespace, spacing, borders, and surface hierarchy should carry
most of the visual design.

## 144.6 Design Reference

The intended character is:

> **Apple's restraint + Linear's precision + enterprise software's seriousness
> + Avenra's blue identity.**

Avenra should look mature, calm, precise, and trustworthy—not like a generic
AI dashboard.

------------------------------------------------------------------------

# 145. Final Engineering Objective

The objective is not merely to create a technically impressive
application.

The objective is to create a reliable execution platform that can
eventually handle real business work.

The engineering system must therefore optimize for:

``` text
Correctness
+
Security
+
Reliability
+
Observability
+
Explainability
+
Maintainability
+
Speed
```

in that order when trade-offs involve safety or customer trust.

------------------------------------------------------------------------

# 146. Final Implementation Rule

Before implementing any major subsystem, ask:

> **"Does this architecture help Avenra reliably move business work from
> intent to verified completion?"**

If yes, build it.

If not, question it.

The technical architecture exists to serve the product's central
purpose:

> **From Intent to Completed Work.**
