#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$AppName,
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "AppManifest.ps1")
. (Join-Path $PSScriptRoot "Wait-Healthy.ps1")

$app = Get-AppEntry -AppName $AppName
$appRoot = Get-AppRoot -App $app
$stateDir = Join-Path (Get-PipelineRoot) "results\.state"
New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
$stateFile = Join-Path $stateDir "$AppName.json"

function Save-AppState {
    param($State)
    $State | ConvertTo-Json -Depth 4 | Set-Content $stateFile -Encoding UTF8
}

function Start-BackgroundProcess {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$Command,
        [hashtable]$Env = @{}
    )

    $logDir = Join-Path (Get-PipelineRoot) "results\$AppName\logs"
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    $logOut = Join-Path $logDir "$Name.out.log"
    $logErr = Join-Path $logDir "$Name.err.log"

    $envPairs = ($Env.GetEnumerator() | ForEach-Object { "`$env:$($_.Key)='$($_.Value)'" }) -join "; "
    $psCommand = if ($envPairs) { "$envPairs; $Command" } else { $Command }

    $proc = Start-Process -FilePath "powershell.exe" `
        -ArgumentList "-NoProfile", "-Command", $psCommand `
        -WorkingDirectory $WorkingDirectory `
        -RedirectStandardOutput $logOut `
        -RedirectStandardError $logErr `
        -PassThru `
        -WindowStyle Hidden

    return @{
        name = $Name
        pid = $proc.Id
        log = $logOut
        logErr = $logErr
    }
}

$state = @{
    app = $AppName
    startedAt = (Get-Date).ToString("o")
    processes = @()
    dockerCompose = $false
}

Write-Host "Starting $($app.name) ($($app.stack))..."

# Start database if docker-compose exists
$composePath = Join-Path $appRoot "docker-compose.yml"
if (Test-Path $composePath) {
    Push-Location $appRoot
    try {
        $prevEap = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        cmd /c "docker compose up -d >nul 2>&1"
        $ErrorActionPreference = $prevEap
        $state.dockerCompose = $true
        Start-Sleep -Seconds 5
    }
    finally { Pop-Location }
}

switch ($app.stack) {
    "nextjs" {
        if (-not $SkipInstall -and -not (Test-Path (Join-Path $appRoot "node_modules"))) {
            Push-Location $appRoot
            try { npm install 2>&1 | Out-Null }
            finally { Pop-Location }
        }

        $pkg = Get-Content (Join-Path $appRoot "package.json") -Raw | ConvertFrom-Json
        if ($pkg.scripts."db:push") {
            Push-Location $appRoot
            try {
                $prev = $ErrorActionPreference
                $ErrorActionPreference = "Continue"
                cmd /c "npm run db:push >nul 2>&1"
                $ErrorActionPreference = $prev
            }
            finally { Pop-Location }
        }
        if ($pkg.scripts."db:seed") {
            Push-Location $appRoot
            try {
                $prev = $ErrorActionPreference
                $ErrorActionPreference = "Continue"
                cmd /c "npm run db:seed >nul 2>&1"
                $ErrorActionPreference = $prev
            }
            catch { Write-Warning "db:seed failed: $_" }
            finally { Pop-Location }
        }

        $port = $app.ports.app
        $state.processes += Start-BackgroundProcess -Name "nextjs" -WorkingDirectory $appRoot `
            -Command "npm run dev -- -p $port -H 0.0.0.0"
    }
    "astro" {
        if (-not $SkipInstall -and -not (Test-Path (Join-Path $appRoot "node_modules"))) {
            Push-Location $appRoot
            try { npm install 2>&1 | Out-Null }
            finally { Pop-Location }
        }

        # Run db setup if script exists
        $pkg = Get-Content (Join-Path $appRoot "package.json") -Raw | ConvertFrom-Json
        if ($pkg.scripts."db:setup") {
            Push-Location $appRoot
            try {
                $prev = $ErrorActionPreference
                $ErrorActionPreference = "Continue"
                cmd /c "npm run db:setup >nul 2>&1"
                $ErrorActionPreference = $prev
            }
            catch { Write-Warning "db:setup failed (may already be initialized): $_" }
            finally { Pop-Location }
        }
        elseif ($pkg.scripts."db:seed") {
            Push-Location $appRoot
            try {
                $prev = $ErrorActionPreference
                $ErrorActionPreference = "Continue"
                cmd /c "npm run db:seed >nul 2>&1"
                $ErrorActionPreference = $prev
            }
            catch { Write-Warning "db:seed failed: $_" }
            finally { Pop-Location }
        }

        $state.processes += Start-BackgroundProcess -Name "astro" -WorkingDirectory $appRoot `
            -Command "npm run dev -- --host 0.0.0.0"
    }
    "fastapi" {
        $backendDir = Join-Path $appRoot "backend"
        $frontendDir = Join-Path $appRoot "frontend"
        $apiPort = $app.ports.api

        if (-not $SkipInstall) {
            if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
                Push-Location $frontendDir
                try { npm install 2>&1 | Out-Null }
                finally { Pop-Location }
            }
        }

        $venvPython = Join-Path $backendDir ".venv\Scripts\python.exe"
        $pythonExe = if (Test-Path $venvPython) { $venvPython } else { "python" }

        $state.processes += Start-BackgroundProcess -Name "uvicorn" -WorkingDirectory $backendDir `
            -Command "& '$pythonExe' -m uvicorn app.main:app --reload --host 0.0.0.0 --port $apiPort"

        $state.processes += Start-BackgroundProcess -Name "vite" -WorkingDirectory $frontendDir `
            -Command "npm run dev -- --host 0.0.0.0"
    }
    default { throw "Unknown stack: $($app.stack)" }
}

Save-AppState -State $state
Wait-AppHealthy -Url $app.url -TimeoutSeconds 240
if ($app.stack -eq "fastapi") {
    Wait-AppHealthy -Url "$($app.apiUrl)/docs" -TimeoutSeconds 120
}

Write-Host "$($app.name) is running at $($app.url)"
