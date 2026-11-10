"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock,
  FileCheck2,
  Inbox,
  ShieldCheck,
  Target,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BarChart } from "@/components/bar-chart";
import { Alert, Panel, Pill, Stat, buttonClass } from "@/components/ui";
import { actor } from "@/lib/administration";
import { formatValue } from "@/lib/analytics";
import { api, unwrap } from "@/lib/api";
import { usePermissions } from "@/lib/permissions";
import { sessionKey } from "@/lib/session";
import { isOpen, statusLabel, statusTone } from "@/lib/work";
import { greeting } from "@/lib/workspace";

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function Attention({ icon: Icon, title, detail, href, tone }: { icon: LucideIcon; title: string; detail: string; href: string; tone: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-canvas">
      <span className={`flex size-9 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="size-4" />
      </span>
      <span className="flex-1">
        <span className="block text-[13px] font-medium">{title}</span>
        <span className="block text-[11px] text-text-secondary">{detail}</span>
      </span>
      <ChevronRight className="size-4 text-text-secondary" />
    </Link>
  );
}

function Overview({ id }: { id: string }) {
  const permissions = usePermissions(id);
  const base = `/organizations/${id}`;
  const path = { params: { path: { organizationId: id } } };
  const session = useQuery({ queryKey: sessionKey, queryFn: async () => unwrap(await api.GET("/api/v1/auth/session")) });
  const organization = useQuery({
    queryKey: ["organization", id],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}", path)),
  });
  const canReadWork = permissions.has("work.read");
  const work = useQuery({
    queryKey: ["organization", id, "work", "all"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/work", path)),
    enabled: canReadWork,
  });
  const exceptions = useQuery({
    queryKey: ["organization", id, "exceptions", "open"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/exceptions", path)),
    enabled: canReadWork,
  });
  const approvals = useQuery({
    queryKey: ["organization", id, "agent-runs", "AWAITING_APPROVAL"],
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/organizations/{organizationId}/agent-runs", { params: { path: { organizationId: id }, query: { status: "AWAITING_APPROVAL" } } })),
    enabled: canReadWork,
  });
  const requests = useQuery({
    queryKey: ["organization", id, "request-links", "ACTIVE"],
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/organizations/{organizationId}/request-links", { params: { path: { organizationId: id }, query: { status: "ACTIVE" } } })),
    enabled: permissions.has("information.read"),
  });
  const analytics = useQuery({
    queryKey: ["organization", id, "analytics", 30],
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/organizations/{organizationId}/analytics", { params: { path: { organizationId: id }, query: { days: 30 } } })),
    enabled: permissions.has("analytics.read"),
  });
  const audit = useQuery({
    queryKey: ["organization", id, "audit", "recent"],
    queryFn: async () => unwrap(await api.GET("/api/v1/organizations/{organizationId}/audit-events", path)),
    enabled: permissions.has("audit.read"),
  });

  const items = work.data ?? [];
  const open = items.filter((item) => isOpen(item.status));
  const waitingForInformation = items.filter((item) => item.status === "WAITING_FOR_INFORMATION").length;
  const completed30 = analytics.data?.metrics.find((metric) => metric.key === "work.completed");
  const openExceptions = (exceptions.data ?? []).filter((exception) => exception.status !== "RESOLVED" && exception.status !== "DISMISSED");
  const highExceptions = openExceptions.filter((exception) => exception.severity === "HIGH").length;
  const unanswered = (requests.data ?? []).filter((request) => (request.answeredCount ?? 0) < request.requirementIds.length);
  const weekly = analytics.data?.series.find((series) => series.key === "work.completed_weekly");
  const firstName = session.data?.displayName.split(" ")[0] ?? "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{organization.data?.name ?? "…"}</h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            {greeting(new Date())}
            {firstName ? `, ${firstName}` : ""}. Here is what needs to happen, what is complete and what is blocked.
          </p>
        </div>
        {permissions.has("work.create") ? (
          <Link href={`${base}/work/new`} className={buttonClass("primary")}>
            <Target />
            New work
          </Link>
        ) : null}
      </div>

      {canReadWork ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Open work" value={open.length} icon={CircleDashed} note="Not yet completed or cancelled" testId="overview-open" />
          <Stat
            label="Completed"
            value={completed30?.value ?? items.filter((item) => item.status === "COMPLETED").length}
            icon={CheckCircle2}
            note={completed30 ? "In the last 30 days" : "All time"}
            testId="overview-completed"
          />
          <Stat label="Waiting for information" value={waitingForInformation} icon={Clock} note="From clients or colleagues" />
          <Stat label="Open exceptions" value={openExceptions.length} icon={AlertTriangle} note={highExceptions ? `${highExceptions} high severity` : "None high severity"} />
        </div>
      ) : (
        <Alert tone="info">Your role does not include seeing the organization&apos;s work.</Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        {weekly ? (
          <Panel title="Work completed per week">
            <BarChart
              title="Work completed in each of the last weeks"
              showTitle={false}
              emptyText="No work was completed in the last 30 days yet."
              bars={weekly.points.map((point) => ({ label: `Week of ${shortDate(`${point.start}T00:00:00Z`)}`, value: point.value }))}
              format={(value) => formatValue("COUNT", value)}
            />
          </Panel>
        ) : null}
        {canReadWork ? (
          <Panel
            title="Recent work"
            className={weekly ? "" : "xl:col-span-2"}
            actions={
              <Link href={`${base}/work`} className="text-[12px] font-medium text-brand">
                View all
              </Link>
            }
          >
            {items.length === 0 ? (
              <p className="text-[13px] text-text-secondary">No work yet. Define the first piece of work to see it here.</p>
            ) : (
              <ul className="-my-2">
                {items.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <Link href={`${base}/work/${item.id}`} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{item.title}</span>
                        <span className="block truncate text-[11px] text-text-secondary">
                          {item.completeness.accepted} of {item.completeness.required} required items accepted
                        </span>
                      </span>
                      <span className="text-right">
                        <Pill tone={statusTone(item.status)}>{statusLabel(item.status)}</Pill>
                        {item.dueAt ? <span className="mt-1 block text-[11px] text-text-secondary">Due {shortDate(item.dueAt)}</span> : null}
                      </span>
                      <ChevronRight className="size-4 text-text-secondary" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ) : null}
      </div>

      {canReadWork ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Needs attention">
            <div className="space-y-3" data-testid="needs-attention">
              <Attention
                icon={AlertTriangle}
                title={`${openExceptions.length} open exception${openExceptions.length === 1 ? "" : "s"}`}
                detail={highExceptions ? `${highExceptions} high severity` : "Nothing high severity"}
                href={`${base}/exceptions`}
                tone="bg-warning-surface text-warning"
              />
              <Attention
                icon={ShieldCheck}
                title={`${approvals.data?.length ?? 0} plan${approvals.data?.length === 1 ? "" : "s"} waiting for approval`}
                detail="The assistant acts only after a person approves"
                href={`${base}/approvals`}
                tone="bg-brand-surface text-brand"
              />
              {permissions.has("information.read") ? (
                <Attention
                  icon={Inbox}
                  title={`${unanswered.length} request${unanswered.length === 1 ? "" : "s"} still waiting for answers`}
                  detail="Clients have open requests with items missing"
                  href={`${base}/requests`}
                  tone="bg-canvas text-text-primary"
                />
              ) : null}
            </div>
          </Panel>
          <Panel title="Quick actions">
            <div className="space-y-3">
              {permissions.has("work.create") ? (
                <Attention icon={Target} title="Define new work" detail="Say what needs to be true" href={`${base}/work/new`} tone="bg-brand-surface text-brand" />
              ) : null}
              <Attention icon={Inbox} title="Follow requests" detail="See what clients still owe" href={`${base}/requests`} tone="bg-brand-surface text-brand" />
              <Attention icon={FileCheck2} title="Review evidence" detail="What supports each completion" href={`${base}/evidence`} tone="bg-brand-surface text-brand" />
            </div>
          </Panel>
        </div>
      ) : null}

      {audit.data ? (
        <Panel title="Recent activity">
          {audit.data.events.length === 0 ? (
            <p className="text-[13px] text-text-secondary">Nothing has happened yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {audit.data.events.slice(0, 8).map((event) => (
                <li key={event.id} className="flex items-center gap-3 py-2.5 text-[13px]">
                  <span aria-hidden className={`size-2 rounded-full ${event.actorUserId ? "bg-text-primary" : "bg-brand"}`} />
                  <span className="font-medium">{actor(event)}</span>
                  <span className="font-mono text-[12px] text-text-secondary">{event.action}</span>
                  <span className="ml-auto whitespace-nowrap text-[12px] text-text-secondary">{new Date(event.occurredAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}
    </div>
  );
}

export default function OverviewPage() {
  const { organizationId } = useParams<{ organizationId: string }>();
  return <Overview id={organizationId} />;
}
