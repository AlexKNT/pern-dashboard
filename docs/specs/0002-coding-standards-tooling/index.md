# 0002 · Coding standards & tooling

**Status**: Accepted
**Date**: 2026-09-24

## Summary

This project writes TypeScript, and the two apps in it are settled on the same version of it. The tooling feature recorded a provisional note that lowering the API from TypeScript 7.0.2 to 6 was the price of giving it a linter. This spec replaces that provisional note with the real decision and its reasoning: one exact pin for both apps, because a version that holds only until someone edits a range is not a decision. It settles the two smaller mismatches the same build left behind, the Node type packages and the compiler strictness flags, alongside it.

## Requirements

This is a decision, not a feature to build, so the criteria below are conditions the repository must satisfy rather than steps someone works through. Each is checkable with a command.

- **AC-1**: Both apps declare TypeScript 6.0.3 as an exact pin, so neither can drift to another build on its own.
- **AC-2**: Both apps resolve to the same compiler build, and it is 6.0.3.
- **AC-3**: Both apps declare `@types/node` on the Node 24 line, the line `.nvmrc` pins and the host runs.
- **AC-4**: Both apps set `erasableSyntaxOnly`, so syntax that cannot be erased is refused in either app.
- **AC-5**: `typescript-eslint` installs from the lockfiles in both apps with no peer override, no `--legacy-peer-deps` and no `.npmrc` entry.
- **AC-6**: Lint, format check, typecheck and build pass in both apps with the pins in place.

## Decision

**Chosen option**: Option 1, one pinned compiler for both apps.

Both apps pin `typescript` to exactly `6.0.3`, both pin `@types/node` on the Node 24 line, and both set `erasableSyntaxOnly`. What chose the major was the supported range of `typescript-eslint` (`>=4.8.4 <6.1.0`), not a preference for older software.

**Implementation skills**: none. No installed skill governs the compiler version or the lint wiring, so this decision rests on the repository's own recorded choices and the ranges the packages declare.

## Consequences

**Positive**:

- One compiler generation across the repo, so a syntax feature either compiles in both apps or in neither.
- `typescript-eslint` sits inside the range it supports, so linting works in both apps with no npm setting to remember and no unsupported version warning to read past.
- An exact pin means the build a developer runs and the build CI runs are the same one, and an upgrade becomes a deliberate commit rather than something that arrives with an unrelated install.
- `@types/node` on the Node 24 line means the API's types describe the runtime the API actually has, not a newer one where APIs the code compiles against may not exist.
- `erasableSyntaxOnly` in both apps rules out `enum`, parameter properties and runtime `namespace` before either app contains one, so moving a file between the apps stays cheap.

**Negative / tradeoffs**:

- Both apps sit one major behind the newest compiler. That is the price of a linter that covers both apps, because the lint plugin's supported range has not caught up with TypeScript 7.
- An exact pin means patches and bug fixes arrive only when you bump it. Neither `npm install` nor `npm ci` will move it, which is the point, and also the obligation.
- Aligning `@types/node` may surface type errors the newer Node types were hiding, so the API build has to prove the change rather than assume it.
- `erasableSyntaxOnly` in the API forbids a small set of TypeScript features that are legal in a plain `tsc` build. The API uses none of them today.
- The two apps keep separate `package.json` files and separate lockfiles, so nothing mechanically stops them drifting apart again. Review and this record are what hold them together.
- Giving the API a linter at all was only possible by changing its compiler version, so this decision and the tooling install are not separable. Reverting one means revisiting the other.

**Neutral**:

- The compiler version is now a decision with a record, so the next person to open either `package.json` can see why it says 6.0.3 and what would have to change for that to move.
- Spec 0001's stack table names TypeScript as the language without a version, so it does not conflict with this pin and needs no edit. The version lives here, in the newer and more specific spec.
- `erasableSyntaxOnly` is a `tsconfig` flag, not a package version, so it appears in no lockfile and only shows up in a review of the two compiler configs.

## Follow-up

- [ ] Revisit the pin when `typescript-eslint` raises its supported TypeScript range above 6.1. That is the trigger for moving to TypeScript 7, and until then the pin is load bearing rather than stale.
- [ ] Both apps declare `@types/node` on the Node 24 line, but may still resolve different patches inside it. Aligning the exact patch is tidying, not correctness, so treat it as optional.
- [ ] No installed skill covers the TypeScript toolchain, so nothing in `## Agent skills` needed updating for this. If a TypeScript or ESLint skill is installed later, it belongs in root `AGENTS.md`, since it would govern every file.

## Rationale

Reasoning and options: see `rationale.md`.
