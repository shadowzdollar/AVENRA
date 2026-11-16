'use client';

import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { useAppForm } from '@/lib/form';
import { categoryOptions } from '@/features/products/constants/product-options';
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
  const isEdit = !!initialData;

  const createMutation = useMutation({
    ...productMutations.create(),
    onSuccess: () => {
      toast.success('Work engagement created successfully');
      router.push('/dashboard/product');
    },
    onError: () => {
      toast.error("Couldn't create engagement. Please try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: productQueries.all() })
  });

  const updateMutation = useMutation({
    ...productMutations.update(),
    onSuccess: () => {
      toast.success('Engagement updated successfully');
      router.push('/dashboard/product');
    },
    onError: () => {
      toast.error("Couldn't update engagement. Please try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: productQueries.all() })
  });

  const form = useAppForm({
    defaultValues: {
      image: undefined,
      name: initialData?.name ?? '',
      category: initialData?.category ?? '',
      price: initialData?.price,
      description: initialData?.description ?? ''
    } as ProductFormValues,
    validators: {
      onSubmit: productSchema
    },
    onSubmit: ({ value }) => {
      const payload = {
        name: value.name,
        category: value.category,
        price: value.price!,
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
                    label='Engagement Title / Code'
                    required
                    placeholder='e.g. ENG-2026-015: FY2025 S-Corp 1120-S'
                  />
                )}
              />

              <form.AppField
                name='category'
                children={(field) => (
                  <field.SelectField
                    label='Practice Area'
                    required
                    options={categoryOptions}
                    placeholder='Select practice area'
                  />
                )}
              />

              <form.AppField
                name='price'
                children={(field) => (
                  <field.TextField
                    label='Engagement Fee ($)'
                    required
                    type='number'
                    min={0}
                    step={100}
                    placeholder='e.g. 4500'
                  />
                )}
              />
            </div>

            <form.AppField
              name='description'
              children={(field) => (
                <field.TextareaField
                  label='Engagement Scope & Deliverables'
                  required
                  placeholder='Describe required documents, filing deadlines, and rule checks...'
                  maxLength={500}
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
              {isEdit ? 'Update Engagement' : 'Create Engagement'}
            </LoadingButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
