# Stop on error
$ErrorActionPreference = "Stop"

# Echo commands (rough equivalent of `set -x`)
Set-PSDebug -Trace 1

Push-Location backend

python -c "import app.main; import json; print(json.dumps(app.main.app.openapi()))" | Out-File -Encoding utf8 ../openapi.json

Pop-Location

Move-Item -Path openapi.json -Destination frontend/ -Force

Push-Location frontend

pnpm run openapi-ts
pnpx oxfmt

Pop-Location

# Turn off tracing
Set-PSDebug -Trace 0
