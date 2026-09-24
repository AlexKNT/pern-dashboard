import { useNavigate } from "react-router";
import { CommandPaletteDialog } from "@/components/command-palette-dialog";
import { useSession } from "@/hooks/use-session";
import { navigationItems, visibleNavigation } from "@/lib/navigation";

/** Props for the palette, driven by whoever owns the open state. */
export type CommandPaletteProps = {
  /** Whether the palette is showing. */
  open: boolean;
  /** Called when it opens or closes, so focus returns to the trigger on close. */
  onOpenChange: (open: boolean) => void;
};

/**
 * The app's command palette: the destinations the current role may reach, opened
 * from the header's Search button or `Ctrl+K` / `Cmd+K`.
 *
 * It reads the same navigation declaration the sidebar does, so the two can never
 * disagree about where a destination lives or who may see it. Only destinations are
 * offered, so the palette stays navigation rather than an action surface with side
 * effects behind a keystroke.
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { role } = useSession();
  const items = visibleNavigation(navigationItems, role);

  return (
    <CommandPaletteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Go to"
      description="Search the destinations you can reach."
      placeholder="Go to a page..."
      emptyMessage="No matching destination."
      groupLabel="Destinations"
      options={items.map((item) => ({
        label: item.label,
        icon: item.icon ? <item.icon aria-hidden="true" className="size-4" /> : undefined,
        onSelect: () => navigate(item.to),
      }))}
    />
  );
}
