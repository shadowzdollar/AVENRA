# Security

Security is a core product requirement for Avenra, not an add-on (Master
Project §28). The engineering rules are in Guidelines §63–§72 and §129–§138.

## Reporting a vulnerability

Do not open a public issue. Report privately to the repository owner through
GitHub's private vulnerability reporting for this repository. Include the
affected component, steps to reproduce and impact. A dedicated security
contact will be published before the first customer pilot.

## Rules for contributors

- Never commit secrets. `.env` is ignored; `.env.example` holds placeholders
  only. CI runs secret scanning.
- Cross-tenant data access is a critical vulnerability. Every tenant-owned
  resource has automated isolation tests.
- Never log passwords, tokens, API keys or full sensitive documents.
- Treat uploaded files, emails, webhooks, integration payloads and AI output
  as untrusted input.
