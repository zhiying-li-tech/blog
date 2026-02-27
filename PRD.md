# 博客系统 PRD（产品需求文档）

> 版本：v1.0  
> 日期：2026-02-26  
> 技术栈：Python (FastAPI) + Next.js (React SSR) + Ant Design + Sass + MongoDB

---

## 一、项目概述

### 1.1 项目背景

构建一个现代化的个人/多人博客系统，支持文章的增删查改（CRUD）以及全文搜索功能。系统采用前后端分离架构，后端使用 Python 提供 RESTful API，前端使用 React 自建 SSR（基于 Express + ReactDOMServer）实现良好的 SEO 和首屏加载性能，UI 层采用 Ant Design 组件库，样式使用 Sass 预处理器，数据库使用 MongoDB 存储非结构化的博客内容。

### 1.2 项目目标

| 目标 | 描述 |
|------|------|
| 功能完整 | 支持博客文章的完整生命周期管理（创建、查看、编辑、删除、搜索） |
| 性能优良 | SSR 保障首屏加载速度 < 1.5s，API 响应时间 < 200ms |
| SEO 友好 | 服务端渲染确保搜索引擎可正确抓取博客内容 |
| 易于扩展 | 模块化设计，便于后续功能迭代 |

### 1.3 用户角色

| 角色 | 描述 |
|------|------|
| 访客（Visitor） | 未登录用户，可浏览文章、搜索文章 |
| 作者（Author） | 已登录用户，可创建、编辑、删除自己的文章 |
| 管理员（Admin） | 系统管理员，可管理所有文章和用户 |

---

## 二、功能需求

### 2.1 功能总览

```
博客系统
├── 用户模块
│   ├── 注册
│   ├── 登录 / 登出
│   └── 个人信息管理
├── 文章模块
│   ├── 创建文章
│   ├── 查看文章（详情 + 列表）
│   ├── 编辑文章
│   ├── 删除文章
│   └── 搜索文章
├── 分类与标签模块
│   ├── 分类管理（CRUD）
│   └── 标签管理（CRUD）
└── 系统模块
    ├── 仪表盘（文章统计）
    └── 系统设置
```

### 2.2 用户模块

#### 2.2.1 注册

| 项目 | 描述 |
|------|------|
| 功能描述 | 新用户通过邮箱和密码注册账号 |
| 输入字段 | 用户名（必填，3-20字符）、邮箱（必填，唯一）、密码（必填，≥8字符） |
| 业务规则 | 邮箱不可重复；密码需包含字母和数字；注册成功后自动登录 |
| 输出 | 返回 JWT Token，跳转至首页 |

#### 2.2.2 登录 / 登出

| 项目 | 描述 |
|------|------|
| 功能描述 | 用户通过邮箱和密码登录系统 |
| 认证方式 | JWT（Access Token + Refresh Token） |
| Token 有效期 | Access Token: 2小时；Refresh Token: 7天 |
| 登出逻辑 | 前端清除本地 Token，后端将 Refresh Token 加入黑名单 |

#### 2.2.3 个人信息管理

| 项目 | 描述 |
|------|------|
| 可编辑字段 | 用户名、头像（URL）、个人简介 |
| 密码修改 | 需验证旧密码后方可修改 |

### 2.3 文章模块（核心）

#### 2.3.1 创建文章

| 项目 | 描述 |
|------|------|
| 功能描述 | 已登录用户创建新的博客文章 |
| 权限 | Author / Admin |
| 输入字段 | 标题（必填，≤100字符）、内容（必填，Markdown 格式）、摘要（选填，≤300字符，留空则自动截取内容前200字）、封面图（选填，URL）、分类（单选）、标签（多选，≤5个）、状态（草稿 / 已发布） |
| 业务规则 | 自动生成 URL-friendly 的 slug；记录创建时间和更新时间；草稿仅作者本人可见 |

#### 2.3.2 查看文章

**文章列表页**

| 项目 | 描述 |
|------|------|
| 功能描述 | 分页展示已发布的文章列表 |
| 权限 | 所有用户 |
| 展示字段 | 标题、摘要、封面图、作者、发布时间、分类、标签、阅读量 |
| 分页 | 每页 10 篇，支持上/下一页和页码跳转 |
| 排序 | 默认按发布时间倒序，支持按阅读量排序 |
| 筛选 | 支持按分类、标签筛选 |

**文章详情页**

| 项目 | 描述 |
|------|------|
| 功能描述 | 展示单篇文章的完整内容 |
| 展示字段 | 标题、内容（Markdown 渲染为 HTML）、作者信息、发布时间、更新时间、分类、标签、阅读量 |
| 附加功能 | 自动生成文章目录（TOC）；代码块语法高亮；每次访问阅读量 +1 |
| SEO | SSR 渲染完整 HTML；自动生成 meta description 和 Open Graph 标签 |

#### 2.3.3 编辑文章

| 项目 | 描述 |
|------|------|
| 功能描述 | 修改已有文章的内容和元信息 |
| 权限 | 仅文章作者或 Admin |
| 可编辑字段 | 同创建文章的所有字段 |
| 业务规则 | 自动更新 `updatedAt` 时间戳；编辑不影响阅读量 |

#### 2.3.4 删除文章

| 项目 | 描述 |
|------|------|
| 功能描述 | 删除指定文章 |
| 权限 | 仅文章作者或 Admin |
| 删除方式 | 软删除（标记 `isDeleted: true`），管理员可物理删除 |
| 确认机制 | 前端弹窗二次确认 |

#### 2.3.5 搜索文章

| 项目 | 描述 |
|------|------|
| 功能描述 | 根据关键词搜索已发布的文章 |
| 搜索范围 | 标题、内容、标签 |
| 搜索方式 | MongoDB Atlas Search（全文索引）或 MongoDB text index |
| 结果展示 | 关键词高亮、匹配度排序 |
| 分页 | 每页 10 条，同文章列表 |
| 搜索建议 | 输入时实时提供搜索建议（debounce 300ms） |

### 2.4 分类与标签模块

#### 2.4.1 分类管理

| 项目 | 描述 |
|------|------|
| 数据结构 | 名称、slug、描述、文章数量（计算字段） |
| 操作 | CRUD（仅 Admin） |
| 约束 | 名称唯一；分类下有文章时不可删除 |

#### 2.4.2 标签管理

| 项目 | 描述 |
|------|------|
| 数据结构 | 名称、slug、文章数量（计算字段） |
| 操作 | Author 可在创建文章时新增标签；Admin 可管理全部标签 |
| 约束 | 名称唯一 |

---

## 三、非功能需求

### 3.1 性能要求

| 指标 | 目标值 |
|------|--------|
| 首屏加载时间（SSR） | < 1.5s |
| API 平均响应时间 | < 200ms |
| 搜索响应时间 | < 500ms |
| 并发用户数 | 支持 500+ 并发 |
| 图片加载 | 使用 lazy loading + WebP 格式优化 |

### 3.2 安全要求

| 类别 | 措施 |
|------|------|
| 认证 | JWT + HttpOnly Cookie 存储 Refresh Token |
| 密码 | bcrypt 哈希存储，salt rounds ≥ 12 |
| XSS 防护 | Markdown 渲染时进行 HTML sanitize |
| CSRF 防护 | SameSite Cookie + CSRF Token |
| 速率限制 | API 限流（登录: 5次/分钟，搜索: 30次/分钟，通用: 100次/分钟） |
| 输入校验 | 前后端双重校验，后端使用 Pydantic 模型验证 |

### 3.3 可用性要求

| 项目 | 要求 |
|------|------|
| 响应式设计 | 适配 Mobile / Tablet / Desktop |
| 浏览器兼容 | Chrome、Firefox、Safari、Edge 最新两个版本 |
| 无障碍 | 符合 WCAG 2.1 AA 标准 |

---

## 四、技术架构

### 4.1 整体架构

```
┌─────────────────────────────────────────────────────┐
│                    客户端 (Browser)                    │
│         React Hydrate + Ant Design + Sass            │
│         (客户端接管交互，SPA 路由切换)                  │
└─────────────────────┬───────────────────────────────┘
                      │ 首次请求: HTML (SSR)
                      │ 后续交互: JSON (API)
                      ▼
┌─────────────────────────────────────────────────────┐
│          SSR Server (Express + ReactDOMServer)        │
│  ┌─────────────┐ ┌─────────────┐ ┌───────────────┐ │
│  │  路由匹配    │ │ 数据预取     │ │ renderToString│ │
│  │  (Express    │ │ (调用 API   │ │ (React SSR    │ │
│  │   Router)    │ │  获取数据)   │ │  渲染 HTML)   │ │
│  └─────────────┘ └─────────────┘ └───────────────┘ │
│  ┌─────────────────────────────────────────────────┐│
│  │  HTML 模板注入: CSS + 预取数据 + JS Bundle       ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────┬───────────────────────────────┘
                      │ HTTP / REST API
                      ▼
┌─────────────────────────────────────────────────────┐
│              Python Backend (FastAPI)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐│
│  │  Routes   │ │ Services │ │  Models (Pydantic)   ││
│  │  (API)    │ │ (Logic)  │ │  + ODM (Beanie)      ││
│  └──────────┘ └──────────┘ └──────────────────────┘│
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                   MongoDB                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  users   │ │  posts   │ │categories│            │
│  └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────┘
```

### 4.1.1 自建 SSR 工作流程

```
1. 浏览器请求 → Express Server 接收
2. Express 路由匹配 → 确定需要渲染的 React 组件和数据需求
3. 数据预取 → SSR Server 调用 FastAPI 获取页面所需数据
4. React SSR → ReactDOMServer.renderToString() 生成 HTML
5. HTML 组装 → 注入 CSS (Ant Design + Sass 编译产物)、预取数据 (window.__INITIAL_STATE__)、JS Bundle
6. 返回完整 HTML → 浏览器直接渲染，SEO 友好
7. 客户端 Hydrate → React.hydrate() 接管，后续为 SPA 交互
```

### 4.2 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | React 18 | UI 构建库 |
| **SSR 服务** | Express + ReactDOMServer | 自建 SSR，轻量可控 |
| **构建工具** | Webpack 5 | 双端打包（client + server bundle） |
| **UI 组件库** | Ant Design 5.x | 企业级 React 组件库，开箱即用 |
| **CSS 预处理** | Sass (SCSS 语法) | 模块化样式，支持变量/嵌套/混入 |
| **路由** | React Router 6 | 客户端 + 服务端同构路由 |
| **Markdown 编辑器** | MDEditor (@uiw/react-md-editor) | 所见即所得 Markdown 编辑 |
| **状态管理** | Zustand | 轻量级状态管理 |
| **HTTP 客户端** | Axios | 同构请求（SSR 服务端 + 浏览器端通用） |
| **后端框架** | FastAPI (Python 3.11+) | 高性能异步框架，自动生成 API 文档 |
| **ODM** | Beanie (基于 Motor) | 异步 MongoDB ODM，支持 Pydantic v2 |
| **认证** | python-jose (JWT) + passlib (bcrypt) | Token 认证 |
| **数据库** | MongoDB 7.0+ | 文档数据库，内置全文搜索 |
| **部署** | Docker + Docker Compose | 容器化部署 |

### 4.3 项目目录结构

```
blog/
├── backend/                        # Python 后端
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI 入口
│   │   ├── config.py               # 配置管理
│   │   ├── database.py             # MongoDB 连接
│   │   ├── models/                 # Beanie Document 模型
│   │   │   ├── user.py
│   │   │   ├── post.py
│   │   │   ├── category.py
│   │   │   └── tag.py
│   │   ├── schemas/                # Pydantic 请求/响应模型
│   │   │   ├── user.py
│   │   │   ├── post.py
│   │   │   └── common.py
│   │   ├── routes/                 # API 路由
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── posts.py
│   │   │   ├── categories.py
│   │   │   └── tags.py
│   │   ├── services/               # 业务逻辑
│   │   │   ├── auth.py
│   │   │   ├── post.py
│   │   │   └── search.py
│   │   ├── middleware/             # 中间件
│   │   │   ├── auth.py
│   │   │   └── rate_limit.py
│   │   └── utils/                 # 工具函数
│   │       ├── security.py
│   │       └── slug.py
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                       # React 自建 SSR 前端
│   ├── src/
│   │   ├── server/                # SSR 服务端
│   │   │   ├── index.ts           # Express 入口
│   │   │   ├── renderer.tsx       # React SSR 渲染器 (renderToString)
│   │   │   ├── html-template.ts   # HTML 模板（注入 CSS/JS/State）
│   │   │   └── data-fetcher.ts    # 服务端数据预取（按路由匹配）
│   │   ├── client/                # 客户端入口
│   │   │   └── index.tsx          # React hydrate 入口
│   │   ├── app/                   # 同构应用（server/client 共享）
│   │   │   ├── App.tsx            # 根组件
│   │   │   └── routes.tsx         # React Router 路由配置（同构）
│   │   ├── pages/                 # 页面组件（每个页面声明数据需求）
│   │   │   ├── Home.tsx           # 首页（文章列表）
│   │   │   ├── PostDetail.tsx     # 文章详情
│   │   │   ├── PostCreate.tsx     # 创建文章
│   │   │   ├── PostEdit.tsx       # 编辑文章
│   │   │   ├── Search.tsx         # 搜索结果
│   │   │   ├── CategoryPosts.tsx  # 分类文章列表
│   │   │   ├── TagPosts.tsx       # 标签文章列表
│   │   │   ├── Login.tsx          # 登录
│   │   │   ├── Register.tsx       # 注册
│   │   │   ├── Dashboard.tsx      # 个人中心
│   │   │   └── NotFound.tsx       # 404
│   │   ├── components/            # 组件
│   │   │   ├── layout/            # 布局组件
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── post/              # 文章相关组件
│   │   │   │   ├── PostCard.tsx
│   │   │   │   ├── PostList.tsx
│   │   │   │   ├── PostDetail.tsx
│   │   │   │   ├── PostEditor.tsx
│   │   │   │   └── TableOfContents.tsx
│   │   │   └── search/            # 搜索组件
│   │   │       ├── SearchBar.tsx
│   │   │       └── SearchResults.tsx
│   │   ├── styles/                # Sass 样式
│   │   │   ├── _variables.scss    # 全局变量（颜色、间距、断点）
│   │   │   ├── _mixins.scss       # 复用混入
│   │   │   ├── _antd-override.scss# Ant Design 主题/样式覆盖
│   │   │   ├── global.scss        # 全局样式
│   │   │   ├── layout/
│   │   │   │   ├── header.module.scss
│   │   │   │   └── footer.module.scss
│   │   │   ├── pages/
│   │   │   │   ├── home.module.scss
│   │   │   │   ├── post-detail.module.scss
│   │   │   │   └── dashboard.module.scss
│   │   │   └── components/
│   │   │       ├── post-card.module.scss
│   │   │       └── search-bar.module.scss
│   │   ├── lib/                   # 工具和配置
│   │   │   ├── api.ts             # Axios API 客户端（同构）
│   │   │   ├── auth.ts            # 认证工具
│   │   │   └── utils.ts
│   │   ├── stores/                # Zustand 状态
│   │   │   └── authStore.ts
│   │   └── types/                 # TypeScript 类型定义
│   │       ├── post.ts
│   │       └── user.ts
│   ├── public/                    # 静态资源
│   │   └── favicon.ico
│   ├── webpack/                   # Webpack 配置
│   │   ├── webpack.client.ts      # 客户端打包配置
│   │   ├── webpack.server.ts      # 服务端打包配置
│   │   └── webpack.common.ts      # 共享配置（Sass loader、TS loader）
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml
└── PRD.md
```

### 4.3.1 自建 SSR 关键设计说明

**Webpack 双端打包策略：**

| 配置 | 输出 | 说明 |
|------|------|------|
| webpack.client.ts | `dist/client/` | 浏览器端 JS Bundle + CSS，配置 code splitting |
| webpack.server.ts | `dist/server/` | Node.js 端 server bundle，target: 'node'，externals 排除 node_modules |
| webpack.common.ts | - | 共享：TypeScript (ts-loader)、Sass (sass-loader → css-loader → MiniCssExtractPlugin)、Ant Design 按需加载 |

**Sass 样式处理方案：**

| 场景 | 方案 |
|------|------|
| 全局样式 | `global.scss` 直接引入，定义 reset、字体、通用工具类 |
| 组件样式 | CSS Modules (`*.module.scss`)，自动生成唯一类名，避免样式冲突 |
| Ant Design 定制 | `_antd-override.scss` 覆盖 Ant Design 的 Design Token 或组件样式 |
| SSR 样式注入 | 服务端使用 MiniCssExtractPlugin 提取 CSS 文件，通过 `<link>` 标签注入 HTML，避免 FOUC |

**同构路由匹配：**

```tsx
// routes.tsx — server/client 共享
import { RouteObject } from 'react-router-dom';
import Home from '@/pages/Home';
import PostDetail from '@/pages/PostDetail';

export interface AppRoute extends RouteObject {
  fetchData?: (params: Record<string, string>, query: Record<string, string>) => Promise<any>;
}

export const routes: AppRoute[] = [
  {
    path: '/',
    element: <Home />,
    fetchData: (params, query) => api.get('/api/posts', { params: query }),
  },
  {
    path: '/posts/:slug',
    element: <PostDetail />,
    fetchData: (params) => api.get(`/api/posts/${params.slug}`),
  },
  // ...
];
```

**服务端渲染流程：**

```tsx
// renderer.tsx 核心逻辑
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { matchRoutes } from 'react-router-dom';
import { routes } from '@/app/routes';
import App from '@/app/App';

async function render(req) {
  // 1. 匹配路由，确定数据需求
  const matched = matchRoutes(routes, req.path);

  // 2. 并行预取所有匹配路由的数据
  const data = await Promise.all(
    matched.map(({ route, params }) => route.fetchData?.(params, req.query))
  );

  // 3. React SSR 渲染
  const html = renderToString(
    <StaticRouter location={req.url}>
      <App initialData={data} />
    </StaticRouter>
  );

  // 4. 组装完整 HTML（注入 CSS link、预取数据、JS bundle）
  return htmlTemplate({ html, data, cssLinks, jsBundle });
}
```

---

## 五、数据模型

### 5.1 User（用户）

```json
{
  "_id": "ObjectId",
  "username": "string (unique, 3-20 chars)",
  "email": "string (unique)",
  "passwordHash": "string (bcrypt)",
  "avatar": "string (URL, optional)",
  "bio": "string (optional, max 500 chars)",
  "role": "string (enum: visitor | author | admin)",
  "isActive": "boolean (default: true)",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### 5.2 Post（文章）

```json
{
  "_id": "ObjectId",
  "title": "string (required, max 100 chars)",
  "slug": "string (unique, auto-generated)",
  "content": "string (Markdown, required)",
  "summary": "string (max 300 chars)",
  "coverImage": "string (URL, optional)",
  "author": "ObjectId (ref: User)",
  "category": "ObjectId (ref: Category)",
  "tags": ["ObjectId (ref: Tag)"],
  "status": "string (enum: draft | published)",
  "viewCount": "number (default: 0)",
  "isDeleted": "boolean (default: false)",
  "publishedAt": "datetime (nullable)",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

**索引设计：**
- `{ slug: 1 }` — unique index
- `{ author: 1, status: 1 }` — 查询用户文章
- `{ category: 1, status: 1, publishedAt: -1 }` — 分类列表
- `{ status: 1, publishedAt: -1 }` — 文章列表默认排序
- `{ title: "text", content: "text", tags: "text" }` — 全文搜索索引

### 5.3 Category（分类）

```json
{
  "_id": "ObjectId",
  "name": "string (unique, required)",
  "slug": "string (unique)",
  "description": "string (optional)",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### 5.4 Tag（标签）

```json
{
  "_id": "ObjectId",
  "name": "string (unique, required)",
  "slug": "string (unique)",
  "createdAt": "datetime"
}
```

---

## 六、API 设计

### 6.1 认证相关

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 公开 |
| POST | `/api/auth/login` | 用户登录 | 公开 |
| POST | `/api/auth/logout` | 用户登出 | 已登录 |
| POST | `/api/auth/refresh` | 刷新 Token | 已登录 |

### 6.2 用户相关

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/users/me` | 获取当前用户信息 | 已登录 |
| PUT | `/api/users/me` | 更新当前用户信息 | 已登录 |
| PUT | `/api/users/me/password` | 修改密码 | 已登录 |
| GET | `/api/users/:id` | 获取指定用户公开信息 | 公开 |

### 6.3 文章相关

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/posts` | 获取文章列表 | 公开 |
| GET | `/api/posts/:slug` | 获取文章详情 | 公开 |
| POST | `/api/posts` | 创建文章 | Author+ |
| PUT | `/api/posts/:slug` | 更新文章 | 作者/Admin |
| DELETE | `/api/posts/:slug` | 删除文章（软删除） | 作者/Admin |
| GET | `/api/posts/search` | 搜索文章 | 公开 |
| GET | `/api/posts/search/suggest` | 搜索建议 | 公开 |
| GET | `/api/users/:id/posts` | 获取某用户的文章 | 公开 |

### 6.4 分类相关

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/categories` | 获取分类列表 | 公开 |
| POST | `/api/categories` | 创建分类 | Admin |
| PUT | `/api/categories/:slug` | 更新分类 | Admin |
| DELETE | `/api/categories/:slug` | 删除分类 | Admin |

### 6.5 标签相关

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/tags` | 获取标签列表 | 公开 |
| POST | `/api/tags` | 创建标签 | Author+ |
| DELETE | `/api/tags/:slug` | 删除标签 | Admin |

### 6.6 通用响应格式

**成功响应：**

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

**分页响应：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

**错误响应：**

```json
{
  "code": 400,
  "message": "Validation error",
  "errors": [
    { "field": "title", "message": "Title is required" }
  ]
}
```

---

## 七、页面设计

### 7.1 页面清单

| 页面 | 路由 | 渲染策略 | 描述 |
|------|------|----------|------|
| 首页 | `/` | SSR + 缓存(60s) | 文章列表，分页浏览，服务端预取数据 |
| 文章详情 | `/posts/:slug` | SSR | 单篇文章完整内容，SEO 关键页面 |
| 创建文章 | `/posts/new` | CSR only | Markdown 编辑器，无 SEO 需求 |
| 编辑文章 | `/posts/:slug/edit` | CSR only | Markdown 编辑器（预填数据），无 SEO 需求 |
| 搜索结果 | `/search?q=keyword` | SSR | 搜索结果列表，支持搜索引擎抓取 |
| 分类文章 | `/categories/:slug` | SSR + 缓存(60s) | 某分类下的文章列表 |
| 标签文章 | `/tags/:slug` | SSR + 缓存(60s) | 某标签下的文章列表 |
| 登录 | `/auth/login` | CSR only | 登录表单，无 SEO 需求 |
| 注册 | `/auth/register` | CSR only | 注册表单，无 SEO 需求 |
| 个人中心 | `/dashboard` | CSR only | 用户的文章管理，需登录 |
| 404 | `/*` | SSR (静态 HTML) | 未找到页面 |

**渲染策略说明：**

| 策略 | 实现方式 |
|------|----------|
| SSR | Express 拦截请求 → 调用 FastAPI 预取数据 → ReactDOMServer.renderToString → 返回完整 HTML |
| SSR + 缓存 | 同 SSR，增加 node-cache 或 Redis 对渲染结果做内存缓存，TTL 60s |
| CSR only | Express 返回空壳 HTML（仅包含 `<div id="root">` + JS Bundle），客户端由 React Router 处理 |

### 7.2 核心页面线框描述

**首页 (`/`)**

```
┌─────────────────────────────────────────────┐
│  Logo        [搜索框]     [登录] [注册]      │
├─────────────────────────────────────────────┤
│                                             │
│  [分类导航栏: 全部 | 技术 | 生活 | ...]       │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ [封面图]                              │   │
│  │ 文章标题                              │   │
│  │ 摘要内容...                           │   │
│  │ 作者头像 作者名  2026-02-26  阅读量    │   │
│  │ [标签1] [标签2]                       │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ (更多文章卡片...)                     │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  [← 上一页]    第 1/10 页    [下一页 →]     │
│                                             │
├─────────────────────────────────────────────┤
│  Footer: 版权信息 | 关于 | 联系             │
└─────────────────────────────────────────────┘
```

**文章详情页 (`/posts/:slug`)**

```
┌─────────────────────────────────────────────┐
│  Header (同首页)                             │
├──────────────────────┬──────────────────────┤
│                      │                      │
│  文章标题            │  目录 (TOC)          │
│  作者 | 日期 | 阅读量 │  ├ 一级标题          │
│  [分类] [标签]       │  │ ├ 二级标题        │
│                      │  │ └ 二级标题        │
│  ──────────────      │  └ 一级标题          │
│                      │                      │
│  Markdown 正文内容    │                      │
│  (代码高亮)          │                      │
│  (图片)              │                      │
│                      │                      │
│  ──────────────      │                      │
│  [编辑] [删除]       │                      │
│  (仅作者/管理员可见) │                      │
│                      │                      │
├──────────────────────┴──────────────────────┤
│  Footer                                     │
└─────────────────────────────────────────────┘
```

---

## 八、开发计划

### 8.1 里程碑

| 阶段 | 周期 | 内容 |
|------|------|------|
| **M1: 基础架构** | 第 1 周 | 项目初始化；Docker 环境搭建；MongoDB 数据模型；FastAPI 项目骨架；React SSR 项目骨架（Webpack 双端配置 + Express + Ant Design + Sass） |
| **M2: 用户模块** | 第 2 周 | 注册/登录 API；JWT 认证中间件；前端登录/注册页面；用户状态管理 |
| **M3: 文章 CRUD** | 第 3-4 周 | 文章 CRUD API；Markdown 编辑器集成；文章列表页（SSR）；文章详情页（SSR）；分类和标签 CRUD |
| **M4: 搜索功能** | 第 5 周 | MongoDB 全文索引建立；搜索 API；前端搜索组件；搜索建议功能 |
| **M5: 优化上线** | 第 6 周 | 性能优化；安全加固；响应式适配；部署配置；测试和修复 |

### 8.2 优先级排序

| 优先级 | 功能 |
|--------|------|
| P0（必须） | 文章 CRUD、文章列表和详情展示、用户认证、基础搜索 |
| P1（重要） | 分类和标签、分页、SSR 渲染缓存优化、Markdown 编辑器 |
| P2（期望） | 搜索建议、阅读量统计、文章目录生成、个人中心仪表盘 |
| P3（可选） | 评论系统、文章收藏、RSS 订阅、暗色模式 |

---

## 九、验收标准

### 9.1 功能验收

- [ ] 用户可正常注册、登录、登出
- [ ] 已登录用户可创建、编辑、删除自己的文章
- [ ] 访客可浏览文章列表（分页）和文章详情
- [ ] 文章支持 Markdown 格式，渲染正确
- [ ] 搜索功能可按关键词搜索文章，结果准确
- [ ] 分类和标签筛选功能正常工作
- [ ] 文章详情页 SSR 渲染，查看页面源码可见完整内容
- [ ] 管理员可管理所有文章、分类和标签

### 9.2 非功能验收

- [ ] Lighthouse Performance 评分 ≥ 90
- [ ] API 接口响应时间 < 200ms（p95）
- [ ] 移动端/平板/桌面端布局均正常展示
- [ ] 无 XSS、CSRF 等安全漏洞
- [ ] Docker Compose 一键启动所有服务
