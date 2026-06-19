#Requires -Version 5.1
# Resolves and caches the absolute path to Génération_Code_Application (UTF-8 safe).
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\AppManifest.ps1")

$root = Get-AppsRoot
Write-Host "Apps root: $root"
$count = ([System.IO.Directory]::EnumerateDirectories($root) | Measure-Object).Count
Write-Host "Found $count application folders."
