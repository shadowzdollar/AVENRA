'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

/** Display names for route segments whose URL names come from the original template. */
const segmentTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  overview: 'Command Center',
  kanban: 'Execution Board',
  product: 'Work Engagements',
  new: 'New Work',
  'ai-chat': 'Agent Intelligence',
  forms: 'Client Requests',
  basic: 'Active Requests',
  'multi-step': 'Intake Wizard',
  'sheet-form': 'Quick Dispatch',
  elements: 'Exceptions',
  icons: 'Exception Queue',
  exclusive: 'Evidence Vault',
  workspaces: 'Workspaces',
  team: 'Team',
  notifications: 'Notifications',
  billing: 'Billing & Usage',
  profile: 'Profile'
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title:
          segmentTitles[segment] ??
          (UUID.test(segment)
            ? `#${segment.slice(0, 8)}`
            : segment.charAt(0).toUpperCase() + segment.slice(1)),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
