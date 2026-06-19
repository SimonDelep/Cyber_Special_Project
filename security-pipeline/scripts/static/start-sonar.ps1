#Requires -Version 5.1
param(
    [int]$TimeoutSeconds = 300
)

$ErrorActionPreference = "Stop"
$pipelineRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$composeFile = Join-Path $pipelineRoot "docker-compose.sonar.yml"

Push-Location $pipelineRoot
try {
    Write-Host "Starting SonarQube (Docker)..."
    docker compose -f $composeFile up -d

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $status = Invoke-RestMethod -Uri "http://localhost:9000/api/system/status" -TimeoutSec 5
            if ($status.status -eq "UP") {
                Write-Host "SonarQube is UP at http://localhost:9000"
                Write-Host "Default login: admin / admin (change on first login)"
                Write-Host "Create a token and save it to config/.env as SONAR_TOKEN=..."
                return
            }
        }
        catch {
            # still starting
        }
        Start-Sleep -Seconds 5
        Write-Host "Waiting for SonarQube..."
    }
    throw "SonarQube did not become ready within $TimeoutSeconds seconds."
}
finally {
    Pop-Location
}
