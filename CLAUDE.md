# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack workout management SPA using an **npm workspaces monorepo** with two workspaces: `backend/` (Express + SQLite) and `frontend/` (Vue 3 + Pinia + Vite). JavaScript only — no TypeScript.

## Commands

### Development

```bash
# Start both services (run in separate terminals)
npm run start:backend        # Express on :3000, loads .env via --env-file
npm run start:frontend       # Vite dev server on :5173, proxies /api to :3000

# Format
npm run format               # Prettier (write)
npm run format:check         # Prettier (check only)

# Lint
npm run lint                 # Both workspaces
npm --workspace=backend run lint:fix
npm --workspace=frontend run lint:fix
```

### Testing

```bash
# All tests
npm test

# By workspace
npm run test:backend         # unit + integration + api
npm run test:frontend        # vitest unit

# Individual suites (from root)
npm --workspace=backend run test:unit
npm --workspace=backend run test:integration
npm --workspace=backend run test:api
npm --workspace=frontend run test:unit

# Coverage
npm --workspace=backend run test:unit:coverage
npm --workspace=frontend run test:unit:coverage

# Single test file
node --test backend/test/unit/services/userService.test.js
npx vitest run frontend/test/unit/composables/useApi.test.js

# E2E tests (requires backend + frontend running in separate terminals)
npm run test:e2e                                   # headless, all browsers
npm --workspace=frontend run test:e2e:headed        # headed (opens browser)
npm --workspace=frontend run test:e2e:report        # open HTML report
```

### E2E Setup (first time only)

```bash
npx --prefix frontend playwright install  # download Chromium, Firefox, WebKit binaries
```

### Docker (production)

```bash
npm run docker:up
npm run docker:down
npm run docker:logs
```

## Architecture

### Backend (`backend/src/`)

Pure dependency-injection via factory functions — no IoC container. Wiring happens in `app.js`:

```
database → repository → service → controller → router → app.use()
```

Each layer is a `createX(deps)` factory returning an object with methods. No classes.

- **`database/database.js`** — SQLite init (WAL mode, foreign keys on), auto-runs migrations from `database/migrations/*.sql` on startup.
- **`repositories/`** — Raw SQL via better-sqlite3 prepared statements. Data access only.
- **`services/`** — Business logic. `userService` owns password hashing (SHA256 + random salt, timing-safe compare) and JWT signing.
- **`controllers/`** — HTTP layer. All use `try/catch`; errors with a `.status` property set the response status.
- **`middleware/authMiddleware.js`** — Verifies JWT, attaches `req.user`.

API is documented in `resources/swagger.json` (OpenAPI 3.0), served at `/api-docs`.

### Frontend (`frontend/src/`)

Vue 3 Composition API throughout. Entry: `main.js` → mounts `App.vue` with Pinia + Vue Router.

- **`composables/useApi.js`** — Central HTTP client. Injects `Authorization: Bearer` header, auto-logouts on 401, returns parsed JSON.
- **`stores/`** — Pinia stores (Composition API style). `authStore` persists token/username/lastActivity to localStorage and handles the 15-min inactivity session timeout.
- **`router/index.js`** — `beforeEach` guard: unauthenticated → `/login`; already-authed on public routes → `/`.
- **`pages/`** — Route-level components (lazy-loaded for dashboard). `components/` are reusable sub-components.

Vite dev server proxies `/api/*` to `http://localhost:3000`, so frontend code always calls `/api/...` paths.

### Testing Strategy

Four-tier pyramid:
- **Unit** (`backend/test/unit/`) — Mock repositories; test service/validator logic.
- **Integration** (`backend/test/integration/`) — Real in-memory SQLite; test repository SQL.
- **API** (`backend/test/api/`) — Real HTTP with `fetch`; test full request/response contracts.
- **Unit** (`frontend/test/unit/`) — Vitest + Vue Test Utils + jsdom. Mocks `fetch`, `localStorage`, and Vue Router.
- **E2E** (`frontend/e2e/`) — Playwright in real browsers (Chromium, Firefox, WebKit, mobile). Covers auth, calendar, metrics, authorization, and session flows against the running stack.

## Environment Variables

Copy `.env.example` to `.env` for local development. Backend loads it via `node --env-file=.env`.

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | JWT signing secret |
| `DATABASE_PATH` | SQLite file path (auto-creates parent dirs) |
| `PORT` | HTTP port (default 3000) |
| `NODE_ENV` | `development` / `production` |

Frontend: `VITE_INACTIVITY_TIMEOUT_MS` overrides the 15-min session timeout.
