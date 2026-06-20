# PureRoots — start database, API, and frontend (Windows PowerShell)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "Starting PostgreSQL..." -ForegroundColor Cyan
Set-Location $Root
docker compose up -d db

Write-Host "Starting API on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    & .\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000
} -ArgumentList (Join-Path $Root "backend")

Start-Sleep -Seconds 3

Write-Host "Starting frontend on http://localhost:5173 ..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev
} -ArgumentList (Join-Path $Root "frontend")

Write-Host ""
Write-Host "PureRoots is starting:" -ForegroundColor Green
Write-Host "  Site:  http://localhost:5173"
Write-Host "  API:   http://127.0.0.1:8000/docs"
Write-Host ""
Write-Host "Jobs: API (Id $($backendJob.Id)), Frontend (Id $($frontendJob.Id))"
Write-Host "Stop with: Stop-Job $($backendJob.Id),$($frontendJob.Id); Remove-Job $($backendJob.Id),$($frontendJob.Id)"
