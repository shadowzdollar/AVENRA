import { z } from "zod";

/**
 * Server-side configuration, validated on first use (Guidelines §91). The
 * browser never sees it: it talks only to this web application's own origin,
 * and the server forwards `/api/*` to the API (ADR-013).
 */
const serverConfigSchema = z.object({
  apiInternalUrl: z
    .url({ protocol: /^https?$/, error: "must be an absolute http(s) URL" })
    .transform((url) => url.replace(/\/+$/, "")),
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;

export function parseServerConfig(env: Record<string, string | undefined>): ServerConfig {
  const result = serverConfigSchema.safeParse({ apiInternalUrl: env.AVENRA_API_INTERNAL_URL });
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `AVENRA_API_INTERNAL_URL ${issue.message}`);
    throw new Error(`Invalid web configuration: ${problems.join("; ")}`);
  }
  return result.data;
}

let cached: ServerConfig | undefined;

/** Read at runtime, so one image works in every environment. */
export function serverConfig(): ServerConfig {
  cached ??= parseServerConfig(process.env);
  return cached;
}
