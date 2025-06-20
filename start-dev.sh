#!/bin/bash

# 物流配送管理系统 - 开发环境启动脚本
# 作者: AI Assistant
# 版本: 1.0
# 日期: $(date +%Y-%m-%d)

set -e  # 遇到错误立即停止

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

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # 端口被占用
    else
        return 1  # 端口可用
    fi
}

# 杀死指定端口的进程
kill_port() {
    local port=$1
    local pids=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null)
    if [ -n "$pids" ]; then
        log_warning "杀死端口 $port 上的进程: $pids"
        echo $pids | xargs kill -9 2>/dev/null || true
        sleep 2
        
        # 再次检查端口是否已清空
        local remaining_pids=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null)
        if [ -n "$remaining_pids" ]; then
            log_warning "强制清理端口 $port 残留进程: $remaining_pids"
            echo $remaining_pids | xargs kill -9 2>/dev/null || true
            sleep 1
        fi
    fi
}

# 清理所有相关进程
cleanup_processes() {
    log_info "清理相关Node.js进程..."
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "npm run start:dev" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "ts-node" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    sleep 2
}

# 检查 Node.js 版本
check_node_version() {
    if ! command_exists node; then
        log_error "Node.js 未安装！请先安装 Node.js 18+ 版本"
        exit 1
    fi
    
    local node_version=$(node -v | sed 's/v//')
    local major_version=$(echo $node_version | cut -d. -f1)
    
    if [ "$major_version" -lt 18 ]; then
        log_error "Node.js 版本过低！当前版本: $node_version，需要 18.18.0 或更高版本"
        log_info "请使用 nvm 升级 Node.js 版本："
        log_info "  nvm install 20"
        log_info "  nvm use 20"
        log_info "  nvm alias default 20"
        exit 1
    fi
    
    log_success "Node.js 版本检查通过: v$node_version"
}

# 检查 MySQL 连接
check_mysql() {
    log_info "检查 MySQL 数据库连接..."
    
    # 默认数据库配置
    local db_host="localhost"
    local db_port="3306"
    local db_user="root"
    local db_password="123456"
    local db_name="delivery_system"
    
    # 检查 MySQL 是否运行
    if ! command_exists mysql; then
        log_warning "MySQL 客户端未安装，跳过数据库连接检查"
        return 0
    fi
    
    # 尝试连接数据库
    if mysql -h"$db_host" -P"$db_port" -u"$db_user" -p"$db_password" -e "USE $db_name;" 2>/dev/null; then
        log_success "MySQL 数据库连接成功"
    else
        log_warning "MySQL 数据库连接失败，请检查数据库配置"
        log_info "默认配置: host=$db_host, port=$db_port, user=$db_user, password=$db_password, database=$db_name"
        log_info "请确保 MySQL 服务已启动并执行了 init.sql 初始化脚本"
    fi
}

# 安装项目依赖
install_dependencies() {
    log_info "开始安装项目依赖..."
    
    # 安装后端依赖
    log_info "安装后端依赖..."
    cd backend-node
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
        log_info "重新安装后端依赖..."
        rm -rf node_modules package-lock.json 2>/dev/null || true
        npm install || {
            log_error "后端依赖安装失败"
            return 1
        }
    else
        log_info "后端依赖已存在，跳过安装"
    fi
    cd ..
    
    # 安装管理后台依赖
    log_info "安装管理后台依赖..."
    cd admin-frontend
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
        log_info "重新安装管理后台依赖..."
        rm -rf node_modules package-lock.json 2>/dev/null || true
        npm install || {
            log_error "管理后台依赖安装失败"
            cd ..
            return 1
        }
    else
        log_info "管理后台依赖已存在，跳过安装"
    fi
    cd ..
    
    # 安装小程序前端依赖
    log_info "安装小程序前端依赖..."
    cd frontend
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
        log_info "重新安装小程序前端依赖..."
        rm -rf node_modules package-lock.json 2>/dev/null || true
        npm install || {
            log_error "小程序前端依赖安装失败"
            cd ..
            return 1
        }
    else
        log_info "小程序前端依赖已存在，跳过安装"
    fi
    cd ..
    
    log_success "所有依赖安装完成"
}

# 检查并清理端口
prepare_ports() {
    log_info "检查并清理端口..."
    
    # 先清理相关进程
    cleanup_processes
    
    local ports=(3000 3001 3002)
    
    for port in "${ports[@]}"; do
        if check_port $port; then
            log_warning "端口 $port 被占用"
            kill_port $port
        fi
    done
    
    # 最终检查所有端口状态
    log_info "最终端口状态检查..."
    for port in "${ports[@]}"; do
        if check_port $port; then
            log_error "端口 $port 仍被占用，请手动清理"
            return 1
        fi
    done
    
    log_success "端口准备完成"
}

# 启动后端服务
start_backend() {
    log_info "启动后端服务..."
    cd backend-node
    
    # 确保编译目录存在并编译
    log_info "编译后端代码..."
    npm run build || {
        log_error "后端代码编译失败"
        cd ..
        return 1
    }
    
    # 创建日志目录
    mkdir -p ../logs
    
    # 尝试使用开发模式启动
    log_info "启动后端开发服务 (端口: 3000)..."
    nohup npm run start:dev > ../logs/backend.log 2>&1 &
    local backend_pid=$!
    
    # 等待并检查启动状态
    log_info "等待后端服务启动..."
    sleep 8
    
    if ! kill -0 $backend_pid 2>/dev/null || ! check_port 3000; then
        log_warning "开发模式启动失败，尝试生产模式..."
        
        # 停止开发模式进程
        kill $backend_pid 2>/dev/null || true
        sleep 2
        
        # 使用生产模式启动
        log_info "启动后端生产服务..."
        nohup npm start > ../logs/backend.log 2>&1 &
        backend_pid=$!
        
        sleep 5
        
        if ! kill -0 $backend_pid 2>/dev/null || ! check_port 3000; then
            log_error "后端服务启动失败，查看日志: cat logs/backend.log"
            cd ..
            return 1
        fi
    fi
    
    # 保存进程ID
    mkdir -p ../pids
    echo $backend_pid > ../pids/backend.pid
    
    cd ..
    
    log_success "后端服务启动成功 (PID: $backend_pid)"
    log_info "API文档地址: http://localhost:3000/api"
    
    return 0
}

# 启动管理后台
start_admin() {
    log_info "启动管理后台..."
    cd admin-frontend
    
    # 检查依赖是否安装
    if [ ! -d "node_modules" ]; then
        log_info "安装管理后台依赖..."
        npm install || {
            log_error "管理后台依赖安装失败"
            cd ..
            return 1
        }
    fi
    
    # 创建日志目录
    mkdir -p ../logs
    
    log_info "启动管理后台开发服务 (端口: 3001)..."
    nohup npm run dev -- --port 3001 > ../logs/admin.log 2>&1 &
    local admin_pid=$!
    
    # 等待管理后台启动
    log_info "等待管理后台服务启动..."
    sleep 10
    
    # 检查进程状态和端口
    if ! kill -0 $admin_pid 2>/dev/null; then
        log_error "管理后台进程已退出，查看日志: cat logs/admin.log"
        cd ..
        return 1
    fi
    
    if ! check_port 3001; then
        log_error "管理后台端口3001未监听，查看日志: cat logs/admin.log"
        kill $admin_pid 2>/dev/null || true
        cd ..
        return 1
    fi
    
    # 保存进程ID
    mkdir -p ../pids
    echo $admin_pid > ../pids/admin.pid
    
    cd ..
    
    log_success "管理后台启动成功 (PID: $admin_pid)"
    log_info "管理后台地址: http://localhost:3001"
    
    return 0
}

# 启动小程序前端
start_frontend() {
    log_info "启动小程序前端..."
    cd frontend
    
    # 检查依赖是否安装
    if [ ! -d "node_modules" ]; then
        log_info "安装小程序前端依赖..."
        npm install || {
            log_error "小程序前端依赖安装失败"
            cd ..
            return 1
        }
    fi
    
    # 创建日志目录
    mkdir -p ../logs
    
    log_info "启动小程序前端开发服务 (端口: 3002)..."
    nohup npm run dev -- --port 3002 > ../logs/frontend.log 2>&1 &
    local frontend_pid=$!
    
    # 等待小程序前端启动
    log_info "等待小程序前端服务启动..."
    sleep 10
    
    # 检查进程状态和端口
    if ! kill -0 $frontend_pid 2>/dev/null; then
        log_error "小程序前端进程已退出，查看日志: cat logs/frontend.log"
        cd ..
        return 1
    fi
    
    if ! check_port 3002; then
        log_error "小程序前端端口3002未监听，查看日志: cat logs/frontend.log"
        kill $frontend_pid 2>/dev/null || true
        cd ..
        return 1
    fi
    
    # 保存进程ID
    mkdir -p ../pids
    echo $frontend_pid > ../pids/frontend.pid
    
    cd ..
    
    log_success "小程序前端启动成功 (PID: $frontend_pid)"
    log_info "小程序前端地址: http://localhost:3002"
    
    return 0
}

# 显示启动结果
show_result() {
    echo ""
    echo "=========================================="
    log_success "🎉 物流配送管理系统启动成功！"
    echo "=========================================="
    echo ""
    echo "📋 服务地址："
    echo "  🔙 后端服务:     http://localhost:3000"
    echo "  📖 API文档:      http://localhost:3000/api"
    echo "  ❤️  健康检查:     http://localhost:3000/health"
    echo "  🖥️  管理后台:     http://localhost:3001"
    echo "  📱 小程序前端:    http://localhost:3002"
    echo ""
    echo "🔑 默认账号："
    echo "  管理员: admin / admin123"
    echo "  测试司机: 13800000001 / 13800000002 / 13800000003"
    echo ""
    echo "📝 日志查看："
    echo "  tail -f .backend.log    # 后端日志"
    echo "  tail -f .admin.log      # 管理后台日志"
    echo "  tail -f .frontend.log   # 小程序前端日志"
    echo ""
    echo "🛑 停止服务："
    echo "  ./stop-dev.sh           # 停止所有服务"
    echo "  或者 Ctrl+C             # 停止当前脚本"
    echo "=========================================="
}

# 清理函数
cleanup() {
    log_info "正在清理进程..."
    
    # 读取 PID 文件并杀死进程
    if [ -f ".backend.pid" ]; then
        kill $(cat .backend.pid) 2>/dev/null || true
        rm .backend.pid
    fi
    
    if [ -f ".admin.pid" ]; then
        kill $(cat .admin.pid) 2>/dev/null || true
        rm .admin.pid
    fi
    
    if [ -f ".frontend.pid" ]; then
        kill $(cat .frontend.pid) 2>/dev/null || true
        rm .frontend.pid
    fi
    
    # 清理端口
    kill_port 3000
    kill_port 3001
    kill_port 3002
    
    log_info "清理完成"
    exit 0
}

# 主函数
main() {
    log_info "🚀 开始启动物流配送管理系统（开发环境）..."
    
    # 检查当前目录
    if [ ! -f "init.sql" ] || [ ! -d "backend-node" ]; then
        log_error "请在项目根目录下执行此脚本！"
        exit 1
    fi
    
    # 设置信号处理
    trap cleanup INT TERM
    
    # 执行检查和启动步骤
    check_node_version
    check_mysql
    prepare_ports
    install_dependencies
    
    # 启动服务
    if start_backend && start_admin && start_frontend; then
        show_result
        
        # 保持脚本运行
        log_info "按 Ctrl+C 停止所有服务"
        while true; do
            sleep 10
            
            # 检查服务是否还在运行
            if ! check_port 3000; then
                log_error "后端服务已停止"
                break
            fi
            if ! check_port 3001; then
                log_error "管理后台服务已停止"
                break
            fi
            if ! check_port 3002; then
                log_error "小程序前端服务已停止"
                break
            fi
        done
    else
        log_error "服务启动失败"
        cleanup
        exit 1
    fi
}

# 运行主函数
main "$@" 