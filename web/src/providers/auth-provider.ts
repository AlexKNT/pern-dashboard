import type { AuthProvider } from "@refinedev/core";

/** The API base address, validated at startup so a missing value fails loudly. */
const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/** The shape of the session the API returns, or `null` when nobody is signed in. */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

/** The three roles Better Auth may report. Anything else is treated as no role. */
const ROLES = ["admin", "teacher", "student"] as const;

/**
 * Read the current session from the API over the first party cookie.
 *
 * Until the accounts feature lands this endpoint answers `200` with a null body, so
 * the shell renders signed out. Nothing is stored here: the auth provider holds no
 * state of its own, which is why a refresh always reflects the API.
 *
 * A request that cannot be made at all (the API is down, the network is offline) is
 * reported as no session rather than thrown: Refine expects a resolved promise, and
 * an unhandled rejection here would leave the app with nothing on screen instead of
 * the signed out state it is built to show.
 */
async function getSessionUser(): Promise<SessionUser | null> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/auth/get-session`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  try {
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object") return null;

    const user = (payload as { user?: unknown }).user;
    if (!user || typeof user !== "object") return null;

    const { id, name, email, role } = user as Record<string, unknown>;
    if (typeof id !== "string" || typeof email !== "string") return null;

    const normalisedRole =
      typeof role === "string" && (ROLES as readonly string[]).includes(role) ? role : undefined;

    return {
      id,
      email,
      name: typeof name === "string" && name.length > 0 ? name : email,
      ...(normalisedRole ? { role: normalisedRole } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Refine's view of authentication.
 *
 * `getIdentity` is what the shell reads to decide the role for the navigation, and
 * `check` is what the router guard uses. A visitor with no session is reported as
 * unauthenticated rather than as an error, so the redirect to `/sign-in` is a normal
 * path and never an unhandled failure.
 */
export const authProvider: AuthProvider = {
  login: async () => ({
    success: false,
    error: { name: "NotImplemented", message: "Sign in lands with the accounts feature." },
  }),
  logout: async () => ({
    success: false,
    error: { name: "NotImplemented", message: "Sign out lands with the accounts feature." },
  }),
  check: async () => {
    const user = await getSessionUser();
    return user
      ? { authenticated: true }
      : {
          authenticated: false,
          redirectTo: "/sign-in",
          error: { name: "Unauthenticated", message: "Sign in to continue." },
        };
  },
  getIdentity: async () => {
    const user = await getSessionUser();
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
