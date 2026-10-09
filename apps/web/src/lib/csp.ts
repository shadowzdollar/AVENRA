/**
 * Content-Security-Policy for the web app (Guidelines §72). Scripts and
 * styles run only from our origin or with the per-request nonce; the browser
 * may talk only to our origin and the Avenra API.
 */
export function buildContentSecurityPolicy(options: {
  nonce: string;
  apiOrigin: string;
  development: boolean;
}): string {
  const { nonce, apiOrigin, development } = options;
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // React's development tooling needs eval; production never allows it.
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(development ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", `'nonce-${nonce}'`],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", apiOrigin],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  const policy = Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
  return development ? policy : `${policy}; upgrade-insecure-requests`;
}
