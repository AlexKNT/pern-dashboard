import { lt } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type * as schema from "./schema/index.js";
import { auditEntries } from "./schema/domain.js";

/** How long an audit entry is kept, in days. */
export const AUDIT_RETENTION_DAYS = 365;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Deletes audit entries older than the retention window.
 * Newer entries are kept, so the call is safe to run on a schedule.
 * Returns the number of rows removed.
 */
export async function pruneExpiredAuditEntries(
  db: NodePgDatabase<typeof schema>,
  now: Date,
): Promise<number> {
  const cutoff = new Date(now.getTime() - AUDIT_RETENTION_DAYS * MILLISECONDS_PER_DAY);

  const removed = await db
    .delete(auditEntries)
    .where(lt(auditEntries.createdAt, cutoff))
    .returning({ id: auditEntries.id });

  return removed.length;
}
