'use client';

import { useQuery } from '@tanstack/react-query';
import { useOrganizationId } from '@/lib/auth/session-context';
import FormCardSkeleton from '@/components/form-card-skeleton';
import { WorkDetailPanel } from './work-detail-panel';
import { notFound } from 'next/navigation';
import ProductForm from './product-form';
import { productQueries } from '../api/queries';

type TProductViewPageProps = {
  productId: string;
};

export default function ProductViewPage({ productId }: TProductViewPageProps) {
  if (productId === 'new') {
    return <ProductForm initialData={null} pageTitle='Create New Work' />;
  }

  return <EditProductView productId={productId} />;
}

function EditProductView({ productId }: { productId: string }) {
  const organizationId = useOrganizationId();
  const { data, isPending, error } = useQuery({
    ...productQueries.detail(organizationId ?? '', productId),
    enabled: organizationId !== null
  });

  if (error && 'status' in error && error.status === 404) notFound();
  if (isPending || !data) return <FormCardSkeleton />;

  return (
    <div className='space-y-4'>
      <WorkDetailPanel workId={productId} />
      <ProductForm initialData={data} pageTitle='Edit Work' />
    </div>
  );
}
