import json
import os

import google.auth
from google.auth.transport.requests import AuthorizedSession


def _response(status: int, payload: dict) -> tuple[str, int, dict]:
    return json.dumps(payload), status, {"Content-Type": "application/json"}


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

    endpoint = (
        "https://run.googleapis.com/v2/projects/"
        f"{project_id}/locations/{region}/jobs/{job_name}:run"
    )
    credentials, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    session = AuthorizedSession(credentials)
    response = session.post(endpoint, json={})

    body = {"status_code": response.status_code, "job": job_name}
    try:
        body["result"] = response.json()
    except ValueError:
        body["result"] = response.text

    if response.ok:
        return _response(200, body)
    return _response(response.status_code, body)
