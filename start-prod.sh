#!/bin/bash

# 物流配送管理系统 - 生产环境启动脚本
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
        echo $pids | xargs kill -9
        sleep 2
    fi
}

# 检查 PM2 是否安装
check_pm2() {
    if ! command_exists pm2; then
        log_info "PM2 未安装，正在安装..."
        npm install -g pm2
        log_success "PM2 安装完成"
    else
        log_success "PM2 已安装"
    fi
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
        exit 1
    fi
    
    log_success "Node.js 版本检查通过: v$node_version"
}

# 检查 MySQL 连接
check_mysql() {
    log_info "检查 MySQL 数据库连接..."
    
    # 从环境变量或使用默认值
    local db_host="${DATABASE_HOST:-localhost}"
    local db_port="${DATABASE_PORT:-3306}"
    local db_user="${DATABASE_USERNAME:-root}"
    local db_password="${DATABASE_PASSWORD:-123456}"
    local db_name="${DATABASE_NAME:-delivery_system}"
    
    if ! command_exists mysql; then
        log_warning "MySQL 客户端未安装，跳过数据库连接检查"
        return 0
    fi
    
    if mysql -h"$db_host" -P"$db_port" -u"$db_user" -p"$db_password" -e "USE $db_name;" 2>/dev/null; then
        log_success "MySQL 数据库连接成功"
    else
        log_error "MySQL 数据库连接失败"
        log_info "配置: host=$db_host, port=$db_port, user=$db_user, database=$db_name"
        exit 1
    fi
}

# 安装和构建项目
build_project() {
    log_info "开始构建项目..."
    
    # 构建后端
    log_info "构建后端..."
    cd backend-node
    npm ci --only=production
    npm run build
    cd ..
    
    # 构建管理后台
    log_info "构建管理后台..."
    cd admin-frontend
    npm ci --only=production
    npm run build
    cd ..
    
    # 构建小程序前端
    log_info "构建小程序前端..."
    cd frontend
    npm ci --only=production
    npm run build
    cd ..
    
    log_success "项目构建完成"
}

# 停止现有服务
stop_existing_services() {
    log_info "停止现有服务..."
    
    # 停止 PM2 管理的服务
    pm2 stop wlxt-backend 2>/dev/null || true
    pm2 stop wlxt-admin 2>/dev/null || true
    pm2 stop wlxt-frontend 2>/dev/null || true
    
    pm2 delete wlxt-backend 2>/dev/null || true
    pm2 delete wlxt-admin 2>/dev/null || true
    pm2 delete wlxt-frontend 2>/dev/null || true
    
    # 清理端口
    local ports=(3000 3001 3002)
    for port in "${ports[@]}"; do
        if check_port $port; then
            kill_port $port
        fi
    done
    
    log_success "现有服务已停止"
}

# 启动后端服务
start_backend() {
    log_info "启动后端服务..."
    cd backend-node
    
    # 使用 PM2 启动后端服务
    pm2 start npm --name "wlxt-backend" -- start
    
    cd ..
    
    # 等待服务启动
    sleep 5
    
    if check_port 3000; then
        log_success "后端服务启动成功"
    else
        log_error "后端服务启动失败"
        return 1
    fi
}

# 启动管理后台
start_admin() {
    log_info "启动管理后台..."
    cd admin-frontend
    
    # 使用 PM2 启动管理后台
    pm2 start npm --name "wlxt-admin" -- start -- --port 3001
    
    cd ..
    
    # 等待服务启动
    sleep 8
    
    if check_port 3001; then
        log_success "管理后台启动成功"
    else
        log_error "管理后台启动失败"
        return 1
    fi
}

# 启动小程序前端
start_frontend() {
    log_info "启动小程序前端..."
    cd frontend
    
    # 使用 PM2 启动小程序前端
    pm2 start npm --name "wlxt-frontend" -- start -- --port 3002
    
    cd ..
    
    # 等待服务启动
    sleep 8
    
    if check_port 3002; then
        log_success "小程序前端启动成功"
    else
        log_error "小程序前端启动失败"
        return 1
    fi
}

# 配置 PM2 自动重启
configure_pm2() {
    log_info "配置 PM2 自动重启..."
    
    # 保存 PM2 配置
    pm2 save
    
    # 生成启动脚本
    pm2 startup
    
    log_success "PM2 自动重启配置完成"
}

# 显示服务状态
show_status() {
    echo ""
    echo "=========================================="
    log_success "🎉 物流配送管理系统生产环境启动成功！"
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
    echo ""
    echo "📊 服务状态："
    pm2 status
    echo ""
    echo "📝 管理命令："
    echo "  pm2 status              # 查看服务状态"
    echo "  pm2 logs                # 查看所有日志"
    echo "  pm2 logs wlxt-backend   # 查看后端日志"
    echo "  pm2 logs wlxt-admin     # 查看管理后台日志"
    echo "  pm2 logs wlxt-frontend  # 查看小程序前端日志"
    echo "  pm2 restart all         # 重启所有服务"
    echo "  pm2 stop all            # 停止所有服务"
    echo "  pm2 delete all          # 删除所有服务"
    echo "  pm2 monit               # 监控面板"
    echo ""
    echo "🛑 停止服务："
    echo "  ./stop-prod.sh          # 停止所有服务"
    echo "=========================================="
}

# 主函数
main() {
    log_info "🚀 开始启动物流配送管理系统（生产环境）..."
    
    # 检查当前目录
    if [ ! -f "init.sql" ] || [ ! -d "backend-node" ]; then
        log_error "请在项目根目录下执行此脚本！"
        exit 1
    fi
    
    # 设置生产环境变量
    export NODE_ENV=production
    
    # 执行启动步骤
    check_node_version
    check_pm2
    check_mysql
    stop_existing_services
    build_project
    
    # 启动服务
    if start_backend && start_admin && start_frontend; then
        configure_pm2
        show_status
        log_success "生产环境启动完成！"
    else
        log_error "服务启动失败"
        exit 1
    fi
}

# 运行主函数
main "$@" 