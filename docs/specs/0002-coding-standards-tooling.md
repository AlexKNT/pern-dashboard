# 0002 · Coding standards & tooling

**Status**: Assumed
**Date**: 2026-09-24
**Authorized by**: AlexKNT, during /develop

## Owed decision

How to reconcile `api/`'s TypeScript 7.0.2 with ESLint's TypeScript plugin, whose latest release supports only `>=4.8.4 <6.1.0`. Installing `typescript-eslint` into `api/` fails with `ERESOLVE`, so the tooling feature cannot give the API a linter without resolving this. The undecided part is which side gives way: the API's compiler version, or npm's peer certainty.

## Assumption built on

- `api/` moves from TypeScript 7.0.2 to TypeScript 6, matching `web/`. Both apps then run one compiler generation, `typescript-eslint` installs inside its supported range, and no `--legacy-peer-deps`, `.npmrc` or `overrides` entry is needed. The alternative was to keep TypeScript 7 and install with the peer range ignored, which buys the newest compiler at the cost of an npm setting every future install depends on and a plugin that warns it does not support the version.
- The pre commit hook is a plain `.githooks/pre-commit` shell script, activated with `core.hooksPath`, rather than husky plus lint-staged. Chosen by the engineer during this build. No new dependency, and git runs it through its own shell on Windows.
- The pipeline runs lint, format, typecheck and tests as one GitHub Actions workflow with a job per app, and no root `package.json`, keeping the two package files that spec 0001 records.
- The test step in the pipeline runs each app's `test` script only when one exists, so the pipeline is green today and picks up Vitest when `/test` adds it.

## Code area

- `api/package.json`, `api/eslint.config.js`, `api/prettierignore`
- `web/package.json`, `web/eslint.config.js`, `web/prettierignore`
- root `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `.gitattributes`, `.githooks/pre-commit`
- `.github/workflows/ci.yml`
- `api/src/**`, `web/src/**` (reformatted, not rewritten)

## Requirements

Carried from the scope's `Done when` line for Coding standards & tooling:

- A commit runs lint, format and typecheck before it lands.
- Lint, format, typecheck and the pipeline all run clean.
- GitHub Actions runs lint, typecheck and tests on every push.
- The API and the web app both have a linter.
- Root `AGENTS.md` describes the real scaffold (that part belongs to `/audit` or `/sync`, see below).

## Ratify

This decision was recorded by /develop, not deliberated. Run `/architect coding standards & tooling`
to deliberate and ratify it. Until then it stays flagged as an owed decision; it does not block marking the feature `done`.

Open point for ratification: the TypeScript downgrade in `api/` touches spec 0001's stack table
(`Language`). If `/architect` prefers TypeScript 7 kept in the API, the ESLint wiring changes with it.
