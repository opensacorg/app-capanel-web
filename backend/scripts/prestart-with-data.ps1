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
    Write-Log "Prestart tasks completed (initial_data only; imports must be triggered manually)"
}
finally {
    Set-PSDebug -Trace 0
}
