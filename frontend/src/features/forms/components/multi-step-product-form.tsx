'use client';

import * as React from 'react';
import { revalidateLogic, useSelector } from '@tanstack/react-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Icons } from '@/components/icons';
import { FieldDescription, FieldGroup } from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'motion/react';
import { useAppForm } from '@/lib/form';
import { useFormStepper } from '@/hooks/use-stepper';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryOptions } from '@/features/products/constants/product-options';
import { createRequestLink } from '@/features/requests/api/service';
import { workQueries } from '@/features/work/api/queries';
import { createRequirement, createWork } from '@/features/work/api/service';
import { ApiError } from '@/lib/api-client';
import { useOrganizationId } from '@/lib/auth/session-context';

// --- Schema ---

const productFormSchema = z.object({
  name: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
  category: z.string().min(1, 'Please select a work type'),
  clientId: z.string(),
  description: z
    .string()
    .refine((v) => parseRequirements(v).length > 0, 'List at least one item, one per line')
    .refine(
      (v) => parseRequirements(v).every((l) => l.length <= 200),
      'Each item can be 200 characters at most'
    ),
  recipientEmail: z.union([z.literal(''), z.email('Enter a valid email address')])
});

const stepSchemas = [
  // Step 1: Work
  productFormSchema.pick({ name: true, category: true, clientId: true }),
  // Step 2: What to collect, and from whom
  productFormSchema.pick({ description: true, recipientEmail: true }),
  // Step 3: Review (no validation)
  z.object({})
];

function parseRequirements(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

// --- Review summary (reads form values) ---

function ReviewSummary({ values, clientName }: { values: ProductFormValues; clientName?: string }) {
  const items = parseRequirements(values.description);
  return (
    <div className='space-y-3'>
      <Separator />
      <div className='grid gap-3'>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>Work</p>
          <p className='text-sm'>{values.name || '—'}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>Type</p>
          <p className='text-sm'>{values.category || '—'}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>Client</p>
          <p className='text-sm'>{clientName ?? 'No client'}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>
            To collect ({items.length})
          </p>
          <ul className='list-disc pl-5 text-sm'>
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>Request sent to</p>
          <p className='text-sm'>
            {values.recipientEmail || 'Nobody yet (send later from Client Requests)'}
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Main Form ---

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function MultiStepProductForm() {
  const {
    currentValidator,
    step,
    currentStep,
    isFirstStep,
    handleCancelOrBack,
    handleNextStepOrSubmit
  } = useFormStepper(stepSchemas, { fullSchema: productFormSchema });

  const router = useRouter();
  const queryClient = useQueryClient();
  const organizationId = useOrganizationId();
  const orgId = organizationId ?? '';
  const { data: clients = [] } = useQuery({
    ...workQueries.clients(orgId),
    enabled: organizationId !== null
  });
  const clientOptions = [
    { value: 'none', label: 'No client' },
    ...clients.map((c) => ({ value: c.id, label: c.name }))
  ];

  const intake = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const work = await createWork(orgId, {
        title: values.name.trim(),
        type: values.category,
        clientId: values.clientId && values.clientId !== 'none' ? values.clientId : undefined
      });
      const requirements = [];
      for (const title of parseRequirements(values.description)) {
        requirements.push(
          await createRequirement(orgId, work.id, { title, kind: 'DOCUMENT', required: true })
        );
      }
      if (values.recipientEmail) {
        await createRequestLink(orgId, work.id, {
          recipientEmail: values.recipientEmail,
          requirementIds: requirements.map((r) => r.id)
        });
      }
      return work;
    },
    onSuccess: (work, values) => {
      toast.success(
        values.recipientEmail
          ? `Work created and request sent to ${values.recipientEmail}`
          : 'Work created'
      );
      router.push(`/dashboard/product/${work.id}`);
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : 'Intake failed. Please try again.'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['org', orgId] })
  });

  const form = useAppForm({
    defaultValues: {
      name: '',
      category: '',
      clientId: 'none',
      description: '',
      recipientEmail: ''
    } as ProductFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: currentValidator as typeof productFormSchema,
      onDynamicAsyncDebounceMs: 500
    },
    onSubmit: ({ value }) => {
      intake.mutate(value);
    }
  });

  const isDefault = useSelector(form.store, (state) => state.isDefaultValue);
  const formValues = useSelector(form.store, (state) => state.values);

  const handleNext = async () => {
    await handleNextStepOrSubmit(form);
  };

  const totalSteps = 3;

  return (
    /* Every submit (Enter key, the review step's submit button) routes
       through the stepper gate — calling form.handleSubmit directly on a
       non-final step would validate only that step's schema and submit. */
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void handleNext();
      }}
      noValidate
      className='mx-auto flex w-full flex-col gap-2 p-0'
    >
      <div className='flex flex-col gap-2 pt-3'>
        <div className='flex flex-col items-center justify-start gap-1'>
          <span className='text-muted-foreground text-sm'>
            Step {currentStep} of {totalSteps}
          </span>
          <Progress value={(currentStep / totalSteps) * 100} />
        </div>

        <AnimatePresence mode='popLayout'>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.4, type: 'spring' }}
            className='flex flex-col gap-2'
          >
            {currentStep === 1 && (
              <FieldGroup className='space-y-4'>
                <h3 className='text-lg font-semibold'>Work</h3>
                <FieldDescription>What is this work, and which client is it for?</FieldDescription>

                <form.AppField
                  name='name'
                  children={(field) => (
                    <field.TextField
                      label='Work Title'
                      required
                      placeholder='e.g. FY2025 tax return for Apex Holdings'
                    />
                  )}
                />

                <form.AppField
                  name='category'
                  children={(field) => (
                    <field.SelectField
                      label='Work Type'
                      required
                      options={categoryOptions}
                      placeholder='Select work type'
                    />
                  )}
                />

                <form.AppField
                  name='clientId'
                  children={(field) => <field.SelectField label='Client' options={clientOptions} />}
                />
              </FieldGroup>
            )}

            {currentStep === 2 && (
              <FieldGroup className='space-y-4'>
                <h3 className='text-lg font-semibold'>What to Collect</h3>
                <FieldDescription>
                  One item per line. Each becomes a requirement on the work.
                </FieldDescription>

                <form.AppField
                  name='description'
                  children={(field) => (
                    <field.TextareaField
                      label='Items to Collect'
                      required
                      placeholder={
                        'Prior year tax returns\nYear-end trial balance\nBank statements'
                      }
                      maxLength={5000}
                      rows={6}
                    />
                  )}
                />

                <form.AppField
                  name='recipientEmail'
                  children={(field) => (
                    <field.TextField
                      label='Client Email (optional)'
                      type='email'
                      placeholder='Leave empty to send the request later'
                    />
                  )}
                />
              </FieldGroup>
            )}

            {currentStep === 3 && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Review & Submit</h3>
                <FieldDescription>Review the details below before submitting.</FieldDescription>
                <ReviewSummary
                  values={formValues}
                  clientName={clients.find((c) => c.id === formValues.clientId)?.name}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className='flex w-full items-center justify-between gap-3 pt-3'>
          <Button
            size='sm'
            variant='ghost'
            type='button'
            disabled={isFirstStep}
            onClick={() => handleCancelOrBack({ onBack: () => {} })}
          >
            <Icons.chevronLeft /> Previous
          </Button>
          <div className='flex w-full items-center justify-end gap-3 pt-3'>
            {!isDefault && (
              <Button
                type='button'
                onClick={() => form.reset()}
                className='rounded-lg'
                variant='outline'
                size='sm'
              >
                Reset
              </Button>
            )}
            {step.isCompleted ? (
              <Button type='submit' disabled={intake.isPending}>
                {formValues.recipientEmail ? 'Create & Send Request' : 'Create Work'}
              </Button>
            ) : (
              <Button size='sm' variant='ghost' type='button' onClick={() => void handleNext()}>
                Next <Icons.chevronRight />
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
