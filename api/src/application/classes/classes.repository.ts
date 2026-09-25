import type { AuthUser } from "../identity/identity.js";
import type { ListQuery } from "../shared/list.js";

/** A class row as the repository reads and writes it. */
export type ClassRow = {
  id: string;
  name: string;
  subjectId: string;
  joinCode: string;
  capacity: number | null;
  archivedAt: Date | null;
  createdAt: Date;
};

/** A subject row, only the fields this feature needs. */
export type SubjectRow = {
  id: string;
  name: string;
};

/** A class entry for a person's class list, with counts and their status. */
export type MyClassRow = {
  id: string;
  name: string;
  joinCode: string;
  capacity: number | null;
  subjectName: string;
  teacherNames: string[];
  activeCount: number;
  waitlistedCount: number;
  createdAt: Date;
  /** The caller's own current status, or null for a teacher or admin. */
  status: "active" | "waitlisted" | null;
  /** When the caller became active, an ISO 8601 string, or null. */
  joinedAt: string | null;
};

/** The fields written when a class is created. */
export type NewClass = {
  name: string;
  subjectId: string;
  joinCode: string;
  capacity: number | null;
};

/**
 * How the application reads and writes classes. The repository is bound to a
 * database or transaction executor at construction time.
 */
export interface ClassesRepository {
  /** Creates a class and its teacher link, returning the new row. */
  create(input: NewClass, teacherId: string): Promise<ClassRow>;

  /** The seeded subject new classes default to, or null before the seed runs. */
  findDefaultSubject(): Promise<SubjectRow | null>;

  /** Reads one class by id, or null when it does not exist. */
  findById(id: string): Promise<ClassRow | null>;

  /** Reads one class by id and locks the row, for a join or leave. */
  findByIdForUpdate(id: string): Promise<ClassRow | null>;

  /** Reads one class by join code, or null when it does not exist. */
  findByJoinCode(code: string): Promise<ClassRow | null>;

  /** Reads one class by join code and locks the row, for a join. */
  findByJoinCodeForUpdate(code: string): Promise<ClassRow | null>;

  /** True when the given teacher is assigned to the class. */
  hasTeacher(classId: string, teacherId: string): Promise<boolean>;

  /** Lists the classes a person relates to, with counts, paginated. */
  listClassesForUser(
    actor: AuthUser,
    query: ListQuery,
  ): Promise<{ items: MyClassRow[]; total: number }>;
}
