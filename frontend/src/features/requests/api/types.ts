import type { components } from '@/lib/api-client';

export type RequestLink = components['schemas']['RequestLink'];
export type RequestLinkStatus = RequestLink['status'];
export type CreateRequestLinkRequest = components['schemas']['CreateRequestLinkRequest'];
export type Requirement = components['schemas']['Requirement'];
