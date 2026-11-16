'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { Product } from '../../api/types';
import type { ColumnDef } from '@tanstack/react-table';
import type { DataTableFeatures } from '@/lib/data-table-features';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { CATEGORY_OPTIONS } from './options';

export const columns: ColumnDef<DataTableFeatures, Product>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} label='Engagement / Client' />,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className='flex flex-col gap-1 py-1'>
          <span className='font-medium text-foreground hover:underline cursor-pointer'>
            {item.name}
          </span>
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <span className='font-semibold text-primary/80'>{item.client || 'Enterprise Client'}</span>
            <span>•</span>
            <span>ID #{item.id}</span>
          </div>
        </div>
      );
    },
    meta: {
      label: 'Engagement',
      placeholder: 'Search engagements or clients...',
      variant: 'text',
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'category',
    accessorKey: 'category',
    enableSorting: false,
    header: ({ column }) => <DataTableColumnHeader column={column} label='Practice Area' />,
    cell: ({ cell }) => {
      const cat = cell.getValue<string>() || 'General';
      return (
        <Badge variant='outline' className='font-normal text-xs whitespace-nowrap'>
          {cat}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'categories',
      variant: 'multiSelect',
      options: CATEGORY_OPTIONS
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} label='Status' />,
    cell: ({ row }) => {
      const status = row.original.status ?? 'RUNNING';
      let badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive' = 'outline';
      let colorClass = 'text-blue-500 border-blue-500/30 bg-blue-500/10';

      if (status === 'COMPLETED') {
        colorClass = 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
      } else if (status === 'WAITING_FOR_INFORMATION') {
        colorClass = 'text-amber-500 border-amber-500/30 bg-amber-500/10';
      } else if (status === 'BLOCKED') {
        badgeVariant = 'destructive';
        colorClass = '';
      } else if (status === 'DRAFT') {
        badgeVariant = 'secondary';
        colorClass = '';
      }

      return (
        <Badge variant={badgeVariant} className={`text-xs font-mono font-medium ${colorClass}`}>
          {status.replace(/_/g, ' ')}
        </Badge>
      );
    }
  },
  {
    id: 'priority',
    accessorKey: 'priority',
    header: ({ column }) => <DataTableColumnHeader column={column} label='Priority' />,
    cell: ({ row }) => {
      const priority = row.original.priority ?? 'NORMAL';
      const isUrgent = priority === 'URGENT';
      const isHigh = priority === 'HIGH';

      return (
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded ${
            isUrgent
              ? 'bg-red-500/15 text-red-600 dark:text-red-400'
              : isHigh
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground'
          }`}
        >
          {priority}
        </span>
      );
    }
  },
  {
    id: 'completeness',
    accessorKey: 'completeness',
    header: ({ column }) => <DataTableColumnHeader column={column} label='Completeness' />,
    cell: ({ row }) => {
      const completeness = row.original.completeness || '8/10 (80%)';
      const exceptions = row.original.openExceptions ?? 0;

      return (
        <div className='flex flex-col gap-1'>
          <span className='text-xs font-medium tabular-nums'>{completeness}</span>
          {exceptions > 0 && (
            <span className='text-[10px] text-amber-500 font-semibold flex items-center gap-1'>
              ⚠️ {exceptions} exception{exceptions > 1 ? 's' : ''}
            </span>
          )}
        </div>
      );
    }
  },
  {
    id: 'price',
    accessorKey: 'price',
    header: ({ column }) => <DataTableColumnHeader column={column} label='Fee Value' />,
    cell: ({ cell }) => {
      const val = cell.getValue<number>() || 0;
      return (
        <div className='font-mono text-xs font-medium tabular-nums'>
          ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
