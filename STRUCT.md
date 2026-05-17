# BENXU_ERP 系统结构说明

## 1. 功能模块
- **仪表盘 (Dashboard)**: 实时显示账户余额、本月收支概况及最近交易流水。
- **收入管理 (Income)**: 记录各类经费收入，支持发票号码关联及图片凭证上传。
- **支出管理 (Expense)**: 记录试剂耗材、设备维修等支出，包含AI发票识别辅助功能。
- **发票追踪 (Invoices)**: 汇总所有带票记录，方便查漏补缺。
- **客户/供应商 (Customers)**: 基于流水自动汇总交易往来对象及其金额贡献。
- **月度报表 (Reports)**: 支持按月份导出 Excel 明细账单。
- **系统设置 (Settings)**: 查看系统状态、用户列表及核心账户初始化信息。

## 2. 技术逻辑
- **前后端分离**: React 负责渲染，Express 提供 API 及本地存储。
- **身份验证**: 基于 HttpOnly Cookie 的 JWT 验证，确保安全性且不依赖第三方 Auth 服务。
- **数据持久化**: 使用本地 SQLite 数据库，单文件存储，极易跨服务器迁移。
- **文件存储**: 图片分块上传至本地 `uploads/` 目录，路径存于数据库 JSON 字段。

## 3. 数据库结构 (SQLite)

### 表: users (用户)
- `id`: 主键
- `username`: 登录名 (唯一)
- `password`: BCrypt 加密密码
- `name`: 显示姓名
- `role`: 权限 (admin/member)

### 表: accounts (账户)
- `id`: 账户代码 (如 'main')
- `name`: 账户名称
- `initial_balance`: 初始余额
- `current_balance`: 实时余额

### 表: transactions (交易流水)
- `id`: 主键
- `type`: income / expense
- `amount`: 金额
- `date`: 业务日期 (ISO Format)
- `customer`: 往来单位
- `invoice_no`: 发票号码
- `category`: 类别
- `description`: 备注/详情
- `attachment_url`: 附件路径列表 (JSON Array String)
- `operator_id`: 经办人ID
- `operator_name`: 经办人姓名
- `is_deleted`: 软删除标识

## 4. AI 功能集成
- **技术**: 使用 Google Gemini 1.5 Flash。
- **应用场景**: 在支出页面点击 "AI 拍照识别"，可以自动解析图片中的金额、发票号、日期等信息，减少手动输入。
- **本地化兼容**: 即使没有 AI KEY，系统基础功能依然可以离线运行。
