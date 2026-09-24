import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Props for the block shown when a load or a mutation failed. */
export type ErrorStateProps = {
  /** The headline. Defaults to a plain statement of what happened. */
  title?: string;
  /** The detail, ideally the plainest useful restatement of the failure. */
  message?: string;
  /** The retry action, usually bound to the failed query's `refetch`. */
  onRetry: () => void;
  className?: string;
};

/**
 * The failure state for a region of a page: what went wrong and one way to try
 * again.
 *
 * It is announced as an alert, so a screen reader hears it when a load fails rather
 * than being left with a region that quietly stayed empty.
 */
export function ErrorState({
  title = "Something went wrong",
  message = "This did not load. Trying again usually works.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
    >
      <TriangleAlertIcon aria-hidden="true" className="size-8 text-destructive" />
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium">{title}</p>
        <p className="mx-auto max-w-prose text-sm text-muted-foreground">{message}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        <RotateCwIcon aria-hidden="true" data-icon="inline-start" />
        Try again
      </Button>
    </div>
  );
}
