#Requires -Version 5.1
<#
  CortIQ Relay - Windows start script
  Checks Docker, then starts the relay on port 3478.
  Usage: powershell -ExecutionPolicy Bypass -File start.ps1

  Requires CORTIQ_API_KEY in .env (copy from CortIQ -> Settings -> API Keys).
#>

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

function Write-Step($msg) { Write-Host "  ==> $msg" -ForegroundColor Cyan }
function Fail($msg) {
    Write-Host ""
    Write-Host "  ERROR: $msg" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "  CortIQ Relay - starting" -ForegroundColor Cyan
Write-Host ""

Write-Step "Checking Docker..."
docker info 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Fail "Docker Desktop is not running. Start it first, then re-run this script."
}
Write-Host "  Docker OK" -ForegroundColor Green

if (-not (Test-Path ".env")) {
    Fail ".env file missing. Copy .env.example and fill in CORTIQ_API_KEY."
}

Write-Step "Starting relay..."
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Fail "docker compose up failed. Check the output above."
}

Write-Host ""
Write-Host "  Relay running on http://localhost:3478" -ForegroundColor Green
Write-Host ""
