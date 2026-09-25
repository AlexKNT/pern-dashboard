# 0004. Core relational data model · reasoning

Reasoning and options behind the data model decision in `index.md`.

## Context

The scope names the entities every later slice builds on: accounts and roles, departments, subjects, classes, sessions, enrollments with join codes, materials, and audit entries. The stack decision (spec 0001) settled the storage: Neon Postgres through Drizzle with drizzle-kit migrations, Better Auth owning the auth tables in the same database, and Cloudinary holding files outside the database.

The force that dominates here is the scope's done condition: the schema, keys and relationships must support every slice below without a breaking migration later. A data model is the costliest thing to redo. Redesigning a table after features read from it means a migration, a code change in every layer, and often a data fix. So the schema is designed whole now, even though the build approach (Tracer Bullet) slices the features that read it.

The other forces are the conventions already recorded: strict TypeScript, the four layer rule keeping frameworks out of domain code, and a single engineer with no deadline. The expected load is a few hundred concurrent users, so the deciding forces are clarity and maintainability, not throughput.

## Options considered

### Option 1: One coherent relational schema, designed whole now (chosen)

Nine domain tables on top of Better Auth's standard tables, all designed up front with foreign keys, unique constraints and indexes, soft archiving, enrollment history, and a polymorphic audit log.

**Pros**:

- No breaking migration later; every slice's data needs are already representable.
- Database constraints enforce the invariants, not the application alone.
- One set of conventions (UUID v7, snake_case, timestamptz) across every table.

**Cons**:

- More tables than any single slice needs on day one.
- The audit log's polymorphic record_id can have no foreign key.

### Option 2: Minimal core schema now, grow per slice

Start with accounts, classes, join codes and enrollments, and add departments, subjects, sessions, materials and the audit log in later migrations as each slice needs them.

**Pros**:

- Less up front work, and the smallest schema ships with the skeleton.
- Each migration is small and easy to review.

**Cons**:

- Later slices add tables that earlier code already writes to, which is exactly the breaking migration the scope forbids.
- Relationships designed piecemeal tend to accumulate inconsistencies.

### Option 3: Flexible or denormalized storage

Store attributes that vary (class settings, material metadata, audit details) as JSONB columns instead of strict columns and join tables.

**Pros**:

- Fast to change shape without a migration.
- Fewer tables and joins.

**Cons**:

- Loses the relational integrity the scope relies on (joins, foreign keys, uniqueness).
- Queries over JSONB are harder to type and index, and the product is explicitly relational.

## Rationale

Option 1 is the only choice that satisfies the scope's core condition, no breaking migration later, while keeping the database doing the work of enforcing invariants. A relational schema with real foreign keys and unique constraints means a bug in one slice cannot silently write a subject with no department or two active enrollments. That is worth the up front cost of designing nine tables now (basis: your AGENTS.md rule that entities enforce their invariants, and the scope's done condition).

Option 2 fails the scope's own acceptance test: adding tables later that earlier code already reads is the breaking migration the scope explicitly rules out. Option 3 throws away the relational guarantees that a Postgres plus Drizzle stack is chosen for, and it would fight the typed query flow the stack decision set up (basis: spec 0001, Drizzle for typed queries close to SQL).

Within Option 1, the smaller calls each have a reason. UUID v7 keys are safe for the future public API and sort well, at the cost of slightly larger indexes than integer serials. Soft archiving through archived_at keeps history and stays reversible, and it is the pattern the scope's "archive" wording implies. Enrollment history (joined_at and left_at with a partial unique index) gives analytics and the audit log a true record of who joined and left, and it supports rejoin. A role string on the user table keeps one row per person with no extra join, and Better Auth already owns name and image for the profile.

The one consciously accepted weakness is the audit log. Its record_id points at one of several tables, so it cannot carry a foreign key, and referential integrity there is the application's job. Its action and record_type columns are text, constrained in the application rather than as database enums, so the audit log spec (feature 14) can settle the exact allowed values without a migration. That is the standard cost of an append only audit log, and it is worth it for a single place to filter who changed what.

## References

**Project sources** (verifiable, in this repo):

- `AGENTS.md`, the four layer rule and the "entities enforce their invariants" rule
- `docs/specs/0001-stack-architecture/index.md`, the storage, ORM and auth choices
- `docs/scope/foundations.md`, feature 3 (the entity list and the done condition)
- `docs/scope/academics.md` and `docs/scope/platform.md`, the slices the schema must support
- `docs/scope/index.md`, build approach Tracer Bullet and workflow Alpha

**Practices & standards**:

- A relational database as the default store for data with clear relationships
- Database constraints carrying invariants, not application code alone
- Soft archiving with an archived_at timestamp instead of hard deletes for records other rows reference
- Append only audit logs with a polymorphic record reference
