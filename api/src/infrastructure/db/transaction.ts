import { db } from "./client.js";

/**
 * A Drizzle query executor: the shared database client, or a transaction it has
 * opened. Repositories take this type so their methods can join a transaction.
 */
export type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Runs a multi step write in one transaction, passing the transactional executor
 * into the callback. The callback's return value is handed back unchanged.
 */
export async function withTransaction<T>(fn: (tx: Executor) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => fn(tx));
}
