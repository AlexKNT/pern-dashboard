import type { NextFunction, Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";

import { auth } from "../../infrastructure/auth/auth.js";
import { protectAuthRoute } from "../../infrastructure/arcjet.js";

/** The Better Auth request handler, mounted at `/api/auth/*`. */
export const authHandler = toNodeHandler(auth);

/**
 * Rate limits the public sign in and sign up routes through Arcjet. Everything
 * else under `/api/auth` passes straight through, and when Arcjet has no key the
 * check is a no op.
 */
export function authProtection(req: Request, _res: Response, next: NextFunction): void {
  const isCredentialAttempt =
    req.method === "POST" &&
    (req.path.endsWith("/sign-in/email") || req.path.endsWith("/sign-up/email"));

  if (!isCredentialAttempt) {
    next();
    return;
  }

  protectAuthRoute(req).then(
    () => next(),
    (error: unknown) => next(error),
  );
}
