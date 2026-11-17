import type { Priority, WorkStatus } from '@/features/work/api/types';

/** Table/form view model of an Avenra work item (WorkSummary + client name). */
export type Product = {
  id: string;
  name: string;
  client?: string;
  clientId?: string;
  category: string;
  status: WorkStatus;
  priority: Priority;
  completeness: string;
  openExceptions: number;
  dueAt?: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

export type ProductFilters = {
  page?: number;
  limit?: number;
  categories?: string;
  search?: string;
  sort?: string;
};

export type ProductsResponse = {
  total_products: number;
  products: Product[];
  categories: string[];
};

export type ProductMutationPayload = {
  name: string;
  category: string;
  priority: Priority;
  description: string;
};
