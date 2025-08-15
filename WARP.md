# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Architecture

This is a full-stack project using FastAPI for the backend and React for the frontend. The backend is written in Python and uses SQLModel as the ORM to interact with a PostgreSQL database. The frontend is written in TypeScript and uses Chakra UI for components. The entire application is containerized using Docker Compose.

- **Backend:** The main backend code is located in the `backend/app` directory.
- **Frontend:** The main frontend code is located in the `frontend/src` directory.
- **Database Migrations:** Database migrations are handled by Alembic and are located in `backend/app/alembic/versions`.

## Common Commands

### Backend

- **Install dependencies:** `cd backend && uv sync`
- **Run tests:** `bash ./scripts/test.sh`
- **Run tests against a running stack:** `docker compose exec backend bash scripts/tests-start.sh`
- **Create a database migration:**
    1. `docker compose exec backend bash`
    2. `alembic revision --autogenerate -m "Your migration message"`
- **Apply database migrations:**
    1. `docker compose exec backend bash`
    2. `alembic upgrade head`

### Frontend

- **Install dependencies:** `cd frontend && npm install`
- **Run development server:** `cd frontend && npm run dev`
- **Generate API client:** `./scripts/generate-client.sh`
- **Run E2E tests:** `npx playwright test`

### Docker

- **Start development environment:** `docker compose up -d`
- **Stop development environment:** `docker compose down`

