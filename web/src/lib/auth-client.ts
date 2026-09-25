import { createAuthClient } from "better-auth/react";

/**
 * The Better Auth client, called on the web app's own origin. In development the
 * Vite proxy forwards `/api/auth` to the API, so the session cookie stays first
 * party. No base URL is set, so the client always talks to wherever it is served.
 */
export const authClient = createAuthClient();
