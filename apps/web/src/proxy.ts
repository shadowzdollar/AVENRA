import { NextResponse, type NextRequest } from "next/server";
import { publicConfig } from "@/lib/config";
import { buildContentSecurityPolicy } from "@/lib/csp";

/**
 * Sets a per-request Content-Security-Policy with a fresh nonce. Next.js reads
 * the nonce from the request header and applies it to its own scripts.
 */
export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildContentSecurityPolicy({
    nonce,
    apiOrigin: new URL(publicConfig.apiUrl).origin,
    development: process.env.NODE_ENV === "development",
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Static assets and Next.js internals do not need the per-request policy.
  matcher: [
    {
      source: "/((?!_next/static|_next/image|icon.png|apple-icon.png|avenra-symbol.png).*)",
      missing: [{ type: "header", key: "next-router-prefetch" }],
    },
  ],
};
