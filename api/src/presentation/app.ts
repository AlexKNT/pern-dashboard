import express, { type Express } from "express";

import type { ClassesService } from "../application/classes/classes.service.js";
import type { EnrollmentsService } from "../application/enrollments/enrollments.service.js";
import type { UsersService } from "../application/users/users.service.js";
import { errorHandler, notFoundHandler } from "./http/error-handler.js";
import { requestId } from "./http/request-id.js";
import { authHandler, authProtection } from "./routes/auth.routes.js";
import { makeClassesRouter } from "./routes/classes.routes.js";
import { makeEnrollmentsRouter } from "./routes/enrollments.routes.js";
import { healthRouter } from "./routes/health.js";
import { makeMeRouter } from "./routes/me.routes.js";
import { makeUsersRouter } from "./routes/users.routes.js";

/** Every service the API composes, built once in the composition root. */
export type Services = {
  users: UsersService;
  classes: ClassesService;
  enrollments: EnrollmentsService;
};

/**
 * Builds the Express app with every router mounted.
 *
 * Mount order: request id, JSON body, the liveness probe, Better Auth at
 * `/api/auth`, the versioned routers, the 404, then the error handler last.
 * The app is separate from the listener so tests can drive it without a port.
 */
export function createApp(services: Services): Express {
  const app = express();

  app.use(requestId);
  app.use(express.json({ limit: "1mb" }));
  app.use(healthRouter);

  app.all("/api/auth/*splat", authProtection, authHandler);

  app.use(makeUsersRouter(services.users));
  app.use(makeClassesRouter(services.classes));
  app.use(makeEnrollmentsRouter(services.enrollments));
  app.use(makeMeRouter(services.classes));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
