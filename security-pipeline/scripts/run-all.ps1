#Requires -Version 5.1
param(
    [string]$App,
    [switch]$RunSonar,
    [switch]$SkipDeps,
    [switch]$SkipZap,
    [switch]$SkipManual,
    [switch]$SkipInstall,
    [switch]$StartSonar
)

$ErrorActionPreference = "Stop"
$pipelineRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
. (Join-Path $PSScriptRoot "lib\AppManifest.ps1")

$manifest = Get-Manifest
$apps = if ($App) { @((Get-AppEntry -AppName $App)) } else { $manifest.apps }

# Reset master inventory at start of full run
if (-not $App) {
    $masterInv = Join-Path $pipelineRoot "results\a06-master-inventory.csv"
    if (Test-Path $masterInv) { Remove-Item $masterInv -Force }
}

if ($RunSonar -or $StartSonar) {
    if ($StartSonar) {
        & (Join-Path $PSScriptRoot "static\start-sonar.ps1")
    }
}

$startTime = Get-Date
Write-Host "Security pipeline starting for $($apps.Count) app(s) at $($startTime.ToString('o'))"
Write-Host "Results: $(Join-Path $pipelineRoot 'results')"

foreach ($appEntry in $apps) {
    $name = $appEntry.name
    Write-Host "`n========================================"
    Write-Host "Testing: $name ($($appEntry.stack))"
    Write-Host "========================================"

    try {
        if ($RunSonar) {
            Write-Host "[SonarQube]..."
            & (Join-Path $PSScriptRoot "static\run-sonar.ps1") -AppName $name
        }

        if (-not $SkipDeps) {
            Write-Host "[Dependencies] inventory..."
            & (Join-Path $PSScriptRoot "static\collect-dependencies.ps1") -AppName $name
            Write-Host "[Dependencies] CVE scan..."
            & (Join-Path $PSScriptRoot "static\scan-dependencies.ps1") -AppName $name
        }

        $needsRuntime = (-not $SkipZap) -or (-not $SkipManual)
        if ($needsRuntime) {
            Write-Host "[Runtime] Starting app..."
            $startArgs = @{ AppName = $name }
            if ($SkipInstall) { $startArgs.SkipInstall = $true }
            & (Join-Path $PSScriptRoot "lib\Start-App.ps1") @startArgs

            if (-not $SkipZap) {
                Write-Host "[ZAP] Baseline scan..."
                & (Join-Path $PSScriptRoot "dynamic\run-zap-baseline.ps1") -AppName $name
                Write-Host "[ZAP] Authenticated scan..."
                & (Join-Path $PSScriptRoot "dynamic\run-zap-auth.ps1") -AppName $name
            }

            if (-not $SkipManual) {
                Write-Host "[Manual] Probes M1-M16..."
                & (Join-Path $PSScriptRoot "manual\run-manual-probes.ps1") -AppName $name
            }

            & (Join-Path $PSScriptRoot "lib\Stop-App.ps1") -AppName $name
        }
    }
    catch {
        Write-Error "Failed on $name : $_"
        & (Join-Path $PSScriptRoot "lib\Stop-App.ps1") -AppName $name -ErrorAction SilentlyContinue
        if ($App) { throw }
    }
}

Write-Host "`nAggregating results..."
& (Join-Path $PSScriptRoot "report\aggregate-results.ps1")

$elapsed = (Get-Date) - $startTime
Write-Host "Pipeline complete in $([int]$elapsed.TotalMinutes) min $($elapsed.Seconds) sec"
