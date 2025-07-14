#!/bin/bash

# 物流配送管理系统 - 自动化部署脚本
# 使用方法: ./deploy.sh

set -e  # 遇到错误立即停止

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
SERVER_IP="49.235.60.148"
SERVER_USER="root"
DEPLOY_PATH="/szw/dswl1"
LOCAL_PATH="."

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

# 检查本地环境
check_local_env() {
    log_info "检查本地环境..."
    
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js 未安装！"
        exit 1
    fi
    
    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm 未安装！"
        exit 1
    fi
    
    log_success "本地环境检查通过"
}

# 本地构建
local_build() {
    log_info "开始本地构建..."
    
    # 构建后端
    log_info "构建后端服务..."
    cd backend-node
    npm install
    npm run build
    cd ..
    
    # 构建前端
    log_info "构建管理后台..."
    cd admin-frontend
    npm install
    npm run build
    cd ..
    
    log_success "本地构建完成"
}

# 创建U盘部署包
create_usb_package() {
    log_info "创建U盘部署包..."

    # 创建部署包目录
    PACKAGE_DIR="./dswl1-usb-deploy-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$PACKAGE_DIR"

    # 复制项目文件
    log_info "复制项目文件..."
    cp -r backend-node "$PACKAGE_DIR/"
    cp -r admin-frontend "$PACKAGE_DIR/"
    cp -r docs "$PACKAGE_DIR/"
    cp ser.sh "$PACKAGE_DIR/"
    cp init.sql "$PACKAGE_DIR/"
    cp README.md "$PACKAGE_DIR/"

    # 创建必要目录
    mkdir -p "$PACKAGE_DIR/logs"
    mkdir -p "$PACKAGE_DIR/pids"
    mkdir -p "$PACKAGE_DIR/uploads"

    # 复制node_modules (离线部署必需)
    log_info "打包依赖文件..."
    if [ -d "backend-node/node_modules" ]; then
        cp -r backend-node/node_modules "$PACKAGE_DIR/backend-node/"
    fi
    if [ -d "admin-frontend/node_modules" ]; then
        cp -r admin-frontend/node_modules "$PACKAGE_DIR/admin-frontend/"
    fi

    # 创建离线安装脚本
    create_offline_install_script "$PACKAGE_DIR"

    # 创建压缩包
    log_info "创建压缩包..."
    tar -czf "${PACKAGE_DIR}.tar.gz" "$PACKAGE_DIR"

    log_success "U盘部署包创建完成: ${PACKAGE_DIR}.tar.gz"
    log_info "请将 ${PACKAGE_DIR}.tar.gz 复制到U盘，然后在目标服务器上解压并运行 install-offline.sh"
}

# 创建离线安装脚本
create_offline_install_script() {
    local package_dir=$1

    cat > "$package_dir/install-offline.sh" << 'EOF'
#!/bin/bash

# 物流配送管理系统 - 离线安装脚本
# 在目标Linux服务器上运行此脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 获取服务器IP地址
get_server_ip() {
    # 尝试多种方法获取IP
    local ip=""

    # 方法1: 通过hostname -I
    ip=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "")
    if [ -n "$ip" ] && [ "$ip" != "127.0.0.1" ]; then
        echo "$ip"
        return
    fi

    # 方法2: 通过ip route
    ip=$(ip route get 8.8.8.8 2>/dev/null | awk '{print $7; exit}' || echo "")
    if [ -n "$ip" ] && [ "$ip" != "127.0.0.1" ]; then
        echo "$ip"
        return
    fi

    # 方法3: 通过ifconfig
    ip=$(ifconfig 2>/dev/null | grep -E "inet.*broadcast" | awk '{print $2}' | head -1 || echo "")
    if [ -n "$ip" ] && [ "$ip" != "127.0.0.1" ]; then
        echo "$ip"
        return
    fi

    # 默认使用localhost
    echo "localhost"
}

# 检查系统环境
check_system() {
    log_info "检查系统环境..."

    # 检查操作系统
    if ! command -v apt >/dev/null 2>&1 && ! command -v yum >/dev/null 2>&1; then
        log_error "不支持的操作系统，需要Ubuntu/Debian或CentOS/RHEL"
        exit 1
    fi

    # 检查是否为root用户
    if [ "$EUID" -ne 0 ]; then
        log_warning "建议使用root用户运行此脚本"
        log_info "如果遇到权限问题，请使用: sudo $0"
    fi

    log_success "系统环境检查通过"
}

# 安装系统依赖
install_system_deps() {
    log_info "安装系统依赖..."

    if command -v apt >/dev/null 2>&1; then
        # Ubuntu/Debian
        apt update
        apt install -y curl wget gnupg2 software-properties-common mysql-server
    elif command -v yum >/dev/null 2>&1; then
        # CentOS/RHEL
        yum update -y
        yum install -y curl wget mysql-server
    fi

    log_success "系统依赖安装完成"
}

# 安装Node.js
install_nodejs() {
    log_info "检查Node.js..."

    if command -v node >/dev/null 2>&1; then
        local node_version=$(node -v | sed 's/v//')
        local major_version=$(echo $node_version | cut -d. -f1)

        if [ "$major_version" -ge 18 ]; then
            log_success "Node.js版本符合要求: $node_version"
            return
        else
            log_warning "Node.js版本过低: $node_version，需要升级"
        fi
    fi

    log_info "安装Node.js 20..."

    if command -v apt >/dev/null 2>&1; then
        # Ubuntu/Debian
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    elif command -v yum >/dev/null 2>&1; then
        # CentOS/RHEL
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        yum install -y nodejs
    fi

    log_success "Node.js安装完成"
}

# 配置MySQL
setup_mysql() {
    log_info "配置MySQL数据库..."

    # 启动MySQL服务
    systemctl start mysql || systemctl start mysqld || service mysql start
    systemctl enable mysql || systemctl enable mysqld || true

    # 设置root密码
    log_info "设置MySQL root密码为: 123456"
    mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';" 2>/dev/null || \
    mysqladmin -u root password '123456' 2>/dev/null || true

    # 创建数据库
    log_info "创建数据库..."
    mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS logistics_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || {
        log_error "数据库创建失败，请手动执行："
        log_error "mysql -u root -p"
        log_error "CREATE DATABASE IF NOT EXISTS logistics_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        exit 1
    }

    # 导入数据
    log_info "导入初始数据..."
    mysql -u root -p123456 logistics_db < init.sql

    log_success "MySQL配置完成"
}

# 部署应用
deploy_app() {
    log_info "部署应用..."

    # 获取服务器IP
    local server_ip=$(get_server_ip)
    log_info "检测到服务器IP: $server_ip"

    # 设置权限
    chmod +x ser.sh
    chmod -R 755 logs pids uploads

    # 创建后端环境配置
    log_info "创建后端环境配置..."
    cat > backend-node/.env << ENVEOF
# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=123456
DATABASE_NAME=logistics_db

# JWT配置
JWT_SECRET=production-super-secret-jwt-key-2024
JWT_EXPIRES_IN=24h

# 服务配置
PORT=3000
NODE_ENV=production

# 小程序签名密钥
MINIPROGRAM_SIGNATURE_KEY=miniprogram-signature-key-2024

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,gif
UPLOAD_ROOT_PATH=$(pwd)/uploads

# 日志配置
LOG_LEVEL=info
ENVEOF

    # 创建前端环境配置
    log_info "创建前端环境配置..."
    cat > admin-frontend/.env.local << ENVEOF
# API配置
NEXT_PUBLIC_API_BASE_URL=http://${server_ip}:3000
NEXT_PUBLIC_APP_NAME=物流配送管理系统

# 生产配置
NODE_ENV=production
ENVEOF

    log_success "应用配置完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."

    ./ser.sh start all

    sleep 10

    log_info "检查服务状态..."
    ./ser.sh status

    log_success "服务启动完成"
}

# 显示访问信息
show_access_info() {
    local server_ip=$(get_server_ip)

    echo
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  安装完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo
    echo -e "${YELLOW}访问地址：${NC}"
    echo -e "  后端API:     http://${server_ip}:3000"
    echo -e "  API文档:     http://${server_ip}:3000/api"
    echo -e "  管理后台:    http://${server_ip}:3001"
    echo
    echo -e "${YELLOW}默认登录账号：${NC}"
    echo -e "  用户名: admin"
    echo -e "  密码: admin2025"
    echo
    echo -e "${YELLOW}服务管理命令：${NC}"
    echo -e "  启动服务: ./ser.sh start all"
    echo -e "  停止服务: ./ser.sh stop all"
    echo -e "  重启服务: ./ser.sh restart all"
    echo -e "  查看状态: ./ser.sh status"
    echo
}

# 主函数
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  物流配送管理系统 - 离线安装${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo

    check_system
    install_system_deps
    install_nodejs
    setup_mysql
    deploy_app
    start_services
    show_access_info
}

# 运行主函数
main "$@"
EOF

    chmod +x "$package_dir/install-offline.sh"
}

# 主函数
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  物流配送管理系统 - U盘部署包生成${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo

    # 检查参数
    if [ "$1" = "--usb" ] || [ "$1" = "-u" ]; then
        log_info "生成U盘离线部署包..."
        check_local_env
        local_build
        create_usb_package

        echo
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  U盘部署包生成完成！${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo
        echo -e "${YELLOW}使用说明：${NC}"
        echo -e "1. 将生成的 .tar.gz 文件复制到U盘"
        echo -e "2. 在目标Linux服务器上解压文件"
        echo -e "3. 进入解压目录，运行: sudo ./install-offline.sh"
        echo -e "4. 等待安装完成，按提示访问系统"
        echo
    else
        log_error "请使用 --usb 或 -u 参数生成U盘部署包"
        echo
        echo -e "${YELLOW}使用方法：${NC}"
        echo -e "  $0 --usb     # 生成U盘离线部署包"
        echo -e "  $0 -u        # 生成U盘离线部署包（简写）"
        echo
        exit 1
    fi
}

# 运行主函数
main "$@"
