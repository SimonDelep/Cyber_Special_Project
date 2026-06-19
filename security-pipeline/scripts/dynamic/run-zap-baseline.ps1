#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$AppName
)

$ErrorActionPreference = "Continue"
. (Join-Path $PSScriptRoot "..\lib\AppManifest.ps1")
. (Join-Path $PSScriptRoot "..\lib\ZapHelper.ps1")

$app = Get-AppEntry -AppName $AppName
$resultsDir = Get-ResultsDir -AppName $AppName
$zapDir = Join-Path $resultsDir "zap"
New-Item -ItemType Directory -Path $zapDir -Force | Out-Null

$targetUrl = Get-ZapDockerUrl -Url $app.url
$hostHeader = Get-ZapHostHeaderValue -Url $app.url
$hostReplacer = ""
if (Test-ZapHostHeaderFix -Stack $app.stack) {
    $hostReplacer = Get-ZapHostReplacerJobYaml -HostHeaderValue $hostHeader
}

$templatePath = Join-Path (Get-PipelineRoot) "config\zap\baseline-scan.yaml"
$planPath = Join-Path $zapDir "baseline-scan.yaml"
Expand-ZapScanYaml -TemplatePath $templatePath -Replacements @{
    TARGET_URL = $targetUrl
    HOST_REPLACER_JOB = $hostReplacer
} -OutPath $planPath

Write-Host "ZAP baseline scan for $($app.name) at $targetUrl"
Invoke-ZapAutomationScan -ZapDir $zapDir -PlanFileName "baseline-scan.yaml" -LogFileName "baseline.log"

$rawPath = Join-Path $zapDir "baseline-alerts-raw.json"
$reportHtml = Join-Path $zapDir "baseline-report.html"
$reportJson = Join-Path $zapDir "baseline-alerts.json"

$alerts = Convert-ZapReportToAlertSummary -RawJsonPath $rawPath
$summary = Write-ZapAlertSummary -App $app -ScanType "baseline" -TargetUrl $targetUrl -OutPath $reportJson -Alerts $alerts

if (Test-Path $reportHtml) {
    Write-Host "ZAP baseline report: $reportHtml"
}
else {
    $logPath = Join-Path $zapDir "baseline.log"
    Write-Warning "baseline-report.html was not generated - check $logPath"
}

$msg = "ZAP baseline complete: {0} alert types - {1} high, {2} medium" -f $summary.alertCount, $summary.high, $summary.medium
Write-Host $msg
