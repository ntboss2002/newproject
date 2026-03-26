# Shop 在线商城

基于 **Java Spring Boot** 后端 + **React (Vite + TypeScript)** 前端构建的全栈电商项目。

---

## 项目目录结构

```
newproject/
├── backend/                          # Spring Boot 后端
│   ├── pom.xml                       # Maven 依赖配置
│   └── src/
│       ├── main/
│       │   ├── java/com/example/shop/
│       │   │   ├── ShopApplication.java      # 入口类
│       │   │   ├── config/                   # 安全、CORS 配置
│       │   │   │   ├── SecurityConfig.java
│       │   │   │   └── WebConfig.java
│       │   │   ├── controller/               # REST 控制器
│       │   │   │   ├── AuthController.java
│       │   │   │   └── ProductController.java
│       │   │   ├── service/                  # 业务逻辑层
│       │   │   │   ├── AuthService.java
│       │   │   │   └── ProductService.java
│       │   │   ├── repository/               # JPA 数据访问层
│       │   │   │   ├── UserRepository.java
│       │   │   │   ├── RoleRepository.java
│       │   │   │   ├── ProductRepository.java
│       │   │   │   ├── CategoryRepository.java
│       │   │   │   └── OrderRepository.java
│       │   │   ├── model/                    # JPA 实体
│       │   │   │   ├── User.java
│       │   │   │   ├── Role.java
│       │   │   │   ├── Product.java
│       │   │   │   ├── Category.java
│       │   │   │   ├── Order.java
│       │   │   │   └── OrderItem.java
│       │   │   ├── dto/                      # 请求/响应 DTO
│       │   │   │   ├── request/
│       │   │   │   │   ├── LoginRequest.java
│       │   │   │   │   ├── RegisterRequest.java
│       │   │   │   │   └── ProductRequest.java
│       │   │   │   └── response/
│       │   │   │       ├── JwtResponse.java
│       │   │   │       ├── MessageResponse.java
│       │   │   │       └── ProductResponse.java
│       │   │   ├── security/                 # JWT 安全组件
│       │   │   │   ├── AuthEntryPointJwt.java
│       │   │   │   ├── AuthTokenFilter.java
│       │   │   │   ├── JwtUtils.java
│       │   │   │   ├── UserDetailsImpl.java
│       │   │   │   └── UserDetailsServiceImpl.java
│       │   │   └── exception/                # 全局异常处理
│       │   │       ├── GlobalExceptionHandler.java
│       │   │       └── ResourceNotFoundException.java
│       │   └── resources/
│       │       └── application.yml           # 应用配置
│       └── test/
│           └── java/com/example/shop/
│               └── ShopApplicationTests.java
│
└── frontend/                         # React 前端 (Vite + TypeScript)
    ├── index.html
    ├── package.json                  # 前端依赖
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.tsx                  # 入口
        ├── App.tsx                   # 路由配置
        ├── index.css                 # Tailwind 样式入口
        ├── api/                      # Axios 请求封装
        │   ├── axiosInstance.ts
        │   ├── auth.ts
        │   ├── products.ts
        │   └── orders.ts
        ├── components/               # 公共组件
        │   ├── Layout.tsx
        │   ├── Navbar.tsx
        │   ├── Footer.tsx
        │   ├── ProductCard.tsx
        │   └── PrivateRoute.tsx
        ├── pages/                    # 页面组件
        │   ├── HomePage.tsx
        │   ├── ProductsPage.tsx
        │   ├── ProductDetailPage.tsx
        │   ├── CartPage.tsx
        │   ├── LoginPage.tsx
        │   ├── RegisterPage.tsx
        │   ├── OrdersPage.tsx
        │   └── NotFoundPage.tsx
        ├── store/                    # Zustand 状态管理
        │   ├── authStore.ts
        │   └── cartStore.ts
        └── types/                    # TypeScript 类型定义
            └── index.ts
```

---

## 后端依赖 (pom.xml 主要依赖)

| 依赖 | 说明 |
|------|------|
| `spring-boot-starter-web` | Spring Web / RESTful API |
| `spring-boot-starter-data-jpa` | Spring Data JPA (ORM) |
| `mysql-connector-j` | MySQL JDBC 驱动 |
| `spring-boot-starter-security` | Spring Security (认证授权) |
| `spring-boot-starter-validation` | Bean Validation (参数校验) |
| `jjwt-api / jjwt-impl / jjwt-jackson` | JWT 令牌生成与验证 |
| `lombok` | 简化 Java 样板代码 |

---

## 前端核心库 (package.json)

| 库 | 说明 |
|----|------|
| `react` + `react-dom` | React 18 |
| `react-router-dom` | 前端路由 |
| `axios` | HTTP 请求客户端 |
| `tailwindcss` | Utility-first CSS 框架 |
| `zustand` | 轻量状态管理 |
| `vite` + `@vitejs/plugin-react` | 构建工具 |
| `typescript` | 类型安全 |

---

## 快速开始

### 前置条件
- Java 17+
- Maven 3.8+
- Node.js 18+
- MySQL 8.0+

### 后端启动

```bash
# 1. 创建数据库
mysql -u root -p -e "CREATE DATABASE shopdb;"

# 2. 修改数据库配置
#    编辑 backend/src/main/resources/application.yml
#    填写正确的 username / password

# 3. 启动
cd backend
mvn spring-boot:run
# 服务运行在 http://localhost:8080
```

### 前端启动

```bash
cd frontend
npm install
npm run dev
# 服务运行在 http://localhost:5173
```

---

## 主要 API 端点

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 公开 |
| POST | `/api/auth/login` | 用户登录（返回 JWT） | 公开 |
| GET | `/api/products` | 商品列表（分页） | 公开 |
| GET | `/api/products/{id}` | 商品详情 | 公开 |
| GET | `/api/products/search?keyword=` | 商品搜索 | 公开 |
| POST | `/api/products` | 新增商品 | ADMIN |
| PUT | `/api/products/{id}` | 更新商品 | ADMIN |
| DELETE | `/api/products/{id}` | 删除商品 | ADMIN |

---

## 技术栈

**后端**：Java 17 · Spring Boot 3 · Spring Security · JWT · Spring Data JPA · MySQL · Maven · Lombok

**前端**：React 18 · TypeScript · Vite · React Router v6 · Axios · Tailwind CSS · Zustand
