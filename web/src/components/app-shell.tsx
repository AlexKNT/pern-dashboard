import { Link, useLocation } from "react-router";
import type { ReactNode } from "react";
import { GraduationCapIcon, SearchIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserMenu } from "@/components/user-menu";
import { CommandPalette } from "@/components/command-palette";
import { useSession } from "@/hooks/use-session";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { navigationItems, visibleNavigation } from "@/lib/navigation";
import { readSidebarDefaultOpen } from "@/lib/sidebar-state";

/** Props for the frame every signed in screen renders inside. */
export type AppShellProps = {
  /** The routed page. */
  children: ReactNode;
};

/**
 * The application frame: a collapsible sidebar, a sticky header and the page.
 *
 * The sidebar's collapsed state is read from the `sidebar_state` cookie on the very
 * first render and written back by the sidebar provider when it changes, so a reload
 * never flashes the wrong width. Below 768 pixels the same sidebar becomes a sheet.
 */
export function AppShell({ children }: AppShellProps) {
  const { user, role, isLoading } = useSession();
  const items = visibleNavigation(navigationItems, role);
  const crumbs = useBreadcrumbs();
  const { open, setOpen, openPalette } = useCommandPalette();

  // The navigation renders with the resolved role as soon as it is known. While the
  // session is still being read, or when the request failed, the shell shows the
  // destinations that carry no role rather than blocking on the API.
  const sessionKnown = !isLoading && user !== null;

  return (
    <SidebarProvider defaultOpen={readSidebarDefaultOpen()}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <Link
            to="/"
            className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-sidebar-foreground"
          >
            <GraduationCapIcon aria-hidden="true" className="size-5" />
            <span className="truncate group-data-[collapsible=icon]:hidden">
              PERN Admin Dashboard
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav items={items} />
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border">
          <span className="px-2 py-1.5 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            {sessionKnown && role ? `Signed in as ${role}` : "Academic management"}
          </span>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              {crumbs.map((crumb, index) => (
                <BreadcrumbItem key={crumb.to}>
                  {index > 0 ? <BreadcrumbSeparator /> : null}
                  {index === crumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.to}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => openPalette()}
              aria-keyshortcuts="Control+K Meta+K"
            >
              <SearchIcon aria-hidden="true" data-icon="inline-start" />
              <span className="hidden sm:inline">Search</span>
              <span className="hidden text-xs text-muted-foreground sm:inline" aria-hidden="true">
                Ctrl K
              </span>
            </Button>
            <ThemeSwitcher />
            <UserMenu />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">{children}</main>
      </SidebarInset>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </SidebarProvider>
  );
}

/** One step of the trail shown in the header. */
type Crumb = { label: string; to: string };

/** Build the trail from the current route and the navigation declaration. */
function useBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation();

  const match = navigationItems.find((item) => item.to === pathname);
  if (!match || match.to === "/") return [{ label: "Dashboard", to: "/" }];

  return [
    { label: "Dashboard", to: "/" },
    { label: match.label, to: match.to },
  ];
}
