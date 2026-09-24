import { useCallback, useEffect, useState } from "react";

/**
 * The open state of the command palette, shared between the header's Search button
 * and the `Ctrl+K` / `Cmd+K` shortcut, so both drive the same dialog.
 *
 * The shortcut is bound here rather than in the palette itself, so the two ways in
 * cannot drift apart.
 */
export function useCommandPalette(): {
  open: boolean;
  setOpen: (open: boolean) => void;
  openPalette: () => void;
} {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen, openPalette };
}
