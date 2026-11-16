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

interface CellActionProps {
  data: Product;
}

export function CellAction({ data }: CellActionProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    ...productMutations.delete(),
    onSuccess: () => {
      toast.success('Engagement deleted successfully');
      setOpen(false);
    },
    onError: () => {
      toast.error('Failed to delete engagement');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: productQueries.all() })
  });

  const handleCopyLink = () => {
    const link = `${window.location.origin}/client-portal/req_${data.id}_${Math.random().toString(36).substring(2, 9)}`;
    navigator.clipboard?.writeText(link);
    toast.success('Client intake magic link copied to clipboard');
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => deleteMutation.mutate(data.id)}
        loading={deleteMutation.isPending}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger render={<Button variant='ghost' className='h-8 w-8 p-0' />}>
          <span className='sr-only'>Open menu</span>
          <Icons.moreHorizontal className='h-4 w-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Engagement Actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/product/${data.id}`)}>
              <Icons.edit className='mr-2 h-4 w-4' /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/kanban')}>
              <Icons.kanban className='mr-2 h-4 w-4' /> View on Board
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyLink}>
              <Icons.share className='mr-2 h-4 w-4' /> Copy Client Link
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className='text-destructive focus:text-destructive'
              onClick={() => setOpen(true)}
            >
              <Icons.trash className='mr-2 h-4 w-4' /> Delete Engagement
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
