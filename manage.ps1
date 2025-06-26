# Windows Service Management Script for Logistics System
# Usage: .\manage.ps1 [action] [service]
# Actions: start, stop, restart, status
# Services: backend, admin, frontend, all

param(
    [string]$Action = "status",
    [string]$Service = "all"
)

# Configuration
$BACKEND_PORT = 3000
$ADMIN_PORT = 3001
$FRONTEND_PORT = 3002
$PID_DIR = "pids"
$LOG_DIR = "logs"

# Create directories if they don't exist
if (!(Test-Path $PID_DIR)) { New-Item -ItemType Directory -Path $PID_DIR -Force | Out-Null }
if (!(Test-Path $LOG_DIR)) { New-Item -ItemType Directory -Path $LOG_DIR -Force | Out-Null }

# Color functions
function Write-Info { param([string]$msg) Write-Host "[INFO] $msg" -ForegroundColor Blue }
function Write-Success { param([string]$msg) Write-Host "[SUCCESS] $msg" -ForegroundColor Green }
function Write-Warning { param([string]$msg) Write-Host "[WARNING] $msg" -ForegroundColor Yellow }
function Write-Error { param([string]$msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }

# Check if port is in use
function Test-PortInUse {
    param([int]$Port)
    $result = netstat -ano | Select-String ":$Port\s"
    return $result.Count -gt 0
}

# Kill processes on port
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($connections) {
            $processPids = $connections | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique
            foreach ($processPid in $processPids) {
                Stop-Process -Id $processPid -Force -ErrorAction SilentlyContinue
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
            Start-Sleep -Seconds 2
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
    $port = switch ($ServiceName) {
        "backend" { 3000 }
        "admin" { 3001 }
        "frontend" { 3002 }
    }
    
    $servicePid = Get-ServicePID $ServiceName
    if ($servicePid) {
        return @{ Status = "Running"; Color = "Green"; Details = "PID: $servicePid, Port: $port" }
    }
    elseif (Test-PortInUse $port) {
        return @{ Status = "Abnormal"; Color = "Yellow"; Details = "Port: $port in use, no PID file" }
    }
    else {
        return @{ Status = "Stopped"; Color = "Red"; Details = "Port: $port free" }
    }
}

# Install dependencies
function Install-Dependencies {
    param([string]$ServiceName)
    $serviceDir = switch ($ServiceName) {
        "backend" { "backend-node" }
        "admin" { "admin-frontend" }
        "frontend" { "frontend" }
    }
    
    if (!(Test-Path $serviceDir)) {
        Write-Error "Directory $serviceDir not found"
        return $false
    }
    
    Push-Location $serviceDir
    try {
        if (!(Test-Path "node_modules")) {
            Write-Info "Installing dependencies for $ServiceName..."
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Failed to install dependencies for $ServiceName"
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
        Write-Warning "Port $BACKEND_PORT is in use, cleaning up..."
        Stop-ProcessOnPort $BACKEND_PORT
    }
    
    if (!(Install-Dependencies "backend")) { return $false }
    
    Push-Location "backend-node"
    try {
        $env:PORT = $BACKEND_PORT
        $logFile = Join-Path ".." (Join-Path $LOG_DIR "backend.log")
        $errorLogFile = Join-Path ".." (Join-Path $LOG_DIR "backend.error.log")
        
        # Start backend service in current directory (already in backend-node)
        Write-Info "Starting backend in: $(Get-Location)"
        $process = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "`$env:PORT=$BACKEND_PORT; node dist/main.js" -PassThru
        
        if ($process) {
            $process.Id | Out-File -FilePath (Join-Path ".." (Join-Path $PID_DIR "backend.pid"))
            # Wait longer and check multiple times
            for ($i = 0; $i -lt 15; $i++) {
                Start-Sleep -Seconds 1
                if (Test-PortInUse $BACKEND_PORT) {
                    Write-Success "Backend service started successfully (PID: $($process.Id), Port: $BACKEND_PORT)"
                    return $true
                }
                if ($process.HasExited) {
                    Write-Error "Backend service process exited"
                    Remove-Item (Join-Path ".." (Join-Path $PID_DIR "backend.pid")) -Force -ErrorAction SilentlyContinue
                    return $false
                }
            }
            Write-Warning "Backend service is starting in background (PID: $($process.Id))"
            return $true
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
        Write-Warning "Port $ADMIN_PORT is in use, cleaning up..."
        Stop-ProcessOnPort $ADMIN_PORT
    }
    
    if (!(Install-Dependencies "admin")) { return $false }
    
    Push-Location "admin-frontend"
    try {
        $env:PORT = $ADMIN_PORT
        $logFile = Join-Path ".." (Join-Path $LOG_DIR "admin.log")
        $errorLogFile = Join-Path ".." (Join-Path $LOG_DIR "admin.error.log")
        
        # Start admin service in current directory (already in admin-frontend)
        Write-Info "Starting admin in: $(Get-Location)"
        $process = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "`$env:PORT=$ADMIN_PORT; npm run dev" -PassThru
        
        if ($process) {
            $process.Id | Out-File -FilePath (Join-Path ".." (Join-Path $PID_DIR "admin.pid"))
            
            for ($i = 0; $i -lt 20; $i++) {
                Start-Sleep -Seconds 1
                if ($process.HasExited) {
                    Write-Error "Admin service process exited"
                    Remove-Item (Join-Path ".." (Join-Path $PID_DIR "admin.pid")) -Force -ErrorAction SilentlyContinue
                    return $false
                }
                if (Test-PortInUse $ADMIN_PORT) {
                    Write-Success "Admin service started successfully (PID: $($process.Id), Port: $ADMIN_PORT)"
                    return $true
                }
            }
            
            Write-Error "Admin service failed to start (timeout)"
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            Remove-Item (Join-Path ".." (Join-Path $PID_DIR "admin.pid")) -Force -ErrorAction SilentlyContinue
        }
        return $false
    }
    finally {
        Pop-Location
    }
}

# Start frontend service
function Start-Frontend {
    Write-Info "Starting frontend service..."
    
    if (Test-PortInUse $FRONTEND_PORT) {
        Write-Warning "Port $FRONTEND_PORT is in use, cleaning up..."
        Stop-ProcessOnPort $FRONTEND_PORT
    }
    
    if (!(Install-Dependencies "frontend")) { return $false }
    
    Push-Location "frontend"
    try {
        $env:PORT = $FRONTEND_PORT
        $logFile = Join-Path ".." (Join-Path $LOG_DIR "frontend.log")
        $errorLogFile = Join-Path ".." (Join-Path $LOG_DIR "frontend.error.log")
        
        # Start frontend service in current directory (already in frontend)
        Write-Info "Starting frontend in: $(Get-Location)"
        $process = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "`$env:PORT=$FRONTEND_PORT; npm run dev" -PassThru
        
        if ($process) {
            $process.Id | Out-File -FilePath (Join-Path ".." (Join-Path $PID_DIR "frontend.pid"))
            
            for ($i = 0; $i -lt 20; $i++) {
                Start-Sleep -Seconds 1
                if ($process.HasExited) {
                    Write-Error "Frontend service process exited"
                    Remove-Item (Join-Path ".." (Join-Path $PID_DIR "frontend.pid")) -Force -ErrorAction SilentlyContinue
                    return $false
                }
                if (Test-PortInUse $FRONTEND_PORT) {
                    Write-Success "Frontend service started successfully (PID: $($process.Id), Port: $FRONTEND_PORT)"
                    return $true
                }
            }
            
            Write-Error "Frontend service failed to start (timeout)"
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            Remove-Item (Join-Path ".." (Join-Path $PID_DIR "frontend.pid")) -Force -ErrorAction SilentlyContinue
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
    $port = switch ($ServiceName) {
        "backend" { 3000 }
        "admin" { 3001 }
        "frontend" { 3002 }
    }
    
    Write-Info "Stopping $ServiceName service..."
    
    $servicePid = Get-ServicePID $ServiceName
    if ($servicePid) {
        Stop-Process -Id $servicePid -Force -ErrorAction SilentlyContinue
        Remove-Item (Join-Path $PID_DIR "$ServiceName.pid") -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    if (Test-PortInUse $port) {
        Stop-ProcessOnPort $port
    }
    
    Write-Success "$ServiceName service stopped"
}

# Show status
function Show-Status {
    Write-Host ""
    Write-Host "=== Service Status ===" -ForegroundColor Cyan
    Write-Host ""
    
    $services = @("backend", "admin", "frontend")
    foreach ($svc in $services) {
        $status = Get-ServiceStatus $svc
        Write-Host "$svc service: " -NoNewline
        Write-Host "$($status.Status) ($($status.Details))" -ForegroundColor $status.Color
    }
    
    Write-Host ""
    Write-Host "=== Port Status ===" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($port in @(3000, 3001, 3002)) {
        Write-Host "Port $port : " -NoNewline
        if (Test-PortInUse $port) {
            Write-Host "In Use" -ForegroundColor Green
        }
        else {
            Write-Host "Free" -ForegroundColor Red
        }
    }
    Write-Host ""
}

# Show usage
function Show-Usage {
    Write-Host ""
    Write-Host "Logistics System - Windows Service Manager" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\manage.ps1 [action] [service]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Yellow
    Write-Host "  start    - Start service"
    Write-Host "  stop     - Stop service"
    Write-Host "  restart  - Restart service"
    Write-Host "  status   - Show service status"
    Write-Host ""
    Write-Host "Services:" -ForegroundColor Yellow
    Write-Host "  backend   - Backend service (NestJS, port $BACKEND_PORT)"
    Write-Host "  admin     - Admin dashboard (Next.js, port $ADMIN_PORT)"
    Write-Host "  frontend  - Frontend app (Next.js, port $FRONTEND_PORT)"
    Write-Host "  all       - All services (default)"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\manage.ps1 start all"
    Write-Host "  .\manage.ps1 stop backend"
    Write-Host "  .\manage.ps1 restart admin"
    Write-Host "  .\manage.ps1 status"
    Write-Host ""
}

# Main execution
$validActions = @("start", "stop", "restart", "status")
$validServices = @("backend", "admin", "frontend", "all")

if ($Action -notin $validActions -or $Service -notin $validServices) {
    Show-Usage
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Logistics System - Service Manager" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

switch ($Action) {
    "status" {
        Show-Status
    }
    "start" {
        if ($Service -eq "all") {
            Start-Backend
            Start-Admin
            Start-Frontend
            Write-Host ""
            Show-Status
        }
        else {
            switch ($Service) {
                "backend" { Start-Backend }
                "admin" { Start-Admin }
                "frontend" { Start-Frontend }
            }
        }
    }
    "stop" {
        if ($Service -eq "all") {
            Stop-MyService "frontend"
            Stop-MyService "admin"
            Stop-MyService "backend"
            Write-Host ""
            Show-Status
        }
        else {
            Stop-MyService $Service
        }
    }
    "restart" {
        if ($Service -eq "all") {
            Write-Info "Restarting all services..."
            Stop-MyService "frontend"
            Stop-MyService "admin"
            Stop-MyService "backend"
            Start-Sleep -Seconds 3
            
            Start-Backend
            Start-Sleep -Seconds 2
            Start-Admin
            Start-Sleep -Seconds 2
            Start-Frontend
            
            Write-Host ""
            Show-Status
        }
        else {
            Write-Info "Restarting $Service service..."
            Stop-MyService $Service
            Start-Sleep -Seconds 2
            switch ($Service) {
                "backend" { Start-Backend }
                "admin" { Start-Admin }
                "frontend" { Start-Frontend }
            }
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Operation completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan 