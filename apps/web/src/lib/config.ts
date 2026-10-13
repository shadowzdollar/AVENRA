import { z } from "zod";

/**
 * Public (browser-visible) configuration, validated once at startup
 * (Guidelines §91). Only `NEXT_PUBLIC_*` values belong here, and they must
 * never be secrets: they are compiled into the client bundle.
 */
const publicConfigSchema = z.object({
  apiUrl: z
    .url({ protocol: /^https?$/, error: "must be an absolute http(s) URL" })
    .transform((url) => url.replace(/\/+$/, "")),
});

export type PublicConfig = z.infer<typeof publicConfigSchema>;

export function parsePublicConfig(env: Record<string, string | undefined>): PublicConfig {
  const result = publicConfigSchema.safeParse({ apiUrl: env.NEXT_PUBLIC_AVENRA_API_URL });
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `NEXT_PUBLIC_AVENRA_API_URL ${issue.message}`);
    throw new Error(`Invalid web configuration: ${problems.join("; ")}`);
  }
  return result.data;
}

/** Referenced literally so Next.js inlines the value into the client bundle. */
export const publicConfig: PublicConfig = parsePublicConfig({
  NEXT_PUBLIC_AVENRA_API_URL: process.env.NEXT_PUBLIC_AVENRA_API_URL,
});
