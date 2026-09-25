import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config for generating and applying migrations.
 * Migrations run over the direct (unpooled) Neon connection when it is set,
 * falling back to the pooled one. See the neon-postgres skill notes.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/infrastructure/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
});
