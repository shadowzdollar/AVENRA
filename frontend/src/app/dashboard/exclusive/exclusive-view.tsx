'use client';

import { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { evidenceQueries } from '@/features/evidence/api/queries';
import { getCompletionManifest } from '@/features/evidence/api/service';
import {
  EVIDENCE_KIND_LABELS,
  type Evidence,
  type EvidenceKind
} from '@/features/evidence/api/types';
import { ApiError } from '@/lib/api-client';
import { useSession } from '@/lib/auth/session-context';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const KIND_CLASS: Record<EvidenceKind, string> = {
  ANSWER: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
  DOCUMENT_VERSION: 'text-purple-500 border-purple-500/30 bg-purple-500/10',
  VERIFICATION: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10',
  HUMAN_DECISION: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
  SYSTEM_DECISION: 'text-muted-foreground'
};

export default function ExclusiveView() {
  const { organizationId, membership } = useSession();
  const orgId = organizationId ?? '';
  const [search, setSearch] = useState('');
  const { data: evidenceList, isPending } = useQuery({
    ...evidenceQueries.list(orgId),
    enabled: organizationId !== null
  });

  const term = search.toLowerCase();
  const filtered = (evidenceList ?? []).filter((item) =>
    [item.workTitle, item.description, item.fingerprint, EVIDENCE_KIND_LABELS[item.kind]]
      .join(' ')
      .toLowerCase()
      .includes(term)
  );
  const fingerprinted = (evidenceList ?? []).filter((e) => e.fingerprint).length;

  const manifestFor = async (item: Evidence) => {
    if (!item.workId) throw new Error('This evidence is not attached to work.');
    return getCompletionManifest(orgId, item.workId);
  };
  const explain = (error: unknown) =>
    error instanceof ApiError && (error.status === 404 || error.status === 409)
      ? 'A completion manifest exists once the work is completed.'
      : error instanceof Error
        ? error.message
        : 'Could not load the completion manifest.';

  const handleVerify = async (item: Evidence) => {
    try {
      const manifest = await manifestFor(item);
      if (manifest.intact) {
        toast.success(
          `Integrity verified: the completion manifest for "${item.workTitle}" matches its SHA-256.`
        );
      } else {
        toast.error(
          `Integrity check FAILED for "${item.workTitle}": the manifest no longer matches its hash.`
        );
      }
    } catch (error) {
      toast.error(explain(error));
    }
  };

  const handleDownload = async (item: Evidence) => {
    try {
      const manifest = await manifestFor(item);
      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `completion-manifest-${item.workId}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(explain(error));
    }
  };

  return (
    <PageContainer
      isLoading={isPending && organizationId !== null}
      pageTitle='Evidence Vault'
      pageDescription={`Immutable evidence recorded for ${membership?.organization.name ?? 'this workspace'}: client answers, documents, verifications and decisions, with SHA-256 fingerprints.`}
    >
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className='text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-mono text-xs'
            >
              <Icons.badgeCheck className='mr-1.5 h-3.5 w-3.5' />
              {fingerprinted} SHA-256 Fingerprints
            </Badge>
            <Badge variant='secondary' className='text-xs'>
              Append-only Evidence
            </Badge>
          </div>

          <Input
            placeholder='Search hash, work, or evidence...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='max-w-xs'
          />
        </div>

        <div className='grid grid-cols-1 gap-4'>
          {!isPending && filtered.length === 0 && (
            <Card className='p-12 text-center text-muted-foreground'>
              <p className='text-base font-semibold'>No evidence yet</p>
              <p className='text-sm'>
                Evidence is recorded as clients answer requests and checks run.
              </p>
            </Card>
          )}
          {filtered.map((item) => (
            <Card key={item.id} className='overflow-hidden'>
              <CardHeader className='pb-3'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className={`text-xs ${KIND_CLASS[item.kind]}`}>
                      {EVIDENCE_KIND_LABELS[item.kind]}
                    </Badge>
                    <Badge variant='outline' className='text-xs font-mono font-medium'>
                      {item.reference.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <span className='text-xs text-muted-foreground font-mono tabular-nums'>
                    {new Date(item.createdAt).toISOString().replace('T', ' ').slice(0, 19)} UTC
                  </span>
                </div>

                <CardTitle className='text-base font-semibold mt-2'>
                  {item.workTitle ?? 'Workspace'} —{' '}
                  <span className='font-normal text-muted-foreground'>{item.description}</span>
                </CardTitle>
                <CardDescription className='text-xs text-foreground/80 font-mono'>
                  #{item.id.slice(0, 8)}
                </CardDescription>
              </CardHeader>

              <CardContent className='pt-0 space-y-3'>
                <div className='bg-muted/40 p-2.5 rounded-lg font-mono text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 overflow-x-auto'>
                  <div className='truncate'>
                    <span className='font-semibold text-foreground mr-1'>SHA-256:</span>
                    <span className='select-all text-[11px]'>
                      {item.fingerprint ?? 'No content to fingerprint (decision or check record)'}
                    </span>
                  </div>
                  {item.fingerprint && (
                    <span className='text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0'>
                      Recorded at capture
                    </span>
                  )}
                </div>

                <div className='flex items-center justify-between pt-1'>
                  <span className='text-xs text-muted-foreground'>
                    Recorded by:{' '}
                    <span className='font-medium text-foreground'>Avenra evidence ledger</span>
                  </span>
                  <div className='flex items-center gap-2'>
                    <Button variant='outline' size='sm' onClick={() => void handleVerify(item)}>
                      <Icons.badgeCheck className='mr-1.5 h-3.5 w-3.5 text-emerald-500' />
                      Verify Hash
                    </Button>
                    <Button size='sm' onClick={() => void handleDownload(item)}>
                      <Icons.fileZip className='mr-1.5 h-3.5 w-3.5' />
                      Download Manifest
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
