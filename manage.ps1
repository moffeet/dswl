# Logistics System - Windows Service Management Script
# Support start, stop, restart and status check
# Usage: .\manage.ps1 <action> <service>
# 
# action: start|stop|restart|status
# service: backend|admin|all
#
# Examples:
#   .\manage.ps1 start all        # Start all services
#   .\manage.ps1 stop backend     # Stop backend service
#   .\manage.ps1 restart admin    # Restart admin service
#   .\manage.ps1 status           # Check all services status

param(
    [string]$Action = "status",
    [string]$Service = "all"
)

# Configuration
$BACKEND_PORT = 3000
$ADMIN_PORT = 3001
$PID_DIR = "pids"
$LOG_DIR = "logs"

# Ensure directories exist
if (!(Test-Path $PID_DIR)) { New-Item -ItemType Directory -Path $PID_DIR -Force | Out-Null }
if (!(Test-Path $LOG_DIR)) { New-Item -ItemType Directory -Path $LOG_DIR -Force | Out-Null }

# Log functions
function Write-Info { param([string]$msg) Write-Host "[INFO] $msg" -ForegroundColor Blue }
function Write-Success { param([string]$msg) Write-Host "[SUCCESS] $msg" -ForegroundColor Green }
function Write-Warning { param([string]$msg) Write-Host "[WARNING] $msg" -ForegroundColor Yellow }
function Write-Error { param([string]$msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Service { param([string]$msg) Write-Host "[SERVICE] $msg" -ForegroundColor Magenta }

# Check if port is in use
function Test-PortInUse {
    param([int]$Port)
    try {
        # Use netstat to detect port (more reliable, supports IPv4 and IPv6)
        $result = netstat -ano | Select-String ":$Port\s"
        if ($result.Count -gt 0) {
            return $true
        }
        
        # Backup method: use Get-NetTCPConnection
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return $connections.Count -gt 0
    }
    catch {
        return $false
    }
}

# Kill processes on specified port
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($connections) {
            $processPids = $connections | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique
            if ($processPids) {
                Write-Warning "Killing processes on port $Port : $($processPids -join ', ')"
                foreach ($processPid in $processPids) {
                    Stop-Process -Id $processPid -Force -ErrorAction SilentlyContinue
                }
                Start-Sleep -Seconds 3
                
                # If there are still processes, force kill
                $remainingConnections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
                if ($remainingConnections) {
                    $remainingPids = $remainingConnections | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique
                    if ($remainingPids) {
                        Write-Warning "Force killing processes on port $Port : $($remainingPids -join ', ')"
                        foreach ($pid in $remainingPids) {
                            taskkill /PID $pid /F 2>$null | Out-Null
                        }
                        Start-Sleep -Seconds 1
                    }
                }
                return $true
            }
        }
    }
    catch {
        # Backup method: use netstat and taskkill
        $netstatResult = netstat -ano | findstr ":$Port"
        if ($netstatResult) {
            $processPids = $netstatResult | ForEach-Object {
                if ($_ -match '\s+(\d+)$') { $matches[1] }
            } | Sort-Object -Unique
            if ($processPids) {
                Write-Warning "Using backup method to kill processes on port $Port : $($processPids -join ', ')"
                foreach ($processPid in $processPids) {
                    taskkill /PID $processPid /F 2>$null | Out-Null
                }
                Start-Sleep -Seconds 2
                return $true
            }
        }
    }
    return $false
}

# Get service PID
function Get-ServicePID {
    param([string]$ServiceName)
    $pidFile = Join-Path $PID_DIR "$ServiceName.pid"
    
    if (Test-Path $pidFile) {
        try {
            $pidContent = Get-Content $pidFile -ErrorAction SilentlyContinue
            if ($pidContent -and $pidContent.Trim() -ne "") {
                $servicePid = [int]$pidContent.Trim()
                # Check if process really exists
                if (Get-Process -Id $servicePid -ErrorAction SilentlyContinue) {
                    return $servicePid
                }
                else {
                    # Wait a bit, process might still be starting
                    Start-Sleep -Seconds 1
                    if (Get-Process -Id $servicePid -ErrorAction SilentlyContinue) {
                        return $servicePid
                    }
                    else {
                        # Confirm process doesn't exist, clean up file
                        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
                    }
                }
            }
            else {
                # PID file is empty, clean up file
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
        default { return $null }
    }
    
    $servicePid = Get-ServicePID $ServiceName
    $portStatus = if (Test-PortInUse $port) { "Port $port in use" } else { "Port $port free" }
    
    if ($servicePid) {
        return @{ Status = "Running"; Color = "Green"; Details = "PID: $servicePid, $portStatus" }
    }
    elseif (Test-PortInUse $port) {
        return @{ Status = "Abnormal"; Color = "Yellow"; Details = "PID file missing, $portStatus" }
    }
    else {
        return @{ Status = "Stopped"; Color = "Red"; Details = "$portStatus" }
    }
}

# Check Node.js version
function Test-NodeVersion {
    try {
        $nodeVersion = node -v
        if (-not $nodeVersion) {
            Write-Error "Node.js not installed! Please install Node.js 18+ version"
            return $false
        }
        
        $versionNumber = $nodeVersion -replace 'v', ''
        $majorVersion = [int]($versionNumber.Split('.')[0])
        
        if ($majorVersion -lt 18) {
            Write-Error "Node.js version too low! Current version: $nodeVersion, need 18.18.0 or higher"
            Write-Info "Please upgrade Node.js version to 18 or higher"
            return $false
        }
        
        return $true
    }
    catch {
        Write-Error "Cannot check Node.js version: $($_.Exception.Message)"
        return $false
    }
}

# Install dependencies
function Install-Dependencies {
    param([string]$ServiceName)
    $serviceDir = switch ($ServiceName) {
        "backend" { "backend-node" }
        "admin" { "admin-frontend" }
        default { return $false }
    }
    
    if (!(Test-Path $serviceDir)) {
        Write-Error "Directory $serviceDir not found"
        return $false
    }
    
    Push-Location $serviceDir
    try {
        if (!(Test-Path "node_modules") -or !(Test-Path "package-lock.json")) {
            Write-Info "Installing dependencies for $ServiceName..."
            if (Test-Path "node_modules") { Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue }
            if (Test-Path "package-lock.json") { Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue }
            
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

# Clean specific service related processes
function Clear-ServiceProcesses {
    param([string]$ServiceName)
    Write-Info "Cleaning $ServiceName related processes..."

    switch ($ServiceName) {
        "backend" {
            # Clean backend related nodemon and ts-node processes
            Get-Process | Where-Object { $_.ProcessName -like "*node*" -and $_.CommandLine -like "*backend-node*nodemon*" } | Stop-Process -Force -ErrorAction SilentlyContinue
            Get-Process | Where-Object { $_.ProcessName -like "*node*" -and $_.CommandLine -like "*backend-node*ts-node*" } | Stop-Process -Force -ErrorAction SilentlyContinue

            # Clean processes that may be listening on port 3000
            try {
                $backendConnections = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
                if ($backendConnections) {
                    $backendPids = $backendConnections | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique
                    foreach ($pid in $backendPids) {
                        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    }
                    Start-Sleep -Seconds 2

                    # Force kill remaining processes
                    $remainingConnections = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
                    if ($remainingConnections) {
                        $remainingPids = $remainingConnections | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique
                        foreach ($pid in $remainingPids) {
                            taskkill /PID $pid /F 2>$null | Out-Null
                        }
                    }
                }
            }
            catch { }
        }
        "admin" {
            # More precisely clean admin related next processes
            Get-Process | Where-Object { $_.ProcessName -like "*node*" -and $_.CommandLine -like "*admin-frontend*next*3001*" } | Stop-Process -Force -ErrorAction SilentlyContinue

            # Clean processes listening on port 3001 but not current PID
            $currentAdminPid = Get-ServicePID "admin"
            try {
                $adminConnections = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
                if ($adminConnections) {
                    $adminPids = $adminConnections | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique
                    foreach ($pid in $adminPids) {
                        if ($pid -ne $currentAdminPid) {
                            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                        }
                    }
                    Start-Sleep -Seconds 1

                    # Force kill remaining processes
                    $remainingConnections = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
                    if ($remainingConnections) {
                        $remainingPids = $remainingConnections | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique
                        foreach ($pid in $remainingPids) {
                            if ($pid -ne $currentAdminPid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
                                taskkill /PID $pid /F 2>$null | Out-Null
                            }
                        }
                    }
                }
            }
            catch { }
        }
    }
    Start-Sleep -Seconds 1
}

# Start backend service
function Start-Backend {
    Write-Service "Starting backend service..."

    # Ensure port variable is set correctly
    $BACKEND_PORT = 3000

    # Clean remaining processes
    Clear-ServiceProcesses "backend"

    if (!(Install-Dependencies "backend")) { return $false }

    if (Test-PortInUse $BACKEND_PORT) {
        Write-Warning "Port $BACKEND_PORT is in use, trying to clean up..."
        Stop-ProcessOnPort $BACKEND_PORT
    }

    Push-Location "backend-node"
    try {
        # Clean all possible port environment variables
        Remove-Item Env:PORT -ErrorAction SilentlyContinue
        Remove-Item Env:ADMIN_PORT -ErrorAction SilentlyContinue
        Remove-Item Env:FRONTEND_PORT -ErrorAction SilentlyContinue

        Write-Info "Backend startup config: PORT=$BACKEND_PORT"

        # Try development mode startup first
        Write-Info "Trying development mode startup..."
        $env:PORT = $BACKEND_PORT
        $logFile = Join-Path ".." (Join-Path $LOG_DIR "backend.log")

        # Start backend service using Start-Process
        Write-Info "Starting backend in: $(Get-Location)"
        $process = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "`$env:PORT=$BACKEND_PORT; npm run start:dev" -PassThru

        if ($process) {
            $process.Id | Out-File -FilePath (Join-Path ".." (Join-Path $PID_DIR "backend.pid"))
            Start-Sleep -Seconds 3  # Reduce wait time, speed up startup

            if (-not $process.HasExited -and (Test-PortInUse $BACKEND_PORT)) {
                Write-Success "Backend service started successfully (dev mode, PID: $($process.Id), port: $BACKEND_PORT)"
                return $true
            }
            else {
                Write-Warning "Development mode startup failed, trying production mode..."
                if (-not $process.HasExited) {
                    $process.Kill()
                }
                Remove-Item (Join-Path ".." (Join-Path $PID_DIR "backend.pid")) -Force -ErrorAction SilentlyContinue
            }
        }

        # Try production mode startup
        Write-Info "Building and starting production mode..."
        $buildResult = & npm run build
        if ($LASTEXITCODE -eq 0) {
            $env:PORT = $BACKEND_PORT

            # Start backend service using Start-Process
            $process = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "`$env:PORT=$BACKEND_PORT; npm start" -PassThru

            if ($process) {
                $process.Id | Out-File -FilePath (Join-Path ".." (Join-Path $PID_DIR "backend.pid"))
                Start-Sleep -Seconds 3  # Reduce wait time, speed up startup

                if (-not $process.HasExited -and (Test-PortInUse $BACKEND_PORT)) {
                    Write-Success "Backend service started successfully (production mode, PID: $($process.Id), port: $BACKEND_PORT)"
                    return $true
                }
                else {
                    Write-Error "Backend service startup failed"
                    if (-not $process.HasExited) {
                        $process.Kill()
                    }
                    Remove-Item (Join-Path ".." (Join-Path $PID_DIR "backend.pid")) -Force -ErrorAction SilentlyContinue
                }
            }
        }
        else {
            Write-Error "Build failed, cannot start backend service"
        }

        return $false
    }
    finally {
        Pop-Location
    }
}

# Start admin service
function Start-Admin {
    Write-Service "Starting admin service..."

    # Ensure port variable is set correctly
    $ADMIN_PORT = 3001

    # Clean remaining processes
    Clear-ServiceProcesses "admin"

    if (!(Install-Dependencies "admin")) { return $false }

    if (Test-PortInUse $ADMIN_PORT) {
        Write-Warning "Port $ADMIN_PORT is in use, trying to clean up..."
        Stop-ProcessOnPort $ADMIN_PORT
    }

    Push-Location "admin-frontend"
    try {
        # Clean possible environment variable interference
        Remove-Item Env:PORT -ErrorAction SilentlyContinue
        Remove-Item Env:BACKEND_PORT -ErrorAction SilentlyContinue
        Remove-Item Env:FRONTEND_PORT -ErrorAction SilentlyContinue

        # Next.js 15 needs explicit port specification
        Write-Info "Startup command: npm run dev -- --port $ADMIN_PORT"
        $env:PORT = $ADMIN_PORT
        $logFile = Join-Path ".." (Join-Path $LOG_DIR "admin.log")

        # Start admin service using Start-Process
        Write-Info "Starting admin in: $(Get-Location)"
        $process = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "`$env:PORT=$ADMIN_PORT; npm run dev -- --port $ADMIN_PORT" -PassThru

        if ($process) {
            $process.Id | Out-File -FilePath (Join-Path ".." (Join-Path $PID_DIR "admin.pid"))

            Write-Info "Waiting for admin service to start... (PID: $($process.Id))"

            # Wait for startup and check multiple times
            $retryCount = 0
            $maxRetries = 20

            while ($retryCount -lt $maxRetries) {
                Start-Sleep -Seconds 1

                # Check if process is still alive
                if ($process.HasExited) {
                    Write-Error "Admin service process $($process.Id) has stopped"
                    Remove-Item (Join-Path ".." (Join-Path $PID_DIR "admin.pid")) -Force -ErrorAction SilentlyContinue
                    return $false
                }

                # Check if port is occupied
                if (Test-PortInUse $ADMIN_PORT) {
                    Write-Success "Admin service started successfully (PID: $($process.Id), port: $ADMIN_PORT)"
                    return $true
                }

                $retryCount++
                Write-Info "Waiting for port $ADMIN_PORT to start... ($retryCount/$maxRetries)"
            }

            Write-Error "Admin service startup failed: timeout"
            if (-not $process.HasExited) {
                $process.Kill()
            }
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
    $port = switch ($ServiceName) {
        "backend" { 3000 }
        "admin" { 3001 }
        default {
            Write-Error "Unknown service: $ServiceName"
            return $false
        }
    }

    Write-Service "Stopping $ServiceName service..."

    $servicePid = Get-ServicePID $ServiceName
    if ($servicePid) {
        Write-Info "Stopping process $servicePid..."
        Stop-Process -Id $servicePid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3

        if (Get-Process -Id $servicePid -ErrorAction SilentlyContinue) {
            Write-Warning "Force stopping process $servicePid"
            taskkill /PID $servicePid /F 2>$null | Out-Null
            Start-Sleep -Seconds 1
        }

        Remove-Item (Join-Path $PID_DIR "$ServiceName.pid") -Force -ErrorAction SilentlyContinue
    }

    # Clean port and related processes
    if (Test-PortInUse $port) {
        Write-Info "Cleaning port $port..."
        Stop-ProcessOnPort $port
    }

    # Additional cleanup for specific services
    Clear-ServiceProcesses $ServiceName

    Write-Success "$ServiceName service stopped"
    return $true
}

# Show usage help
function Show-Usage {
    Write-Host ""
    Write-Host "Logistics System - Windows Service Management Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\manage.ps1 <action> [service]"
    Write-Host ""
    Write-Host "Action types:" -ForegroundColor Yellow
    Write-Host "  start    - Start service"
    Write-Host "  stop     - Stop service"
    Write-Host "  restart  - Restart service"
    Write-Host "  status   - Check service status"
    Write-Host ""
    Write-Host "Service names:" -ForegroundColor Yellow
    Write-Host "  backend   - Backend service (NestJS, port $BACKEND_PORT)"
    Write-Host "  admin     - Admin dashboard (Next.js, port $ADMIN_PORT)"
    Write-Host "  all       - All services (default)"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\manage.ps1 start all          # Start all services"
    Write-Host "  .\manage.ps1 stop backend       # Stop backend service"
    Write-Host "  .\manage.ps1 restart admin      # Restart admin dashboard"
    Write-Host "  .\manage.ps1 status             # Check all services status"
    Write-Host ""
    Write-Host "Access URLs:" -ForegroundColor Yellow
    Write-Host "  Backend API:     http://localhost:$BACKEND_PORT"
    Write-Host "  API Docs:        http://localhost:$BACKEND_PORT/api"
    Write-Host "  Admin Dashboard: http://localhost:$ADMIN_PORT"
    Write-Host ""
}

# Show service status
function Show-Status {
    Write-Host ""
    Write-Host "=== Service Status ===" -ForegroundColor Cyan
    Write-Host ""

    $services = @("backend", "admin")
    foreach ($svc in $services) {
        $status = Get-ServiceStatus $svc
        $serviceName = switch ($svc) {
            "backend" { "Backend Service (NestJS)" }
            "admin" { "Admin Dashboard (Next.js)" }
        }
        Write-Host "$serviceName : " -NoNewline
        Write-Host "$($status.Status) ($($status.Details))" -ForegroundColor $status.Color
    }

    Write-Host ""
    Write-Host "=== Port Usage ===" -ForegroundColor Cyan
    Write-Host ""

    foreach ($port in @(3000, 3001)) {
        Write-Host "Port $port : " -NoNewline
        if (Test-PortInUse $port) {
            try {
                $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
                if ($connections) {
                    $pids = $connections | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique
                    Write-Host "In Use (PID: $($pids -join ', '))" -ForegroundColor Green
                }
                else {
                    Write-Host "In Use" -ForegroundColor Green
                }
            }
            catch {
                Write-Host "In Use" -ForegroundColor Green
            }
        }
        else {
            Write-Host "Free" -ForegroundColor Red
        }
    }
    Write-Host ""
}

# Main execution
$validActions = @("start", "stop", "restart", "status")
$validServices = @("backend", "admin", "all")

# Check parameters
if (-not $Action) {
    Show-Usage
    exit 1
}

# Validate action type
if ($Action -notin $validActions) {
    Write-Error "Unknown action: $Action"
    Show-Usage
    exit 1
}

# Validate service name
if ($Service -notin $validServices) {
    Write-Error "Unknown service: $Service"
    Show-Usage
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Logistics System - Service Manager" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Status check doesn't need Node.js version check
if ($Action -ne "status") {
    if (!(Test-NodeVersion)) {
        exit 1
    }
}

switch ($Action) {
    "status" {
        Show-Status
    }
    "start" {
        if ($Service -eq "all") {
            $backendResult = Start-Backend
            $adminResult = Start-Admin
            Write-Host ""
            Show-Status
        }
        else {
            switch ($Service) {
                "backend" { Start-Backend }
                "admin" { Start-Admin }
            }
        }
    }
    "stop" {
        if ($Service -eq "all") {
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
            Stop-MyService "admin"
            Stop-MyService "backend"
            Start-Sleep -Seconds 3

            # Start services sequentially, ensure each starts successfully before starting the next
            $backendResult = Start-Backend
            if ($backendResult) {
                Start-Sleep -Seconds 2
                Start-Admin
            }
            else {
                Write-Error "Backend service startup failed, skipping other services"
            }

            # Wait for all services to fully start and stabilize
            Write-Info "Waiting for all services to fully start..."
            Start-Sleep -Seconds 5

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
            }
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Operation completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
