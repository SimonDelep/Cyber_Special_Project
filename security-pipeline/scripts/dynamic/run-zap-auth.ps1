#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$AppName
)

$ErrorActionPreference = "Continue"
. (Join-Path $PSScriptRoot "..\lib\AppManifest.ps1")
. (Join-Path $PSScriptRoot "..\lib\ZapHelper.ps1")
. (Join-Path $PSScriptRoot "..\lib\SessionHelper.ps1")

$app = Get-AppEntry -AppName $AppName
$resultsDir = Get-ResultsDir -AppName $AppName
$zapDir = Join-Path $resultsDir "zap"
New-Item -ItemType Directory -Path $zapDir -Force | Out-Null

if (-not $app.features.auth) {
    $skip = @{
        app = $app.name
        scanType = "authenticated"
        skipped = $true
        reason = "App has no auth feature"
        scannedAt = (Get-Date).ToString("o")
    }
    $skip | ConvertTo-Json | Set-Content (Join-Path $zapDir "auth-alerts.json") -Encoding UTF8
    Write-Host "Skipping ZAP auth scan for $($app.name) (no auth)"
    return
}

$targetUrl = Get-ZapDockerUrl -Url $app.url
$hostHeader = Get-ZapHostHeaderValue -Url $app.url
$loginUser = if ($app.auth.admin.email) { $app.auth.admin.email } else { $app.auth.admin.username }

$hostReplacer = ""
if (Test-ZapHostHeaderFix -Stack $app.stack) {
    $hostReplacer = Get-ZapHostReplacerJobYaml -HostHeaderValue $hostHeader
}

$authSetupJobs = ""
$authNote = ""

switch ($app.auth.loginMethod) {
    { $_ -in @("json", "bearer") } {
        if ($app.auth.loginMethod -eq "bearer") {
            $session = New-AppSession -App $app -Role admin
            if (-not $session.BearerToken) {
                throw "Could not obtain bearer token for $($app.name)"
            }
            $authSetupJobs = Get-ZapBearerReplacerJobYaml -BearerToken $session.BearerToken
            $authNote = "Authenticated via host JWT login + Authorization replacer"
        }
        else {
            $loginUrl = "$(Get-ZapDockerUrl -Url $app.apiUrl)$($app.auth.loginPath)"
            $loginBody = Get-ZapLoginBodyJson -App $app
            $authSetupJobs = Get-ZapJsonLoginJobYaml -LoginUrl $loginUrl -HostHeaderValue $hostHeader -LoginBodyJson $loginBody
            $authNote = "Authenticated via ZAP requestor POST to $loginUrl"
        }
    }
    { $_ -in @("nextauth", "form") } {
        # Cookie-based login (NextAuth CSRF or form-urlencoded) — obtain session cookie from host login, inject via replacer
        $session = New-AppSession -App $app -Role admin
        $cookieHeader = ($session.Cookies.GetCookies($app.apiUrl) | ForEach-Object { "$($_.Name)=$($_.Value)" }) -join "; "
        if (-not $cookieHeader) {
            throw "Could not obtain session cookies for $($app.auth.loginMethod) app $($app.name)"
        }
        $authSetupJobs = Get-ZapCookieReplacerJobYaml -CookieHeader $cookieHeader
        $authNote = "Authenticated via host $($app.auth.loginMethod) login + cookie replacer"
    }
    default {
        throw "Unsupported login method for ZAP auth scan: $($app.auth.loginMethod)"
    }
}

$templatePath = Join-Path (Get-PipelineRoot) "config\zap\auth-scan.yaml"
$planPath = Join-Path $zapDir "auth-scan.yaml"
Expand-ZapScanYaml -TemplatePath $templatePath -Replacements @{
    TARGET_URL = $targetUrl
    HOST_REPLACER_JOB = $hostReplacer
    AUTH_SETUP_JOBS = $authSetupJobs
} -OutPath $planPath

Write-Host "ZAP authenticated scan for $($app.name) at $targetUrl (user: $loginUser)"
Invoke-ZapAutomationScan -ZapDir $zapDir -PlanFileName "auth-scan.yaml" -LogFileName "auth.log"

$rawPath = Join-Path $zapDir "auth-alerts-raw.json"
$reportHtml = Join-Path $zapDir "auth-report.html"
$reportJson = Join-Path $zapDir "auth-alerts.json"

$alerts = Convert-ZapReportToAlertSummary -RawJsonPath $rawPath
$summary = Write-ZapAlertSummary -App $app -ScanType "authenticated" -TargetUrl $targetUrl -OutPath $reportJson -Alerts $alerts -Extra @{
    loginUser = $loginUser
    note = $authNote
}

if (Test-Path $reportHtml) {
    Write-Host "ZAP auth report: $reportHtml"
}
else {
    $logPath = Join-Path $zapDir "auth.log"
    Write-Warning "auth-report.html was not generated - check $logPath"
}

$msg = "ZAP auth scan complete: {0} alert types - {1} high, {2} medium" -f $summary.alertCount, $summary.high, $summary.medium
Write-Host $msg
