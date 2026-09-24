import { describe, expect, it } from "vitest";
import { readSidebarDefaultOpen, SIDEBAR_COOKIE_NAME } from "@/lib/sidebar-state";

describe("readSidebarDefaultOpen", () => {
  it("starts expanded when the cookie is absent", () => {
    expect(readSidebarDefaultOpen("")).toBe(true);
  });

  it("starts expanded when the cookie says true", () => {
    expect(readSidebarDefaultOpen(`${SIDEBAR_COOKIE_NAME}=true`)).toBe(true);
  });

  it("starts collapsed when the cookie says false", () => {
    expect(readSidebarDefaultOpen(`${SIDEBAR_COOKIE_NAME}=false`)).toBe(false);
    expect(readSidebarDefaultOpen(`other=1; ${SIDEBAR_COOKIE_NAME}=false; theme=dark`)).toBe(false);
  });

  it("ignores an unrelated cookie that merely contains the name", () => {
    expect(readSidebarDefaultOpen("not_sidebar_state=false")).toBe(true);
  });
});
