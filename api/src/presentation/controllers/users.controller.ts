import type { AuthUser } from "../../application/identity/identity.js";
import type { CreateUserInput, ListUsersQuery } from "../../application/users/users.dto.js";
import type { UsersService } from "../../application/users/users.service.js";

/**
 * The thin users controller: binds the route context to the use case and returns
 * the bare DTO the route helper wraps.
 */
export function makeUsersController(service: UsersService) {
  return {
    async createUser(ctx: { body: CreateUserInput; user: AuthUser }) {
      return service.createUser(ctx.user, ctx.body);
    },

    async listTeachers(ctx: { query: ListUsersQuery }) {
      return service.listTeachers(ctx.query);
    },
  };
}
