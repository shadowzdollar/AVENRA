'use client';

import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { useAppForm } from '@/lib/form';
import { categoryOptions, priorityOptions } from '@/features/products/constants/product-options';
import { useOrganizationId } from '@/lib/auth/session-context';
import { ApiError } from '@/lib/api-client';
import { productSchema, type ProductFormValues } from '@/features/products/schemas/product';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { productMutations, productQueries } from '../api/queries';
import type { Product } from '../api/types';

export default function ProductForm({
  initialData,
  pageTitle
}: {
  initialData: Product | null;
  pageTitle: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const orgId = useOrganizationId() ?? '';
  const isEdit = !!initialData;
  const failure = (fallback: string) => (error: Error) =>
    toast.error(error instanceof ApiError ? error.message : fallback);

  const createMutation = useMutation({
    ...productMutations.create(orgId),
    onSuccess: (work) => {
      toast.success('Work created');
      router.push(`/dashboard/product/${work.id}`);
    },
    onError: failure("Couldn't create work. Please try again."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: productQueries.all(orgId) })
  });

  const updateMutation = useMutation({
    ...productMutations.update(orgId),
    onSuccess: () => {
      toast.success('Work updated');
    },
    onError: failure("Couldn't update work. Please try again."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: productQueries.all(orgId) })
  });

  const form = useAppForm({
    defaultValues: {
      name: initialData?.name ?? '',
      category: initialData?.category ?? '',
      priority: initialData?.priority ?? 'NORMAL',
      description: initialData?.description ?? ''
    } as ProductFormValues,
    validators: {
      onSubmit: productSchema
    },
    onSubmit: ({ value }) => {
      const payload = {
        name: value.name.trim(),
        category: value.category,
        priority: value.priority,
        description: value.description
      };

      if (isEdit) {
        updateMutation.mutate({ id: initialData.id, values: payload });
      } else {
        createMutation.mutate(payload);
      }
    }
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className='mx-auto w-full max-w-3xl'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className='space-y-8'
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <form.AppField
                name='name'
                children={(field) => (
                  <field.TextField
                    label='Work Title'
                    required
                    placeholder='e.g. FY2025 corporate tax return for Apex Holdings'
                  />
                )}
              />

              <form.AppField
                name='category'
                children={(field) => (
                  <field.SelectField
                    label='Work Type'
                    required
                    options={
                      initialData && !categoryOptions.some((o) => o.value === initialData.category)
                        ? [
                            { value: initialData.category, label: initialData.category },
                            ...categoryOptions
                          ]
                        : categoryOptions
                    }
                    placeholder='Select work type'
                  />
                )}
              />

              <form.AppField
                name='priority'
                children={(field) => (
                  <field.SelectField label='Priority' required options={priorityOptions} />
                )}
              />
            </div>

            <form.AppField
              name='description'
              children={(field) => (
                <field.TextareaField
                  label='Description'
                  placeholder='What needs to be collected, checked and delivered...'
                  maxLength={5000}
                  rows={4}
                />
              )}
            />
          </FieldGroup>

          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={() => router.back()}>
              Cancel
            </Button>
            <LoadingButton loading={isPending} type='submit'>
              {isEdit ? 'Save Changes' : 'Create Work'}
            </LoadingButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
