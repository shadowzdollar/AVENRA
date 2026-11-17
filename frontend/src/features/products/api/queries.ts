import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { live } from '@/lib/live';
import { workQueries } from '@/features/work/api/queries';
import {
  cancelProduct,
  createProduct,
  getProductById,
  getProducts,
  updateProduct
} from './service';
import type { Product, ProductFilters, ProductMutationPayload } from './types';

export type { Product };

// Keys live under the work keys so any work mutation refreshes these views too.
export const productQueries = {
  all: (organizationId: string) => workQueries.all(organizationId),
  list: (organizationId: string, filters: ProductFilters) =>
    queryOptions({
      queryKey: [...productQueries.all(organizationId), 'engagements', filters] as const,
      queryFn: () => getProducts(organizationId, filters),
      ...live
    }),
  detail: (organizationId: string, id: string) =>
    queryOptions({
      queryKey: [...productQueries.all(organizationId), 'engagement', id] as const,
      queryFn: () => getProductById(organizationId, id)
    })
};

export const productMutations = {
  create: (organizationId: string) =>
    mutationOptions({
      mutationFn: (data: ProductMutationPayload) => createProduct(organizationId, data)
    }),
  update: (organizationId: string) =>
    mutationOptions({
      mutationFn: ({ id, values }: { id: string; values: ProductMutationPayload }) =>
        updateProduct(organizationId, id, values)
    }),
  cancel: (organizationId: string) =>
    mutationOptions({
      mutationFn: (product: Pick<Product, 'id' | 'status'>) =>
        cancelProduct(organizationId, product)
    })
};
