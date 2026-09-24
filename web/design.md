---
name: academic-admin-design-system
source: derived
character: "Quiet, precise, administratively serious. The interface gets out of the way of the data: a near neutral zinc ladder, one restrained accent used only for primary actions, hairline borders instead of shadows, and generous space so a dense table still reads calmly. Outfit gives headings and body a slightly geometric warmth that keeps a records tool from feeling like a spreadsheet."
tokens: "Real values live in `web/src/index.css`. Read them there. They are never duplicated in this file."
contrast: "Verified by `npm run check:contrast`, 29 pairs, both themes. Body text 19.89:1 light and 19.05:1 dark. Muted text on a muted surface 7.02:1 light and 5.66:1 dark. Text on primary 16.98:1 light and 13.98:1 dark. Focus ring 7.73:1 light and 4.12:1 dark."
---

## Build mandate

You are a senior product designer, not a form wirer. Every screen in this app ships as a complete, professional product surface: a visible brand mark, real copy written for this product, a considered layout with genuine hierarchy, every state (populated, empty, loading, error), supporting content where it earns its place, and a footer on any page that warrants one. A lone form floating on empty canvas is a defect, not a first draft. Dead zones, naked controls, default only styling and missing states are all failures.

Full disqualifier list: the `/develop` UI guide's bar.

## Character & direction

**The mood is institutional calm.** This is a university's academic management tool used every day by administrators, teachers and students. It must feel dependable and unhurried rather than exciting.

The specific moves that define it:

- **One accent, used sparingly.** There is no brand colour yet; primary actions use the near black zinc step rather than a hue. This is deliberate, a records tool should not shout. When a brand colour arrives it is a value change for `--primary` and `--sidebar-primary`, nothing else.
- **Borders, not shadows.** Depth comes from a hairline border and a surface step, never from a drop shadow. The only place a shadow appears is where a surface genuinely floats above the page (popover, dropdown, dialog).
- **Density with air.** Tables and lists are information dense, so the surrounding chrome is generous: wide page padding, clear section rhythm, and never two competing focal points in one view.
- **Restrained motion.** Three durations only, all short. Nothing bounces, nothing slides for decoration.

## Composition patterns

**The shell.** Every signed in screen renders inside `AppShell`. It owns the outer frame: a sidebar on the left, a sticky header across the top, the routed page in the middle, and toasts over everything. A page never draws its own sidebar, header or page frame.

**A page.** A page starts with `PageHeader` (title, supporting line, and its primary action on the right), then its content sections below. `PageHeader` is the only `<h1>` on the screen; sections use `<h2>`.

**A collection page** (departments, subjects, classes, the directory). `PageHeader` with the create action, then a filter or search row, then a `DataTable`, then pagination. The table owns its own loading, empty and error states, so the page does not wrap it in another.

**A detail page.** An identity header carrying the record's name and its key actions, then grouped sections, then anything related to the record. Related content never sits above the identity header.

**A dashboard.** Summary cards in a two column grid at `lg` and a single column below it, then the primary table or feed for the role. Each card carries one number and its label, not a chart for its own sake.

**Auth screens.** Two pane: brand and product value on one side, the form in a card on the other. Below `md` the brand pane collapses to a compact brand row above the form.

## Component & usage rules (do's and don'ts)

**Colour**

- Do use the semantic role utilities: `bg-background`, `text-muted-foreground`, `border-border`, `bg-sidebar`.
- Don't use a raw palette class (`bg-zinc-500`, `text-gray-700`) anywhere under `web/src`. The local ESLint rule `no-raw-palette-class` fails the lint on it; `web/src/index.css` is the one exception, because that is where the palette is declared.
- Don't write `dark:` colour overrides. A role already resolves differently in dark; a `dark:` override means a role is missing.
- Don't use colour to carry meaning on its own. Pair a destructive colour with a word or an icon.

**Primary actions**

- Do use `variant="default"` on the `Button` for one action per view, the thing the user came to do.
- Don't put two primary buttons in the same view; the second is `variant="secondary"` or `variant="outline"`.
- Don't use the destructive variant for anything that is not destructive.

**Surfaces**

- Do use `Card` with its full composition (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
- Don't nest a card inside a card, and don't use a card purely as a border around a form.
- Do use `Separator` for a divider, never a raw `<hr>` or a bordered `<div>`.

**Forms**

- Do use `FieldGroup` and `Field` for form layout, and mark a field invalid with `data-invalid` on the `Field` and `aria-invalid` on the control.
- Don't build form layout from a `div` and `Label`; the field components own the label, description and error wiring.
- Don't rely on a placeholder as a label.

**Tables**

- Do use `DataTable` for any tabular collection, so pagination, sorting, loading, empty and error behaviour are consistent.
- Don't build a table by hand from `div`s, and don't render a raw spinner in place of the table.

**Search and the command palette**

- Do use `CommandPalette` for keyboard navigation. It reads the same declaration the sidebar does, so the two cannot disagree.
- Don't add an action with a side effect to the palette. It navigates; it does not run anything.

**Pages**

- Do start every page with `PageHeader`, which carries the screen's only `<h1>`.
- Don't add a second `<h1>` or a second primary action to one view.

**Spacing**

- Do use Tailwind's spacing utilities, which follow a 4 pixel base unit and an 8 pixel rhythm.
- Do use `gap-*` on a flex or grid container, never `space-x-*` or `space-y-*`.

**Motion**

- Do use the duration tokens (`duration-instant`, `duration-base`, `duration-slow`).
- Don't add an animation or transition that the reduced motion media query would have to remove on its own; if it is decoration, leave it out.

**Radius**

- Do use the scale: `rounded-sm` for a checkbox or a small control, `rounded-md` and `rounded-lg` for buttons, inputs and cards, `rounded-full` for pills and avatars.
- Don't use an arbitrary radius value.

## Accessibility rules the components hold to

These are already built into the token layer and the component set; a new screen inherits them rather than reimplementing them.

- **Focus is always visible.** One `:focus-visible` outline is declared once in `index.css`, using the ring role and a two pixel offset, and every interactive element inherits it.
- **Reduced motion is honoured.** A single media query in `index.css` collapses every animation and transition to a near instant change. Nothing is built that depends on movement to be understood.
- **Both themes are first class.** Every semantic role has a light and a dark value, and both are checked for contrast by `npm run check:contrast`, which is the check behind AC-3.
- **Names, roles and states are real.** Actions are `<button>`, navigation is `<a href>`, and a control with no visible label carries an accessible name.
- **Overlays manage focus.** A dialog, sheet or menu moves focus in when it opens and returns it to the trigger on close, and every dialog and sheet carries a title.
- **Text stays readable.** Body text is 16 pixels at every size, long form text is capped near 70 characters, and interactive targets reach 44 by 44 pixels.

## Responsive behaviour

Tailwind's default breakpoints, used in this order:

| Width                                  | What changes                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 360px and up (floor, not a breakpoint) | Every screen is usable with no horizontal page scroll. Summary grids are one column.                       |
| `sm` 640px                             | Page padding grows, summary grids may go to two columns where the cards are narrow.                        |
| `md` 768px                             | The sidebar stops being a sheet and becomes the persistent collapsible rail. The header shows breadcrumbs. |
| `lg` 1024px                            | Dashboard summary cards settle at two columns; tables may show their secondary columns.                    |

Below 768 pixels the sidebar is a sheet opened from a button in the header. Its state above that width is remembered in the `sidebar_state` cookie, so the first paint already agrees with what was last chosen.

## Do's and don'ts, in one line each

**Do** read every value from a semantic role. **Don't** write a hex, an `oklch()` literal, or a palette utility anywhere except `index.css`.

**Do** compose from `AppShell`, `PageHeader` and `DataTable`. **Don't** rebuild layout primitives per page.

**Do** build all four states of anything that loads. **Don't** ship a page where the empty case is blank space.

**Do** keep the token file and this document in step. **Don't** add a role to one without the other; a mismatch is a review failure in both directions.

## Where things live

- Token values, both layers, light and dark: `web/src/index.css`.
- Base components: `web/src/components/ui/` (shadcn, owned in the repo).
- App components: `web/src/components/` (`AppShell`, `PageHeader`, `SidebarNav`, `EmptyState`, `ErrorState`, `DataTable`, `ErrorBoundary`, `ThemeProvider`, `ThemeSwitcher`, `UserMenu`, `CommandPalette`).
- Navigation declaration and the `Role` type: `web/src/lib/navigation.ts`.
- Theme read, write and resolve: `web/src/lib/theme.ts`, with `web/src/lib/theme-context.ts` for the React context.
- Sidebar cookie reading: `web/src/lib/sidebar-state.ts`.
- Refine providers: `web/src/providers/` (`data-provider.ts`, `auth-provider.ts`, `notification-provider.ts`).
- The contrast check: `web/scripts/check-contrast.ts`, run by `npm run check:contrast`.
- The palette lint rule: `web/eslint-rules/no-raw-palette-class.js`.

## Deliberate deviations from the shadcn registry

Two components were amended after being added, and both are noted in the file:

- `web/src/components/ui/sonner.tsx` reads the theme from this project's `useTheme`, not `next-themes`, so toasts follow the same resolved theme as everything else.
- `web/src/components/command-palette-dialog.tsx` is written here rather than using the registry's `command`, because the available command menu library was not usable with this project's React version. It is a small search field over a filtered list, with the keyboard and screen reader behaviour built in.

The remaining `web/src/components/ui/` files are kept as the registry wrote them, so upstream fixes stay applicable. The project's house lint rules are scoped away from that directory for the same reason. Components the registry offers for chat and messaging were removed at install time, because this product has no such surface and an unused component is still a component to keep consistent.
