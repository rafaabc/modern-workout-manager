# Workout Manager

![Backend CI](https://github.com/rafaabc/modern-workout-manager/actions/workflows/backend.yml/badge.svg)
![Frontend CI](https://github.com/rafaabc/modern-workout-manager/actions/workflows/frontend.yml/badge.svg)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=rafaabc_modern-workout-manager&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=rafaabc_modern-workout-manager)

## Description

Workout Manager is a full-stack application for workout management. It allows user registration, scheduling workouts on a monthly calendar, tracking annual metrics, and setting workout goals.

Built by a QA Engineer exploring generative AI as a development and test automation tool — from architecture to CI/CD, including unit, integration, and API tests with ≥ 95% coverage.

## Stack

### Backend

| Technology | Purpose |
|---|---|
| Node.js 21+ | Runtime |
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
| ESLint | Linting |

## Directory structure

```
modern-workout-manager/
├── .github/
│   └── workflows/
│       ├── backend.yml          # CI: lint → unit → integration → API tests
│       └── frontend.yml         # CI: lint → unit tests
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
        ╱‾‾‾‾‾‾‾‾‾‾╲
       ╱  API Tests  ╲
      ╱──────────────────╲
     ╱  Integration Tests  ╲
    ╱──────────────────────────╲
   ╱    Unit Tests (Backend)    ╲
  ╱──────────────────────────────────╲
 ╱    Unit Tests (Frontend)           ╲
╱──────────────────────────────────────────╲
```

| Layer | Tool | What it validates | Database |
|---|---|---|---|
| Unit (backend) | Node.js Test Runner | Services, validators, business rules | None (mocks) |
| Integration | Node.js Test Runner | Repositories, SQL, constraints | SQLite in-memory |
| API | Node.js Test Runner + fetch | HTTP contracts, JWT, confirmed persistence | SQLite in-memory |
| Unit (frontend) | Vitest + Vue Test Utils | Components, stores, composables | None (HTTP mocks) |

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
