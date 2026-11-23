import type { Icons } from '@/components/icons';

type IconName = keyof typeof Icons;

export interface SolutionData {
  slug: string;
  title: string;
  shortTitle: string;
  pill: string;
  headline: string;
  description: string;
  icon: IconName;
  metrics: { label: string; value: string; detail: string }[];
  workflow: { step: string; title: string; description: string; icon: IconName }[];
  rules: { title: string; description: string }[];
  deliverables: string[];
}

export const SOLUTIONS: Record<string, SolutionData> = {
  'accounting-tax': {
    slug: 'accounting-tax',
    title: 'Accounting & Tax',
    shortTitle: 'Accounting & tax',
    pill: 'Solutions · Accounting & Tax',
    headline: 'Close books and tax returns without chasing missing schedules',
    description:
      'Turn year-end packs, quarterly VAT returns, and monthly reconciliations into structured engagements. Clients upload through magic links while Avenra validates every document against your firm rules.',
    icon: 'calculator',
    metrics: [
      {
        label: 'INTAKE TURNAROUND',
        value: '3.2x',
        detail: 'Faster document collection from clients with automated, context-aware reminders.'
      },
      {
        label: 'RULE AUTO-PASS',
        value: '94%',
        detail: 'Routine schedules, trial balances, and bank statements verified without manual checks.'
      },
      {
        label: 'AUDIT TRAIL',
        value: '100%',
        detail: 'Every uploaded file hashed with SHA-256 and linked directly to its work requirement.'
      }
    ],
    workflow: [
      {
        step: '01',
        title: 'Launch engagement checklist',
        description:
          'Select a tax or month-end template with pre-configured document requirements, due dates, and deterministic validation rules.',
        icon: 'listCheck'
      },
      {
        step: '02',
        title: 'Dispatch passwordless client link',
        description:
          'Clients receive a single-purpose, expiring portal link to upload bank statements, payroll summaries, and receipts—no login friction.',
        icon: 'send'
      },
      {
        step: '03',
        title: 'OCR extraction & rule checks',
        description:
          'ClamAV scans every upload, OCR extracts dates and totals, and deterministic rules verify period coverage and completeness.',
        icon: 'sparkles'
      },
      {
        step: '04',
        title: 'Exception triage & sign-off',
        description:
          'Missing periods or mismatched totals route straight to the Exception Queue for reviewer resolution with a recorded decision.',
        icon: 'circleCheck'
      }
    ],
    rules: [
      {
        title: 'Period coverage check',
        description: 'Ensures uploaded bank and payroll statements cover all 12 months of the fiscal year.'
      },
      {
        title: 'File format & malware gate',
        description: 'Enforces PDF/CSV/XLSX types and scans every upload through ClamAV before vaulting.'
      },
      {
        title: 'Reconciliation variance threshold',
        description: 'Flags trial balance or ledger discrepancies above your firm materiality threshold.'
      },
      {
        title: 'Mandatory sign-off authority',
        description: 'Requires explicit manager permission before marking a return ready for filing.'
      }
    ],
    deliverables: [
      'Year-end financial statement packs',
      'Corporate & partnership tax returns',
      'Monthly & quarterly bookkeeping close',
      'Sales tax & VAT filings',
      'Payroll & 1099 / W-2 reconciliations',
      'Multi-entity consolidation schedules'
    ]
  },
  'audit-assurance': {
    slug: 'audit-assurance',
    title: 'Audit & Assurance',
    shortTitle: 'Audit & assurance',
    pill: 'Solutions · Audit & Assurance',
    headline: 'Prepared-by-client evidence requests with an immutable trail',
    description:
      'Replace sprawling PBC spreadsheets with verifiable evidence workflows. Track every sample request, reviewer sign-off, and exception override in a cryptographically hashed vault.',
    icon: 'clipboardCheck',
    metrics: [
      {
        label: 'PBC VISIBILITY',
        value: 'Real-time',
        detail: 'Instant status across open, submitted, excepted, and verified evidence items.'
      },
      {
        label: 'IMMUTABILITY',
        value: 'SHA-256',
        detail: 'Every evidence artifact and reviewer decision is cryptographically fingerprinted.'
      },
      {
        label: 'REVIEW OVERHEAD',
        value: '-65%',
        detail: 'Less partner time spent verifying completeness before substantive testing begins.'
      }
    ],
    workflow: [
      {
        step: '01',
        title: 'Structure PBC request list',
        description:
          'Organize audit sections, sampling requests, and control evidence with explicit ownership and deadlines.',
        icon: 'clipboardCheck'
      },
      {
        step: '02',
        title: 'Collect directly from process owners',
        description:
          'Route individual evidence links to finance, IT, or HR owners so each stakeholder sees only what they owe.',
        icon: 'lock'
      },
      {
        step: '03',
        title: 'Automated evidence verification',
        description:
          'Verify document dates, population completeness, and required metadata before an auditor opens the file.',
        icon: 'fingerprint'
      },
      {
        step: '04',
        title: 'Export signed completion manifest',
        description:
          'Export a full, timestamped evidence package and audit log directly to S3 or your workpaper archive.',
        icon: 'history'
      }
    ],
    rules: [
      {
        title: 'Evidence cutoff validation',
        description: 'Verifies that control logs and bank confirmations match the exact audit period.'
      },
      {
        title: 'Exception override justification',
        description: 'Blocks acceptance of failed rules unless an authorized reviewer records a written reason.'
      },
      {
        title: 'Segregation of duties',
        description: 'Enforces explicit permission checks separating preparers from final approvers.'
      },
      {
        title: 'Immutable vault retention',
        description: 'Prevents silent deletion or tampering of submitted client evidence once hashed.'
      }
    ],
    deliverables: [
      'SOC-2 Type I & Type II evidence collection',
      'Financial statement audit PBC lists',
      'Internal control testing & walkthroughs',
      'ISO 27001 readiness assessments',
      'Grant & regulatory compliance audits',
      'Signed completion manifests'
    ]
  },
  'legal-compliance': {
    slug: 'legal-compliance',
    title: 'Legal & Compliance',
    shortTitle: 'Legal & compliance',
    pill: 'Solutions · Legal & Compliance',
    headline: 'KYC, entity onboarding, and regulatory filings with zero gaps',
    description:
      'Collect corporate resolutions, beneficial ownership records, and signed disclosures through tenant-isolated portals. Every approval and expiration is tracked by state machines.',
    icon: 'gavel',
    metrics: [
      {
        label: 'TENANT ISOLATION',
        value: 'RLS',
        detail: 'PostgreSQL row-level security enforced server-side on every organization table.'
      },
      {
        label: 'LINK SECURITY',
        value: 'Revocable',
        detail: 'Single-purpose client links expire automatically and can be revoked instantaneously.'
      },
      {
        label: 'COMPLIANCE TRACE',
        value: 'Full',
        detail: 'Complete actor, timestamp, and policy record for every onboarding decision.'
      }
    ],
    workflow: [
      {
        step: '01',
        title: 'Define matter & KYC requirements',
        description:
          'Configure entity formation, beneficial ownership, or regulatory filing checklists with strict required fields.',
        icon: 'scale'
      },
      {
        step: '02',
        title: 'Secure client intake portal',
        description:
          'Clients submit IDs, incorporation certificates, and questionnaires over encrypted, expiring links.',
        icon: 'lock'
      },
      {
        step: '03',
        title: 'Deterministic policy checks',
        description:
          'Validate document expiry dates, signature presence, and mandatory disclosures automatically on arrival.',
        icon: 'warning'
      },
      {
        step: '04',
        title: 'Compliance sign-off & archival',
        description:
          'Authorized compliance officers approve or reject exceptions with full auditability for regulators.',
        icon: 'circleCheck'
      }
    ],
    rules: [
      {
        title: 'Document expiration gate',
        description: 'Automatically rejects expired passports, certificates of good standing, or licenses.'
      },
      {
        title: 'Required disclosure completeness',
        description: 'Ensures every UBO and director field is populated before submission completes.'
      },
      {
        title: 'Role-independent permissions',
        description: 'Authorization uses explicit permissions like work.approve rather than broad admin flags.'
      },
      {
        title: 'Automated renewal reminders',
        description: 'Schedules follow-ups ahead of annual filing deadlines and expiring credentials.'
      }
    ],
    deliverables: [
      'KYC / KYB client onboarding packs',
      'Beneficial ownership (BOI) filings',
      'Corporate secretarial & annual returns',
      'M&A due diligence data rooms',
      'Vendor risk & compliance attestations',
      'Matter closing checklists'
    ]
  },
  advisory: {
    slug: 'advisory',
    title: 'Advisory',
    shortTitle: 'Advisory',
    pill: 'Solutions · Advisory',
    headline: 'Structured client data collection across every advisory engagement',
    description:
      'From fractional CFO board packs to transaction readiness, gather clean financial and operational inputs on time so your advisors spend hours on strategy—not inbox follow-ups.',
    icon: 'briefcase',
    metrics: [
      {
        label: 'FOLLOW-UP TIME',
        value: '-80%',
        detail: 'Automated nudges chase missing inputs without manual email threads.'
      },
      {
        label: 'ENGAGEMENT SCALE',
        value: 'Unlimited',
        detail: 'Run dozens of concurrent client engagements from one unified Command Center.'
      },
      {
        label: 'AGENT PLANNING',
        value: 'Governed',
        detail: 'AI proposes next steps and follow-up plans while your team retains approval control.'
      }
    ],
    workflow: [
      {
        step: '01',
        title: 'Scope advisory milestones',
        description:
          'Break engagements into recurring deliverables, data requests, and review gates on your Kanban board.',
        icon: 'kanban'
      },
      {
        step: '02',
        title: 'Gather executive inputs cleanly',
        description:
          'Send concise, branded links for KPI updates, forecasts, and supporting files without forcing new logins.',
        icon: 'send'
      },
      {
        step: '03',
        title: 'Governed agent assistance',
        description:
          'Let the Avenra Agent draft execution plans, summarize uploaded packs, and flag missing context for approval.',
        icon: 'sparkles'
      },
      {
        step: '04',
        title: 'Deliver verified board-ready packs',
        description:
          'Confirm every input is verified and trigger downstream webhooks once an engagement milestone closes.',
        icon: 'webhook'
      }
    ],
    rules: [
      {
        title: 'Structured metric validation',
        description: 'Checks that submitted financial models and KPI sheets include required periods.'
      },
      {
        title: 'Automated escalation cadence',
        description: 'Nudges clients before board deadlines and surfaces stalled items in the Command Center.'
      },
      {
        title: 'Budgeted AI runs',
        description: 'Every agent run operates under strict token budgets and explicit human approval gates.'
      },
      {
        title: 'Webhook completion triggers',
        description: 'Notifies downstream billing, CRM, or reporting systems the moment work completes.'
      }
    ],
    deliverables: [
      'Fractional CFO monthly board packs',
      'Fundraising & transaction readiness',
      'Cash-flow forecasting intake',
      'Operational KPI & budget reviews',
      'Client quarterly business reviews (QBRs)',
      'Post-merger integration checklists'
    ]
  }
};

export const SOLUTION_LIST = Object.values(SOLUTIONS);
