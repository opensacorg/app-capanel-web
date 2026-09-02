# The build context is the repository root, not `backend/`: this is a uv
# workspace and the lock file lives at the root, so the resolver needs both
# manifests. Build with `docker compose build`, or by hand with
# `docker build -f backend/Dockerfile .`.
#
# Build stage: uv resolves and installs into /app/.venv.
FROM python:3.14-slim-trixie AS build

COPY --from=ghcr.io/astral-sh/uv:0.12.7 /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# Dependencies first, so a code change does not reinstall the world. Only the
# two manifests and the lock file are needed to resolve them.
COPY pyproject.toml uv.lock ./
COPY backend/pyproject.toml backend/pyproject.toml
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-default-groups --no-install-workspace --package app

# Then the source, and the workspace member itself.
COPY backend/app backend/app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-default-groups --package app

# Runtime stage: the virtualenv and the source, no uv, no caches.
FROM python:3.14-slim-trixie

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# The layout matches a development checkout exactly — workspace root at /app,
# the member at /app/backend — because `app` is installed as an editable
# workspace member and because alembic.ini's `script_location` and
# `app/scripts/script_utils.py:compute_paths` are both resolved relative to a
# directory named `backend` holding `app`.
COPY --from=build /app/.venv /app/.venv
COPY --from=build /app/backend /app/backend
# pyproject.toml carries [tool.fastapi] entrypoint, so `fastapi run` needs no
# path argument; alembic.ini resolves its script_location from %(here)s.
COPY pyproject.toml alembic.ini ./

RUN useradd --system --create-home app && chown -R app /app
USER app

EXPOSE 8000

# One worker on purpose. The deployment target is a 2 GiB instance shared with
# PostgreSQL; see the memory budget in the AWS deployment guide.
CMD ["fastapi", "run", "--host", "0.0.0.0", "--port", "8000"]
