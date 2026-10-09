"use client";

import { ApiStatus } from "@/components/api-status";
import { api } from "@/lib/api";

/** Binds the status component to the application's API client. */
export function ApiStatusPanel() {
  return <ApiStatus client={api} />;
}
