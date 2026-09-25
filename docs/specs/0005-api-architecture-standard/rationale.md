# 0005. API architecture standard for the backend (rationale)

## Context

The stack and the data model are decided, but nothing says how backend features get written. The API is a thin scaffold: `app.ts` mounts JSON parsing and one `/health` router, `env.ts` validates the environment, `client.ts` opens the Drizzle connection, and `application/` and `domain/` are empty. The slices that follow all build on this surface, so the shape of it is load bearing.

AGENTS.md already states the rules: four layers with dependencies pointing inward, use cases that orchestrate without holding business rules, entities as plain objects, DTOs across boundaries, one agreed error handling pattern, validation at every boundary, tests first with supertest and a test database. But these are rules, not a pattern a developer applies on a Monday morning. They do not say how a route is declared, what a response looks like, how validation runs, how the session becomes a role check, or how the data layer is reached.

The stack spec (0001) pins the constraints this standard must honour: Express 5, Zod at every boundary, Better Auth sessions in the API, Arcjet on public routes, a structured JSON logger, Sentry, supertest, and an OpenAPI document generated from the Zod schemas with types for the web app. The data model spec (0004) pins the roles (admin, teacher, student), the single tenant shape, and the rule that authorization is enforced in the application layer, not the database. The web app consumes the API through Refine's simple-rest provider, whose default wire format (a bare object for a single read, a bare array plus an `x-total-count` header for a list) differs from the envelope this standard chooses, so a small custom provider maps between them.

Not deciding here means every slice invents its own error shape, envelope, and auth wiring, and the web data provider, the tests, and Sentry grouping all depend on one stable contract. The cost of drift compounds with each slice that lands. Development runs the two apps on separate ports, so cookie sessions need a same origin path in development as well as in production.

## Options considered

### Option 1: Document the standard and enforce it going forward

Define the standard precisely, enforce it at compile time through the route helper and the error types, lock the shapes with supertest, and make all new code comply. The single existing route is the only thing to migrate.

**Pros**:

- The route helper and the closed error union enforce the contract in the type system, which is stronger than review for the parts that matter.
- Almost nothing to migrate today, so the rollout is free.
- No new tooling beyond what the stack already promised.

**Cons**:

- The standard exists on paper until the first feature builds against it; enforcement is only as good as the first feature's example.
- A lint rule is deferred, so a direct `express.Router` is not mechanically blocked yet.

### Option 2: Document plus a single migration PR

Also write a lint rule now and refactor the existing code in one coordinated change.

**Pros**:

- Mechanical blocking of the wrong pattern from day one.
- The migration is done, not debt.

**Cons**:

- With one route in the repo, the migration PR is empty work and the lint rule has nothing to catch yet.
- Upfront cost before any feature has validated the pattern against real code.

### Option 3: Document only

Write the spec and rely on code review, no automated enforcement.

**Pros**:

- Zero tooling cost, fastest to produce.

**Cons**:

- Review is the weakest enforcement; drift returns within a few features.
- The whole point of a cross cutting standard is that it holds without a human remembering it.

## Rationale

Option 1 wins because the repo is almost empty, so a migration PR buys nothing and document only invites the very drift this spec exists to stop. The route helper and the typed error family give compile time enforcement for free, which is the strongest realistic mechanism for a project this size; a lint rule is a later addition only if drift appears.

The content choices follow the same reasoning, each tied to a specific force from the stack or the rules:

- Typed errors with one central middleware over result types: Express 5 already forwards rejected promises to a final handler, so a thrown `AppError` is idiomatic, Sentry gets a real stack trace, and use cases stay free of result plumbing through every layer.
- A clean envelope (`{ data }` single, `{ data, total }` lists) with a small custom provider over shaping the API to the simple-rest wire format: the default provider expects a bare object and a bare array plus an `x-total-count` header, and bending the API contract to one client would poison the OpenAPI document and the web types. The adapter is a small, testable piece in the web app.
- `/api/v1` over `/api`: the engineer chose to version early so a breaking change stays cheap later; the health probe stays outside the prefix at `/health`.
- The route definition helper over inline parsing or a Zod framework: one declaration is the single source for validation, handler types, the OpenAPI document and the web types, which is exactly the contract spec 0001 promised; a full framework adds opinion and a dependency for no gain over a small helper.
- A composition root with plain functions over a request context or a container: dependencies are visible, tests pass a test database in with no hidden state, and the four layer rule stays honest because nothing in application knows about the infrastructure.
- Repository factories with one transaction helper over repositories that own transactions or module singletons: multi step use cases stay atomic, a repository method can join the transaction's executor, and the ORM never leaks into application.
- `requireAuth` plus `requireRole` middleware with ownership checks inside use cases: coarse role sits at the edge, fine grained rules stay in the application layer, which is where AGENTS.md and spec 0004 put authorization.
- Page based lists over cursor pagination: the data table and Refine expect page numbers, and the expected volume does not justify cursor complexity.
- Request id plus one log line over errors only: one id traces a request across the log, Sentry, and the response, at the cost of one line.
- Arcjet on public routes only: it matches spec 0001, and signed in traffic is already authenticated.
- A stable error body with a machine code over a bare message: the web app, the tests, and Sentry grouping all need a string they can switch on.

## References

**Project sources** (verifiable, in this repo):

- `AGENTS.md`: the four layer rule, error handling, validation at the boundary, named exports, tests first.
- Spec `0001-stack-architecture`: the API contract, Zod at every boundary, the OpenAPI document and web types, Arcjet on public routes, the structured logger, Sentry, supertest.
- Spec `0004-data-model`: roles, the single tenant shape, authorization enforced in the application layer, no database row security.
- The existing API scaffold: `api/src/presentation/app.ts`, `api/src/presentation/routes/health.ts`, `api/src/infrastructure/config/env.ts`, `api/src/infrastructure/db/client.ts`.
- `web/src/providers/data-provider.ts` and `web/src/components/data-table.tsx`: the Refine simple-rest consumer and its server side pagination.
- `web/node_modules/@refinedev/simple-rest/src/provider.ts`: the provider's actual wire format, verified during the cross check.

**Practices & standards**:

- REST resource routing with machine readable error codes.
- Compile time enforcement through types over code review.
- Request id tracing through logs and error reports.
- Boring technology: Express idioms over new frameworks, since the team must operate this at 2am.
