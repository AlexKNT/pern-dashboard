import { describe, expect, it, vi } from "vitest";

import { ConflictError, ForbiddenError, NotFoundError } from "../errors.js";
import type { AuthUser } from "../identity/identity.js";
import type { ClassesRepository, ClassRow } from "../classes/classes.repository.js";
import type {
  EnrollmentRow,
  EnrollmentsRepository,
  RosterEntryRow,
} from "./enrollments.repository.js";
import { makeEnrollmentsService } from "./enrollments.service.js";

const student: AuthUser = { id: "student-1", role: "student" };
const teacher: AuthUser = { id: "teacher-1", role: "teacher" };
const admin: AuthUser = { id: "admin-1", role: "admin" };

const CLASS_ID = "class-1";

function classRow(overrides: Partial<ClassRow> = {}): ClassRow {
  return {
    id: CLASS_ID,
    name: "Biology",
    subjectId: "subject-1",
    joinCode: "NG8A4W",
    capacity: 2,
    archivedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function enrollmentRow(overrides: Partial<EnrollmentRow> = {}): EnrollmentRow {
  return {
    id: "enrollment-1",
    classId: CLASS_ID,
    studentId: student.id,
    status: "active",
    joinedAt: new Date(),
    ...overrides,
  };
}

/** Builds the service over fake repositories, with a pass through transaction. */
function makeService(classes: ClassesRepository, enrollments: EnrollmentsRepository) {
  const db = {};
  return makeEnrollmentsService({
    db: db as never,
    classes: () => classes,
    enrollments: () => enrollments,
    withTransaction: <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => fn(db),
  });
}

describe("enrollments service", () => {
  it("joins a class with capacity left as active", async () => {
    const classes = {
      findByJoinCodeForUpdate: vi.fn(async () => classRow()),
    } as unknown as ClassesRepository;
    const enrollments = {
      findCurrent: vi.fn(async () => null),
      countActive: vi.fn(async () => 1),
      insert: vi.fn(async () => enrollmentRow({ status: "active" })),
    } as unknown as EnrollmentsRepository;

    const service = makeService(classes, enrollments);
    const result = await service.join(student, { code: "ng8a4w" });

    expect(classes.findByJoinCodeForUpdate).toHaveBeenCalledWith("NG8A4W");
    expect(enrollments.insert).toHaveBeenCalledWith({
      classId: CLASS_ID,
      studentId: student.id,
      status: "active",
    });
    expect(result.status).toBe("active");
  });

  it("waitlists a student when the class is full", async () => {
    const classes = {
      findByJoinCodeForUpdate: vi.fn(async () => classRow({ capacity: 2 })),
    } as unknown as ClassesRepository;
    const enrollments = {
      findCurrent: vi.fn(async () => null),
      countActive: vi.fn(async () => 2),
      insert: vi.fn(async () => enrollmentRow({ status: "waitlisted" })),
    } as unknown as EnrollmentsRepository;

    const result = await makeService(classes, enrollments).join(student, { code: "NG8A4W" });
    expect(result.status).toBe("waitlisted");
  });

  it("refuses a second join for the same class with a conflict", async () => {
    const classes = {
      findByJoinCodeForUpdate: vi.fn(async () => classRow()),
    } as unknown as ClassesRepository;
    const enrollments = {
      findCurrent: vi.fn(async () => enrollmentRow()),
      countActive: vi.fn(async () => 1),
      insert: vi.fn(async () => enrollmentRow()),
    } as unknown as EnrollmentsRepository;

    await expect(
      makeService(classes, enrollments).join(student, { code: "NG8A4W" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("returns not found for an unknown join code", async () => {
    const classes = {
      findByJoinCodeForUpdate: vi.fn(async () => null),
    } as unknown as ClassesRepository;
    const enrollments = {} as EnrollmentsRepository;

    await expect(
      makeService(classes, enrollments).join(student, { code: "NOPE" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("promotes the earliest waiter when an active student leaves", async () => {
    const waiter = enrollmentRow({ id: "waiter-1", status: "waitlisted" });
    const classes = {
      findByIdForUpdate: vi.fn(async () => classRow()),
    } as unknown as ClassesRepository;
    const enrollments = {
      findCurrent: vi.fn(async () => enrollmentRow({ status: "active" })),
      markLeft: vi.fn(async () => undefined),
      findEarliestWaitlisted: vi.fn(async () => waiter),
      promote: vi.fn(async () => undefined),
    } as unknown as EnrollmentsRepository;

    const result = await makeService(classes, enrollments).leave(student, CLASS_ID);

    expect(enrollments.markLeft).toHaveBeenCalledWith("enrollment-1");
    expect(enrollments.promote).toHaveBeenCalledWith("waiter-1");
    expect(result.status).toBe("left");
  });

  it("does not promote when a waitlisted student leaves", async () => {
    const classes = {
      findByIdForUpdate: vi.fn(async () => classRow()),
    } as unknown as ClassesRepository;
    const enrollments = {
      findCurrent: vi.fn(async () => enrollmentRow({ status: "waitlisted" })),
      markLeft: vi.fn(async () => undefined),
      findEarliestWaitlisted: vi.fn(async () => null),
      promote: vi.fn(async () => undefined),
    } as unknown as EnrollmentsRepository;

    await makeService(classes, enrollments).leave(student, CLASS_ID);

    expect(enrollments.promote).not.toHaveBeenCalled();
  });

  it("refuses a roster read to a teacher not assigned to the class", async () => {
    const classes = {
      findById: vi.fn(async () => classRow()),
      hasTeacher: vi.fn(async () => false),
    } as unknown as ClassesRepository;
    const enrollments = {} as EnrollmentsRepository;

    await expect(
      makeService(classes, enrollments).listRoster(teacher, CLASS_ID, { page: 1, pageSize: 20 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("allows an admin to read the roster", async () => {
    const entry: RosterEntryRow = {
      studentId: "student-1",
      name: "Sam Student",
      email: "student@example.com",
      joinedAt: new Date(),
    };
    const classes = {
      findById: vi.fn(async () => classRow()),
      hasTeacher: vi.fn(async () => false),
    } as unknown as ClassesRepository;
    const enrollments = {
      listRoster: vi.fn(async () => ({ items: [entry], total: 1 })),
    } as unknown as EnrollmentsRepository;

    const result = await makeService(classes, enrollments).listRoster(admin, CLASS_ID, {
      page: 1,
      pageSize: 20,
    });
    expect(result.total).toBe(1);
    expect(result.items[0]!.email).toBe("student@example.com");
  });
});
