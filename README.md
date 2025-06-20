# 物流配送管理系统

基于 NestJS + Next.js + MySQL 的物流配送管理系统，包含后端服务、管理后台和小程序前端三个模块。

## 🚀 快速启动

### 环境要求

- **Node.js**: >= 18.18.0 (推荐使用 v20.x)
- **MySQL**: >= 5.7 或 8.0+
- **npm**: >= 8.0.0

### 服务管理

使用 `ser.sh` 脚本管理所有服务：

```bash
# 基本用法
./ser.sh                    # 显示帮助信息
./ser.sh status            # 查看服务状态

# 启动服务
./ser.sh start all         # 启动所有服务
./ser.sh start backend     # 只启动后端
./ser.sh start admin       # 只启动管理后台
./ser.sh start frontend    # 只启动小程序前端

# 停止服务
./ser.sh stop all          # 停止所有服务
./ser.sh stop backend      # 只停止后端
./ser.sh stop admin        # 只停止管理后台
./ser.sh stop frontend     # 只停止小程序前端

# 重启服务
./ser.sh restart all       # 重启所有服务
./ser.sh restart backend   # 只重启后端
./ser.sh restart admin     # 只重启管理后台
./ser.sh restart frontend  # 只重启小程序前端
```

### 兼容性脚本

```bash
./start-dev.sh      # 启动开发环境 (等同于 ./ser.sh start all)
./stop-dev.sh       # 停止开发环境 (等同于 ./ser.sh stop all)
./start-prod.sh     # 启动生产环境
./stop-prod.sh      # 停止生产环境
```

## 📱 访问地址

启动成功后可以访问：

| 服务 | 地址 | 说明 |
|------|------|------|
| **后端API** | http://localhost:3000 | 后端服务主地址 |
| **API文档** | http://localhost:3000/api | Swagger API文档 |
| **管理后台** | http://localhost:3001 | 管理员操作界面 |
| **小程序前端** | http://localhost:3002 | 小程序开发预览 |

## 🏗️ 技术架构

### 整体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   小程序前端     │    │   管理后台       │    │   后端API       │
│  (Next.js 15)   │    │  (Next.js 15)   │    │   (NestJS 10)   │
│   端口: 3002     │    │   端口: 3001     │    │   端口: 3000     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                │
                    ┌─────────────────┐
                    │   MySQL 8.0     │
                    │   (数据存储)     │
                    └─────────────────┘
```

### 技术栈

#### 后端服务 (backend-node)
- **框架**: NestJS 10.x + TypeScript 5.x
- **数据库**: MySQL 8.0 + TypeORM 0.3.x
- **认证**: JWT + bcrypt + CASL权限控制
- **API文档**: Swagger/OpenAPI 3.0
- **文件上传**: Multer + 本地存储

#### 管理后台 (admin-frontend)
- **框架**: Next.js 15.3.4 + Turbopack
- **UI库**: Arco Design + TailwindCSS 3.x
- **状态管理**: React Hooks + Axios
- **表单**: React Hook Form

#### 小程序前端 (frontend)
- **框架**: Next.js 15.3.4 + 响应式设计
- **地图**: 高德地图 Web API
- **多媒体**: Web API (相机 + 地理位置)

## 📂 项目结构

```
wlxt/
├── backend-node/           # NestJS 后端服务 (端口 3000)
├── admin-frontend/         # Next.js 管理后台 (端口 3001)
├── frontend/              # Next.js 小程序前端 (端口 3002)
├── ser.sh                # 服务管理脚本 (主脚本)
├── start-dev.sh          # 开发环境启动 (兼容性)
├── stop-dev.sh           # 开发环境停止 (兼容性)
├── start-prod.sh         # 生产环境启动
├── stop-prod.sh          # 生产环境停止
├── init.sql              # 数据库初始化脚本
├── logs/                 # 运行日志目录
└── pids/                 # 进程ID管理目录
```

## 🔐 默认账号

### 管理后台登录
- **用户名**: `admin`
- **密码**: `admin123`

### 测试司机账号
- 张三：13800000001
- 李四：13800000002
- 王五：13800000003

## 📋 数据库配置

```javascript
// 默认配置 (backend-node/src/config/database.config.ts)
{
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '123456',
  database: 'delivery_system'
}
```

### 快速初始化数据库
```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS delivery_system"

# 导入初始化脚本
mysql -u root -p delivery_system < init.sql
```

## 🚨 快速部署

### 1. 克隆代码
```bash
git clone <项目仓库地址>
cd wlxt
```

### 2. 安装依赖
```bash
# 安装所有依赖
cd backend-node && npm install && cd ..
cd admin-frontend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 3. 启动服务
```bash
# 一键启动所有服务
./ser.sh start all

# 查看服务状态
./ser.sh status
```

## 🔧 常见问题

### Node.js 版本要求
```bash
# 检查版本
node --version  # 需要 >= 18.18.0

# 使用 nvm 升级
nvm install 20 && nvm use 20 && nvm alias default 20
```

### 端口冲突
```bash
# 停止所有服务
./ser.sh stop all

# 查看服务状态
./ser.sh status
```

### 依赖问题
```bash
# 清理重新安装
cd 目标目录
rm -rf node_modules package-lock.json
npm install
```

## 📞 支持与文档

### 运行日志
- 后端日志: `logs/backend.log`
- 管理后台日志: `logs/admin.log`
- 小程序前端日志: `logs/frontend.log`

### 详细文档
- [模块功能说明](./模块功能说明.md) - 完整的技术架构和功能介绍
- [部署启动指南](./部署启动指南.md) - 详细的部署和配置说明
- [项目报价方案](./项目报价方案.md) - 项目模块和开发计划

## 🎯 核心功能

### 管理后台功能
- ✅ **客户管理**: 客户信息CRUD、搜索筛选、批量操作
- ✅ **用户管理**: 用户账号管理、权限分配
- ✅ **角色权限**: 基于RBAC的细粒度权限控制
- ✅ **司机管理**: 司机信息管理和车辆配置
- ✅ **打卡记录**: 配送记录查看、图片预览
- ✅ **数据统计**: 业务数据分析和报表

### 小程序端功能
- ✅ **身份认证**: 微信登录、手机号获取、司机验证
- ✅ **客户搜索**: 支持编号/姓名/地址模糊搜索
- ✅ **导航功能**: 高德地图多目的地路线规划
- ✅ **拍照打卡**: 地理位置获取、图片上传
- ✅ **新增客户**: 销售人员添加新客户功能

---

**🚀 快速开始**: 运行 `./ser.sh start all` 即可启动整个系统！ 