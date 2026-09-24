# PERN Admin Dashboard

An academic management dashboard for a university. Admins run departments, subjects and classes, teachers run their sessions, students join classes with a code.

This repository holds two apps:

| Folder | What it is | Stack |
|---|---|---|
| `web/` | The dashboard the browser loads | React 19, Vite 8, TypeScript |
| `api/` | The HTTP API that will serve data and auth | Express 5, TypeScript, Zod |

In production the API also serves the built web app from one address. See `docs/specs/0001-stack-architecture/` for the full decision and `AGENTS.md` for the project rules.

## Requirements

Node 24, the current long term support line. The pinned version lives in `.nvmrc`, so `nvm use` in the repository root picks it up. npm installs both apps separately, there is no workspace tooling by design.

## Setup

```
npm install --prefix api
npm install --prefix web
Copy-Item api/.env.example api/.env
```

`.env` is ignored by git and read once at startup. Every variable in it is validated before the API serves a request, so a missing value stops the process with a clear message instead of failing part way through.

## Running locally

Two terminals:

```
npm run dev --prefix api     # http://localhost:3000
npm run dev --prefix web     # http://localhost:5173
```

`GET http://localhost:3000/health` answers `{"status":"ok"}` when the API is up.

## Commands

| Command | Folder | What it does |
|---|---|---|
| `npm run dev` | `api/` | Start the API with reload on change |
| `npm run typecheck` | `api/` | Type check without writing files |
| `npm run build` | `api/` | Compile to `api/dist` |
| `npm start` | `api/` | Run the compiled API |
| `npm run dev` | `web/` | Start the Vite dev server |
| `npm run typecheck` | `web/` | Type check the app and the Vite config |
| `npm run build` | `web/` | Type check then build to `web/dist` |
| `npm run preview` | `web/` | Serve the built web app |
| `npm run lint` | `web/` | Run the template ESLint config |

Linting, formatting, git hooks and the CI pipeline are installed by the tooling feature, so those scripts are not here yet.

## Layout

```
api/src/domain          Entities and value objects, no imports from other layers
api/src/application     Use cases that orchestrate the domain
api/src/infrastructure  Adapters for the outside world (config, database, providers)
api/src/presentation    Express app, routers and controllers
web/src                 Pages, components and hooks, organised as they arrive
```

Dependencies point inward only. The API's `index.ts` is the composition root that wires the layers together and starts the process.

## What is not here yet

The scaffold is deliberately thin. Refine, Tailwind, shadcn, Drizzle, Better Auth, the logger and the providers in the stack table each install with the feature that needs them, and the workspace's `docs/scope/` list says which feature that is.
