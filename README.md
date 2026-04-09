# Workout Manager

![Backend CI](https://github.com/rafaabc/modern-workout-manager/actions/workflows/backend.yml/badge.svg)
![Frontend CI](https://github.com/rafaabc/modern-workout-manager/actions/workflows/frontend.yml/badge.svg)
![E2E CI](https://github.com/rafaabc/modern-workout-manager/actions/workflows/e2e.yml/badge.svg)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=rafaabc_modern-workout-manager&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=rafaabc_modern-workout-manager)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Description

Workout Manager is a full-stack application for workout management. It allows user registration, scheduling workouts on a monthly calendar, tracking annual metrics, and setting workout goals.

Built by a QA Engineer exploring generative AI as a development and test automation tool — from architecture to CI/CD, including unit, integration, API, and E2E tests with ≥ 95% coverage.

## Live demo

Public demo available at: `https://modern-workout-manager.onrender.com/`

Important notes about this deployment:

- This Render instance exists for learning and portfolio purposes.
- The current deploy uses SQLite without a persistent disk attached.
- Data may be lost after redeploys, restarts, or infrastructure recycling.
- Please avoid relying on long-term data persistence in the public demo.

## Stack

### Backend

| Technology | Purpose |
|---|---|
| Node.js 22+ | Runtime |
| Express | HTTP framework |
| better-sqlite3 | SQLite database |
| JSON Web Token | Stateless authentication |
| Swagger UI Express | Interactive API documentation |
| c8 | Test coverage |
| Node.js Test Runner | Test framework |
| ESLint | Linting |

### Frontend

| Technology | Purpose |
|---|---|
| Vue 3 | UI framework (Composition API) |
| Pinia | State management |
| Vue Router | SPA routing |
| Tailwind CSS | Utility-first styling |
| Vite | Build tool and dev server |
| Vitest | Test framework |
| Vue Test Utils | Component testing utilities |
| Playwright | E2E browser testing |
| ESLint | Linting |

## Directory structure

```
modern-workout-manager/
├── .github/
│   └── workflows/
│       ├── backend.yml          # CI: lint → unit → integration → API tests
│       ├── frontend.yml         # CI: lint → unit tests
│       └── e2e.yml              # CI: E2E tests (Playwright, all browsers)
├── backend/
│   ├── resources/
│   │   └── swagger.json         # OpenAPI 3.0 specification
│   ├── src/
│   │   ├── app.js               # Express app with DI and static serving
│   │   ├── server.js            # HTTP entrypoint (port 3000)
│   │   ├── controllers/         # Request/response handlers
│   │   ├── services/            # Business logic
│   │   ├── repositories/        # Database access
│   │   ├── routes/              # Route definitions
│   │   ├── middleware/          # Auth middleware (JWT)
│   │   ├── utils/               # Validators
│   │   └── database/
│   │       ├── database.js      # SQLite connection (WAL mode) + migrations
│   │       └── migrations/      # Table creation SQL
│   └── test/
│       ├── api/                 # API tests (HTTP contracts + JWT)
│       ├── integration/         # Integration tests (repositories + SQLite)
│       └── unit/                # Unit tests (services + validators)
├── frontend/
│   ├── src/
│   │   ├── App.vue              # Root component
│   │   ├── main.js              # Vue + Pinia + Router bootstrap
│   │   ├── assets/              # Global CSS (Tailwind)
│   │   ├── components/          # Reusable components
│   │   ├── composables/         # useApi (HTTP client with auth)
│   │   ├── pages/               # LoginPage, RegisterPage, DashboardPage
│   │   ├── router/              # Routes with auth guards
│   │   └── stores/              # Pinia stores (auth, calendar, metrics)
│   ├── e2e/
│   │   ├── fixtures/            # Test data factories (randomized credentials)
│   │   ├── pages/               # Page Object Models (LoginPage, RegisterPage, DashboardPage)
│   │   └── tests/               # Spec files (auth, calendar, metrics, session, authorization)
│   ├── playwright.config.js     # Playwright config (Chromium, Firefox, WebKit, mobile)
│   └── test/
│       └── unit/                # Unit tests (components, stores)
├── Dockerfile                   # Multi-stage build (frontend + backend)
├── docker-compose.yml           # Local production with persistent volume
├── package.json                 # Workspace root (npm workspaces)
└── .env.example                 # Environment variables
```

## Environment variables

| Variable | Description | Required |
|---|---|---|
| `JWT_SECRET` | JWT token signing key | ✅ |
| `DATABASE_PATH` | SQLite file path | ✅ in production |
| `PORT` | Express server port | ❌ (default: 3000) |
| `NODE_ENV` | Execution environment | ❌ (default: development) |

## Running in development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env
# Fill in JWT_SECRET in .env

# 3. Start the backend
cd backend && npm start

# 4. Start the frontend (another terminal)
cd frontend && npm run dev
```

Frontend available at `http://localhost:5173`, API at `http://localhost:3000`.

## Running in production (Docker Compose)

```bash
# Build and start
docker compose up --build

# Run in background
docker compose up --build -d

# Stop
docker compose down
```

Application available at `http://localhost:3000`.

Data persists between restarts thanks to the `db-data` volume mounted at `/app/database`.

## Testing strategy

```
              ╱‾‾‾‾‾‾‾‾‾‾‾‾╲
             ╱   E2E Tests   ╲
            ╱────────────────────╲
           ╱    API Tests         ╲
          ╱──────────────────────────╲
         ╱    Integration Tests        ╲
        ╱──────────────────────────────────╲
       ╱    Unit Tests (Backend)             ╲
      ╱──────────────────────────────────────────╲
     ╱    Unit Tests (Frontend)                    ╲
    ╱──────────────────────────────────────────────────╲
```

| Layer | Tool | What it validates | Database |
|---|---|---|---|
| Unit (backend) | Node.js Test Runner | Services, validators, business rules | None (mocks) |
| Integration | Node.js Test Runner | Repositories, SQL, constraints | SQLite in-memory |
| API | Node.js Test Runner + fetch | HTTP contracts, JWT, confirmed persistence | SQLite in-memory |
| Unit (frontend) | Vitest + Vue Test Utils | Components, stores, composables | None (HTTP mocks) |
| E2E | Playwright | Full user flows in real browser (auth, calendar, metrics, session) | Real SQLite via running backend |

## Test commands

```bash
# Backend — unit
cd backend && npm run test:unit
cd backend && npm run test:unit:coverage

# Backend — integration
cd backend && npm run test:integration
cd backend && npm run test:integration:coverage

# Backend — API
cd backend && npm run test:api

# Frontend — unit
cd frontend && npm run test:unit
cd frontend && npm run test:unit:coverage
```

### E2E tests (Playwright)

E2E tests run against the real stack, so both the backend and frontend dev servers must be running before you execute them.

```bash
# Terminal 1 — start backend
npm run start:backend

# Terminal 2 — start frontend
npm run start:frontend

# Terminal 3 — run E2E tests
npm run test:e2e                                   # headless, all browsers
npm --workspace=frontend run test:e2e:headed        # headed (opens browser)
npm --workspace=frontend run test:e2e:report        # open HTML report
```

**First-time setup** — download the Playwright browser binaries once:

```bash
npx --prefix frontend playwright install
```

## API endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/users/register` | No | Register a new user |
| POST | `/api/users/login` | No | Login (returns JWT token) |
| POST | `/api/users/logout` | No | Logout (stateless) |
| GET | `/api/workouts/calendar` | JWT | Get workout calendar for a month (`?month=&year=`) |
| POST | `/api/workouts/calendar` | JWT | Schedule a workout on a date |
| DELETE | `/api/workouts/calendar` | JWT | Remove a workout from a date |
| GET | `/api/metrics` | JWT | Get annual workout metrics (`?year=`) |
| POST | `/api/metrics/goal` | JWT | Set annual workout goal |

Full interactive documentation available at `http://localhost:3000/api-docs` (Swagger UI).

## Business rules

### Authentication

- Usernames must be at least 3 characters long
- Passwords must be at least 8 characters and include both letters and numbers
- Passwords are securely hashed before storage
- Users receive a token upon login, which must be sent with every subsequent request
- Login errors do not reveal whether the username or password was incorrect
- Any request to a protected resource without a valid token is rejected

### Workout calendar

- A user can schedule one workout per day
- The same workout cannot be scheduled twice on the same date
- Only the user who created a workout can view or remove it
- Dates are validated to ensure day, month, and year are within acceptable ranges

### Metrics and goals

- Each user can set one workout goal per year
- Setting a new goal for the same year replaces the previous one
- Progress is calculated as a percentage of workouts completed versus the goal
- Metrics show the total workouts for the year and a monthly breakdown
- Goal information is only displayed when viewing the same year the goal was set for

## Quick start

**Development (local, separate servers)**

- Backend: you can use the root `.env` or copy it into `backend/.env`. From the repo root:

```bash
# install backend deps and start
cd backend
npm install
# copy env (Unix/macOS)
cp ../.env .env
# on Windows PowerShell: Copy-Item ..\\.env .env
npm start
```

- Frontend (Vite dev server):

```bash
cd frontend
npm install
npm run dev
```

Frontend dev is usually at `http://localhost:5173`; backend is at `http://localhost:3000` (Swagger at `/api-docs`).

**Production image (Docker Compose)**

- Ensure the root `.env` contains a non-empty `JWT_SECRET` and a `DATABASE_PATH` (recommended: `database/workout-manager.db`). Avoid setting `NODE_ENV` in the root `.env` if you want Docker Compose to control it.

```bash
docker compose up --build
# or run detached
docker compose up --build -d
docker compose logs -f backend
```

- The compose file mounts a named volume `db-data:/app/database` so the SQLite file persists between restarts. In the production image the backend will serve the built frontend at `http://localhost:3000/`.

**Notes**

- `DATABASE_PATH` is used as provided; relative paths are resolved against the process working directory (`/app` in the container).
- `docker-compose.yml` sets `NODE_ENV=production` for the `backend` service so the app serves `frontend/dist` when running the compose image.
- Keep `JWT_SECRET` secret — do not commit changed secrets to the repository.

### Deploy notes for Render

- The app writes a SQLite file to the path specified by `DATABASE_PATH`. Some PaaS providers (including Render) do not create arbitrary directories by default, which causes the process to fail when the parent directory for the DB file is missing. The application now auto-creates the parent directory, which prevents the crash shown in your logs.
- For production on Render prefer a persistent disk path (or an external DB). On Render you can attach a Persistent Disk and use an absolute path such as `/data/workout-manager.db` and set `DATABASE_PATH=/data/workout-manager.db` in the Render service environment.
- The public demo currently does not use persistent storage by design, since this project is maintained as a hobby/learning application.


## NPM scripts (root and workspaces)

The repository provides convenience scripts at the workspace root and concrete scripts inside each package.

**Root (`package.json`)**

- `npm run start:backend` — runs the backend start script (`backend` workspace).
- `npm run start:frontend` — runs the frontend dev server (`frontend` workspace).
- `npm run docker:up` / `npm run docker:down` / `npm run docker:logs` — Docker Compose helpers.
- `npm run test:backend` — runs backend tests (unit, integration, API).
- `npm run test:frontend` — runs frontend unit tests.
- `npm run test` — runs `test:backend` then `test:frontend` sequentially.
- `npm run test:e2e` — runs Playwright E2E tests (requires backend + frontend running).

**Backend (`backend/package.json`)**

- `npm start` — starts the backend using `backend/.env` (the script passes `--env-file=.env`).
- `npm run lint` / `npm run lint:fix` — ESLint commands for backend sources.
- `npm run test:unit`, `test:integration`, `test:api` — backend tests.

**Frontend (`frontend/package.json`)**

- `npm run dev` — vite dev server.
- `npm run build` — build production frontend into `dist`.
- `npm run lint` / `npm run lint:fix` — ESLint commands for frontend sources.
- `npm run test:unit` — frontend unit tests (Vitest).
- `npm run test:e2e` — Playwright E2E tests (headless, all browsers).
- `npm run test:e2e:headed` — E2E tests with browser visible.
- `npm run test:e2e:report` — open the last Playwright HTML report.

**Notes**

- Root `test` runs all tests sequentially so CI or local `npm run test` covers backend unit/integration/API and frontend unit tests in order.
- If you prefer running backend and frontend dev servers together, consider adding a small dev script using `concurrently` (not included by default).

## License

This project is licensed under the MIT License — see the `LICENSE` file for details.


