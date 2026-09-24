# 0003. Design system, UI foundation and the admin shell · reasoning

Reasoning and options behind the decision in `index.md`.

## Context

> ⚠️ Premise note: the request was "frontend", which is a layer rather than a decision. Read literally it spans four separate decisions: the visual language and tokens, the component layer and primitives, the application shell with the Refine providers and routing, and the data layer wiring against the API contract. This spec is anchored to the scope's **4. Design system & UI foundation** row, which owns tokens, layout primitives and base components, and then takes the shell on top because the engineer chose to include it. The split into slices is what keeps that from becoming one unverifiable build. If the intent was the shell alone, the token and component work still has to happen first, because the shell renders it.

The web app today is a bare Vite scaffold: `web/src/App.tsx` renders a heading and a sentence, the stylesheet is the default Vite one, and `web/vite.config.ts` has no plugins beyond React. None of the stack that `AGENTS.md` records for the web side exists yet: no Tailwind, no shadcn components, no Refine, no routing, no data provider. Meanwhile the scope expects every later slice to render inside Refine with a REST data provider, and it lists a design system as a foundation that must come before the features that depend on it.

So this is the decision that unblocks everything on the web side. Without it, the core enrollment loop would be inventing spacing values, a table component, a layout and a theme in the middle of building a feature, and every feature after it would invent them slightly differently. With it, a later feature builds one screen against parts that already exist. The cost of not deciding is the usual one: those invented values harden into the product, and the inconsistency is then expensive to unpick because it is spread across every page.

The forces at play are modest in scale and strict in standard. One engineer, no deadline, a learning project where being able to read and debug each layer matters more than throughput. The recorded conventions are the strict parts: strict TypeScript with `noUncheckedIndexedAccess`, tests first, WCAG AA as the accessibility bar, one error handling pattern, named exports, a hook before each commit, and a pipeline on every push. The audience is three roles in a university, mostly reading tables, which means density and legibility matter more than flourish. There is no compliance regime beyond student personal data, and no regulated data category is touched by a design system.

Finally there is the material available: the two reference repositories the scope follows, and the installed skills. Both matter here. The reference app is a working example of exactly this component layer, and the `shadcn` and `vercel-labs` skills cover the component and React conventions this decision leans on.

## Options considered

### Option 1: Tokens and components as the foundation, with the shell on top, sliced

Shadcn/ui components on Radix over Tailwind CSS v4. The visual language is two layers of CSS custom properties (a raw palette, then semantic roles) mapped into Tailwind's theme and documented in `web/design.md`. The Refine shell is then built on that base in the same spec: providers, routing, a collapsible sidebar, a sticky header, breadcrumbs, a command palette, toasts and an error boundary, delivered as five Tracer Bullet slices.

**Pros**:
- Follows the reference repository's shape closely, so there is a working example to compare against line by line.
- Two token layers make a theme change a single file edit and make the dark theme a first class case rather than a retrofit.
- The shell is built once, correctly, and every later feature inherits focus, motion and state handling.
- Slicing means the app is runnable from the end of slice one, so each slice is verifiable and a mistake surfaces early.

**Cons**:
- It is the biggest foundation feature in the scope, and the later slices (command palette, toasts) are not strictly needed to build a screen.
- A `localStorage` plus inline script first paint fix is code outside React, easy to forget.
- The auth provider is a stub until the accounts feature exists, so the signed in shell cannot be seen end to end yet.

### Option 2: Tokens and components only, shell later

Deliver `design.md`, the token layers and the base component set, and leave Refine, routing, the providers and the layout to the core enrollment loop feature.

**Pros**:
- The smallest, most verifiable unit: every acceptance criterion is checkable in isolation with no network dependency.
- Nothing is built against a stubbed auth session, so nothing has to be revisited.
- The feature that needs the shell is also the feature that knows what the shell must show, which is a better place to decide navigation.

**Cons**:
- Every later feature still has to build its own layout, which is exactly the duplication a design system exists to prevent.
- The role aware navigation decision moves into a feature that already has a lot to decide, and it would be decided under time pressure.
- The component set gets built with no page using it, so the first real page is the real test, and the fixes land in that feature instead.

### Option 3: A component library with a visual identity

Use a prebuilt component library that ships its own look (a Material or Bootstrap style kit) rather than primitives plus tokens.

**Pros**:
- Fastest route to many components, and accessibility is largely handled by the library.
- Less design to decide, because the identity comes with it.

**Cons**:
- Conflicts with the recorded stack, which names shadcn/ui on Radix with Tailwind.
- Overriding a library's identity to make it yours is more work than owning the component from the start, and the result often reads as neither.
- Radix primitives are the accessible layer shadcn wraps, so the accessibility argument is weaker than it looks.

### Option 4: Tailwind utility classes only, no component layer

Style each screen directly with utility classes and a small shared set of class strings, with no component abstraction.

**Pros**:
- Nothing to install beyond Tailwind, and no abstraction to learn.
- Total freedom per screen.

**Cons**:
- The consistency and accessibility criteria become unenforceable: there is no single place that owns focus, motion or labels.
- Keyboard behaviour for dialogs, menus and sheets has to be rebuilt per screen, which is where accessibility bugs come from.
- It contradicts the recorded stack and the reference repository.

## Rationale

Option 1 wins on the strongest force in the Context: every later slice expects to render inside Refine, against a real data provider, inside a layout that already handles focus, motion and the three load states. Building the base and the shell as one decision means it is decided once, by someone thinking about it, rather than accreted across five features each under its own pressure.

The component layer is not a close call. shadcn/ui over Radix is what `AGENTS.md` records, it is what the reference app uses, and it is the only option that gives you the accessible behaviour (focus trapping, roving tabindex, `aria` wiring) as a starting point you own and can read, rather than as a dependency you cannot. Owning the components matters more than usual in a learning project: the point is to be able to open one and understand it.

The two layer token decision is the same shape the reference app uses, and it is what makes the theme and contrast criteria affordable. One layer of palette values alone would leave every component choosing which palette entry means "danger", and that choice would drift. A semantic layer (`primary`, `destructive`, `muted`) fixes the meaning in one place, and the dark theme becomes a second set of values for the same names. The palette lint rule exists because a documented convention with no enforcement is not a decision, it is a wish: without the rule, the first urgent screen reaches for `bg-blue-500` and the semantic layer quietly stops being the source of truth.

The shell is included because the alternative splits a decision in the wrong place. Option 2 keeps the feature smaller, and it is the honest runner up, but it defers the layout and the role aware navigation into a feature that has data model and API decisions to make as well. The shell is mostly layout and configuration, and it is better decided here where that is all there is to think about. The engineer chose this, and the slicing is what makes it safe: the shell slice does not start until the tokens, the theme and the components are already working.

Two smaller calls worth recording. Tokens in CSS rather than a TypeScript object, because the second one requires a build step between an edit and the result, and because Tailwind's theme consumes CSS variables directly. And the sidebar state in a cookie rather than `localStorage`, because a cookie can be read at start so the collapsed state does not flash, which is the same class of problem as the theme flash and gets the same treatment.

The dark theme is not an extra. It was chosen with a full switcher (light, dark and system) rather than deferred, which is more work now and much less work than retrofitting a second theme onto components written without one. Component code that was written with only light in mind almost always encodes assumptions that have to be unpicked later.

The tradeoffs accepted knowingly: the command palette and toasts are in scope because the engineer asked for everything the shell needs to be useful on day one, and both are conveniences rather than requirements, so they add surface to maintain. Google Fonts is an external request on first load, chosen over a self hosted face for simpler setup; that is a small performance and privacy cost and it is reversible without touching a component. And the role filter in the navigation is only presentation, which is why the security model says so in writing: a hidden menu item is not an access check, and the API is where the real one lives.

Two decisions came out of the cross check rather than the interview, and both are worth recording. The first is the test split: Vitest with `jsdom` cannot check a viewport, a focus trap or a reduced motion transition, because there is no layout engine and no real event loop for the browser's own behaviour. Those checks move to Playwright, which is already connected, and `AGENTS.md` currently records only Vitest, so the follow-up asks `/sync` to add it. Claiming those acceptance criteria against `jsdom` would have produced tests that pass while proving nothing. The second is the starting token values: adopting the shadcn defaults on the `zinc` base colour means the foundation is not blocked on a branding conversation, and changing the brand later is a value edit plus the contrast check rather than a component rewrite. The contrast check itself is a command rather than an eyeball, for the same reason the palette rule is a lint rule: a value that moves should fail something.

The command palette shortcut, the breakpoint, the sign in route, the role type, the pinned Refine and React Router majors, the font and the component prop signatures were all gaps the first draft left for the builder to invent. They are filled in the spec now, which is the difference between a document that describes an intention and one an implementation agent can follow.

## References

**Project sources** (verifiable, in this repo):
- `AGENTS.md`, the recorded web stack (Refine, shadcn/ui on Radix, Tailwind, TanStack Query through Refine's data provider), the WCAG AA bar, the tests first rule and the named exports rule
- `docs/scope/foundations.md`, feature 4, the design system and UI foundation row and its done when line
- `docs/scope/index.md`, build approach Tracer Bullet and workflow Alpha
- `docs/specs/0001-stack-architecture/index.md`, the stack decision this builds on, including the premise note that the four layer rule applies to `api/` while `web/` is organised by pages, components and hooks
- the two reference repositories, `jsmastery-pro/classroom` and `jsmastery-pro/classroom-backend`
- the installed skills listed under `## Decision` in `index.md`

**Practices & standards**:
- Design tokens in two layers, a raw palette and semantic roles, so meaning is named once and theming is a value swap
- Accessible primitives underneath the components you own rather than a component library's baked in identity
- Prefer a documented convention that something enforces over one that relies on memory
- Apply the theme before first paint to avoid a flash of the wrong theme
- `prefers-reduced-motion` honoured by the primitive, not remembered per screen
- Presentation filtering is not access control; authorization belongs on the server
- Build the thinnest end to end thread first, then thicken it, so each slice is verifiable
