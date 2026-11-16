"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import type { components } from "@avenra/contracts";
import { Alert, Button, Card } from "@/components/ui";
import { api, ApiError, unwrap } from "@/lib/api";

type Category = components["schemas"]["NotificationCategory"];

export const CATEGORY_LABELS: Record<Category, string> = {
  exception: "Exceptions on work you own",
  answer: "Answers from clients",
  request: "Requests that expired incomplete",
  approval: "Plans waiting for approval",
  integration: "Integrations that stopped",
  escalation: "Escalations of unattended exceptions",
};

export const notificationsKey = ["notifications"];

/** The person's own notifications; refreshed every half minute while a page is open. */
export function useNotifications() {
  return useQuery({
    queryKey: notificationsKey,
    queryFn: async () => unwrap(await api.GET("/api/v1/notifications")),
    refetchInterval: 30_000,
  });
}

/** "3 unread" in the header, or nothing. */
export function unreadLabel(unread: number | undefined): string {
  if (!unread) return "Notifications";
  return `Notifications (${unread > 99 ? "99+" : unread})`;
}

export function NotificationBell() {
  const notifications = useNotifications();
  return (
    <Link href="/notifications" className="hover:text-text-primary" data-testid="notification-bell">
      {unreadLabel(notifications.data?.unread)}
    </Link>
  );
}

export function NotificationList() {
  const queries = useQueryClient();
  const notifications = useNotifications();
  const refresh = () => void queries.invalidateQueries({ queryKey: notificationsKey });
  const read = useMutation({
    mutationFn: async (id: string) => unwrap(await api.POST("/api/v1/notifications/{notificationId}/read", { params: { path: { notificationId: id } } })),
    onSettled: refresh,
  });
  const readAll = useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/notifications/read")),
    onSettled: refresh,
  });
  const list = notifications.data?.notifications ?? [];
  return (
    <Card title="Notifications">
      {notifications.error ? <Alert tone="error">Notifications could not be loaded.</Alert> : null}
      {list.length === 0 ? <p className="text-sm text-text-secondary">Nothing needs you right now.</p> : null}
      <ul className="divide-y divide-border" data-testid="notifications">
        {list.map((notice) => (
          <li key={notice.id} className="flex flex-col gap-1 py-3 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className={notice.readAt ? "" : "font-medium"}>{notice.title}</span>
              <span className="text-text-secondary">{new Date(notice.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-text-secondary">{notice.body}</p>
            <div className="flex gap-3">
              {notice.link ? (
                <Link href={notice.link} className="text-brand hover:underline" onClick={() => !notice.readAt && read.mutate(notice.id)}>
                  Open
                </Link>
              ) : null}
              {!notice.readAt ? (
                <button type="button" className="text-text-secondary hover:text-text-primary" onClick={() => read.mutate(notice.id)}>
                  Mark read
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {notifications.data?.unread ? (
        <div className="mt-3">
          <Button variant="secondary" busy={readAll.isPending} onClick={() => readAll.mutate()}>
            Mark all read
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

export function NotificationPreferences() {
  const queries = useQueryClient();
  const key = ["account", "notification-preferences"];
  const preferences = useQuery({
    queryKey: key,
    queryFn: async () => unwrap(await api.GET("/api/v1/account/notification-preferences")),
  });
  type Preferences = components["schemas"]["NotificationPreferences"];
  // What the person just chose, shown at once: the mutation's own update runs a tick later,
  // and a controlled box would spring back in between.
  const [chosen, setChosen] = useState<Partial<Record<Category, boolean>>>({});
  const save = useMutation({
    mutationFn: async (change: { category: Category; email: boolean }) =>
      unwrap(await api.PUT("/api/v1/account/notification-preferences", { body: { preferences: [change] } })),
    // The box changes at once; the server's answer then confirms or corrects it.
    onMutate: (change) => {
      // A load still on its way would put back the old value.
      void queries.cancelQueries({ queryKey: key });
      queries.setQueryData<Preferences>(key, (current) =>
        current
          ? { preferences: current.preferences.map((p) => (p.category === change.category ? { ...p, email: change.email } : p)) }
          : current,
      );
    },
    onSettled: async (_result, _error, change) => {
      await queries.invalidateQueries({ queryKey: key });
      setChosen((current) => {
        const next = { ...current };
        delete next[change.category];
        return next;
      });
    },
  });
  return (
    <Card title="Notifications by email">
      <p className="mb-3 text-sm text-text-secondary">You always see notifications in Avenra. Choose which ones you also get by email.</p>
      <ul className="flex flex-col gap-2 text-sm" data-testid="notification-preferences">
        {preferences.data?.preferences.map((preference) => (
          <li key={preference.category}>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={chosen[preference.category] ?? preference.email}
                onChange={(event) => {
                  const email = event.target.checked;
                  setChosen((current) => ({ ...current, [preference.category]: email }));
                  save.mutate({ category: preference.category, email });
                }}
              />
              {CATEGORY_LABELS[preference.category]}
            </label>
          </li>
        ))}
      </ul>
      {save.error ? (
        <div className="mt-3">
          <Alert tone="error">{save.error instanceof ApiError ? save.error.message : "Something went wrong."}</Alert>
        </div>
      ) : null}
    </Card>
  );
}
