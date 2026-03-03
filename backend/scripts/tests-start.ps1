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
    Invoke-Checked python app/tests_pre_start.py
    & (Join-Path $PSScriptRoot "test.ps1") @ScriptArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): scripts/test.ps1 $($ScriptArgs -join ' ')"
    }
}
finally {
    Set-PSDebug -Trace 0
}
