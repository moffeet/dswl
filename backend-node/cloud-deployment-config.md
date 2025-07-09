# 云服务器部署配置说明

## 问题分析

签收单上传接口在云服务器上出现 "aborted" 错误的主要原因：

1. **网络连接超时**：云服务器网络可能不如本地稳定
2. **文件存储权限**：云服务器文件系统权限配置问题
3. **内存限制**：云服务器内存可能不足以处理大文件
4. **请求超时**：默认超时时间可能不够

## 解决方案

### 1. 环境变量配置

在云服务器上创建 `.env` 文件，添加以下配置：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=wlxt

# JWT配置
JWT_SECRET=your_jwt_secret_key_here

# 服务器配置
PORT=3000
NODE_ENV=production

# 文件上传配置 - 云服务器专用
# 方案1：使用用户目录（推荐）
UPLOAD_ROOT_PATH=/root/uploads

# 方案2：使用临时目录（备选）
# UPLOAD_ROOT_PATH=/tmp/uploads

# 方案3：使用自定义目录
# UPLOAD_ROOT_PATH=/var/www/uploads
```

### 2. 创建上传目录并设置权限

```bash
# 在云服务器上执行以下命令：

# 创建上传目录
sudo mkdir -p /root/uploads/receipts
sudo chown -R $(whoami):$(whoami) /root/uploads
sudo chmod -R 755 /root/uploads

# 或者使用临时目录
sudo mkdir -p /tmp/uploads/receipts
sudo chmod -R 777 /tmp/uploads
```

### 3. 检查磁盘空间

```bash
# 检查磁盘空间
df -h

# 检查目录权限
ls -la /root/
ls -la /tmp/
```

### 4. 增加系统资源限制

如果使用 systemd 或 pm2 管理进程，增加资源限制：

#### 使用 systemd:
```ini
# /etc/systemd/system/wlxt-backend.service
[Unit]
Description=WLXT Backend Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/web/wlxt/backend-node
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
# 增加内存限制
MemoryMax=1G
# 增加文件描述符限制
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

#### 使用 PM2:
```json
{
  "name": "wlxt-backend",
  "script": "dist/main.js",
  "cwd": "/root/web/wlxt/backend-node",
  "env": {
    "NODE_ENV": "production",
    "PORT": "3000"
  },
  "max_memory_restart": "1G",
  "node_args": [
    "--max-old-space-size=1024"
  ]
}
```

### 5. Nginx 配置优化

如果使用 Nginx 代理，增加以下配置：

```nginx
server {
    listen 80;
    server_name your_domain.com;

    client_max_body_size 20M;  # 增加上传文件大小限制
    client_body_timeout 60s;   # 增加请求体超时
    client_header_timeout 60s; # 增加请求头超时
    send_timeout 60s;          # 增加发送超时
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 增加代理超时
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态文件服务
    location /receipts/uploads/ {
        alias /root/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6. 部署步骤

1. **更新代码并构建**：
```bash
cd /root/web/wlxt
git pull origin main
cd backend-node
npm install
npm run build
```

2. **设置环境变量**：
```bash
# 创建 .env 文件
cat > .env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=wlxt
JWT_SECRET=your_jwt_secret_key
PORT=3000
NODE_ENV=production
UPLOAD_ROOT_PATH=/root/uploads
EOF
```

3. **创建上传目录**：
```bash
mkdir -p /root/uploads/receipts
chmod -R 755 /root/uploads
```

4. **重启服务**：
```bash
./ser.sh restart backend
```

### 7. 监控和日志

检查服务状态和日志：

```bash
# 检查服务状态
./ser.sh status

# 查看后端日志
tail -f logs/backend.log

# 查看系统资源使用
htop
df -h
```

### 8. 测试验证

1. **测试文件上传权限**：
```bash
# 在上传目录创建测试文件
touch /root/uploads/test.txt
echo "test" > /root/uploads/test.txt
cat /root/uploads/test.txt
rm /root/uploads/test.txt
```

2. **测试API接口**：
```bash
# 测试健康检查
curl http://localhost:3000/api/health

# 查看 Swagger 文档
curl http://localhost:3000/api
```

## 常见问题解决

### 问题1：权限拒绝
```bash
# 解决方案：修改目录权限
sudo chown -R $(whoami):$(whoami) /root/uploads
sudo chmod -R 755 /root/uploads
```

### 问题2：磁盘空间不足
```bash
# 解决方案：清理磁盘空间
sudo apt clean
sudo journalctl --vacuum-time=7d
docker system prune -a  # 如果使用Docker
```

### 问题3：内存不足
```bash
# 解决方案：增加交换空间
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 问题4：网络超时
- 检查网络连接稳定性
- 增加超时配置（已在代码中实现）
- 考虑使用CDN或文件存储服务

## 性能优化建议

1. **使用专业文件存储**：考虑使用阿里云OSS、腾讯云COS等
2. **启用压缩**：在Nginx中启用gzip压缩
3. **使用CDN**：为静态文件配置CDN加速
4. **监控资源**：设置服务器资源监控和告警 