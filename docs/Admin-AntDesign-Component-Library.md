# GOODFANS 运营后台 · Ant Design 组件映射与开发约定

**文档版本**：2026-05-11  
**原型目录**：`web3-app-prototype/admin-prototype/`  
**主入口（平铺 iframe）**：`admin-prototype/index-HT.html`  
**串联导航（单 iframe + 侧栏列表 / 上一下一）**：`admin-hub.html`（项目根目录；iframe 加载 `admin-prototype/*.html`）。旧路径 `admin-prototype/admin-hub.html` 已重定向。  
**壳层样式**：`admin-prototype/css/admin-shell.css`  
**列表分页条（全站列表默认可复用）**：`admin-prototype/css/admin-pagination.css`  
**全局弹窗（静态原型）**：`admin-prototype/css/admin-modals.css` + `admin-prototype/js/admin-modal.js`  
  - `AdminModal.open({ title, body, wide?, width?, footer: [{ text, primary?, danger?, onClick }], onMount })`  
  - `AdminModal.confirmGoogle({ title, message, onVerified })`：敏感操作二次验证示意  
  - `AdminModal.toast(msg)`：轻量结果反馈  
  - 弹窗挂载于 `document.body`，在 **iframe 内嵌页面** 中同样覆盖当前帧视口，符合「当前页弹窗」交互。

**侧栏数据**：`admin-prototype/js/admin-nav.js`（`body[data-admin-page]` 控制高亮）

本文档为**新建组件库说明**，与 C 端 `pages-web` 原型隔离，不修改既有页面。

---

## 1. 技术选型与迁移路径

| 层级 | 原型实现 | 建议生产实现 |
|------|-----------|--------------|
| 样式基座 | Ant Design 4 `antd.min.css`（CDN） | `antd` + `less`/`ConfigProvider`（React）或 `@ant-design/vue` |
| 布局 | 自定义 `.admin-app` / `.admin-sider` / `.admin-main` | `Layout` + `ProLayout`（Ant Design Pro） |
| 表格/表单 | 语义化 HTML + `ant-table` / `ant-form-item` 类名 | `Table` / `Form` / `ProTable` |
| 图表 | Chart.js（CDN） | `@ant-design/charts` 或 ECharts |
| 图标 | Font Awesome 6 | `@ant-design/icons`（与 FA 图标名不必一致，按设计替换） |

---

## 2. 页面与路由建议（与 HTML 文件名对齐）

| 路由段 | HTML | 说明 |
|--------|------|------|
| `/admin/dashboard` | `dashboard.html` | 指标卡 + 趋势 + 待办 |
| `/admin/settings/roles` | `settings-roles.html` | 角色 CRUD + 权限树 |
| `/admin/settings/members` | `settings-members.html` | 成员账号 |
| `/admin/settings/audit-logs` | `settings-operation-logs.html` | 操作日志 |
| `/admin/users` | `users-list.html` | 用户主列表 + 详情抽屉 Tab |
| `/admin/users/assets` | `users-assets.html` | 资产视图 |
| `/admin/users/ledger` | `users-ledger.html` | 账变 |
| `/admin/users/addresses` | `users-address-book.html` | 提币地址 |
| `/admin/users/bank-cards` | `users-bank-cards.html` | 银行卡 |
| `/admin/orders/recharge` | `orders-recharge.html` | 充值订单 |
| `/admin/orders/withdraw` | `orders-withdraw.html` | 提现订单 |
| `/admin/activities/...` | `activities-*.html` | 积分与活动 |
| `/admin/subscriptions` | `subscriptions.html` | 订阅与有效期 |
| `/admin/risk/...` | `risk-*.html` | 风控域 |
| `/admin/content/review` | `content-review.html` | 机审 + 人审 |
| `/admin/fees` | `network-fees.html` | 手续费分场景 |
| `/admin/announcements` | `system-announcements.html` | 公告 |
| `/admin/reports` | `reports.html` | 报表 |

---

## 3. 组件映射表（原型 → Ant Design React）

| 原型区域 | 推荐组件 | 备注 |
|----------|-----------|------|
| 顶栏 | `Layout.Header` + `Space` + `Dropdown` + `Avatar` + `Button` | 用户菜单、退出、语言（可选） |
| 侧栏 | `Layout.Sider` + `Menu` `theme="dark"` | `items` 由后端菜单或前端常量生成 |
| 页面标题区 | `Typography.Title` + `Typography.Paragraph` | 对应 `.admin-page-title` / `.admin-page-desc` |
| 筛选条 | `Form` `layout="inline"` 或 `ProForm` | `.admin-toolbar` |
| 数据表 | `Table` 或 `ProTable` | 分页、列设置、导出用 `ProTable` 更省事 |
| 标签状态 | `Tag` / `Badge` | 订单状态、风控状态 |
| 权限树 | `Tree` `checkable` | `settings-roles.html` 中复选框树 |
| 详情抽屉 | `Drawer` + `Tabs` | `users-list.html` 用户信息分区 |
| 分步确认 | `Modal` + `Input`（谷歌验证码） | 角色删除/编辑、高危操作 |
| 开关配置 | `Switch` | `risk-switches.html` 生产替换 checkbox |
| 分段页签 | `Tabs` | `risk-abnormal-speech.html`、`risk-whitelist.html` |
| 统计卡片 | `Card` + `Statistic` | `dashboard.html` |
| 图表 | `Line` / `Column` / `Pie`（Charts） | 对齐 `dashboard` / `reports` |
| 表单分组 | `Card` + `Descriptions` | 用户基础信息只读区 |

---

## 4. 数据与权限约定（可开发性）

1. **列表行主键**：表格每行数据预留 `id` 字段；操作列仅传 `id` + `action`。  
2. **导出按钮**：与后端异步任务或同步 CSV 对齐，原型中按钮占位即可。  
3. **敏感操作**：角色删除/改权、用户重置密码、禁言等 → 统一走「二次验证 + 操作日志」中间件。  
4. **侧栏高亮**：`body[data-admin-page]` 与路由 `pathname` 映射同一枚举（见 `admin-nav.js` 中 `key`）。  
5. **iframe 平铺索引**：仅用于设计评审；生产环境勿嵌套业务页面 iframe。

---

## 5. 静态资源

- **Ant Design CSS**：`https://cdn.jsdelivr.net/npm/antd@4.24.15/dist/antd.min.css`  
- **Font Awesome**：CDN `6.5.1`  
- **配图**：Unsplash 外链，上线后替换为对象存储或本地资源。  
- **Chart.js**：`https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js`  

---

## 6. 与 PRD 功能对照（速查）

- 系统设置：角色（谷歌验证）、成员账号、操作日志 → `settings-*.html`  
- 用户：列表（多维信息 Tab）、资产、账变导出、地址簿、银行卡 → `users-*.html`  
- 订单：充值/提现 + 导出 → `orders-*.html`  
- 活动：奖励/消耗/配置/兑换 + 导出 → `activities-*.html`  
- 订阅：有效期强调 → `subscriptions.html`  
- 风控：白名单分场景、开关、限额、敏感词、验证码、异常发言三 Tab + 阶梯参数 → `risk-*.html`  
- 内容：机审 + 人审 → `content-review.html`  
- 手续费：分场景 → `network-fees.html`  
- 公告 → `system-announcements.html`  
- 报表：注册、DAU、GMV 等 MVP 指标 → `reports.html`  

---

**维护说明**：新增后台页面时，同步更新 `js/admin-nav.js` 的 `blocks` 数组与 `index-HT.html` 的 iframe 清单，并在本文档「页面与路由建议」表中追加一行。
