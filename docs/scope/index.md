# Scope: PERN Admin Dashboard

An academic management dashboard for a university: admins run departments, subjects and classes, teachers run their sessions, students join classes with a code. Built as a fullstack learning project on the stack recorded in `AGENTS.md`.

**Build approach:** Tracer Bullet (every feature runs end to end through database, API and screen, thin but real from the first slice).
**Workflow:** Alpha (after `/develop`, `/check verify` against the real app; no separate test stage by default). A risky feature can carry its own tag, for example `· Beta`, to do more. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Stack & architecture | Foundation | in-progress |
| 2 | Coding standards & tooling | Foundation | in-progress |
| 3 | Data model | Foundation | planned |
| 4 | Design system & UI foundation | Foundation | planned |
| 5 | Translations foundation | Foundation | planned |
| 6 | Deployment & environments | Foundation | planned |
| 7 | Core enrollment loop | Skeleton | planned |
| 8 | Accounts that hold up | Slice 2 | planned |
| 9 | Departments & subjects | Slice 3 | planned |
| 10 | Class scheduling & capacity | Slice 4 | planned |
| 11 | Faculty and student directory | Slice 5 | planned |
| 12 | Course materials | Slice 6 | planned |
| 13 | Role aware analytics dashboard | Slice 7 | planned |
| 14 | Audit log | Slice 8 | planned |
| 15 | Public API | Slice 9 | planned |
| 16 | Product analytics and consent | Slice 10 | planned |
| 17 | Legal pages | Slice 11 | planned |
| 18 | Accessibility pass | Slice 12 | planned |

## Epics

- **Foundations** ([foundations.md](foundations.md)): 6 features, 2 in progress. The ground everything else stands on: stack, tooling, data model, design system, translations, deployment.
- **Academics** ([academics.md](academics.md)): 6 features, all planned. The enrollment core and the academic structure around it.
- **Platform** ([platform.md](platform.md)): 6 features, all planned. The reporting, accountability and reach layers, plus the closing accessibility pass.

## Deferred

Out of scope for this pass, kept so the plan stays honest.

- **Live updates**: rosters and dashboards that change without a refresh · needs a decision
- **Preview environment per pull request**: this pass has one hosted environment · needs a decision
- **Assignments and grades**: coursework beyond shared materials · needs a decision
- **Class messaging**: one thread per class · needs a decision

## Legend

**The decision box.** Every feature carries exactly one, the sub task whose label ends with `(spec)`. Every other box is an execution box.

**Feature lifecycle**: `planned` (one box, its entry command) → `in-progress` (designed, then building, then verified) → `done`, plus `existing` for work that predates the workflow and `dropped` for anything de-scoped. The next step is always the first unticked box.

**needs a decision** means run `/architect` first. Otherwise go straight to `/develop`, or `/audit` for standards and tooling. The tag drops once the spec is captured.

**Pointers**: a feature gains `spec <n>` when `/architect` writes its spec and `code in <path>` when `/develop` lands it.

**Approach and workflow tags** beside a heading override the project default for that feature only. No tag means it inherits.

**Workflow** (`Alpha` here) is what runs after `/develop`: `Prototype` = nothing beyond develop's own check, `Alpha` = `/check verify`, `Beta` = `/check verify` then `/test`, `GA` = adds a fresh model `/check review` and `/document`.

## References

**Project sources**: `AGENTS.md` (the stack, the rules, the tooling choices, the git setting) · `jsmastery-pro/classroom` and `jsmastery-pro/classroom-backend` (the reference pair whose feature set this replica follows).

**Practices & standards**: foundations before features · vertical slices kept real end to end (Tracer Bullet) · the invent test for deciding when a feature needs a spec · WCAG AA as the accessibility bar.
