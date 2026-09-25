/**
 * The identity types every use case and guard reads.
 *
 * A role is one of three values, and an authenticated caller is a plain object
 * with their id and role. This is the one place the roles are named in the API.
 */
export type Role = "admin" | "teacher" | "student";

/** An authenticated caller, extracted from the Better Auth session. */
export type AuthUser = {
  id: string;
  role: Role;
};
