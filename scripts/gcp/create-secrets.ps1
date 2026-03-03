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
Require-Env RUN_SERVICE_ACCOUNT "Set RUN_SERVICE_ACCOUNT"
Require-Env CLOUD_SQL_PASSWORD "Set CLOUD_SQL_PASSWORD"
Require-Env SECRET_KEY "Set SECRET_KEY"
Require-Env FIRST_SUPERUSER "Set FIRST_SUPERUSER"
Require-Env FIRST_SUPERUSER_PASSWORD "Set FIRST_SUPERUSER_PASSWORD"

$runSaEmail = "$($env:RUN_SERVICE_ACCOUNT)@$($env:GCP_PROJECT_ID).iam.gserviceaccount.com"
$secrets = [ordered]@{
    "capanel-postgres-password" = $env:CLOUD_SQL_PASSWORD
    "capanel-secret-key" = $env:SECRET_KEY
    "capanel-superuser-email" = $env:FIRST_SUPERUSER
    "capanel-superuser-password" = $env:FIRST_SUPERUSER_PASSWORD
}

Write-Host "Enabling Secret Manager API ..."
Invoke-Checked gcloud services enable secretmanager.googleapis.com "--project=$($env:GCP_PROJECT_ID)"

foreach ($secretName in $secrets.Keys) {
    $secretValue = [string]$secrets[$secretName]

    if (-not (Test-CommandSuccess gcloud secrets describe $secretName "--project=$($env:GCP_PROJECT_ID)")) {
        Write-Host "Creating secret $secretName ..."
        Invoke-Checked gcloud secrets create $secretName `
            "--project=$($env:GCP_PROJECT_ID)" `
            --replication-policy=automatic
    }
    else {
        Write-Host "Secret $secretName already exists - skipping creation."
    }

    Write-Host "Adding latest version for $secretName ..."
    $tmpFile = [System.IO.Path]::GetTempFileName()
    try {
        Set-Content -Path $tmpFile -Value $secretValue -NoNewline
        Invoke-Checked gcloud secrets versions add $secretName `
            "--project=$($env:GCP_PROJECT_ID)" `
            --data-file="$tmpFile"
    }
    finally {
        Remove-Item -Path $tmpFile -ErrorAction SilentlyContinue
    }

    Write-Host "Granting $runSaEmail accessor role on $secretName ..."
    Invoke-Checked gcloud secrets add-iam-policy-binding $secretName `
        "--project=$($env:GCP_PROJECT_ID)" `
        "--member=serviceAccount:$runSaEmail" `
        --role=roles/secretmanager.secretAccessor `
        --quiet
}

Write-Host ""
Write-Host "All secrets created/updated and IAM bindings applied."
Write-Host ""
Write-Host "Verify with:"
Write-Host "  gcloud secrets list --project=$($env:GCP_PROJECT_ID) --filter='name:capanel-'"
