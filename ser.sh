#!/bin/bash

# 物流配送管理系统 - 服务管理脚本
# 支持启动、停止、重启和状态查看
# 使用方法: ./manage-services.sh <action> <service>
# 
# action: start|stop|restart|status
# service: backend|admin|frontend|all
#
# 示例:
#   ./manage-services.sh start all        # 启动所有服务
#   ./manage-services.sh stop backend     # 停止后端服务
#   ./manage-services.sh restart admin    # 重启管理后台
#   ./manage-services.sh status           # 查看所有服务状态

set -e  # 遇到错误立即停止

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置
export BACKEND_PORT=3000
export ADMIN_PORT=3001  
export FRONTEND_PORT=3002
PID_DIR="pids"
LOG_DIR="logs"

# 确保目录存在
mkdir -p "$PID_DIR" "$LOG_DIR"

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

log_service() {
    echo -e "${PURPLE}[SERVICE]${NC} $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查端口是否被占用
check_port() {
    local port=$1
    # 使用netstat检测端口（更可靠，支持IPv4和IPv6）
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        return 0  # 端口被占用
    # 备用方法：使用lsof检测
    elif lsof -i :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
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
        echo $pids | xargs kill -TERM 2>/dev/null || true
        sleep 3
        
        # 如果还有进程，强制杀死
        local remaining_pids=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null)
        if [ -n "$remaining_pids" ]; then
            log_warning "强制杀死端口 $port 上的进程: $remaining_pids"
            echo $remaining_pids | xargs kill -9 2>/dev/null || true
            sleep 1
        fi
        return 0
    else
        return 1
    fi
}

# 检查 Node.js 版本
check_node_version() {
    if ! command_exists node; then
        log_error "Node.js 未安装！请先安装 Node.js 18+ 版本"
        return 1
    fi
    
    local node_version=$(node -v | sed 's/v//')
    local major_version=$(echo $node_version | cut -d. -f1)
    
    if [ "$major_version" -lt 18 ]; then
        log_error "Node.js 版本过低！当前版本: $node_version，需要 18.18.0 或更高版本"
        log_info "请使用 nvm 升级 Node.js 版本："
        log_info "  nvm install 20"
        log_info "  nvm use 20"
        log_info "  nvm alias default 20"
        return 1
    fi
    
    return 0
}

# 安装依赖
install_dependencies() {
    local service=$1
    local dir=""
    
    case $service in
        "backend") dir="backend-node" ;;
        "admin") dir="admin-frontend" ;;
        "frontend") dir="frontend" ;;
        *) return 1 ;;
    esac
    
    if [ ! -d "$dir" ]; then
        log_error "目录 $dir 不存在"
        return 1
    fi
    
    cd "$dir"
    if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
        log_info "安装 $service 依赖..."
        rm -rf node_modules package-lock.json 2>/dev/null || true
        npm install || {
            log_error "$service 依赖安装失败"
            cd ..
            return 1
        }
    fi
    cd ..
    return 0
}

# 获取服务 PID
get_service_pid() {
    local service=$1
    local pid_file="$PID_DIR/${service}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file" 2>/dev/null)
        if [ -n "$pid" ] && [ "$pid" != "" ]; then
            # 检查进程是否真的存在
            if kill -0 "$pid" 2>/dev/null; then
                echo "$pid"
                return 0
            else
                # 再等待一下，可能进程还在启动中
                sleep 1
                if kill -0 "$pid" 2>/dev/null; then
                    echo "$pid"
                    return 0
                else
                    # 确认进程不存在，清理文件
                    rm -f "$pid_file"
                fi
            fi
        else
            # PID文件为空，清理文件
            rm -f "$pid_file"
        fi
    fi
    return 1
}

# 检查服务状态
check_service_status() {
    local service=$1
    local port=""
    
    case $service in
        "backend") port=3000 ;;
        "admin") port=3001 ;;
        "frontend") port=3002 ;;
        *) return 1 ;;
    esac
    
    local pid=$(get_service_pid "$service" 2>/dev/null)
    local port_status=""
    
    if check_port "$port"; then
        port_status="端口 $port 已占用"
    else
        port_status="端口 $port 空闲"
    fi
    
    if [ -n "$pid" ]; then
        echo -e "${GREEN}运行中${NC} (PID: $pid, $port_status)"
        return 0
    else
        if check_port "$port"; then
            echo -e "${YELLOW}异常${NC} (PID文件缺失, $port_status)"
            return 2
        else
            echo -e "${RED}已停止${NC} ($port_status)"
            return 1
        fi
    fi
}

# 清理特定服务的相关进程
cleanup_service_processes() {
    local service=$1
    log_info "清理 $service 相关进程..."
    
    case $service in
        "backend")
            # 清理backend相关的nodemon和ts-node进程
            pkill -f "backend-node.*nodemon" 2>/dev/null || true
            pkill -f "backend-node.*ts-node" 2>/dev/null || true
            # 清理可能监听3000端口的进程
            local backend_pids=$(lsof -ti :3000 2>/dev/null)
            if [ -n "$backend_pids" ]; then
                echo $backend_pids | xargs kill -TERM 2>/dev/null || true
                sleep 2
                echo $backend_pids | xargs kill -9 2>/dev/null || true
            fi
            ;;
        "admin")
            # 更精确地清理admin相关的next进程
            pkill -f "admin-frontend.*next.*3001" 2>/dev/null || true
            # 清理监听3001端口但不是当前PID的进程
            local current_admin_pid=$(get_service_pid "admin" 2>/dev/null)
            local admin_pids=$(lsof -ti :3001 2>/dev/null)
            if [ -n "$admin_pids" ]; then
                for pid in $admin_pids; do
                    if [ "$pid" != "$current_admin_pid" ]; then
                        kill -TERM "$pid" 2>/dev/null || true
                    fi
                done
                sleep 1
                for pid in $admin_pids; do
                    if [ "$pid" != "$current_admin_pid" ] && kill -0 "$pid" 2>/dev/null; then
                        kill -9 "$pid" 2>/dev/null || true
                    fi
                done
            fi
            ;;
        "frontend")
            # 更精确地清理frontend相关的next进程
            pkill -f "frontend.*next.*3002" 2>/dev/null || true
            # 清理监听3002端口但不是当前PID的进程
            local current_frontend_pid=$(get_service_pid "frontend" 2>/dev/null)
            local frontend_pids=$(lsof -ti :3002 2>/dev/null)
            if [ -n "$frontend_pids" ]; then
                for pid in $frontend_pids; do
                    if [ "$pid" != "$current_frontend_pid" ]; then
                        kill -TERM "$pid" 2>/dev/null || true
                    fi
                done
                sleep 1
                for pid in $frontend_pids; do
                    if [ "$pid" != "$current_frontend_pid" ] && kill -0 "$pid" 2>/dev/null; then
                        kill -9 "$pid" 2>/dev/null || true
                    fi
                done
            fi
            ;;
    esac
    sleep 1
}

# 启动后端服务
start_backend() {
    log_service "启动后端服务..."
    
    # 确保端口变量正确设置
    local BACKEND_PORT=3000
    
    # 清理残留进程
    cleanup_service_processes "backend"
    
    if ! install_dependencies "backend"; then
        return 1
    fi
    
    if check_port $BACKEND_PORT; then
        log_warning "端口 $BACKEND_PORT 已被占用，尝试清理..."
        kill_port $BACKEND_PORT
    fi
    
    cd backend-node
    
    # 清理所有可能的端口环境变量
    unset PORT
    unset ADMIN_PORT
    unset FRONTEND_PORT
    
    log_info "后端启动配置: PORT=$BACKEND_PORT"
    
    # 先尝试开发模式启动
    log_info "尝试开发模式启动..."
    if PORT=$BACKEND_PORT nohup npm run start:dev > "../$LOG_DIR/backend.log" 2>&1 & then
        local pid=$!
        echo $pid > "../$PID_DIR/backend.pid"
        sleep 8  # 给更多时间启动
        
        if kill -0 $pid 2>/dev/null && check_port $BACKEND_PORT; then
            log_success "后端服务启动成功 (开发模式, PID: $pid, 端口: $BACKEND_PORT)"
            cd ..
            return 0
        else
            log_warning "开发模式启动失败，尝试生产模式..."
            kill $pid 2>/dev/null || true
            rm -f "../$PID_DIR/backend.pid"
        fi
    fi
    
    # 尝试生产模式启动
    log_info "构建并启动生产模式..."
    if npm run build; then
        if PORT=$BACKEND_PORT nohup npm start > "../$LOG_DIR/backend.log" 2>&1 & then
            local pid=$!
            echo $pid > "../$PID_DIR/backend.pid"
            sleep 8  # 给更多时间启动
            
            if kill -0 $pid 2>/dev/null && check_port $BACKEND_PORT; then
                log_success "后端服务启动成功 (生产模式, PID: $pid, 端口: $BACKEND_PORT)"
                cd ..
                return 0
            else
                log_error "后端服务启动失败"
                kill $pid 2>/dev/null || true
                rm -f "../$PID_DIR/backend.pid"
            fi
        fi
    else
        log_error "构建失败，无法启动后端服务"
    fi
    
    cd ..
    return 1
}

# 启动管理后台
start_admin() {
    log_service "启动管理后台..."
    
    # 确保端口变量正确设置
    local ADMIN_PORT=3001
    
    # 清理残留进程
    cleanup_service_processes "admin"
    
    if ! install_dependencies "admin"; then
        return 1
    fi
    
    if check_port $ADMIN_PORT; then
        log_warning "端口 $ADMIN_PORT 已被占用，尝试清理..."
        kill_port $ADMIN_PORT
    fi
    
    cd admin-frontend
    
    # 清理可能的环境变量干扰
    unset PORT
    unset BACKEND_PORT
    unset FRONTEND_PORT
    
    # Next.js 15 需要明确指定端口
    log_info "启动命令: npm run dev -- --port $ADMIN_PORT"
    PORT=$ADMIN_PORT nohup npm run dev -- --port $ADMIN_PORT > "../$LOG_DIR/admin.log" 2>&1 &
    local pid=$!
    echo $pid > "../$PID_DIR/admin.pid"
    
    log_info "等待管理后台启动... (PID: $pid)"
    cd ..
    
    # 等待启动并检查多次
    local retry_count=0
    local max_retries=20
    
    while [ $retry_count -lt $max_retries ]; do
        sleep 1
        
        # 检查进程是否还活着
        if ! kill -0 $pid 2>/dev/null; then
            log_error "管理后台进程 $pid 已停止"
            rm -f "$PID_DIR/admin.pid"
            return 1
        fi
        
        # 检查端口是否被占用
        if check_port $ADMIN_PORT; then
            log_success "管理后台启动成功 (PID: $pid, 端口: $ADMIN_PORT)"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        log_info "等待端口 $ADMIN_PORT 启动... ($retry_count/$max_retries)"
    done
    
    log_error "管理后台启动失败：超时"
    kill $pid 2>/dev/null || true
    rm -f "$PID_DIR/admin.pid"
    return 1
}

# 启动小程序前端
start_frontend() {
    log_service "启动小程序前端..."
    
    # 确保端口变量正确设置
    local FRONTEND_PORT=3002
    
    # 清理残留进程
    cleanup_service_processes "frontend"
    
    if ! install_dependencies "frontend"; then
        return 1
    fi
    
    if check_port $FRONTEND_PORT; then
        log_warning "端口 $FRONTEND_PORT 已被占用，尝试清理..."
        kill_port $FRONTEND_PORT
    fi
    
    cd frontend
    
    # 清理可能的环境变量干扰
    unset PORT
    unset BACKEND_PORT
    unset ADMIN_PORT
    
    log_info "启动命令: npm run dev -- --port $FRONTEND_PORT"
    PORT=$FRONTEND_PORT nohup npm run dev -- --port $FRONTEND_PORT > "../$LOG_DIR/frontend.log" 2>&1 &
    local pid=$!
    echo $pid > "../$PID_DIR/frontend.pid"
    
    log_info "等待小程序前端启动... (PID: $pid)"
    cd ..
    
    # 等待启动并检查多次
    local retry_count=0
    local max_retries=20
    
    while [ $retry_count -lt $max_retries ]; do
        sleep 1
        
        # 检查进程是否还活着
        if ! kill -0 $pid 2>/dev/null; then
            log_error "小程序前端进程 $pid 已停止"
            rm -f "$PID_DIR/frontend.pid"
            return 1
        fi
        
        # 检查端口是否被占用
        if check_port $FRONTEND_PORT; then
            log_success "小程序前端启动成功 (PID: $pid, 端口: $FRONTEND_PORT)"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        log_info "等待端口 $FRONTEND_PORT 启动... ($retry_count/$max_retries)"
    done
    
    log_error "小程序前端启动失败：超时"
    kill $pid 2>/dev/null || true
    rm -f "$PID_DIR/frontend.pid"
    return 1
}

# 停止服务
stop_service() {
    local service=$1
    local port=""
    
    case $service in
        "backend") port=3000 ;;
        "admin") port=3001 ;;
        "frontend") port=3002 ;;
        *) 
            log_error "未知服务: $service"
            return 1
            ;;
    esac
    
    log_service "停止 $service 服务..."
    
    local pid=$(get_service_pid "$service" 2>/dev/null)
    if [ -n "$pid" ]; then
        log_info "停止进程 $pid..."
        kill -TERM "$pid" 2>/dev/null || true
        sleep 3
        
        if kill -0 "$pid" 2>/dev/null; then
            log_warning "强制停止进程 $pid"
            kill -9 "$pid" 2>/dev/null || true
            sleep 1
        fi
        
        rm -f "$PID_DIR/${service}.pid"
    fi
    
    # 清理端口
    if check_port "$port"; then
        log_info "清理端口 $port..."
        kill_port "$port"
    fi
    
    log_success "$service 服务已停止"
    return 0
}

# 显示使用帮助
show_usage() {
    echo
    echo -e "${CYAN}物流配送管理系统 - 服务管理脚本${NC}"
    echo
    echo -e "${YELLOW}使用方法:${NC}"
    echo "  $0 <action> [service]"
    echo
    echo -e "${YELLOW}操作类型 (action):${NC}"
    echo "  start    - 启动服务"
    echo "  stop     - 停止服务"
    echo "  restart  - 重启服务"
    echo "  status   - 查看服务状态"
    echo
    echo -e "${YELLOW}服务名称 (service):${NC}"
    echo "  backend   - 后端服务 (NestJS, 端口 $BACKEND_PORT)"
    echo "  admin     - 管理后台 (Next.js, 端口 $ADMIN_PORT)"
    echo "  frontend  - 小程序前端 (Next.js, 端口 $FRONTEND_PORT)"
    echo "  all       - 所有服务 (默认)"
    echo
    echo -e "${YELLOW}示例:${NC}"
    echo "  $0 start all          # 启动所有服务"
    echo "  $0 stop backend       # 停止后端服务"
    echo "  $0 restart admin      # 重启管理后台"
    echo "  $0 status             # 查看所有服务状态"
    echo
    echo -e "${YELLOW}访问地址:${NC}"
    echo "  后端API:     http://localhost:$BACKEND_PORT"
    echo "  API文档:     http://localhost:$BACKEND_PORT/api"
    echo "  管理后台:    http://localhost:$ADMIN_PORT"
    echo "  小程序前端:  http://localhost:$FRONTEND_PORT"
    echo
}

# 显示服务状态
show_status() {
    echo
    echo -e "${CYAN}=== 服务状态 ===${NC}"
    echo
    
    echo -e "${YELLOW}后端服务 (NestJS):${NC}     $(check_service_status "backend")"
    echo -e "${YELLOW}管理后台 (Next.js):${NC}   $(check_service_status "admin")"
    echo -e "${YELLOW}小程序前端 (Next.js):${NC} $(check_service_status "frontend")"
    
    echo
    echo -e "${CYAN}=== 端口占用 ===${NC}"
    echo
    
    for port in 3000 3001 3002; do
        if check_port "$port"; then
            local pids=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null)
            echo -e "端口 ${YELLOW}$port${NC}: ${GREEN}已占用${NC} (PID: $pids)"
        else
            echo -e "端口 ${YELLOW}$port${NC}: ${RED}空闲${NC}"
        fi
    done
    
    echo
}

# 主函数
main() {
    local action=$1
    local service=${2:-"all"}
    
    # 检查参数
    if [ -z "$action" ]; then
        show_usage
        exit 1
    fi
    
    # 验证操作类型
    case $action in
        "start"|"stop"|"restart"|"status") ;;
        *)
            log_error "未知操作: $action"
            show_usage
            exit 1
            ;;
    esac
    
    # 验证服务名称
    case $service in
        "backend"|"admin"|"frontend"|"all") ;;
        *)
            log_error "未知服务: $service"
            show_usage
            exit 1
            ;;
    esac
    
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  物流配送管理系统 - 服务管理${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo
    
    # 状态查看不需要检查Node.js版本
    if [ "$action" != "status" ]; then
        if ! check_node_version; then
            exit 1
        fi
    fi
    
    case $action in
        "status")
            show_status
            ;;
        "start")
            case $service in
                "all")
                    start_backend && start_admin && start_frontend
                    echo
                    show_status
                    ;;
                "backend") start_backend ;;
                "admin") start_admin ;;
                "frontend") start_frontend ;;
            esac
            ;;
        "stop")
            case $service in
                "all")
                    stop_service "frontend"
                    stop_service "admin"
                    stop_service "backend"
                    echo
                    show_status
                    ;;
                *) stop_service "$service" ;;
            esac
            ;;
        "restart")
            case $service in
                "all")
                    log_info "重启所有服务..."
                    stop_service "frontend"
                    stop_service "admin"
                    stop_service "backend"
                    sleep 3
                    
                    # 顺序启动服务，确保每个都完全启动成功后再启动下一个
                    if start_backend; then
                        sleep 2
                        if start_admin; then
                            sleep 2
                            start_frontend
                        else
                            log_error "管理后台启动失败，跳过小程序前端启动"
                        fi
                    else
                        log_error "后端服务启动失败，跳过其他服务启动"
                    fi
                    
                    # 等待所有服务完全启动稳定
                    log_info "等待所有服务完全启动..."
                    sleep 5
                    
                    echo
                    show_status
                    ;;
                *)
                    log_info "重启 $service 服务..."
                    stop_service "$service"
                    sleep 2
                    case $service in
                        "backend") start_backend ;;
                        "admin") start_admin ;;
                        "frontend") start_frontend ;;
                    esac
                    ;;
            esac
            ;;
    esac
    
    echo
    echo -e "${CYAN}========================================${NC}"
    echo -e "${GREEN}操作完成！${NC}"
    echo -e "${CYAN}========================================${NC}"
}

# 运行主函数
main "$@" 