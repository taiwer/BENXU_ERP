# BENXU_ERP 部署与开发指南

这是一个轻量级的团体内部记账系统，采用全栈架构，支持本地化部署。

## 核心技术栈
- **前端**: React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion
- **后端**: Node.js (Express), SQLite (better-sqlite3), JWT (jsonwebtoken)
- **AI**: Gemini API (可选)

## 开发环境启动

1. **安装依赖**:
   ```bash
   npm install
   ```

2. **环境变量**:
   创建 `.env` 文件（参考 `.env.example`）:
   ```env
   GEMINI_API_KEY=你的KEY (可选)
   JWT_SECRET=随机长字符串
   ```

3. **启动开发服务器**:
   ```bash
   npm run dev
   ```
   *注意：默认使用 3000 端口。如需更改端口（例如 3002），请在本地设置环境变量 `PORT=3002`*。

## 生产环境部署

1. **编译打包**:
   ```bash
   npm run build
   ```
   该命令会生成：
   - `dist/`: 静态网页文件
   - `dist/server.cjs`: 打包后的后端服务器

2. **启动应用**:
   ```bash
   npm start
   ```

## 系统初始化
首次打开应用时，点击登录页下方的 **"系统初始化维护"**。
点击 **"初始化默认管理员"**。
- 默认账号: `admin`
- 默认密码: `admin123`

登录后请务必在设置中修改密码（计划中的功能）或直接在数据库中更新。

## 数据备份
- 所有数据存储在项目根目录的 `data.db` (SQLite) 文件中。
- 上传的图片存储在 `uploads/` 文件夹中。
- 迁移时，只需将这两个文件/文件夹拷贝到新环境即可。
