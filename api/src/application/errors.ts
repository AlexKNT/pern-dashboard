/**
 * The one error family the API throws, with a stable machine code for every
 * failure. Plain TypeScript only: no framework or HTTP imports, so the domain
 * and application layers can throw these without reaching for Express.
 */

/** The closed set of machine readable error codes the API returns. */
export type ErrorCode =
  | "validation"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "internal";

/** A typed application error carrying its code, HTTP status and optional details. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: unknown;

  constructor(code: ErrorCode, status: number, message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/** The request failed validation; `details` is Zod's `error.flatten()` shape. */
export class ValidationError extends AppError {
  constructor(details: unknown) {
    super("validation", 400, "The request is not valid.", details);
  }
}

/** The resource does not exist. */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super("not_found", 404, message);
  }
}

/** No valid session, or the session could not be established. */
export class UnauthenticatedError extends AppError {
  constructor() {
    super("unauthenticated", 401, "Sign in first.");
  }
}

/** A valid session, but the caller may not act on this resource. */
export class ForbiddenError extends AppError {
  constructor(message = "You do not have access.") {
    super("forbidden", 403, message);
  }
}

/** The write conflicts with the current state of the data. */
export class ConflictError extends AppError {
  constructor(message: string) {
    super("conflict", 409, message);
  }
}

/** A rate limit denied the request. */
export class RateLimitedError extends AppError {
  constructor() {
    super("rate_limited", 429, "Too many requests.");
  }
}

/** True when the error is a Postgres unique violation, however it is wrapped. */
export function isUniqueViolation(error: unknown): boolean {
  const cause = error as { code?: string; cause?: { code?: string } };
  return (cause.code ?? cause.cause?.code) === "23505";
}
