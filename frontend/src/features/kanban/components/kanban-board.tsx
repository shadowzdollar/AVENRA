'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Kanban, KanbanBoard as KanbanBoardPrimitive, KanbanOverlay } from '@/components/ui/kanban';
import { Skeleton } from '@/components/ui/skeleton';
import { workMutations, workQueries } from '@/features/work/api/queries';
import { WORK_STATUS_LABELS } from '@/features/work/api/types';
import { ApiError } from '@/lib/api-client';
import { useOrganizationId } from '@/lib/auth/session-context';
import { COLUMN_TARGET, type Columns, findMove, toColumns } from '../utils/store';
import { TaskColumn } from './board-column';
import { TaskCard } from './task-card';
import { createRestrictToContainer } from '../utils/restrict-to-container';

export function KanbanBoard() {
  const organizationId = useOrganizationId();
  const orgId = organizationId ?? '';
  const enabled = organizationId !== null;
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: work } = useQuery({ ...workQueries.list(orgId), enabled });
  const { data: clients = [] } = useQuery({ ...workQueries.clients(orgId), enabled });

  const serverColumns = useMemo(
    () => toColumns(work ?? [], new Map(clients.map((c) => [c.id, c.name]))),
    [work, clients]
  );
  // Local board state while dragging; reset whenever the server answers with new data.
  const [localColumns, setLocalColumns] = useState<Columns | null>(null);
  useEffect(() => setLocalColumns(null), [serverColumns]);
  const columns = localColumns ?? serverColumns;

  const transition = useMutation({
    ...workMutations.transition(orgId),
    onSuccess: (_, input) => toast.success(`Moved to ${WORK_STATUS_LABELS[input.to]}`),
    onError: (error) => {
      setLocalColumns(null);
      toast.error(error instanceof ApiError ? error.message : 'That move is not allowed');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: workQueries.all(orgId) })
  });

  const onValueChange = (next: Columns) => {
    const move = findMove(columns, next);
    setLocalColumns(next);
    if (move) {
      transition.mutate({
        workId: move.task.id,
        to: COLUMN_TARGET[move.to],
        expectedStatus: move.task.status,
        reason: 'Moved on the execution board'
      });
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- factory function, stable after mount
  const restrictToBoard = useCallback(
    createRestrictToContainer(() => containerRef.current),
    []
  );

  if (!work) {
    return (
      <div className='flex flex-col gap-4 md:flex-row'>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className='h-64 w-full md:w-[320px]' />
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <Kanban
        value={columns}
        onValueChange={onValueChange}
        getItemValue={(item) => item.id}
        modifiers={[restrictToBoard]}
        autoScroll={false}
      >
        <div className='w-full overflow-x-auto rounded-md pb-4'>
          <KanbanBoardPrimitive className='flex flex-col items-start gap-4 md:flex-row'>
            {Object.entries(columns).map(([columnValue, tasks]) => (
              <TaskColumn key={columnValue} value={columnValue} tasks={tasks} />
            ))}
          </KanbanBoardPrimitive>
        </div>
        <KanbanOverlay>
          {({ value, variant }) => {
            if (variant === 'column') {
              const tasks = columns[value] ?? [];
              return <TaskColumn value={value} tasks={tasks} />;
            }

            const task = Object.values(columns)
              .flat()
              .find((task) => task.id === value);

            if (!task) return null;
            return <TaskCard task={task} />;
          }}
        </KanbanOverlay>
      </Kanban>
    </div>
  );
}
