import {
  BookOpenIcon,
  BuildingIcon,
  CalendarIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  ScrollTextIcon,
  UsersIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * The three roles the app knows about.
 * This is the one place they are named; everything else imports the type.
 */
export type Role = "admin" | "teacher" | "student";

/** One destination in the sidebar, the command palette and the breadcrumbs. */
export type NavigationItem = {
  /** What the destination is called. */
  label: string;
  /** The route it points at. */
  to: string;
  /** The mark shown beside it. */
  icon?: LucideIcon;
  /** The roles allowed to see it. Omit the field and every role sees it. */
  roles?: Role[];
  /** An optional grouping heading. Items without one render before the groups. */
  group?: string;
};

/** A named group of destinations, in the order the sidebar renders them. */
export type NavigationGroup = {
  /** The heading, or `null` for the ungrouped destinations at the top. */
  label: string | null;
  items: NavigationItem[];
};

/**
 * Every destination in the app, declared once, each carrying the roles allowed to
 * reach it.
 *
 * The role filter decides what is SHOWN, never what is permitted: every real check
 * happens on the API. See `web/design.md` and spec 0003's security model.
 */
export const navigationItems: readonly NavigationItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboardIcon },
  { label: "Departments", to: "/departments", icon: BuildingIcon, roles: ["admin"] },
  { label: "Subjects", to: "/subjects", icon: BookOpenIcon, roles: ["admin", "teacher"] },
  { label: "Classes", to: "/classes", icon: GraduationCapIcon },
  { label: "Schedule", to: "/schedule", icon: CalendarIcon, roles: ["admin", "teacher"] },
  { label: "People", to: "/people", icon: UsersIcon, roles: ["admin"] },
  { label: "My sessions", to: "/sessions", icon: CalendarIcon, roles: ["teacher"] },
  { label: "My classes", to: "/my-classes", icon: GraduationCapIcon, roles: ["student"] },
  {
    label: "Audit log",
    to: "/audit",
    icon: ScrollTextIcon,
    roles: ["admin"],
    group: "Administration",
  },
];

/**
 * Narrow the destination list to what a session may see.
 *
 * An absent or unrecognised role is treated as having no role at all, so it only
 * ever sees the destinations that carry no `roles` field.
 */
export function visibleNavigation(
  items: readonly NavigationItem[],
  role: Role | null | undefined,
): NavigationItem[] {
  return items.filter((item) => !item.roles || (role != null && item.roles.includes(role)));
}

/** Group the visible destinations for the sidebar, preserving declaration order. */
export function groupNavigation(items: readonly NavigationItem[]): NavigationGroup[] {
  const groups: NavigationGroup[] = [];

  for (const item of items) {
    const label = item.group ?? null;
    const existing = groups.find((group) => group.label === label);
    if (existing) existing.items.push(item);
    else groups.push({ label, items: [item] });
  }

  return groups;
}
