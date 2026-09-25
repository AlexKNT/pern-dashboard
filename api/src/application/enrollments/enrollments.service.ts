import { normalizeJoinCode } from "../../domain/join-code.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../errors.js";
import type { AuthUser } from "../identity/identity.js";
import type { ClassesRepository } from "../classes/classes.repository.js";
import type {
  EnrollmentDto,
  JoinClassInput,
  RosterEntryDto,
  RosterQuery,
} from "./enrollments.dto.js";
import type {
  EnrollmentsRepository,
  EnrollmentRow,
  RosterEntryRow,
} from "./enrollments.repository.js";

/** Converts an enrollment row to the DTO the API returns. */
function toEnrollmentDto(row: EnrollmentRow): EnrollmentDto {
  return {
    id: row.id,
    classId: row.classId,
    studentId: row.studentId,
    status: row.status,
    joinedAt: row.joinedAt.toISOString(),
  };
}

/** Converts a roster row to the DTO the API returns. */
function toRosterEntryDto(row: RosterEntryRow): RosterEntryDto {
  return {
    id: row.studentId,
    name: row.name,
    email: row.email,
    joinedAt: row.joinedAt.toISOString(),
  };
}

/**
 * The dependencies the enrollment use cases need, generic over the transaction
 * handle so the application layer never imports the database client or ORM.
 */
export type EnrollmentsServiceDeps<Tx> = {
  db: Tx;
  classes: (tx: Tx) => ClassesRepository;
  enrollments: (tx: Tx) => EnrollmentsRepository;
  withTransaction: <T>(fn: (tx: Tx) => Promise<T>) => Promise<T>;
};

/**
 * Enrollment use cases: join, leave with waitlist promotion, and the roster read.
 */
export function makeEnrollmentsService<Tx>(deps: EnrollmentsServiceDeps<Tx>) {
  return {
    /**
     * Joins a class by code. Locks the class row, refuses a class the student is
     * already in, and lands the student active or waitlisted by capacity.
     */
    async join(actor: AuthUser, input: JoinClassInput): Promise<EnrollmentDto> {
      const code = normalizeJoinCode(input.code);

      return deps.withTransaction(async (tx) => {
        const classes = deps.classes(tx);
        const enrollments = deps.enrollments(tx);

        const klass = await classes.findByJoinCodeForUpdate(code);
        if (!klass || klass.archivedAt) throw new NotFoundError("No class with that join code.");

        const existing = await enrollments.findCurrent(klass.id, actor.id);
        if (existing) throw new ConflictError("You are already in this class.");

        const active = await enrollments.countActive(klass.id);
        const status = klass.capacity != null && active >= klass.capacity ? "waitlisted" : "active";

        const row = await enrollments.insert({
          classId: klass.id,
          studentId: actor.id,
          status,
        });
        return toEnrollmentDto(row);
      });
    },

    /**
     * Leaves a class. Closes the enrollment and, when the leaver held a seat,
     * promotes the earliest waiter in the same transaction.
     */
    async leave(actor: AuthUser, classId: string): Promise<EnrollmentDto> {
      return deps.withTransaction(async (tx) => {
        const classes = deps.classes(tx);
        const enrollments = deps.enrollments(tx);

        const klass = await classes.findByIdForUpdate(classId);
        if (!klass) throw new NotFoundError("No such class.");

        const current = await enrollments.findCurrent(classId, actor.id);
        if (!current) throw new NotFoundError("You are not enrolled in this class.");

        await enrollments.markLeft(current.id);

        if (current.status === "active") {
          const waiter = await enrollments.findEarliestWaitlisted(classId);
          if (waiter) await enrollments.promote(waiter.id);
        }

        return toEnrollmentDto({ ...current, status: "left" });
      });
    },

    /** Lists the roster, visible only to the class's teachers and admins. */
    async listRoster(
      actor: AuthUser,
      classId: string,
      query: RosterQuery,
    ): Promise<{ items: RosterEntryDto[]; total: number }> {
      const klass = await deps.classes(deps.db).findById(classId);
      if (!klass) throw new NotFoundError("No such class.");

      if (actor.role !== "admin") {
        const isTeacher = await deps.classes(deps.db).hasTeacher(classId, actor.id);
        if (!isTeacher) throw new ForbiddenError();
      }

      const { items, total } = await deps.enrollments(deps.db).listRoster(classId, query);
      return { items: items.map(toRosterEntryDto), total };
    },
  };
}

/** The public surface an enrollments controller binds to. */
export type EnrollmentsService = ReturnType<typeof makeEnrollmentsService>;
