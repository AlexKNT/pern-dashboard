import type { NextFunction, Request, RequestHandler, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { ForbiddenError, UnauthenticatedError } from "../../application/errors.js";
import type { AuthUser, Role } from "../../application/identity/identity.js";
import { auth } from "../../infrastructure/auth/auth.js";

const ROLES: readonly string[] = ["admin", "teacher", "student"];

/** True when the value is one of the three roles the app knows. */
function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Resolves the Better Auth session and stores the authenticated user on
 * `res.locals.user`. Express 5 forwards the rejection when no valid session
 * exists, which the central error handler turns into a 401 or 403.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

  if (!session) throw new UnauthenticatedError();

  const { id, role } = session.user;
  if (!isRole(role)) {
    throw new ForbiddenError("Your account has no valid role.");
  }

  const user: AuthUser = { id, role };
  res.locals.user = user;
  next();
}

/**
 * Guards a route to the given roles. Must run after requireAuth, which is the
 * only thing that sets `res.locals.user`.
 */
export function requireRole(...roles: Role[]): RequestHandler {
  return (_req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user as AuthUser | undefined;
    if (!user) {
      next(new UnauthenticatedError());
      return;
    }
    if (!roles.includes(user.role)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}
