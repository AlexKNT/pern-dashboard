import type { AuthProvider } from "@refinedev/core";

import { authClient } from "@/lib/auth-client";

/** The shape of the session the shell reads, or `null` when nobody is signed in. */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

/** The three roles Better Auth may report. Anything else is treated as no role. */
const ROLES = ["admin", "teacher", "student"] as const;

/** Reads the current session and normalises its role to the three known values. */
function toSessionUser(raw: {
  id: string;
  name: string;
  email: string;
  role?: string;
}): SessionUser {
  const role =
    typeof raw.role === "string" && (ROLES as readonly string[]).includes(raw.role)
      ? raw.role
      : undefined;
  return { id: raw.id, name: raw.name, email: raw.email, ...(role ? { role } : {}) };
}

/** Reads the current session, reporting no session when the request cannot fail. */
async function readSession(): Promise<SessionUser | null> {
  try {
    const { data } = await authClient.getSession();
    if (!data) return null;
    const user = data.user as { id: string; name: string; email: string; role?: string };
    return toSessionUser(user);
  } catch {
    return null;
  }
}

/**
 * Refine's view of authentication, backed by the Better Auth client.
 *
 * `getIdentity` is what the shell reads to decide the role for the navigation,
 * and `check` is what the router guard uses. A visitor with no session is reported
 * as unauthenticated rather than as an error, so the redirect to `/sign-in` is a
 * normal path and never an unhandled failure.
 */
export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    if (!email || !password) {
      return {
        success: false,
        error: { name: "SignInError", message: "Email and password are required." },
      };
    }
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      return {
        success: false,
        error: { name: "SignInError", message: error.message ?? "Sign in failed." },
      };
    }
    return { success: true, redirectTo: "/" };
  },
  logout: async () => {
    await authClient.signOut();
    return { success: true, redirectTo: "/sign-in" };
  },
  check: async () => {
    const user = await readSession();
    return user
      ? { authenticated: true }
      : {
          authenticated: false,
          redirectTo: "/sign-in",
          error: { name: "Unauthenticated", message: "Sign in to continue." },
        };
  },
  getIdentity: async () => {
    const user = await readSession();
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  },
  onError: async (error) => {
    const status =
      typeof error === "object" && error !== null
        ? (error as { statusCode?: number }).statusCode
        : undefined;
    if (status === 401 || status === 403) return { logout: true, redirectTo: "/sign-in" };
    return { error };
  },
};
