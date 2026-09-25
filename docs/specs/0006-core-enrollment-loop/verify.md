# Verify: core enrollment loop · spec 0006 · updated 2026-09-25

_Steps derived from spec 0006 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [x] Sign up at `/sign-up`, open the verification link written to the API log, then sign in → AC-1
- [x] Sign in as `admin@example.com`, open Classes, create a teacher, then sign in as that teacher → AC-2
- [x] As an admin, create a class with a name, a teacher and a capacity → a six character join code appears → AC-4
- [x] As a student, join with that code in My classes → the class appears with the status Enrolled → AC-5
- [x] Fill a class to its capacity, the next student joins and is Waitlisted, one student leaves, and the earliest waiter is promoted → AC-7
- [x] Join a class the student is already in → a conflict. Enter a wrong code → not found → AC-8
- [x] Read a roster signed out → 401. As a student → 403. As the class teacher → 200 → AC-6

## Commands

Run the API commands from `api/` and the web commands from `web/`.

- [x] `npm run typecheck` in both apps → exits 0
- [x] `npm run build` in both apps → exits 0
- [x] `npm test` in `web/` → 66 tests pass
- [x] `npm run lint` in `web/` → exits 0
- [x] `npm test -- src/application/enrollments/enrollments.service.test.ts src/presentation/app.test.ts` in `api/` → 11 tests pass

The API's full `npm test` also runs the constraint tests, which truncate every table on the database the env points at. Run that against a throwaway branch, set with `TEST_DATABASE_URL`, never the production branch.

## Acceptance-criteria coverage

- AC-1 covered by the sign up step · AC-2 by the admin and teacher step · AC-4 by the create class step · AC-5 by the join step · AC-7 by the waitlist and promotion step · AC-8 by the conflict and not found step · AC-6 by the roster permission step · AC-3 by the migration applied and live on the database · AC-9 carried to feature 6 (deployment & environments); run the loop on the deployed apps there.
