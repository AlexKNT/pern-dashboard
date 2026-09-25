# 0006. Core enrollment loop (the walking skeleton)

**Date**: 2026-09-25
**Status**: Accepted

## Summary

This spec designs the first real slice of the product: a person signs in, an admin creates a class with a join code, a student joins with that code, and the teacher sees the roster. It is the walking skeleton, built thin but real through the database, the API and the screen. It also decides the enrollment rules the rest of the product will keep: full classes get a waitlist, leaving and rejoining is allowed, and roles come from one place.

## Requirements

**User stories**:

- As a student, I want to sign up and verify my email, so I can join classes with a code.
- As an admin, I want to create a class with a teacher and a join code, so students can join it.
- As a student, I want to enter a join code and land in the class, or on a waitlist when it is full, so my enrollment is real.
- As a teacher, I want to open a class and see the roster of enrolled students, so I know who is in my class.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: A person signs up with email and password, receives a verification email, verifies their address, and signs in to a working session. In development and tests the verification link is written to the log instead of mailed.
- **AC-2**: A self signed up account gets the student role. The seeded first admin exists and can sign in, and an admin can create teacher accounts from the app.
- **AC-3**: The migration adds the enrollment status (active, waitlisted, left), backfills rows that already left, and swaps the unique index so one current enrollment per class and student holds. The seed inserts one placeholder department and subject. The whole thing applies cleanly to a fresh Neon branch.
- **AC-4**: An admin creates a class with a name, a chosen teacher, and a capacity. The class stores the teacher in class_teachers and gets a unique join code.
- **AC-5**: A student joins a class with its join code and appears in the roster; the student then sees the class in their own list.
- **AC-6**: The roster is visible to the class's teachers and admins only; a student or a signed out caller is refused.
- **AC-7**: Joining a full class puts the student on the waitlist (status waitlisted). When a student leaves, the earliest waiter is promoted automatically in the same operation. Capacity counts active enrollments only.
- **AC-8**: Rejoining after leaving is allowed as a fresh enrollment. Joining a class the student is already in is refused with a conflict, and an invalid join code returns not found.
- **AC-9**: The full loop runs on the deployed apps: a real account signs in, a created class exposes a join code that works, a student joins with it, and the roster updates for the teacher.

## Decision

**Chosen option**: Option 2, the enrollment loop with a waitlist and verified sign in.

The skeleton signs people in with verified email and password, seeds one placeholder subject, lets an admin create classes with a teacher and a capacity, lets students join by code (with a waitlist when full), and shows the teacher the roster. Enrollment carries a status (active, waitlisted, left) with automatic promotion of the earliest waiter.

**Implementation skills**: `create-auth` (`better-auth/skills`, `.agents/skills/create-auth/`) · `better-auth-best-practices` (`better-auth/skills`, `.agents/skills/better-auth-best-practices/`) · `better-auth-security-best-practices` (`better-auth/skills`, `.agents/skills/better-auth-security-best-practices/`) · `email-and-password-best-practices` (`better-auth/skills`, `.agents/skills/email-and-password-best-practices/`) · `arcjet` (`arcjet/skills`, `.agents/skills/arcjet/`) · `neon-postgres` (`neondatabase/agent-skills`, `.agents/skills/neon-postgres/`)

## Feature design

**Data model sketch**:

The loop uses the tables from spec 0004, plus one small migration, applied in this order:

- Add `enrollments.status`: text, not null, default `active`, check constraint in (`active`, `waitlisted`, `left`).
- Backfill: set `status = 'left'` for every row where `left_at` is not null, before the new index is created.
- Swap the partial unique index on `(class_id, student_id)` from `where left_at is null` to `where status in ('active', 'waitlisted')`, and drop the old index in the same migration.
- Add a check constraint tying the two: `(status = 'left') = (left_at is not null)`, so status and left_at cannot drift.
- The seed inserts one `departments` row (name General) and one `subjects` row (name General) under it.

Existing columns keep their meaning: `joined_at` records when a student becomes active (set again on promotion), `left_at` records leaving, and `created_at` is the waitlist order key, with `id` as the tie breaker.

**State transitions**:

An enrollment moves through waitlisted to active to left, and active to left. A student who left starts a new row by joining again, which lands them in active or waitlisted depending on capacity.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /api/auth/* | Better Auth | email, password | session | public | 401, 409 (email taken) |
| /api/v1/classes | POST | name, teacherId, capacity (opt) | class with join_code and counts | admin | 403, 404 (teacher), 400 |
| /api/v1/classes/join | POST | code | enrollment with status | student | 404, 409 |
| /api/v1/classes/:id/leave | POST | id | the closed enrollment | student | 404, 409 |
| /api/v1/classes/:id/roster | GET | id, page, pageSize | students list | teacher of class or admin | 403, 404 |
| /api/v1/me/classes | GET | none | my classes | any signed in | 401 |
| /api/v1/users | POST | name, email, role, password | user | admin | 409 (email taken) |
| /api/v1/users | GET | role (teacher) | users list | admin | 401 |

The `/api/auth/*` routes are Better Auth's own surface, an exception to the `/api/v1` prefix, and they return Better Auth's own error shape. Every other route follows the API standard in spec 0005. The create class route defaults the subject to the seeded one on the server, so the client sends no subject. The join response carries the enrollment status, so the screen can show enrolled versus waitlisted. The class read returns the active and waitlisted counts so the teacher sees the queue.

**Value sourcing** (every value an acceptance criterion needs, with its source):

| Action | Value produced / displayed | Source |
|---|---|---|
| Sign up | the user's role | user.role, set to student on self sign up, never taken from the request |
| Verify email | the verification link | Better Auth, sent by Resend in production, logged in development and tests |
| Create class | the join code | generated as 6 unambiguous characters, normalized to upper case, classes.join_code unique |
| Create class | the teacher | a class_teachers row, from the teacherId the admin picked |
| Create class | the subject | the seeded subject, defaulted on the server |
| Create class | the capacity | classes.capacity, from the form, at least 1, null means unlimited |
| Create class | the queue the teacher sees | active and waitlisted counts, counted at read time |
| Join class | whether the class exists and is open | classes row with archived_at null |
| Join class | whether the class is full | classes.capacity compared to the count of active enrollments, under a lock on the class row |
| Join class | whether the student has a current row | enrollments where status in (active, waitlisted) |
| Join class | the resulting status | active when a seat is open, waitlisted when full |
| Leave class | the promoted student | the earliest waiter, ordered by created_at then id |
| Roster | the enrolled students | enrollments where status = active, joined to user, paginated |
| My classes (student) | their classes and status | enrollments where student_id = me and status is not left |
| My classes (teacher) | the classes they teach | class_teachers joined to classes |

**Key invariants**:

- A student has at most one current enrollment per class, active or waitlisted (the unique index).
- status and left_at cannot drift: a left row always has left_at set, and no other row does (check constraint).
- Capacity counts active enrollments only; a waitlisted student does not use a seat.
- The waitlist order is created_at ascending with id as the tie breaker, and promotion takes the earliest waiter first.
- The join transaction locks the class row before counting seats, so two students cannot both take the last seat.
- join_code is unique, normalized to upper case, and stays reserved after a class is archived.
- A class cannot be archived while it has active or waitlisted enrollments.
- A class belongs to exactly one subject; the skeleton seeds one so the form always has a value.
- role is one of admin, teacher, student, and only a user whose role is teacher may appear in class_teachers.

**Security model**:

- Self sign up is public and always creates a student. The server ignores any role the client sends, so a sign up cannot claim admin. Admin and teacher accounts are created by an admin through Better Auth, never by self sign up and never by writing the auth tables directly.
- Only an admin creates classes and user accounts. Only a signed in student joins or leaves a class. Only the class's teachers and admins read a roster.
- Student data is personal data, treated with care; no named compliance standard is in scope (from spec 0004).
- Arcjet rate limits the public sign in and sign up routes, and the join route, to slow join code guessing.
- The role rides in the session; a role change takes effect on the next sign in.

**Configuration required**:

- `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`: Better Auth's secret and origin, plus `trustedOrigins` for the development origin.
- `RESEND_API_KEY`: the mail provider for verification, used in production only and optional in the environment schema.
- `ARCJET_KEY`: rate limiting on sign in, sign up and join.
- `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`: the first admin, created by the idempotent seed script.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):

- Happy path: a signed up student verifies, joins a class by code, and appears in the roster the teacher sees, verifies AC-1 and AC-5.
- Failure case: joining a full class lands the student on the waitlist, and when a student leaves the earliest waiter is promoted, verifies AC-7.
- Auth/permission: a signed out caller and a student cannot read a roster, verifies AC-6.
- Constraint: two students joining the last open seat at the same time end with one active and one waitlisted, verifies AC-7 and AC-3.

## Build plan

1. Add the migration for enrollment status and the unique index, and the seed for the placeholder department and subject, satisfies AC-3.
2. Wire Better Auth in the API: email and password, verification with Resend in production and log output elsewhere, role as an additional field, and the auth route, satisfies AC-1.
3. Add the seed script that creates the first admin, satisfies AC-2.
4. Build the admin endpoints: create a class (name, teacher, capacity, join code), list teachers for the picker, and create a user with a role through Better Auth, satisfies AC-2 and AC-4.
5. Build the join and leave use cases: join locks the class row and handles full, waitlist and rejoin; leave closes the enrollment and promotes the earliest waiter in the same transaction, satisfies AC-5, AC-7 and AC-8.
6. Build the roster and my classes reads with pagination, satisfies AC-5 and AC-6.
7. Add requireAuth and requireRole middleware to every route, and Arcjet on sign in, sign up and join, satisfies AC-6.
8. Build the web screens and the dev proxy for /api/auth and /api/v1: sign in and sign up, admin create class and create teacher, student join, leave and my classes, teacher roster, satisfies AC-5 and AC-9.
9. Verify the loop end to end on the deployed apps, satisfies AC-9.

## Consequences

**Positive**:

- The first real slice proves the whole stack at once: database, API, auth, and screens, in one thread.
- The enrollment rules are decided once (waitlist, rejoin, status) and every later slice reuses them.
- Verified sign in means accounts are trusted from the start.

**Negative / tradeoffs**:

- The waitlist pulls a schema change and capacity into the skeleton, which is more than a thin thread strictly needs.
- Email verification in this slice means Resend is wired now, and the next feature (accounts that hold up) shrinks to password reset and profile.
- Auth plus enrollment in one slice is a lot; this is the largest slice so far.

**Neutral**:

- Departments and subjects are seeded placeholders; the real management screen still arrives in the later slice.
- The roster shows active students only; waitlisted students are not on the roster until promoted.

## Follow-up

- [ ] Feature 8 (accounts that hold up) no longer needs email verification; it is now password reset and profile. Reconcile that row in the scope.
- [ ] The data model spec (0004) is extended by this migration. Note the enrollment status and the index change there when /sync runs.
- [ ] Resend needs an account and a key before production; the seed script needs the first admin's email and password at deploy time.
- [ ] The deployed check for AC-9 needs a reachable mailbox or a pre-verified account to complete the verification step.
- [ ] Consider whether a waitlisted student should see their place in line on the my classes screen; this spec keeps it out of scope.

## Rationale

Reasoning and options: see `rationale.md`.
