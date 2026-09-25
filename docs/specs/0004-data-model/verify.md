# Verify: Data model · spec 0004 · updated 2026-09-25

_Steps derived from the data model decision in spec 0004 and the scope's Done when line. `/check verify` runs these; `/test` locks the durable ones._

## Commands

- [ ] `npm install --prefix api` after the database dependencies are added → finishes with no errors → AC-1
- [ ] `npx drizzle-kit generate --name init` in `api/` → writes one migration file under the migrations directory → AC-1
- [ ] `npx drizzle-kit migrate` against a fresh Neon branch → applies with no errors and creates the nine domain tables plus the Better Auth tables → AC-1, AC-4
- [ ] `npm run typecheck --prefix api` → exits clean → AGENTS.md: strict TypeScript
- [ ] Insert a duplicate join_code into classes → the insert is rejected by the unique constraint → AC-2
- [ ] Insert a second active enrollment for the same class and student → the insert is rejected by the partial unique index → AC-2
- [ ] Run a prune query that deletes audit entries older than 365 days → only older entries are removed → AC-6

## Acceptance-criteria coverage

- AC-1 (migration creates the full schema and applies cleanly) → the generate and migrate steps
- AC-2 (foreign keys and uniqueness) → the two rejection checks
- AC-3 (auth tables plus role) → the migrate step's Better Auth tables check
- AC-4 (every slice, no breaking migration) → the migrate step against a fresh branch
- AC-5 (conventions) → the typecheck step plus the migration review
- AC-6 (audit entries and prune) → the prune check
- AC-7 (indexes for directory, roster, teaching load, schedule and materials) → the migrate step's schema review

Still open, and not part of this build:

- The API token table for the public API slice (feature 15) arrives in its own spec.
- PostHog holds product analytics events, not this schema.

## Concrete steps after the build

- [ ] `npm run db:migrate` in `api/` with the direct Neon URL in `DATABASE_URL` → applies `drizzle/0000_*.sql` with no errors → AC-1
- [ ] Confirm the schema is live: 13 tables and 15 foreign keys exist on the branch → AC-1, AC-4
- [ ] `TEST_DATABASE_URL=<throwaway branch> npm test` in `api/` → 9 tests pass (2 uuid unit tests, 7 constraint tests) → AC-2, AC-5, AC-6
- [ ] Query `user` → `name`, `image` and `role` present, with the admin/teacher/student check constraint → AC-3
- [ ] Review the migration SQL → uuid primary keys, snake_case names, `timestamp with time zone`, `archived_at` soft archive, trigram indexes on `user.name` and `user.email` → AC-5, AC-7
