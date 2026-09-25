import { eq } from "drizzle-orm";

import { auth } from "../infrastructure/auth/auth.js";
import { db } from "../infrastructure/db/client.js";
import { user } from "../infrastructure/db/schema/auth.js";
import { departments, subjects } from "../infrastructure/db/schema/domain.js";

/**
 * The idempotent seed: one placeholder department and subject, and the first
 * admin. Run after `npm run db:migrate`. Every step checks before it writes, so
 * the script is safe to run again.
 */
async function seed(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to seed.");
  }

  // The placeholder department, so every class has a subject to hang from.
  const existingDepartment = await db
    .select()
    .from(departments)
    .where(eq(departments.name, "General"))
    .limit(1);
  const departmentId =
    existingDepartment[0]?.id ??
    (await db.insert(departments).values({ name: "General" }).returning())[0]!.id;

  // The placeholder subject under it.
  const existingSubject = await db
    .select()
    .from(subjects)
    .where(eq(subjects.name, "General"))
    .limit(1);
  if (!existingSubject[0]) {
    await db.insert(subjects).values({ departmentId, name: "General" });
  }

  // The first admin, created through Better Auth so it carries a credential.
  const existingAdmin = await db
    .select()
    .from(user)
    .where(eq(user.email, email.toLowerCase()))
    .limit(1);
  if (!existingAdmin[0]) {
    await auth.api.createUser({
      body: {
        email,
        password,
        name: "Administrator",
        role: "admin",
        data: { emailVerified: true },
      },
    });
  }
}

seed()
  .then(() => {
    process.stdout.write("Seed complete.\n");
  })
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
