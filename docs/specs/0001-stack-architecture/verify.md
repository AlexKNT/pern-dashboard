# Verify: Stack & architecture · spec 0001 · updated 2026-09-24

_Steps derived from the stack decision in spec 0001 and the scope's Done when line. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] Open `http://localhost:5173/` → the page shows the heading `PERN Admin Dashboard` → Done when: starts locally
- [ ] Open `http://localhost:3000/health` → the body reads `{"status":"ok"}` with status 200 → Done when: starts locally

## Commands

- [ ] `npm install --prefix api` → finishes with no errors → Done when: installs
- [ ] `npm install --prefix web` → finishes with no errors → Done when: installs
- [ ] `npm run typecheck --prefix api` → exits clean → stack table: strict TypeScript
- [ ] `npm run build --prefix api` → writes `api/dist/index.js` → Done when: builds
- [ ] `npm start --prefix api` → prints `API listening on http://localhost:3000` → Done when: starts
- [ ] `npm run build --prefix web` → writes `web/dist/index.html` plus the JS and CSS bundles → Done when: builds
- [ ] `npm run typecheck --prefix web` → exits clean → stack table: strict TypeScript
- [ ] `npm run dev --prefix api` with `PORT=3000` in `api/.env` → the server answers on 3000 → stack table: Node process, env checked at startup
- [ ] Set `PORT=not-a-number` then run `node api/dist/index.js` → exits 1 and prints `Invalid environment variables: PORT` before it listens → AGENTS.md: fail fast on environment
- [ ] `nvm use` in the repository root → selects Node 24.16.0 from `.nvmrc` → spec follow-up: Node pin

## Acceptance-criteria coverage

This spec is a decision spec, so it carries no `AC-` ids. The steps above cover each clause of the scope's Done when line instead:

- "the stack and the deploy target are recorded in a spec" → spec 0001, Decision and Proposed stack
- "the empty scaffold installs" → the two install steps
- "builds" → the two build steps
- "starts locally" → the two start steps, plus the two manual checks

Still open, and not part of this build:

- The Node version in the Render service settings waits for the deployment and environments feature (spec 0001 Follow-up).
- The tooling feature installs lint, format, hooks and the pipeline, so `web/` currently runs only the initializer's ESLint config and `api/` has no linter yet.
