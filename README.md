# TaskFlow AI

TaskFlow AI is a production-oriented task management and user operations platform built as a single monorepo. It combines CRM-style user administration, role-based delivery workflows, AI-assisted planning, reporting, and deployment-ready backend infrastructure.

The application is designed to help structured teams manage who can do what, who owns which work item, how tasks progress through delivery stages, and how administrators onboard users securely without sharing plain-text passwords.

## What The Application Does

TaskFlow AI combines four major product areas in one system:

- User operations: admins can create users, assign roles, map members to managers, and manage access rules.
- Delivery workflow: teams can create tasks, assign owners, track subtasks, and move work through a Jira-style lifecycle.
- AI assistance: privileged users can generate task descriptions and subtask breakdowns with an OpenAI-backed workflow and a safe fallback path.
- Reporting and oversight: dashboard metrics, workflow summaries, CSV exports, and print-friendly PDF views help teams review execution.

The product is intentionally built around real team hierarchy:

- `ADMIN`: full control over users, teams, tasks, and delivery operations.
- `PMO`: broad visibility and task management authority without user-administration rights.
- `MANAGER`: can manage work for themselves and for members in their own team.
- `MEMBER`: executes assigned work and sees only the scope relevant to them.

## Core Product Flow

### 1. Authentication And Access

Users sign in through the frontend, which talks to the backend authentication routes. The backend validates credentials, returns a JWT, and the frontend stores the token for subsequent API calls.

Key flows:

- Login with email and password
- Profile retrieval through `/api/auth/me`
- Password setup for admin-created users
- Forgot-password and reset-password recovery flow

Admin-created users do not receive a shared default password in the product flow. Instead, the backend generates a one-time setup link so users can create their own password securely.

### 2. User Management Flow

The `User CRM` module is used primarily by admins.

Typical flow:

1. Admin opens the user module.
2. Admin creates a user with a role: `ADMIN`, `PMO`, `MANAGER`, or `MEMBER`.
3. If the role is `MEMBER`, the user must be assigned to a valid manager.
4. The backend creates the user, marks the account as requiring password setup, and generates a secure onboarding link.
5. The system attempts to send that link through SMTP.
6. The frontend refreshes the user list and shows success or a precise failure message.

The backend enforces the rules behind this flow:

- members must belong to a manager
- non-members cannot be assigned to a manager team
- duplicate emails are blocked
- invalid manager references are blocked

### 3. Task Management Flow

Privileged users create tasks through the `Assignment Desk`.

Typical task lifecycle:

1. A task is created with title, description, priority, story points, due date, and optional assignee.
2. The assignee must pass role-based rules:
   - admins and PMO can assign to managers or members
   - managers can assign only to themselves or members in their own team
3. Tasks appear in the delivery board and task detail views.
4. Work moves through the system status flow:
   - `TODO`
   - `IN_PROGRESS`
   - `REVIEW`
   - `COMPLETED`
5. Relevant timestamps such as started, review, and completed dates are updated automatically.

Task visibility is also scoped by role:

- admins and PMO see everything
- managers see tasks they created, tasks assigned to them, and tasks assigned to their members
- members see only tasks assigned to them

### 4. Subtask Flow

Each task can contain subtasks. Subtasks support:

- creation
- editing
- deletion
- status updates
- story points
- due dates

Subtasks inherit access restrictions from their parent task, which keeps the permission model consistent across the application.

### 5. AI Flow

TaskFlow AI includes AI-powered planning support for privileged users.

There are two major AI-assisted flows:

- generate a polished task description
- generate suggested subtasks for a task

The backend uses OpenAI Responses API calls for these capabilities. If the AI layer is unavailable, the backend is designed to degrade safely with a fallback path so the application remains usable.

### 6. Dashboard And Reporting Flow

The dashboard gives users an operational summary of the work they are allowed to see.

It includes:

- total tasks
- to-do, in-progress, review, and completed counts
- overdue tasks
- team member counts
- workflow charts
- delivery summaries

The dashboard response is cached per user in Redis for 30 seconds. When tasks or subtasks change, the backend invalidates relevant cache entries so the dashboard remains fresh.

The reporting flow also supports:

- CSV export for spreadsheet usage
- print-friendly PDF export

## Frontend Application Flow

The frontend is a React single-page application built around a central app shell in [frontend/src/App.tsx](/d:/Taskflow-ai/frontend/src/App.tsx).

The main frontend modules are:

- `CRM Overview`
- `User CRM`
- `Taskdrome`
- `Schedule Hub`
- `Assignment Desk`
- `Reports & Exports`

Frontend responsibilities include:

- storing and sending JWT access tokens
- bootstrapping the session after login
- loading dashboard and user data after authentication
- rendering modules based on role
- showing flash messages and inline errors
- collecting form input and submitting typed API requests

Important UI flows:

- login and password setup screens
- role-aware module access
- task board interactions
- user administration panel
- AI search and AI generation actions
- export actions

## Backend Application Flow

The backend is an Express API built around a single router in [backend/src/routes.js](/d:/Taskflow-ai/backend/src/routes.js) and mounted through [backend/src/app.js](/d:/Taskflow-ai/backend/src/app.js).

The request lifecycle is:

1. Incoming request enters Express.
2. Security middleware such as `helmet` is applied.
3. CORS and `OPTIONS` preflight handling are applied.
4. JSON body parsing runs.
5. Route handlers process the request.
6. Authentication and authorization middleware enforce access.
7. Validation is applied through Zod schemas.
8. Prisma executes database reads and writes.
9. Errors are normalized through the central error handler.

Backend responsibilities include:

- auth and token creation
- user creation and onboarding link generation
- role enforcement
- manager/member team validation
- task and subtask persistence
- workflow transition validation
- Redis cache reads and invalidation
- email delivery
- AI orchestration
- operational logging

## Data Model

The Prisma schema in [backend/prisma/schema.prisma](/d:/Taskflow-ai/backend/prisma/schema.prisma) defines three core models:

### User

Stores:

- identity fields such as name and email
- hashed password
- role
- manager relationship
- password setup and reset token metadata
- timestamps

### Task

Stores:

- title
- description
- status
- priority
- story points
- due date
- creator
- assignee
- lifecycle timestamps

### Subtask

Stores:

- title
- completion state
- workflow status
- story points
- due date
- source
- lifecycle timestamps
- parent task relation

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Axios

Frontend purpose:

- build the application shell
- manage state and authenticated flows
- render role-specific interfaces
- call the backend through a typed API helper

### Backend

- Node.js
- Express
- express-rate-limit
- Helmet
- JSON Web Tokens
- Zod
- Winston
- Nodemailer

Backend purpose:

- expose REST APIs
- validate and authorize requests
- manage user onboarding and password recovery
- enforce task workflow rules
- send onboarding and password reset emails
- log operational issues

### Database And Persistence

- PostgreSQL
- Prisma ORM
- Prisma Client

Database purpose:

- store users, tasks, subtasks, and relationships
- support role-scoped task access
- persist onboarding and password reset state

### Caching

- Redis

Cache purpose:

- speed up dashboard reads
- reduce repeated computation
- keep the dashboard responsive under repeated access

### AI

- OpenAI Responses API

AI purpose:

- generate task descriptions
- generate subtask suggestions
- support planning acceleration inside the workflow

### Testing And Tooling

- Jest
- Supertest
- TypeScript compiler checks
- GitHub Actions
- Vercel
- Docker

Tooling purpose:

- regression test backend routes
- verify API behavior
- automate deploys and checks
- support local full-stack development

## Project Structure

```text
taskflow-ai/
  backend/
    api/
      index.js
    prisma/
      migrations/
      schema.prisma
      seed.js
    src/
      ai.js
      app.js
      config.js
      db.js
      email.js
      formatters.js
      logger.js
      middleware.js
      redis.js
      routes.js
      utils.js
      validation.js
    tests/
      routes.test.js
    package.json
    vercel.json
  frontend/
    src/
      components/
      lib/
      types/
      App.tsx
    package.json
  .github/
    workflows/
  docker-compose.yml
  README.md
```

## API Surface

Main route groups:

- Auth
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/setup-password`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - `GET /api/auth/me`
  - `PATCH /api/auth/me`
- Users
  - `GET /api/users`
  - `POST /api/users`
  - `PATCH /api/users/:userId`
  - `DELETE /api/users/:userId`
- Dashboard
  - `GET /api/dashboard`
- Tasks
  - `GET /api/tasks`
  - `GET /api/tasks/:taskId`
  - `POST /api/tasks`
  - `PATCH /api/tasks/:taskId`
  - `DELETE /api/tasks`
  - `DELETE /api/tasks/:taskId`
- Subtasks
  - `POST /api/tasks/:taskId/subtasks`
  - `PATCH /api/subtasks/:subtaskId`
  - `DELETE /api/subtasks/:subtaskId`
- AI
  - `POST /api/ai/description`
  - `POST /api/ai/tasks/:taskId/subtasks`
  - `POST /api/ai/search`

## Getting Started With Docker

1. Copy `.env.example` to `.env`.
2. Set `OPENAI_API_KEY` if you want live AI responses.
3. Start the stack:

```bash
docker compose up -d --build
```

4. Bootstrap the backend database:

```bash
docker compose exec backend npx prisma generate
docker compose exec backend npx prisma db push
docker compose exec backend node prisma/seed.js
```

5. Open:

- frontend: `http://localhost:5173`
- backend: `http://localhost:4000`

6. Use seeded credentials:

- `admin@taskflow.ai`
- `manager@taskflow.ai`
- `member@taskflow.ai`

Password:

- value of `SEED_DEFAULT_PASSWORD`
- defaults to `Admin@123` if not overridden

## Local Development Without Docker

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Frontend

- `VITE_API_URL=https://your-backend-project.vercel.app`

### Backend

- `DATABASE_URL`
- `DIRECT_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PASSWORD_SETUP_EXPIRES_IN`
- `PASSWORD_RESET_EXPIRES_IN`
- `APP_URL=https://your-frontend-project.vercel.app`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `SEED_DEFAULT_PASSWORD`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Important:

- `APP_URL` must include protocol, for example `https://taskflow-ai-frontend.vercel.app`
- `DIRECT_URL` should be the direct, non-pooled database URL used for migrations
- `DATABASE_URL` is the runtime database connection used by the app

## Deployment

The repository is structured as one monorepo with two Vercel projects:

- frontend project rooted at `frontend/`
- backend project rooted at `backend/`

Production deployment is automated through GitHub Actions in [.github/workflows/deploy-vercel.yml](/d:/Taskflow-ai/.github/workflows/deploy-vercel.yml).

The deploy flow is:

1. Push to `main`
2. GitHub Actions installs dependencies
3. Vercel environment is pulled
4. Prisma migrations are applied to production
5. Frontend and backend are deployed independently

Required GitHub secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_FRONTEND`
- `VERCEL_PROJECT_ID_BACKEND`
- `DATABASE_URL_PRODUCTION`
- `DIRECT_URL_PRODUCTION`
- `SEED_DEFAULT_PASSWORD`

## Prisma Migration Flow

Production should use Prisma migrations, not `db push`.

Local schema change flow:

```bash
cd backend
npx prisma migrate dev --name your_migration_name
```

Production migration flow:

```bash
npm run prisma:migrate:deploy
```

If your production database already exists outside Prisma Migrate history, baseline it first before deploying later migrations.

## Production Seeding

The repository includes a production seeding workflow in [.github/workflows/seed-production.yml](/d:/Taskflow-ai/.github/workflows/seed-production.yml).

Seeding behavior:

- inserts or upserts demo users
- is useful for controlled environment setup
- should be treated carefully in production because repeated seeding can reset seeded-user state

## Logging And Error Handling

The backend uses Winston for structured logging.

Log categories include:

- auth failures
- validation failures
- cache issues
- Prisma data issues
- unhandled server exceptions

The central error handler converts known backend failures into API-friendly messages and uses a generic fallback for unhandled server exceptions.

## Testing

Backend tests live in `backend/tests` and use Jest with Supertest.

Run:

```bash
cd backend
npm test
```

The frontend currently relies on TypeScript compile-time validation and build checks.

## Quality And Engineering Notes

- Zod validates inbound request bodies
- JWT secures authenticated routes
- Prisma centralizes data access
- Redis reduces repeated dashboard computation
- role checks are enforced on both UI visibility and backend authorization
- onboarding and password recovery are designed around secure one-time links
- AI routes are limited to privileged roles
- the frontend uses a typed API client and centralized error extraction

## Summary

TaskFlow AI is not just a task board. It is a role-aware operations platform that combines:

- CRM-style user administration
- secure onboarding
- structured task delivery
- manager/member team hierarchy
- AI-assisted planning
- caching and reporting
- deployment-ready infrastructure

It is built to demonstrate both product thinking and production-minded engineering across frontend, backend, data, AI, and deployment workflows.
