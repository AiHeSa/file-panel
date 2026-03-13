# 🦐 文件管理面板

一个简洁的 Web 端文件系统管理面板，用于浏览和管理服务器文件。

> ⚠️ **本项目完全使用 AI 开发**（千帆 + GLM-5 + OpenClaw）

## 功能特性

- 📁 **目录浏览** - 树形结构展示目录，支持展开/收起
- 📄 **文件编辑** - 在线查看和编辑文本文件，支持语法高亮
- 🔍 **文件搜索** - 按文件名搜索，支持搜索文件内容
- 🔐 **用户认证** - JWT 登录认证，保护文件安全
- 👁️ **隐藏文件** - 显示隐藏文件/文件夹，带有标记
- ✏️ **文件操作** - 新建、删除、重命名文件和文件夹

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + TypeScript + Element Plus |
| 后端 | Express + Node.js |
| 认证 | JWT |
| 进程管理 | PM2 |
| 反向代理 | Nginx |

## 项目结构

```
file-panel/
├── client/              # 前端项目
│   ├── src/
│   │   ├── api/         # API 接口
│   │   ├── router/      # 路由配置
│   │   ├── stores/      # 状态管理
│   │   ├── views/       # 页面组件
│   │   └── utils/       # 工具函数
│   └── package.json
│
├── server/              # 后端项目
│   ├── src/
│   │   ├── routes/      # 路由
│   │   ├── services/    # 服务层
│   │   ├── middleware/  # 中间件
│   │   └── config/      # 配置
│   └── package.json
│
└── data/                # 数据目录
    └── users.json       # 用户数据
```

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/AiHeSa/file-panel.git
cd file-panel
```

### 2. 安装依赖

```bash
# 后端
cd server && npm install

# 前端
cd ../client && npm install
```

### 3. 启动后端

```bash
cd server
npm start
# 或使用 PM2
pm2 start src/index.js --name file-panel-server
```

### 4. 构建前端

```bash
cd client
npm run build
```

### 5. 配置 Nginx

```nginx
server {
    listen 7000;
    server_name _;

    location / {
        root /path/to/file-panel/client/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:7001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    client_max_body_size 50M;
}
```

## 配置说明

### 后端配置 (`server/src/config/index.js`)

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| port | 服务端口 | 7001 |
| jwt.secret | JWT 密钥 | - |
| jwt.expiresIn | Token 有效期 | 24h |
| allowedRoots | 允许访问的目录 | /root |

### 默认账户

- 用户名：`admin`
- 密码：`admin123`

⚠️ 首次登录后请立即修改密码！

## API 接口

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| GET | /api/auth/verify | 验证 Token |
| PUT | /api/auth/password | 修改密码 |

### 文件操作

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/files/content | 获取文件内容 |
| PUT | /api/files/content | 保存文件 |
| POST | /api/files/create | 创建文件/文件夹 |
| DELETE | /api/files | 删除文件/文件夹 |
| PATCH | /api/files/rename | 重命名 |
| POST | /api/files/upload | 上传文件 |

### 目录操作

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dirs/list | 获取目录列表 |
| GET | /api/dirs/tree | 获取目录树 |

### 搜索

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/search | 搜索文件 |

## 开发

### 开发模式

```bash
# 后端
cd server && npm run dev

# 前端
cd client && npm run dev
```

### 构建生产版本

```bash
cd client && npm run build
```

## 许可证

MIT
