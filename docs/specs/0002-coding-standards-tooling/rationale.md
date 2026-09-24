# 0002. Coding standards & tooling · reasoning

Reasoning and options behind the compiler version decision in `index.md`.

## Context

The tooling feature had one job it could not do without a choice: give `api/` a linter. ESLint reads TypeScript through `typescript-eslint`, and that package declares a supported range of `>=4.8.4 <6.1.0`. The API was on TypeScript 7.0.2, the newest published compiler. npm refuses the combination with `ERESOLVE` rather than warning, so the install fails outright.

Nothing was broken at that moment. The API compiled, built and ran on TypeScript 7. What was impossible was adding linting to it, and linting was the point of the feature. The README already promised that lint, format, hooks and the pipeline would arrive together, and a linter covering only the web app would have left the API as the one place mistakes could pass unnoticed.

The engineer chose to build rather than stop and deliberate, and recorded the assumption in this spec as `Assumed`. That was the right call at the time: the assumption was narrow, reversible, and unblocked the work. This document is the deliberation that was owed, written after the fact with the build in front of us, which means it can weigh evidence the decision could not have had on the day. The pipeline has since run green on both apps, so the assumption's consequences are observable rather than predicted.

Three smaller mismatches sat beside the main one, all created or exposed by the same build. `@types/node` was on major 26 in `api/` and major 24 in `web/`, while Node itself is pinned at 24.16.0 by `.nvmrc` and by the host. `erasableSyntaxOnly` was set in both `web/` configs and absent from the API's. And the two apps declared different ranges for the same compiler, `~6.0.3` against `~6.0.2`, which happened to overlap at one build today and would not survive a patch release.

Forces at play. This is a learning project first, so the value of each choice is measured partly in what stays legible to the person reading it. One engineer, no deadline, no team to hand operations to. The stack is already chosen and recorded, so the compiler is not a greenfield question. The repository deliberately avoids workspace tooling, so there is no root package that could hold a shared version for both apps. And the recorded conventions ask for strict TypeScript and a check on every push, which means the linter is not optional.

The consequence of not deciding is drift with a delay on it. Both apps read 6.0.3 today. A patch or minor release inside 6 would let a single `npm update` in one app move it, because `~6.0.3` permits movement and nothing checks that the two agree. The next person to see the pin is the next person to bump a dependency, at which point the range's meaning is already unclear.

## Options considered

### Option 1: One pinned compiler for both apps

Both apps pin `typescript` to exactly `6.0.3`, both pin `@types/node` on the Node 24 line, and both set `erasableSyntaxOnly`. The major is chosen by what the lint plugin supports, and the exact version is chosen so the two apps cannot quietly diverge.

**Pros**:
- Both apps compile with one build of one compiler generation.
- `typescript-eslint` installs inside its supported range with no npm flag, no `.npmrc` entry and no unsupported version warning.
- An exact pin means CI and the local machine compile with the same build.
- An upgrade becomes a deliberate commit rather than a side effect of an unrelated install.

**Cons**:
- Both apps sit one major behind the newest published compiler.
- An exact pin means patches arrive only when someone bumps it.
- Aligning `@types/node` may surface type errors the newer types were hiding.
- Nothing mechanically keeps the two apps in step, since there is no workspace tooling and no shared package.

### Option 2: One major, one range, both apps

Both apps declare the same range, `~6.0.3` or `^6.0.3`, and each resolves within it independently.

**Pros**:
- Patches and minor releases arrive on install, without a deliberate commit for each.
- Reads as one version policy at a glance.
- Less friction than an exact pin when a security patch lands.

**Cons**:
- The two apps can resolve different builds from the same range, which is precisely the state that confused this decision.
- A minor release inside the range still cannot reach TypeScript 7, so the range buys less freedom than it appears to.
- It leaves the agreement between the two apps to chance and npm's timing.

### Option 3: Keep TypeScript 7.0.2 and install around the constraint

Restore the newest compiler in `api/` and make npm accept the peer conflict, with `--legacy-peer-deps` in every install, a `.npmrc` carrying the setting, or an `overrides` entry.

**Pros**:
- The API keeps the newest compiler and its faster build.
- When `typescript-eslint` does support TypeScript 7, the pin is already correct.

**Cons**:
- `--legacy-peer-deps` disables peer checking for the whole app, not just this package, so it hides unrelated conflict warnings that are worth seeing.
- The setting has to be remembered by every person and every script that installs, with no error if forgotten, only different results.
- The plugin warns on every run that the TypeScript version is unsupported, which trains the reader to ignore warnings.
- Any future rule that needs type information may misbehave with no signal, because the parser was never tested against this compiler.
- A `.npmrc` in the repository overrides the reader's own settings, which is a surprising file to leave behind.

### Option 4: Leave the initializer's choices alone

Keep what each initializer set: `~6.0.2` in `web/`, whatever the API's scaffold chose, and `@types/node` at 26 in `api/` and 24 in `web/`.

**Pros**:
- Nothing to change, and the scaffold's choices are someone else's tested defaults.
- Each app's toolchain stays the way its framework's own documentation presents it.

**Cons**:
- The `ERESOLVE` conflict returns the moment anyone reinstalls the API cleanly, so the linter cannot be added at all.
- The API's types keep describing a Node newer than the one it runs on.
- It records an accident as a decision, which is what this spec exists to avoid.

## Rationale

Option 1 is chosen because the constraint is real and the workaround is expensive in exactly the currency this project can least afford. TypeScript 7 with a linter is not currently a reachable state. Reaching it means Option 3's npm setting, which trades a small, visible, temporary loss (one major behind) for a permanent, invisible one (peer checking disabled repo wide, and a parser running outside the range it was tested against). For a project whose purpose is learning how a real system holds together, an unsupported dependency quietly tolerated is the wrong lesson to build in, and a linter that covers both apps is worth more than a compiler major nobody is using features from.

The exact pin, rather than a range, answers the failure this run was called to look at. The two apps read the same version today by accident of overlapping ranges. An exact pin makes that agreement a fact rather than a coincidence, and it makes CI and the local machine compile with the same build, which matters because the pipeline is the only other place this code runs. The cost is that patches need a deliberate bump, and the Follow-up records the trigger for the one that matters: when `typescript-eslint` raises its supported range above 6.1, that is the moment to reassess the major.

Aligning `@types/node` to the Node 24 line is the same reasoning applied to a mismatch someone would otherwise hit at speed. The API declared types for a Node newer than the one `.nvmrc` and the host run, so code could compile against an API that does not exist at runtime, and fail only when the line executes. Types that describe the runtime are not a preference.

`erasableSyntaxOnly` in both apps is about keeping a door open at no cost. The flag forbids the syntax that cannot simply be erased, `enum`, parameter properties, and `namespace` with runtime meaning. The web app already sets it because Vite strips types rather than compiling them. The API compiles with `tsc` directly and does not need it, yet the API uses none of the forbidden syntax, so setting it costs nothing and means a file can move between the apps without being rewritten. The asymmetry had no reason behind it, and now it has a rule instead.

One thing this decision deliberately does not do: create a root package file or workspace tooling to hold a shared version. Spec 0001 chose two independent package files on purpose, and a version policy recorded in a spec is a lighter way to keep them aligned than a new package that every install has to resolve. What holds the two apps together is review and this record, which is honest about the risk rather than mechanising it away.

The engineer's stated preference was for the exact pin and for both smaller alignments, which matches the reasoning above. The one place this document departs from a plain record of the build is calling the choice a decision rather than an assumption: the build made it work, and this spec makes it right.

## References

Citations are off for this spec by the engineer's choice, so there is no References section in `index.md` and no citation tags above. The facts this reasoning rests on are all verifiable in the repository: the two `package.json` files and lockfiles, the four `tsconfig.json` files, `.nvmrc`, the pipeline in `.github/workflows/ci.yml`, and spec 0001's stack table.
