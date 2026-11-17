'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AvenraLogo } from '@/components/brand/avenra-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ApiError, api, unwrap, type components } from '@/lib/api-client';

type Item = components['schemas']['ClientRequestItem'];

const STATE_LABEL: Record<Item['state'], string> = {
  MISSING: 'Needed',
  SUBMITTED: 'Received',
  ACCEPTED: 'Accepted',
  REJECTED: 'Please resend'
};

function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 404 || error.status === 410) {
      return 'This link is no longer valid. It may have expired or been replaced. Ask the sender for a new one.';
    }
    return error.details?.[0]?.problem ?? error.message;
  }
  return 'Something went wrong. Please try again.';
}

/** Public page a client opens from an emailed link: `/request#<token>`. No account needed. */
export function ClientRequestPortal() {
  const [token, setToken] = useState<string | null | undefined>(undefined);

  // The token arrives in the fragment (never sent to servers or referrers); keep it in memory
  // only and remove it from the address bar so it is not left in history or screenshots.
  const tokenRead = useRef(false);
  useEffect(() => {
    // Read once: effects can run twice in development, and the hash is gone after the first run.
    if (tokenRead.current) return;
    tokenRead.current = true;
    const fromHash = window.location.hash.slice(1);
    setToken(fromHash.length >= 20 ? fromHash : null);
    if (fromHash) window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const queryClient = useQueryClient();
  const headers = { 'X-Avenra-Request-Token': token ?? '' };
  const { data, error, isPending } = useQuery({
    queryKey: ['client-request'],
    queryFn: () =>
      unwrap(api.GET('/api/v1/client-requests/current', { params: { header: headers } })),
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: true
  });

  const onSaved = (item: Item) => {
    queryClient.setQueryData(['client-request'], (prev: typeof data) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((i) => (i.requirementId === item.requirementId ? item : i))
          }
        : prev
    );
  };

  if (token === undefined || (token && isPending)) {
    return (
      <Shell>
        <p className='text-muted-foreground text-sm'>Opening your request…</p>
      </Shell>
    );
  }
  if (!token || error || !data) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <CardTitle>Link not available</CardTitle>
            <CardDescription>
              {token ? messageFor(error) : 'This page needs the full link from your email.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </Shell>
    );
  }

  const done = data.items.filter((i) => i.state === 'SUBMITTED' || i.state === 'ACCEPTED').length;

  return (
    <Shell>
      <Card>
        <CardHeader>
          <CardDescription>{data.organizationName} requests:</CardDescription>
          <CardTitle className='text-xl'>{data.workTitle}</CardTitle>
          {data.message && (
            <p className='text-muted-foreground whitespace-pre-wrap text-sm'>{data.message}</p>
          )}
        </CardHeader>
        <CardContent className='space-y-2'>
          <div className='flex items-center gap-3 text-sm'>
            <Progress value={(done / Math.max(1, data.items.length)) * 100} className='flex-1' />
            <span className='tabular-nums'>
              {done}/{data.items.length}
            </span>
          </div>
          <p className='text-muted-foreground text-xs'>
            For {data.recipient} · link valid until {new Date(data.expiresAt).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {data.items.map((item) => (
        <RequestItem key={item.requirementId} item={item} headers={headers} onSaved={onSaved} />
      ))}
    </Shell>
  );
}

function RequestItem({
  item,
  headers,
  onSaved
}: {
  item: Item;
  headers: { 'X-Avenra-Request-Token': string };
  onSaved: (item: Item) => void;
}) {
  const [value, setValue] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const path = { requirementId: item.requirementId };

  const submit = useMutation({
    mutationFn: async () => {
      if (item.kind === 'DOCUMENT') {
        if (!file) throw new Error('Choose a file first.');
        return unwrap(
          api.POST('/api/v1/client-requests/current/requirements/{requirementId}/file', {
            params: { header: headers, path },
            body: { file: '' },
            bodySerializer: () => {
              const form = new FormData();
              form.append('file', file);
              return form;
            }
          })
        );
      }
      return unwrap(
        api.POST('/api/v1/client-requests/current/requirements/{requirementId}/value', {
          params: { header: headers, path },
          body: { value: value.trim() }
        })
      );
    },
    onSuccess: (saved) => {
      onSaved(saved);
      setValue('');
      setFile(null);
      toast.success(`Sent: ${item.title}`);
    },
    onError: (error) => toast.error(messageFor(error))
  });

  const open = item.state === 'MISSING' || item.state === 'REJECTED';
  const inputType = item.kind === 'NUMBER' ? 'number' : item.kind === 'DATE' ? 'date' : 'text';

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center justify-between gap-2 text-base'>
          <span>
            {item.title}
            {!item.required && (
              <span className='text-muted-foreground font-normal'> (optional)</span>
            )}
          </span>
          <Badge variant={item.state === 'ACCEPTED' ? 'default' : 'outline'}>
            {STATE_LABEL[item.state]}
          </Badge>
        </CardTitle>
        {item.instructions && <CardDescription>{item.instructions}</CardDescription>}
        {item.state === 'REJECTED' && item.rejectionReason && (
          <p className='text-destructive text-sm'>{item.rejectionReason}</p>
        )}
        {item.problems?.map((p) => (
          <p key={p} className='text-sm text-amber-600'>
            {p}
          </p>
        ))}
      </CardHeader>
      {open && (
        <CardContent>
          <form
            className='flex flex-col gap-2 sm:flex-row'
            onSubmit={(e) => {
              e.preventDefault();
              submit.mutate();
            }}
          >
            {item.kind === 'DOCUMENT' ? (
              <Input
                type='file'
                accept={item.acceptedFileTypes?.join(',')}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                aria-label={item.title}
              />
            ) : item.kind === 'BOOLEAN' ? (
              <select
                aria-label={item.title}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className='border-input bg-background flex-1 rounded-md border px-3 py-2 text-sm'
              >
                <option value=''>Choose…</option>
                <option value='true'>Yes</option>
                <option value='false'>No</option>
              </select>
            ) : (
              <Input
                type={inputType}
                value={value}
                maxLength={4000}
                onChange={(e) => setValue(e.target.value)}
                aria-label={item.title}
              />
            )}
            <Button
              type='submit'
              disabled={submit.isPending || (item.kind === 'DOCUMENT' ? !file : !value.trim())}
            >
              Send
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className='bg-background min-h-screen'>
      <div className='mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10'>
        <AvenraLogo size='md' />
        {children}
        <p className='text-muted-foreground pt-4 text-center text-xs'>
          Files are scanned for malware and stored securely. Powered by Avenra.
        </p>
      </div>
    </main>
  );
}
