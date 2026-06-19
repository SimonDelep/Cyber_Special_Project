function Get-PipelineRoot {
    return (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

function Get-ManifestPath {
    return Join-Path (Get-PipelineRoot) "config\apps.manifest.json"
}

function Get-Manifest {
    $path = Get-ManifestPath
    if (-not (Test-Path $path)) {
        throw "Manifest not found: $path"
    }
    $raw = Get-Content $path -Raw | ConvertFrom-Json
    return $raw
}

function Get-AppEntry {
    param(
        [Parameter(Mandatory = $true)]
        [string]$AppName
    )

    $manifest = Get-Manifest
    $app = $manifest.apps | Where-Object { $_.name -eq $AppName }
    if (-not $app) {
        $names = ($manifest.apps | ForEach-Object { $_.name }) -join ", "
        throw "App '$AppName' not found in manifest. Available: $names"
    }
    return $app
}

function Get-AppsRoot {
    $pipelineRoot = Get-PipelineRoot
    $cacheFile = Join-Path $pipelineRoot "config\apps-root.txt"

    if (Test-Path $cacheFile) {
        $cached = Get-Content $cacheFile -Raw -Encoding UTF8
        if ($cached -and (Test-Path $cached.Trim())) {
            return $cached.Trim()
        }
    }

    $cyberRoot = (Resolve-Path (Join-Path $pipelineRoot "..")).Path
    $found = $null
    foreach ($dir in [System.IO.Directory]::EnumerateDirectories($cyberRoot)) {
        $name = [System.IO.Path]::GetFileName($dir)
        if ($name -like "*Code_Application*") {
            $found = $dir
            break
        }
    }

    if (-not $found) {
        throw "Could not find Génération_Code_Application folder under $cyberRoot"
    }

    Set-Content -Path $cacheFile -Value $found -Encoding UTF8 -NoNewline
    return $found
}

function Get-AppRoot {
    param(
        [Parameter(Mandatory = $true)]
        $App
    )

    $appsRoot = Get-AppsRoot
    $found = $null
    foreach ($dir in [System.IO.Directory]::EnumerateDirectories($appsRoot)) {
        if ([System.IO.Path]::GetFileName($dir) -eq $App.name) {
            $found = $dir
            break
        }
    }

    if (-not $found) {
        throw "App folder '$($App.name)' not found under $appsRoot"
    }
    return $found
}

function Get-AppApiPrefix {
    param(
        [Parameter(Mandatory = $true)]
        $App
    )

    if ($App.apiPrefix) {
        return $App.apiPrefix.TrimEnd("/")
    }
    return "/api"
}

function Convert-LegacyApiPath {
    param(
        [Parameter(Mandatory = $true)]
        $App,
        [Parameter(Mandatory = $true)]
        [string]$LegacyPath
    )

    if ($LegacyPath -match "^/api/(.*)$") {
        return "$(Get-AppApiPrefix -App $App)/$($Matches[1])"
    }
    return $LegacyPath
}

function Resolve-AppApiUrl {
    param(
        [Parameter(Mandatory = $true)]
        $App,
        [Parameter(Mandatory = $true)]
        [string]$LegacyPath
    )

    $apiPath = Convert-LegacyApiPath -App $App -LegacyPath $LegacyPath
    return "$($App.apiUrl)$apiPath"
}

function Get-ResultsDir {
    param(
        [Parameter(Mandatory = $true)]
        [string]$AppName
    )

    $dir = Join-Path (Get-PipelineRoot) "results\$AppName"
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    return $dir
}

function Get-SonarSources {
    param(
        [Parameter(Mandatory = $true)]
        $App,
        [Parameter(Mandatory = $true)]
        [string]$AppRoot
    )

    switch ($App.stack) {
        "nextjs" { return "src" }
        "astro" { return "src" }
        "fastapi" { return "backend,frontend/src" }
        default { throw "Unknown stack: $($App.stack)" }
    }
}

function Get-SonarExclusions {
    return @(
        "node_modules/**",
        ".next/**",
        "dist/**",
        "build/**",
        ".astro/**",
        "prisma/migrations/**",
        "**/*.lock",
        "coverage/**",
        ".venv/**",
        "venv/**",
        "__pycache__/**"
    ) -join ","
}

function Get-PackageLockPaths {
    param(
        [Parameter(Mandatory = $true)]
        $App,
        [Parameter(Mandatory = $true)]
        [string]$AppRoot
    )

    switch ($App.stack) {
        "fastapi" {
            $path = Join-Path $AppRoot "frontend\package-lock.json"
            if (Test-Path $path) { return @($path) }
            return @()
        }
        default {
            $path = Join-Path $AppRoot "package-lock.json"
            if (Test-Path $path) { return @($path) }
            return @()
        }
    }
}

function Get-RequirementsPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$AppRoot
    )

    $path = Join-Path $AppRoot "backend\requirements.txt"
    if (Test-Path $path) { return $path }
    return $null
}

function Get-EnvFile {
    $path = Join-Path (Get-PipelineRoot) "config\.env"
    return $path
}

function Read-EnvValue {
    param([string]$Key)

    $envPath = Get-EnvFile
    if (-not (Test-Path $envPath)) { return $null }
    foreach ($line in Get-Content $envPath) {
        if ($line -match "^\s*#") { continue }
        if ($line -match "^\s*$Key\s*=\s*(.+)\s*$") {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
    return $null
}

