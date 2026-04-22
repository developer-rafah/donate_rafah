/**
 * Typed error classes used across services, repositories and route handlers.
 *
 * Every error carries:
 *   - a machine-readable `code`  (stable identifier, upper-snake-case)
 *   - a human `message`          (safe to expose to clients unless noted)
 *   - an http `status`           (what the route handler should return)
 *   - an optional `cause`        (original error, logged but never returned)
 *
 * The response builder (`@lib/http/response`) knows how to render these into
 * the agreed error envelope.
 */

export type ErrorCode =
  | "INTERNAL_ERROR"
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "BAD_REQUEST"
  | "DEPENDENCY_ERROR";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    status: number,
    options?: { cause?: unknown; details?: unknown }
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = options?.details;
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super("VALIDATION_ERROR", message, 422, { details });
    this.name = "ValidationError";
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = "Authentication required") {
    super("UNAUTHENTICATED", message, 401);
    this.name = "UnauthenticatedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("NOT_FOUND", message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super("CONFLICT", message, 409);
    this.name = "ConflictError";
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super("BAD_REQUEST", message, 400);
    this.name = "BadRequestError";
  }
}

export class DependencyError extends AppError {
  constructor(message = "Upstream dependency failed", cause?: unknown) {
    super("DEPENDENCY_ERROR", message, 502, { cause });
    this.name = "DependencyError";
  }
}

/**
 * Narrow unknown values to AppError.
 */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
