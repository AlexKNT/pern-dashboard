import express, { type Express } from "express";

import { healthRouter } from "./routes/health.js";

/**
 * Builds the Express app with every router mounted.
 * The app is separate from the listener so tests can drive it without binding a port.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(healthRouter);

  return app;
}
