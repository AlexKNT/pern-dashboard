# 0001. Decoupled TypeScript stack on managed platforms

**Date**: 2026-09-24
**Status**: In Progress

## Summary

This project will be two TypeScript apps in one repository: a React dashboard (built with Vite and Refine) in `web/`, and an Express API in `api/`. Both are hosted on Render from a single service at one address, and the API runs as a normal long running Node process rather than as functions. Data lives in Neon Postgres, reached through Drizzle, with Better Auth handling sign in, Cloudinary holding media, Resend sending mail, Sentry watching errors, and PostHog counting usage.

The point of the shape is that every layer is visible and debuggable while you learn: real database, real server, real browser app, each one inspectable on its own.

## Decision

**Chosen option**: Option 1: a decoupled TypeScript pair on managed platforms.

Two apps in one repository, deployed to one managed service at a single address, with every stateful dependency (database, media, mail, errors, analytics) taken as a managed service rather than run by you.

**Implementation skills**: `create-auth` (`better-auth/skills`, `.agents/skills/create-auth/`) · `better-auth-best-practices` (`better-auth/skills`, `.agents/skills/better-auth-best-practices/`) · `better-auth-security-best-practices` (`better-auth/skills`, `.agents/skills/better-auth-security-best-practices/`) · `email-and-password-best-practices` (`better-auth/skills`, `.agents/skills/email-and-password-best-practices/`) · `neon` (`neondatabase/agent-skills`, `.agents/skills/neon/`) · `neon-postgres` (`neondatabase/agent-skills`, `.agents/skills/neon-postgres/`) · `neon-postgres-branches` (`neondatabase/agent-skills`, `.agents/skills/neon-postgres-branches/`) · `arcjet` (`arcjet/skills`, `.agents/skills/arcjet/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`) · `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`) · `vercel-composition-patterns` (`vercel-labs/agent-skills`, `.agents/skills/vercel-composition-patterns/`) · `web-design-guidelines` (`vercel-labs/agent-skills`, `.agents/skills/web-design-guidelines/`)

## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript on both sides, `strict` with `noUncheckedIndexedAccess` | One language across the boundary, and it is already the recorded project rule. |
| Runtime | Node.js, current long term support line, pinned at scaffold time | One runtime for both apps, matching the reference stack. |
| Repo shape | One repository, `web/` and `api/` side by side, no workspace tooling | Fewest moving parts, and no shared package to keep in step. |
| Web framework | React with Vite, Refine for the admin shell | Refine supplies auth, routing, data fetching and CRUD screens over a REST provider, which is most of what a dashboard is. |
| UI kit and styling | shadcn/ui on Radix with Tailwind CSS | Components you own outright, accessible primitives underneath, already the recorded choice. |
| Client data | TanStack Query through Refine's data provider | Caching, retries, pagination and invalidation without hand rolling them. |
| API framework | Express as a long running Node process | Predictable sessions, no cold starts, and a persistent database connection pool. |
| Validation | Zod at every boundary, environment variables checked at startup | One schema per shape, and those same schemas can describe the API document. |
| Primary database | Neon Postgres, one project with a branch per environment | Real relations and constraints, instant branches for development and tests, and it scales to zero while you learn. |
| ORM and migrations | Drizzle with `drizzle-kit`, migrations applied as part of the API's release | Typed queries close to SQL, and schema moves with the code that expects it. |
| Auth | Better Auth inside the API, Drizzle adapter, tables in your database | The auth code is yours to read and debug, and roles sit beside the users they describe. |
| Sessions | Cookie sessions on a single origin, because the API serves the built web app in production | A first party cookie works in every browser with nothing to buy, and it matches how the reference app behaves. |
| File storage | Cloudinary, with uploads signed by the API | Media stays out of the database, and the upload secret never reaches the browser. |
| Email | Resend | Verification, password reset and invitations from a small API with a usable free tier. |
| Rate limiting and bot defence | Arcjet on public routes | Rate limits and bot detection at the edge of the API, already a recorded project choice. |
| API contract | REST described by an OpenAPI document generated from the Zod schemas, with types generated for the web app | One source of truth for validation, documentation and the web app's types, and the public API feature inherits its docs. |
| Translations | react-i18next, wired through Refine's translation provider, locales English and Russian | Refine documents this pairing, so the shell's own labels translate with your screens. |
| Logging | A structured logger writing JSON lines, readable output locally | Levels and request context on every line, filterable once deployed. |
| Error tracking | Sentry on both apps, downtime alerts from Render itself | Error grouping with a free tier that is generous enough to start, and no extra account for uptime. |
| Product analytics | PostHog | Events, funnels and consent tooling in one place, which pairs with the cookie notice already planned. |
| Hosting | Both apps on Render, served from one web service (the API also serves the built web app) | One account, one dashboard, one address, nothing to buy, and a real Node process for the API. The apps stay separate in the repository and in development. |
| Address | The Render provided hostname, one for the whole app | Nothing to buy or renew, and one origin keeps the session cookie first party. |
| Deployment | Render's git integration deploys on push to the main branch; GitHub Actions runs lint, typecheck and tests as a separate signal | Simple to reason about, and the checks still run on every push. |
| Test database | A throwaway Neon branch created for each pipeline run | Real Postgres with the real migrations, and no test run can touch data you meant to keep. |
| Testing | Vitest for units, supertest against the Express routes | The recorded convention: tests come first. |
| Lint and format | ESLint with Prettier, enforced by a hook before each commit | The recorded tooling choice. |

## Consequences

**Positive**:
- One language and one type flow, from a database row to a rendered table cell.
- Every service chosen has a free or low cost starting tier, so learning costs almost nothing until it grows.
- Branch based databases make a risky migration testable against real data before it reaches production.
- Deploying on every push to the main branch means real environment feedback at each milestone, not at the end.

**Negative / tradeoffs**:
- Six external services (Render, Neon, Cloudinary, Resend, Sentry, PostHog) each need an account, a key and a rotation habit. That is real setup time before the first feature ships.
- One service in production means the API process also serves the front end's files, so a purely visual change still restarts the API, and static assets are not on a CDN.
- With no workspace tooling, the API's types reach the web app only through the generated document, so the generation step must run before typecheck or the web app cannot compile.
- A long running service bills while it sits idle, which functions would not.
- Render's git integration deploys whatever is pushed, independent of the checks. A red push can therefore reach the environment, and only you are watching.
- Two locales mean two sets of copy to keep in step from the first screen.

**Neutral**:
- The repository ends up with two package files, two install steps and two deploy configurations.
- The four layer rule in `AGENTS.md` applies to `api/`; `web/` stays organised by pages, components and hooks (see the premise note in the reasoning).
- A route without a Zod schema will be invisible in the API document, so the schema is the documentation.
- The exact Node long term support line gets pinned when the scaffold runs, not here.

## Follow-up

- [ ] Deployment is one service for now. If you later want the apps deployed separately, that is a small change: add a Render static site and revisit the cookie and cross origin settings. No code has to move.
- [ ] Pin the Node version in `.nvmrc` and in the Render service settings when the scaffold runs.
- [ ] Agent Skill and MCP discovery was offered for the new tools (Render, Resend, Sentry, PostHog, react-i18next, the logger, the API document tooling) and declined. Record those in the `Declined:` line of the root `AGENTS.md` Agent skills section so a later stage does not offer them again.
- [ ] The `Vercel` MCP server is still listed as recommended in `AGENTS.md`, and hosting is now Render. Ask `/sync` to replace it.
- [ ] `AGENTS.md` still reads `<TBD, set by /scope>` under Build approach. The scope records Tracer Bullet, so `/sync` should persist that line.

## Rationale

Reasoning and options: see `rationale.md`.
