[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ScriptArgs
)

$ErrorActionPreference = "Stop"

Set-PSDebug -Trace 1

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
    Invoke-Checked docker compose build
    Invoke-Checked docker compose down -v --remove-orphans
    Invoke-Checked docker compose up -d
    Invoke-Checked docker compose exec -T backend bash scripts/tests-start.sh @ScriptArgs
    Invoke-Checked docker compose down -v --remove-orphans
}
finally {
    Set-PSDebug -Trace 0
}
