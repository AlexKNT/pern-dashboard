import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/**
 * Shared test setup.
 *
 * `cleanup` runs after every test so components do not leak into each other, and a
 * `matchMedia` stub is installed because jsdom does not implement it while both the
 * theme resolve and the sidebar's mobile hook read it on mount.
 */
vi.stubGlobal("matchMedia", createMatchMedia(false));

// Radix checks for pointer capture when a control is clicked. jsdom has no pointer
// events implementation, so these are stubbed for the component tests; the real
// pointer behaviour is covered in Playwright.
if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = () => undefined;
  HTMLElement.prototype.releasePointerCapture = () => undefined;
}

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => undefined;
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.stubGlobal("matchMedia", createMatchMedia(false));
});

/** A `matchMedia` stand in that reports the given colour scheme preference. */
function createMatchMedia(prefersDark: boolean): (query: string) => MediaQueryList {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const query = {
    matches: prefersDark,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    addListener: (listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeListener: (listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    dispatchEvent: (event: Event) => {
      for (const listener of listeners) listener(event as MediaQueryListEvent);
      return true;
    },
  } as unknown as MediaQueryList;

  return () => query;
}
