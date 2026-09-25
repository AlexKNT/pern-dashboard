# 0005. API architecture standard for the backend

**Date**: 2026-09-25
**Status**: Accepted

## Summary

This decision sets the one way the Express API is built, end to end. Every backend feature uses one route definition helper that carries Zod schemas, one typed error family with one central error middleware, one response envelope the web app consumes through a small adapter, and one way to wire sessions, roles, services and repositories. It turns the four layer rule in AGENTS.md into a concrete, testable pattern, so the slices that come next do not invent their own.

## Decision

**Chosen option**: Option 1, document the standard and enforce it going forward.

The API follows one standard across every layer: a route definition helper that carries the Zod schemas, typed errors with one central error middleware, a clean data envelope the web app maps in its own provider, a `/api/v1` prefix, a composition root with plain functions, repository factories plus one transaction helper, `requireAuth` and `requireRole` middleware with fine grained checks inside use cases, page based lists, request id logging, Arcjet on public routes, and a stable error body. (basis: spec 0001, the API contract and validation rule · spec 0004, the auth and role model · AGENTS.md, the four layer rule)

**Implementation skills**: `better-auth-best-practices` (`better-auth/skills`, `.agents/skills/better-auth-best-practices/`) · `better-auth-security-best-practices` (`better-auth/skills`, `.agents/skills/better-auth-security-best-practices/`) · `arcjet` (`arcjet/skills`, `.agents/skills/arcjet/`) · `neon-postgres` (`neondatabase/agent-skills`, `.agents/skills/neon-postgres/`)

## Standard definition

**Where each concern lives** (the concrete four layer map):

| Layer | Folder | Holds |
|---|---|---|
| presentation | `src/presentation/` | routers, controllers, the route helper, the error handler, the auth and request id middleware |
| application | `src/application/` | services (use cases), repository interfaces, DTOs with their Zod schemas, the `AppError` family, `AuthUser` and `Role` in `identity/`, shared pieces in `shared/` |
| domain | `src/domain/` | entities and invariants, no framework or ORM imports |
| infrastructure | `src/infrastructure/` | Drizzle repositories, Better Auth, the transaction helper, the logger, config, the DB client |

**Canonical pattern** (the one right way, one full request path):

```ts
// application/errors.ts  (plain TypeScript, no framework imports)
export type ErrorCode =
  | "validation"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "internal";

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
export class ValidationError extends AppError {
  constructor(details: unknown) {
    super("validation", 400, "The request is not valid.", details);
  }
}
export class NotFoundError extends AppError {
  constructor(message: string) {
    super("not_found", 404, message);
  }
}
export class UnauthenticatedError extends AppError {
  constructor() {
    super("unauthenticated", 401, "Sign in first.");
  }
}
export class ForbiddenError extends AppError {
  constructor(message = "You do not have access.") {
    super("forbidden", 403, message);
  }
}
export class ConflictError extends AppError {
  constructor(message: string) {
    super("conflict", 409, message);
  }
}
export class RateLimitedError extends AppError {
  constructor() {
    super("rate_limited", 429, "Too many requests.");
  }
}
```

```ts
// presentation/http/error-handler.ts  (the one place errors become responses)
export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  const appError = toAppError(error);   // maps library failures to AppError
  response.status(appError.status).json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details === undefined ? {} : { details: appError.details }),
    },
  });
  if (appError.status >= 500) {
    logger.error({ err: error, requestId: response.get("x-request-id") }, "unhandled error");
  }
}
// toAppError maps: a Postgres unique violation (23505) to ConflictError,
// a JSON body parse error to ValidationError, an Arcjet denial to RateLimitedError,
// anything else to AppError("internal", 500).
```

```ts
// application/identity/identity.ts
export type Role = "admin" | "teacher" | "student";
export type AuthUser = { id: string; role: Role };

// presentation/http/auth.ts
// requireAuth calls Better Auth getSession and stores the AuthUser on res.locals.user.
// requireRole(...roles) answers 403 when the role is not allowed.
export function requireAuth(req, res, next): void { /* ... */ }
export function requireRole(...roles: Role[]): RequestHandler { /* ... */ }
```

```ts
// application/classes/classes.service.ts  (the use case; rules live here)
export function makeClassesService(repository: ClassesRepository) {
  return {
    async getClass(actor: AuthUser, id: string): Promise<ClassDto> {
      const entity = await repository.findById(id);
      if (!entity) throw new NotFoundError("No such class.");
      if (!canReadClass(actor, entity)) throw new ForbiddenError();
      return toClassDto(entity);   // mapper sits beside the DTO
    },
  };
}

// application/classes/classes.repository.ts  (interface, declared where it is used)
export interface ClassesRepository {
  findById(id: string): Promise<ClassRow | null>;
  join(classId: string, studentId: string): Promise<void>;
}

// infrastructure/repositories/classes.repository.ts  (factory, so methods can join a transaction)
export function makeClassesRepository(executor: Executor): ClassesRepository { /* db queries */ }

// infrastructure/db/transaction.ts  (one helper for multi step writes)
export async function withTransaction<T>(fn: (tx: Executor) => Promise<T>): Promise<T> { /* ... */ }
```

```ts
// presentation/controllers/classes.controller.ts  (thin, returns the bare DTO; the helper wraps)
export function makeClassesController(service: ClassesService) {
  return {
    async getClass({ params, user }: RouteContext): Promise<ClassDto> {
      return service.getClass(user, params.id);
    },
  };
}
```

```ts
// presentation/routes/classes.routes.ts  (the helper ties schema, auth, envelope and handler)
const router = defineRoutes("/api/v1/classes");

router.get("/:id", {
  summary: "Read one class",
  params: z.object({ id: z.uuid() }),
  response: classDtoSchema,
  auth: ["admin", "teacher"],               // compiles to requireAuth + requireRole
}, classesController.getClass);              // wraps into { data: dto }

router.get("/", {
  summary: "List classes",
  query: listQuery(["name", "capacity"]),   // page, pageSize, sort, q, whitelisted fields
  item: classDtoSchema,                      // list variant; wraps into { data, total }
  auth: ["admin"],
}, classesController.listClasses);

export const classesRouter = router.build();
```

```ts
// index.ts  (the composition root; builds deps, then the app)
const db = makeDb();
const repositories = { classes: makeClassesRepository(db) };
const services = makeServices(repositories);  // services close over repositories
const app = createApp(services);              // routers and controllers close over services
app.listen(env.PORT);
```

**The route definition helper is the contract.** Each route declares its method, path, summary, request schemas (body, query, params), response or item schema, an optional `status` (201 for create, 204 for delete with no body), and allowed roles. The helper validates the request, types the handler from the schemas, wraps the returned DTO in the envelope, and records every schema in a module level registry that feeds the OpenAPI document and the web types. The helper is the only way to declare a route. The API returns `{ data: <dto> }` for a single read and `{ data: <items>, total: <count> }` for a list; `total` comes from one `count() over ()` query. Errors return `{ error: { code, message, details? } }` with a stable machine code. The web app's default simple-rest provider does not read this envelope, so `web/src/providers/data-provider.ts` gets a small custom provider that maps it, and `VITE_API_URL` points at `/api/v1`. (basis: spec 0001, the OpenAPI from Zod contract · the simple-rest provider source at `web/node_modules/@refinedev/simple-rest/src/provider.ts`)

**List conventions.** List endpoints read `page` (1 based, default 1), `pageSize` (default 20, max 100), `sort` (a whitelisted field, `-field` for descending), and `q` (search across the endpoint's searchable fields). A shared `listQuery(fields)` factory builds the Zod query schema from a whitelist and hands the repository a field to column map, so an unsortable field is a validation error. They return `{ data, total }`, with `total` from one `count() over ()` query. The custom web provider maps Refine's `_start`, `_end`, `_sort` and `_order` to these names. (basis: `web/src/components/data-table.tsx`, server side pagination)

**Error codes.** `validation` 400, `unauthenticated` 401, `forbidden` 403, `not_found` 404, `conflict` 409, `rate_limited` 429, `internal` 500, all members of the closed `ErrorCode` union. Validation `details` is the result of Zod's `error.flatten()`, a fixed `{ fieldErrors, formErrors }` shape the web app can type. The error handler maps library failures to these codes: a Postgres unique violation (23505) to `conflict`, a JSON parse error to `validation`, an Arcjet denial to `rate_limited`. The 404 handler for unknown routes uses `not_found`. Express 5 forwards rejected promises to the error handler, so handlers are `async` with no wrapper. (basis: Express 5.2.1, already in `api/package.json`)

**App assembly.** `createApp(services)` mounts, in order: the request id middleware, `express.json({ limit: "1mb" })`, the route routers, the 404 handler, then the error handler last. JSON only, no form encoding.

**Cross cutting concerns.** A request id middleware sets `x-request-id` (honours an inbound value, generates a crypto UUID otherwise) and echoes the header on the response. One structured log line carries the request id; the logger is pino in `infrastructure/logging.ts`, with a request scoped child that binds the id and redacts `cookie` and `authorization`. Sentry initialises in `index.ts` and reports only 5xx errors, with the request id on the scope. Arcjet attaches to public routes only: sign in, sign up, password reset, and join code attempts; `ARCJET_KEY` enables it, live in production and dry run elsewhere, one rule per route. (basis: spec 0001, the structured logger and Arcjet on public routes)

**Replaces** (patterns now wrong):

- A raw `express.Router` with `router.get(...)` and no schema, no auth declaration, no response schema.
- A per route `try` and `catch` block that maps errors inline.
- A handler that returns the envelope itself, instead of the bare DTO the helper wraps.
- `response.json(someObject)` with a bare object or array instead of the envelope.
- `schema.parse(...)` called by hand inside a controller.
- A repository method that opens its own transaction for a multi step write.
- A module level repository singleton that cannot join a transaction.
- Reading the Better Auth session or checking a role inside a controller.
- A magic string error body with no stable code.

**Enforcement**:

- Compile time: the route helper types the handler from the schemas, so an unvalidated handler does not typecheck; the closed `ErrorCode` union keeps the error codes fixed.
- Runtime: the error handler is always mounted last in `createApp`, and the 404 handler uses the same shape.
- Tests: supertest against `createApp(services)` asserts the envelope, the error body, and the status codes; application and domain tests pass fake repositories in with no infrastructure mocks. (basis: AGENTS.md, tests come first)
- The web app's custom provider is covered by its own data provider tests.
- A lint rule banning a direct `express.Router` is a later addition, only if drift appears.

**Rollout**:

- New code complies from the first feature onward. The single existing route (`/health`) moves onto the helper in the first feature and stays at `/health`, outside `/api/v1`. The web custom provider lands with the first feature that reads data.

**Development cross origin.** The web dev server (5173) and the API (3000) are different origins, so a Vite dev proxy serves `/api` from the API to keep cookies first party in development. Production is one origin, no CORS. (basis: spec 0001, single origin cookie sessions)

**Exceptions**:

- `/health` is a plain liveness probe and keeps its bare `{ status: "ok" }` shape until it moves onto the helper. No other route is exempt.

## Consequences

**Positive**:

- One pattern means any engineer can read any feature's backend without relearning it.
- Validation, handler types, the OpenAPI document and the web types all come from the one route declaration, so they cannot drift apart.
- A stable, closed error code set lets the web app, the tests and Sentry grouping all switch on the same strings.
- The layers stay honest: no ORM or HTTP code leaks into application, because repositories are interfaces and controllers are thin.

**Negative / tradeoffs**:

- The web app needs a small custom data provider to map the envelope to Refine, which is a real piece of code to maintain.
- Every feature pays the file overhead of router, controller, service, repository and schemas, even for a trivial endpoint.
- The OpenAPI and type generation step is a real build dependency that must run before the web app typechecks (already flagged in spec 0001, now made concrete).
- The helper forbids ad hoc `router.get` calls, which is friction for anyone used to raw Express.

**Neutral**:

- The standard lives only in this spec until the first feature builds against it, at which point the health route migrates and this pattern becomes the example everyone copies.
- Development runs the two apps on two ports with a dev proxy; production runs one origin.

## Follow-up

- [ ] The health route still uses a raw `Router`; the first feature moves it onto the helper (or makes it the canonical example).
- [ ] The web custom data provider is not written yet; it lands with the first feature that reads data and maps the envelope, `page`/`pageSize`/`sort` and `total` for Refine.
- [ ] The OpenAPI tooling is not installed. With the first feature, add a Zod to OpenAPI document generator and `openapi-typescript` for the web types, and verify they are still current then (this space moves).
- [ ] `supertest`, `@types/supertest`, pino, Sentry and Arcjet are not in `api/package.json` yet; add them with the first feature or the tooling slice.
- [ ] If drift appears later, add a lint rule that bans a direct `express.Router` outside the helper.

## Rationale

Reasoning and options: see `rationale.md`.
