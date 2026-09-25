import { describe, expect, it } from "vitest";

import { uuidv7 } from "./uuid.js";

/** The UUID v7 shape: 8-4-4-4-12 hex, with version 7 and the RFC 4122 variant. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuidv7", () => {
  it("produces a valid v7 uuid every time", () => {
    for (let i = 0; i < 1000; i += 1) {
      expect(uuidv7()).toMatch(UUID_PATTERN);
    }
  });

  it("produces unique ids", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => uuidv7()));
    expect(ids.size).toBe(1000);
  });
});
