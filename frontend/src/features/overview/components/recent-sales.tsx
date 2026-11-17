'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { workQueries } from '@/features/work/api/queries';
import { WORK_STATUS_LABELS, formatCompleteness, type WorkStatus } from '@/features/work/api/types';
import { useOrganizationId } from '@/lib/auth/session-context';
import { useHydrated } from '@/hooks/use-hydrated';

const STATUS_CLASS: Partial<Record<WorkStatus, string>> = {
  COMPLETED: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10',
  RUNNING: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
  WAITING_FOR_INFORMATION: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
  WAITING_FOR_APPROVAL: 'text-purple-500 border-purple-500/30 bg-purple-500/10',
  BLOCKED: 'text-red-500 border-red-500/30 bg-red-500/10',
  FAILED: 'text-red-500 border-red-500/30 bg-red-500/10'
};

function initials(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export function RecentSales() {
  const hydrated = useHydrated();
  const sessionOrganizationId = useOrganizationId();
  // Until hydration, render as the server did (no data); see useHydrated.
  const organizationId = hydrated ? sessionOrganizationId : null;
  const enabled = organizationId !== null;
  const { data: work = [], isPending } = useQuery({
    ...workQueries.list(organizationId ?? ''),
    enabled
  });
  const { data: clients = [] } = useQuery({
    ...workQueries.clients(organizationId ?? ''),
    enabled
  });
  const clientName = new Map(clients.map((c) => [c.id, c.name]));

  const recent = [...work].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  const dayAgo = Date.now() - 24 * 3600 * 1000;
  const updatedToday = work.filter((w) => new Date(w.updatedAt).getTime() > dayAgo).length;

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>{updatedToday} work items updated in the last 24h.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {!isPending && recent.length === 0 && (
            <p className='text-muted-foreground text-sm'>
              No work yet. Create work to see activity here.
            </p>
          )}
          {recent.map((item) => {
            const client = item.clientId ? clientName.get(item.clientId) : undefined;
            return (
              <div key={item.id} className='flex items-center justify-between gap-2'>
                <div className='flex items-center gap-3 min-w-0'>
                  <Avatar className='h-9 w-9 shrink-0 bg-primary/10 text-primary font-semibold text-xs'>
                    <AvatarFallback>{initials(client ?? item.title)}</AvatarFallback>
                  </Avatar>
                  <div className='space-y-0.5 truncate'>
                    <p className='text-sm font-medium leading-none truncate'>
                      {client ?? item.title}
                    </p>
                    <p className='text-xs text-muted-foreground truncate'>
                      {client ? item.title : formatCompleteness(item.completeness)}
                    </p>
                  </div>
                </div>
                <div className='flex flex-col items-end gap-1 shrink-0'>
                  <Badge
                    variant='outline'
                    className={`text-[11px] font-mono ${STATUS_CLASS[item.status] ?? 'text-muted-foreground'}`}
                  >
                    {WORK_STATUS_LABELS[item.status]}
                  </Badge>
                  <span className='text-[10px] text-muted-foreground tabular-nums'>
                    {formatDistanceToNowStrict(new Date(item.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
