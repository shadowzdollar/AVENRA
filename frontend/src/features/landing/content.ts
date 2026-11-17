import type { Icons } from '@/components/icons';

/**
 * All landing-page copy in one place. Every product statement here describes something the
 * Avenra backend actually does (see docs/AVENRA_MASTER_PROJECT.md and the API contract).
 */

type IconName = keyof typeof Icons;

export const REPOSITORY_URL = 'https://github.com/shadowzdollar/AVENRA';

export interface NavLink {
  label: string;
  href: string;
  description?: string;
  isNew?: boolean;
  children?: NavLink[];
}

export const NAV: NavLink[] = [
  { label: 'Platform', href: '#platform' },
  {
    label: 'Solutions',
    href: '#workspace',
    isNew: true,
    children: [
      {
        label: 'Accounting & tax',
        href: '#workspace',
        description: 'Year-end packs, returns and reconciliations'
      },
      {
        label: 'Audit & assurance',
        href: '#workspace',
        description: 'Evidence requests with a full trail'
      },
      {
        label: 'Legal & compliance',
        href: '#workspace',
        description: 'KYC, onboarding and filings'
      },
      { label: 'Advisory', href: '#workspace', description: 'Client data collection at scale' }
    ]
  },
  { label: 'Agent', href: '#agent', isNew: true },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Security', href: '#trust' },
  {
    label: 'Resources',
    href: '#faq',
    children: [
      { label: 'FAQ', href: '#faq', description: 'Answers to common questions' },
      { label: 'Source code', href: REPOSITORY_URL, description: 'Avenra on GitHub' },
      { label: 'Sign in', href: '/auth/sign-in', description: 'Go to your workspace' }
    ]
  },
  { label: 'Pricing', href: '#cta' }
];

export const SEARCH_ENTRIES = [
  { label: 'Platform overview', href: '#platform' },
  { label: 'Client requests', href: '#platform' },
  { label: 'Workspace tour', href: '#workspace' },
  { label: 'Agent Intelligence', href: '#agent' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Security & trust', href: '#trust' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Start free trial', href: '/auth/sign-up' },
  { label: 'Log in', href: '/auth/sign-in' }
];

export const HERO = {
  pills: ['Built for professional services', 'Client portal included', '30-day free trial'],
  title: 'Turn client requests into verified, completed work',
  description: [
    { text: 'A ' },
    { text: 'business work execution platform', strong: true },
    {
      text: ' that collects information from clients, checks it against your rules, chases what is missing and records every decision. Built on '
    },
    { text: 'tenant-isolated, audited infrastructure', strong: true },
    { text: ' for firms that cannot afford guesswork.' }
  ],
  primary: { label: 'Explore the platform', href: '#platform' },
  secondary: { label: 'Start with the Agent', href: '/auth/sign-up' }
};

export const MARQUEE: { label: string; icon: IconName }[] = [
  { label: 'Client Requests', icon: 'send' },
  { label: 'Secure Client Portal', icon: 'lock' },
  { label: 'Verification Rules', icon: 'listCheck' },
  { label: 'Exception Queue', icon: 'warning' },
  { label: 'Evidence Vault', icon: 'fingerprint' },
  { label: 'Agent Runs', icon: 'sparkles' },
  { label: 'Audit Trail', icon: 'history' },
  { label: 'Automatic Reminders', icon: 'bellRinging' },
  { label: 'Webhooks', icon: 'webhook' },
  { label: 'Roles & Permissions', icon: 'users' }
];

export const UNIFIED = {
  title: 'A unified system, designed to work together',
  description:
    'From scattered emails and spreadsheets to one structured workflow: this is how modern firms collect, verify and finish client work faster and more reliably.',
  request: {
    title: 'Request once. Collect from anyone.',
    description:
      'Every request becomes a secure link your client opens without an account. Answers, files and documents flow straight into the right requirement.'
  },
  connect: {
    title: 'Connected to the systems you run',
    description: [
      { text: 'Push events to your own tools through ' },
      { text: 'signed webhooks & S3 export', strong: true },
      { text: ', with automatic retries and a delivery log.' }
    ]
  },
  features: [
    {
      title: 'Your fastest way to finish work',
      description:
        'Create work, list what you need, and send the request in one flow. Avenra tracks completeness until every requirement is accepted.'
    },
    {
      title: 'Verified, not just received',
      description:
        'Each answer is checked against your rules the moment it arrives. Failures become exceptions with an owner, not surprises at the deadline.'
    },
    {
      title: 'Every step on the record',
      description:
        'Answers, documents, checks and decisions are stored as immutable evidence with SHA-256 fingerprints and a tamper-checked completion manifest.'
    }
  ]
};

export const WORKSPACE = {
  pill: 'The Avenra Workspace',
  title: 'Run every client engagement from one live workspace',
  badges: [
    { label: 'Work', icon: 'kanban' as IconName },
    { label: 'Requests', icon: 'send' as IconName },
    { label: 'Rules', icon: 'listCheck' as IconName },
    { label: 'Evidence', icon: 'fingerprint' as IconName },
    { label: 'Exceptions', icon: 'warning' as IconName },
    { label: 'Agent', icon: 'sparkles' as IconName },
    { label: 'Audit', icon: 'history' as IconName },
    { label: 'Billing', icon: 'billing' as IconName }
  ],
  description: [
    { text: 'A complete ' },
    { text: 'work execution workspace', strong: true },
    { text: ' with live status, client requests, ' },
    { text: 'deterministic verification', strong: true },
    {
      text: ' and an evidence vault, plus roles, two-step sign-in and organization isolation that just work. Built with '
    },
    { text: 'Spring Boot, PostgreSQL and Next.js', strong: true },
    { text: '.' }
  ],
  actions: [
    { label: 'Start free trial', href: '/auth/sign-up', variant: 'default' as const },
    { label: 'Log in', href: '/auth/sign-in', variant: 'outline' as const },
    { label: 'Source code', href: REPOSITORY_URL, variant: 'outline' as const }
  ],
  tabs: [
    {
      id: 'operations',
      label: 'Operations',
      icon: 'layoutDashboard' as IconName,
      items: [
        { title: 'Command Center', image: '/landing/command-center.webp' },
        { title: 'Execution Board', image: '/landing/execution-board.webp' },
        { title: 'Work Engagements', image: '/landing/work-engagements.webp' }
      ]
    },
    {
      id: 'requests',
      label: 'Client Requests',
      icon: 'send' as IconName,
      items: [
        { title: 'Request Dispatcher', image: '/landing/client-requests.webp' },
        { title: 'Active Requests', image: '/landing/active-requests.webp' },
        { title: 'Intake Wizard', image: '/landing/intake-wizard.webp' }
      ]
    },
    {
      id: 'verification',
      label: 'Verification',
      icon: 'shieldCheck' as IconName,
      items: [
        { title: 'Exception Queue', image: '/landing/exception-queue.webp' },
        { title: 'Evidence Vault', image: '/landing/evidence-vault.webp' },
        { title: 'Work Detail & Review', image: '/landing/work-detail.webp' }
      ]
    },
    {
      id: 'governance',
      label: 'Governance',
      icon: 'users' as IconName,
      items: [
        { title: 'Team & Roles', image: '/landing/team.webp' },
        { title: 'Billing & Usage', image: '/landing/billing.webp' },
        { title: 'Notifications', image: '/landing/notifications.webp' }
      ]
    },
    {
      id: 'agent',
      label: 'Agent',
      icon: 'sparkles' as IconName,
      items: [{ title: 'Agent Intelligence', image: '/landing/agent-intelligence.webp' }]
    }
  ]
};

export const AGENT = {
  pill: 'Agent Intelligence',
  title: 'Let the agent plan the busywork. You stay in control.',
  description:
    'Ask the Avenra agent what is still needed to finish a piece of work. It reads the live requirements, proposes concrete steps with a risk rating, and waits. Nothing runs until a person with approval rights says yes.',
  chips: [
    'Plans from live work',
    'Human approval first',
    'Risk-rated steps',
    'Budgeted model calls',
    'Stop at any time',
    'Every run audited'
  ],
  cta: { label: 'Try Agent Intelligence', href: '/auth/sign-up' },
  image: '/landing/agent-intelligence.webp'
};

export const INTEGRATIONS = {
  title: 'Integrations that plug into your stack',
  description:
    'Avenra speaks to the rest of your systems through events, not copy and paste. Every delivery is signed, retried with backoff and logged, so nothing gets lost.',
  items: [
    {
      icon: 'webhook' as IconName,
      title: 'Signed webhooks',
      description:
        'Receive work.completed, information.answer_received and request.expired in your own systems.'
    },
    {
      icon: 'cloudUpload' as IconName,
      title: 'S3 export',
      description:
        'Export completion manifests to your own S3-compatible storage the moment work is done.'
    },
    {
      icon: 'mail' as IconName,
      title: 'Email delivery',
      description:
        'Requests, reminders and invitations go out automatically, with tokens kept out of server logs.'
    },
    {
      icon: 'key' as IconName,
      title: 'Rotating secrets',
      description:
        'Rotate integration secrets without downtime and test connections before you rely on them.'
    }
  ]
};

export const STATS = [
  {
    label: 'Automatic reminders',
    value: '3 days',
    description:
      'Unanswered requests are followed up on a schedule, so nobody has to chase clients by hand.'
  },
  {
    label: 'Built-in roles',
    value: '5',
    description:
      'Owner, Admin, Manager, Member and Viewer, each with explicit permissions enforced on the server.'
  },
  {
    label: 'Free trial',
    value: '30 days',
    description:
      'Every new workspace starts with a full trial. Upgrade to a self-serve plan whenever you are ready.'
  }
];

export const COMPARISON = {
  title: "Can't I just do this with email and spreadsheets?",
  paragraphs: [
    'You absolutely can. Most firms do. Then they spend hours each week chasing missing documents, re-checking attachments, reconciling versions across inboxes, and reconstructing who decided what when the audit comes. You get something that almost works.',
    [
      { text: 'Avenra', strong: true },
      {
        text: ' gives you a workflow that actually finishes: one secure request per client, answers checked as they arrive, exceptions routed to an owner, and evidence recorded as you go. Your team spends its time on judgment, not on follow-ups.'
      }
    ]
  ],
  closing: 'Tools collect information. Avenra completes the work.'
};

export const TRUST = {
  title: 'Why firms trust Avenra with client work',
  items: [
    {
      icon: 'database' as IconName,
      title: 'Organization isolation',
      description:
        'Every table is protected by row-level security and the tenant is set on the server, never by the browser.'
    },
    {
      icon: 'shieldCheck' as IconName,
      title: 'Malware-scanned uploads',
      description:
        'Client files are scanned before anyone opens them. Infected files raise an exception instead.'
    },
    {
      icon: 'lock' as IconName,
      title: 'Two-step sign-in',
      description:
        'Authenticator-app MFA with recovery codes, HttpOnly sessions and CSRF protection on every change.'
    },
    {
      icon: 'history' as IconName,
      title: 'Complete audit trail',
      description:
        'Important actions are written to an exportable audit log your reviewers can rely on.'
    }
  ]
};

export const FAQ = {
  aside: {
    title: 'Still have questions? Our team is ready to assist.',
    description:
      'Open an issue for technical questions, security reviews or anything about running Avenra.',
    action: { label: 'Contact Us', href: `${REPOSITORY_URL}/issues` }
  },
  items: [
    {
      q: 'What is Avenra?',
      a: 'Avenra is a business work execution platform for professional services firms. It turns a client engagement into structured work: what is needed, who must provide it, whether it is correct, and when it is complete. It collects information through secure client links, verifies it against your rules, raises exceptions for people to resolve, and keeps immutable evidence of every step.'
    },
    {
      q: 'Do my clients need an account?',
      a: 'No. Each request is a secure link with a single-purpose token. Clients open it, answer questions and upload files without signing up. Links expire after the period you choose (up to 30 days) and can be revoked at any time.'
    },
    {
      q: 'How does verification work?',
      a: 'Each requirement can carry rules. When an answer or file arrives, Avenra checks it immediately and records the result as evidence. Answers that pass can be accepted; answers that fail need a reviewer to reject them or accept them with a recorded reason.'
    },
    {
      q: 'What does the AI agent actually do?',
      a: 'The agent proposes a plan for a piece of work based on its live requirements. Every plan waits for approval, high-risk steps need their own explicit approval, runs have budgets, and anyone with the right permission can stop a run. AI output is treated as a proposal, never as authorization.'
    },
    {
      q: 'Is our data separated from other firms?',
      a: 'Yes. Every organization is isolated in the database with row-level security, the organization is resolved on the server from your session, and isolation is covered by automated tests.'
    },
    {
      q: 'Which integrations are available?',
      a: 'Signed webhooks for work.completed, information.answer_received and request.expired, and export of completion manifests to S3-compatible storage. Deliveries are retried automatically and every attempt is logged.'
    },
    {
      q: 'How does pricing work?',
      a: 'Every workspace starts with a 30-day trial. After that you choose a plan with limits on members, open work, storage, integrations and assistant usage. If a payment fails there is a 7-day grace period before new activity is paused; your data always stays readable.'
    }
  ]
};

export const CTA = {
  title: 'Finish client work, not follow-ups',
  action: { label: 'Start free trial', href: '/auth/sign-up' },
  note: '30 days free. No card required to start.'
};

export const FOOTER = {
  tagline:
    'Stop chasing clients through inboxes. Start with a workflow that already knows what is missing.',
  columns: [
    {
      title: 'Platform',
      links: [
        { label: 'Command Center', href: '#workspace' },
        { label: 'Client Requests', href: '#platform' },
        { label: 'Agent', href: '#agent' },
        { label: 'Integrations', href: '#integrations' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'Security', href: '#trust' },
        { label: 'Source code', href: REPOSITORY_URL },
        { label: 'Report an issue', href: `${REPOSITORY_URL}/issues` }
      ]
    },
    {
      title: 'Help and Support',
      links: [
        { label: 'FAQ', href: '#faq' },
        { label: 'Log in', href: '/auth/sign-in' }
      ]
    }
  ],
  marqueeTitle: 'Built for professional services',
  practices: [
    { label: 'Accounting', icon: 'calculator' as IconName },
    { label: 'Tax', icon: 'receipt' as IconName },
    { label: 'Audit', icon: 'clipboardCheck' as IconName },
    { label: 'Legal', icon: 'gavel' as IconName },
    { label: 'Advisory', icon: 'briefcase' as IconName },
    { label: 'Banking', icon: 'bank' as IconName },
    { label: 'Compliance', icon: 'scale' as IconName }
  ]
};
