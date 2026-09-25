import { z } from "zod";

/**
 * The shared list query contract, used by every list endpoint.
 *
 * `page` is 1 based, `pageSize` is capped at 100, `sort` is a whitelisted field
 * with a leading `-` for descending order, and `q` is the search term across the
 * endpoint's searchable fields. The field whitelist means an unsortable field is
 * a validation error rather than a silent scan.
 */
export const listQuery = (fields: readonly string[]) =>
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .string()
      .optional()
      .refine((value) => !value || fields.includes(value.replace(/^-/, "")), {
        message: `Sort must be one of: ${fields.join(", ")}`,
      }),
    q: z.string().trim().optional(),
  });

/** A parsed list query, ready for a repository. */
export type ListQuery = {
  page: number;
  pageSize: number;
  sort?: string;
  q?: string;
};

/**
 * Splits a sort expression into its field and direction, defaulting to ascending
 * when no direction is given. The field is already whitelisted by listQuery.
 */
export function sortParts(sort: string | undefined): { field: string; descending: boolean } {
  if (!sort) return { field: "created_at", descending: true };
  if (sort.startsWith("-")) return { field: sort.slice(1), descending: true };
  return { field: sort, descending: false };
}
