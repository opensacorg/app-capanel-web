[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ScriptArgs
)

$ErrorActionPreference = "Stop"

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

Invoke-Checked docker-compose down -v --remove-orphans

if ($IsLinux) {
    Write-Host "Remove __pycache__ files"
    Invoke-Checked sudo find . -type d -name __pycache__ -exec rm -r "{}" "+"
}

Invoke-Checked docker-compose build
Invoke-Checked docker-compose up -d
Invoke-Checked docker-compose exec -T backend bash scripts/tests-start.sh @ScriptArgs
