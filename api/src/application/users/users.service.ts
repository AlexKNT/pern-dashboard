import type { AuthUser } from "../identity/identity.js";
import type { CreateUserInput, ListUsersQuery, UserDto } from "./users.dto.js";
import type { UsersRepository, UserRow } from "./users.repository.js";

/** Converts a user row to the DTO the API returns. */
function toUserDto(row: UserRow): UserDto {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

/**
 * The dependencies the users use cases need, generic over the transaction handle
 * so the application layer never imports the database client or ORM.
 */
export type UsersServiceDeps<Tx> = {
  db: Tx;
  users: (tx: Tx) => UsersRepository;
};

/**
 * Users use cases. Role checks live on the routes; these assume the caller has
 * already been authorised.
 */
export function makeUsersService<Tx>(deps: UsersServiceDeps<Tx>) {
  return {
    /** Creates a teacher or admin account through Better Auth. */
    async createUser(_actor: AuthUser, input: CreateUserInput): Promise<UserDto> {
      const row = await deps.users(deps.db).createUserWithCredential(input);
      return toUserDto(row);
    },

    /** Lists teachers, for the create class picker. */
    async listTeachers(query: ListUsersQuery): Promise<{ items: UserDto[]; total: number }> {
      const { items, total } = await deps.users(deps.db).listUsers({ ...query, role: "teacher" });
      return { items: items.map(toUserDto), total };
    },
  };
}

/** The public surface a users controller binds to. */
export type UsersService = ReturnType<typeof makeUsersService>;
