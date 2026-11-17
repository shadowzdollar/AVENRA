import { requireSession } from '@/lib/auth/server';
import PageContainer from '@/components/layout/page-container';
import ProductViewPage from '@/features/products/components/product-view-page';

export const metadata = {
  title: 'Dashboard : Work'
};

type PageProps = { params: Promise<{ productId: string }> };

export default async function Page(props: PageProps) {
  await requireSession();
  const params = await props.params;

  return (
    <PageContainer>
      <div className='flex-1 space-y-4'>
        <ProductViewPage productId={params.productId} />
      </div>
    </PageContainer>
  );
}
