import type { Request } from "express";

import type { AuthUser } from "../../application/identity/identity.js";
import type { JoinClassInput, RosterQuery } from "../../application/enrollments/enrollments.dto.js";
import type { EnrollmentsService } from "../../application/enrollments/enrollments.service.js";
import { protectJoinRoute } from "../../infrastructure/arcjet.js";

/**
 * The thin enrollments controller: binds the route context to the use case. Join
 * is the one route that rate limits through Arcjet, which needs the raw request.
 */
export function makeEnrollmentsController(service: EnrollmentsService) {
  return {
    async join(ctx: { body: JoinClassInput; user: AuthUser; request: Request }) {
      await protectJoinRoute(ctx.request);
      return service.join(ctx.user, ctx.body);
    },

    async leave(ctx: { params: { id: string }; user: AuthUser }) {
      return service.leave(ctx.user, ctx.params.id);
    },

    async roster(ctx: { params: { id: string }; query: RosterQuery; user: AuthUser }) {
      return service.listRoster(ctx.user, ctx.params.id, ctx.query);
    },
  };
}
