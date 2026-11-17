'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { productMutations, productQueries } from '../../api/queries';
import type { Product } from '../../api/types';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import { useSession } from '@/lib/auth/session-context';

interface CellActionProps {
  data: Product;
}

export function CellAction({ data }: CellActionProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organizationId, hasPermission } = useSession();
  const orgId = organizationId ?? '';
  const finished = data.status === 'COMPLETED' || data.status === 'CANCELLED';

  const cancelMutation = useMutation({
    ...productMutations.cancel(orgId),
    onSuccess: () => {
      toast.success('Work cancelled');
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Couldn't cancel this work");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: productQueries.all(orgId) })
  });

  const handleRequestInformation = () => {
    router.push(`/dashboard/forms/sheet-form?workId=${data.id}`);
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => cancelMutation.mutate(data)}
        loading={cancelMutation.isPending}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger render={<Button variant='ghost' className='h-8 w-8 p-0' />}>
          <span className='sr-only'>Open menu</span>
          <Icons.moreHorizontal className='h-4 w-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Work Actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/product/${data.id}`)}>
              <Icons.edit className='mr-2 h-4 w-4' /> Open Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/kanban')}>
              <Icons.kanban className='mr-2 h-4 w-4' /> View on Board
            </DropdownMenuItem>
            {hasPermission('information.collect') && !finished && (
              <DropdownMenuItem onClick={handleRequestInformation}>
                <Icons.share className='mr-2 h-4 w-4' /> Request From Client
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          {hasPermission('work.update') && !finished && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className='text-destructive focus:text-destructive'
                  onClick={() => setOpen(true)}
                >
                  <Icons.trash className='mr-2 h-4 w-4' /> Cancel Work
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
