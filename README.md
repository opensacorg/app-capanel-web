# The California Accountability Panel web application

California Accountability Panel is a dashboard for displaying key school performance metrics. Contributions are welcome!

> [!NOTE]
> Learn about the project on the [documentation website](https://opensacorg.github.io/app-capanel-doc) (under
> development).

## Overview

1. Search for a school or school district. ![Search](screenshots/dashboard-items.png)
2. Explore test scores and standards. ![Dashboard](screenshots/dashboard.png)
3. Get detailed breakdowns. ![Details](screenshots/docs.png)

> [!NOTE]
> Academic performance data for 2024 and 2025 can be downloaded in a zip file on Nate's google
> drive https://drive.google.com/drive/folders/1ifRu7gL8OVxN7oHKadEydS3e7c85ityr?usp=sharing.

## Repository layout

Both stacks are workspaces rooted at the repository root, so **every command is run from the root**. There is no
`cd backend` or `cd frontend`.

| Path                                     | What it is                                                                                   |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `pyproject.toml`                         | uv workspace root. Declares the `backend` member and the `fastapi` entrypoint.               |
| `pnpm-workspace.yaml`                    | pnpm workspace root. Declares `frontend` and `packages/*`.                                   |
| `backend/`                               | The FastAPI application, installed into the root virtualenv as an editable workspace member. |
| `frontend/`                              | The React front end, built with [vite-plus](https://vite.dev).                               |
| `packages/react-email/`                  | React Email sources for the three transactional templates.                                   |
| `alembic.ini`                            | Migration config. `script_location` uses `%(here)s`, so `alembic` works from the root.       |
| `compose.yaml`, `Caddyfile`, `deploy.sh` | The single-instance Docker deployment.                                                       |

## Getting started

Requirements: [uv](https://docs.astral.sh/uv/), [Vite+](https://viteplus.dev/)
(`vp`, which drives the pinned pnpm 11 underneath), Python 3.14, and a PostgreSQL 18 you can reach.

```bash
cp .env.example .env   # then fill in DATABASE_URL, SECRET_KEY and the superuser
uv sync
vp install
```

Create the schema:

```bash
uv run alembic upgrade head
```

The first superuser is created on startup by `app/scripts/initial_data.py`, which the application runs from its lifespan
hook; run it by hand with
`uv run python backend/app/scripts/initial_data.py`.

Then run the two halves in separate terminals:

```bash
uv run fastapi dev
```

```bash
vp run dev
```

The API is on <http://localhost:8000> with interactive docs at `/docs`; the front end is on <http://localhost:5173> and
proxies `/api`, `/docs` and
`/redoc` to the backend, so the browser only ever talks to one origin.

### Checks

```bash
uv run ruff format; uv run ruff check --fix; uv run ty check
```

```bash
vp run lint
```

```bash
uv run pytest
```

Install the git hooks that run all of the above with `uv run prek install`.

### Regenerating the API client

`frontend/src/lib/client` is generated from the live OpenAPI schema. After changing anything under `backend/app/api`:

```bash
vp run generate-client
```

### Loading data

The importers read from a local directory or an `s3://` URI, set by
`RESEARCH_FILE_SOURCE_URI`. They stream rather than buffer, and re-running one is safe: a file whose size and entity tag
are unchanged is skipped.

```bash
uv run python backend/app/scripts/ingest_research_files.py
uv run python backend/app/scripts/ingest_dashboard_files.py --year 2025
uv run python backend/app/scripts/ingest_local_indicators.py --year 2025
uv run python backend/app/scripts/ingest_growth.py
uv run python backend/app/scripts/ingest_enrollment.py
```

The dashboard, growth and enrollment importers default to reading from
`www3.cde.ca.gov` directly, so no local copy is needed for those.

## Deployment

The application deploys to a **single AWS EC2 instance running Docker Compose**: PostgreSQL, the FastAPI backend, and a
Caddy container that terminates TLS, serves the compiled front end and reverse-proxies `/api`. The full specification —
instance sizing, IAM, Parameter Store, SES, backups and costs — is in
[the AWS deployment guide](https://github.com/opensacorg/app-capanel-doc/blob/main/backend/docs/source/developer-guide/aws-deployment.md).

The two halves deploy independently.

**Front end.** Built on your machine or in CI, never on the instance — a production build wants more memory than the
instance has spare. Only the compiled output ships:

```bash
vp install && vp run build
```

```bash
rsync -az --delete frontend/dist/ <instance>:/opt/capanel/dist/
```

Caddy picks up new files immediately, so that is the whole front-end deploy: no rebuild, no restart, no downtime.
`--delete` matters — without it an old hashed bundle can be served alongside a new `index.html`.

> [!IMPORTANT]
> Build with `VITE_API_URL` empty. Caddy serves the front end and the API on
> one origin, so the client uses relative URLs and CORS never applies. A build
> made for a different origin fails in the browser with no error on the server.

**Backend.** On the instance, `./deploy.sh` materialises `.env` from SSM Parameter Store, rebuilds the image, runs
migrations as a one-off task, and restarts:

```bash
cd /opt/capanel && ./deploy.sh
```

Run imports as one-off containers rather than through the API's ingest endpoint, so the work gets its own process, exit
code and logs:

```bash
docker compose run --rm backend python backend/app/scripts/ingest_research_files.py
```

### Self-hosting elsewhere

`compose.yaml` is self-contained. Copy `.env.example` to `.env`, set at least
`SECRET_KEY`, `POSTGRES_PASSWORD`, `FIRST_SUPERUSER`,
`FIRST_SUPERUSER_PASSWORD` and `SITE_ADDRESS`, put a built front end in
`./dist`, and run `docker compose up -d`. Set `SITE_ADDRESS=:80` to serve plain HTTP without a domain; give it a real
hostname and Caddy obtains a Let's Encrypt certificate on its own, which is why port 80 has to stay reachable.

Generate each secret with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Contribute

For support and to keep updated on news:

- Attend a virtual [Community Hack Night](https://www.meetup.com/opensacorg).
- Join
  our [Slack channel (updated 2026-02-01)](https://join.slack.com/t/opensacorg/shared_invite/zt-3orx8kjdj-8gULmv2wuTHhAUxUt9SY8A).
- Email us at info@opensac.org or info@innovateforcalifornia.org.

## Security

We strive to make this application as secure as possible. Some highlights:

- Passwords are hashed with argon2 via `pwdlib`.
- The application refuses to start on a `changethis` secret unless
  `FASTAPI_ENV=development`, which also gates the dev-only `/private` routes.
- The deployment holds no long-lived credentials on disk: secrets come from SSM Parameter Store and AWS access uses the
  instance role.
- Based on an actively maintained open-source project (full-stack-fastapi-postgres), so dependency versions can be
  tracked against a known-good baseline.

See [SECURITY.md](.github/SECURITY.md) for how to report a vulnerability, or email info@opensac.org.

# Other resources

- [Documentation repository](https://github.com/opensacorg/app-capanel-doc)
