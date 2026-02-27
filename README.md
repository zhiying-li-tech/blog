# 博客系统

全栈博客系统，支持文章增删查改、全文搜索、Markdown 编写、SSR 渲染。

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 + React 18 + Ant Design 5 + Sass |
| 后端 | FastAPI + Beanie (MongoDB ODM) |
| 数据库 | MongoDB 7 |
| 部署 | Docker Compose |

---

## 快速开始

### 方式一：Docker Compose 一键启动（推荐）

**前提条件：** 已安装 [Docker](https://docs.docker.com/get-docker/) 和 Docker Compose。

```bash
# 1. 克隆项目
cd blog

# 2. 一键启动所有服务（MongoDB + 后端 + 前端）
docker compose up --build

# 后台运行
docker compose up --build -d
```

启动完成后：

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:3000 |
| 后端 API | http://localhost:8000 |
| API 文档 (Swagger) | http://localhost:8000/docs |
| MongoDB | localhost:27017 |

```bash
# 停止服务
docker compose down

# 停止并清除数据
docker compose down -v
```

---

### 方式二：本地开发（分别启动）

#### 1. 启动 MongoDB

需要本地安装 MongoDB，或用 Docker 单独运行：

```bash
# 用 Docker 启动 MongoDB
docker run -d --name blog-mongo -p 27017:27017 mongo:7
```

#### 2. 启动后端

```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate   # macOS / Linux
# venv\Scripts\activate    # Windows

# 安装依赖
pip install -r requirements.txt

# （可选）创建 .env 文件自定义配置
cat > .env << 'EOF'
MONGO_URI=mongodb://localhost:27017
DB_NAME=blog
JWT_SECRET=your-secret-key-here
EOF

# 启动服务（开发模式，自动热重载）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端启动成功后：
- API 服务：http://localhost:8000
- Swagger 文档：http://localhost:8000/docs
- ReDoc 文档：http://localhost:8000/redoc
- 健康检查：http://localhost:8000/health

#### 3. 启动前端

```bash
# 新开一个终端，进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务（自动热重载）
npm run dev
```

前端启动成功后：
- 页面地址：http://localhost:3000
- 前端通过 Next.js rewrites 自动将 `/api/*` 请求代理到 `http://localhost:8000`

---

## 环境变量说明

### 后端（backend/.env）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB 连接地址 |
| `DB_NAME` | `blog` | 数据库名称 |
| `JWT_SECRET` | `super-secret-change-me` | JWT 签名密钥（**生产环境必须修改**） |
| `JWT_ALGORITHM` | `HS256` | JWT 签名算法 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `120` | Access Token 有效期（分钟） |
| `REFRESH_TOKEN_EXPIRE_MINUTES` | `10080` | Refresh Token 有效期（分钟，默认 7 天） |

### 前端

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | 后端 API 地址（SSR 服务端请求用） |

---

## 项目结构

```
blog/
├── backend/                    # Python FastAPI 后端
│   ├── app/
│   │   ├── main.py             # 入口：CORS、限流、路由注册
│   │   ├── config.py           # 环境变量配置
│   │   ├── database.py         # MongoDB 连接初始化
│   │   ├── models/             # Beanie Document 模型
│   │   ├── schemas/            # Pydantic 请求/响应模型
│   │   ├── routes/             # API 路由（auth/users/posts/categories/tags）
│   │   ├── services/           # 业务逻辑层
│   │   ├── middleware/         # JWT 认证 + 限流中间件
│   │   └── utils/              # 密码哈希、JWT、slug 生成
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # Next.js 前端
│   ├── src/
│   │   ├── app/                # App Router 页面
│   │   ├── components/         # 可复用组件（Header/Footer/PostCard/SearchBar）
│   │   ├── lib/                # API 客户端、认证工具、常量
│   │   ├── stores/             # Zustand 状态管理
│   │   ├── styles/             # Sass 样式（CSS Modules）
│   │   └── types/              # TypeScript 类型定义
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml          # 一键部署编排
├── PRD.md                      # 产品需求文档
└── README.md
```

---

## API 接口概览

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册（返回 user + tokens） |
| POST | `/api/auth/login` | 登录（返回 user + tokens） |
| POST | `/api/auth/refresh` | 刷新 Token |

### 文章

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/posts` | 文章列表（支持分页/分类/标签/作者筛选） |
| GET | `/api/posts/:slug` | 文章详情 |
| POST | `/api/posts` | 创建文章（需登录） |
| PUT | `/api/posts/:slug` | 更新文章（需作者/管理员） |
| DELETE | `/api/posts/:slug` | 删除文章（软删除） |
| GET | `/api/posts/search?q=` | 全文搜索 |
| GET | `/api/posts/search/suggest?q=` | 搜索建议 |

### 分类 & 标签

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/categories` | 分类列表（含文章数量） |
| POST | `/api/categories` | 创建分类（需管理员） |
| GET | `/api/tags` | 标签列表 |
| POST | `/api/tags` | 创建标签（需登录） |

### 用户

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users/me` | 获取当前用户信息 |
| PUT | `/api/users/me` | 更新个人信息 |
| PUT | `/api/users/me/password` | 修改密码 |

完整交互式文档启动后端后访问 http://localhost:8000/docs

---

## 常用操作

### 创建管理员账号

注册后默认角色为 `author`，需要通过 MongoDB 手动提升：

```bash
# 进入 MongoDB
docker exec -it blog-mongo mongosh blog

# 将用户提升为管理员
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

### 创建初始分类和标签

使用管理员 Token 调用 API：

```bash
# 登录获取 token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['tokens']['access_token'])")

# 创建分类
curl -X POST http://localhost:8000/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "技术", "description": "技术文章"}'

curl -X POST http://localhost:8000/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "生活", "description": "生活随笔"}'

# 创建标签
curl -X POST http://localhost:8000/api/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Python"}'

curl -X POST http://localhost:8000/api/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "React"}'
```

---

## 开发注意事项

1. **JWT 密钥**：生产环境务必修改 `JWT_SECRET`，使用随机长字符串
2. **MongoDB 索引**：首次启动时 Beanie 会自动创建索引（包括全文搜索索引）
3. **前端代理**：开发环境下 Next.js rewrites 将 `/api/*` 代理到后端，无需处理跨域
4. **SSR 页面**：首页、文章详情、搜索结果页使用 Server Component 服务端渲染，SEO 友好
5. **CSR 页面**：编辑器、登录/注册、个人中心使用 Client Component 客户端渲染
