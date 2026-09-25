import { eq, sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { pruneExpiredAuditEntries } from "../audit-prune.js";
import * as schema from "../schema/index.js";
import { user } from "../schema/auth.js";
import { auditEntries, classes, departments, enrollments, subjects } from "../schema/domain.js";
import { uuidv7 } from "../uuid.js";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const hasDatabase = Boolean(databaseUrl);
const migrationsFolder = fileURLToPath(new URL("../../../../drizzle", import.meta.url));

const runAgainstDatabase = hasDatabase ? describe : describe.skip;

const EXPECTED_TABLES = [
  "user",
  "session",
  "account",
  "verification",
  "departments",
  "subjects",
  "classes",
  "class_teachers",
  "sessions",
  "enrollments",
  "material_folders",
  "materials",
  "audit_entries",
] as const;

const EXPECTED_FOREIGN_KEYS = 15;

/** Asserts a query promise rejects with the given Postgres error code. */
async function expectSqlErrorCode(promise: Promise<unknown>, code: string): Promise<void> {
  const error = (await promise.catch((caught) => caught)) as {
    code?: string;
    cause?: { code?: string };
  };
  expect(error.code ?? error.cause?.code).toBe(code);
}

runAgainstDatabase("schema constraints on a throwaway branch", () => {
  const pool = new Pool({ connectionString: databaseUrl });
  const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

  beforeAll(async () => {
    await migrate(db, { migrationsFolder });
  });

  beforeEach(async () => {
    await db.execute(
      sql`TRUNCATE TABLE "user", "session", "account", "verification", "departments", "subjects", "classes", "class_teachers", "sessions", "enrollments", "material_folders", "materials", "audit_entries"`,
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates every table and enforces every relationship (AC-1, AC-2)", async () => {
    const { rows: tables } = await pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    const names = new Set(tables.map((row) => row.table_name));
    for (const table of EXPECTED_TABLES) {
      expect(names.has(table), `missing table ${table}`).toBe(true);
    }

    const { rows: foreignKeys } = await pool.query(
      `SELECT conname FROM pg_constraint WHERE contype = 'f'`,
    );
    expect(foreignKeys.length).toBe(EXPECTED_FOREIGN_KEYS);
  });

  it("rejects a duplicate join code (AC-2)", async () => {
    const department = await db
      .insert(departments)
      .values({ name: "Maths" })
      .returning()
      .then((rows) => rows[0]!);
    const subject = await db
      .insert(subjects)
      .values({ departmentId: department.id, name: "Algebra" })
      .returning()
      .then((rows) => rows[0]!);

    await db
      .insert(classes)
      .values({ subjectId: subject.id, name: "Algebra A", joinCode: "AB12CD" });

    await expectSqlErrorCode(
      db.insert(classes).values({ subjectId: subject.id, name: "Algebra B", joinCode: "AB12CD" }),
      "23505",
    );
  });

  it("rejects a second active enrollment for the same class and student (AC-2)", async () => {
    const department = await db
      .insert(departments)
      .values({ name: "Physics" })
      .returning()
      .then((rows) => rows[0]!);
    const subject = await db
      .insert(subjects)
      .values({ departmentId: department.id, name: "Mechanics" })
      .returning()
      .then((rows) => rows[0]!);
    const klass = await db
      .insert(classes)
      .values({ subjectId: subject.id, name: "Mechanics A", joinCode: "ME12CD" })
      .returning()
      .then((rows) => rows[0]!);
    const student = await db
      .insert(user)
      .values({
        email: "student@example.com",
        name: "Student One",
        role: "student",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
      .then((rows) => rows[0]!);

    await db.insert(enrollments).values({ classId: klass.id, studentId: student.id });

    await expectSqlErrorCode(
      db.insert(enrollments).values({ classId: klass.id, studentId: student.id }),
      "23505",
    );
  });

  it("rejects an enrollment that references a missing class (AC-2)", async () => {
    const student = await db
      .insert(user)
      .values({
        email: "orphan@example.com",
        name: "Student Two",
        role: "student",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
      .then((rows) => rows[0]!);

    await expectSqlErrorCode(
      db.insert(enrollments).values({ classId: uuidv7(), studentId: student.id }),
      "23503",
    );
  });

  it("accepts only admin, teacher and student roles (AC-3, AC-5)", async () => {
    for (const role of ["admin", "teacher", "student"]) {
      await db
        .insert(user)
        .values({
          email: `${role}@example.com`,
          name: role,
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
    }

    await expectSqlErrorCode(
      db.insert(user).values({
        email: "superadmin@example.com",
        name: "Super",
        role: "superadmin",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      "23514",
    );
  });

  it("archives by setting archived_at and never deletes the row (AC-5)", async () => {
    const department = await db
      .insert(departments)
      .values({ name: "Chemistry" })
      .returning()
      .then((rows) => rows[0]!);

    await db
      .update(departments)
      .set({ archivedAt: new Date() })
      .where(eq(departments.id, department.id));

    const rows = await db.select().from(departments);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.archivedAt).toBeInstanceOf(Date);
  });

  it("prunes audit entries older than 365 days and keeps newer ones (AC-6)", async () => {
    const actor = await db
      .insert(user)
      .values({
        email: "actor@example.com",
        name: "Actor",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
      .then((rows) => rows[0]!);

    const now = new Date();
    const oldDate = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000);

    await db
      .insert(auditEntries)
      .values({ actorId: actor.id, action: "class.create", recordType: "class" });
    await db
      .insert(auditEntries)
      .values({
        actorId: actor.id,
        action: "class.create",
        recordType: "class",
        createdAt: oldDate,
      });

    const removed = await pruneExpiredAuditEntries(db, now);
    expect(removed).toBe(1);

    const remaining = await db.select().from(auditEntries);
    expect(remaining).toHaveLength(1);
  });
});
