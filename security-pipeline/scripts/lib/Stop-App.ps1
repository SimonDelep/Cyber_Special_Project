#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$AppName
)

$ErrorActionPreference = "Continue"
. (Join-Path $PSScriptRoot "AppManifest.ps1")

$app = Get-AppEntry -AppName $AppName
$appRoot = Get-AppRoot -App $app
$stateFile = Join-Path (Get-PipelineRoot) "results\.state\$AppName.json"

Write-Host "Stopping $AppName..."

if (Test-Path $stateFile) {
    $state = Get-Content $stateFile -Raw | ConvertFrom-Json
    foreach ($proc in $state.processes) {
        try {
            Stop-Process -Id $proc.pid -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped process $($proc.name) (PID $($proc.pid))"
        }
        catch {
            Write-Warning "Could not stop PID $($proc.pid): $_"
        }
    }

    if ($state.dockerCompose) {
        $composePath = Join-Path $appRoot "docker-compose.yml"
        if (Test-Path $composePath) {
            Push-Location $appRoot
            try {
                docker compose down 2>&1 | Out-Null
                Write-Host "Docker compose stopped for $AppName"
            }
            finally { Pop-Location }
        }
    }

    Remove-Item $stateFile -Force -ErrorAction SilentlyContinue
}
else {
    Write-Warning "No state file for $AppName - attempting port-based cleanup"
    $ports = @($app.ports.app)
    if ($app.ports.api) { $ports += $app.ports.api }
    foreach ($port in $ports) {
        Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique |
            ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    }
}

Write-Host ($AppName + " stopped.")
