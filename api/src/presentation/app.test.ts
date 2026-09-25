import request from "supertest";
import { describe, expect, it } from "vitest";

import type { Services } from "./app.js";
import { createApp } from "./app.js";

/**
 * The API envelope contract: a stable `{ error }` body for every failure, and a
 * clean 404 for an unknown route. These run against stub services, because the
 * failure paths here never reach a service.
 */
const app = createApp({} as Services);

describe("API error envelope", () => {
  it("returns the error envelope for an unknown route", async () => {
    const response = await request(app).get("/no-such-route");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "not_found", message: "No such route." },
    });
  });

  it("returns unauthenticated for a protected route without a session", async () => {
    const response = await request(app).get("/api/v1/me/classes");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("unauthenticated");
  });

  it("returns a request id header on every response", async () => {
    const response = await request(app).get("/no-such-route");

    expect(response.headers["x-request-id"]).toBeTruthy();
  });
});
