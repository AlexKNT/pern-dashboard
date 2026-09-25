import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "../config/env.js";
import * as schema from "./schema/index.js";

/**
 * The Drizzle client for the API, backed by a pooled Neon connection.
 * Importing this module validates the environment and throws when DATABASE_URL
 * is missing, so the process fails fast instead of mid request.
 */
export const db = drizzle(new Pool({ connectionString: env.DATABASE_URL }), { schema });
