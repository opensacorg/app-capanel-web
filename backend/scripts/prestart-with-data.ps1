[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ScriptArgs
)

$ErrorActionPreference = "Stop"

Set-PSDebug -Trace 1

function Write-Log {
    param([string]$Message)
    $timestamp = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
    Write-Host "[$timestamp] [prestart-with-data] $Message"
}

function Invoke-WithHeartbeat {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Label,
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Arguments
    )

    $heartbeatSeconds = 20
    if ($env:PRESTART_HEARTBEAT_SECONDS) {
        $heartbeatSeconds = [int]$env:PRESTART_HEARTBEAT_SECONDS
    }

    Write-Log "$Label started"
    $process = Start-Process -FilePath $FilePath -ArgumentList $Arguments -NoNewWindow -PassThru
    try {
        while (-not $process.HasExited) {
            Write-Log "$Label in progress..."
            Start-Sleep -Seconds $heartbeatSeconds
            $process.Refresh()
        }
    }
    finally {
        $process.Refresh()
    }

    if ($process.ExitCode -ne 0) {
        throw "Command failed ($($process.ExitCode)): $FilePath $($Arguments -join ' ')"
    }

    Write-Log "$Label finished"
}

try {
    & (Join-Path $PSScriptRoot "prestart.ps1")
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): scripts/prestart.ps1"
    }

    $runDataImports = if ($env:RUN_DATA_IMPORTS) { $env:RUN_DATA_IMPORTS } else { "true" }
    if ($runDataImports.ToLowerInvariant() -ne "true") {
        Write-Log "RUN_DATA_IMPORTS=$runDataImports; skipping data imports."
        exit 0
    }

    $importGcsUri = if ($env:IMPORT_GCS_URI) { $env:IMPORT_GCS_URI } else { "" }
    $importResourcesLocalPath = if ($env:IMPORT_RESOURCES_LOCAL_PATH) { $env:IMPORT_RESOURCES_LOCAL_PATH } else { "$HOME/Downloads/resources" }
    $importResourcesBasePath = "/app/backend/resources"

    if (-not [string]::IsNullOrWhiteSpace($importGcsUri)) {
        Write-Log "Syncing import resources from $importGcsUri to $importResourcesLocalPath"
        Invoke-WithHeartbeat "GCS resources sync" python app/scripts/sync_gcs_resources.py --uri $importGcsUri --dest $importResourcesLocalPath
        $importResourcesBasePath = $importResourcesLocalPath
    }

    $academicCountScript = @'
from sqlalchemy import func
from sqlmodel import Session, select

from app.core.database import engine
from app.model.academic_indicator import AcademicIndicator

with Session(engine) as session:
    count = session.exec(
        select(func.count()).select_from(AcademicIndicator)
    ).one()
    print(int(count or 0))
'@
    $academicIndicatorCountRaw = & python -c $academicCountScript
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to query academic indicator count."
    }
    $academicIndicatorCount = [int]($academicIndicatorCountRaw | Select-Object -Last 1)

    if ($academicIndicatorCount -gt 0) {
        Write-Log "Academic indicators already populated ($academicIndicatorCount rows); skipping imports."
        exit 0
    }

    $importElaDataFile = if ($env:IMPORT_ELA_DATA_FILE) { $env:IMPORT_ELA_DATA_FILE } else { "$importResourcesBasePath/cde/eladownload2025.xlsx" }
    if (Test-Path -Path $importElaDataFile -PathType Leaf) {
        Write-Log "ELA import file found: $importElaDataFile"
        Invoke-WithHeartbeat "ELA import parse/load" python app/scripts/import_ela_data.py $importElaDataFile
    }
    else {
        Write-Log "ELA file not found at $importElaDataFile; skipping scripts/import_ela_data.py."
    }

    $importIndicatorsSource = if ($env:IMPORT_INDICATORS_SOURCE) { $env:IMPORT_INDICATORS_SOURCE } else { "cde" }
    $importIndicatorsPath = if ($env:IMPORT_INDICATORS_PATH) { $env:IMPORT_INDICATORS_PATH } else { "$importResourcesBasePath/cde" }
    $importIndicatorsBatchSize = if ($env:IMPORT_INDICATORS_BATCH_SIZE) { $env:IMPORT_INDICATORS_BATCH_SIZE } else { "1000" }
    $importIndicatorsIndicator = if ($env:IMPORT_INDICATORS_INDICATOR) { $env:IMPORT_INDICATORS_INDICATOR } else { "" }

    if (Test-Path -Path $importIndicatorsPath) {
        Write-Log "Indicators import path found: $importIndicatorsPath (source=$importIndicatorsSource)"
        $indicatorArgs = @()
        if (-not [string]::IsNullOrWhiteSpace($importIndicatorsIndicator)) {
            $indicatorArgs += @("--indicator", $importIndicatorsIndicator)
        }

        Invoke-WithHeartbeat "Indicators import parse/load" python app/scripts/import_indicators.py --source $importIndicatorsSource --path $importIndicatorsPath --batch-size $importIndicatorsBatchSize @indicatorArgs
    }
    else {
        Write-Log "Indicator path not found at $importIndicatorsPath; skipping app/scripts/import_indicators.py."
    }

    Write-Log "Prestart tasks with data imports completed"
}
finally {
    Set-PSDebug -Trace 0
}
