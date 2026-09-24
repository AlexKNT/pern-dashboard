# PERN Admin Dashboard

## Stack

- **Language / Runtime**: TypeScript, Node.js
- **Web**: React via Vite, Refine for the admin shell, shadcn/ui on Radix, Tailwind CSS, Zod, TanStack Query through Refine's data provider
- **API**: Express, Drizzle ORM, Neon Postgres, Better Auth, Arcjet, Cloudinary
- **Package manager**: npm

## Build approach

<TBD, set by /scope>

## Commands

Nothing is scaffolded yet. The real install, dev, build and test commands land here from the next `/audit` or `/sync` run, once the web app and the API exist.

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

- Four layers: `domain`, `application`, `infrastructure`, `presentation`. Dependencies point inward only, `domain` imports nothing external, and no framework, ORM or HTTP code appears in `domain` or `application`.
- Use cases orchestrate and never hold business rules themselves. Infrastructure implements interfaces declared in `domain` or `application`.
- Entities are plain objects that enforce their own invariants. Cross boundary data travels as DTOs, never as entities.
- Folders are organised by layer: controllers, services and repositories on the API, components, pages and hooks on the web.
- Strict TypeScript: `strict` plus `noUncheckedIndexedAccess`, no `any`, exhaustive switches on unions. Tests come first: Vitest for units, supertest against the Express routes with a test database, and no infrastructure mocks in `domain` or `application` tests.
- One agreed error handling pattern for API errors, validation failures and UI error states. Validate environment variables at startup and fail fast. Consistent naming across files, folders, components, hooks, tables and API routes, named exports only, a short comment on every public API, conventional commits (`feat:`, `fix:`, `chore:`), and UI that meets WCAG AA.

## Tooling

- ESLint plus Prettier, with a hook before each commit that runs lint, format and typecheck on staged files.
- GitHub Actions runs lint, typecheck and tests on every push. `/develop tooling` installs exactly this list, and `/test` sets up Vitest.

## Git

- integration: on, branch prefix: `feat/`, commit: per-milestone

## Agent skills

- [arcjet](.agents/skills/arcjet/): `arcjet/skills`, rate limiting, bot detection and email validation on Express routes
- [create-auth](.agents/skills/create-auth/): `better-auth/skills`, scaffolding auth and wiring the Drizzle Postgres adapter
- [better-auth-best-practices](.agents/skills/better-auth-best-practices/): `better-auth/skills`, server and client setup, adapters, sessions, plugins, env vars
- [better-auth-security-best-practices](.agents/skills/better-auth-security-best-practices/): `better-auth/skills`, secrets, CSRF, trusted origins, session and cookie hardening
- [email-and-password-best-practices](.agents/skills/email-and-password-best-practices/): `better-auth/skills`, verification, password reset, password policy, hashing
- [neon](.agents/skills/neon/): `neondatabase/agent-skills`, choosing Neon primitives, CLI and MCP setup, branch first workflow
- [neon-postgres](.agents/skills/neon-postgres/): `neondatabase/agent-skills`, pooled and direct connections, migrations, branching, scale to zero
- [neon-postgres-branches](.agents/skills/neon-postgres-branches/): `neondatabase/agent-skills`, branch types for testing, branch per pull request, resetting from parent
- [shadcn](.agents/skills/shadcn/): `shadcn-ui/ui`, adding, fixing and composing shadcn components, registries and presets
- [vercel-react-best-practices](.agents/skills/vercel-react-best-practices/): `vercel-labs/agent-skills`, React performance guidance from Vercel engineering
- [vercel-composition-patterns](.agents/skills/vercel-composition-patterns/): `vercel-labs/agent-skills`, React composition patterns for reusable component APIs
- [web-design-guidelines](.agents/skills/web-design-guidelines/): `vercel-labs/agent-skills`, reviewing UI against the Web Interface Guidelines
Declined: community Drizzle skill (`bobmatnyc/claude-mpm-skills`)
MCP servers: context7 (connected), playwright (connected), Neon (recommended), shadcn (recommended), GitHub (recommended), Better Auth (recommended), Cloudinary (recommended), Vercel (recommended)

## Context files

<!-- Nested AGENTS.md files are listed here as they are created -->

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
