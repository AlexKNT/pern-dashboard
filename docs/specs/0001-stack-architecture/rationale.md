# 0001. Decoupled TypeScript stack on managed platforms · reasoning

Reasoning and options behind the stack decision in `index.md`.

## Context

> Premise note: `AGENTS.md` requires four layers (`domain`, `application`, `infrastructure`, `presentation`) with dependencies pointing inward. Read literally, that puts `domain` and `application` folders inside the React app, where they earn nothing: a browser app has no persistence boundary to invert, and the ceremony would sit between you and the screen you are building. The right framing is that the rule is an API side rule. Apply the four layers to `api/`, keep `web/` organised by pages, components and hooks, and let the shared vocabulary live in the generated API types. If the whole app is meant to be layered that way, say so and this decision changes.

This is a learning project first and a product second. The goal is to come out of it able to design a schema, build and secure an API, build a dashboard against it, test both, and run the result in production. That goal rewards a stack where every layer is separate enough to inspect on its own, and where the guidance available (the two reference repositories and twelve installed skills) matches the code being written.

The feature set is a university dashboard: three roles, departments and subjects, classes with join codes, scheduling, a directory, materials, analytics, an audit log, a public API, and finally translations, consent and legal pages. It is not a large scale system. The expected load is a few hundred concurrent users at most, which means the deciding forces are clarity, the cost of operating it, and how much is learned by running it, not throughput.

Constraints that shaped the decision: one engineer, no deadline, no team to hand operations to, no compliance regime beyond student personal data, and a strong aversion to paying for idle infrastructure while learning. Deployment was chosen to happen from day one, so the stack has to be deployable by one person without a platform team. The recorded conventions add their own requirements: strict TypeScript, tests first, WCAG AA, conventional commits, and a check on every push.

The cost of not deciding is paid later: a scaffold invented ad hoc means every feature after it argues with the folder layout, the auth wiring and the deployment target, and moving any of those after features exist is the expensive kind of change.

## Options considered

### Option 1: A decoupled TypeScript pair on managed platforms

Two apps in one repository. `web/` is Vite with React and Refine. `api/` is a long running Express server. Neon Postgres through Drizzle, Better Auth inside the API, Cloudinary for media, Resend for mail, Sentry and PostHog for visibility, both apps served from one Render service at a single address.

**Pros**:
- Matches the reference repositories and the installed skills, so the guidance you find is about the code you are writing.
- Every layer is inspectable: real server, real database, real browser app, each one you can open and read.
- A long running process keeps sessions, the connection pool and rate limiting simple to reason about.
- One host and one address means one place for secrets, no CORS to configure, and one dashboard to look at when something breaks.

**Cons**:
- Two apps to keep in step, and two installs.
- A long running service bills while idle, which functions would not.
- In production one service serves both, so the front end cannot be deployed on its own and its files are delivered by your Node process.

### Option 2: Serverless first

The same libraries, but the API is deployed as functions and the web app as static files, with a pooled or serverless database driver to survive the per request model.

**Pros**:
- Generous free tiers and no cost while idle.
- Preview deployments per branch come almost free.
- Nothing to keep alive.

**Cons**:
- Cold starts, and connection handling needs a pooler or a serverless driver, which is extra machinery to learn before anything works.
- Long running work, background jobs and websockets are awkward, which closes doors the scope later wants.
- The auth library, the rate limiting library and the reference repositories all assume a normal server, so more of your time goes on the difference.

### Option 3: Neon centric, one vendor

Take the whole backend from the database vendor: managed auth, storage and functions on the same Neon project, with the web app the only thing you deploy yourself.

**Pros**:
- Fewest accounts and one dashboard for everything.
- Auth, storage and branches provision together, so there is less wiring to get wrong.
- Cheapest to operate.

**Cons**:
- Removes exactly the learning this project exists for: auth wiring, hosting, storage signing.
- Your API code would live in a vendor runtime, which is harder to debug than your own process.
- Leaving later means rewriting auth and storage, and the installed `create-auth` and Cloudinary conventions stop applying.

### Option 4: One server rendered app

A single Express application that renders the dashboard and serves the API, with one deployment and no separate client.

**Pros**:
- One deployable, no CORS, no separate contract to maintain.
- The fastest route to a working screen.

**Cons**:
- Undoes the decoupled architecture the reference repositories and the whole scope assume.
- The public API feature stops being a share of existing routes and becomes new work.
- Removes the client and server boundary, which is the single most valuable thing to learn here.

## Rationale

The learning goal decides this one. A decoupled pair forces you to meet CORS, sessions across two origins, an API contract, and two deploy targets. A single app hides all four, and those four are what a fullstack engineer is actually paid to understand.

Option 1 aligns with the material you already have, which is not a small thing: the two reference repositories are the same shape, and all twelve installed skills cover a layer of this exact stack, so the guidance is about your code rather than adjacent to it.

The long running process is a deliberate rejection of the fashionable default. Sessions, a connection pool and rate limiting all get simpler when there is a process that stays up, and at this scale the cost of idling is a few dollars rather than a real constraint (basis: serverless for stateful workloads carries cold starts, execution limits and no persistent connections, which is a poor trade for a session based API).

Managed services everywhere is the right level of ambition for one engineer with no operations background (basis: full container orchestration is for teams with a platform engineering function; until then a managed application platform removes the orchestration burden). One Neon project with a branch per environment, plus a throwaway branch per pipeline run, is the cheapest insurance available for the riskiest part of the plan: the data model. Migration mistakes against a real database with real data are the most expensive thing to redo, and branches make that mistake recoverable.

Two of your own preferences are worth recording against the alternatives. You put both apps on Render instead of splitting the web app onto a static host, which buys one dashboard and one set of environment variables at the cost of a slightly less specialised front end. And you chose Render's git integration over a pipeline gated deploy, which is simpler and means a push deploys even when the checks are red; if that turns into a habit of deploying broken code, the pipeline gated variant is the stricter alternative and can be adopted later without changing anything else.

Serving both apps from one address is what makes the session decision work with no domain at all: same origin means no CORS configuration, no cookie domain, and nothing to renew. The cost is deferrable in one direction only, so it is the right trade while there is nothing to point a domain at, and splitting the two deployments later is a small change rather than a rewrite.

The tradeoff accepted knowingly: six accounts before the first feature is real overhead for a learning project. It is spread out by the scope order, which brings Sentry in with deployment and leaves PostHog until the analytics slice.

## References

**Project sources** (verifiable, in this repo):
- `AGENTS.md`, the recorded stack, rules, tooling choices and git setting
- `docs/scope/foundations.md`, feature 1 (the intent and its done when seeds)
- `docs/scope/index.md`, build approach Tracer Bullet and workflow Alpha
- the two reference repositories, `jsmastery-pro/classroom` and `jsmastery-pro/classroom-backend`
- the twelve installed skills listed under `## Decision` in `index.md`

**Practices & standards**:
- Monolith first, extract services only when a measured bottleneck or an ownership boundary forces it
- A relational database as the default store
- Use a proven auth library rather than building authentication
- Object storage for files, never files in the database
- Structured logging and error tracking from day one, not as an afterthought
- A managed application platform rather than self run orchestration for a small team
- Migrations applied with the release, so schema and code move together
- A branch per environment, and a throwaway branch for tests, so migrations meet real data before production
