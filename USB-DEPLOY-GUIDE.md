# 💾 U盘离线部署指南

## 📋 概述

本指南适用于无法联网的Linux服务器环境，通过U盘进行离线部署。

## 🎯 适用场景

- 老板的Linux服务器无法连接互联网
- 内网环境，无法直接下载依赖
- 安全要求较高的生产环境
- 需要快速部署的场景

## 📦 准备U盘部署包

### 1. 在开发环境生成部署包

```bash
# 确保项目已完整构建
cd /Users/apple/Documents/work/dswl/1/dswl1

# 生成U盘部署包
./deploy.sh --usb
```

### 2. 部署包内容

生成的部署包包含：
```
dswl1-usb-deploy-YYYYMMDD-HHMMSS/
├── backend-node/              # 后端服务（含node_modules）
├── admin-frontend/            # 前端服务（含node_modules）
├── docs/                      # 系统文档
├── ser.sh                     # 服务管理脚本
├── init.sql                   # 数据库初始化脚本
├── install-offline.sh         # 离线安装脚本 ⭐
├── logs/                      # 日志目录
├── pids/                      # 进程ID目录
└── uploads/                   # 文件上传目录
```

### 3. 复制到U盘

```bash
# 将生成的 .tar.gz 文件复制到U盘
cp dswl1-usb-deploy-*.tar.gz /path/to/usb/
```

## 🖥️ 在目标Linux服务器部署

### 1. 插入U盘并挂载

```bash
# 查看U盘设备
lsblk

# 挂载U盘（假设设备为 /dev/sdb1）
sudo mkdir -p /mnt/usb
sudo mount /dev/sdb1 /mnt/usb
```

### 2. 解压部署包

```bash
# 复制部署包到服务器
cp /mnt/usb/dswl1-usb-deploy-*.tar.gz /tmp/

# 解压
cd /tmp
tar -xzf dswl1-usb-deploy-*.tar.gz

# 进入解压目录
cd dswl1-usb-deploy-*
```

### 3. 运行离线安装脚本

```bash
# 使用root权限运行安装脚本
sudo ./install-offline.sh
```

### 4. 安装过程说明

安装脚本会自动执行以下步骤：

1. **检查系统环境** - 验证操作系统兼容性
2. **安装系统依赖** - 安装MySQL等必要软件
3. **安装Node.js** - 安装Node.js 20.x版本
4. **配置MySQL** - 创建数据库并导入初始数据
5. **部署应用** - 配置环境变量和权限
6. **启动服务** - 启动后端和前端服务

## 🔧 手动安装步骤（备用方案）

如果自动安装脚本失败，可以手动执行：

### 1. 安装系统依赖

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y curl wget mysql-server

# CentOS/RHEL
sudo yum update -y
sudo yum install -y curl wget mysql-server
```

### 2. 安装Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### 3. 配置MySQL

```bash
# 启动MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 设置root密码
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';"

# 创建数据库
mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS logistics_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 导入数据
mysql -u root -p123456 logistics_db < init.sql
```

### 4. 配置应用

```bash
# 设置权限
chmod +x ser.sh
chmod -R 755 logs pids uploads

# 获取服务器IP（用于前端配置）
SERVER_IP=$(hostname -I | awk '{print $1}')

# 创建后端环境配置
cat > backend-node/.env << EOF
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
EOF

# 创建前端环境配置
cat > admin-frontend/.env.local << EOF
NEXT_PUBLIC_API_BASE_URL=http://${SERVER_IP}:3000
NEXT_PUBLIC_APP_NAME=物流配送管理系统
NODE_ENV=production
EOF
```

### 5. 启动服务

```bash
# 启动所有服务
./ser.sh start all

# 检查服务状态
./ser.sh status
```

## 🔍 验证部署

### 1. 检查服务状态

```bash
# 查看服务状态
./ser.sh status

# 查看端口占用
netstat -tlnp | grep :3000
netstat -tlnp | grep :3001
```

### 2. 访问系统

```bash
# 获取服务器IP
hostname -I

# 访问地址：
# 后端API: http://服务器IP:3000
# API文档: http://服务器IP:3000/api
# 管理后台: http://服务器IP:3001
```

### 3. 测试登录

- **用户名**: `admin`
- **密码**: `admin2025`

## 🚨 常见问题解决

### 1. Node.js安装失败

```bash
# 手动下载Node.js二进制包
wget https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz
tar -xf node-v20.11.0-linux-x64.tar.xz
sudo mv node-v20.11.0-linux-x64 /opt/nodejs
sudo ln -s /opt/nodejs/bin/node /usr/local/bin/node
sudo ln -s /opt/nodejs/bin/npm /usr/local/bin/npm
```

### 2. MySQL连接失败

```bash
# 重置MySQL密码
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';
FLUSH PRIVILEGES;
EXIT;
```

### 3. 端口被占用

```bash
# 查找占用端口的进程
sudo lsof -i :3000
sudo lsof -i :3001

# 杀死进程
sudo kill -9 <PID>
```

### 4. 权限问题

```bash
# 修复权限
sudo chown -R $(whoami):$(whoami) .
chmod +x ser.sh
chmod -R 755 logs pids uploads
```

## 📝 部署后维护

### 日常操作命令

```bash
# 启动服务
./ser.sh start all

# 停止服务
./ser.sh stop all

# 重启服务
./ser.sh restart all

# 查看状态
./ser.sh status

# 查看日志
tail -f logs/backend.log
tail -f logs/admin.log
```

### 备份重要数据

```bash
# 备份数据库
mysqldump -u root -p123456 logistics_db > backup_$(date +%Y%m%d).sql

# 备份上传文件
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## 📞 技术支持

如果在部署过程中遇到问题：

1. 检查 `logs/` 目录下的日志文件
2. 运行 `./ser.sh status` 查看服务状态
3. 确认防火墙设置允许3000和3001端口
4. 验证数据库连接和权限设置

---

**重要提醒**: 
- 确保目标服务器有足够的磁盘空间（至少5GB）
- 建议使用root用户或具有sudo权限的用户进行安装
- 安装完成后记录服务器IP地址，用于后续访问
