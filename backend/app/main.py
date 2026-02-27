from pathlib import Path

import sentry_sdk
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.routing import APIRoute
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.core.config import settings


def custom_generate_unique_id(route: APIRoute) -> str:
    tag = route.tags[0] if route.tags else "default"
    return f"{tag}-{route.name}"


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

frontend_dist = Path(__file__).parent / "frontend_dist" / "client"
# TanStack Start with prerendering uses _shell.html, Vite uses index.html
frontend_index = frontend_dist / "index.html"
if not frontend_index.exists():
    frontend_index = frontend_dist / "_shell.html"

# Serve static assets optimally (checks to avoid crashing if dist isn't built locally)
assets_dir = frontend_dist / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    if not frontend_index.exists():
        raise HTTPException(status_code=404, detail="Frontend not deployed")

    candidate = (frontend_dist / full_path).resolve()
    if (
        full_path
        and candidate.is_file()
        and frontend_dist.resolve() in candidate.parents
    ):
        return FileResponse(candidate)

    return FileResponse(frontend_index)
