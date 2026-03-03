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
    Write-Host "[$timestamp] [prestart] $Message"
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Arguments
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): $FilePath $($Arguments -join ' ')"
    }
}

try {
    Write-Log "Waiting for database connection"
    Invoke-Checked python app/scripts/backend_pre_start.py

    Write-Log "Running database migrations"
    Invoke-Checked alembic upgrade head

    Write-Log "Creating initial data"
    Invoke-Checked python app/scripts/initial_data.py

    Write-Log "Prestart tasks completed (no data imports)"
}
finally {
    Set-PSDebug -Trace 0
}
