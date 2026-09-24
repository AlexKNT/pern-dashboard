/**
 * Reading the sidebar's collapsed state.
 *
 * The state lives in a cookie rather than `localStorage` on purpose: the server and
 * the very first client render both need to know the width before anything paints,
 * and a cookie is the one thing available to both. The cookie is written by the
 * sidebar provider in `components/ui/sidebar.tsx`, which owns its name and lifetime.
 */

/** The cookie the sidebar provider writes. */
export const SIDEBAR_COOKIE_NAME = "sidebar_state";

/**
 * Whether the sidebar should start expanded.
 *
 * An absent or unreadable cookie means expanded, which is the safer default: a
 * visitor who has never chosen sees the full navigation rather than an icon rail.
 */
export function readSidebarDefaultOpen(cookieHeader?: string): boolean {
  const source = cookieHeader ?? readCookieString();
  const match = new RegExp(`(?:^|;\\s*)${SIDEBAR_COOKIE_NAME}=([^;]*)`).exec(source);
  return match?.[1] !== "false";
}

function readCookieString(): string {
  try {
    return document.cookie;
  } catch {
    return "";
  }
}
