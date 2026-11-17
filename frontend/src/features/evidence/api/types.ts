import type { components } from '@/lib/api-client';

export type Evidence = components['schemas']['Evidence'];
export type EvidenceKind = Evidence['kind'];

export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  ANSWER: 'Client answer',
  DOCUMENT_VERSION: 'Document',
  VERIFICATION: 'Verification',
  HUMAN_DECISION: 'Human decision',
  SYSTEM_DECISION: 'System decision'
};
