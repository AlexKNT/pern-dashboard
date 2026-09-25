import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { AppError, ConflictError, ValidationError } from "../../application/errors.js";
import { logger } from "../../infrastructure/logging.js";

type ErrorWithCause = { code?: string; cause?: { code?: string }; type?: string; status?: number };

/**
 * Maps any thrown value to the one AppError family. Library failures translate to
 * their stable codes: a Postgres unique violation becomes a conflict, a malformed
 * JSON body becomes a validation error, and everything else becomes an internal
 * error. Arcjet denials and the app's own errors already arrive as AppError.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const cause = error as ErrorWithCause;
  const code = cause.code ?? cause.cause?.code;

  if (code === "23505") {
    return new ConflictError("That value is already taken.");
  }

  if (error instanceof ZodError) {
    return new ValidationError(error.flatten());
  }

  if (error instanceof SyntaxError && cause.type === "entity.parse.failed") {
    return new ValidationError({
      fieldErrors: {},
      formErrors: ["The request body is not valid JSON."],
    });
  }

  return new AppError("internal", 500, "Something went wrong.");
}

/**
 * The one place an error becomes a response: a stable `{ error }` body with the
 * machine code, message and optional details. 5xx failures are also logged with
 * the request id, everything else is the caller's responsibility to handle.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) return;

  const appError = toAppError(error);

  res.status(appError.status).json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details === undefined ? {} : { details: appError.details }),
    },
  });

  if (appError.status >= 500) {
    logger.error({ err: error, requestId: res.getHeader("x-request-id") }, "unhandled error");
  }
}

/** The 404 for an unknown route, using the same error body as the handler above. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: { code: "not_found", message: "No such route." },
  });
}
