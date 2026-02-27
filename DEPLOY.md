# 博客系统部署指南

## 目录

- [环境要求](#环境要求)
- [项目架构](#项目架构)
- [部署方式一：Docker Compose（推荐）](#部署方式一docker-compose推荐)
- [部署方式二：手动部署](#部署方式二手动部署)
- [环境变量配置](#环境变量配置)
- [Nginx 反向代理配置](#nginx-反向代理配置)
- [HTTPS 证书配置](#https-证书配置)
- [数据库运维](#数据库运维)
- [CI/CD 流水线](#cicd-流水线)
- [监控与日志](#监控与日志)
- [发版检查清单](#发版检查清单)
- [回滚方案](#回滚方案)
- [常见问题](#常见问题)

---

## 环境要求

| 组件 | 最低版本 | 推荐版本 |
|------|---------|---------|
| Docker | 20.10+ | 24.0+ |
| Docker Compose | 2.0+ | 2.20+ |
| Node.js（手动部署） | 18.x | 20.x LTS |
| Python（手动部署） | 3.10+ | 3.11+ |
| MongoDB | 6.0+ | 7.0 |

**服务器最低配置**：2 核 CPU / 4GB 内存 / 40GB 磁盘

---

## 项目架构

```
                    ┌──────────┐
                    │  Nginx   │ :80 / :443
                    └────┬─────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
    ┌───────▼──────┐     │     ┌──────▼───────┐
    │   Frontend   │     │     │   Backend    │
    │  (Next.js)   │ ────┘     │  (FastAPI)   │
    │   :3000      │           │   :8000      │
    └──────────────┘           └──────┬───────┘
                                      │
                               ┌──────▼───────┐
                               │   MongoDB    │
                               │   :27017     │
                               └──────────────┘
```

---

## 部署方式一：Docker Compose（推荐）

### 1. 准备服务器

```bash
# 安装 Docker（Ubuntu/Debian）
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 验证安装
docker --version
docker compose version
```

### 2. 拉取代码

```bash
git clone <你的仓库地址> /opt/blog
cd /opt/blog
```

### 3. 配置环境变量

```bash
cp .env.example .env
vim .env
```

`.env` 文件内容（**必须修改标记为 [必改] 的项**）：

```env
# [必改] JWT 密钥，使用随机字符串
JWT_SECRET=your-random-secret-key-at-least-32-chars

# [必改] MongoDB 配置（生产环境建议开启认证）
MONGO_URI=mongodb://mongo:27017
DB_NAME=blog

# [可选] Token 有效期（分钟）
ACCESS_TOKEN_EXPIRE_MINUTES=120
REFRESH_TOKEN_EXPIRE_MINUTES=10080

# [必改] 前端 API 地址（Docker 内部通信用服务名）
NEXT_PUBLIC_API_URL=http://backend:8000
```

生成随机密钥：

```bash
openssl rand -hex 32
```

### 4. 构建并启动

```bash
# 构建镜像并后台启动
docker compose up -d --build

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 5. 验证部署

```bash
# 检查后端健康
curl http://localhost:8000/health

# 检查前端
curl -I http://localhost:3000

# 检查 MongoDB 连接
docker compose exec mongo mongosh --eval "db.runCommand({ping:1})"
```

### 6. 更新部署

```bash
cd /opt/blog

# 拉取最新代码
git pull origin main

# 重新构建并启动（零停机滚动更新）
docker compose up -d --build

# 清理旧镜像
docker image prune -f
```

---

## 部署方式二：手动部署

### 1. 安装 MongoDB

```bash
# Ubuntu
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. 部署后端

```bash
cd /opt/blog/backend

# 创建虚拟环境
python3.11 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 创建 .env 文件
cat > .env << 'EOF'
MONGO_URI=mongodb://localhost:27017
DB_NAME=blog
JWT_SECRET=your-random-secret-key-at-least-32-chars
EOF

# 启动（生产环境）
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**使用 systemd 管理后端服务**：

```ini
# /etc/systemd/system/blog-backend.service
[Unit]
Description=Blog Backend API
After=network.target mongod.service

[Service]
Type=exec
User=www-data
WorkingDirectory=/opt/blog/backend
Environment=PATH=/opt/blog/backend/venv/bin:/usr/bin
ExecStart=/opt/blog/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable blog-backend
sudo systemctl start blog-backend
```

### 3. 部署前端

```bash
cd /opt/blog/frontend

# 安装依赖
npm ci

# 设置环境变量
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.production

# 构建生产版本
npm run build

# 启动（生产环境）
npm start
```

**使用 PM2 管理前端服务**：

```bash
npm install -g pm2

# 启动
pm2 start npm --name "blog-frontend" -- start

# 开机自启
pm2 save
pm2 startup
```

---

## 环境变量配置

### 后端环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `MONGO_URI` | 是 | `mongodb://localhost:27017` | MongoDB 连接地址 |
| `DB_NAME` | 否 | `blog` | 数据库名称 |
| `JWT_SECRET` | **是** | - | JWT 签名密钥，生产环境**必须**自定义 |
| `JWT_ALGORITHM` | 否 | `HS256` | JWT 算法 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 否 | `120` | Access Token 有效期 |
| `REFRESH_TOKEN_EXPIRE_MINUTES` | 否 | `10080` | Refresh Token 有效期（默认 7 天） |

### 前端环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `NEXT_PUBLIC_API_URL` | 是 | `http://localhost:8000` | 后端 API 地址 |

---

## Nginx 反向代理配置

```nginx
# /etc/nginx/sites-available/blog
upstream frontend {
    server 127.0.0.1:3000;
}

upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name blog.example.com;

    # 前端页面
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API 直接代理（绕过 Next.js rewrite）
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # API 超时配置
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
        proxy_send_timeout 30s;
    }

    # 静态资源缓存
    location /_next/static/ {
        proxy_pass http://frontend;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # 客户端请求体大小限制（文章内容可能较大）
    client_max_body_size 10M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## HTTPS 证书配置

使用 Let's Encrypt 免费证书：

```bash
# 安装 certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书（自动修改 Nginx 配置）
sudo certbot --nginx -d blog.example.com

# 验证自动续期
sudo certbot renew --dry-run
```

---

## 数据库运维

### MongoDB 认证配置（生产环境必须）

```bash
# 进入 MongoDB Shell
mongosh

# 创建管理员用户
use admin
db.createUser({
  user: "admin",
  pwd: "your-strong-password",
  roles: ["root"]
})

# 创建应用用户
use blog
db.createUser({
  user: "blog_app",
  pwd: "app-password",
  roles: [{ role: "readWrite", db: "blog" }]
})
```

修改 `MONGO_URI` 为认证连接串：

```
MONGO_URI=mongodb://blog_app:app-password@localhost:27017/blog?authSource=blog
```

### 数据备份

```bash
# 手动备份
mongodump --uri="mongodb://localhost:27017" --db=blog --out=/backup/$(date +%Y%m%d)

# 定时备份（crontab -e）
0 3 * * * mongodump --uri="mongodb://localhost:27017" --db=blog --out=/backup/$(date +\%Y\%m\%d) --gzip && find /backup -mtime +30 -delete
```

### 数据恢复

```bash
mongorestore --uri="mongodb://localhost:27017" --db=blog /backup/20260226/blog/
```

---

## CI/CD 流水线

### GitHub Actions 示例

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/blog
            git pull origin main
            docker compose up -d --build
            docker image prune -f
```

所需 GitHub Secrets：

| Secret | 说明 |
|--------|------|
| `SERVER_HOST` | 服务器 IP 或域名 |
| `SERVER_USER` | SSH 用户名 |
| `SERVER_SSH_KEY` | SSH 私钥 |

---

## 监控与日志

### Docker 日志查看

```bash
# 所有服务日志
docker compose logs -f

# 单个服务
docker compose logs -f backend
docker compose logs -f frontend

# 最近 100 行
docker compose logs --tail=100 backend
```

### 健康检查

在 `docker-compose.yml` 中添加健康检查（已内置）：

```bash
# 手动检查
curl http://localhost:8000/health        # 后端
curl -I http://localhost:3000            # 前端
docker compose exec mongo mongosh --eval "db.runCommand({ping:1})"  # MongoDB
```

### 磁盘/资源监控

```bash
# Docker 资源使用
docker stats

# 磁盘使用
df -h
docker system df
```

---

## 发版检查清单

### 发版前

- [ ] 代码已合并到 `main` 分支并通过 Code Review
- [ ] 本地 `npm run build` 构建成功，无 TypeScript 错误
- [ ] 后端 API 测试通过
- [ ] 环境变量已更新（如有新增）
- [ ] 数据库 Migration 已准备（如有 Schema 变更）
- [ ] `JWT_SECRET` 已设置为强密钥（非默认值）
- [ ] MongoDB 已开启认证（生产环境）

### 发版中

- [ ] 备份当前数据库：`mongodump --db=blog --out=/backup/pre-release-$(date +%Y%m%d)`
- [ ] 记录当前版本：`git log -1 --format="%H" > /opt/blog/.current-version`
- [ ] 拉取最新代码：`git pull origin main`
- [ ] 构建并部署：`docker compose up -d --build`
- [ ] 查看启动日志：`docker compose logs -f`（等待所有服务 healthy）

### 发版后

- [ ] 验证首页可访问：`curl -I http://your-domain.com`
- [ ] 验证 API 可用：`curl http://your-domain.com/api/posts`
- [ ] 验证用户登录功能
- [ ] 验证文章创建/编辑功能
- [ ] 验证搜索功能
- [ ] 检查错误日志：`docker compose logs --tail=50 backend | grep ERROR`
- [ ] 通知团队发版完成

---

## 回滚方案

```bash
cd /opt/blog

# 1. 查看回滚目标版本
git log --oneline -10

# 2. 回滚到指定版本
git checkout <commit-hash>

# 3. 重新构建并部署
docker compose up -d --build

# 4. 如需恢复数据库
mongorestore --uri="mongodb://localhost:27017" --db=blog --drop /backup/pre-release-20260226/blog/
```

---

## 常见问题

### Q: `docker compose up` 报端口被占用

```bash
# 查找占用端口的进程
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:8000 | xargs kill -9
```

### Q: 前端访问后端 API 报 CORS 错误

检查 Nginx 配置是否将 `/api/` 直接代理到后端，而非经过 Next.js rewrite。生产环境推荐 Nginx 直接代理 API 请求。

### Q: MongoDB 连接失败

```bash
# 检查 MongoDB 服务状态
docker compose logs mongo

# Docker 环境中确认服务名
docker compose exec backend python -c "from app.config import settings; print(settings.MONGO_URI)"
```

### Q: 构建内存不足（Next.js build OOM）

```bash
# 增加 Node.js 内存限制
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

在 Dockerfile 中添加：

```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=4096"
```
