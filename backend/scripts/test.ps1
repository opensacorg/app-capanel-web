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
    $coverageTitle = if ($ScriptArgs.Count -gt 0) { $ScriptArgs -join " " } else { "coverage" }
    Invoke-Checked coverage run -m pytest tests/
    Invoke-Checked coverage report
    Invoke-Checked coverage html --title $coverageTitle
}
finally {
    Set-PSDebug -Trace 0
}
