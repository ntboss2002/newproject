# 项目总览

本仓库包含两个独立的子项目：

| 目录 | 名称 | 说明 |
|------|------|------|
| `backend/` + `frontend/` | **Shop 在线商城** | Java Spring Boot + React 全栈电商项目 |
| `downloader/` | **下载管理器** | 独立的 torrent / magnet / ed2k 下载管理器 |

---

## Shop 在线商城

基于 **Java Spring Boot** 后端 + **React (Vite + TypeScript)** 前端构建的全栈电商项目。

### 目录结构

```
backend/                          # Spring Boot 后端
├── pom.xml
└── src/main/java/com/example/shop/
    ├── ShopApplication.java
    ├── config/                   # 安全、CORS 配置
    ├── controller/               # REST 控制器 (Auth, Product)
    ├── service/                  # 业务逻辑层
    ├── repository/               # JPA 数据访问层
    ├── model/                    # JPA 实体
    ├── dto/                      # 请求/响应 DTO
    ├── security/                 # JWT 安全组件
    └── exception/                # 全局异常处理

frontend/                         # React 前端 (Vite + TypeScript)
├── package.json
└── src/
    ├── api/                      # Axios 请求封装
    ├── components/               # 公共组件
    ├── pages/                    # 页面组件
    ├── store/                    # Zustand 状态管理
    └── types/                    # TypeScript 类型定义
```

### 快速开始

**前置条件**：Java 17+、Maven 3.8+、Node.js 18+、MySQL 8.0+

```bash
# 后端
mysql -u root -p -e "CREATE DATABASE shopdb;"
cd backend && mvn spring-boot:run
# 服务运行在 http://localhost:8080

# 前端
cd frontend && npm install && npm run dev
# 服务运行在 http://localhost:5173
```

### 主要 API 端点

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 公开 |
| POST | `/api/auth/login` | 用户登录（返回 JWT） | 公开 |
| GET  | `/api/products` | 商品列表（分页） | 公开 |
| GET  | `/api/products/{id}` | 商品详情 | 公开 |
| POST | `/api/products` | 新增商品 | ADMIN |
| PUT  | `/api/products/{id}` | 更新商品 | ADMIN |
| DELETE | `/api/products/{id}` | 删除商品 | ADMIN |

### 技术栈

**后端**：Java 17 · Spring Boot 3 · Spring Security · JWT · Spring Data JPA · MySQL · Maven · Lombok

**前端**：React 18 · TypeScript · Vite · React Router v6 · Axios · Tailwind CSS · Zustand

---

## 下载管理器

独立的下载管理器，支持 torrent / magnet / ed2k 协议，下载引擎由 **aria2** 提供。

详细文档请查看 [`downloader/README.md`](downloader/README.md)。

### 快速开始

```bash
# 启动 aria2
aria2c --enable-rpc --rpc-secret=changeme --rpc-listen-port=6800 --continue=true

# 后端
mysql -u root -p -e "CREATE DATABASE downloaderdb;"
cd downloader/backend && mvn spring-boot:run
# 服务运行在 http://localhost:8081

# 前端
cd downloader/frontend && npm install && npm run dev
# 服务运行在 http://localhost:5174
```
