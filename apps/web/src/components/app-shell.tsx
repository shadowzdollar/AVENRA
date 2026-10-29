"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand";
import { NotificationBell } from "@/components/notifications";
import { Alert, Avatar } from "@/components/ui";
import { api } from "@/lib/api";
import { useRequiredSession } from "@/lib/session";

/**
 * The frame of signed-in pages outside an organization (the list of
 * organizations, the account, notifications); shows nothing until the session
 * is known.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const session = useRequiredSession();
  const router = useRouter();
  const queries = useQueryClient();

  async function signOut() {
    await api.POST("/api/v1/auth/sign-out");
    queries.clear();
    router.replace("/sign-in");
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-6">
          <Link href="/organizations" aria-label="Avenra">
            <BrandLogo />
          </Link>
          <nav className="flex items-center gap-4 text-[13px] text-text-secondary">
            <Link href="/organizations" className="hover:text-text-primary">
              Organizations
            </Link>
            <Link href="/account" className="hover:text-text-primary">
              Account
            </Link>
            {session.data ? <NotificationBell /> : null}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-[13px]">
            {session.data ? (
              <span className="flex items-center gap-2">
                <Avatar name={session.data.displayName} className="size-8 bg-text-primary text-[11px] text-background" />
                <span className="hidden font-medium sm:inline">{session.data.displayName}</span>
              </span>
            ) : null}
            <button type="button" onClick={() => void signOut()} className="text-text-secondary hover:text-text-primary">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        {session.isPending ? <p className="text-[13px] text-text-secondary">Loading…</p> : null}
        {session.isError && !(session.error && "status" in session.error && session.error.status === 401) ? (
          <Alert tone="error">The application could not reach Avenra. Try again in a moment.</Alert>
        ) : null}
        {session.data ? children : null}
      </main>
    </div>
  );
}
