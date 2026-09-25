import { randomInt } from "node:crypto";

/**
 * A class join code: six characters, upper case, from an alphabet with no
 * ambiguous look alikes (no 0/O, no 1/I/L), so a student can read it off a
 * screen and type it without guessing.
 */
export const JOIN_CODE_LENGTH = 6;

/** The unambiguous alphabet join codes are drawn from. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Generates a join code. The random source is injectable so tests can pin it.
 */
export function generateJoinCode(
  random: (max: number) => number = (max) => randomInt(max),
): string {
  let code = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i += 1) {
    code += ALPHABET[random(ALPHABET.length)]!;
  }
  return code;
}

/** Normalises a typed join code to the form the database stores: trimmed, upper. */
export function normalizeJoinCode(input: string): string {
  return input.trim().toUpperCase();
}
