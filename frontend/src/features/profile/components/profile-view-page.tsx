'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { toast } from 'sonner';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { LoadingButton } from '@/components/ui/loading-button';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { ApiError, api, unwrap, unwrapEmpty } from '@/lib/api-client';
import { useSession } from '@/lib/auth/session-context';
import { toAvatarUser } from '@/lib/auth/types';
import { useAppForm } from '@/lib/form';

const sessionsKey = ['auth', 'sessions'] as const;

function describeAgent(userAgent?: string): string {
  if (!userAgent) return 'Unknown device';
  const browser = /Firefox/.test(userAgent)
    ? 'Firefox'
    : /Edg\//.test(userAgent)
      ? 'Edge'
      : /Chrome/.test(userAgent)
        ? 'Chrome'
        : /Safari/.test(userAgent)
          ? 'Safari'
          : 'Browser';
  const os = /Windows/.test(userAgent)
    ? 'Windows'
    : /Mac OS/.test(userAgent)
      ? 'macOS'
      : /Android/.test(userAgent)
        ? 'Android'
        : /iPhone|iPad/.test(userAgent)
          ? 'iOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : '';
  return os ? `${browser} on ${os}` : browser;
}

export default function ProfileViewPage() {
  const { user, memberships } = useSession();
  const queryClient = useQueryClient();

  const { data: sessions = [] } = useQuery({
    queryKey: sessionsKey,
    queryFn: () => unwrap(api.GET('/api/v1/auth/sessions')),
    refetchOnWindowFocus: true
  });
  const onError = (error: Error) =>
    toast.error(error instanceof ApiError ? error.message : 'Request failed');
  const revoke = useMutation({
    mutationFn: (sessionId: string) =>
      unwrapEmpty(
        api.DELETE('/api/v1/auth/sessions/{sessionId}', { params: { path: { sessionId } } })
      ),
    onSuccess: () => toast.success('Session signed out'),
    onError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: sessionsKey })
  });
  const revokeOthers = useMutation({
    mutationFn: () => unwrapEmpty(api.DELETE('/api/v1/auth/sessions')),
    onSuccess: () => toast.success('All other sessions signed out'),
    onError,
    onSettled: () => queryClient.invalidateQueries({ queryKey: sessionsKey })
  });

  const passwordForm = useAppForm({
    defaultValues: { currentPassword: '', newPassword: '' },
    validators: {
      onSubmit: z.object({
        currentPassword: z.string().min(1, 'Enter your current password'),
        newPassword: z.string().min(12, 'Use at least 12 characters').max(128)
      })
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await unwrapEmpty(api.PUT('/api/v1/auth/password', { body: value }));
        toast.success('Password changed. Other sessions were signed out.');
        formApi.reset();
        await queryClient.invalidateQueries({ queryKey: sessionsKey });
      } catch (error) {
        onError(error as Error);
      }
    }
  });

  return (
    <div className='flex w-full max-w-3xl flex-col gap-6 p-4'>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your Avenra identity and workspaces.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <UserAvatarProfile className='size-12 rounded-lg' showInfo user={toAvatarUser(user)} />
          <div className='flex flex-wrap gap-2'>
            <Badge variant={user.mfaEnabled ? 'default' : 'outline'}>
              Two-step verification {user.mfaEnabled ? 'on' : 'off'}
            </Badge>
            {memberships.map((m) => (
              <Badge key={m.membershipId} variant='secondary'>
                {m.organization.name} · {m.role.toLowerCase()}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Changing it signs out your other sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className='space-y-4'
            onSubmit={(e) => {
              e.preventDefault();
              void passwordForm.handleSubmit();
            }}
          >
            <FieldGroup>
              <passwordForm.AppField
                name='currentPassword'
                children={(field) => (
                  <field.TextField
                    label='Current password'
                    type='password'
                    autoComplete='current-password'
                  />
                )}
              />
              <passwordForm.AppField
                name='newPassword'
                children={(field) => (
                  <field.TextField
                    label='New password'
                    type='password'
                    autoComplete='new-password'
                    description='At least 12 characters.'
                  />
                )}
              />
            </FieldGroup>
            <passwordForm.Subscribe selector={(s) => s.isSubmitting}>
              {(submitting) => (
                <LoadingButton loading={submitting} type='submit'>
                  Change password
                </LoadingButton>
              )}
            </passwordForm.Subscribe>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            Active sessions
            {sessions.length > 1 && (
              <Button
                variant='outline'
                size='sm'
                disabled={revokeOthers.isPending}
                onClick={() => revokeOthers.mutate()}
              >
                Sign out other sessions
              </Button>
            )}
          </CardTitle>
          <CardDescription>Devices currently signed in to your account.</CardDescription>
        </CardHeader>
        <CardContent className='divide-y'>
          {sessions.map((s) => (
            <div key={s.id} className='flex items-center justify-between gap-3 py-3 text-sm'>
              <div>
                <p className='font-medium'>
                  {describeAgent(s.userAgent)}{' '}
                  {s.current && <Badge className='ml-1'>This device</Badge>}
                </p>
                <p className='text-muted-foreground text-xs'>
                  Signed in {formatDistanceToNowStrict(new Date(s.createdAt), { addSuffix: true })}{' '}
                  · last seen{' '}
                  {formatDistanceToNowStrict(new Date(s.lastSeenAt), { addSuffix: true })}
                </p>
              </div>
              {!s.current && (
                <Button
                  variant='ghost'
                  size='sm'
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(s.id)}
                >
                  Sign out
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
