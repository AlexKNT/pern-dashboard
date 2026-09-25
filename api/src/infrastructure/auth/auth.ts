import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { Resend } from "resend";

import { env } from "../config/env.js";
import { db } from "../db/client.js";
import { logger } from "../logging.js";

/**
 * The from address for verification mail in production. Deployment (feature 6)
 * should make this configurable alongside the Resend domain it must belong to.
 */
const MAIL_FROM = "PERN Admin Dashboard <no-reply@pern-dashboard.app>";

/** Resend is created only when a key is present, and used only in production. */
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * The one Better Auth instance for the API.
 *
 * Email and password sign in with required email verification. Self sign up can
 * only ever produce a student: the admin plugin declares the role field as non
 * input, and its create user hook defaults missing roles to student, so a role
 * sent from the client is ignored. The admin plugin also exposes
 * `auth.api.createUser`, which is how an admin creates teacher and admin accounts.
 *
 * The database adapter maps Better Auth's standard schema to the hand written
 * tables in `infrastructure/db/schema/auth.ts`, and generates UUID ids to match
 * the uuid columns there.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      if (resend && env.NODE_ENV === "production") {
        await resend.emails.send({
          from: MAIL_FROM,
          to: user.email,
          subject: "Verify your email address",
          html: `<p>Hello ${user.name},</p><p>Click the link to verify your email: <a href="${url}">${url}</a></p>`,
        });
        return;
      }
      // Development and tests write the link to the log instead of mailing it.
      logger.info({ userId: user.id, email: user.email, url }, "verification link");
    },
  },
  trustedOrigins: [env.WEB_ORIGIN],
  plugins: [admin({ defaultRole: "student", adminRoles: ["admin"] })],
  advanced: {
    database: { generateId: "uuid" },
  },
});
