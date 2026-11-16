"use client";

import { AppShell } from "@/components/app-shell";
import { NotificationList } from "@/components/notifications";

export default function NotificationsPage() {
  return (
    <AppShell>
      <NotificationList />
    </AppShell>
  );
}
