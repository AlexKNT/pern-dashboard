import { describe, expect, it } from "vitest";
import {
  groupNavigation,
  navigationItems,
  visibleNavigation,
  type NavigationItem,
  type Role,
} from "@/lib/navigation";

describe("visibleNavigation", () => {
  it("shows only the destinations that carry no role when the session has none", () => {
    const visible = visibleNavigation(navigationItems, null);
    expect(visible.map((item) => item.to)).toContain("/");
    expect(visible.map((item) => item.to)).toContain("/classes");
    expect(visible.map((item) => item.to)).not.toContain("/departments");
    expect(visible.map((item) => item.to)).not.toContain("/audit");
  });

  it("never grants a role marked destination to an absent role", () => {
    for (const item of navigationItems) {
      if (!item.roles) continue;
      expect(visibleNavigation(navigationItems, null)).not.toContain(item);
      expect(visibleNavigation(navigationItems, undefined)).not.toContain(item);
    }
  });

  it("shows an admin the administration group", () => {
    const visible = visibleNavigation(navigationItems, "admin");
    expect(visible.map((item) => item.to)).toContain("/departments");
    expect(visible.map((item) => item.to)).toContain("/people");
    expect(visible.map((item) => item.to)).toContain("/audit");
    expect(visible.map((item) => item.to)).not.toContain("/my-classes");
  });

  it("shows a teacher their own sessions but not the departments", () => {
    const visible = visibleNavigation(navigationItems, "teacher");
    expect(visible.map((item) => item.to)).toContain("/sessions");
    expect(visible.map((item) => item.to)).toContain("/subjects");
    expect(visible.map((item) => item.to)).not.toContain("/departments");
    expect(visible.map((item) => item.to)).not.toContain("/my-classes");
  });

  it("shows a student their classes and the shared destinations only", () => {
    const visible = visibleNavigation(navigationItems, "student");
    expect(visible.map((item) => item.to)).toContain("/my-classes");
    expect(visible.map((item) => item.to)).toContain("/");
    expect(visible.map((item) => item.to)).not.toContain("/schedule");
    expect(visible.map((item) => item.to)).not.toContain("/audit");
  });

  it("treats an unrecognised role as no role at all", () => {
    const items: NavigationItem[] = [
      { label: "Shared", to: "/shared" },
      { label: "Admins", to: "/admins", roles: ["admin"] },
    ];
    const stranger = "parent" as Role;
    expect(visibleNavigation(items, stranger).map((item) => item.to)).toEqual(["/shared"]);
  });

  it("keeps the declaration order", () => {
    const visible = visibleNavigation(navigationItems, "admin");
    expect(visible[0]?.to).toBe("/");
  });
});

describe("groupNavigation", () => {
  it("puts ungrouped destinations first and groups the rest under their heading", () => {
    const groups = groupNavigation(visibleNavigation(navigationItems, "admin"));

    expect(groups[0]?.label).toBeNull();
    expect(groups[0]?.items.every((item) => item.group === undefined)).toBe(true);
    expect(groups.map((group) => group.label)).toContain("Administration");
  });

  it("returns no groups for an empty list", () => {
    expect(groupNavigation([])).toEqual([]);
  });
});
