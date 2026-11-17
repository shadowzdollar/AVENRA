'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { requestLinkQueries } from '@/features/requests/api/queries';
import { createRequestLink } from '@/features/requests/api/service';
import { workQueries } from '@/features/work/api/queries';
import { createRequirement } from '@/features/work/api/service';
import { ApiError } from '@/lib/api-client';
import { useSession } from '@/lib/auth/session-context';

/** Common items a firm asks clients for; created on the work when picked. */
const SUGGESTED_REQUIREMENTS = [
  { id: 'suggest:tax_return', label: 'Prior year tax returns', kind: 'DOCUMENT' as const },
  { id: 'suggest:trial_balance', label: 'Year-end trial balance', kind: 'DOCUMENT' as const },
  {
    id: 'suggest:bank_statements',
    label: '12 months of bank statements',
    kind: 'DOCUMENT' as const
  },
  { id: 'suggest:payroll', label: 'Quarterly payroll reports', kind: 'DOCUMENT' as const },
  { id: 'suggest:id', label: 'Government-issued ID of the signatory', kind: 'DOCUMENT' as const },
  { id: 'suggest:registration', label: 'Company registration number', kind: 'TEXT' as const }
];

const OPEN_STATUSES = new Set(['DRAFT', 'READY', 'RUNNING', 'WAITING_FOR_INFORMATION', 'BLOCKED']);

export default function ClientRequestDispatcher({ initialWorkId }: { initialWorkId?: string }) {
  const { organizationId, membership, hasPermission } = useSession();
  const orgId = organizationId ?? '';
  const enabled = organizationId !== null;
  const queryClient = useQueryClient();

  const { data: work = [] } = useQuery({ ...workQueries.list(orgId), enabled });
  const { data: clients = [] } = useQuery({ ...workQueries.clients(orgId), enabled });
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const openWork = work.filter((w) => OPEN_STATUSES.has(w.status));

  const [selectedWork, setSelectedWork] = useState(initialWorkId ?? '');
  useEffect(() => {
    if (!selectedWork && openWork[0]) setSelectedWork(openWork[0].id);
  }, [openWork, selectedWork]);

  const { data: detail } = useQuery({
    ...workQueries.detail(orgId, selectedWork),
    enabled: enabled && selectedWork !== ''
  });

  const [clientEmail, setClientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number>(
    membership?.organization.requestLinkDays ?? 14
  );
  const [selectedReqs, setSelectedReqs] = useState<string[]>([]);
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Prefill from the work's client and pre-select requirements still missing an answer.
  useEffect(() => {
    if (!detail) return;
    const client = detail.clientId ? clientById.get(detail.clientId) : undefined;
    if (client?.email) setClientEmail(client.email);
    if (client?.name) setRecipientName(client.name);
    setSelectedReqs(
      detail.requirements
        .filter((r) => r.state === 'MISSING' || r.state === 'REJECTED')
        .map((r) => r.id)
    );
    setSentTo(null);
  }, [detail, clientById]);

  const existing = detail?.requirements ?? [];
  const suggestions = SUGGESTED_REQUIREMENTS.filter(
    (s) => !existing.some((r) => r.title.toLowerCase() === s.label.toLowerCase())
  );

  const toggleReq = (id: string) => {
    setSelectedReqs((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const dispatch = useMutation({
    mutationFn: async () => {
      // Picked suggestions become real requirements on the work first.
      const created = await Promise.all(
        SUGGESTED_REQUIREMENTS.filter((s) => selectedReqs.includes(s.id)).map((s) =>
          createRequirement(orgId, selectedWork, { title: s.label, kind: s.kind, required: true })
        )
      );
      const requirementIds = [
        ...selectedReqs.filter((id) => !id.startsWith('suggest:')),
        ...created.map((r) => r.id)
      ];
      return createRequestLink(orgId, selectedWork, {
        recipientEmail: clientEmail.trim(),
        recipientName: recipientName.trim() || undefined,
        message: message.trim() || undefined,
        requirementIds,
        expiresInDays
      });
    },
    onSuccess: (link) => {
      setSentTo(link.recipientEmail);
      toast.success(`Request sent to ${link.recipientEmail}`);
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : 'The request could not be sent'),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: requestLinkQueries.all(orgId) }),
        queryClient.invalidateQueries({ queryKey: workQueries.all(orgId) })
      ])
  });

  const handleGenerate = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedWork) {
      toast.error('Select the work this request is for.');
      return;
    }
    if (selectedReqs.length === 0) {
      toast.error('Please select at least one item to request.');
      return;
    }
    dispatch.mutate();
  };

  if (!hasPermission('information.collect')) {
    return (
      <Card className='max-w-xl p-8 text-center text-muted-foreground'>
        Your role cannot send client requests in this workspace.
      </Card>
    );
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl'>
      <div className='lg:col-span-2 space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Dispatch Client Document Request</CardTitle>
            <CardDescription>
              Avenra emails your client a secure link to answer and upload, without needing an
              account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className='space-y-6'>
              <div className='space-y-2'>
                <Label htmlFor='engagement'>Select Work</Label>
                <select
                  id='engagement'
                  value={selectedWork}
                  onChange={(e) => setSelectedWork(e.target.value)}
                  className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring'
                >
                  {openWork.length === 0 && (
                    <option value=''>No open work. Create work first.</option>
                  )}
                  {openWork.map((w) => (
                    <option key={w.id} value={w.id}>
                      {(w.clientId && clientById.get(w.clientId)?.name) || 'No client'} — {w.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Client Contact Email</Label>
                  <Input
                    id='email'
                    type='email'
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    maxLength={254}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Client Contact Name</Label>
                  <Input
                    id='name'
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className='space-y-3'>
                <Label>Requested Items</Label>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                  {[
                    ...existing.map((r) => ({
                      id: r.id,
                      label: r.title,
                      note: r.state.replace(/_/g, ' ').toLowerCase()
                    })),
                    ...suggestions.map((s) => ({
                      id: s.id,
                      label: s.label,
                      note: 'new requirement'
                    }))
                  ].map((req) => {
                    const isChecked = selectedReqs.includes(req.id);
                    return (
                      <button
                        key={req.id}
                        type='button'
                        onClick={() => toggleReq(req.id)}
                        className={`flex items-start gap-2.5 p-3 rounded-lg border text-left text-xs transition-colors ${
                          isChecked
                            ? 'border-primary/50 bg-primary/5 font-medium text-foreground'
                            : 'border-border/60 hover:bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <div
                          className={`mt-0.5 size-4 rounded flex items-center justify-center shrink-0 border ${
                            isChecked
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground/40'
                          }`}
                        >
                          {isChecked && <Icons.check className='size-3 stroke-3' />}
                        </div>
                        <span>
                          {req.label}
                          <span className='text-muted-foreground block text-[10px] font-normal'>
                            {req.note}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='expires'>Link Valid For (days)</Label>
                  <Input
                    id='expires'
                    type='number'
                    min={1}
                    max={30}
                    value={expiresInDays}
                    onChange={(e) =>
                      setExpiresInDays(Math.min(30, Math.max(1, Number(e.target.value) || 1)))
                    }
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Automated Follow-up Reminders</Label>
                  <p className='text-muted-foreground rounded-md border px-3 py-2 text-sm'>
                    Sent automatically until answered
                  </p>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='message'>Message to Client</Label>
                <Textarea
                  id='message'
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder='Optional note shown with the request.'
                />
              </div>

              <Button
                type='submit'
                className='w-full'
                disabled={dispatch.isPending || !selectedWork}
              >
                <Icons.send className='mr-2 h-4 w-4' /> Send Request to Client
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className='space-y-6'>
        <Card className='border-primary/20 bg-primary/5'>
          <CardHeader className='pb-3'>
            <Badge
              variant='outline'
              className='w-fit text-emerald-500 border-emerald-500/30 bg-emerald-500/10 mb-1'
            >
              <Icons.lock className='mr-1 h-3 w-3' /> Secure Client Links
            </Badge>
            <CardTitle className='text-base font-semibold'>Tokenized Link Security</CardTitle>
            <CardDescription className='text-xs'>
              Each link carries a single-purpose token in the URL fragment, so it never reaches
              server logs. Access is limited to the selected items and expires automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className='text-xs space-y-2 text-muted-foreground'>
            <div className='flex items-center gap-2'>
              <Icons.check className='size-4 text-emerald-500 shrink-0' />
              <span>Malware scan on every client upload</span>
            </div>
            <div className='flex items-center gap-2'>
              <Icons.check className='size-4 text-emerald-500 shrink-0' />
              <span>Answers checked against your verification rules</span>
            </div>
            <div className='flex items-center gap-2'>
              <Icons.check className='size-4 text-emerald-500 shrink-0' />
              <span>Every submission recorded as evidence</span>
            </div>
          </CardContent>
        </Card>

        {sentTo && (
          <Card className='border-emerald-500/30 bg-emerald-500/5 animate-in fade-in'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400'>
                <Icons.badgeCheck className='size-4' /> Request Sent
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-1 text-xs text-muted-foreground'>
              <p>
                A secure link was emailed to{' '}
                <span className='text-foreground font-medium'>{sentTo}</span>.
              </p>
              <p>Track answers and send reminders under Active Requests.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
