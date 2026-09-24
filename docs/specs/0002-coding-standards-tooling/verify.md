# Verify: Coding standards & tooling · spec 0002 · updated 2026-09-24

_Steps derived from spec 0002's requirements and the scope's Done when line. `/check verify` runs these; `/test` locks the durable ones._

## Commands

- [x] `npm run lint --prefix api` → exits 0, no output → requirement: the API has a linter
- [x] `npm run lint --prefix web` → exits 0, no output → requirement: the web app has a linter
- [x] `npm run format:check --prefix api` → `All matched files use Prettier code style!` → requirement: format clean
- [x] `npm run format:check --prefix web` → `All matched files use Prettier code style!` → requirement: format clean
- [x] `npm run typecheck --prefix api` → exits 0 → requirement: the checks run clean, and the TypeScript 6 change holds (the spec 0002 assumption)
- [x] `npm run typecheck --prefix web` → exits 0 → requirement: the checks run clean
- [x] `npm run build --prefix api` → writes `api/dist/index.js` → requirement: the scaffold still builds after the compiler change
- [x] `npm run build --prefix web` → writes `web/dist/index.html` plus the bundles → requirement: the scaffold still builds
- [x] `npm test --if-present --prefix api` and `npm test --if-present --prefix web` → exit 0, running nothing → requirement: tests on every push, honest while no test script exists
- [x] `git config core.hooksPath` in the repository root → prints `.githooks` → requirement: a commit runs lint, format and typecheck

## Manual

- [x] Touch a file in `api/src`, `git add` it, `git commit` → the hook prints `==> api` then `Checks passed.`, and the commit lands → requirement: a commit runs lint, format and typecheck
- [x] Add a deliberate type error to `api/src/index.ts`, `git add` it, `git commit` → the hook prints the `tsc` error, does not print `Checks passed.`, and `git log` shows no new commit → requirement: a commit runs typecheck before it lands
- [x] Write `const bad: any = 1` in `web/src/App.tsx`, `git add` it, `git commit` → `@typescript-eslint/no-explicit-any` fails the hook → requirement: the project's no `any` rule is enforced
- [x] Write a line with a missing semicolon in `web/src/App.tsx`, `git add` it, `git commit` → the hook reformats the file, restages it, and the commit lands with the semicolon added → requirement: format on staged files
- [x] Write `console.log("hi")` followed by a `TODO` comment in `api/src/index.ts`, `git add` it, `git commit` → the commit is refused with the `no-warning-comments` warning and the `--max-warnings 0` message → requirement: warnings do not slip through
- [ ] Push the branch → GitHub shows two jobs, `API` and `Web`, both green, each running install, lint, format, typecheck and test → requirement: the pipeline runs on every push
- [ ] Open a pull request → the same two checks appear against it → requirement: the pipeline covers pull requests

## Requirement coverage

- "A commit runs lint, format and typecheck before it lands" → the four hook steps above
- "Lint, format, typecheck and the pipeline run clean" → the first seven command steps, plus the two push steps
- "GitHub Actions runs lint, typecheck and tests on every push" → the push and pull request steps
- "The API and the web app both have a linter" → the two `lint` steps
- "Root `AGENTS.md` describes the real scaffold" → not covered here, it belongs to `/audit` or `/sync`

Not verified by these steps, and known:

- The pipeline has never run on GitHub. The workflow's shape is right, the install command works from the lockfiles, but only a push can prove the runner agrees.
- `/test` has not added a test script, so the test steps prove the pipeline tolerates an absent script, not that tests run.
