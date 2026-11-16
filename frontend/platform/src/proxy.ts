import { NextResponse, type NextRequest } from "next/server";
import { serverConfig } from "@/lib/config";
import { buildContentSecurityPolicy } from "@/lib/csp";

/**
 * Two jobs, both per request:
 *
 * - `/api/*` is forwarded to the API on its internal address (ADR-013), so the
 *   browser only ever talks to this origin and session cookies stay
 *   first-party. Forwarding headers tell the API the public host and client.
 * - Every page gets a Content-Security-Policy with a fresh nonce, which
 *   Next.js applies to its own scripts.
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return forwardToApi(request);
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = buildContentSecurityPolicy({ nonce, development: process.env.NODE_ENV === "development" });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

function forwardToApi(request: NextRequest) {
  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, serverConfig().apiInternalUrl);
  const headers = new Headers(request.headers);
  headers.set("x-forwarded-host", request.headers.get("host") ?? request.nextUrl.host);
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
  return NextResponse.rewrite(target, { request: { headers } });
}

export const config = {
  // Static assets and Next.js internals need neither forwarding nor the policy.
  matcher: [
    {
      source: "/((?!_next/static|_next/image|icon.png|apple-icon.png|avenra-symbol.png).*)",
      missing: [{ type: "header", key: "next-router-prefetch" }],
    },
  ],
};
