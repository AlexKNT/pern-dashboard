import type { Role } from "../identity/identity.js";
import type { CreateUserInput, ListUsersQuery } from "./users.dto.js";

/** A user row as the repository reads and writes it. */
export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/**
 * How the application reads and writes users. The repository is bound to a
 * database or transaction executor at construction time, so its methods carry no
 * executor argument.
 */
export interface UsersRepository {
  /** Creates a user with a password credential through Better Auth. */
  createUserWithCredential(input: CreateUserInput): Promise<UserRow>;

  /** Lists users of one role, paginated, with an optional name or email search. */
  listUsers(query: ListUsersQuery & { role: Role }): Promise<{ items: UserRow[]; total: number }>;

  /** Reads one user by id, or null when it does not exist. */
  findById(id: string): Promise<UserRow | null>;
}
