$ErrorActionPreference = "Stop"

Write-Host "=== Private Messenger Launcher ===" -ForegroundColor Cyan

$backendDir = Join-Path $PSScriptRoot "backend"
$frontendDir = Join-Path $PSScriptRoot "frontend"

Write-Host "`n[1/3] Setting up backend..." -ForegroundColor Yellow

Set-Location -Path $backendDir

$needsSetup = $false
if (-not (Test-Path ".venv")) {
    Write-Host "  Creating virtual environment..." -ForegroundColor Gray
    python -m venv .venv
    $needsSetup = $true
} else {
    Write-Host "  Virtual environment found, checking dependencies..." -ForegroundColor Gray
    $venvPython = Join-Path $PSScriptRoot "backend\.venv\Scripts\python.exe"
    $pkgs = & $venvPython -m pip freeze 2>$null | ForEach-Object { $_.Split('==')[0].ToLower() }
    $required = @("fastapi", "sqlalchemy", "aiosqlite", "pydantic", "cryptography", "uvicorn")
    $missing = $required | Where-Object { $pkgs -notcontains $_ }
    if ($missing.Count -gt 0) {
        Write-Host "  Missing packages: $($missing -join ', ')" -ForegroundColor Gray
        $needsSetup = $true
    }
}

if ($needsSetup) {
    Write-Host "  Activating venv and installing dependencies..." -ForegroundColor Gray
    & ".venv\Scripts\Activate.ps1"
    pip install -r requirements.txt --quiet
}

if (-not (Test-Path "keys")) {
    New-Item -ItemType Directory -Path "keys" | Out-Null
}

$venvPython = Join-Path $backendDir ".venv\Scripts\python.exe"
if (-not (Test-Path "private_messenger.db")) {
    Write-Host "  Seeding database..." -ForegroundColor Gray
    & $venvPython seed.py
}

Write-Host "  Starting backend server on :8000..." -ForegroundColor Green
$backendVenvActivate = Join-Path $backendDir ".venv\Scripts\Activate.ps1"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; & '$backendVenvActivate'; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

Write-Host "`n[2/3] Setting up frontend..." -ForegroundColor Yellow

Set-Location -Path $frontendDir

if (-not (Test-Path "node_modules")) {
    Write-Host "  Installing npm dependencies..." -ForegroundColor Gray
    npm install
}

Write-Host "  Starting frontend on :5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev -- --host"

Write-Host "`n[3/3] Done!" -ForegroundColor Cyan
Write-Host "  Backend: http://localhost:8000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "`nClosing this window won't stop the servers." -ForegroundColor Gray
Write-Host "Close the backend/frontend terminal windows to stop them.`n" -ForegroundColor Gray
