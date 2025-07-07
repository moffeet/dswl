# Logistics System - Windows Service Manager (Simplified)
# Usage: .\manage.ps1 <action> [service]
# Examples: .\manage.ps1 start all | .\manage.ps1 stop backend | .\manage.ps1 status

param(
    [string]$Action = "status",
    [string]$Service = "all"
)

# Configuration
$BACKEND_PORT = 3000
$ADMIN_PORT = 3001
$PID_DIR = "pids"
$LOG_DIR = "logs"

# Create directories
if (!(Test-Path $PID_DIR)) { New-Item -ItemType Directory -Path $PID_DIR -Force | Out-Null }
if (!(Test-Path $LOG_DIR)) { New-Item -ItemType Directory -Path $LOG_DIR -Force | Out-Null }

# Helper functions
function Write-Info { param([string]$msg) Write-Host "[INFO] $msg" -ForegroundColor Blue }
function Write-Success { param([string]$msg) Write-Host "[SUCCESS] $msg" -ForegroundColor Green }
function Write-Warning { param([string]$msg) Write-Host "[WARNING] $msg" -ForegroundColor Yellow }
function Write-Error { param([string]$msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }

# Check if port is in use
function Test-PortInUse {
    param([int]$Port)
    try {
        $result = netstat -ano | Select-String ":$Port\s"
        return $result.Count -gt 0
    }
    catch { return $false }
}

# Kill processes on port
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($connections) {
            $processPids = $connections | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique
            foreach ($processPid in $processPids) {
                taskkill /PID $processPid /F 2>$null | Out-Null
            }
            Start-Sleep -Seconds 2
        }
    }
    catch {
        $netstatResult = netstat -ano | findstr ":$Port"
        if ($netstatResult) {
            $processPids = $netstatResult | ForEach-Object {
                if ($_ -match '\s+(\d+)$') { $matches[1] }
            } | Sort-Object -Unique
            foreach ($processPid in $processPids) {
                taskkill /PID $processPid /F 2>$null | Out-Null
            }
        }
    }
}

# Get service PID
function Get-ServicePID {
    param([string]$ServiceName)
    $pidFile = Join-Path $PID_DIR "$ServiceName.pid"
    if (Test-Path $pidFile) {
        try {
            $servicePid = [int](Get-Content $pidFile)
            if (Get-Process -Id $servicePid -ErrorAction SilentlyContinue) {
                return $servicePid
            }
            else {
                Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
            }
        }
        catch {
            Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
        }
    }
    return $null
}

# Check service status
function Get-ServiceStatus {
    param([string]$ServiceName)
    $port = if ($ServiceName -eq "backend") { 3000 } else { 3001 }
    $servicePid = Get-ServicePID $ServiceName

    if ($servicePid) {
        return @{ Status = "Running"; Color = "Green"; Details = "PID: $servicePid" }
    }
    elseif (Test-PortInUse $port) {
        return @{ Status = "Abnormal"; Color = "Yellow"; Details = "Port in use, no PID" }
    }
    else {
        return @{ Status = "Stopped"; Color = "Red"; Details = "Not running" }
    }
}

# Install dependencies
function Install-Dependencies {
    param([string]$ServiceName)
    $dir = if ($ServiceName -eq "backend") { "backend-node" } else { "admin-frontend" }
    
    if (!(Test-Path $dir)) {
        Write-Error "Directory $dir not found"
        return $false
    }
    
    Push-Location $dir
    try {
        if (!(Test-Path "node_modules")) {
            Write-Info "Installing dependencies for $ServiceName..."
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Failed to install dependencies"
                return $false
            }
        }
        return $true
    }
    finally {
        Pop-Location
    }
}

# Start backend service
function Start-Backend {
    Write-Info "Starting backend service..."
    
    if (Test-PortInUse $BACKEND_PORT) {
        Write-Warning "Port $BACKEND_PORT in use, cleaning up..."
        Stop-ProcessOnPort $BACKEND_PORT
    }
    
    if (!(Install-Dependencies "backend")) { return $false }
    
    Push-Location "backend-node"
    try {
        $env:PORT = $BACKEND_PORT
        $process = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "`$env:PORT=$BACKEND_PORT; npm run start:dev" -PassThru
        
        if ($process) {
            $process.Id | Out-File -FilePath (Join-Path ".." (Join-Path $PID_DIR "backend.pid"))
            Start-Sleep -Seconds 3
            
            if (-not $process.HasExited -and (Test-PortInUse $BACKEND_PORT)) {
                Write-Success "Backend started (PID: $($process.Id))"
                return $true
            }
            else {
                Write-Error "Backend startup failed"
                if (-not $process.HasExited) { $process.Kill() }
                Remove-Item (Join-Path ".." (Join-Path $PID_DIR "backend.pid")) -Force -ErrorAction SilentlyContinue
            }
        }
        return $false
    }
    finally {
        Pop-Location
    }
}

# Start admin service
function Start-Admin {
    Write-Info "Starting admin service..."
    
    if (Test-PortInUse $ADMIN_PORT) {
        Write-Warning "Port $ADMIN_PORT in use, cleaning up..."
        Stop-ProcessOnPort $ADMIN_PORT
    }
    
    if (!(Install-Dependencies "admin")) { return $false }
    
    Push-Location "admin-frontend"
    try {
        $env:PORT = $ADMIN_PORT
        $process = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "`$env:PORT=$ADMIN_PORT; npm run dev -- --port $ADMIN_PORT" -PassThru
        
        if ($process) {
            $process.Id | Out-File -FilePath (Join-Path ".." (Join-Path $PID_DIR "admin.pid"))
            
            for ($i = 0; $i -lt 15; $i++) {
                Start-Sleep -Seconds 1
                if ($process.HasExited) {
                    Write-Error "Admin process exited"
                    Remove-Item (Join-Path ".." (Join-Path $PID_DIR "admin.pid")) -Force -ErrorAction SilentlyContinue
                    return $false
                }
                if (Test-PortInUse $ADMIN_PORT) {
                    Write-Success "Admin started (PID: $($process.Id))"
                    return $true
                }
            }
            
            Write-Error "Admin startup timeout"
            if (-not $process.HasExited) { $process.Kill() }
            Remove-Item (Join-Path ".." (Join-Path $PID_DIR "admin.pid")) -Force -ErrorAction SilentlyContinue
        }
        return $false
    }
    finally {
        Pop-Location
    }
}

# Stop service
function Stop-MyService {
    param([string]$ServiceName)
    $port = if ($ServiceName -eq "backend") { 3000 } else { 3001 }

    Write-Info "Stopping $ServiceName..."

    $servicePid = Get-ServicePID $ServiceName
    if ($servicePid) {
        taskkill /PID $servicePid /F 2>$null | Out-Null
        Remove-Item (Join-Path $PID_DIR "$ServiceName.pid") -Force -ErrorAction SilentlyContinue
    }

    if (Test-PortInUse $port) {
        Stop-ProcessOnPort $port
    }

    Write-Success "$ServiceName stopped"
}

# Show status
function Show-Status {
    Write-Host "`n=== Service Status ===" -ForegroundColor Cyan
    
    foreach ($svc in @("backend", "admin")) {
        $status = Get-ServiceStatus $svc
        $name = if ($svc -eq "backend") { "Backend (NestJS)" } else { "Admin (Next.js)" }
        Write-Host "$name : " -NoNewline
        Write-Host "$($status.Status) ($($status.Details))" -ForegroundColor $status.Color
    }
    
    Write-Host "`n=== Port Status ===" -ForegroundColor Cyan
    foreach ($port in @(3000, 3001)) {
        $status = if (Test-PortInUse $port) { "In Use" } else { "Free" }
        $color = if (Test-PortInUse $port) { "Green" } else { "Red" }
        Write-Host "Port $port : $status" -ForegroundColor $color
    }
    Write-Host ""
}

# Validate parameters
$validActions = @("start", "stop", "restart", "status")
$validServices = @("backend", "admin", "all")

if ($Action -notin $validActions -or $Service -notin $validServices) {
    Write-Host "Usage: .\manage.ps1 <action> [service]" -ForegroundColor Yellow
    Write-Host "Actions: start, stop, restart, status" -ForegroundColor Yellow
    Write-Host "Services: backend, admin, all" -ForegroundColor Yellow
    exit 1
}

Write-Host "=== Logistics System Manager ===" -ForegroundColor Cyan

# Execute action
switch ($Action) {
    "status" { Show-Status }
    "start" {
        if ($Service -eq "all") {
            Start-Backend; Start-Admin; Show-Status
        } else {
            if ($Service -eq "backend") { Start-Backend } else { Start-Admin }
        }
    }
    "stop" {
        if ($Service -eq "all") {
            Stop-MyService "admin"; Stop-MyService "backend"; Show-Status
        } else {
            Stop-MyService $Service
        }
    }
    "restart" {
        if ($Service -eq "all") {
            Write-Info "Restarting all services..."
            Stop-MyService "admin"; Stop-MyService "backend"
            Start-Sleep -Seconds 2
            Start-Backend; Start-Admin
            Show-Status
        } else {
            Write-Info "Restarting $Service..."
            Stop-MyService $Service
            Start-Sleep -Seconds 2
            if ($Service -eq "backend") { Start-Backend } else { Start-Admin }
        }
    }
}

Write-Host "=== Operation completed! ===" -ForegroundColor Green
