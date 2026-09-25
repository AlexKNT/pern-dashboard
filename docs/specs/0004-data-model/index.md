# 0004. Core relational data model for the whole product

**Date**: 2026-09-25
**Status**: Proposed

## Summary

This decision sets the database schema the whole product stands on: accounts and roles, departments, subjects, classes, sessions, enrollments, materials and an audit log. It is one coherent schema, designed whole now, so no later slice needs a breaking migration. The schema uses UUID v7 primary keys, snake_case column names, soft archiving instead of hard deletes, and enrollment history so a student can leave and rejoin.

## Requirements

**User stories**:

- As an engineer building any later slice, I want the full schema and its constraints already decided, so I build features rather than argue about the data.
- As an admin, I want departments, subjects and classes with archiving, so the academic structure stays clean over years.
- As a student, I want to join a class with a code, leave, and rejoin later, so my enrollment history stays true.
- As a teacher, I want the classes I teach with their sessions and materials, so I can run a course.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: A migration set exists that creates the full schema (the Better Auth tables plus departments, subjects, classes, class_teachers, sessions, enrollments, material_folders, materials, audit_entries) and applies cleanly to a fresh Neon branch.
- **AC-2**: Every relationship is enforced by a foreign key, and the required uniqueness holds at the database level: join_code unique, one active enrollment per class and student, subject name unique within a department, subject code unique within a department, department code unique where present.
- **AC-3**: Auth identity and roles live together: the Better Auth user table carries role (admin, teacher or student), and name and avatar are available for profile display, with no later slice needing a breaking change to the auth tables.
- **AC-4**: The schema supports every scope slice with no breaking migration: archiving for departments, subjects and classes; capacity and a join code on classes; several teachers per class; session times and rooms; enrollment history with rejoin; materials with folders; audit entries with a 365 day retention.
- **AC-5**: Conventions hold across every table: UUID v7 primary keys, snake_case columns, timestamptz timestamps, and soft archiving via archived_at on departments, subjects and classes.
- **AC-6**: The audit entries table captures actor, action, record type and record id, with indexes that support filtering by actor, record and date and a prune of entries older than 365 days.
- **AC-7**: The query patterns later slices need are supported without schema change: directory search by name and email, class roster by class, teaching load by teacher, schedule by class and time, materials by class.

## Decision

**Chosen option**: Option 1, one coherent relational schema designed whole now.

Nine domain tables on top of Better Auth's standard tables, all following one set of conventions, with foreign keys and unique constraints enforcing the relationships at the database level.

**Implementation skills**: `neon-postgres` (`neondatabase/agent-skills`, `.agents/skills/neon-postgres/`) · `create-auth` (`better-auth/skills`, `.agents/skills/create-auth/`) · `better-auth-best-practices` (`better-auth/skills`, `.agents/skills/better-auth-best-practices/`)

## Feature design

**Data model sketch**:

Auth tables, brought in by Better Auth's Drizzle adapter and extended:

- `user`: id, name, email (unique), email_verified, image, role (admin, teacher or student, with a check constraint), created_at, updated_at. Better Auth already provides name and image for profile display; role is added through Better Auth's additional fields.
- `session`, `account`, `verification`: Better Auth's standard columns, unchanged.

Domain tables:

| Table | Columns | Constraints |
|---|---|---|
| `departments` | id, name, code (nullable), archived_at (nullable), created_at, updated_at | code unique where present; index on name |
| `subjects` | id, department_id, name, code (nullable), archived_at (nullable), created_at, updated_at | FK department_id; unique (department_id, name); code unique within department; index on department_id |
| `classes` | id, subject_id, name, join_code, capacity (nullable), archived_at (nullable), created_at, updated_at | FK subject_id; join_code unique; index on subject_id |
| `class_teachers` | class_id, teacher_id, created_at | PK (class_id, teacher_id); FK both; index on teacher_id |
| `sessions` | id, class_id, start_at, end_at, room (nullable), created_at, updated_at | FK class_id; index (class_id, start_at) |
| `enrollments` | id, class_id, student_id, joined_at, left_at (nullable), created_at, updated_at | FK both; partial unique (class_id, student_id) where left_at is null; index on student_id |
| `material_folders` | id, class_id, parent_id (nullable), name, created_at, updated_at | FK class_id; self FK parent_id; index (class_id, parent_id) |
| `materials` | id, class_id, folder_id (nullable), name, mime_type, size_bytes, cloudinary_public_id, uploaded_by, created_at, updated_at | FK class_id, folder_id, uploaded_by; index on class_id and folder_id |
| `audit_entries` | id, actor_id, action (text), record_type (text), record_id, created_at | FK actor_id; record_id is polymorphic with no FK; indexes on actor_id, (record_type, record_id) and created_at |

Relationships: department 1:N subject, subject 1:N class, class N:M teacher (via class_teachers), class N:M student (via enrollments with history), class 1:N session, class 1:N material_folder (folders self nest), class 1:N material, folder 1:N material, user 1:N audit_entry as actor.

All ids are UUID v7, columns snake_case, timestamps timestamptz UTC.

Field semantics worth spelling out: join_code is 6 characters from an unambiguous set (no 0, O, 1, I), unique and kept reserved even after a class is archived. capacity is NULL for unlimited, and it counts active enrollments only (left_at is null). action and record_type on audit_entries are text columns constrained in the application layer, not database enums, so the audit log spec (feature 14) can settle the exact allowed values without a migration. Directory search by name uses a trigram index on user.name for substring match.

**State transitions**:

- Departments, subjects and classes: active (archived_at null) to archived (archived_at set), and back. Archiving is soft, rows stay.
- Enrollments: active (left_at null) to left (left_at set). Leaving closes the row; rejoining inserts a new active row, so history is preserved.

**API surface**:

This feature ships no HTTP endpoints. The schema is the surface later slices read and write through. The value sourcing table below names where each value those slices need comes from.

**Value sourcing**:

| Read or write (later slice) | Value produced | Source |
|---|---|---|
| Class roster | enrolled students | enrollments where left_at is null, joined to user |
| Teaching load | classes a teacher teaches | class_teachers joined to classes |
| Analytics totals | enrollment, class and faculty counts | counts over classes, active enrollments, and users by role |
| Directory search | match by name or email | user.name and user.email, trigram indexed |
| Directory filter | a person's role | user.role (filter by role only; no department link) |
| Schedule in local time | session start and end | sessions.start_at and end_at (timestamptz), converted on the client |
| Join a class | the code a student types | classes.join_code (unique) |
| Materials access | whether a user can open a file | materials.class_id checked against class_teachers or active enrollments |
| Archived visibility | whether a record is hidden | archived_at is not null |
| Audit filter | entries by actor, record and date | audit_entries.actor_id, record_type plus record_id, created_at |

**Key invariants**:

- join_code is unique across all classes, and stays reserved after a class is archived.
- A student has at most one active enrollment in a class (partial unique index).
- A subject belongs to exactly one department; a class belongs to exactly one subject.
- A material's class must match its folder's class (enforced in the application).
- Archiving is soft only: archived_at, never a hard delete of a department, subject or class.
- role is one of admin, teacher, student (a check constraint on user.role), and only a user whose role is teacher may appear in class_teachers (enforced in the application).
- capacity is NULL for unlimited, and counts active enrollments only.
- Audit entries are not deleted before the 365 day retention; a prune removes only older entries.

**Security model**:

- Roles live on the user table as a single role string: admin, teacher, student.
- Class access: a teacher through class_teachers, a student through an active enrollment, an admin through role.
- There is no multi tenancy (one university), and no database level row security. Authorization is enforced in the application layer, matching the four layer rule in AGENTS.md.
- Student data is personal data and is treated as sensitive; no compliance standard beyond care is in scope (noted in the stack decision, spec 0001).

**Configuration required**:

- `DATABASE_URL`: the Neon Postgres connection string, used by drizzle-kit for migrations and by the API to connect. The test pipeline uses a throwaway branch URL per run.

**Critical test scenarios** (each maps to an acceptance criterion in `## Requirements`):

- Happy path: apply the migration to a fresh Neon branch, every table exists and every foreign key is in place, verifies **AC-1**.
- Failure case: inserting a duplicate join_code, or a second active enrollment for the same class and student, is rejected by the database, verifies **AC-2**.
- Constraint: role accepts only admin, teacher, student, and archiving sets archived_at and never deletes the row, verifies **AC-3** and **AC-5**.
- Retention: a prune query removes audit entries older than 365 days and leaves newer ones, verifies **AC-6**.

## Build plan

1. Add the database dependencies (Drizzle, drizzle-kit, the Postgres driver) and wire DATABASE_URL into the environment validation so a missing value fails at startup, satisfies **AC-1**.
2. Define the Better Auth tables with the Drizzle adapter and add role to the user table, satisfies **AC-3**.
3. Define the domain tables with their foreign keys, unique constraints and indexes, satisfies **AC-2**, **AC-5**, **AC-6**, **AC-7**.
4. Generate the migration with drizzle-kit and apply it to a fresh Neon branch, satisfies **AC-1**, **AC-4**.
5. Write the test that applies the migration to a throwaway branch and asserts the uniqueness and foreign key constraints, satisfies **AC-2**, **AC-5**.
6. Add the audit retention prune query for entries older than 365 days, satisfies **AC-6**.

## Consequences

**Positive**:

- One coherent schema means later slices build against decided tables instead of arguing about them.
- Database constraints carry the invariants, so a bug in any one slice cannot silently corrupt the data.
- Soft archiving and enrollment history keep the record honest for the audit and analytics slices.

**Negative / tradeoffs**:

- The full schema is more than any single slice needs on day one, which is up front work with no visible feature.
- A polymorphic audit record_id has no foreign key, so referential integrity there is the application's job.
- Better Auth owns its tables, so the schema is split between auth tables it manages and domain tables we manage.

**Neutral**:

- UUID v7 keys are larger and slightly slower to index than integer serials.
- The materials table stores a Cloudinary public id, not the file, so the file itself lives outside Postgres.
- Migrations apply as part of the API release, matching the stack decision.

## Follow-up

- [ ] The public API slice (feature 15) will add an API token table; that table is deliberately out of scope here and belongs to its own spec.
- [ ] Product analytics events live in PostHog, not this schema, and stay out of the database.
- [ ] The audit log spec (feature 14) finalizes the allowed action and record_type values, and whether sessions, materials, folders and class teacher assignments are recorded.
- [ ] If the directory ever needs to filter by department, add a person-to-department link as a small additive migration; today it filters by role only.

## Rationale

Reasoning and options: see `rationale.md`.
