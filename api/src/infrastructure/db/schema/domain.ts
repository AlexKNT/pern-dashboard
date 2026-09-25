import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth.js";
import { uuidv7 } from "../uuid.js";

/** A university department, softly archived rather than deleted. */
export const departments = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    name: text("name").notNull(),
    code: text("code"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("departments_code_key")
      .on(table.code)
      .where(sql`${table.code} is not null`),
    index("departments_name_idx").on(table.name),
  ],
);

/** A subject offered by one department, with a name and code unique within it. */
export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    code: text("code"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("subjects_department_name_key").on(table.departmentId, table.name),
    uniqueIndex("subjects_department_code_key")
      .on(table.departmentId, table.code)
      .where(sql`${table.code} is not null`),
    index("subjects_department_id_idx").on(table.departmentId),
  ],
);

/** A class of one subject, joined by a unique code and bounded by a capacity. */
export const classes = pgTable(
  "classes",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    joinCode: text("join_code").notNull().unique(),
    capacity: integer("capacity"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("classes_subject_id_idx").on(table.subjectId)],
);

/** The teachers assigned to a class, a junction table keyed by both columns. */
export const classTeachers = pgTable(
  "class_teachers",
  {
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.classId, table.teacherId] }),
    index("class_teachers_teacher_id_idx").on(table.teacherId),
  ],
);

/** A scheduled session of a class, at a time and optionally a room. */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    room: text("room"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sessions_class_start_idx").on(table.classId, table.startAt)],
);

/** A student's membership in a class, kept as history so a student can rejoin. */
export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // One current enrollment per class and student: active or waitlisted, never two.
    uniqueIndex("enrollments_current_student_key")
      .on(table.classId, table.studentId)
      .where(sql`${table.status} in ('active', 'waitlisted')`),
    index("enrollments_student_id_idx").on(table.studentId),
    check("enrollments_status_check", sql`${table.status} in ('active', 'waitlisted', 'left')`),
    // Status and left_at cannot drift: a left row has left_at set, and only it does.
    check(
      "enrollments_status_left_at_check",
      sql`(${table.status} = 'left') = (${table.leftAt} is not null)`,
    ),
  ],
);

/** A folder of class materials, nestable through its parent link. */
export const materialFolders = pgTable(
  "material_folders",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => materialFolders.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("material_folders_class_parent_idx").on(table.classId, table.parentId)],
);

/** A file stored in Cloudinary and linked to a class, and optionally a folder. */
export const materials = pgTable(
  "materials",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    folderId: uuid("folder_id").references(() => materialFolders.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    cloudinaryPublicId: text("cloudinary_public_id").notNull(),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("materials_class_id_idx").on(table.classId),
    index("materials_folder_id_idx").on(table.folderId),
  ],
);

/**
 * An append-only audit entry. record_id is polymorphic (no foreign key) and
 * nullable, because some actions, like a sign in, have no target record.
 */
export const auditEntries = pgTable(
  "audit_entries",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    recordType: text("record_type").notNull(),
    recordId: uuid("record_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_entries_actor_id_idx").on(table.actorId),
    index("audit_entries_record_idx").on(table.recordType, table.recordId),
    index("audit_entries_created_at_idx").on(table.createdAt),
  ],
);
