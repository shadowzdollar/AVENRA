"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  ChevronDown,
  CreditCard,
  FileCheck2,
  Inbox,
  LayoutGrid,
  ListChecks,
  Menu,
  Plug,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Target,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { BrandLogo } from "@/components/brand";
import { unreadLabel, useNotifications } from "@/components/notifications";
import { Alert, Avatar, buttonClass } from "@/components/ui";
import { api, unwrap } from "@/lib/api";
import { useRequiredSession } from "@/lib/session";
import { navigation, type NavItem } from "@/lib/workspace";

const ICONS: Record<NavItem["icon"], LucideIcon> = {
  overview: LayoutGrid,
  work: ListChecks,
  clients: Briefcase,
  requests: Inbox,
  approvals: ShieldCheck,
  exceptions: AlertTriangle,
  evidence: FileCheck2,
  analytics: BarChart3,
  integrations: Plug,
  team: Users,
  settings: Settings,
  billing: CreditCard,
};

/** Counts shown next to the items that need someone. */
function useBadges(organizationId: string, permissions: Set<string>) {
  const path = { params: { path: { organizationId } } };
  const approvals = useQuery({
    queryKey: ["organization", organizationId, "agent-runs", "AWAITING_APPROVAL"],
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/organizations/{organizationId}/agent-runs", { params: { path: { organizationId }, query: { status: "AWAITING_APPROVAL" } } })),
    enabled: permissions.has("work.read"),
    refetchInterval: 60_000,
  });
  const exceptions = useQuery({
    queryKey: ["organization", organizationId, "exceptions", "open"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/exceptions", path)),
    enabled: permissions.has("work.read"),
    refetchInterval: 60_000,
  });
  const open = exceptions.data?.filter((exception) => exception.status !== "RESOLVED" && exception.status !== "DISMISSED").length;
  return { approvals: approvals.data?.length, exceptions: open };
}

function Sidebar({ organizationId, permissions, onNavigate = () => undefined }: { organizationId: string; permissions: Set<string>; onNavigate?: () => void }) {
  const pathname = usePathname();
  const badges = useBadges(organizationId, permissions);
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Link href="/organizations" aria-label="All organizations">
          <BrandLogo />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3" aria-label="Workspace">
        {navigation(organizationId, permissions).map((group) => (
          <div key={group.label} className="mb-4 border-b border-border pb-4 last:border-0">
            <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-text-secondary">{group.label}</p>
            {group.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const badge = item.icon === "approvals" ? badges.approvals : item.icon === "exceptions" ? badges.exceptions : undefined;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                    active ? "bg-brand-surface font-medium text-brand" : "text-text-primary/80 hover:bg-canvas"
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="flex-1">{item.label}</span>
                  {badge ? <span className="rounded-full bg-brand-surface px-1.5 text-[10px] font-semibold text-brand">{badge}</span> : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      {permissions.has("work.create") ? (
        <div className="m-3 rounded-xl border border-border bg-brand-surface p-4">
          <span className="flex size-8 items-center justify-center rounded-full bg-brand">
            <Target className="size-4 text-background" />
          </span>
          <p className="mt-3 text-[13px] font-semibold">Define new work</p>
          <p className="text-[11px] text-text-secondary">Say what needs to be true. Avenra tracks it to done.</p>
          <Link href={`/organizations/${organizationId}/work/new`} onClick={onNavigate} className={`${buttonClass("primary", "sm")} mt-3`}>
            New work
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function NotificationsButton() {
  const notifications = useNotifications();
  const unread = notifications.data?.unread ?? 0;
  return (
    <Link href="/notifications" data-testid="notification-bell" className={`${buttonClass("ghost", "md")} relative w-9 px-0`}>
      <Bell aria-hidden />
      <span className="sr-only">{unreadLabel(notifications.data?.unread)}</span>
      {unread > 0 ? <span aria-hidden className="absolute right-2 top-2 size-1.5 rounded-full bg-brand" /> : null}
    </Link>
  );
}

function AccountMenu({ name, detail }: { name: string; detail: string }) {
  const router = useRouter();
  const queries = useQueryClient();
  async function signOut() {
    await api.POST("/api/v1/auth/sign-out");
    queries.clear();
    router.replace("/sign-in");
  }
  return (
    <details className="relative ml-2 border-l border-border pl-4 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2.5" aria-label="Account menu">
        <Avatar name={name} className="size-8 bg-text-primary text-[11px] text-background" />
        <span className="hidden leading-tight sm:block">
          <span className="block text-[13px] font-semibold">{name}</span>
          <span className="block text-[11px] text-text-secondary">{detail}</span>
        </span>
        <ChevronDown className="size-4 text-text-secondary" />
      </summary>
      <div className="absolute right-0 z-40 mt-2 w-48 rounded-xl border border-border bg-background p-1.5 shadow-float">
        <Link href="/account" className="block rounded-lg px-3 py-2 text-[13px] hover:bg-canvas">
          Account
        </Link>
        <Link href="/organizations" className="block rounded-lg px-3 py-2 text-[13px] hover:bg-canvas">
          All organizations
        </Link>
        <button type="button" onClick={() => void signOut()} className="block w-full rounded-lg px-3 py-2 text-left text-[13px] hover:bg-canvas">
          Sign out
        </button>
      </div>
    </details>
  );
}

/**
 * The frame of every page of an organization (ADR-039): sidebar, header with
 * search, notifications and the person; nothing until the session is known.
 */
export function WorkspaceShell({ organizationId, children }: { organizationId: string; children: ReactNode }) {
  const session = useRequiredSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const membership = session.data?.organizations.find((m) => m.organization.id === organizationId);
  const permissions = new Set(membership?.permissions ?? []);

  function search(event: FormEvent) {
    event.preventDefault();
    const text = query.trim();
    router.push(`/organizations/${organizationId}/work${text ? `?q=${encodeURIComponent(text)}` : ""}`);
  }

  return (
    <div className="flex min-h-dvh bg-canvas">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-border bg-background lg:block">
        <Sidebar organizationId={organizationId} permissions={permissions} />
      </aside>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-text-primary/20" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-background shadow-float">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-5">
              <X className="size-5" />
            </button>
            <Sidebar organizationId={organizationId} permissions={permissions} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
          <button type="button" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <form role="search" onSubmit={search} className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search work by title…"
              aria-label="Search work"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[13px] outline-none focus:border-brand"
            />
          </form>
          <div className="ml-auto flex items-center gap-1">
            {membership ? (
              <span className="hidden max-w-48 truncate rounded-lg border border-border px-2.5 py-1 text-[12px] font-medium md:block" title="Organization">
                {membership.organization.name}
              </span>
            ) : null}
            <NotificationsButton />
            {permissions.has("work.create") ? (
              <Link href={`/organizations/${organizationId}/work/new`} aria-label="New work" className={`${buttonClass("ghost", "md")} w-9 px-0`}>
                <Plus />
              </Link>
            ) : null}
            {session.data ? <AccountMenu name={session.data.displayName} detail={membership ? membership.role.toLowerCase() : ""} /> : null}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {session.isPending ? <p className="text-[13px] text-text-secondary">Loading…</p> : null}
          {session.isError && !(session.error && "status" in session.error && session.error.status === 401) ? (
            <Alert tone="error">The application could not reach Avenra. Try again in a moment.</Alert>
          ) : null}
          {session.data && !membership ? <Alert tone="error">This organization does not exist or you are not a member of it.</Alert> : null}
          {session.data && membership ? children : null}
        </main>
      </div>
    </div>
  );
}
