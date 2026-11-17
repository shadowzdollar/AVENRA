// Work Engagements data access: an adapter from the Avenra work API (ADR-008 contract) to the
// table/form view model. Filtering by text runs on the server (`q`); practice-area filtering,
// sorting and pagination run here because the list endpoint returns the whole workspace.

import { api, unwrap } from '@/lib/api-client';
import {
  createWork,
  getWork,
  listClients,
  listWork,
  transitionWork
} from '@/features/work/api/service';
import { formatCompleteness, type WorkDetail, type WorkSummary } from '@/features/work/api/types';
import type { Product, ProductFilters, ProductMutationPayload, ProductsResponse } from './types';

function toProduct(w: WorkSummary | WorkDetail, clientNames: Map<string, string>): Product {
  return {
    id: w.id,
    name: w.title,
    client: w.clientId ? clientNames.get(w.clientId) : undefined,
    clientId: w.clientId,
    category: w.type ?? 'General',
    status: w.status,
    priority: w.priority,
    completeness: formatCompleteness(w.completeness),
    openExceptions: 'openExceptions' in w ? (w.openExceptions ?? 0) : 0,
    dueAt: w.dueAt,
    description: 'description' in w ? w.description : undefined,
    created_at: w.createdAt,
    updated_at: w.updatedAt
  };
}

async function clientNames(organizationId: string) {
  const clients = await listClients(organizationId);
  return new Map(clients.map((c) => [c.id, c.name]));
}

type SortRule = { id: string; desc: boolean };
const SORT_KEYS: Record<string, (p: Product) => string | number> = {
  name: (p) => p.name.toLowerCase(),
  status: (p) => p.status,
  priority: (p) => ['LOW', 'NORMAL', 'HIGH', 'URGENT'].indexOf(p.priority),
  completeness: (p) => p.completeness,
  dueAt: (p) => p.dueAt ?? '9999'
};

export async function getProducts(
  organizationId: string,
  filters: ProductFilters
): Promise<ProductsResponse> {
  const [work, names] = await Promise.all([
    listWork(organizationId, filters.search ? { q: filters.search } : {}),
    clientNames(organizationId)
  ]);
  let products = work.map((w) => toProduct(w, names));
  const categories = [...new Set(products.map((p) => p.category))].sort();

  if (filters.categories) {
    const wanted = new Set(filters.categories.split('.'));
    products = products.filter((p) => wanted.has(p.category));
  }
  if (filters.sort) {
    const rules = JSON.parse(filters.sort) as SortRule[];
    products.sort((a, b) => {
      for (const rule of rules) {
        const key = SORT_KEYS[rule.id];
        if (!key) continue;
        const [x, y] = [key(a), key(b)];
        if (x !== y) return (x < y ? -1 : 1) * (rule.desc ? -1 : 1);
      }
      return 0;
    });
  } else {
    products.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  const limit = filters.limit ?? 10;
  const offset = ((filters.page ?? 1) - 1) * limit;
  return {
    total_products: products.length,
    products: products.slice(offset, offset + limit),
    categories
  };
}

export async function getProductById(organizationId: string, id: string): Promise<Product> {
  const [work, names] = await Promise.all([
    getWork(organizationId, id),
    clientNames(organizationId)
  ]);
  return toProduct(work, names);
}

export async function createProduct(organizationId: string, data: ProductMutationPayload) {
  return createWork(organizationId, {
    title: data.name,
    type: data.category,
    priority: data.priority,
    description: data.description
  });
}

export async function updateProduct(
  organizationId: string,
  id: string,
  data: ProductMutationPayload
) {
  return unwrap(
    api.PATCH('/api/v1/organizations/{organizationId}/work/{workId}', {
      params: { path: { organizationId, workId: id } },
      body: {
        title: data.name,
        type: data.category,
        priority: data.priority,
        description: data.description
      }
    })
  );
}

/** Work is never deleted; it is cancelled through the state machine. */
export async function cancelProduct(
  organizationId: string,
  product: Pick<Product, 'id' | 'status'>
) {
  return transitionWork(organizationId, product.id, {
    to: 'CANCELLED',
    expectedStatus: product.status,
    reason: 'Cancelled from Work Engagements'
  });
}
