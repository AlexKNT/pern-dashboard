import type { AuthUser } from "../../application/identity/identity.js";
import type { ListQuery } from "../../application/shared/list.js";
import type { CreateClassInput } from "../../application/classes/classes.dto.js";
import type { ClassesService } from "../../application/classes/classes.service.js";

/**
 * The thin classes controller: binds the route context to the use case and returns
 * the bare DTO or list the route helper wraps.
 */
export function makeClassesController(service: ClassesService) {
  return {
    async createClass(ctx: { body: CreateClassInput; user: AuthUser }) {
      return service.createClass(ctx.user, ctx.body);
    },

    async listMyClasses(ctx: { query: ListQuery; user: AuthUser }) {
      return service.listMyClasses(ctx.user, ctx.query);
    },
  };
}
