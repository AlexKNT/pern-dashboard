import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";

import type { AuthUser } from "../../application/identity/identity.js";
import { sortParts, type ListQuery } from "../../application/shared/list.js";
import type {
  ClassesRepository,
  ClassRow,
  MyClassRow,
  NewClass,
  SubjectRow,
} from "../../application/classes/classes.repository.js";
import { user } from "../db/schema/auth.js";
import { classes, classTeachers, enrollments, subjects } from "../db/schema/domain.js";
import type { Executor } from "../db/transaction.js";

/** Maps a selected class row to the application shape. */
function toClassRow(row: {
  id: string;
  name: string;
  subjectId: string;
  joinCode: string;
  capacity: number | null;
  archivedAt: Date | null;
  createdAt: Date;
}): ClassRow {
  return {
    id: row.id,
    name: row.name,
    subjectId: row.subjectId,
    joinCode: row.joinCode,
    capacity: row.capacity,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
  };
}

/** The count subqueries for the queue a class read carries. */
const activeCountSql = sql<number>`(select count(*)::int from ${enrollments} e where e.class_id = ${classes}.id and e.status = 'active')`;
const waitlistedCountSql = sql<number>`(select count(*)::int from ${enrollments} e where e.class_id = ${classes}.id and e.status = 'waitlisted')`;

/**
 * The Drizzle implementation of the classes repository.
 */
export function makeClassesRepository(executor: Executor): ClassesRepository {
  return {
    async create(input: NewClass, teacherId: string): Promise<ClassRow> {
      const rows = await executor
        .insert(classes)
        .values({
          name: input.name,
          subjectId: input.subjectId,
          joinCode: input.joinCode,
          capacity: input.capacity,
        })
        .returning();
      const row = rows[0]!;
      await executor.insert(classTeachers).values({ classId: row.id, teacherId });
      return toClassRow(row);
    },

    async findDefaultSubject(): Promise<SubjectRow | null> {
      const rows = await executor
        .select({ id: subjects.id, name: subjects.name })
        .from(subjects)
        .orderBy(subjects.createdAt)
        .limit(1);
      const row = rows[0];
      return row ? { id: row.id, name: row.name } : null;
    },

    async findById(id: string) {
      const rows = await executor.select().from(classes).where(eq(classes.id, id)).limit(1);
      return rows[0] ? toClassRow(rows[0]) : null;
    },

    async findByIdForUpdate(id: string) {
      const rows = await executor
        .select()
        .from(classes)
        .where(eq(classes.id, id))
        .limit(1)
        .for("update");
      return rows[0] ? toClassRow(rows[0]) : null;
    },

    async findByJoinCode(code: string) {
      const rows = await executor.select().from(classes).where(eq(classes.joinCode, code)).limit(1);
      return rows[0] ? toClassRow(rows[0]) : null;
    },

    async findByJoinCodeForUpdate(code: string) {
      const rows = await executor
        .select()
        .from(classes)
        .where(eq(classes.joinCode, code))
        .limit(1)
        .for("update");
      return rows[0] ? toClassRow(rows[0]) : null;
    },

    async hasTeacher(classId: string, teacherId: string) {
      const rows = await executor
        .select({ teacherId: classTeachers.teacherId })
        .from(classTeachers)
        .where(and(eq(classTeachers.classId, classId), eq(classTeachers.teacherId, teacherId)))
        .limit(1);
      return rows.length > 0;
    },

    async listClassesForUser(actor: AuthUser, query: ListQuery) {
      const statusSql = sql<
        MyClassRow["status"]
      >`(select e.status from ${enrollments} e where e.class_id = ${classes}.id and e.student_id = ${actor.id} and e.status in ('active','waitlisted') limit 1)`;
      const joinedAtSql = sql<
        string | null
      >`(select to_char(e.joined_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') from ${enrollments} e where e.class_id = ${classes}.id and e.student_id = ${actor.id} and e.status in ('active','waitlisted') limit 1)`;

      const conditions: (ReturnType<typeof sql> | undefined)[] = [];
      if (query.q) conditions.push(ilike(classes.name, `%${query.q}%`));
      if (actor.role === "student") {
        conditions.push(
          sql`exists (select 1 from ${enrollments} e where e.class_id = ${classes}.id and e.student_id = ${actor.id} and e.status in ('active','waitlisted'))`,
        );
      } else if (actor.role === "teacher") {
        conditions.push(
          sql`exists (select 1 from ${classTeachers} ct where ct.class_id = ${classes}.id and ct.teacher_id = ${actor.id})`,
        );
      }

      const { field, descending } = sortParts(query.sort);
      const orderColumn = field === "name" ? classes.name : classes.createdAt;
      const orderBy = descending ? desc(orderColumn) : asc(orderColumn);

      const rows = await executor
        .select({
          id: classes.id,
          name: classes.name,
          joinCode: classes.joinCode,
          capacity: classes.capacity,
          subjectName: subjects.name,
          activeCount: activeCountSql,
          waitlistedCount: waitlistedCountSql,
          createdAt: classes.createdAt,
          status: statusSql,
          joinedAt: joinedAtSql,
          total: sql<number>`count(*) over()::int`,
        })
        .from(classes)
        .innerJoin(subjects, eq(subjects.id, classes.subjectId))
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize);

      const total = rows[0]?.total ?? 0;

      const classIds = rows.map((row) => row.id);
      const teacherRows = classIds.length
        ? await executor
            .select({ classId: classTeachers.classId, name: user.name })
            .from(classTeachers)
            .innerJoin(user, eq(user.id, classTeachers.teacherId))
            .where(inArray(classTeachers.classId, classIds))
        : [];

      const teachersByClass = new Map<string, string[]>();
      for (const teacher of teacherRows) {
        const names = teachersByClass.get(teacher.classId) ?? [];
        names.push(teacher.name);
        teachersByClass.set(teacher.classId, names);
      }

      const items: MyClassRow[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        joinCode: row.joinCode,
        capacity: row.capacity,
        subjectName: row.subjectName,
        teacherNames: teachersByClass.get(row.id) ?? [],
        activeCount: row.activeCount,
        waitlistedCount: row.waitlistedCount,
        createdAt: row.createdAt,
        status: row.status,
        joinedAt: row.joinedAt,
      }));

      return { items, total };
    },
  };
}
