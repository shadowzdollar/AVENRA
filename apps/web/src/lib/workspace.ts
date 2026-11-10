/** One entry of the workspace sidebar. */
export type NavItem = {
  label: string;
  href: string;
  icon:
    | "overview"
    | "work"
    | "clients"
    | "requests"
    | "approvals"
    | "exceptions"
    | "evidence"
    | "analytics"
    | "integrations"
    | "team"
    | "settings"
    | "billing";
  /** Active only on this exact address (the overview). */
  exact?: boolean;
};

export type NavGroup = { label: string; items: NavItem[] };

type Entry = NavItem & { needs: string[] };

/**
 * The sidebar for one organization: only what the person's permissions allow
 * (ADR-039). Hiding is for clarity; the API enforces every permission itself.
 */
export function navigation(organizationId: string, permissions: Set<string>): NavGroup[] {
  const base = `/organizations/${organizationId}`;
  const groups: { label: string; entries: Entry[] }[] = [
    {
      label: "Work",
      entries: [
        { label: "Overview", href: base, icon: "overview", exact: true, needs: [] },
        { label: "Work", href: `${base}/work`, icon: "work", needs: ["work.read"] },
        { label: "Clients", href: `${base}/clients`, icon: "clients", needs: ["work.read"] },
        { label: "Requests", href: `${base}/requests`, icon: "requests", needs: ["information.read"] },
        { label: "Approvals", href: `${base}/approvals`, icon: "approvals", needs: ["work.read"] },
      ],
    },
    {
      label: "Control",
      entries: [
        { label: "Exceptions", href: `${base}/exceptions`, icon: "exceptions", needs: ["work.read"] },
        { label: "Evidence", href: `${base}/evidence`, icon: "evidence", needs: ["work.read"] },
        { label: "Analytics", href: `${base}/analytics`, icon: "analytics", needs: ["analytics.read"] },
      ],
    },
    {
      label: "Organization",
      entries: [
        { label: "Integrations", href: `${base}/integrations`, icon: "integrations", needs: ["integration.read"] },
        { label: "Team", href: `${base}/team`, icon: "team", needs: ["members.read"] },
        { label: "Settings", href: `${base}/settings`, icon: "settings", needs: ["organization.read"] },
        { label: "Billing", href: `${base}/billing`, icon: "billing", needs: ["billing.read"] },
      ],
    },
  ];
  return groups
    .map((group) => ({
      label: group.label,
      items: group.entries
        .filter((entry) => entry.needs.every((permission) => permissions.has(permission)))
        .map((entry): NavItem => {
          const item: NavItem = { label: entry.label, href: entry.href, icon: entry.icon };
          return entry.exact ? { ...item, exact: true } : item;
        }),
    }))
    .filter((group) => group.items.length > 0);
}

/** "Good morning" by the viewer's own clock. */
export function greeting(now: Date): string {
  const hour = now.getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}
