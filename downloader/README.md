# 下载管理器

基于 **Java Spring Boot** 后端 + **React (Vite + TypeScript)** 前端构建的独立下载管理器，
支持 **磁力链接**（magnet:）、**电驴链接**（ed2k://）和 **BT 种子**（.torrent），
下载引擎由 [aria2](https://aria2.github.io/) 提供。

---

## 项目目录结构

```
downloader/
├── backend/                                   # Spring Boot 后端
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/example/downloader/
│       │   │   ├── DownloaderApplication.java  # 入口类
│       │   │   ├── config/
│       │   │   │   └── WebConfig.java          # CORS 配置
│       │   │   ├── controller/
│       │   │   │   └── DownloadController.java # REST 控制器
│       │   │   ├── service/
│       │   │   │   ├── DownloadService.java    # 业务逻辑
│       │   │   │   └── Aria2RpcClient.java     # aria2 JSON-RPC 客户端
│       │   │   ├── repository/
│       │   │   │   └── DownloadTaskRepository.java
│       │   │   ├── model/
│       │   │   │   ├── DownloadTask.java
│       │   │   │   ├── DownloadStatus.java
│       │   │   │   └── DownloadType.java
│       │   │   ├── dto/
│       │   │   │   ├── request/DownloadRequest.java
│       │   │   │   └── response/
│       │   │   │       ├── DownloadResponse.java
│       │   │   │       └── PeerInfo.java
│       │   │   └── exception/
│       │   │       ├── GlobalExceptionHandler.java
│       │   │       └── ResourceNotFoundException.java
│       │   └── resources/
│       │       └── application.yml
│       └── test/
│           └── java/com/example/downloader/
│               └── DownloaderApplicationTests.java
│
└── frontend/                                  # React 前端 (Vite + TypeScript)
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── api/
        │   ├── axiosInstance.ts
        │   └── downloads.ts
        ├── components/
        │   ├── Layout.tsx
        │   └── Navbar.tsx
        ├── pages/
        │   ├── DownloadPage.tsx
        │   └── NotFoundPage.tsx
        └── types/
            └── index.ts
```

---

## 快速开始

### 前置条件

- Java 17+
- Maven 3.8+
- Node.js 18+
- MySQL 8.0+
- [aria2](https://aria2.github.io/) 1.36+

### 1. 启动 aria2

```bash
aria2c --enable-rpc \
       --rpc-listen-all \
       --rpc-secret=changeme \
       --rpc-listen-port=6800 \
       --continue=true \
       --max-concurrent-downloads=5
```

### 2. 启动后端

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE downloaderdb;"

# 修改数据库配置（如有需要）
# 编辑 backend/src/main/resources/application.yml

# 启动
cd backend
mvn spring-boot:run
# 服务运行在 http://localhost:8081
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
# 服务运行在 http://localhost:5174
```

---

## API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET    | `/api/downloads` | 获取所有下载任务 |
| GET    | `/api/downloads/{id}` | 获取单个任务（含节点详情） |
| POST   | `/api/downloads` | 新增下载（magnet / ed2k / torrent URL） |
| POST   | `/api/downloads/torrent` | 上传 .torrent 文件 |
| POST   | `/api/downloads/{id}/pause` | 暂停下载 |
| POST   | `/api/downloads/{id}/resume` | 恢复下载 |
| DELETE | `/api/downloads/{id}` | 移除下载 |

---

## 技术栈

**后端**：Java 17 · Spring Boot 3 · Spring Data JPA · MySQL · Maven · Lombok · aria2 JSON-RPC

**前端**：React 18 · TypeScript · Vite · React Router v6 · Axios · Tailwind CSS
