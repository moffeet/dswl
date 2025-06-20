# 物流配送管理系统

基于 NestJS + Next.js + MySQL 的物流配送管理系统，包含后端服务、管理后台和小程序前端三个模块。

## 🚀 快速启动

### 环境要求

- **Node.js**: >= 20.0.0 (推荐使用 v20.19.2)
- **MySQL**: >= 5.7
- **npm**: >= 8.0.0

### 一键启动

```bash
# 启动开发环境
./start-dev.sh

# 停止开发环境
./stop-dev.sh
```

### 手动启动

如果一键启动失败，可以按以下步骤手动启动：

#### 1. 检查 Node.js 版本

```bash
node --version  # 应显示 v20.x.x
```

如果版本过低，使用 nvm 升级：

```bash
nvm install 20
nvm use 20
nvm alias default 20
```

#### 2. 清理端口和进程

```bash
# 清理所有相关进程
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "npm run start:dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "ts-node" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

# 清理端口占用
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
lsof -ti :3002 | xargs kill -9 2>/dev/null || true
```

#### 3. 数据库初始化

```bash
# 启动 MySQL 服务
brew services start mysql

# 初始化数据库
mysql -u root -p123456 < init.sql
```

#### 4. 安装依赖

```bash
# 后端依赖
cd backend-node
rm -rf node_modules package-lock.json
npm install
cd ..

# 管理后台依赖
cd admin-frontend  
rm -rf node_modules package-lock.json
npm install
cd ..

# 小程序前端依赖
cd frontend
rm -rf node_modules package-lock.json
npm install
cd ..
```

#### 5. 启动服务

在不同终端窗口中启动各个服务：

```bash
# 终端1: 启动后端服务
cd backend-node
npm run build
npm start
# 或开发模式: npm run start:dev

# 终端2: 启动管理后台
cd admin-frontend
npm run dev -- --port 3001

# 终端3: 启动小程序前端  
cd frontend
npm run dev -- --port 3002
```

## 📱 访问地址

启动成功后可以访问：

- **后端API**: http://localhost:3000
- **API文档**: http://localhost:3000/api
- **管理后台**: http://localhost:3001
- **小程序前端**: http://localhost:3002

## 🔧 常见问题

### Node.js 版本错误

```bash
# 错误：You are using Node.js 16.x.x. For Next.js, Node.js version "^18.18.0 || ^19.8.0 || >= 20.0.0" is required.

# 解决方案：
nvm install 20
nvm use 20
nvm alias default 20
node --version  # 验证版本
```

### 端口被占用

```bash
# 查看端口占用
lsof -i :3000 -i :3001 -i :3002

# 强制清理端口
./stop-dev.sh
```

### 依赖安装失败

```bash
# 方案1: 清理重新安装
cd 目标目录
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 方案2: 使用国内镜像
npm config set registry https://registry.npmmirror.com
npm install

# 方案3: 取消代理
unset http_proxy https_proxy all_proxy
npm install
```

### 后端服务启动失败

```bash
# 如果 nodemon 报错，使用编译后启动
cd backend-node
npm run build
PORT=3000 node dist/main.js
```

### 前端服务启动失败

```bash
# 如果出现 "sh: next: command not found"
cd admin-frontend  # 或 frontend
rm -rf node_modules package-lock.json
npm install
npm run dev -- --port 对应端口
```

### 数据库连接失败

```bash
# 检查 MySQL 服务
brew services list | grep mysql
brew services start mysql

# 测试连接
mysql -u root -p123456 -e "SELECT 1;"

# 重新初始化数据库
mysql -u root -p123456 delivery_system < init.sql
```

## 📂 项目结构

```
wlxt/
├── backend-node/           # NestJS 后端服务
├── admin-frontend/         # Next.js 管理后台
├── frontend/              # Next.js 小程序前端
├── init.sql              # 数据库初始化脚本
├── start-dev.sh          # 开发环境启动脚本
├── stop-dev.sh           # 开发环境停止脚本
├── start-prod.sh         # 生产环境启动脚本
├── stop-prod.sh          # 生产环境停止脚本
└── logs/                 # 运行日志目录
```

## ⚙️ 技术栈

- **后端**: NestJS + TypeScript + MySQL + TypeORM
- **管理后台**: Next.js + React + Arco Design + TailwindCSS
- **小程序前端**: Next.js + React + TailwindCSS
- **数据库**: MySQL 5.7+

## 🔐 默认账号

- **管理员**: admin / admin123
- **测试司机**: 13800000001, 13800000002, 13800000003

## 📋 数据库配置

```javascript
// 默认配置
host: 'localhost'
port: 3306
username: 'root'
password: '123456'
database: 'delivery_system'
```

## 🚨 重要提示

1. **启动顺序**: 必须先启动后端服务，再启动前端服务
2. **端口冲突**: 如遇端口冲突，请先运行 `./stop-dev.sh` 清理
3. **代理问题**: 如有网络代理，建议启动前取消代理设置
4. **依赖问题**: 首次运行建议清理重新安装所有依赖
5. **版本要求**: Node.js 必须 >= 18.18.0，推荐使用 v20.x.x

## 📞 支持

如遇问题，请查看日志文件：
- 后端日志: `logs/backend.log`
- 管理后台日志: `logs/admin.log`
- 小程序前端日志: `logs/frontend.log`

或参考详细的 [部署启动指南.md](./部署启动指南.md)

## 📚 更多文档

- [详细部署启动指南](./部署启动指南.md) - 完整的环境配置和部署说明
- [项目报价方案](./项目报价方案.md) - 项目功能模块和开发计划

---

**快速开始**: 直接运行 `./start-dev.sh` 即可启动整个系统！ 