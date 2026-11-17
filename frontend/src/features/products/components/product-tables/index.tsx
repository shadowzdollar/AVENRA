'use client';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useOrganizationId } from '@/lib/auth/session-context';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/data-table-parsers';
import { productQueries } from '../../api/queries';
import { buildColumns } from './columns';

export function ProductTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    category: parseAsString,
    // Same parser as the server searchParamsCache, so the prefetched query key matches
    sort: getSortingStateParser().withDefault([])
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.category && { categories: params.category }),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
  };

  const organizationId = useOrganizationId();
  const { data, isPending } = useQuery({
    ...productQueries.list(organizationId ?? '', filters),
    enabled: organizationId !== null,
    placeholderData: (previous) => previous
  });
  const categories = data?.categories;
  const columns = useMemo(() => buildColumns(categories ?? []), [categories]);

  const pageCount = Math.max(1, Math.ceil((data?.total_products ?? 0) / params.perPage));

  const { table } = useDataTable({
    data: data?.products ?? [],
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { start: [], end: ['actions'] }
    }
  });

  if (isPending && !data) {
    return <DataTableSkeleton columnCount={6} rowCount={8} filterCount={2} />;
  }

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
