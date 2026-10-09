/**
 * Compile-time contract checks. This file is type-checked, never run: if the
 * contract changes in a way that breaks these usages, `pnpm typecheck` fails.
 */
import { createAvenraClient, type ApiMeta, type ErrorResponse } from "./index.js";

const client = createAvenraClient({ baseUrl: "http://localhost:8080" });

export async function readMeta(): Promise<ApiMeta | ErrorResponse | undefined> {
  const { data, error } = await client.GET("/api/v1/meta");
  if (error) {
    const code: string = error.code;
    const requestId: string = error.requestId;
    return { code, message: error.message, requestId };
  }
  const service: string = data.service;
  const apiVersion: string = data.apiVersion;
  return { service, apiVersion };
}

// @ts-expect-error: paths outside the contract are rejected.
void client.GET("/api/v1/not-in-contract");
