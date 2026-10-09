import type { NextConfig } from "next";

/**
 * Static security headers (Guidelines §72). The Content-Security-Policy is
 * per-request, because it carries a nonce, and is set in `src/proxy.ts`.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Self-contained server bundle for the container image (Phase 1 step 11).
  output: "standalone",
  // The workspace package is TypeScript source; Next compiles it.
  transpilePackages: ["@avenra/contracts"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;
