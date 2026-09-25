import { sql } from "drizzle-orm";
import { boolean, check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { uuidv7 } from "../uuid.js";

/**
 * The user account row, owned by Better Auth and extended with a role.
 *
 * Column names and the email_verified/created_at/updated_at types follow Better
 * Auth's standard schema (snake_case, timestamp without time zone). The id is a
 * uuid column so it can be referenced by the domain tables. Feature 8, the
 * accounts slice, must configure Better Auth with `advanced.database.generateId`
 * set to "uuid" so the adapter knows the column type.
 */
export const user = pgTable(
  "user",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    role: text("role").notNull().default("student"),
    // Admin plugin fields: banning is available but unused in this slice.
    banned: boolean("banned").notNull().default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    check("user_role_check", sql`${table.role} in ('admin', 'teacher', 'student')`),
    index("user_name_trgm_idx").using("gin", table.name.op("gin_trgm_ops")),
    index("user_email_trgm_idx").using("gin", table.email.op("gin_trgm_ops")),
  ],
);

/** A signed in browser session, Better Auth's standard schema, unchanged. */
export const session = pgTable(
  "session",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Admin plugin field: which admin opened this impersonation session, if any.
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

/** A linked sign in provider account, Better Auth's standard schema, unchanged. */
export const account = pgTable(
  "account",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

/** An email verification request, Better Auth's standard schema, unchanged. */
export const verification = pgTable(
  "verification",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);
