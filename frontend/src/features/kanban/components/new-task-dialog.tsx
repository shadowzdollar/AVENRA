'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { workMutations, workQueries } from '@/features/work/api/queries';
import { ApiError } from '@/lib/api-client';
import { useSession } from '@/lib/auth/session-context';

export default function NewTaskDialog() {
  const { organizationId, hasPermission } = useSession();
  const orgId = organizationId ?? '';
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const create = useMutation({
    ...workMutations.create(orgId),
    onSuccess: () => {
      toast.success('Work created');
      setOpen(false);
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Couldn't create work"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: workQueries.all(orgId) })
  });
  const [titleError, setTitleError] = useState<string | null>(null);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const { title, description } = Object.fromEntries(formData);

    if (typeof title !== 'string' || typeof description !== 'string') return;
    if (!title.trim()) {
      setTitleError('Please enter a title.');
      return;
    }
    setTitleError(null);
    create.mutate(
      { title: title.trim(), description: description.trim() || undefined },
      { onSuccess: () => form.reset() }
    );
  };

  if (!hasPermission('work.create')) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTitleError(null);
      }}
    >
      <DialogTrigger render={<Button variant='secondary' size='sm' />}>+ New Work</DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>New Work</DialogTitle>
          <DialogDescription>
            Create a draft work item. It appears in Intake &amp; Ready.
          </DialogDescription>
        </DialogHeader>
        <form id='task-form' className='grid gap-4 py-4' onSubmit={handleSubmit}>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Input
              id='title'
              name='title'
              placeholder='Work title...'
              aria-label='Task title'
              required
              aria-invalid={!!titleError}
              aria-describedby={titleError ? 'task-title-error' : undefined}
              className='col-span-4'
            />
            {titleError && (
              <p id='task-title-error' role='alert' className='text-destructive col-span-4 text-sm'>
                {titleError}
              </p>
            )}
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Textarea
              id='description'
              name='description'
              placeholder='Description...'
              aria-label='Task description'
              className='col-span-4'
            />
          </div>
        </form>
        <DialogFooter>
          <Button type='submit' size='sm' form='task-form' disabled={create.isPending}>
            Create Work
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
