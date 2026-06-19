#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$AppName
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "..\lib\AppManifest.ps1")

function Convert-NpmAuditToCves {
    param($AuditJson, [string]$Source)

    $cves = @()
    if (-not $AuditJson.vulnerabilities) { return $cves }

    foreach ($prop in $AuditJson.vulnerabilities.PSObject.Properties) {
        $vuln = $prop.Value
        $severity = $vuln.severity
        foreach ($via in $vuln.via) {
            if ($via -is [string]) { continue }
            if ($via.source -and $via.title) {
                $cves += [PSCustomObject]@{
                    package = $prop.Name
                    version = $vuln.range
                    cve = if ($via.url -match "CVE-\d+-\d+") { $Matches[0] } else { $via.source }
                    severity = $severity
                    source = $Source
                    title = $via.title
                    fixAvailable = [bool]$vuln.fixAvailable
                }
            }
        }
    }
    return $cves
}

function Convert-PipAuditToCves {
    param($AuditJson)

    $cves = @()
    $items = if ($AuditJson.dependencies) { @($AuditJson.dependencies) } else { @($AuditJson) }

    foreach ($item in $items) {
        foreach ($vuln in $item.vulns) {
            $severity = if ($vuln.PSObject.Properties.Name -contains "severity" -and $vuln.severity) {
                $vuln.severity
            }
            elseif ($vuln.id -match "^CVE-") {
                "high"
            }
            else {
                "moderate"
            }

            $cves += [PSCustomObject]@{
                package = $item.name
                version = $item.version
                cve = $vuln.id
                severity = $severity
                source = "pip"
                title = if ($vuln.description) { $vuln.description.Substring(0, [Math]::Min(200, $vuln.description.Length)) } else { $vuln.id }
                fixAvailable = [bool]$vuln.fix_versions
            }
        }
    }
    return $cves
}

$app = Get-AppEntry -AppName $AppName
$appRoot = Get-AppRoot -App $app
$resultsDir = Get-ResultsDir -AppName $AppName
$depDir = Join-Path $resultsDir "dependencies"
New-Item -ItemType Directory -Path $depDir -Force | Out-Null

$allCves = @()
$auditResults = @()

switch ($app.stack) {
    "fastapi" {
        $npmDir = Join-Path $appRoot "frontend"
        if (Test-Path (Join-Path $npmDir "package-lock.json")) {
            Push-Location $npmDir
            try {
                $auditFile = Join-Path $depDir "npm-audit-frontend.json"
                $prevEap = $ErrorActionPreference
                $ErrorActionPreference = "Continue"
                cmd /c "npm audit --json > `"$auditFile`" 2>nul"
                $ErrorActionPreference = $prevEap
                $raw = Get-Content $auditFile -Raw -ErrorAction SilentlyContinue
                if ($raw) {
                    $audit = $raw | ConvertFrom-Json
                    $auditResults += @{ target = "frontend"; audit = $audit }
                    $allCves += Convert-NpmAuditToCves -AuditJson $audit -Source "npm-frontend"
                }
            }
            finally { Pop-Location }
        }

        $reqPath = Get-RequirementsPath -AppRoot $appRoot
        if ($reqPath) {
            $pipOut = Join-Path $depDir "pip-audit.json"
            $prevEap = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            pip-audit -r $reqPath -f json -o $pipOut 2>&1 | Out-Null
            $ErrorActionPreference = $prevEap
            if (Test-Path $pipOut) {
                $pipJson = Get-Content $pipOut -Raw | ConvertFrom-Json
                $auditResults += @{ target = "backend"; audit = $pipJson }
                $allCves += Convert-PipAuditToCves -AuditJson $pipJson
            }
        }
    }
    default {
        Push-Location $appRoot
        try {
            if (Test-Path "package-lock.json") {
                $auditFile = Join-Path $depDir "npm-audit.json"
                $prevEap = $ErrorActionPreference
                $ErrorActionPreference = "Continue"
                cmd /c "npm audit --json > `"$auditFile`" 2>nul"
                $ErrorActionPreference = $prevEap
                $raw = Get-Content $auditFile -Raw -ErrorAction SilentlyContinue
                if ($raw) {
                    $audit = $raw | ConvertFrom-Json
                    $auditResults += @{ target = "root"; audit = $audit }
                    $allCves += Convert-NpmAuditToCves -AuditJson $audit -Source "npm"
                }
            }
        }
        finally { Pop-Location }
    }
}

$allCves | Export-Csv (Join-Path $depDir "cves.csv") -NoTypeInformation -Encoding UTF8

$summary = @{
    app = $app.name
    scannedAt = (Get-Date).ToString("o")
    totalCves = $allCves.Count
    critical = ($allCves | Where-Object { $_.severity -eq "critical" }).Count
    high = ($allCves | Where-Object { $_.severity -eq "high" }).Count
    moderate = ($allCves | Where-Object { $_.severity -eq "moderate" }).Count
    low = ($allCves | Where-Object { $_.severity -eq "low" }).Count
    a06Pass = (($allCves | Where-Object { $_.severity -in @("critical", "high") }).Count -eq 0)
}

$summary | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $depDir "audit-summary.json") -Encoding UTF8
Write-Host "Dependency scan for $($app.name): $($summary.totalCves) CVEs ($($summary.critical) critical, $($summary.high) high). A06 pass: $($summary.a06Pass)"
