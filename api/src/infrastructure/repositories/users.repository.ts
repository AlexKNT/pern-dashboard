import { and, asc, eq, ilike, or, sql } from "drizzle-orm";

import { ConflictError } from "../../application/errors.js";
import type { Role } from "../../application/identity/identity.js";
import type { CreateUserInput, ListUsersQuery } from "../../application/users/users.dto.js";
import type { UserRow, UsersRepository } from "../../application/users/users.repository.js";
import { auth } from "../auth/auth.js";
import { user } from "../db/schema/auth.js";
import type { Executor } from "../db/transaction.js";

/** True when the error is Better Auth's "email already taken" API error. */
function isEmailTaken(error: unknown): boolean {
  const body = (error as { body?: { code?: string } }).body;
  return body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL";
}

/** Converts a selected user row to the application shape, trusting the role check. */
function toUserRow(row: { id: string; name: string; email: string; role: string }): UserRow {
  return { id: row.id, name: row.name, email: row.email, role: row.role as Role };
}

/**
 * The Drizzle implementation of the users repository. The executor is either the
 * database or a transaction, so every method runs in the context it is bound to.
 */
export function makeUsersRepository(executor: Executor): UsersRepository {
  return {
    async createUserWithCredential(input: CreateUserInput): Promise<UserRow> {
      try {
        const result = await auth.api.createUser({
          body: {
            email: input.email,
            password: input.password,
            name: input.name,
            // The admin plugin infers roles from its config, but accepts any
            // string at runtime; this slice only ever sends admin or teacher.
            role: input.role as unknown as "admin" | "user",
            // An admin-created account is trusted: no email verification needed.
            data: { emailVerified: true },
          },
        });
        const created = result.user;
        return {
          id: created.id,
          name: created.name,
          email: created.email,
          role: created.role as Role,
        };
      } catch (error) {
        if (isEmailTaken(error)) throw new ConflictError("That email is already taken.");
        throw error;
      }
    },

    async listUsers(query: ListUsersQuery & { role: Role }) {
      const search = query.q
        ? or(ilike(user.name, `%${query.q}%`), ilike(user.email, `%${query.q}%`))
        : undefined;

      const rows = await executor
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          total: sql<number>`count(*) over()::int`,
        })
        .from(user)
        .where(and(eq(user.role, query.role), search))
        .orderBy(asc(user.name))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize);

      return { items: rows.map(toUserRow), total: rows[0]?.total ?? 0 };
    },

    async findById(id: string) {
      const rows = await executor.select().from(user).where(eq(user.id, id)).limit(1);
      const row = rows[0];
      return row ? toUserRow(row) : null;
    },
  };
}
