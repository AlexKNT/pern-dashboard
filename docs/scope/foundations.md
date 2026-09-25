# Foundations

The ground the whole product stands on. Nothing here is user facing, and every later slice depends on it, so it comes first. (`basis: foundations before features, cheaper foundation before what depends on it`)

### 1. Stack & architecture · done · Beta
Decide the stack and scaffold a runnable project, so every later slice builds on real structure rather than a guess.
**Done when:** the stack and the deploy target are recorded in a spec, and the empty scaffold installs, builds and starts locally.
- [x] Decide the stack (spec): `/architect stack & architecture`
- [x] Scaffold from the decision: `/develop stack & architecture`
Spec [0001](../specs/0001-stack-architecture/index.md) · code in `api/` and `web/`

(_basis: `AGENTS.md` already carries a stack read off your two reference repos, but it was never decided in a spec. The spec is the one place a provider or host gets chosen, and `Beta` is the tier this foundation is normally held to._)

### 2. Coding standards & tooling · in-progress
Capture the conventions and install the enforcement, so every later slice is written to the same rules and checked the same way.
**Done when:** root `AGENTS.md` describes the real scaffold, and lint, format, typecheck and the pipeline run clean.
- [x] Capture conventions + tooling choices: `/audit`
- [x] Install the tooling: `/develop tooling`
- [ ] Check it runs clean: `/test`
Spec [0002](../specs/0002-coding-standards-tooling/index.md) · decision ratified 2026-09-24 · lint, format, typecheck and pipeline in `api/eslint.config.js`, `web/eslint.config.js`, `.prettierrc.json`, `.githooks/pre-commit`, `.github/workflows/ci.yml`

(_basis: the audit already ran and captured the choices, so it is ticked. It ran before the scaffold existed, so the commands section is still empty and gets refreshed once the project lands._)

### 3. Data model · in-progress
The core entities every feature builds on: accounts and roles, departments, subjects, classes, sessions, enrollments and join codes, materials, audit entries.
**Done when:** the schema, keys and relationships support every slice below without a breaking migration later.
- [x] Design it (spec): `/architect data model`
- [x] Build it: `/develop data model`
  - [x] Database wiring and auth tables (deps, DATABASE_URL, Better Auth tables with role) (AC-1, AC-3)
  - [x] Domain tables with constraints and indexes (AC-2, AC-5, AC-6, AC-7)
  - [x] Migration generated and applied to a fresh branch (AC-1, AC-4)
  - [x] Constraint tests and the audit prune query (AC-2, AC-5, AC-6)
- [ ] Verify it: `/check verify data model`
Spec [0004](../specs/0004-data-model/index.md) · code in `api/src/infrastructure/db/` (`schema/`, `client.ts`, `audit-prune.ts`), `api/drizzle/`, `api/drizzle.config.ts`

(_basis: a wrong data model is the costliest thing to redo, so this one is never skipped or folded into another feature._)

### 4. Design system & UI foundation · in-progress
The visual language, layout primitives and base components, so three role experiences feel like one product and meet the accessibility bar.
**Done when:** `design.md` covers type, colour, spacing and components, and the base components handle focus, keyboard use and reduced motion.
- [x] Design it (spec): `/architect design system & UI foundation`
- [x] Build it: `/develop design system & UI foundation`
  - [x] Tokens, `design.md` and the toolchain, including the contrast check (AC-1, AC-2, AC-3, AC-17)
  - [x] Theme provider, first paint script and the switcher (AC-4, AC-5)
  - [x] The component set with `EmptyState`, `ErrorState`, `DataTable` and the error boundary (AC-6, AC-7, AC-15, AC-16)
  - [x] The shell: providers, routing, `AppShell`, sidebar, header, breadcrumbs, sign in placeholder and the Playwright checks (AC-10, AC-11, AC-12, AC-20)
  - [x] Role aware navigation, the command palette and the palette lint rule (AC-13, AC-14, AC-18)
  - [x] Behaviour tests throughout (AC-8, AC-9, AC-19)
- [ ] Verify it: `/check verify design system & UI foundation`
Spec [0003](../specs/0003-design-system-ui-foundation/index.md) · code in `web/` (`src/index.css`, `src/components/`, `src/lib/`, `src/providers/`, `src/pages/`, `scripts/check-contrast.ts`, `eslint-rules/no-raw-palette-class.js`, `e2e/shell.spec.ts`), recorded in `web/design.md`

(_basis: the visual language every later screen depends on, so it comes before the features that assemble pages. This pass also stands up the Refine shell, because a screen needs a layout to render into and the shell is mostly configuration. The command palette and toasts came in on request, which is why the build is sliced._)

### 5. Translations foundation · needs a decision
Locale plumbing and the first translated screens, in place before the screens multiply.
**Done when:** every string on a built screen comes from the message catalogue, and switching locale changes the interface along with date and number formats.
- [ ] Design it (spec): `/architect translations foundation`

(_basis: you put multiple languages in scope, and externalising strings is far cheaper before twenty screens exist than after._)

### 6. Deployment & environments · needs a decision
Both apps hosted in one environment, with secrets managed, failures reported and uptime watched.
**Done when:** a push to the main branch deploys the API and the web app, they reach a hosted database, a failing check blocks the deploy, and a thrown API error shows up in the monitoring dashboard with an alert.
- [ ] Design it (spec): `/architect deployment & environments`

(_basis: you chose to deploy from day one, so the deployed path belongs to the skeleton, not to a later phase. Error monitoring and uptime alerts fold in here because they are the same environment decision._)
