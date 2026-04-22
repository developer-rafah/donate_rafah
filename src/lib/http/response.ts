import { NextResponse } from "next/server";
import { AppError, isAppError, type ErrorCode } from "@lib/errors";
import { logger } from "@lib/logging";

/**
 * Response envelope builders.
 *
 * Every API route must return responses shaped as:
 *
 *   success: { success: true, data: <payload> }
 *   error:   { success: false, error: { code, message } }
 *
 * Use `ok()` for success and `fail()` / `failFromError()` for errors.
 */

export type SuccessEnvelope<T> = {
  success: true;
  data: T;
};

export type ErrorEnvelope = {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    /**
     * Optional structured details — only included for validation errors.
     * Consumers should treat this as best-effort and not rely on its shape.
     */
    details?: unknown;
  };
};

export type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

export function ok<T>(data: T, init?: { status?: number; headers?: HeadersInit }) {
  return NextResponse.json<SuccessEnvelope<T>>(
    { success: true, data },
    { status: init?.status ?? 200, headers: init?.headers }
  );
}

export function fail(
  code: ErrorCode,
  message: string,
  status: number,
  details?: unknown
) {
  const body: ErrorEnvelope = {
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
  return NextResponse.json<ErrorEnvelope>(body, { status });
}

/**
 * Render any thrown value as a proper error response.
 * Known AppError instances are rendered faithfully; anything else is
 * logged and returned as a generic 500 to avoid leaking internals.
 */
export function failFromError(err: unknown): NextResponse<ErrorEnvelope> {
  if (isAppError(err)) {
    if (err.status >= 500) {
      logger.error("unhandled server error", { code: err.code, message: err.message, cause: (err as { cause?: unknown }).cause });
    }
    return fail(err.code, err.message, err.status, err.details);
  }

  logger.error("unknown error", { err });
  return fail("INTERNAL_ERROR", "An unexpected error occurred", 500);
}

/**
 * Convenience wrapper for route handlers. Catches thrown AppError and
 * anything else, forwards to `failFromError`. Keeps handler bodies clean.
 *
 *   export const GET = withErrorHandling(async () => {
 *     const data = await someService();
 *     return ok(data);
 *   });
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      return failFromError(err);
    }
  };
}

// Re-export AppError so callers can construct domain errors without
// digging into @lib/errors when the response builder is already imported.
export { AppError };
