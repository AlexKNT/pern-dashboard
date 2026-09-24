# Verify: design system & UI foundation · spec 0003 · updated 2026-09-24

_Steps derived from spec 0003 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## Commands

- [x] `npm run typecheck` in `web/` → no errors → AC-17
- [x] `npm run lint` in `web/` → no errors → AC-17, AC-18
- [x] `npm run build` in `web/` → `dist/` produced, no errors → AC-17
- [x] `npm test` in `web/` → 7 files, 66 tests pass → AC-19
- [x] `npm run check:contrast` in `web/` → 29 pairs checked, 0 below the minimum → AC-3
- [x] `npm run test:e2e` in `web/` → 11 checks pass in Chromium → AC-8, AC-9, AC-10, AC-20

## Token layer and contrast (AC-1, AC-2, AC-3)

- [x] Open `web/src/index.css` → two `:root` blocks (raw palette, then semantic roles) and one `.dark` block → AC-2
- [x] Confirm every role in the semantic block has a `.dark` value → AC-2, AC-3
- [x] Temporarily set `--foreground` in the light block to `var(--zinc-300)` → `npm run check:contrast` fails and names the pair → AC-3. Revert.
- [x] Open `web/design.md` → character, build mandate, the two token layers, the scales, the component inventory with usage and anti usage, and the accessibility rules are all present → AC-1
- [x] Confirm no semantic role appears in `index.css` without a matching entry in `design.md`, and the reverse → AC-1

## Theme (AC-4, AC-5)

- [x] `npm run dev`, open `/` signed out → you land on `/sign-in` → AC-10
- [x] With a session stubbed, open `/` → the shell renders with the sidebar, header and placeholder dashboard → AC-10, AC-12
- [x] Set the theme dropdown to **Dark** → the page goes dark, and `localStorage` key `pern-dashboard-theme` reads `dark` → AC-4
- [x] Set it to **System**, then change the operating system's colour scheme while the page is open → the interface follows without a reload → AC-4
- [x] Set it to **Dark**, then reload → no light flash on the way in → AC-5. To watch closely, throttle the network in the browser dev tools first.
- [x] With the preference set to `dark`, run `localStorage.setItem("pern-dashboard-theme", "chartreuse")` and reload → the app falls back to system and does not throw → AC-4

## Components and states (AC-6, AC-7, AC-15, AC-16)

- [x] Confirm the component list in `web/src/components/ui/` covers every name in AC-6 → AC-6
- [x] Confirm `AppShell`, `PageHeader`, `SidebarNav`, `EmptyState`, `ErrorState` and `DataTable` exist in `web/src/components/` → AC-7
- [x] Render a `DataTable` with `isLoading` → skeleton rows shaped like the table, and a status announcement → AC-15
- [x] Render a `DataTable` with no rows → `EmptyState` with its next action, not blank space → AC-15
- [x] Render a `DataTable` whose query fails → `ErrorState` with a working retry → AC-15
- [x] Trigger a failing mutation → a toast appears through Refine's notification provider → AC-16
- [x] Throw inside a page component → the error boundary shows a real screen, not a blank page → AC-16

## Shell, sidebar and header (AC-10, AC-11, AC-12)

- [x] Collapse the sidebar with its toggle → it becomes an icon rail, and the toggle is reachable by keyboard and named → AC-11
- [x] Reload after collapsing → it stays collapsed with no width flash → AC-11
- [x] Narrow the window below 768 pixels → the sidebar becomes a sheet, opened from the header → AC-11
- [x] Scroll a long page → the header stays visible → AC-12
- [x] Confirm the header holds the sidebar trigger, breadcrumbs, the theme switcher and the user menu → AC-12
- [x] Visit an unknown route inside the app → the not found screen renders inside the shell → AC-10

## Keyboard, focus and reduced motion (AC-8, AC-9, AC-13)

- [x] Tab through the header and sidebar → every control is reachable, in a sensible order, with a visible focus ring → AC-8
- [x] Open the user menu and press escape → focus returns to its trigger → AC-8
- [ ] Open the sidebar sheet below 768 pixels, then close it → focus returns to the header toggle → AC-8. **FAILED**: focus goes to `BODY`, not back to the toggle.
- [x] Press `Ctrl+K` (or `Cmd+K` on macOS) → the palette opens; type to filter; arrow keys move; enter navigates; escape closes and focus returns → AC-13
- [x] Confirm the palette lists only the destinations the current role may reach → AC-13, AC-14
- [x] Set the operating system to reduce motion, reload, and toggle the sidebar → nothing animates → AC-9

## Role aware navigation (AC-14)

- [x] Stub a session with `role: "admin"` → Departments, Subjects, Classes, Schedule, People and Audit log are all shown → AC-14
- [x] Stub `role: "teacher"` → Departments and People and Audit log are gone; My sessions is shown → AC-14
- [x] Stub `role: "student"` → only Dashboard, Classes and My classes remain → AC-14
- [x] Stub a session with **no** `role` field → only the destinations that carry no role are shown → AC-14
- [x] Stub `role: "parent"` (unrecognised) → the same as no role, and the user menu shows a disabled account item rather than a made up role → AC-14

## The palette lint rule (AC-18)

- [x] Add `className="bg-blue-500"` to a component under `web/src` → `npm run lint` fails and names the class → AC-18
- [x] Add `className="bg-background"` → the lint passes → AC-18
- [x] Confirm `web/src/index.css` is exempt and that `design.md` records the rule and its exception → AC-18

## Viewport floor (AC-20)

- [x] Set the browser to 360 by 720 pixels → every screen in the shell is usable and the page does not scroll sideways → AC-20
- [x] At 360 pixels, open the sidebar sheet, reach every destination and the header controls → AC-20

## Acceptance-criteria coverage

- AC-1 … the design.md steps · AC-2 … the token layer steps · AC-3 … the contrast command and the broken-value step
- AC-4 … the theme steps · AC-5 … the no-flash reload step · AC-6 … the component inventory step
- AC-7 … the app component existence step · AC-8 … the keyboard and focus steps · AC-9 … the reduced motion step
- AC-10 … the signed out and shell steps · AC-11 … the sidebar steps · AC-12 … the header steps
- AC-13 … the command palette step · AC-14 … the role filtering steps · AC-15 … the three DataTable state steps
- AC-16 … the toast and error boundary steps · AC-17 … the typecheck, lint and build commands · AC-18 … the lint rule steps
- AC-19 … the `npm test` command · AC-20 … the 360 pixel steps
