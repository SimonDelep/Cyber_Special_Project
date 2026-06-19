#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$AppName,
    [switch]$ExportOnly
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "..\lib\AppManifest.ps1")

$app = Get-AppEntry -AppName $AppName
$appRoot = Get-AppRoot -App $app
$resultsDir = Get-ResultsDir -AppName $AppName
$sonarDir = Join-Path $resultsDir "sonar"
New-Item -ItemType Directory -Path $sonarDir -Force | Out-Null

$token = Read-EnvValue -Key "SONAR_TOKEN"
if (-not $token) {
    throw "SONAR_TOKEN not set. Add SONAR_TOKEN=... to config/.env after starting SonarQube."
}

$sources = Get-SonarSources -App $app -AppRoot $appRoot
$exclusions = Get-SonarExclusions
$templatePath = Join-Path (Get-PipelineRoot) "config\sonar-project.properties.template"
$propsContent = (Get-Content $templatePath -Raw) `
    -replace '\{\{SONAR_KEY\}\}', $app.sonarKey `
    -replace '\{\{APP_NAME\}\}', $app.name `
    -replace '\{\{SOURCES\}\}', $sources `
    -replace '\{\{EXCLUSIONS\}\}', $exclusions

$propsPath = Join-Path $sonarDir "sonar-project.properties"
# Write UTF-8 without BOM — PowerShell Set-Content adds BOM and breaks sonar.projectKey parsing
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($propsPath, $propsContent, $utf8NoBom)

function Wait-SonarAnalysisTask {
    param(
        [string]$TaskId,
        [string]$Token,
        [string]$BaseUrl = "http://localhost:9000",
        [int]$TimeoutSeconds = 300
    )

    if (-not $TaskId) {
        Write-Warning "No CE task id found in scanner output; falling back to 30s wait."
        Start-Sleep -Seconds 30
        return
    }

    $headers = @{ Authorization = "Bearer $Token" }
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    Write-Host "Waiting for SonarQube to process analysis task $TaskId..."

    while ((Get-Date) -lt $deadline) {
        $task = Invoke-RestMethod -Uri "$BaseUrl/api/ce/task?id=$TaskId" -Headers $headers
        switch ($task.task.status) {
            "SUCCESS" {
                Write-Host "SonarQube analysis task completed."
                return
            }
            { $_ -in @("FAILED", "CANCELED") } {
                throw "SonarQube analysis task $($task.task.status): $($task.task.errorMessage)"
            }
            default {
                Start-Sleep -Seconds 3
            }
        }
    }

    throw "Timed out waiting for SonarQube analysis task $TaskId"
}

function Export-SonarResults {
    param(
        $App,
        [string]$SonarDir,
        [string]$Token,
        [string]$BaseUrl = "http://localhost:9000"
    )

    $headers = @{ Authorization = "Bearer $Token" }
    $issues = @()
    $page = 1
    do {
        $uri = "$BaseUrl/api/issues/search?componentKeys=$($App.sonarKey)&ps=500&p=$page"
        $resp = Invoke-RestMethod -Uri $uri -Headers $headers
        if ($resp.issues) { $issues += $resp.issues }
        $page++
    } while ($issues.Count -lt $resp.total)

    $hotspotResp = Invoke-RestMethod -Uri "$BaseUrl/api/hotspots/search?projectKey=$($App.sonarKey)&ps=1" -Headers $headers -ErrorAction SilentlyContinue
    $hotspotCount = if ($hotspotResp -and $hotspotResp.paging) { [int]$hotspotResp.paging.total } else { 0 }

    $summary = @{
        app = $App.name
        sonarKey = $App.sonarKey
        scannedAt = (Get-Date).ToString("o")
        total = $issues.Count
        bySeverity = $issues | Group-Object severity | ForEach-Object { @{ name = $_.Name; count = $_.Count } }
        byType = $issues | Group-Object type | ForEach-Object { @{ name = $_.Name; count = $_.Count } }
        vulnerabilities = ($issues | Where-Object { $_.type -eq "VULNERABILITY" }).Count
        securityHotspots = $hotspotCount
    }

    $issues | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $SonarDir "issues.json") -Encoding UTF8
    $summary | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $SonarDir "summary.json") -Encoding UTF8
    Write-Host "SonarQube export complete. $($summary.total) issues, $($summary.vulnerabilities) vulnerabilities, $($summary.securityHotspots) hotspots."
}

if ($ExportOnly) {
    Write-Host "Re-exporting SonarQube results for $($app.name)..."
    try {
        Export-SonarResults -App $app -SonarDir $sonarDir -Token $token
    }
    catch {
        Write-Warning "SonarQube export failed: $_"
        Write-Warning "Check SonarQube dashboard for $($app.sonarKey)"
    }
}
else {
    Write-Host "Running sonar-scanner for $($app.name)..."
    $scannerOutput = docker run --rm `
        --add-host=host.docker.internal:host-gateway `
        -e SONAR_HOST_URL="http://host.docker.internal:9000" `
        -e SONAR_TOKEN="$token" `
        -v "${appRoot}:/usr/src" `
        -v "${sonarDir}:/tmp/sonar-config" `
        sonarsource/sonar-scanner-cli `
        "-Dproject.settings=/tmp/sonar-config/sonar-project.properties" `
        2>&1 | Tee-Object -FilePath (Join-Path $sonarDir "scanner.log")

    $scannerText = ($scannerOutput | Out-String)
    $taskId = [regex]::Match($scannerText, 'api/ce/task\?id=([a-f0-9-]+)').Groups[1].Value

    try {
        Wait-SonarAnalysisTask -TaskId $taskId -Token $token
        Export-SonarResults -App $app -SonarDir $sonarDir -Token $token
    }
    catch {
        Write-Warning "Scanner finished but API export failed: $_"
        Write-Warning "Check scanner.log and SonarQube dashboard for $($app.sonarKey)"
    }
}
