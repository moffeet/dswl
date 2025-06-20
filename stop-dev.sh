#!/bin/bash

# 物流配送管理系统 - 停止开发环境脚本
# 作者: AI Assistant
# 版本: 1.0

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 杀死指定端口的进程
kill_port() {
    local port=$1
    local pids=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null)
    if [ -n "$pids" ]; then
        log_info "停止端口 $port 上的进程: $pids"
        echo $pids | xargs kill -9
        sleep 1
        return 0
    else
        return 1
    fi
}

# 主函数
main() {
    log_info "🛑 正在停止物流配送管理系统服务..."
    
    # 停止通过 PID 文件记录的进程
    # 检查新的 pids 目录和旧的根目录中的 PID 文件
    for pid_dir in "pids" "."; do
        if [ -f "$pid_dir/backend.pid" ]; then
            local backend_pid=$(cat $pid_dir/backend.pid)
            if kill -0 $backend_pid 2>/dev/null; then
                log_info "停止后端服务 (PID: $backend_pid)..."
                kill $backend_pid 2>/dev/null || true
                sleep 2
                kill -9 $backend_pid 2>/dev/null || true
            fi
            rm $pid_dir/backend.pid 2>/dev/null || true
            log_success "后端服务已停止"
        fi
        
        if [ -f "$pid_dir/admin.pid" ]; then
            local admin_pid=$(cat $pid_dir/admin.pid)
            if kill -0 $admin_pid 2>/dev/null; then
                log_info "停止管理后台服务 (PID: $admin_pid)..."
                kill $admin_pid 2>/dev/null || true
                sleep 2
                kill -9 $admin_pid 2>/dev/null || true
            fi
            rm $pid_dir/admin.pid 2>/dev/null || true
            log_success "管理后台服务已停止"
        fi
        
        if [ -f "$pid_dir/frontend.pid" ]; then
            local frontend_pid=$(cat $pid_dir/frontend.pid)
            if kill -0 $frontend_pid 2>/dev/null; then
                log_info "停止小程序前端服务 (PID: $frontend_pid)..."
                kill $frontend_pid 2>/dev/null || true
                sleep 2
                kill -9 $frontend_pid 2>/dev/null || true
            fi
            rm $pid_dir/frontend.pid 2>/dev/null || true
            log_success "小程序前端服务已停止"
        fi
    done
    
    # 通过端口强制停止服务
    log_info "检查并清理端口占用..."
    
    local ports=(3000 3001 3002)
    local stopped_count=0
    
    for port in "${ports[@]}"; do
        if kill_port $port; then
            ((stopped_count++))
        fi
    done
    
    if [ $stopped_count -gt 0 ]; then
        log_success "已停止 $stopped_count 个端口上的服务"
    else
        log_info "没有发现运行中的服务"
    fi
    
    # 清理可能的 Node.js 进程
    log_info "清理残留的 Node.js 进程..."
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "npm run start:dev" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "ts-node src/main.ts" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    
    # 等待进程完全退出
    sleep 3
    
    # 最终检查端口状态
    log_info "检查端口清理状态..."
    local remaining_ports=()
    for port in 3000 3001 3002; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            remaining_ports+=($port)
        fi
    done
    
    if [ ${#remaining_ports[@]} -gt 0 ]; then
        log_warning "以下端口仍被占用: ${remaining_ports[*]}"
        log_info "可手动清理: lsof -ti :端口号 | xargs kill -9"
    fi
    
    # 清理临时文件
    rm -f .backend.pid .admin.pid .frontend.pid 2>/dev/null || true
    rm -f pids/*.pid 2>/dev/null || true
    
    log_success "🎉 所有服务已停止！"
}

# 运行主函数
main "$@" 