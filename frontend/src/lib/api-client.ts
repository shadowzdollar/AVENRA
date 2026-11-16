import { createAvenraClient, type paths } from '@avenra/contracts';

/**
 * Same-origin API client (ADR-013).
 * In the browser, fetches hit `/api/*`, which Next.js rewrites to the Spring Boot backend.
 * On the server, it targets `AVENRA_API_INTERNAL_URL` (default: http://127.0.0.1:8080).
 */
const baseUrl =
  typeof window === 'undefined'
    ? process.env.AVENRA_API_INTERNAL_URL || 'http://127.0.0.1:8080'
    : '';

export const api = createAvenraClient({
  baseUrl,
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  }
});

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Unwraps an openapi-fetch promise, throwing an ApiError on failure.
 */
export async function unwrap<T, E>(promise: Promise<{ data?: T; error?: E; response: Response }>): Promise<T> {
  const { data, error, response } = await promise;
  if (response.ok && data !== undefined) {
    return data;
  }
  const err = error as { code?: string; message?: string; details?: Record<string, unknown> } | undefined;
  throw new ApiError(
    response.status,
    err?.code || `HTTP_${response.status}`,
    err?.message || response.statusText || 'An unexpected API error occurred',
    err?.details
  );
}

export type { paths };
