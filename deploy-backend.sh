#!/bin/bash

SERVER_IP="49.235.60.148"
SERVER_USER="root"
BACKEND_DIR="/root/web/wlxt/backend"

echo "🚀 开始部署后端..."

# 1. 清理并创建后端目录
ssh $SERVER_USER@$SERVER_IP "rm -rf $BACKEND_DIR && mkdir -p $BACKEND_DIR"

# 2. 上传必要文件
echo "📦 上传后端文件..."
scp -r backend-node/dist/ $SERVER_USER@$SERVER_IP:$BACKEND_DIR/
scp backend-node/package.json $SERVER_USER@$SERVER_IP:$BACKEND_DIR/
scp backend-node/package-lock.json $SERVER_USER@$SERVER_IP:$BACKEND_DIR/

# 3. 在服务器上安装生产依赖
echo "📋 安装后端依赖..."
ssh $SERVER_USER@$SERVER_IP "cd $BACKEND_DIR && npm install --production"

# 4. 创建启动脚本
ssh $SERVER_USER@$SERVER_IP "cat > $BACKEND_DIR/start.sh << 'EOF'
#!/bin/bash
cd $BACKEND_DIR
export NODE_ENV=production
export DATABASE_HOST=localhost
export DATABASE_PORT=3306
export DATABASE_USERNAME=root
export DATABASE_PASSWORD=123456
export DATABASE_NAME=logistics_db

# 停止现有进程
pkill -f 'node.*main.js' || true

# 启动新进程
nohup node dist/main.js > backend.log 2>&1 &
echo \$! > backend.pid

echo \"后端服务已启动，PID: \$(cat backend.pid)\"
echo \"日志文件: backend.log\"
EOF"

# 5. 给启动脚本执行权限
ssh $SERVER_USER@$SERVER_IP "chmod +x $BACKEND_DIR/start.sh"

echo "✅ 后端部署完成！" 