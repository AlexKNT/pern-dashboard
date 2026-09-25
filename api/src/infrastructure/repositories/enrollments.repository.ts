import { and, eq, sql } from "drizzle-orm";

import type { EnrollmentStatus } from "../../domain/enrollment.js";
import type { RosterQuery } from "../../application/enrollments/enrollments.dto.js";
import type {
  EnrollmentRow,
  EnrollmentsRepository,
  RosterEntryRow,
} from "../../application/enrollments/enrollments.repository.js";
import { user } from "../db/schema/auth.js";
import { enrollments } from "../db/schema/domain.js";
import type { Executor } from "../db/transaction.js";

/** Maps a selected enrollment row to the application shape. */
function toEnrollmentRow(row: {
  id: string;
  classId: string;
  studentId: string;
  status: string;
  joinedAt: Date;
}): EnrollmentRow {
  return {
    id: row.id,
    classId: row.classId,
    studentId: row.studentId,
    status: row.status as EnrollmentStatus,
    joinedAt: row.joinedAt,
  };
}

const CURRENT_STATUS_SQL = sql`${enrollments.status} in ('active', 'waitlisted')`;

/**
 * The Drizzle implementation of the enrollments repository.
 */
export function makeEnrollmentsRepository(executor: Executor): EnrollmentsRepository {
  return {
    async insert(input) {
      const rows = await executor
        .insert(enrollments)
        .values({ classId: input.classId, studentId: input.studentId, status: input.status })
        .returning();
      return toEnrollmentRow(rows[0]!);
    },

    async findCurrent(classId: string, studentId: string) {
      const rows = await executor
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.classId, classId),
            eq(enrollments.studentId, studentId),
            CURRENT_STATUS_SQL,
          ),
        )
        .limit(1);
      return rows[0] ? toEnrollmentRow(rows[0]) : null;
    },

    async countActive(classId: string) {
      const rows = await executor
        .select({ count: sql<number>`count(*)::int` })
        .from(enrollments)
        .where(and(eq(enrollments.classId, classId), eq(enrollments.status, "active")));
      return rows[0]?.count ?? 0;
    },

    async markLeft(id: string) {
      await executor
        .update(enrollments)
        .set({ status: "left", leftAt: new Date(), updatedAt: new Date() })
        .where(eq(enrollments.id, id));
    },

    async findEarliestWaitlisted(classId: string) {
      const rows = await executor
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.classId, classId), eq(enrollments.status, "waitlisted")))
        .orderBy(enrollments.createdAt, enrollments.id)
        .limit(1);
      return rows[0] ? toEnrollmentRow(rows[0]) : null;
    },

    async promote(id: string) {
      await executor
        .update(enrollments)
        .set({ status: "active", joinedAt: new Date(), updatedAt: new Date() })
        .where(eq(enrollments.id, id));
    },

    async listRoster(classId: string, query: RosterQuery) {
      const rows = await executor
        .select({
          studentId: enrollments.studentId,
          name: user.name,
          email: user.email,
          joinedAt: enrollments.joinedAt,
          total: sql<number>`count(*) over()::int`,
        })
        .from(enrollments)
        .innerJoin(user, eq(user.id, enrollments.studentId))
        .where(and(eq(enrollments.classId, classId), eq(enrollments.status, "active")))
        .orderBy(enrollments.joinedAt, user.name)
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize);

      const items: RosterEntryRow[] = rows.map((row) => ({
        studentId: row.studentId,
        name: row.name,
        email: row.email,
        joinedAt: row.joinedAt,
      }));

      return { items, total: rows[0]?.total ?? 0 };
    },
  };
}
