import { createAvenraClient, type ErrorResponse } from "@avenra/contracts";

const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "X-XSRF-TOKEN";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function readCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

/** Obtains the CSRF token once; the API sets it as a readable cookie (ADR-013). */
async function csrfToken(): Promise<string | undefined> {
  const existing = readCookie(CSRF_COOKIE);
  if (existing) {
    return existing;
  }
  await fetch("/api/v1/auth/csrf", { credentials: "same-origin" });
  return readCookie(CSRF_COOKIE);
}

/**
 * The typed API client, generated from the contract (ADR-008). It talks only
 * to this origin, which forwards `/api/*` to the API (ADR-013), and attaches the
 * CSRF token to state-changing requests.
 */
export const api = createAvenraClient({ baseUrl: "", credentials: "same-origin" });

api.use({
  async onRequest({ request }) {
    if (!SAFE_METHODS.has(request.method)) {
      const token = await csrfToken();
      if (token) {
        request.headers.set(CSRF_HEADER, token);
      }
    }
    return request;
  },
});

/** An API error with the server's user-safe message and per-field problems. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ErrorResponse | undefined,
  ) {
    super(body?.message ?? "Something went wrong. Please try again.");
  }

  get code(): string | undefined {
    return this.body?.code;
  }

  fieldProblem(field: string): string | undefined {
    return this.body?.details?.find((detail) => detail.field === field)?.problem;
  }
}

/** Unwraps an openapi-fetch result: the data, or an {@link ApiError}. */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.error !== undefined || !result.response.ok) {
    throw new ApiError(result.response.status, result.error as ErrorResponse | undefined);
  }
  return result.data as T;
}

/** A fresh idempotency key for operations that require one (Guidelines §30). */
export function idempotencyKey(): string {
  return `web-${crypto.randomUUID()}`;
}
