import { Link } from "react-router";
import { useLogout } from "@refinedev/core";
import { ChevronsUpDownIcon, LogOutIcon, UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  teacher: "Teacher",
  student: "Student",
};

/** The first letter of each of the first two words of a name, for the avatar. */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).slice(0, 2);
  const letters = words.map((word) => word.charAt(0).toUpperCase()).join("");
  return letters.length > 0 ? letters : "?";
}

/**
 * The header's account menu.
 *
 * It reads the session, so a visitor with no session sees a plain link to sign in
 * rather than a menu with nothing in it. A session whose role is absent or
 * unrecognised shows the account as disabled, never as a guessed role.
 */
export function UserMenu() {
  const { user, role } = useSession();
  const { mutate: logout, isPending } = useLogout();

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/sign-in">Sign in</Link>
      </Button>
    );
  }

  const roleLabel = role ? ROLE_LABELS[role] : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" aria-label="Account menu">
          <Avatar className="size-6">
            <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
          <ChevronsUpDownIcon aria-hidden="true" data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <UserIcon aria-hidden="true" />
            {roleLabel ?? "No role assigned"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => logout()} disabled={isPending}>
            <LogOutIcon aria-hidden="true" />
            {isPending ? "Signing out…" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
