import { randomBytes } from "node:crypto";

/**
 * Generates a time-ordered UUID v7.
 *
 * The first 48 bits are the unix timestamp in milliseconds, which keeps ids
 * roughly sorted by creation time. The rest is random, with the version 7 and
 * RFC 4122 variant bits set.
 */
export function uuidv7(): string {
  const bytes = randomBytes(16);
  const millis = BigInt(Date.now());

  for (let i = 0; i < 6; i += 1) {
    bytes[i] = Number((millis >> BigInt(40 - i * 8)) & 0xffn);
  }

  bytes[6] = 0x70 | (bytes[6]! & 0x0f); // version 7
  bytes[8] = 0x80 | (bytes[8]! & 0x3f); // RFC 4122 variant

  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
