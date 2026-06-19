#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$AppName
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "..\lib\AppManifest.ps1")

$app = Get-AppEntry -AppName $AppName
$appRoot = Get-AppRoot -App $app
$manualDir = Join-Path (Get-ResultsDir -AppName $AppName) "manual"
New-Item -ItemType Directory -Path $manualDir -Force | Out-Null

$patterns = @(
    "/admin",
    "/api/admin",
    "/api/auth/login",
    "/api/search",
    "/search",
    "/api/invoices",
    "/api/checkout",
    "/checkout",
    "/api/profile",
    "/profile",
    "/api/reviews",
    "/api/admin/logs",
    "/api/admin/events",
    "/api/admin/products/import"
)

$found = @()
$searchRoots = switch ($app.stack) {
    "fastapi" { @((Join-Path $appRoot "backend"), (Join-Path $appRoot "frontend\src")) }
    default { @(Join-Path $appRoot "src") }
}

foreach ($root in $searchRoots) {
    if (-not (Test-Path $root)) { continue }
    $files = Get-ChildItem -Path $root -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.py,*.astro -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        try {
            $content = [System.IO.File]::ReadAllText($file.FullName)
        }
        catch {
            continue
        }
        if (-not $content) { continue }
        foreach ($p in $patterns) {
            if ($content -match [regex]::Escape($p)) {
                $found += [PSCustomObject]@{ path = $p; file = $file.FullName.Replace($appRoot, "") }
            }
        }
    }
}

$endpoints = @{
    app = $app.name
    discoveredAt = (Get-Date).ToString("o")
    candidates = ($found | Select-Object path -Unique).path
    details = $found | Select-Object path, file -Unique
    defaults = @{
        admin = @("/admin", "/admin/users", "/api/admin/users")
        search = @("/search", "/catalog", "/api/search", "/api/products/search")
        invoice = @("/api/invoices/1/pdf", "/api/orders/1/invoice", "/api/invoices/download")
        checkout = @("/api/checkout", "/checkout", "/api/orders")
        audit = @("/admin/audit", "/api/admin/logs", "/api/admin/events")
        csvImport = @("/api/admin/products/import", "/api/admin/products/import-csv")
        profile = @("/profile", "/api/profile")
    }
}

$endpoints | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $manualDir "endpoints.json") -Encoding UTF8
Write-Host "Discovered $($endpoints.candidates.Count) endpoint candidates for $($app.name)"
