[CmdletBinding()]
param(
    [string]$EnvFile,
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

function Resolve-EnvFilePath {
    param([string]$PreferredPath)

    $candidatePaths = @()
    if (-not [string]::IsNullOrWhiteSpace($PreferredPath)) {
        $candidatePaths += $PreferredPath
    }
    else {
        $repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
        $candidatePaths += (Join-Path $repoRoot ".env")
    }

    foreach ($candidatePath in $candidatePaths) {
        if ([string]::IsNullOrWhiteSpace($candidatePath)) {
            continue
        }

        $resolvedPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($candidatePath)
        if (Test-Path -LiteralPath $resolvedPath -PathType Leaf) {
            return $resolvedPath
        }
    }

    $checkedPaths = ($candidatePaths | ForEach-Object {
            $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($_)
        }) -join ", "
    throw "Environment file not found. Checked: $checkedPaths. Pass -EnvFile <path> or create .env in the repo root."
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

function New-EnvVarsFile {
    param(
        [Parameter(Mandatory = $true)][hashtable]$EnvVars
    )

    $tempPath = [System.IO.Path]::GetTempFileName()
    $lines = foreach ($key in $EnvVars.Keys) {
        $value = [string]$EnvVars[$key]
        $escaped = $value.Replace("'", "''")
        "{0}: '{1}'" -f $key, $escaped
    }
    Set-Content -Path $tempPath -Value ($lines -join "`n") -NoNewline -Encoding utf8
    return $tempPath
}

$envPath = Resolve-EnvFilePath -PreferredPath $EnvFile
Write-Host "Loading environment from $envPath"
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
$runStartupDataImports = if ($env:RUN_STARTUP_DATA_IMPORTS) { $env:RUN_STARTUP_DATA_IMPORTS } else { "false" }
$importGcsUri = if ($env:IMPORT_GCS_URI) { $env:IMPORT_GCS_URI } else { "gs://ca-panel-001-resources/resources" }
$importResourcesLocalPath = if ($env:IMPORT_RESOURCES_LOCAL_PATH) { $env:IMPORT_RESOURCES_LOCAL_PATH } else { "$HOME/Downloads/resources" }
$syncLocalImportsToBucket = if ($env:SYNC_LOCAL_IMPORTS_TO_BUCKET) { $env:SYNC_LOCAL_IMPORTS_TO_BUCKET } else { "false" }
$fullService = if ($env:FULL_SERVICE) { $env:FULL_SERVICE } else { "capanel-full" }
$backendInitJob = if ($env:BACKEND_INIT_JOB) { $env:BACKEND_INIT_JOB } else { "$fullService-init" }
$initTriggerFunctionName = if ($env:INIT_TRIGGER_FUNCTION_NAME) { $env:INIT_TRIGGER_FUNCTION_NAME } else { "$fullService-init-trigger" }
$backendInitJobTaskTimeout = if ($env:BACKEND_INIT_JOB_TASK_TIMEOUT) { $env:BACKEND_INIT_JOB_TASK_TIMEOUT } else { "7200s" }
$backendInitJobCpu = if ($env:BACKEND_INIT_JOB_CPU) { $env:BACKEND_INIT_JOB_CPU } else { "4" }
$backendInitJobMemory = if ($env:BACKEND_INIT_JOB_MEMORY) { $env:BACKEND_INIT_JOB_MEMORY } else { "8Gi" }
$initTriggerFunctionTimeout = if ($env:INIT_TRIGGER_FUNCTION_TIMEOUT) { $env:INIT_TRIGGER_FUNCTION_TIMEOUT } else { "3600s" }
$jobStepTimeoutSeconds = if ($env:JOB_STEP_TIMEOUT_SECONDS) { $env:JOB_STEP_TIMEOUT_SECONDS } else { "7200" }
$jobPollIntervalSeconds = if ($env:JOB_POLL_INTERVAL_SECONDS) { $env:JOB_POLL_INTERVAL_SECONDS } else { "10" }
$originalEnvironment = if ($env:ENVIRONMENT) { $env:ENVIRONMENT } else { "<unset>" }
$environment = "production"
$env:ENVIRONMENT = "production"
$frontendHost = if ($env:FRONTEND_HOST_PRODUCTION) {
    $env:FRONTEND_HOST_PRODUCTION
}
elseif ($environment -eq "production") {
    "https://capanel-full-5418848943.us-west1.run.app"
}
elseif ($env:FRONTEND_HOST) {
    $env:FRONTEND_HOST
}
else {
    "http://localhost:5173"
}

$backendImage = "$($env:GCP_REGION)-docker.pkg.dev/$($env:GCP_PROJECT_ID)/$($env:GCP_AR_REPOSITORY)/$($env:BACKEND_SERVICE):$tag"
$frontendImage = "$($env:GCP_REGION)-docker.pkg.dev/$($env:GCP_PROJECT_ID)/$($env:GCP_AR_REPOSITORY)/$($env:FRONTEND_SERVICE):$tag"

Write-Host "Using project=$($env:GCP_PROJECT_ID), region=$($env:GCP_REGION), tag=$tag"
Write-Host "Using FRONTEND_HOST=$frontendHost"
if ($originalEnvironment -ne "production") {
    Write-Host "Forcing ENVIRONMENT=production for Cloud Run deploy (was: $originalEnvironment)"
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
    throw "Bucket gs://$importGcsBucket was not found. This deploy expects an existing bucket (for example: gs://ca-panel-001-resources/resources)."
}

if ($syncLocalImportsToBucket.ToLowerInvariant() -eq "true") {
    if (Test-Path -Path $importResourcesLocalPath -PathType Container) {
        Write-Host "Merging local resources $importResourcesLocalPath -> $importGcsUri (new files only; no overwrite/delete)"
        Invoke-Checked gcloud storage cp `
            "--recursive" `
            "--no-clobber" `
            "$importResourcesLocalPath/*" `
            $importGcsUri
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
$backendCloudBuildConfig = @'
steps:
  - name: gcr.io/cloud-builders/docker
    env:
      - DOCKER_BUILDKIT=1
    args:
      - build
      - -f
      - backend/Dockerfile
      - -t
      - ${_IMAGE}
      - .
images:
  - ${_IMAGE}
'@
$tmpBackendBuildConfigPath = [System.IO.Path]::GetTempFileName()
try {
    Set-Content -Path $tmpBackendBuildConfigPath -Value $backendCloudBuildConfig -NoNewline
    Invoke-Checked gcloud builds submit `
        --substitutions "_IMAGE=$backendImage" `
        --config $tmpBackendBuildConfigPath `
        .
}
finally {
    Remove-Item -Path $tmpBackendBuildConfigPath -ErrorAction SilentlyContinue
}

Write-Host "Preparing one-service deployment for $fullService"
$backendSecrets = "POSTGRES_PASSWORD=capanel-postgres-password:latest,SECRET_KEY=capanel-secret-key:latest,FIRST_SUPERUSER=capanel-superuser-email:latest,FIRST_SUPERUSER_PASSWORD=capanel-superuser-password:latest"

Write-Host "Deploying backend init job $backendInitJob"
$jobEnvFile = New-EnvVarsFile -EnvVars @{
    ENVIRONMENT                        = $environment
    PROJECT_NAME                       = $projectName
    API_V1_STR                         = $apiV1Str
    BACKEND_CORS_ORIGINS               = $backendCorsOrigins
    FRONTEND_HOST                      = $frontendHost
    CLOUD_SQL_INSTANCE_CONNECTION_NAME = $cloudSqlConnectionName
    POSTGRES_DB                        = $env:CLOUD_SQL_DB
    POSTGRES_USER                      = $env:CLOUD_SQL_USER
    POSTGRES_SERVER                    = "localhost"
    RUN_DATA_IMPORTS                   = "false"
    RUN_STARTUP_DATA_IMPORTS           = "false"
    IMPORT_GCS_URI                     = $importGcsUri
    IMPORT_RESOURCES_LOCAL_PATH        = $importResourcesLocalPath
}
try {
    Invoke-Checked gcloud run jobs deploy $backendInitJob `
        --image $backendImage `
        "--region=$($env:GCP_REGION)" `
        "--service-account=$runServiceAccountEmail" `
        "--task-timeout=$backendInitJobTaskTimeout" `
        "--cpu=$backendInitJobCpu" `
        "--memory=$backendInitJobMemory" `
        "--network=$($env:VPC_NETWORK)" `
        "--subnet=$($env:VPC_SUBNET)" `
        --vpc-egress private-ranges-only `
        "--set-cloudsql-instances=$cloudSqlConnectionName" `
        --command python `
        --args app/scripts/initial_data.py `
        "--env-vars-file=$jobEnvFile" `
        "--set-secrets=$backendSecrets"
}
finally {
    Remove-Item -Path $jobEnvFile -ErrorAction SilentlyContinue
}

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
    "--timeout=$initTriggerFunctionTimeout" `
    --source backend/scripts/gcp/functions/manual_backend_init `
    --entry-point trigger_backend_init `
    --trigger-http `
    --no-allow-unauthenticated `
    "--service-account=$runServiceAccountEmail" `
    "--set-env-vars=GCP_PROJECT_ID=$($env:GCP_PROJECT_ID),GCP_REGION=$($env:GCP_REGION),BACKEND_INIT_JOB=$backendInitJob,JOB_STEP_TIMEOUT_SECONDS=$jobStepTimeoutSeconds,JOB_POLL_INTERVAL_SECONDS=$jobPollIntervalSeconds"

Write-Host "Building frontend image $frontendImage with VITE_API_URL=$apiV1Str"
$cloudBuildConfig = @'
steps:
  - name: gcr.io/cloud-builders/docker
    env:
      - DOCKER_BUILDKIT=1
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
        --substitutions "_IMAGE=$frontendImage,_VITE_API_URL=$apiV1Str" `
        --config $tmpBuildConfigPath `
        .
}
finally {
    Remove-Item -Path $tmpBuildConfigPath -ErrorAction SilentlyContinue
}

Write-Host "Deploying combined Cloud Run service $fullService"
$serviceRenderedPath = [System.IO.Path]::GetTempFileName()
$escapedEnvironment = $environment.Replace("'", "''")
$escapedProjectName = $projectName.Replace("'", "''")
$escapedApiV1Str = $apiV1Str.Replace("'", "''")
$escapedBackendCorsOrigins = $backendCorsOrigins.Replace("'", "''")
$escapedFrontendHost = $frontendHost.Replace("'", "''")
$escapedCloudSqlConnectionName = $cloudSqlConnectionName.Replace("'", "''")
$escapedCloudSqlDb = $env:CLOUD_SQL_DB.Replace("'", "''")
$escapedCloudSqlUser = $env:CLOUD_SQL_USER.Replace("'", "''")
$escapedRunDataImports = $runDataImports.Replace("'", "''")
$escapedRunStartupDataImports = $runStartupDataImports.Replace("'", "''")
$escapedImportGcsUri = $importGcsUri.Replace("'", "''")
$escapedImportResourcesLocalPath = $importResourcesLocalPath.Replace("'", "''")
$serviceYaml = @"
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: $fullService
  labels:
    cloud.googleapis.com/location: $($env:GCP_REGION)
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/cloudsql-instances: $cloudSqlConnectionName
        run.googleapis.com/network-interfaces: '[{"network":"$($env:VPC_NETWORK)","subnetwork":"$($env:VPC_SUBNET)"}]'
        run.googleapis.com/vpc-access-egress: private-ranges-only
    spec:
      serviceAccountName: $runServiceAccountEmail
      containers:
      - name: frontend
        image: $frontendImage
        ports:
        - containerPort: 8080
        startupProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        livenessProbe:
          httpGet:
            path: /
            port: 8080
          periodSeconds: 30
          timeoutSeconds: 5
        resources:
          limits:
            cpu: 500m
            memory: 256Mi
      - name: backend
        image: $backendImage
        startupProbe:
          httpGet:
            path: /api/v1/utils/health-check/
            port: 9000
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        livenessProbe:
          httpGet:
            path: /api/v1/utils/health-check/
            port: 9000
          periodSeconds: 30
          timeoutSeconds: 5
        env:
        - name: ENVIRONMENT
          value: '$escapedEnvironment'
        - name: PROJECT_NAME
          value: '$escapedProjectName'
        - name: API_V1_STR
          value: '$escapedApiV1Str'
        - name: BACKEND_CORS_ORIGINS
          value: '$escapedBackendCorsOrigins'
        - name: FRONTEND_HOST
          value: '$escapedFrontendHost'
        - name: CLOUD_SQL_INSTANCE_CONNECTION_NAME
          value: '$escapedCloudSqlConnectionName'
        - name: POSTGRES_SERVER
          value: 'localhost'
        - name: POSTGRES_DB
          value: '$escapedCloudSqlDb'
        - name: POSTGRES_USER
          value: '$escapedCloudSqlUser'
        - name: RUN_DATA_IMPORTS
          value: '$escapedRunDataImports'
        - name: RUN_STARTUP_DATA_IMPORTS
          value: '$escapedRunStartupDataImports'
        - name: IMPORT_GCS_URI
          value: '$escapedImportGcsUri'
        - name: IMPORT_RESOURCES_LOCAL_PATH
          value: '$escapedImportResourcesLocalPath'
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              key: latest
              name: capanel-secret-key
        - name: FIRST_SUPERUSER
          valueFrom:
            secretKeyRef:
              key: latest
              name: capanel-superuser-email
        - name: FIRST_SUPERUSER_PASSWORD
          valueFrom:
            secretKeyRef:
              key: latest
              name: capanel-superuser-password
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              key: latest
              name: capanel-postgres-password
        resources:
          limits:
            cpu: 1000m
            memory: 2Gi
"@
try {
    Set-Content -Path $serviceRenderedPath -Value $serviceYaml -NoNewline -Encoding utf8
    Invoke-Checked gcloud run services replace $serviceRenderedPath "--region=$($env:GCP_REGION)"
    Invoke-Checked gcloud run services add-iam-policy-binding $fullService `
        "--region=$($env:GCP_REGION)" `
        "--member=allUsers" `
        --role roles/run.invoker
}
finally {
    Remove-Item -Path $serviceRenderedPath -ErrorAction SilentlyContinue
}

$fullServiceUrl = (& gcloud run services describe $fullService "--region=$($env:GCP_REGION)" --format "value(status.url)")
if ($LASTEXITCODE -ne 0) {
    throw "Failed to determine combined service URL."
}
$fullServiceUrl = ($fullServiceUrl | Select-Object -First 1).Trim()
Write-Host "Full service URL: $fullServiceUrl"
$initTriggerFunctionUrl = (& gcloud functions describe $initTriggerFunctionName "--region=$($env:GCP_REGION)" --gen2 --format "value(serviceConfig.uri)")
if ($LASTEXITCODE -ne 0) {
    throw "Failed to determine init trigger function URL."
}
$initTriggerFunctionUrl = ($initTriggerFunctionUrl | Select-Object -First 1).Trim()

Write-Host "Manual init trigger URL: $initTriggerFunctionUrl"
Write-Host "Invoke with:"
Write-Host "curl -X POST -H ""Authorization: Bearer `$(gcloud auth print-identity-token)"" ""$initTriggerFunctionUrl"""
Write-Host "Done."
