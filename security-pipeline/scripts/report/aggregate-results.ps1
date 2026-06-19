#Requires -Version 5.1
$ErrorActionPreference = "Continue"
. (Join-Path $PSScriptRoot "..\lib\AppManifest.ps1")

$pipelineRoot = Get-PipelineRoot
$resultsRoot = Join-Path $pipelineRoot "results"
$manifest = Get-Manifest

$summaryRows = @()
$manualMatrix = @()
$cveMatrix = @()

foreach ($app in $manifest.apps) {
    $name = $app.name
    $appDir = Join-Path $resultsRoot $name

    $row = [ordered]@{
        app = $name
        stack = $app.stack
        sonar_total = ""
        sonar_vulnerabilities = ""
        sonar_hotspots = ""
        cve_total = ""
        cve_critical = ""
        cve_high = ""
        a06_pass = ""
        zap_baseline_high = ""
        zap_baseline_medium = ""
        zap_auth_high = ""
        zap_auth_medium = ""
        manual_pass = ""
        manual_fail = ""
        manual_na = ""
    }

    $sonarSummary = Join-Path $appDir "sonar\summary.json"
    if (Test-Path $sonarSummary) {
        $s = Get-Content $sonarSummary -Raw | ConvertFrom-Json
        $row.sonar_total = $s.total
        $row.sonar_vulnerabilities = $s.vulnerabilities
        $row.sonar_hotspots = $s.securityHotspots
    }

    $auditSummary = Join-Path $appDir "dependencies\audit-summary.json"
    if (Test-Path $auditSummary) {
        $a = Get-Content $auditSummary -Raw | ConvertFrom-Json
        $row.cve_total = $a.totalCves
        $row.cve_critical = $a.critical
        $row.cve_high = $a.high
        $row.a06_pass = $a.a06Pass
    }

    $cvesCsv = Join-Path $appDir "dependencies\cves.csv"
    if (Test-Path $cvesCsv) {
        Import-Csv $cvesCsv | ForEach-Object {
            $cveMatrix += [PSCustomObject]@{
                app = $name
                package = $_.package
                version = $_.version
                cve = $_.cve
                severity = $_.severity
                source = $_.source
            }
        }
    }

    $zapBase = Join-Path $appDir "zap\baseline-alerts.json"
    if (Test-Path $zapBase) {
        $z = Get-Content $zapBase -Raw | ConvertFrom-Json
        $row.zap_baseline_high = $z.high
        $row.zap_baseline_medium = $z.medium
    }

    $zapAuth = Join-Path $appDir "zap\auth-alerts.json"
    if (Test-Path $zapAuth) {
        $z = Get-Content $zapAuth -Raw | ConvertFrom-Json
        if (-not $z.skipped) {
            $row.zap_auth_high = $z.high
            $row.zap_auth_medium = $z.medium
        }
    }

    $manual = Join-Path $appDir "manual\checklist.json"
    if (Test-Path $manual) {
        $m = Get-Content $manual -Raw | ConvertFrom-Json
        $row.manual_pass = $m.pass
        $row.manual_fail = $m.fail
        $row.manual_na = $m.na
        foreach ($t in $m.tests) {
            $manualMatrix += [PSCustomObject]@{
                app = $name
                test_id = $t.id
                test_name = $t.name
                result = $t.result
                covers = $t.covers
            }
        }
    }

    $summaryRows += [PSCustomObject]$row
}

$summaryCsv = Join-Path $resultsRoot "summary.csv"
$summaryMd = Join-Path $resultsRoot "summary.md"
$cveMatrixCsv = Join-Path $resultsRoot "a06-cve-matrix.csv"
$manualMatrixCsv = Join-Path $resultsRoot "manual-matrix.csv"

$summaryRows | Export-Csv $summaryCsv -NoTypeInformation -Encoding UTF8
$cveMatrix | Export-Csv $cveMatrixCsv -NoTypeInformation -Encoding UTF8
$manualMatrix | Export-Csv $manualMatrixCsv -NoTypeInformation -Encoding UTF8

$md = @(
    "# Security Pipeline Summary",
    "",
    "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    "",
    "## Per-application overview",
    "",
    "| App | Stack | Sonar Issues | CVEs (crit/high) | ZAP High (base/auth) | Manual Pass/Fail/N/A |",
    "|-----|-------|--------------|------------------|----------------------|----------------------|"
)

foreach ($r in $summaryRows) {
    $cve = "$($r.cve_total) ($($r.cve_critical)/$($r.cve_high))"
    $zap = "$($r.zap_baseline_high) / $($r.zap_auth_high)"
    $manual = "$($r.manual_pass) / $($r.manual_fail) / $($r.manual_na)"
    $md += "| $($r.app) | $($r.stack) | $($r.sonar_total) | $cve | $zap | $manual |"
}

$md += @(
    "",
    "## Output files",
    "",
    "- summary.csv - quantitative metrics per app",
    "- a06-cve-matrix.csv - all dependency CVEs",
    "- manual-matrix.csv - M1-M16 results per app",
    "- a06-master-inventory.csv - full dependency list",
    ""
)

$md -join "`n" | Set-Content $summaryMd -Encoding UTF8

Write-Host "Wrote:"
Write-Host "  $summaryCsv"
Write-Host "  $summaryMd"
Write-Host "  $cveMatrixCsv"
Write-Host "  $manualMatrixCsv"
