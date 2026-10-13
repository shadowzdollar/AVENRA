"use client";

import { useQuery } from "@tanstack/react-query";
import type { AvenraClient } from "@avenra/contracts";

type Props = { client: AvenraClient };

/** Shows whether the web app can reach the Avenra API. */
export function ApiStatus({ client }: Props) {
  const meta = useQuery({
    queryKey: ["api", "meta"],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/meta");
      if (error) {
        throw new Error(`API error ${error.code} (request ${error.requestId})`);
      }
      return data;
    },
  });

  if (meta.isPending) {
    return <StatusLine tone="neutral" label="Checking API connection…" />;
  }
  if (meta.isError) {
    return <StatusLine tone="error" label="API unavailable" />;
  }
  return <StatusLine tone="success" label={`Connected to ${meta.data.service} (${meta.data.apiVersion})`} />;
}

const toneClasses = {
  neutral: "bg-text-secondary",
  success: "bg-success",
  error: "bg-error",
} as const;

function StatusLine({ tone, label }: { tone: keyof typeof toneClasses; label: string }) {
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-text-secondary">
      <span aria-hidden="true" className={`inline-block size-2 rounded-full ${toneClasses[tone]}`} />
      {label}
    </p>
  );
}
