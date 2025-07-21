# Quick Start Script for Development
# Usage: .\quick-start.ps1

Write-Host "=== 快速启动脚本 ===" -ForegroundColor Cyan

# 清理端口
function Clear-Ports {
    Write-Host "[清理] 正在清理端口..." -ForegroundColor Yellow
    
    # 清理3000端口
    $connections3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($connections3000) {
        $connections3000 | ForEach-Object { 
            Write-Host "  杀死进程 $($_.OwningProcess) (端口3000)" -ForegroundColor Yellow
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
        }
    }
    
    # 清理3001端口
    $connections3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
    if ($connections3001) {
        $connections3001 | ForEach-Object { 
            Write-Host "  杀死进程 $($_.OwningProcess) (端口3001)" -ForegroundColor Yellow
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
        }
    }
    
    Start-Sleep -Seconds 2
    Write-Host "[清理] 端口清理完成" -ForegroundColor Green
}

# 启动后端
function Start-Backend {
    Write-Host "[后端] 启动后端服务..." -ForegroundColor Blue

    if (!(Test-Path "backend-node")) {
        Write-Host "[错误] backend-node目录不存在" -ForegroundColor Red
        return
    }

    # 确保清除PORT环境变量，让后端使用默认的3000端口
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "Remove-Item Env:PORT -ErrorAction SilentlyContinue; cd backend-node; npm run start:dev" -WindowStyle Normal
    Write-Host "[后端] 后端服务启动命令已执行 (端口3000)" -ForegroundColor Green
}

# 启动前端
function Start-Frontend {
    Write-Host "[前端] 启动前端服务..." -ForegroundColor Blue
    
    if (!(Test-Path "admin-frontend")) {
        Write-Host "[错误] admin-frontend目录不存在" -ForegroundColor Red
        return
    }
    
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd admin-frontend; npm run dev" -WindowStyle Normal
    Write-Host "[前端] 前端服务启动命令已执行" -ForegroundColor Green
}

# 主流程
Clear-Ports
Write-Host ""

Start-Backend
Start-Sleep -Seconds 2

Start-Frontend
Write-Host ""

Write-Host "=== 启动完成 ===" -ForegroundColor Cyan
Write-Host "后端服务: http://localhost:3000" -ForegroundColor Green
Write-Host "前端管理: http://localhost:3001" -ForegroundColor Green
Write-Host "API文档: http://localhost:3000/api" -ForegroundColor Green
Write-Host ""
Write-Host "注意: 两个新的PowerShell窗口已打开，请查看启动日志" -ForegroundColor Yellow
