/**
 * Liveness probe for the web server (Guidelines §94). Cheap and dependency
 * free: it reports that the Node.js process is serving requests, not that the
 * API is reachable.
 */
export function GET(): Response {
  return Response.json({ status: "UP" }, { headers: { "Cache-Control": "no-store" } });
}

export const dynamic = "force-dynamic";
