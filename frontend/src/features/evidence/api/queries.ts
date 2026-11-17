import { queryOptions } from '@tanstack/react-query';
import { live, orgKey } from '@/lib/live';
import { listEvidence } from './service';
import type { EvidenceKind } from './types';

export const evidenceQueries = {
  list: (organizationId: string, kind?: EvidenceKind) =>
    queryOptions({
      queryKey: orgKey(organizationId, 'evidence', kind ?? 'all'),
      queryFn: () => listEvidence(organizationId, kind),
      ...live
    })
};
