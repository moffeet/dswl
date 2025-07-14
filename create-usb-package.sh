#!/bin/bash

# 物流配送管理系统 - U盘部署包生成脚本
# 专门用于生成离线部署包

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

# 检查环境
check_environment() {
    log_info "检查本地环境..."
    
    if [ ! -f "ser.sh" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm 未安装"
        exit 1
    fi
    
    log_success "环境检查通过"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 构建后端
    log_info "构建后端服务..."
    cd backend-node
    if [ ! -d "node_modules" ]; then
        log_info "安装后端依赖..."
        npm install
    fi
    npm run build
    cd ..
    
    # 构建前端
    log_info "构建管理后台..."
    cd admin-frontend
    if [ ! -d "node_modules" ]; then
        log_info "安装前端依赖..."
        npm install
    fi
    npm run build
    cd ..
    
    log_success "项目构建完成"
}

# 创建部署包
create_package() {
    log_info "创建U盘部署包..."
    
    # 创建部署包目录
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local package_name="dswl1-usb-deploy-${timestamp}"
    local package_dir="./${package_name}"
    
    log_info "创建部署目录: ${package_name}"
    mkdir -p "$package_dir"
    
    # 复制项目文件
    log_info "复制项目文件..."
    
    # 复制后端（包含node_modules和构建产物）
    cp -r backend-node "$package_dir/"
    
    # 复制前端（包含node_modules和构建产物）
    cp -r admin-frontend "$package_dir/"
    
    # 复制其他必要文件
    cp -r docs "$package_dir/" 2>/dev/null || log_warning "docs目录不存在，跳过"
    cp ser.sh "$package_dir/"
    cp init.sql "$package_dir/"
    cp README.md "$package_dir/" 2>/dev/null || log_warning "README.md不存在，跳过"
    cp USB-DEPLOY-GUIDE.md "$package_dir/" 2>/dev/null || log_warning "USB-DEPLOY-GUIDE.md不存在，跳过"
    
    # 创建必要目录
    mkdir -p "$package_dir/logs"
    mkdir -p "$package_dir/pids"
    mkdir -p "$package_dir/uploads/receipts"
    
    # 创建离线安装脚本
    create_install_script "$package_dir"
    
    # 创建使用说明
    create_readme "$package_dir"
    
    # 创建压缩包
    log_info "创建压缩包..."
    tar -czf "${package_name}.tar.gz" "$package_dir"
    
    # 清理临时目录
    rm -rf "$package_dir"
    
    log_success "U盘部署包创建完成: ${package_name}.tar.gz"
    
    # 显示文件信息
    local file_size=$(du -h "${package_name}.tar.gz" | cut -f1)
    log_info "文件大小: ${file_size}"
    log_info "文件路径: $(pwd)/${package_name}.tar.gz"
    
    echo
    echo -e "${YELLOW}使用说明：${NC}"
    echo -e "1. 将 ${package_name}.tar.gz 复制到U盘"
    echo -e "2. 在目标Linux服务器上解压: tar -xzf ${package_name}.tar.gz"
    echo -e "3. 进入目录: cd ${package_name}"
    echo -e "4. 运行安装: sudo ./install-offline.sh"
    echo -e "5. 详细说明请查看: INSTALL-README.md"
}

# 创建离线安装脚本
create_install_script() {
    local package_dir=$1
    
    cat > "$package_dir/install-offline.sh" << 'EOF'
#!/bin/bash

# 物流配送管理系统 - 离线安装脚本

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 获取服务器IP
get_server_ip() {
    local ip=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
    if [ "$ip" = "127.0.0.1" ] || [ -z "$ip" ]; then
        ip=$(ip route get 8.8.8.8 2>/dev/null | awk '{print $7; exit}' || echo "localhost")
    fi
    echo "$ip"
}

# 检查系统
check_system() {
    log_info "检查系统环境..."
    
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用root权限运行: sudo $0"
        exit 1
    fi
    
    if ! command -v systemctl >/dev/null 2>&1; then
        log_error "需要systemd系统"
        exit 1
    fi
    
    log_success "系统检查通过"
}

# 安装依赖
install_dependencies() {
    log_info "安装系统依赖..."
    
    if command -v apt >/dev/null 2>&1; then
        apt update
        apt install -y mysql-server curl wget
    elif command -v yum >/dev/null 2>&1; then
        yum update -y
        yum install -y mysql-server curl wget
    else
        log_error "不支持的操作系统"
        exit 1
    fi
    
    log_success "依赖安装完成"
}

# 安装Node.js
install_nodejs() {
    log_info "检查Node.js..."
    
    if command -v node >/dev/null 2>&1; then
        local version=$(node -v | sed 's/v//' | cut -d. -f1)
        if [ "$version" -ge 18 ]; then
            log_success "Node.js版本符合要求"
            return
        fi
    fi
    
    log_info "安装Node.js 20..."
    if command -v apt >/dev/null 2>&1; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    elif command -v yum >/dev/null 2>&1; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        yum install -y nodejs
    fi
    
    log_success "Node.js安装完成"
}

# 配置MySQL
setup_mysql() {
    log_info "配置MySQL..."
    
    systemctl start mysql || systemctl start mysqld
    systemctl enable mysql || systemctl enable mysqld
    
    # 设置密码
    mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';" 2>/dev/null || \
    mysqladmin -u root password '123456' 2>/dev/null || true
    
    # 创建数据库
    mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS logistics_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    # 导入数据
    mysql -u root -p123456 logistics_db < init.sql
    
    log_success "MySQL配置完成"
}

# 配置应用
setup_application() {
    log_info "配置应用..."
    
    local server_ip=$(get_server_ip)
    log_info "服务器IP: $server_ip"
    
    chmod +x ser.sh
    chmod -R 755 logs pids uploads
    
    # 后端配置
    cat > backend-node/.env << ENVEOF
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=123456
DATABASE_NAME=logistics_db
JWT_SECRET=production-super-secret-jwt-key-2024
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=production
MINIPROGRAM_SIGNATURE_KEY=miniprogram-signature-key-2024
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,gif
UPLOAD_ROOT_PATH=$(pwd)/uploads
LOG_LEVEL=info
ENVEOF

    # 前端配置
    cat > admin-frontend/.env.local << ENVEOF
NEXT_PUBLIC_API_BASE_URL=http://${server_ip}:3000
NEXT_PUBLIC_APP_NAME=物流配送管理系统
NODE_ENV=production
ENVEOF

    log_success "应用配置完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    ./ser.sh start all
    sleep 10
    ./ser.sh status
    
    log_success "服务启动完成"
}

# 显示结果
show_result() {
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
    echo -e "${YELLOW}默认账号：${NC}"
    echo -e "  用户名: admin"
    echo -e "  密码: admin2025"
    echo
}

# 主函数
main() {
    echo -e "${BLUE}物流配送管理系统 - 离线安装${NC}"
    echo
    
    check_system
    install_dependencies
    install_nodejs
    setup_mysql
    setup_application
    start_services
    show_result
}

main "$@"
EOF

    chmod +x "$package_dir/install-offline.sh"
}

# 创建安装说明
create_readme() {
    local package_dir=$1
    
    cat > "$package_dir/INSTALL-README.md" << 'EOF'
# 物流配送管理系统 - 离线安装说明

## 快速安装

```bash
# 1. 解压部署包
tar -xzf dswl1-usb-deploy-*.tar.gz

# 2. 进入目录
cd dswl1-usb-deploy-*

# 3. 运行安装脚本
sudo ./install-offline.sh
```

## 系统要求

- Linux操作系统（Ubuntu/Debian/CentOS/RHEL）
- 至少2GB内存
- 至少5GB磁盘空间
- root权限或sudo权限

## 安装后访问

- 后端API: http://服务器IP:3000
- 管理后台: http://服务器IP:3001
- 默认账号: admin / admin2025

## 服务管理

```bash
./ser.sh start all    # 启动服务
./ser.sh stop all     # 停止服务
./ser.sh restart all  # 重启服务
./ser.sh status       # 查看状态
```

## 故障排除

1. 查看日志: `tail -f logs/backend.log`
2. 检查端口: `netstat -tlnp | grep :3000`
3. 重启服务: `./ser.sh restart all`

如有问题，请查看完整的 USB-DEPLOY-GUIDE.md 文档。
EOF
}

# 主函数
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  物流配送管理系统 - U盘部署包生成${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo
    
    check_environment
    build_project
    create_package
    
    echo
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  部署包生成完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
}

main "$@"
