import { createAvenraClient, type components, type paths } from '@avenra/contracts';

/**
 * Same-origin API client (ADR-013).
 * In the browser, fetches hit `/api/v1/*`, which Next.js rewrites to the Spring Boot backend,
 * so the HttpOnly `__Host-avenra_session` cookie travels with every call.
 * On the server, it targets `AVENRA_API_INTERNAL_URL`; server callers forward the session
 * cookie explicitly (see `lib/auth/server.ts`).
 */
const isBrowser = typeof window !== 'undefined';

const baseUrl = isBrowser ? '' : process.env.AVENRA_API_INTERNAL_URL || 'http://127.0.0.1:8080';

export const api = createAvenraClient({
  baseUrl,
  credentials: 'same-origin',
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// --- CSRF (double-submit cookie, ADR-013) -----------------------------------------------------

const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'X-XSRF-TOKEN';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function readCookie(name: string): string | undefined {
  if (!isBrowser) return undefined;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) return decodeURIComponent(trimmed.slice(prefix.length));
  }
  return undefined;
}

let csrfRequest: Promise<void> | null = null;

/** Makes sure the readable CSRF cookie exists before a state-changing request. */
async function ensureCsrfToken(): Promise<string | undefined> {
  const existing = readCookie(CSRF_COOKIE);
  if (existing) return existing;
  csrfRequest ??= fetch('/api/v1/auth/csrf', { credentials: 'same-origin' })
    .then(() => undefined)
    .finally(() => {
      csrfRequest = null;
    });
  await csrfRequest;
  return readCookie(CSRF_COOKIE);
}

api.use({
  async onRequest({ request }) {
    if (!isBrowser || SAFE_METHODS.has(request.method)) return request;
    const token = await ensureCsrfToken();
    if (token) request.headers.set(CSRF_HEADER, token);
    return request;
  }
});

// --- Errors ---------------------------------------------------------------------------------

export type ErrorResponse = components['schemas']['ErrorResponse'];

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
    public readonly details?: ReadonlyArray<{ field: string; problem: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function toApiError(response: Response, error: unknown): ApiError {
  const body = (error ?? {}) as Partial<ErrorResponse>;
  return new ApiError(
    response.status,
    body.code || `HTTP_${response.status}`,
    body.message || response.statusText || 'An unexpected API error occurred',
    body.requestId ?? response.headers.get('X-Request-Id') ?? undefined,
    body.details
  );
}

/** Unwraps an openapi-fetch result that carries a body, throwing an ApiError on failure. */
export async function unwrap<T, E>(
  promise: Promise<{ data?: T; error?: E; response: Response }>
): Promise<T> {
  const { data, error, response } = await promise;
  if (response.ok && data !== undefined) return data;
  throw toApiError(response, error);
}

/** Unwraps a call whose success has no body (204/202), throwing an ApiError on failure. */
export async function unwrapEmpty<E>(
  promise: Promise<{ error?: E; response: Response }>
): Promise<void> {
  const { error, response } = await promise;
  if (response.ok) return;
  throw toApiError(response, error);
}

/** A fresh key for endpoints marked `x-avenra-idempotency: key-required` (§103). */
export function idempotencyKey(): string {
  return crypto.randomUUID();
}

export type { components, paths };
