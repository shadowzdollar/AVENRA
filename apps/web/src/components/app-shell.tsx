"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Alert } from "@/components/ui";
import { api } from "@/lib/api";
import { useRequiredSession } from "@/lib/session";

/** Header and frame for signed-in pages; shows nothing until the session is known. */
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
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- the CSP blocks next/image's inline style */}
            <img src="/avenra-symbol.png" alt="" width={28} height={28} />
            <span className="text-base font-semibold tracking-tight">Avenra</span>
          </Link>
          <nav className="flex gap-4 text-sm text-text-secondary">
            <Link href="/" className="hover:text-text-primary">
              Organizations
            </Link>
            <Link href="/account" className="hover:text-text-primary">
              Account
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            {session.data ? <span className="text-text-secondary">{session.data.displayName}</span> : null}
            <button type="button" onClick={() => void signOut()} className="text-text-secondary hover:text-text-primary">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        {session.isPending ? <p className="text-sm text-text-secondary">Loading…</p> : null}
        {session.isError && !(session.error && "status" in session.error && session.error.status === 401) ? (
          <Alert tone="error">The application could not reach Avenra. Try again in a moment.</Alert>
        ) : null}
        {session.data ? children : null}
      </main>
    </div>
  );
}
