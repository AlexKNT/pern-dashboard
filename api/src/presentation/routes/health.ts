import { Router } from "express";

/** Liveness probe: proves the process is running and answering HTTP. */
export const healthRouter = Router();

healthRouter.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});
