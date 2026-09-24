import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useSession } from "@/hooks/use-session";

/**
 * Everything inside the app is behind this: a visitor with no session is sent to the
 * sign in route.
 *
 * The check is explicit rather than Refine's `Authenticated` guard, because that
 * guard renders nothing while the session query is in flight, which leaves a blank
 * screen. Here the shell's own session state decides: while the session is still
 * being read the guard renders nothing because it is about to resolve one way or the
 * other, a real session renders the page, and no session is a normal redirect.
 *
 * A session request that failed is treated as no session, so a visitor whose API is
 * down reaches the sign in screen rather than a blank page or a half built shell.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const { user, isLoading } = useSession();

  if (isLoading) return null;
  if (!user) return <Navigate to="/sign-in" replace />;

  return children;
}

/**
 * Keeps a visitor who already has a session away from the sign in screen.
 *
 * Renders nothing while the session is being read, and renders the page when the
 * session request failed: a broken API must not bounce somebody between two routes
 * forever, and the sign in page is the safest place to be when the session is
 * unknown.
 */
export function SignInGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useSession();

  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;

  return children;
}
