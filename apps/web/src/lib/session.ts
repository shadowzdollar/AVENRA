"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api, ApiError, unwrap } from "./api";

export const sessionKey = ["auth", "session"] as const;

/**
 * The signed-in user, or a redirect to sign-in when there is none. The
 * interface only adapts to the session; every rule is enforced by the API.
 */
export function useRequiredSession() {
  const router = useRouter();
  const session = useQuery({
    queryKey: sessionKey,
    queryFn: async () => unwrap(await api.GET("/api/v1/auth/session")),
    retry: false,
  });
  const unauthenticated = session.error instanceof ApiError && session.error.status === 401;
  useEffect(() => {
    if (unauthenticated) {
      const back = window.location.pathname + window.location.search;
      router.replace(`/sign-in?next=${encodeURIComponent(back)}`);
    }
  }, [unauthenticated, router]);
  return session;
}

/** Only same-origin paths are accepted as a destination after sign-in. */
export function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
