'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import { DottedRule, Frame, Pill } from '@/features/landing/components/frame';
import { REPOSITORY_URL } from '@/features/landing/content';
import { cn } from '@/lib/utils';

interface EndpointDemo {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  title: string;
  summary: string;
  curl: string;
  response: string;
}

const ENDPOINTS: EndpointDemo[] = [
  {
    id: 'meta',
    method: 'GET',
    path: '/api/v1/meta',
    title: 'API Metadata & Health',
    summary: 'Verify API availability and active OpenAPI contract version.',
    curl: `curl -s http://localhost:3000/api/v1/meta`,
    response: `{\n  "service": "avenra-api",\n  "apiVersion": "v1"\n}`
  },
  {
    id: 'create-work',
    method: 'POST',
    path: '/api/v1/organizations/{orgId}/work',
    title: 'Create Work Engagement',
    summary: 'Create a new tenant-scoped engagement in DRAFT state.',
    curl: `curl -X POST http://localhost:3000/api/v1/organizations/org_northwind/work \\\n  -H "Content-Type: application/json" \\\n  -d '{"clientId":"cli_01","title":"FY26 Tax Pack"}'`,
    response: `{\n  "id": "wrk_01J9X8",\n  "status": "DRAFT",\n  "organizationId": "org_northwind",\n  "createdAt": "2026-11-23T16:30:00Z"\n}`
  },
  {
    id: 'send-request',
    method: 'POST',
    path: '/api/v1/organizations/{orgId}/work/{workId}/requests',
    title: 'Dispatch Client Portal Request',
    summary: 'Generate a single-purpose, expiring client upload link.',
    curl: `curl -X POST http://localhost:3000/api/v1/organizations/org_northwind/work/wrk_01J9X8/requests \\\n  -H "Content-Type: application/json" \\\n  -d '{"recipientEmail":"cfo@acme.example","expiresInDays":14}'`,
    response: `{\n  "requestId": "req_01J9Y2",\n  "status": "SENT",\n  "expiresAt": "2026-12-07T16:30:00Z"\n}`
  },
  {
    id: 'list-exceptions',
    method: 'GET',
    path: '/api/v1/organizations/{orgId}/exceptions',
    title: 'List Open Exceptions',
    summary: 'Retrieve failed verification rules awaiting human triage.',
    curl: `curl -s http://localhost:3000/api/v1/organizations/org_northwind/exceptions`,
    response: `{\n  "items": [\n    {\n      "id": "exc_441",\n      "rule": "PERIOD_COVERAGE_12M",\n      "status": "OPEN",\n      "severity": "HIGH"\n    }\n  ]\n}`
  }
];

const ADRS = [
  { id: 'ADR-001', title: 'Modular Monolith Core', scope: 'Spring Modulith domain boundaries & system of record.' },
  { id: 'ADR-005', title: 'Multi-Tenant RLS Isolation', scope: 'PostgreSQL row-level security & server-side tenant resolution.' },
  { id: 'ADR-008', title: 'Contract-First OpenAPI 3.1', scope: 'Single YAML source generating Java server stubs & TS clients.' },
  { id: 'ADR-017', title: 'Application-Level Encryption', scope: 'Rotatable key IDs protecting secrets & integration tokens.' },
  { id: 'ADR-020', title: 'Cryptographic Evidence Vault', scope: 'SHA-256 hashing & immutable S3 storage for client proof.' },
  { id: 'ADR-029', title: 'AI Service Boundary', scope: 'Isolated Python worker with strict schema & budget controls.' }
];

export function DocsExperience() {
  const [activeId, setActiveId] = useState(ENDPOINTS[0].id);
  const [simulated, setSimulated] = useState(false);

  const endpoint = ENDPOINTS.find((e) => e.id === activeId) ?? ENDPOINTS[0];

  return (
    <>
      <Frame className='grid lg:grid-cols-[260px_1fr]'>
        {/* Left Sticky Docs Sidebar */}
        <aside className='border-b p-6 lg:border-r lg:border-b-0'>
          <p className='text-muted-foreground mb-3 font-mono text-[11px] uppercase tracking-wider'>
            Interactive Endpoints
          </p>
          <div className='space-y-1.5'>
            {ENDPOINTS.map((ep) => (
              <button
                key={ep.id}
                type='button'
                onClick={() => {
                  setActiveId(ep.id);
                  setSimulated(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors',
                  activeId === ep.id
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                )}
              >
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold',
                    ep.method === 'GET'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-cyan-500/10 text-cyan-500'
                  )}
                >
                  {ep.method}
                </span>
                <span className='truncate'>{ep.title}</span>
              </button>
            ))}
          </div>

          <div className='mt-8 border-t pt-6'>
            <p className='text-muted-foreground mb-3 font-mono text-[11px] uppercase tracking-wider'>
              Resources
            </p>
            <div className='flex flex-col gap-2 text-xs'>
              <a
                href={REPOSITORY_URL}
                target='_blank'
                rel='noreferrer'
                className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5'
              >
                <Icons.github className='size-3.5' /> OpenAPI YAML on GitHub
              </a>
              <Link href='/integrations' className='text-muted-foreground hover:text-foreground'>
                Webhook Playground →
              </Link>
              <Link href='/security' className='text-muted-foreground hover:text-foreground'>
                Security Sandbox →
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Interactive API Console */}
        <div className='p-6 md:p-10'>
          <Pill>OpenAPI 3.1 · Interactive Reference</Pill>
          <h1 className='mt-4 text-3xl font-medium tracking-tight md:text-4xl'>{endpoint.title}</h1>
          <p className='text-muted-foreground mt-2 text-sm'>{endpoint.summary}</p>

          <div className='bg-muted/30 mt-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 font-mono text-xs'>
            <div className='flex items-center gap-2 overflow-x-auto'>
              <span className='bg-primary text-primary-foreground rounded px-2 py-0.5 font-semibold'>
                {endpoint.method}
              </span>
              <span>{endpoint.path}</span>
            </div>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => {
                  void navigator.clipboard?.writeText(endpoint.curl);
                  toast.success('cURL copied');
                }}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 text-xs')}
              >
                Copy cURL
              </button>
              <button
                type='button'
                onClick={() => setSimulated(true)}
                className={cn(buttonVariants({ size: 'sm' }), 'h-7 gap-1 text-xs')}
              >
                <Icons.sparkles className='size-3' /> Simulate Request
              </button>
            </div>
          </div>

          <div className='mt-4 grid gap-4 lg:grid-cols-2'>
            <div>
              <p className='text-muted-foreground mb-2 font-mono text-[11px] uppercase'>Request</p>
              <pre className='bg-card overflow-x-auto rounded-xl border p-4 font-mono text-xs leading-relaxed'>
                {endpoint.curl}
              </pre>
            </div>
            <div>
              <div className='mb-2 flex items-center justify-between font-mono text-[11px] uppercase'>
                <span className='text-muted-foreground'>Response</span>
                {simulated && (
                  <span className='text-emerald-500'>200 OK · 24ms</span>
                )}
              </div>
              <pre
                className={cn(
                  'bg-card overflow-x-auto rounded-xl border p-4 font-mono text-xs leading-relaxed transition-all',
                  simulated && 'border-emerald-500/40'
                )}
              >
                {endpoint.response}
              </pre>
            </div>
          </div>
        </div>
      </Frame>
      <DottedRule />

      {/* Compact ADR Index */}
      <Frame className='grid sm:grid-cols-2 lg:grid-cols-3'>
        {ADRS.map((adr, i) => (
          <div
            key={adr.id}
            className={cn(
              'space-y-2 border-b p-6 md:p-8',
              i % 3 !== 2 && 'lg:border-r',
              i >= 3 && 'lg:border-b-0'
            )}
          >
            <code className='bg-muted rounded px-2 py-0.5 font-mono text-xs font-semibold'>
              {adr.id}
            </code>
            <h3 className='text-base font-medium'>{adr.title}</h3>
            <p className='text-muted-foreground text-xs leading-relaxed'>{adr.scope}</p>
          </div>
        ))}
      </Frame>
    </>
  );
}
