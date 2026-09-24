import { Link } from "react-router";
import type { LucideIcon } from "lucide-react";
import { InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Props for the block shown when a collection has nothing in it. */
export type EmptyStateProps = {
  /** The headline, in the words of the person looking at it. */
  title: string;
  /** An optional line explaining why it is empty or what will fill it. */
  description?: string;
  /** The one next step, as a label and the route it goes to. */
  action?: { label: string; to: string };
  /** An optional mark. Defaults to an inbox. */
  icon?: LucideIcon;
  className?: string;
};

/**
 * The empty state for a list or table: a mark, a headline, an explanation and,
 * wherever there is something the reader can do about it, the one next step.
 *
 * Used rather than blank space so an empty collection never looks like a failure.
 */
export function EmptyState({
  title,
  description,
  action,
  icon: Icon = InboxIcon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-8 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium">{title}</p>
        {description ? (
          <p className="mx-auto max-w-prose text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Button asChild variant="outline" size="sm">
          <Link to={action.to}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
