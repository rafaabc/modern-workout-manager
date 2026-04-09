# Workout Manager

![Backend CI](https://github.com/rafaabc/modern-workout-manager/actions/workflows/backend.yml/badge.svg)
![Frontend CI](https://github.com/rafaabc/modern-workout-manager/actions/workflows/frontend.yml/badge.svg)
![E2E CI](https://github.com/rafaabc/modern-workout-manager/actions/workflows/e2e.yml/badge.svg)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=rafaabc_modern-workout-manager&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=rafaabc_modern-workout-manager)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Description

Full-stack workout management app. Users can register, schedule workouts on a monthly calendar, track annual metrics, and set workout goals.

Built by a QA Engineer exploring generative AI as a development and test automation tool — from architecture to CI/CD, with unit, integration, API, and E2E tests at ≥ 95% coverage.

## Live demo

`https://modern-workout-manager.onrender.com/`

> SQLite without a persistent disk — data may be lost on restarts.

## Stack

### Backend

| Technology | Purpose |
|---|---|
| Node.js 22+ | Runtime |
| Express | HTTP framework |
| better-sqlite3 | SQLite database |
| JSON Web Token | Authentication |
| Swagger UI Express | API documentation |
| Node.js Test Runner | Test framework |

### Frontend

| Technology | Purpose |
|---|---|
| Vue 3 | UI framework (Composition API) |
| Pinia | State management |
| Vue Router | SPA routing |
| Tailwind CSS | Styling |
| Vite | Build tool |
| Vitest | Unit tests |
| Playwright | E2E tests |

## Directory structure

```
modern-workout-manager/
├── .github/workflows/       # CI: backend, frontend, e2e
├── backend/
│   ├── resources/           # swagger.json (OpenAPI 3.0)
│   ├── src/
│   │   ├── app.js           # Express app + DI wiring
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middleware/      # JWT auth
│   │   └── database/        # SQLite init + migrations
│   └── test/                # unit / integration / api
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── composables/     # useApi (HTTP client)
│   │   ├── pages/           # Login, Register, Dashboard
│   │   ├── router/
│   │   └── stores/          # auth, calendar, metrics
│   ├── e2e/                 # Playwright tests + Page Objects
│   └── test/unit/
├── Dockerfile
├── docker-compose.yml
├── package.json             # npm workspaces root
└── .env.example
```

## Environment variables

| Variable | Description | Required |
|---|---|---|
| `JWT_SECRET` | JWT signing key | ✅ |
| `DATABASE_PATH` | SQLite file path | ✅ in production |
| `PORT` | Express port | ❌ (default: 3000) |
| `NODE_ENV` | Execution environment | ❌ (default: development) |

## Running in development

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill environment variables
cp .env.example .env

# 3. Start backend (terminal 1)
npm run start:backend

# 4. Start frontend (terminal 2)
npm run start:frontend
```

Frontend: `http://localhost:5173` — API: `http://localhost:3000` — Swagger: `http://localhost:3000/api-docs`

## Running in production (Docker Compose)

```bash
docker compose up --build        # foreground
docker compose up --build -d     # detached
docker compose down
```

App available at `http://localhost:3000`. Data persists via the `db-data` volume.

## Testing strategy

```
 E2E           ████████████                                        11 tests
 API           ████████████████████████                            21 tests
 Integration   ███████████████████                                 16 tests
 Unit          ████████████████████████████████████████████████   152 tests
               (56 backend + 96 frontend)
```

| Layer | Tool | Scope | Database |
|---|---|---|---|
| Unit (backend) | Node.js Test Runner | Services, validators | Mocks |
| Unit (frontend) | Vitest + Vue Test Utils | Components, stores | HTTP mocks |
| Integration | Node.js Test Runner | Repositories, SQL | SQLite in-memory |
| API | Node.js Test Runner + fetch | HTTP contracts, JWT | SQLite in-memory |
| E2E | Playwright | Full user flows in real browsers | Real SQLite |

```bash
npm test                          # all (backend + frontend unit)
npm run test:backend              # unit + integration + API
npm run test:frontend             # frontend unit

# E2E (requires backend + frontend running)
npm run test:e2e                  # headless, all browsers
npm --workspace=frontend run test:e2e:headed   # headed
npm --workspace=frontend run test:e2e:report   # HTML report

# First-time Playwright setup
npx --prefix frontend playwright install
```

## API endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/users/register` | No | Register user |
| POST | `/api/users/login` | No | Login (returns JWT) |
| POST | `/api/users/logout` | No | Logout |
| GET | `/api/workouts/calendar` | JWT | Get monthly calendar (`?month=&year=`) |
| POST | `/api/workouts/calendar` | JWT | Schedule a workout |
| DELETE | `/api/workouts/calendar` | JWT | Remove a workout |
| GET | `/api/metrics` | JWT | Annual metrics (`?year=`) |
| POST | `/api/metrics/goal` | JWT | Set annual goal |

## License

MIT — see `LICENSE`.
