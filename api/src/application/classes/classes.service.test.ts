import { describe, expect, it, vi } from "vitest";

import type { AuthUser } from "../identity/identity.js";
import type { ClassesRepository, MyClassRow } from "./classes.repository.js";
import { makeClassesService } from "./classes.service.js";

const student: AuthUser = { id: "student-1", role: "student" };

function myClassRow(overrides: Partial<MyClassRow> = {}): MyClassRow {
  return {
    id: "class-1",
    name: "Chem 101",
    joinCode: "B79D69",
    capacity: 1,
    subjectName: "General",
    teacherNames: ["Mr. Chen"],
    activeCount: 1,
    waitlistedCount: 0,
    createdAt: new Date(),
    status: null,
    joinedAt: null,
    ...overrides,
  };
}

describe("classes service", () => {
  it("passes the joinedAt string through to my classes, not calling Date methods on it", async () => {
    const classes = {
      listClassesForUser: vi.fn(async () => ({
        items: [myClassRow({ status: "active", joinedAt: "2026-09-25T09:54:35.744Z" })],
        total: 1,
      })),
    } as unknown as ClassesRepository;
    const db = {};

    const service = makeClassesService({
      db: db as never,
      classes: () => classes,
      users: () => ({}) as never,
      withTransaction: <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => fn(db),
    });

    const result = await service.listMyClasses(student, { page: 1, pageSize: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.status).toBe("active");
    expect(result.items[0]!.joinedAt).toBe("2026-09-25T09:54:35.744Z");
  });

  it("returns a null joinedAt when the student has no current row", async () => {
    const classes = {
      listClassesForUser: vi.fn(async () => ({ items: [myClassRow()], total: 1 })),
    } as unknown as ClassesRepository;
    const db = {};

    const service = makeClassesService({
      db: db as never,
      classes: () => classes,
      users: () => ({}) as never,
      withTransaction: <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => fn(db),
    });

    const result = await service.listMyClasses(student, { page: 1, pageSize: 20 });

    expect(result.items[0]!.joinedAt).toBeNull();
  });
});
