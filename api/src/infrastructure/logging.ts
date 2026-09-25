import { pino } from "pino";

/**
 * The one structured logger for the API.
 *
 * Every line it writes is JSON, and the two request headers that carry secrets
 * are redacted by name so they can never leak into the logs.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: ["req.headers.cookie", "req.headers.authorization"],
});

/**
 * A request scoped child logger that binds the request id, so every line written
 * during one request carries the same id and can be pulled together in the sink.
 */
export function requestLogger(requestId: string) {
  return logger.child({ requestId });
}
