import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const ID_PATTERN = /^[a-zA-Z0-9-]{1,128}$/;

/**
 * Gives every request an id: honours a sane inbound `x-request-id`, generates a
 * UUID otherwise, and echoes it back on the response. The id is also stored on
 * `res.locals.requestId` for the logger and the error handler to bind to.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const inbound = req.get("x-request-id");
  const id = inbound && ID_PATTERN.test(inbound) ? inbound : randomUUID();

  res.setHeader("x-request-id", id);
  res.locals.requestId = id;
  next();
}
