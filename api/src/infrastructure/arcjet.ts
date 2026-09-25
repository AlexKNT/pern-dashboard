import arcjet, { shield, slidingWindow } from "@arcjet/node";
import type { Request } from "express";

import { RateLimitedError } from "../application/errors.js";
import { env } from "./config/env.js";

/**
 * The Arcjet client for the API, created only when ARCJET_KEY is set. When the key
 * is absent the API runs without Arcjet, and every protection helper is a no op.
 * Shield is the base rule so every protected route gets SQLi and XSS defence.
 */
const client = env.ARCJET_KEY
  ? arcjet({
      key: env.ARCJET_KEY,
      rules: [shield({ mode: "LIVE" })],
    })
  : null;

/** Rate limits sign in and sign up, to slow credential stuffing. */
const authRule = client?.withRule(slidingWindow({ mode: "LIVE", interval: 60, max: 10 }));

/** Rate limits join attempts, to slow join code guessing. */
const joinRule = client?.withRule(slidingWindow({ mode: "LIVE", interval: 60, max: 20 }));

/**
 * Runs Arcjet for the public auth routes. A denial becomes a rate limited error,
 * and when Arcjet is not configured the call simply passes through.
 */
export async function protectAuthRoute(request: Request): Promise<void> {
  if (!authRule) return;
  const decision = await authRule.protect(request);
  if (decision.isDenied()) throw new RateLimitedError();
}

/** Runs Arcjet for the join route. See protectAuthRoute. */
export async function protectJoinRoute(request: Request): Promise<void> {
  if (!joinRule) return;
  const decision = await joinRule.protect(request);
  if (decision.isDenied()) throw new RateLimitedError();
}
