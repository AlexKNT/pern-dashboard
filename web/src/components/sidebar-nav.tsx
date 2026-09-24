import { NavLink } from "react-router";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { groupNavigation, type NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Props for the sidebar's destination list. */
export type SidebarNavProps = {
  /** The destinations this session may see, already filtered by role. */
  items: NavigationItem[];
  className?: string;
};

/**
 * The sidebar's destination list, grouped by the `group` field on each item.
 *
 * The list it renders is passed in already filtered by role, so this component only
 * lays out what it is given. The active destination is marked with `aria-current`,
 * which is also what carries the selected styling.
 */
export function SidebarNav({ items, className }: SidebarNavProps) {
  const groups = groupNavigation(items);

  return (
    <nav aria-label="Main" className={cn("flex flex-col gap-2", className)}>
      {groups.map((group, index) => (
        <SidebarGroup key={group.label ?? `group-${String(index)}`}>
          {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
          <SidebarMenu>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild tooltip={item.label}>
                  <NavLink to={item.to} end={item.to === "/"}>
                    {item.icon ? <item.icon aria-hidden="true" /> : null}
                    <span>{item.label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </nav>
  );
}
