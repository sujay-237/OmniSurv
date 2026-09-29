# ==============================================================================
# OmniSurv Forensics Platform - Unified Launcher (SIH2026)
# Starts FastAPI Backend (Port 8000) and TanStack/Vite Frontend (Port 5173)
# ==============================================================================

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   OMNISURV: Unified Vendor-Agnostic DVR/NVR Forensic Platform   " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$WorkspaceRoot = $PSScriptRoot

# 1. Start FastAPI Backend in background
Write-Host "[1/2] Starting Forensic FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
$BackendJob = Start-Process python -ArgumentList "-m uvicorn app.main:app --port 8000 --host 127.0.0.1 --reload" -WorkingDirectory "$WorkspaceRoot\omnisurv backened" -PassThru

Start-Sleep -Seconds 3

# 2. Start Frontend Dev Server
Write-Host "[2/2] Starting OmniSurv Frontend on http://localhost:5173..." -ForegroundColor Green
Set-Location "$WorkspaceRoot\pixel-perfect-render-5182"
npm run dev

# Cleanup when frontend exits
Stop-Process -Id $BackendJob.Id -ErrorAction SilentlyContinue
