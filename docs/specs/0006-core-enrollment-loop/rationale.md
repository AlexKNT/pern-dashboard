# 0006. Core enrollment loop (rationale)

## Context

The stack (0001), the data model (0004) and the API standard (0005) are decided. This is the first real slice, the walking skeleton, and the first time anything is built through the whole stack. Nothing ships yet beyond the shell and the schema.

The scope flagged this feature as needing a decision because the enrollment rules were open: what happens when a student joins a full class, and what happens when they rejoin after leaving. There are also two structural gaps the skeleton has to bridge. A class must belong to a subject, but departments and subjects are a later slice. And a class needs a teacher, but teacher accounts must come from somewhere.

The consequence of not deciding here is that the first slice invents temporary answers (a 409 on full classes, no teacher) and the next slice has to redo the join path. The whole point of a walking skeleton is that the thread is real, so its rules should be the real rules.

## Options considered

### Option 1: The thinnest skeleton

Sign in without email verification, join a full class is refused with a 409, no waitlist, no teacher assignment.

**Pros**:

- Smallest amount of work to get the loop moving.
- No schema change.

**Cons**:

- The enrollment rules stay undecided and the next slice redoes the join.
- No teacher means the roster has no one to see it, so the loop is not actually closed.
- Verification is deferred, so accounts are not trusted.

### Option 2: The loop with a waitlist and verified sign in (chosen)

Verified email sign up and sign in, one seeded subject, classes with a teacher and capacity, a join path with a waitlist, and a roster for teachers.

**Pros**:

- The rules are decided once and reused by every later slice.
- The loop is genuinely closed: a real account, a real class, a real join, a real roster.
- Accounts are verified from day one.

**Cons**:

- The biggest slice so far, and it pulls a schema change (enrollment status) into the skeleton.
- Resend has to be wired now, not later.

### Option 3: The full academic structure now

Also build subject and department management inline, rosters for everyone, and the waitlist.

**Pros**:

- Nothing is a placeholder.

**Cons**:

- It is not a thin thread anymore; it overlaps the later slices and risks a slow first release.

## Rationale

Option 2 wins because the walking skeleton must be real, and the rules it needs are exactly the ones the scope said were undecided. The engineer chose verification now and a waitlist over a refusal, and both are defensible: verified accounts make the enrollment loop trustworthy from the start, and a waitlist is kinder to students and far cheaper to build now than to retrofit after the join path exists.

The waitlist does force one small change to the data model: a status on enrollments so the loop can tell active, waiting and left apart, and an index that keeps one current row per class and student. That is the right trade because a waitlist added later would have to migrate live enrollments, which is riskier than a small column now. Capacity setting comes along with it, because a waitlist that can never fill is a rule nobody can see. The waitlist also needs a producer, so the slice adds a leave action; leaving and promoting the next waiter share one transaction, and the join locks the class row so two students cannot both take the last seat.

The teacher and subject gaps are bridged with the smallest honest moves: a seeded placeholder subject and an admin who picks an existing teacher, with the admin able to create teacher accounts. Both are real data, not hacks, so the later slices just build management screens over the same tables.

## References

**Project sources** (verifiable, in this repo):

- Spec `0001-stack-architecture`: Better Auth, Resend, Arcjet, Neon, and the deployed single origin.
- Spec `0004-data-model`: classes, enrollments, class_teachers, users with role, join_code and its constraints.
- Spec `0005-api-architecture-standard`: the route helper, error codes, envelope, auth middleware, and list conventions.
- `AGENTS.md`: the four layer rule, tests first, and the Tracer Bullet approach.
- The scope row for feature 7 (core enrollment loop) in `docs/scope/academics.md`.

**Practices & standards**:

- Walking skeleton: a thin thread through every layer, real from the first slice.
- Rate limiting on public and guessable routes.
- Pagination on every list.
- Deciding enrollment rules once, at the skeleton, rather than redoing the join path later.
