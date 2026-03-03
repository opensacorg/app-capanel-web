[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ScriptArgs
)

$ErrorActionPreference = "Stop"

function Import-EnvFile {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path -Path $Path -PathType Leaf)) {
        throw "Environment file not found: $Path"
    }

    foreach ($line in Get-Content -Path $Path) {
        $trimmed = $line.Trim()
        if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) {
            continue
        }

        if ($trimmed -match "^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$") {
            $name = $Matches[1]
            $value = $Matches[2].Trim()
            if (
                ($value.StartsWith("'") -and $value.EndsWith("'")) -or
                ($value.StartsWith('"') -and $value.EndsWith('"'))
            ) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            [Environment]::SetEnvironmentVariable($name, $value)
        }
    }
}

function Require-Env {
    param([Parameter(Mandatory = $true)][string]$Name, [string]$Message = "")
    $value = [Environment]::GetEnvironmentVariable($Name)
    if ([string]::IsNullOrWhiteSpace($value)) {
        if ($Message) {
            throw $Message
        }
        throw "Set $Name"
    }
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
    )
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): $FilePath $($Arguments -join ' ')"
    }
}

function Test-CommandSuccess {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
    )
    & $FilePath @Arguments *> $null
    return $LASTEXITCODE -eq 0
}

$envPath = Join-Path $PSScriptRoot "cloud-run.env"
Import-EnvFile -Path $envPath

Require-Env GCP_PROJECT_ID "Set GCP_PROJECT_ID"
Require-Env GCP_REGION "Set GCP_REGION, for example us-central1"
Require-Env GCP_AR_REPOSITORY "Set GCP_AR_REPOSITORY"
Require-Env BACKEND_SERVICE "Set BACKEND_SERVICE"
Require-Env FRONTEND_SERVICE "Set FRONTEND_SERVICE"
Require-Env RUN_SERVICE_ACCOUNT "Set RUN_SERVICE_ACCOUNT"
Require-Env VPC_NETWORK "Set VPC_NETWORK, for example default"
Require-Env VPC_SUBNET "Set VPC_SUBNET, for example default"
Require-Env CLOUD_SQL_INSTANCE "Set CLOUD_SQL_INSTANCE"
Require-Env CLOUD_SQL_DB "Set CLOUD_SQL_DB"
Require-Env CLOUD_SQL_USER "Set CLOUD_SQL_USER"

if ($env:TAG) {
    $tag = $env:TAG
}
else {
    $tag = (& git rev-parse --short HEAD).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($tag)) {
        throw "Unable to determine TAG from git rev-parse --short HEAD"
    }
}

$apiV1Str = if ($env:API_V1_STR) { $env:API_V1_STR } else { "/api/v1" }
$projectName = if ($env:PROJECT_NAME) { $env:PROJECT_NAME } else { "California Accountability Panel" }
$backendCorsOrigins = if ($env:BACKEND_CORS_ORIGINS) { $env:BACKEND_CORS_ORIGINS } else { "https://localhost" }
$cloudSqlConnectionName = "$($env:GCP_PROJECT_ID):$($env:GCP_REGION):$($env:CLOUD_SQL_INSTANCE)"
$runServiceAccountEmail = "$($env:RUN_SERVICE_ACCOUNT)@$($env:GCP_PROJECT_ID).iam.gserviceaccount.com"
$runDataImports = if ($env:RUN_DATA_IMPORTS) { $env:RUN_DATA_IMPORTS } else { "false" }
$importGcsUri = if ($env:IMPORT_GCS_URI) { $env:IMPORT_GCS_URI } else { "gs://ca-panel-001-resources/resources" }
$importResourcesLocalPath = if ($env:IMPORT_RESOURCES_LOCAL_PATH) { $env:IMPORT_RESOURCES_LOCAL_PATH } else { "$HOME/Downloads/resources" }
$syncLocalImportsToBucket = if ($env:SYNC_LOCAL_IMPORTS_TO_BUCKET) { $env:SYNC_LOCAL_IMPORTS_TO_BUCKET } else { "true" }
$backendInitJob = if ($env:BACKEND_INIT_JOB) { $env:BACKEND_INIT_JOB } else { "$($env:BACKEND_SERVICE)-init" }
$initTriggerFunctionName = if ($env:INIT_TRIGGER_FUNCTION_NAME) { $env:INIT_TRIGGER_FUNCTION_NAME } else { "$($env:BACKEND_SERVICE)-init-trigger" }
$environment = if ($env:ENVIRONMENT) { $env:ENVIRONMENT } else { "production" }

$backendImage = "$($env:GCP_REGION)-docker.pkg.dev/$($env:GCP_PROJECT_ID)/$($env:GCP_AR_REPOSITORY)/$($env:BACKEND_SERVICE):$tag"
$frontendImage = "$($env:GCP_REGION)-docker.pkg.dev/$($env:GCP_PROJECT_ID)/$($env:GCP_AR_REPOSITORY)/$($env:FRONTEND_SERVICE):$tag"

Write-Host "Using project=$($env:GCP_PROJECT_ID), region=$($env:GCP_REGION), tag=$tag"

if ($environment -ne "production") {
    Write-Host "Refusing deploy: ENVIRONMENT must be production for Cloud Run deploys."
    Write-Host "Current value: $environment"
    exit 1
}

Invoke-Checked gcloud config set project $env:GCP_PROJECT_ID

Invoke-Checked gcloud services enable `
    run.googleapis.com `
    cloudfunctions.googleapis.com `
    eventarc.googleapis.com `
    artifactregistry.googleapis.com `
    cloudbuild.googleapis.com `
    sqladmin.googleapis.com `
    storage.googleapis.com

if ($importGcsUri -notmatch "^gs://([^/]+)") {
    throw "IMPORT_GCS_URI must start with gs://"
}
$importGcsBucket = $Matches[1]

if (-not (Test-CommandSuccess gcloud storage buckets describe "gs://$importGcsBucket")) {
    Write-Host "Creating bucket gs://$importGcsBucket in $($env:GCP_REGION)"
    Invoke-Checked gcloud storage buckets create "gs://$importGcsBucket" `
        "--location=$($env:GCP_REGION)" `
        --uniform-bucket-level-access
}

if ($syncLocalImportsToBucket.ToLowerInvariant() -eq "true") {
    if (Test-Path -Path $importResourcesLocalPath -PathType Container) {
        Write-Host "Syncing local resources $importResourcesLocalPath -> $importGcsUri"
        Invoke-Checked gcloud storage rsync $importResourcesLocalPath $importGcsUri --recursive
    }
    else {
        Write-Host "Local resources path not found: $importResourcesLocalPath"
        exit 1
    }
}
else {
    Write-Host "SYNC_LOCAL_IMPORTS_TO_BUCKET=$syncLocalImportsToBucket; skipping local->bucket sync."
}

if (-not (Test-CommandSuccess gcloud artifacts repositories describe $env:GCP_AR_REPOSITORY "--location=$($env:GCP_REGION)")) {
    Invoke-Checked gcloud artifacts repositories create $env:GCP_AR_REPOSITORY `
        "--location=$($env:GCP_REGION)" `
        --repository-format=docker `
        --description "Container images for CAPanel services"
}

Write-Host "Building backend image $backendImage"
Invoke-Checked gcloud builds submit --tag $backendImage --file backend/Dockerfile .

Write-Host "Deploying backend service $($env:BACKEND_SERVICE)"
$backendSetEnvVars = "ENVIRONMENT=$environment,PROJECT_NAME=$projectName,API_V1_STR=$apiV1Str,BACKEND_CORS_ORIGINS=$backendCorsOrigins,CLOUD_SQL_INSTANCE_CONNECTION_NAME=$cloudSqlConnectionName,POSTGRES_DB=$($env:CLOUD_SQL_DB),POSTGRES_USER=$($env:CLOUD_SQL_USER),POSTGRES_SERVER=localhost,RUN_DATA_IMPORTS=$runDataImports,IMPORT_GCS_URI=$importGcsUri,IMPORT_RESOURCES_LOCAL_PATH=$importResourcesLocalPath"
$backendSecrets = "POSTGRES_PASSWORD=capanel-postgres-password:latest,SECRET_KEY=capanel-secret-key:latest,FIRST_SUPERUSER=capanel-superuser-email:latest,FIRST_SUPERUSER_PASSWORD=capanel-superuser-password:latest"
Invoke-Checked gcloud run deploy $env:BACKEND_SERVICE `
    --image $backendImage `
    "--region=$($env:GCP_REGION)" `
    --platform managed `
    --allow-unauthenticated `
    "--service-account=$runServiceAccountEmail" `
    "--network=$($env:VPC_NETWORK)" `
    "--subnet=$($env:VPC_SUBNET)" `
    --vpc-egress private-ranges-only `
    "--add-cloudsql-instances=$cloudSqlConnectionName" `
    "--set-env-vars=$backendSetEnvVars" `
    "--set-secrets=$backendSecrets"

$backendEnvRows = @(
    & gcloud run services describe $env:BACKEND_SERVICE `
        "--region=$($env:GCP_REGION)" `
        --flatten "spec.template.spec.containers[].env[]" `
        --format "csv[no-heading](spec.template.spec.containers.env.name,spec.template.spec.containers.env.value)"
)
if ($LASTEXITCODE -ne 0) {
    throw "Failed to verify deployed backend environment."
}
$deployedBackendEnvironment = ""
foreach ($row in $backendEnvRows) {
    $parts = $row -split ",", 2
    if ($parts.Count -eq 2 -and $parts[0] -eq "ENVIRONMENT") {
        $deployedBackendEnvironment = $parts[1]
        break
    }
}

if ($deployedBackendEnvironment -ne "production") {
    Write-Host "Backend service ENVIRONMENT verification failed."
    Write-Host "Expected: production"
    if ([string]::IsNullOrWhiteSpace($deployedBackendEnvironment)) {
        Write-Host "Actual: <unset>"
    }
    else {
        Write-Host "Actual: $deployedBackendEnvironment"
    }
    exit 1
}
Write-Host "Verified backend ENVIRONMENT=$deployedBackendEnvironment"

Write-Host "Deploying backend init job $backendInitJob"
$jobSetEnvVars = "ENVIRONMENT=$environment,PROJECT_NAME=$projectName,API_V1_STR=$apiV1Str,BACKEND_CORS_ORIGINS=$backendCorsOrigins,CLOUD_SQL_INSTANCE_CONNECTION_NAME=$cloudSqlConnectionName,POSTGRES_DB=$($env:CLOUD_SQL_DB),POSTGRES_USER=$($env:CLOUD_SQL_USER),POSTGRES_SERVER=localhost,RUN_DATA_IMPORTS=false,IMPORT_GCS_URI=$importGcsUri,IMPORT_RESOURCES_LOCAL_PATH=$importResourcesLocalPath"
Invoke-Checked gcloud run jobs deploy $backendInitJob `
    --image $backendImage `
    "--region=$($env:GCP_REGION)" `
    "--service-account=$runServiceAccountEmail" `
    "--network=$($env:VPC_NETWORK)" `
    "--subnet=$($env:VPC_SUBNET)" `
    --vpc-egress private-ranges-only `
    "--add-cloudsql-instances=$cloudSqlConnectionName" `
    --command python `
    --args app/scripts/initial_data.py `
    "--set-env-vars=$jobSetEnvVars" `
    "--set-secrets=$backendSecrets"

Write-Host "Granting $runServiceAccountEmail permission to run $backendInitJob"
Invoke-Checked gcloud run jobs add-iam-policy-binding $backendInitJob `
    "--region=$($env:GCP_REGION)" `
    "--member=serviceAccount:$runServiceAccountEmail" `
    --role roles/run.invoker

Write-Host "Deploying manual init trigger function $initTriggerFunctionName"
Invoke-Checked gcloud functions deploy $initTriggerFunctionName `
    --gen2 `
    --runtime python312 `
    "--region=$($env:GCP_REGION)" `
    --source scripts/gcp/functions/manual_backend_init `
    --entry-point trigger_backend_init `
    --trigger-http `
    --no-allow-unauthenticated `
    "--service-account=$runServiceAccountEmail" `
    "--set-env-vars=GCP_PROJECT_ID=$($env:GCP_PROJECT_ID),GCP_REGION=$($env:GCP_REGION),BACKEND_INIT_JOB=$backendInitJob"

$backendUrl = (& gcloud run services describe $env:BACKEND_SERVICE "--region=$($env:GCP_REGION)" --format "value(status.url)")
if ($LASTEXITCODE -ne 0) {
    throw "Failed to determine backend URL."
}
$backendUrl = ($backendUrl | Select-Object -First 1).Trim()

Write-Host "Backend URL: $backendUrl"
Write-Host "Building frontend image $frontendImage with VITE_API_URL=$backendUrl"
$cloudBuildConfig = @'
steps:
  - name: gcr.io/cloud-builders/docker
    args:
      - build
      - -f
      - frontend/Dockerfile
      - -t
      - ${_IMAGE}
      - --build-arg
      - VITE_API_URL=${_VITE_API_URL}
      - .
images:
  - ${_IMAGE}
'@
$tmpBuildConfigPath = [System.IO.Path]::GetTempFileName()
try {
    Set-Content -Path $tmpBuildConfigPath -Value $cloudBuildConfig -NoNewline
    Invoke-Checked gcloud builds submit `
        --substitutions "_IMAGE=$frontendImage,_VITE_API_URL=$backendUrl" `
        --config $tmpBuildConfigPath `
        .
}
finally {
    Remove-Item -Path $tmpBuildConfigPath -ErrorAction SilentlyContinue
}

Write-Host "Deploying frontend service $($env:FRONTEND_SERVICE)"
Invoke-Checked gcloud run deploy $env:FRONTEND_SERVICE `
    --image $frontendImage `
    "--region=$($env:GCP_REGION)" `
    --platform managed `
    --allow-unauthenticated

$frontendUrl = (& gcloud run services describe $env:FRONTEND_SERVICE "--region=$($env:GCP_REGION)" --format "value(status.url)")
if ($LASTEXITCODE -ne 0) {
    throw "Failed to determine frontend URL."
}
$frontendUrl = ($frontendUrl | Select-Object -First 1).Trim()

Write-Host "Frontend URL: $frontendUrl"
$initTriggerFunctionUrl = (& gcloud functions describe $initTriggerFunctionName "--region=$($env:GCP_REGION)" --gen2 --format "value(serviceConfig.uri)")
if ($LASTEXITCODE -ne 0) {
    throw "Failed to determine init trigger function URL."
}
$initTriggerFunctionUrl = ($initTriggerFunctionUrl | Select-Object -First 1).Trim()

Write-Host "Manual init trigger URL: $initTriggerFunctionUrl"
Write-Host "Invoke with:"
Write-Host "curl -X POST -H ""Authorization: Bearer `$(gcloud auth print-identity-token)"" ""$initTriggerFunctionUrl"""
Write-Host "Done."
