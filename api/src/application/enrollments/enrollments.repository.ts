import type { EnrollmentStatus } from "../../domain/enrollment.js";
import type { RosterQuery } from "./enrollments.dto.js";

/** An enrollment row as the repository reads and writes it. */
export type EnrollmentRow = {
  id: string;
  classId: string;
  studentId: string;
  status: EnrollmentStatus;
  joinedAt: Date;
};

/** One student on a roster, joined with their account. */
export type RosterEntryRow = {
  studentId: string;
  name: string;
  email: string;
  joinedAt: Date;
};

/**
 * How the application reads and writes enrollments. The repository is bound to a
 * database or transaction executor at construction time.
 */
export interface EnrollmentsRepository {
  /** Inserts a fresh enrollment row. */
  insert(input: {
    classId: string;
    studentId: string;
    status: EnrollmentStatus;
  }): Promise<EnrollmentRow>;

  /** The current (active or waitlisted) enrollment, or null. */
  findCurrent(classId: string, studentId: string): Promise<EnrollmentRow | null>;

  /** The number of active enrollments in a class, the seats in use. */
  countActive(classId: string): Promise<number>;

  /** Closes an enrollment: status left, left_at now. */
  markLeft(id: string): Promise<void>;

  /** The earliest waitlisted enrollment, by created_at then id. */
  findEarliestWaitlisted(classId: string): Promise<EnrollmentRow | null>;

  /** Promotes a waitlisted enrollment to active, recording joined_at now. */
  promote(id: string): Promise<void>;

  /** Lists the active students of a class, paginated. */
  listRoster(
    classId: string,
    query: RosterQuery,
  ): Promise<{ items: RosterEntryRow[]; total: number }>;
}
