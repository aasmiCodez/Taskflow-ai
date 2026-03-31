# TaskFlow AI

TaskFlow AI is now a complete production-oriented stack:

- Frontend: React + TypeScript + TailwindCSS + Vite
- Backend: Node.js + Express + Prisma ORM with PostgreSQL
- Data persistence: PostgreSQL managed in Docker
- Cache and sessions: Redis managed in Docker
- Security: JWT auth, role-based access control, encrypted passwords
- AI integration: OpenAI endpoint for AI subtasks + backend regression safe fallback
- Developer tooling: Winston structured logging + Jest + Supertest tests
- Docker: single command local stack with containers for the database, cache, API, and frontend

## Project structure

```text
taskflow-ai/
  backend/
    Dockerfile
    src/
      ai.js
      api routes...
      logger.js
      redis.js
      ...
    tests/
      routes.test.js
    jest.config.js
    schema.prisma
  frontend/
    Dockerfile
    src/
      App.tsx
      components/
      lib/api.ts
  docker-compose.yml
  .env.example
```

## Getting started (Docker)

1. copy `.env.example` to `.env` (set `OPENAI_API_KEY` if using real AI):
   ```bash
   cp .env.example .env
   ```

2. start the stack:
   ```bash
   docker compose up -d --build
   ```

3. run database bootstrap (inside backend):
   ```bash
   docker compose exec backend npx prisma generate
   docker compose exec backend npx prisma db push
   docker compose exec backend node prisma/seed.js
   ```

4. open apps:
   - frontend: http://localhost:5173
   - backend: http://localhost:4000

5. log in with seeded credentials:
   - admin@taskflow.ai / value of `SEED_DEFAULT_PASSWORD` (defaults to `Admin@123`)
   - manager@taskflow.ai / value of `SEED_DEFAULT_PASSWORD`
   - member@taskflow.ai / value of `SEED_DEFAULT_PASSWORD`
   - if you do not know the password, use the login screen's password reset flow

## Local development without Docker

Backend:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## API endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard`
- CRUD task and subtask routes (`/api/tasks`, `/api/subtasks`)
- AI routes: `POST /api/ai/tasks/:taskId/subtasks`, `POST /api/ai/search`

## Deployment (GitHub Actions + Vercel)

Use one GitHub repository, not two. This repo should stay as a single monorepo:

- `frontend/` becomes one Vercel project
- `backend/` becomes another Vercel project

### Recommended hosting setup

- Frontend: Vercel project rooted at `frontend/`
- Backend: Vercel project rooted at `backend/`
- Database: managed Postgres such as Neon or Prisma Postgres
- Cache: Upstash Redis

### Required environment variables

Frontend project:

- `VITE_API_URL=https://your-backend-project.vercel.app`

Backend project:

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

### Vercel project layout

Create two Vercel projects from the same GitHub repo:

1. `taskflow-frontend`
   Root directory: `frontend`
2. `taskflow-backend`
   Root directory: `backend`

The backend project is configured for Vercel with:

- `backend/api/index.js`
- `backend/vercel.json`

### Prisma migration flow

Production should use migrations, not `db push`.

If you use Neon or another pooled Postgres provider:

- `DATABASE_URL` can be the pooled runtime URL used by the app
- `DIRECT_URL` should be the direct non-pooled URL used for Prisma migrations during deploys

Run locally when you make schema changes:

```bash
cd backend
npx prisma migrate dev --name your_migration_name
```

Production deploys run:

```bash
npm run prisma:migrate:deploy
```

### Authentication and recovery

- Seeded demo users use `SEED_DEFAULT_PASSWORD` as their initial password.
- Admin-created users do not receive a shared temporary password. They receive a one-time setup link by email.
- Users who forget their password can request a one-time reset link from the login screen.
- Password values are never returned by the API, written into app logs, or sent back to the frontend after creation.
- For secure onboarding and password reset in production, configure SMTP on the backend project.

### GitHub Actions secrets

Add these repository secrets in GitHub:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_FRONTEND`
- `VERCEL_PROJECT_ID_BACKEND`
- `DATABASE_URL_PRODUCTION`
- `DIRECT_URL_PRODUCTION`
- `SEED_DEFAULT_PASSWORD`

The production workflow is already included at:

- `.github/workflows/deploy-vercel.yml`

It deploys both projects from the same repo whenever `main` is updated.

### Production seeding

- `.github/workflows/deploy-vercel.yml` runs migrations on every backend deploy.
- `.github/workflows/seed-production.yml` is a manual workflow for one-time or intentional production seeding.
- Do not seed on every deploy, because the seed script upserts demo users and can reset their password/state.

## Redis behavior

- dashboard responses are cached per user for 30 seconds
- cache invalidated when tasks or subtasks change

## Test suite

Backend tests are in `backend/tests` and run with:

```bash
cd backend
npm test
```

## Logging

Backend logs use Winston in `backend/src/logger.js`.

- Info-level startup/shutdown, request errors, and operational events.
- Warn-level invalid auth, cache issues, data failures.
- Error-level unhandled exceptions.

## Quality notes (TDD + standards)

- `jest` and `supertest` ensure routes are regression covered.
- Backend uses schema validation via `zod`.
- API client wrapper in frontend uses typed fetch with error handling.
- Minimal mock state removed: app now fetches from real backend endpoints.

---

If you want, I can next add:

1. automated database migrations in Docker container entrypoint
2. formal lint pipeline with `eslint` + `prettier`
3. additional test scenarios for permissions (admin/member role checks)
