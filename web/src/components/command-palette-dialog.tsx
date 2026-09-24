import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SearchIcon } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * A small command palette: a search field over a filtered list of options.
 *
 * It is built here rather than pulled from a package because the available command
 * menu library was not usable with this project's React version, and the behaviour
 * this needs is small and worth owning: arrow keys and enter move and pick, escape
 * closes, and the options are real buttons so the keyboard and screen reader paths
 * come for free.
 */

/** One selectable entry. */
export type CommandOption = {
  /** The text that is shown, filtered on and announced. */
  label: string;
  /** A mark shown before the label. */
  icon?: ReactNode;
  /** What to do when the option is chosen. */
  onSelect: () => void;
};

/** Props for the palette. */
export type CommandPaletteDialogProps = {
  /** Whether the palette is showing. */
  open: boolean;
  /** Called when it opens or closes, so focus returns to the trigger on close. */
  onOpenChange: (open: boolean) => void;
  /** The heading announced for the dialog. */
  title: string;
  /** A line describing what the palette does. */
  description: string;
  /** The placeholder for the search field. */
  placeholder: string;
  /** Shown when the query matches nothing. */
  emptyMessage: string;
  /** The entries, before filtering. */
  options: CommandOption[];
  /** The heading above the list. */
  groupLabel: string;
  className?: string;
};

/** Case and accent insensitive match, so `enrol` finds `Enrolment`. */
function normalise(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function CommandPaletteDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  emptyMessage,
  options,
  groupLabel,
  className,
}: CommandPaletteDialogProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const needle = normalise(query.trim());
    if (needle.length === 0) return options;
    return options.filter((option) => normalise(option.label).includes(needle));
  }, [options, query]);

  /*
    Reset on open through the change handler rather than an effect, so the query never
    survives a close and reopen, and no state is set during render or in a cascading
    effect.
  */
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setQuery("");
      setActiveIndex(0);
    }
    onOpenChange(next);
  };

  // Keep the active option in view as the arrows move through the list.
  useEffect(() => {
    const active = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, filtered.length]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (filtered.length === 0 ? 0 : (current + 1) % filtered.length));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        filtered.length === 0 ? 0 : (current - 1 + filtered.length) % filtered.length,
      );
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(Math.max(0, filtered.length - 1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (!option) return;
      handleOpenChange(false);
      option.onSelect();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn("top-1/4 max-w-lg translate-y-0 gap-3 p-3", className)}
        showCloseButton={false}
        onKeyDown={onKeyDown}
      >
        <h2 className="sr-only">{title}</h2>
        <p className="sr-only">{description}</p>

        <div className="relative">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            aria-controls="command-options"
            aria-activedescendant={
              filtered[activeIndex] ? `command-option-${String(activeIndex)}` : undefined
            }
            role="combobox"
            aria-expanded="true"
            className="pl-8"
          />
        </div>

        <div className="flex flex-col gap-1">
          <p className="px-1 text-xs font-medium text-muted-foreground">{groupLabel}</p>
          {filtered.length === 0 ? (
            <p className="px-1 py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
          ) : (
            <ul
              id="command-options"
              ref={listRef}
              role="listbox"
              aria-label={groupLabel}
              className="max-h-72 overflow-y-auto"
            >
              {filtered.map((option, index) => (
                <li key={option.label} role="presentation">
                  <button
                    type="button"
                    id={`command-option-${String(index)}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    data-active={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      handleOpenChange(false);
                      option.onSelect();
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                      index === activeIndex
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground",
                    )}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
