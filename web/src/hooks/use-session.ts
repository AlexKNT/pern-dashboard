import { useGetIdentity } from "@refinedev/core";
import type { Role } from "@/lib/navigation";

/** The signed in account, as the shell reads it. */
export type SessionIdentity = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

/** The three roles, so an unrecognised value is rejected rather than trusted. */
const ROLES: readonly string[] = ["admin", "teacher", "student"];

/**
 * The current session, from Refine's identity query.
 *
 * A role is only reported when the API sent one of the three known values: an
 * unrecognised or absent role is reported as `null`, which the navigation reads as
 * "show only the destinations that carry no role".
 */
export function useSession(): {
  user: SessionIdentity | null;
  role: Role | null;
  isLoading: boolean;
} {
  const { data, isLoading, isError } = useGetIdentity<SessionIdentity>();
  const user = data ?? null;

  const role = user?.role && ROLES.includes(user.role) ? (user.role as Role) : null;

  return { user, role, isLoading: isLoading && !isError };
}
