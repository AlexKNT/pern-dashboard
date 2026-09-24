import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Props for the heading block every page starts with. */
export type PageHeaderProps = {
  /** The page title. Rendered as the screen's only `<h1>`. */
  title: string;
  /** A short line under the title explaining what the page is for. */
  description?: string;
  /** The page's primary action, usually a button. Sits at the end of the row. */
  action?: ReactNode;
  /** Anything that belongs under the heading, such as filters or tabs. */
  children?: ReactNode;
  className?: string;
};

/**
 * The heading block at the top of a page: title, supporting line and the page's
 * primary action, with room underneath for filters or tabs.
 *
 * Using this rather than a bare heading keeps the title level, the spacing and the
 * action placement identical on every screen.
 */
export function PageHeader({ title, description, action, children, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-medium tracking-tight text-balance">{title}</h1>
          {description ? (
            <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
      {children}
    </header>
  );
}
