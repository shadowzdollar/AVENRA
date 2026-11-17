import type { components } from '@/lib/api-client';

export type Member = components['schemas']['Member'];
export type Invitation = components['schemas']['Invitation'];
export type Role = components['schemas']['Role'];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  MEMBER: 'Member',
  VIEWER: 'Viewer'
};
