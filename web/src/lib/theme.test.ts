import { describe, expect, it, vi } from "vitest";
import {
  applyTheme,
  isThemePreference,
  readThemePreference,
  resolveTheme,
  systemPrefersDark,
  THEME_STORAGE_KEY,
  watchSystemTheme,
  writeThemePreference,
} from "@/lib/theme";

/** A stand in for `localStorage` that records what was written. */
function fakeStorage(initial: Record<string, string> = {}) {
  const entries = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => void entries.set(key, value),
    entries,
  };
}

describe("resolveTheme", () => {
  it("returns the explicit preference when one is set", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("follows the system colour scheme when the preference is system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("readThemePreference", () => {
  it("reads a stored preference", () => {
    expect(readThemePreference(fakeStorage({ [THEME_STORAGE_KEY]: "dark" }))).toBe("dark");
  });

  it("defaults to system when the key is unset", () => {
    expect(readThemePreference(fakeStorage())).toBe("system");
  });

  it("defaults to system when the stored value is corrupt", () => {
    expect(readThemePreference(fakeStorage({ [THEME_STORAGE_KEY]: "chartreuse" }))).toBe("system");
    expect(readThemePreference(fakeStorage({ [THEME_STORAGE_KEY]: "{not json" }))).toBe("system");
  });

  it("defaults to system when storage throws", () => {
    const throwing = {
      getItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readThemePreference(throwing)).toBe("system");
  });
});

describe("writeThemePreference", () => {
  it("stores the preference under the documented key", () => {
    const storage = fakeStorage();
    writeThemePreference("dark", storage);
    expect(storage.entries.get(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("swallows a storage failure rather than breaking the session", () => {
    const throwing = {
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(() => writeThemePreference("dark", throwing)).not.toThrow();
  });
});

describe("applyTheme", () => {
  it("adds the dark class for dark and removes it for light", () => {
    const root = document.createElement("div");

    applyTheme("dark", root);
    expect(root.classList.contains("dark")).toBe(true);
    expect(root.style.colorScheme).toBe("dark");

    applyTheme("light", root);
    expect(root.classList.contains("dark")).toBe(false);
    expect(root.style.colorScheme).toBe("light");
  });
});

describe("isThemePreference", () => {
  it("accepts the three valid preferences and nothing else", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("solarized")).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});

describe("watchSystemTheme", () => {
  it("calls back when the system colour scheme changes", () => {
    const listener = vi.fn();
    let matches = false;
    const query = {
      get matches() {
        return matches;
      },
      addEventListener: (_type: string, handler: (event: MediaQueryListEvent) => void) => {
        listeners.push(handler);
      },
      removeEventListener: () => undefined,
    } as unknown as MediaQueryList;
    const listeners: ((event: MediaQueryListEvent) => void)[] = [];

    const unsubscribe = watchSystemTheme(query, listener);
    matches = true;
    for (const handler of listeners) handler({ matches: true } as MediaQueryListEvent);

    expect(listener).toHaveBeenCalledWith(true);
    unsubscribe();
  });

  it("does nothing when there is no media query", () => {
    expect(() => watchSystemTheme(null, vi.fn())()).not.toThrow();
  });

  it("reports the system preference from a query", () => {
    expect(systemPrefersDark({ matches: true } as MediaQueryList)).toBe(true);
    expect(systemPrefersDark(null)).toBe(false);
  });
});
