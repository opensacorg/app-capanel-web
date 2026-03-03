import json
import os
import time
from typing import Any

import google.auth
from google.auth.transport.requests import AuthorizedSession


def _response(status: int, payload: dict) -> tuple[str, int, dict]:
    return json.dumps(payload), status, {"Content-Type": "application/json"}


def _poll_operation(
    session: AuthorizedSession,
    operation_name: str,
    *,
    timeout_seconds: int = 1800,
    poll_interval_seconds: int = 5,
) -> dict[str, Any]:
    operation_url = f"https://run.googleapis.com/v2/{operation_name}"
    deadline = time.time() + timeout_seconds

    while True:
        response = session.get(operation_url)
        response.raise_for_status()
        payload = response.json()
        if payload.get("done"):
            return payload
        if time.time() >= deadline:
            msg = f"Timed out waiting for operation {operation_name}"
            raise TimeoutError(msg)
        time.sleep(poll_interval_seconds)


def _poll_execution(
    session: AuthorizedSession,
    execution_name: str,
    *,
    timeout_seconds: int = 1800,
    poll_interval_seconds: int = 5,
) -> dict[str, Any]:
    execution_url = f"https://run.googleapis.com/v2/{execution_name}"
    deadline = time.time() + timeout_seconds

    while True:
        response = session.get(execution_url)
        response.raise_for_status()
        execution = response.json()
        conditions = execution.get("conditions", [])
        completed = next(
            (c for c in conditions if c.get("type") == "Completed"),
            None,
        )
        if completed and completed.get("status") == "True":
            return execution
        if completed and completed.get("status") == "False":
            msg = completed.get("message") or "Cloud Run job execution failed"
            raise RuntimeError(msg)
        if time.time() >= deadline:
            msg = f"Timed out waiting for execution {execution_name}"
            raise TimeoutError(msg)
        time.sleep(poll_interval_seconds)


def _run_job_step(
    session: AuthorizedSession,
    *,
    project_id: str,
    region: str,
    job_name: str,
    step_name: str,
    args: list[str],
) -> dict[str, Any]:
    endpoint = (
        "https://run.googleapis.com/v2/projects/"
        f"{project_id}/locations/{region}/jobs/{job_name}:run"
    )
    run_payload = {
        "overrides": {
            "containerOverrides": [
                {
                    "args": args,
                }
            ]
        }
    }

    run_response = session.post(endpoint, json=run_payload)
    run_response.raise_for_status()
    run_body = run_response.json()
    operation_name = run_body.get("name")
    if not operation_name:
        msg = f"Missing operation name when running step '{step_name}'"
        raise RuntimeError(msg)

    operation = _poll_operation(session, operation_name)
    operation_error = operation.get("error")
    if operation_error:
        msg = operation_error.get("message") or f"Step '{step_name}' failed"
        raise RuntimeError(msg)

    execution_name = operation.get("response", {}).get("name")
    if not execution_name:
        msg = f"Missing execution name when running step '{step_name}'"
        raise RuntimeError(msg)

    execution = _poll_execution(session, execution_name)
    return {
        "step": step_name,
        "args": args,
        "execution": execution_name,
        "succeeded": int(execution.get("succeededCount", 0)),
        "failed": int(execution.get("failedCount", 0)),
    }


def trigger_backend_init(request):
    if request.method != "POST":
        return _response(405, {"error": "Method not allowed. Use POST."})

    project_id = os.environ.get("GCP_PROJECT_ID")
    region = os.environ.get("GCP_REGION")
    job_name = os.environ.get("BACKEND_INIT_JOB")

    if not project_id or not region or not job_name:
        return _response(
            500,
            {
                "error": "Missing required env vars",
                "required": ["GCP_PROJECT_ID", "GCP_REGION", "BACKEND_INIT_JOB"],
            },
        )

    request_json = request.get_json(silent=True) or {}
    if not isinstance(request_json, dict):
        return _response(400, {"error": "Request body must be a JSON object."})
    gcs_uri = str(
        request_json.get("gcs_uri", "gs://ca-panel-001-resources/resources")
    ).strip()
    resources_path = str(request_json.get("resources_path", "/tmp/resources")).strip()
    ela_file = str(
        request_json.get("ela_file", f"{resources_path}/cde/eladownload2025.xlsx")
    ).strip()
    indicators_source = str(request_json.get("indicators_source", "cde")).strip()
    indicators_path = str(
        request_json.get("indicators_path", f"{resources_path}/cde")
    ).strip()
    try:
        batch_size = int(request_json.get("batch_size", 1000))
    except (TypeError, ValueError):
        return _response(400, {"error": "batch_size must be an integer."})
    if batch_size <= 0:
        return _response(400, {"error": "batch_size must be > 0."})
    indicator = str(request_json.get("indicator", "")).strip()

    if not gcs_uri.startswith("gs://"):
        return _response(400, {"error": "gcs_uri must start with gs://"})

    credentials, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    session = AuthorizedSession(credentials)

    steps = [
        {
            "name": "migrate",
            "args": ["-m", "alembic", "upgrade", "head"],
        },
        {
            "name": "initial_data",
            "args": ["app/scripts/initial_data.py"],
        },
        {
            "name": "sync_gcs_resources",
            "args": [
                "app/scripts/sync_gcs_resources.py",
                "--uri",
                gcs_uri,
                "--dest",
                resources_path,
            ],
        },
        {
            "name": "import_ela_data",
            "args": ["app/scripts/import_ela_data.py", ela_file],
        },
        {
            "name": "import_indicators",
            "args": [
                "app/scripts/import_indicators.py",
                "--source",
                indicators_source,
                "--path",
                indicators_path,
                "--batch-size",
                str(batch_size),
            ],
        },
    ]
    if indicator:
        steps[-1]["args"].extend(["--indicator", indicator])

    completed_steps: list[dict[str, Any]] = []
    for step in steps:
        try:
            result = _run_job_step(
                session,
                project_id=project_id,
                region=region,
                job_name=job_name,
                step_name=step["name"],
                args=step["args"],
            )
            completed_steps.append(result)
        except Exception as exc:
            return _response(
                500,
                {
                    "error": "Backend import pipeline failed",
                    "job": job_name,
                    "failed_step": step["name"],
                    "message": str(exc),
                    "completed_steps": completed_steps,
                },
            )

    return _response(
        200,
        {
            "job": job_name,
            "gcs_uri": gcs_uri,
            "resources_path": resources_path,
            "status": "completed",
            "steps": completed_steps,
        },
    )
