# 0003. Design system, UI foundation and the admin shell

**Date**: 2026-09-24
**Status**: Accepted

## Summary

This decision gives the web app its visual language and its working parts before any real screen is built. Design tokens (the named values for colour, type, spacing and radius) live as two layers of CSS custom properties, a `design.md` explains them, and a set of base components is installed through shadcn/ui on Radix over Tailwind CSS. On top of that comes the Refine application shell: providers, routing, a collapsible sidebar, a sticky header with a theme switcher and a user menu, breadcrumbs and a not found screen. The point is that every later feature assembles a page from decided parts instead of inventing a colour, a spacing value or a table.

## Requirements

**User stories**:

- As an engineer building any later feature, I want tokens, components and a shell that already exist, so that I build the feature and not the foundation under it.
- As an admin, teacher or student, I want the same product with navigation that matches my role, so that I recognise where I am and what I may reach.
- As a user who prefers dark mode or reduced motion, I want the interface to respect that preference, so that using it does not strain my eyes or make me ill.
- As a keyboard or screen reader user, I want every interactive part reachable, labelled and visible when focused, so that I can use the product without a mouse.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: `web/design.md` exists and documents the token layers (raw palette, then semantic roles), the spacing scale, the type scale, the radius scale, the component list with usage and anti usage, and the accessibility rules the components hold to.
- **AC-2**: Tokens are declared as CSS custom properties in `web/src/index.css` in two layers, mapped into Tailwind's theme so utility classes read semantic names. The raw palette layer holds the named steps, and the semantic layer names exactly these roles: `background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `destructive-foreground`, `border`, `input`, `ring`, and the sidebar group `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring`. The starting values are the shadcn default token set on the `zinc` base colour, recorded in `design.md`, and the spacing, type and radius steps are written out there too.
- **AC-3**: Every semantic role has a light and a dark value, and both themes pass WCAG AA contrast for body text on the surfaces those roles are used on, verified with a named contrast check rather than by eye.
- **AC-4**: The theme switcher is one control, a dropdown select offering light, dark and system. It stores the choice under the `pern-dashboard-theme` key, applies the resolved theme by adding the `dark` class to `document.documentElement` (and removing it for light), and when set to system it reads `(prefers-color-scheme: dark)` and follows it, including when the system preference changes while the app is open.
- **AC-5**: The theme is applied before first paint, so a page loaded with dark stored does not flash light on the way in. An inline script in `web/index.html` runs the same resolve as `web/src/lib/theme.ts` (stored preference, then the `(prefers-color-scheme: dark)` media query when the preference is `system`, defaulting to `system` when the key is unset or unreadable) before the app bundle loads.
- **AC-6**: The base component set is installed and each is usable on its own: `button`, `input`, `label`, `form` (with error messages tied to their field), `textarea`, `select`, `checkbox`, `table`, `dialog`, `alert-dialog`, `dropdown-menu`, `popover`, `command`, `tooltip`, `badge`, `card`, `avatar`, `separator`, `skeleton`, `sonner` (toasts), `tabs`, `breadcrumb` and `sidebar`.
- **AC-7**: `AppShell`, `PageHeader`, `SidebarNav`, `EmptyState`, `ErrorState` and `DataTable` exist in `web/src/components/`, are documented in `design.md`, and are the components later pages use for layout, page headings, navigation, the three load and error states, and tabular lists.
- **AC-8**: Every interactive component is reachable by keyboard in a sensible order, shows a visible focus indicator that meets non text contrast, and carries an accessible name; dialogs and menus trap focus and return it to the trigger on close; the mobile sidebar is a sheet that does the same.
- **AC-9**: Every animated component honours `prefers-reduced-motion`: with the preference set, transitions and animations are removed or reduced to a near instant change, and nothing moves that would not otherwise.
- **AC-10**: The shell renders at `/` inside the Refine providers with routing, and a signed out or sessionless visitor is redirected to the sign in route `/sign-in` without an unhandled error. A placeholder page exists at that route until the accounts feature replaces it.
- **AC-11**: The sidebar collapses to icons and expands again, the collapsed state persists across a reload so it does not flash on the way in, it becomes a sheet below 768 pixels (Tailwind's `md` breakpoint, which is above the 360 pixel floor in AC-20), and the toggle is reachable by keyboard with an accessible name.
- **AC-12**: The header holds the sidebar trigger, breadcrumbs, the theme switcher and a user menu, and stays visible while the page scrolls.
- **AC-13**: A command palette opens from `Cmd+K` on macOS and `Ctrl+K` elsewhere, lists the navigation destinations available to the current role, and closes on selection or on escape, returning focus to where it was.
- **AC-14**: A navigation list is built from a single declaration of destinations, each carrying the roles allowed to see it, and the rendered menu shows only the destinations the current role may reach.
- **AC-15**: A list view loading shows skeleton rows shaped like the table it will become, an empty result shows `EmptyState` with a next action, and a failed request shows `ErrorState` with a retry, rather than a bare spinner or a raw error.
- **AC-16**: Mutation failures surface through Refine's notification provider as a toast, and an unhandled render error shows an error boundary screen instead of a blank page.
- **AC-17**: `web/package.json` carries the toolchain: Tailwind CSS v4 and `@tailwindcss/vite`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`, the Radix packages each component needs, `@refinedev/core` and `@refinedev/react-router` on Refine 5, `@refinedev/simple-rest`, `@refinedev/react-table` with `@tanstack/react-table`, `react-router` 7, Vitest, React Testing Library and `jsdom`. The `@` path alias maps to `web/src` and resolves in `vite.config.ts` and in `tsconfig.app.json` (the app project, alongside `tsconfig.node.json`). `npm run lint`, `npm run typecheck` and `npm run build` pass in `web/`.
- **AC-18**: A local ESLint rule named `no-raw-palette-class` fails the lint when a raw palette utility class (a Tailwind colour utility whose value is not one of the semantic role names, for example `bg-blue-500` or `text-gray-700`) is used under `web/src`. Its only exception is `web/src/index.css` itself, where the palette is declared. `design.md` records the rule and the exception.
- **AC-19**: Vitest with React Testing Library and `jsdom` runs in `web/` and covers the theme resolve and persist logic, the navigation list's role filtering, and that each interactive component is reachable and labelled.
- **AC-20**: The web app's minimum supported viewport is 360 pixels wide, and every screen in the shell is usable at that width with no horizontal scrolling of the page itself. Because `jsdom` has no layout engine, this one is checked in Playwright, not Vitest.

## Decision

**Chosen option**: Option 1, tokens and components as the foundation, with the Refine shell built on top in the same spec and sliced.

Install shadcn/ui components on Radix over Tailwind CSS v4, express the visual language as two layers of CSS custom properties that Tailwind's theme maps to, document it in `web/design.md`, and stand the Refine shell (providers, routing, sidebar, header, breadcrumbs, command palette, toasts, error boundary) on that base. Ship it in Tracer Bullet slices so each slice ends runnable.

**Implementation skills**: `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`) · `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`) · `vercel-composition-patterns` (`vercel-labs/agent-skills`, `.agents/skills/vercel-composition-patterns/`) · `web-design-guidelines` (`vercel-labs/agent-skills`, `.agents/skills/web-design-guidelines/`)

## Feature design

**Modules and files**:

- `web/src/index.css`: Tailwind import, the raw palette layer, the semantic role layer for light and dark, the `@theme inline` mapping, the type and radius scales.
- `web/src/components/ui/*`: the shadcn components (owned in the repo, not a dependency).
- `web/src/components/`: `app-shell.tsx`, `page-header.tsx`, `sidebar-nav.tsx`, `empty-state.tsx`, `error-state.tsx`, `data-table.tsx`, `error-boundary.tsx`, `theme-provider.tsx`, `theme-switcher.tsx`, `command-palette.tsx`, `user-menu.tsx`.
- `web/src/lib/navigation.ts`: the single declaration of destinations with the roles allowed to see each.
- `web/src/lib/utils.ts`: the `cn` helper.
- `web/src/lib/theme.ts`: reading, writing and resolving the theme preference, separated from React so it is testable.
- `web/src/providers/`: `data-provider.ts` and `auth-provider.ts` for Refine, and the wiring in `App.tsx`.
- `web/src/pages/`: a placeholder dashboard page the shell renders, a placeholder `sign-in.tsx` at `/sign-in`, and `not-found.tsx`.
- `web/eslint-rules/no-raw-palette-class.js`: the local lint rule, registered in `web/eslint.config.js`.
- `web/index.html`: the Google Fonts link for the chosen family, and the inline theme script described in AC-5.
- `web/design.md`: the written standard.
- `web/src/components/**/*.test.tsx` and `web/src/lib/*.test.ts`: the behaviour tests.
- `web/e2e/shell.spec.ts`: the Playwright checks that need a real layout engine.

**Type choices**:

- Body and interface face: `Outfit`, loaded from Google Fonts with `display=swap`. It is the face the reference app uses, so the two can be compared directly.
- Mono face: `ui-monospace` and the platform stack, used for codes (join codes, subject codes) and identifiers. No second download for a face that appears in small amounts.
- Type scale: a 1.25 ratio from a 16 pixel base, giving 12, 14, 16, 20, 25, 31 and 39 pixels, written out with the spacing and radius steps in `design.md`.

**Data model sketch**:

No database entities. The durable state this feature owns is small and client side:

| Value | Where it lives | Shape | Notes |
|---|---|---|---|
| Theme preference | `localStorage`, key `pern-dashboard-theme` | `"light" \| "dark" \| "system"` | Defaults to `"system"` when unset or unreadable |
| Resolved theme | the `dark` class on `document.documentElement` | `"light" \| "dark"` | Derived from the preference plus `(prefers-color-scheme: dark)` |
| Sidebar collapsed state | cookie `sidebar_state`, one week, `SameSite=Lax` | `"true" \| "false"` | Written and read by `AppShell`; a cookie rather than storage so the first paint agrees with the markup |
| Session | from Better Auth through the auth provider | `{ user: { id, name, email, role: Role } } \| null` | Null until the accounts feature lands, which is why the shell must render signed out |

**Type definitions**:

- `Role = "admin" | "teacher" | "student"`. The type lives in `web/src/lib/navigation.ts` and is the one place the three roles are named.
- A session whose user has no `role`, or an unrecognised one, is treated as having no role: only unmarked destinations are shown, and the user menu renders a disabled account item rather than a role label.
- `DataTable` props: `columns: ColumnDef<T>[]`, `data: T[]`, `isLoading: boolean`, `error: unknown | null`, `onRetry: () => void`, `pageSize?: number` (default 10), `total?: number`, `emptyState?: React.ReactNode`, `pagination?: "server" | "client"` (default `"server"`). Built on `@refinedev/react-table` with `@tanstack/react-table`, so sorting and pagination go through the data provider rather than being reimplemented. It renders skeleton rows while `isLoading`, `ErrorState` when `error` is set, and `emptyState` when there are no rows.
- `EmptyState` props: `title: string`, `description?: string`, `action?: { label: string; to: string }` (a route, since the shell uses client routing), `icon?: LucideIcon`.
- `ErrorState` props: `title?: string`, `message?: string`, `onRetry: () => void`.
- `SidebarNav` props: `items: NavigationItem[]`, where `NavigationItem = { label: string; to: string; icon?: LucideIcon; roles?: Role[]; group?: string }`. An item with no `roles` is visible to every role.

**Layout and grid**:

Layout uses Tailwind's default breakpoints: a single column below 768 pixels (`md`), where the sidebar is a sheet, and a two column content grid at `lg` (1024 pixels) for the summary cards a later dashboard uses. The 360 pixel floor in AC-20 is the smallest screen this must work on, not a breakpoint.

**State transitions**:

Theme preference: one control, a dropdown select, moves directly between `light`, `dark` and `system`. The resolved theme is recomputed on every preference change and on a system preference change while the preference is `system`.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/auth/get-session` | GET | session cookie (opt) | `user { id, name, email, role: Role }` or null | session cookie | 200 with null body when there is no session |

This is the single network dependency the shell has. The data provider is pointed at `VITE_API_URL` for all resources, but no resource endpoint is called until a later feature adds one. There is no new API route in this spec.

**Value sourcing** (every value each action produces, computes, or displays names where it comes from):

| Action | Value produced / displayed | Source |
|---|---|---|
| Resolve the theme for render | `"light" \| "dark"` | derived: the preference read from `localStorage` under `pern-dashboard-theme`, combined with `window.matchMedia("(prefers-color-scheme: dark)")` when the preference is `system` |
| Render the first paint | the `dark` class on the document element | derived: written by the inline script in `web/index.html`, which runs the same resolve as `web/src/lib/theme.ts` before the bundle loads |
| Switch the theme | the stored preference | input: the dropdown select's value, written to `localStorage` under `pern-dashboard-theme` |
| Persist the sidebar | `"true" \| "false"` | derived: written to the `sidebar_state` cookie by `AppShell` on change, read back at start |
| Render the navigation | the list of visible destinations | derived: `web/src/lib/navigation.ts` filtered by the session `role`, with an absent or unrecognised role showing unmarked items only |
| Render the user menu | name, email and role label | from the session (`/api/auth/get-session`), or a "Sign in" action linking to `/sign-in` when the session is null |
| Render the user avatar | initials | derived: first letters of the session name, since no avatar image exists until the accounts feature |
| Render `EmptyState` | the next action label and its route | input: the `action` prop, whose `to` is a route string the calling page supplies |
| Render `ErrorState` | the retry action | input: the `onRetry` prop, bound by the calling page to its query's `refetch` |
| Render a skeleton list | the row count | input: the `pageSize` prop, defaulting to 10 |
| Run the contrast check | the pass or fail per role pair | derived: computed from the token values in `web/src/index.css`, since a hand check goes stale the moment a value moves |

**Key invariants**:

- Every colour used in `web/src` comes from a semantic role; no raw palette utility class appears in application code (enforced by AC-18).
- Every semantic role exists in both themes; a role with only a light value is a bug.
- The behaviour tests must not query for a class name to assert something is visible; they assert on roles and labels, so a theme change cannot break them.
- `design.md` and the token file cannot disagree: a token added to `index.css` without a row in `design.md` fails review, and the reverse too.
- The shell renders with a null session without throwing, because the accounts feature does not exist yet.
- The inline theme script and `web/src/lib/theme.ts` resolve the theme identically. A change to one without the other is a bug, because the two disagreeing is what produces a flash.
- Every semantic role has a dark value. A role whose dark value is a copy of its light value is treated as unwritten, since it hides a role that was never resolved.
- An absent or unrecognised role never grants access to a destination marked for a specific role.

**Security model**:

There is no new authorization surface. The navigation is role filtered, but that filtering is presentation only: it decides what is shown, never what is permitted. Every real check happens on the API, which is the rule in `AGENTS.md` and the reason a hidden menu item is not a security control. The auth provider reads the session from the API over a first party cookie and stores nothing of its own. No token, key or secret reaches the browser bundle; only `VITE_API_URL`, which is a public address. The theme and sidebar preferences are non sensitive and are safe in `localStorage` and a cookie.

**Configuration required**:

- `VITE_API_URL`: the API base address the Refine data provider and auth provider call. In development this points at the local API; in production it is the same origin, since one service serves both apps.

**Critical test scenarios**:

- Happy path: the shell renders at `/` with the sidebar, header, breadcrumbs and the placeholder dashboard, and the dropdown select moves the interface between light, dark and system. Verifies **AC-10**, **AC-12**, **AC-4**.
- Happy path (Playwright): at a 360 pixel viewport the shell is usable, the sidebar becomes a sheet, and the page does not scroll sideways. Verifies **AC-20**, **AC-11**.
- Failure case: no session returns from `/api/auth/get-session`, so the shell renders signed out and redirects to `/sign-in` without an unhandled error. Verifies **AC-10**.
- Failure case: a list query rejects, and `ErrorState` renders with a working retry instead of a raw error or a blank region. Verifies **AC-15**, **AC-16**.
- Failure case: the stored theme is corrupt or unreadable, and the app falls back to system without throwing. Verifies **AC-4**.
- Failure case: a session arrives with no `role` field, and only unmarked destinations render. Verifies **AC-14**.
- Accessibility (Playwright): with the keyboard only, the sidebar toggle, every navigation item, the theme select, the user menu and the command palette open, operate and return focus correctly, and no interactive element is unnamed. Verifies **AC-8**, **AC-11**, **AC-13**.
- Accessibility (Playwright): with reduced motion set, the sidebar and dialog transitions do not animate. Verifies **AC-9**.
- Regression: the contrast check over the token pairs passes in both themes and fails when a role is moved to a clearly insufficient value. Verifies **AC-3**.
- Regression: the lint rule rejects a raw palette class and passes a semantic one. Verifies **AC-18**.

## Build plan

Ordered as Tracer Bullet slices: the first slice stands the thinnest end to end thread (tokens resolved and applied to a rendered shell), then each later slice thickens one part of it while the app keeps running. Each slice ends in a state you can open in a browser.

**Slice 1, the thin thread (AC-1, AC-2, AC-3, AC-17)**

1. [x] Install the toolchain and wire the `@` alias to `web/src` in `vite.config.ts` and `tsconfig.app.json`, initialise the shadcn CLI on the `zinc` base colour, add the Google Fonts link to `web/index.html`, and confirm `lint`, `typecheck` and `build` still pass. Satisfies **AC-17**.
2. [x] Declare the raw palette and the full semantic role set for light and dark in `web/src/index.css`, with the `@theme inline` mapping into Tailwind and the spacing, type and radius scales. Satisfies **AC-2**, **AC-3**.
3. [x] Write `web/design.md`: the two token layers with their value tables, the scales, the font choice, the component inventory with usage and anti usage, and the accessibility rules. Satisfies **AC-1**.
4. [x] Add the contrast check over the token pairs for both themes, so a role that fails AA fails a command. Satisfies **AC-3**.
5. [x] Add the `prefers-reduced-motion` and focus visibility base styles in `web/src/index.css`, so every component inherits them. Base styles only; the per component behaviour lands in Slice 3. Satisfies **AC-9**, **AC-8**.

**Slice 2, theme (AC-4, AC-5)**

1. [x] Write `web/src/lib/theme.ts` (read, write and resolve, with the media query listener) and `theme-provider.tsx` over it. Satisfies **AC-4**.
2. [x] Add the inline script to `web/index.html` that runs the same resolve before the bundle loads, and the `theme-switcher.tsx` dropdown select. Satisfies **AC-5**, **AC-4**.
3. [x] Add the tests for the resolve and persist logic, including corrupt stored values, an unset key, and a system preference change while open. Satisfies **AC-19**, **AC-4**.

**Slice 3, the components (AC-6, AC-7, AC-15, AC-16)**

1. [x] Install the base component set through the shadcn CLI and review each one against `design.md` (focus ring, motion, labels). Satisfies **AC-6**.
2. [x] Build `EmptyState`, `ErrorState` and `DataTable` to their defined prop signatures, with sorting and pagination through `@refinedev/react-table`, and `error-boundary.tsx`. Satisfies **AC-7**, **AC-15**, **AC-16**.
3. [x] Wire Refine's notification provider so mutation failures land as toasts. Satisfies **AC-16**.
4. [x] Add the reachability and labelling tests across the interactive set, and the reduced motion and focus behaviour these components own. Satisfies **AC-19**, **AC-8**, **AC-9**.

**Slice 4, the shell (AC-10, AC-11, AC-12)**

1. [x] Write `data-provider.ts` reading `VITE_API_URL` and `auth-provider.ts` reading the session endpoint, then wire Refine 5 with the `@refinedev/react-router` bindings, the `/sign-in` placeholder page, the signed out redirect, and the `/` route in `App.tsx`. Satisfies **AC-10**, **AC-17**.
2. [x] Build `AppShell` (owner of the `sidebar_state` cookie), `SidebarNav` and `PageHeader`, with the collapsible icon sidebar, the persisted state and the sheet below 768 pixels. Satisfies **AC-11**, **AC-12**, **AC-7**.
3. [x] Build `user-menu.tsx`, the breadcrumbs and `not-found.tsx`, and confirm the signed out path end to end. Satisfies **AC-12**, **AC-10**.
4. [x] Add the shell tests: render at `/`, signed out redirect to `/sign-in`, sidebar keyboard toggle and focus return. Satisfies **AC-19**, **AC-10**, **AC-11**.
5. [x] Add `web/e2e/shell.spec.ts` for the checks that need a real browser: the 360 pixel viewport, keyboard traversal and focus return, and reduced motion. Satisfies **AC-20**, **AC-8**, **AC-9**.

**Slice 5, role aware navigation and the palette (AC-13, AC-14, AC-18, AC-20)**

1. [x] Write `web/src/lib/navigation.ts` with the `Role` type, the destinations and their allowed roles, and the filter that builds the rendered menu from the session role, including the no role case. Satisfies **AC-14**.
2. [x] Build `command-palette.tsx` over the same declaration, including `Cmd+K` and `Ctrl+K`, the escape behaviour and the focus return. Satisfies **AC-13**.
3. [x] Write the local ESLint rule `no-raw-palette-class` in `web/eslint-rules/`, register it in `web/eslint.config.js`, and allow the declaration site in `web/src/index.css`. Satisfies **AC-18**.
4. [x] Add the rule's own test: a raw palette class fails, a semantic class passes, and the index file is exempt. Satisfies **AC-18**, **AC-19**.

## Consequences

**Positive**:

- Every later feature starts from a shell that already works, so the core enrollment loop builds a screen rather than plumbing.
- The two token layers mean a theme change or a rebrand is an edit in one file, not a hunt through components.
- The dark theme exists from the first screen, which is far cheaper than retrofitting one onto twenty screens.
- The palette lint rule turns a convention into something the pipeline enforces, so the design language survives contact with deadlines.
- Keyboard and reduced motion behaviour is built into the components once, so it is inherited rather than remembered.
- The reference app's conventions carry over, so `design.md` describes a shape you can compare against a working example.

**Negative / tradeoffs**:

- This is the largest foundation feature in the scope: tokens, components, the shell, providers, routing, the command palette and tests in one spec. The slicing keeps it shippable but the total is real work before any product feature exists.
- The auth provider is stubbed to a session endpoint that always returns null until the accounts feature lands, so the signed in shell cannot be seen end to end yet. That gap closes in a later slice, but it exists now.
- The command palette and toasts are conveniences that were not needed to satisfy the scope wording, and they add surface area to maintain.
- A `localStorage` theme plus an inline script in `index.html` is a small amount of code outside the React tree, which is easy to forget when the theme logic changes.
- Pointing Refine at a real REST data provider before any resource endpoint exists means an unhandled request would produce a console error rather than a clean empty state, so the placeholder page must not call a resource.
- Tailwind v4's CSS first configuration is newer and less documented than the v3 config file, so some problems will be solved by reading source rather than a blog post.
- `web/` keeps its own conventions (pages, components, hooks) rather than the four layer rule that applies to `api/`, which is a deliberate asymmetry recorded in spec 0001 and easy to trip over.

**Neutral**:

- The shadcn components are copied into the repo, not installed as a dependency, so they are yours to amend and will not receive upstream fixes automatically.
- Light, dark and system all need checking whenever a component is added, so the review surface for a new component is slightly larger.
- The role filter in the navigation is presentation only, so a reader might mistake it for access control. The security model above says otherwise in writing.
- The bar is `AGENTS.md`'s WCAG AA for this pass; the accessibility feature row later rechecks every surface, which is where anything missed here gets caught.
- Google Fonts is an external request on first load, unlike a self hosted face, which is a small performance and privacy cost accepted in exchange for less repository setup.

## Follow-up

- [ ] **Deviation from the decided toolchain, recorded during the build.** `@tanstack/react-table` was pinned to v8 rather than the current v9, because `@refinedev/react-table`'s published build is written against v8's API and does not run on v9. `react-router` was pinned to v7 for the same reason: `@refinedev/react-router` resolves v7. Revisit both when Refine ships v9 and v8 support.
- [ ] **Deviation, the command palette.** The palette is `web/src/components/command-palette-dialog.tsx`, written here, rather than the registry's `command` component over `cmdk`. `cmdk` fails on this project's React version: the command root creates its store with `useMemo` and a child reads it through `useSyncExternalStore` on the first render, so it throws `Cannot read properties of undefined (reading 'subscribe')`. Reproduced with `cmdk` 1.1.1 and 1.0.4 in isolation. The replacement is a search field over a filtered list of buttons, which keeps the keyboard, focus and screen reader behaviour the acceptance criteria ask for. Revisit if `cmdk` ships a fix.
- [ ] **Deviation, the signed out guard.** The redirect is `RequireSession` in `web/src/components/sign-in-guard.tsx`, not Refine's `Authenticated`. That guard renders nothing while the session query is in flight, which is a blank screen rather than a redirect. The replacement is a few lines and takes the redirect decision explicitly.
- [ ] The `Authenticated` guard's behaviour is worth reporting upstream, and the `cmdk` failure with it. Both cost real debugging time and neither is visible from the documentation.
- [ ] `@refinedev/react-table` imports `lodash/isEqual` without a file extension, which Node's ESM resolver rejects. Vitest inlines that one package to work around it (`web/vitest.config.ts`). Worth a follow-up if it ever affects the production bundle; it does not today, because Vite resolves it at build time.
- [ ] The Google Fonts link in `web/index.html` is an external request and a small privacy consideration. If that matters later, a self hosted variable font removes it without changing any component.
- [ ] The auth provider is a stub until the accounts feature lands. When it does, revisit `auth-provider.ts` and the signed out redirect rather than rebuilding the shell.
- [ ] The real per role destinations are invented here to prove the filter works. The core enrollment loop and the later features own the real list; `navigation.ts` is the one place to change.
- [ ] `web/design.md` and the token file must be kept in step. Once a second feature adds a component, consider whether a test can assert the two agree, rather than relying on review.
- [ ] The starting token values are the shadcn defaults on the `zinc` base colour, adopted so the foundation is not blocked on a colour decision. Changing the brand colour later is a value edit in `index.css` plus the contrast check, not a component change.
- [ ] `AGENTS.md` lists Vitest for units but not Playwright. This spec needs a real browser for the viewport, focus and reduced motion checks, so `/sync` should record Playwright alongside Vitest in the tooling section, and `/test` should set both up.
- [ ] The sign in page at `/sign-in` is a placeholder. The accounts feature owns the real one; when it lands, revisit that page and the signed out redirect rather than rebuilding the shell.
- [ ] `AGENTS.md` still reads `<TBD, set by /scope>` under Build approach, and the scope records Tracer Bullet. `/sync` should persist that line, which this spec's build plan relies on.
- [ ] The `shadcn` skill, and the three `vercel-labs` skills this design leans on, are already listed in root `AGENTS.md`. No context file change is needed for them.

## Rationale

Reasoning and options: see `rationale.md`.
