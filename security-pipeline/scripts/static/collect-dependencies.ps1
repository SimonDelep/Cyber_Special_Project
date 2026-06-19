#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$AppName
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "..\lib\AppManifest.ps1")

function Get-NpmInventoryFromLock {
    param([string]$LockPath)

    $lockDir = Split-Path $LockPath -Parent
    $lockName = Split-Path $LockPath -Leaf
    $nodeScript = @"
const lock = require('./$lockName');
const items = [];
if (lock.packages) {
  for (const [pkgPath, pkg] of Object.entries(lock.packages)) {
    if (!pkg || !pkg.version) continue;
    let name = pkgPath === '' ? lock.name : pkgPath.replace(/^node_modules\//, '').replace(/.*\/node_modules\//, '');
    if (!name) continue;
    items.push({ ecosystem: 'npm', name, version: pkg.version, resolved: pkg.resolved || null, dev: !!pkg.dev });
  }
}
console.log(JSON.stringify(items));
"@

    Push-Location $lockDir
    try {
        $output = node -e $nodeScript
        if (-not $output) { return @() }
        return @($output | ConvertFrom-Json)
    }
    catch {
        Write-Warning "Could not parse $LockPath with node: $_"
        return @(Get-NpmInventoryFromPackageJson -LockPath $LockPath)
    }
    finally {
        Pop-Location
    }
}

function Get-NpmInventoryFromPackageJson {
    param([string]$LockPath)
    $pkgPath = Join-Path (Split-Path $LockPath) "package.json"
    if (-not (Test-Path $pkgPath)) { return @() }
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    $items = @()
    foreach ($section in @("dependencies", "devDependencies")) {
        $deps = $pkg.$section
        if (-not $deps) { continue }
        foreach ($prop in $deps.PSObject.Properties) {
            $items += [PSCustomObject]@{
                ecosystem = "npm"
                name = $prop.Name
                version = $prop.Value
                resolved = $null
                dev = ($section -eq "devDependencies")
            }
        }
    }
    return $items
}

function Get-PipInventoryFromRequirements {
    param([string]$ReqPath)

    $items = @()
    foreach ($line in Get-Content $ReqPath) {
        $line = $line.Trim()
        if (-not $line -or $line.StartsWith("#")) { continue }
        if ($line -match "^([A-Za-z0-9_\-\.]+)(\[.*\])?\s*([=<>!~]+)\s*(.+)$") {
            $items += [PSCustomObject]@{
                ecosystem = "pip"
                name = $Matches[1]
                version = $Matches[4].Trim()
                resolved = $null
                dev = $false
            }
        }
        elseif ($line -match "^([A-Za-z0-9_\-\.]+)$") {
            $items += [PSCustomObject]@{
                ecosystem = "pip"
                name = $Matches[1]
                version = "*"
                resolved = $null
                dev = $false
            }
        }
    }
    return $items
}

$app = Get-AppEntry -AppName $AppName
$appRoot = Get-AppRoot -App $app
$resultsDir = Get-ResultsDir -AppName $AppName
$depDir = Join-Path $resultsDir "dependencies"
New-Item -ItemType Directory -Path $depDir -Force | Out-Null

$inventory = @()
foreach ($lockPath in (Get-PackageLockPaths -App $app -AppRoot $appRoot)) {
    $inventory += Get-NpmInventoryFromLock -LockPath $lockPath
}

$reqPath = Get-RequirementsPath -AppRoot $appRoot
if ($reqPath) {
    $inventory += Get-PipInventoryFromRequirements -ReqPath $reqPath
}

$inventory = $inventory | Sort-Object ecosystem, name, version -Unique

$payload = @{
    app = $app.name
    stack = $app.stack
    collectedAt = (Get-Date).ToString("o")
    packageCount = $inventory.Count
    packages = $inventory
}

$payload | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $depDir "inventory.json") -Encoding UTF8
$inventory | Export-Csv (Join-Path $depDir "inventory.csv") -NoTypeInformation -Encoding UTF8

# Append to corpus-wide master inventory
$masterPath = Join-Path (Get-PipelineRoot) "results\a06-master-inventory.csv"
$masterRows = $inventory | ForEach-Object {
    [PSCustomObject]@{
        app = $app.name
        ecosystem = $_.ecosystem
        name = $_.name
        version = $_.version
        dev = $_.dev
    }
}
if (Test-Path $masterPath) {
    $masterRows | Export-Csv $masterPath -NoTypeInformation -Append -Encoding UTF8
}
else {
    New-Item -ItemType Directory -Path (Split-Path $masterPath) -Force | Out-Null
    $masterRows | Export-Csv $masterPath -NoTypeInformation -Encoding UTF8
}

Write-Host "Collected $($inventory.Count) dependencies for $($app.name)"
