# GOODFANS Web 原型 · 今日调整记录

> **日期：** 2026 年 6 月 25 日（周四）  
> **范围：** 运营后台（全站导出任务、充值/提现订单、订阅管理）、AdminModal 谷歌验证、C 端创作者主页升购订阅  
> **请用浏览器打开 HTML 版（勿直接打开本 .md）：** [prototype-changelog-2026-06-25.html](./prototype-changelog-2026-06-25.html)

---

## 1. 运营后台 · 全站导出任务

**页面：** `export-tasks.html`  
**新增：** `js/admin-export-tasks.js` · `js/export-tasks-page.js` · `css/export-tasks.css`

### 核心流程

1. 各列表页点击 **「导出」** → `AdminExport.confirm()`
2. **谷歌验证码**弹窗（演示码 `123456`；失败时弹窗内联红字提示，可重试，不关闭弹窗）
3. 验证通过 → **「添加成功」**弹窗（关闭 / 查看）
4. 「查看」跳转 `export-tasks.html?type=导出类型`

### 导出任务列表

| 字段 | 说明 |
|------|------|
| 导出任务单号 | `EXP` + 日期 + 序号 |
| 导出类型 | 与菜单/页面名对齐（如「充值订单」「订阅管理」） |
| 导出条件 | 仅展示有值的筛选项；空条件不展示 |
| 导出时间 / 删除时间 | 成功任务默认 60 分钟后过期 |
| 导出人 | 页眉当前运营账号 |
| 状态 | 正在导出 / 导出成功 / 导出失败 / 已过期 |
| 操作 | 仅「导出成功」且未过期显示 **下载** |

### 筛选

- 仅保留 **导出类型** 关键词
- **查询** + **重置**；支持 URL `?type=` 预填（从「查看」跳转）

### 已接入导出的页面

充值订单、提现订单、订阅管理、账变记录、操作日志、数据看板、报表中心、活动配置、积分发放/消耗/兑换记录等。

### 基础设施

- `admin-nav.js`：订单分组新增 **「导出任务列表」**；自动 `document.write` 加载 `admin-export-tasks.js`
- 任务队列存 `localStorage`：`fl_admin_export_tasks_v1`

---

## 2. 运营后台 · 充值订单（重构）

**页面：** `orders-recharge.html`  
**新增：** `js/orders-recharge-page.js` · `css/orders-list.css`

### 筛选

用户 UID、订单号、订单状态、**下单时间区间**、**完成时间区间**  
下单时间 **默认近一周**；完成时间默认空；**重置**恢复默认

### 列表字段

序号、用户UID（可点）、汇率、下单数量、下单金额(CNY)、手续费、实际成交数量、实际成交金额、订单号、交易哈希、操作设备、交易IP、地区、下单时间、完成时间、订单状态、错误描述

### 表尾小计/合计

- **小计**：当前页合计
- **合计**：筛选结果全量合计
- 汇总字段：下单数量、实际成交数量、实际成交金额

### 导出

接入 `AdminExport.confirm()`，导出类型 **「充值订单」**，条件含当前筛选。

---

## 3. 运营后台 · 提现订单（重构）

**页面：** `orders-withdraw.html`  
**新增：** `js/orders-withdraw-page.js` · `css/orders-list.css`（与充值共用）

### 筛选

用户 UID、订单号、订单状态、下单时间（默认近一周）、完成时间；**重置**按钮

### 列表字段

序号、用户UID、汇率、提现数量、提现金额(CNY)、手续费、**冻结数量**、实际成交数量、实际成交金额、收款网络、收款地址、交易哈希、订单号、操作设备、交易IP、地区、下单时间、完成时间、订单状态、错误描述

### 表尾小计/合计

仅汇总：**冻结数量**、提现数量、实际成交数量（与充值页金额汇总区分）

### 导出

导出类型 **「提现订单」**。

---

## 4. 运营后台 · 订阅管理（重构）

**页面：** `subscriptions.html`  
**新增：** `js/subscriptions-page.js` · `css/subscriptions.css`

### 数据模型

**一行 = 一次订阅订单**（首订 / 续约 / 升购各一条），按订阅时间倒序。

### 列表（13 列 + 分页）

序号、用户UID、用户昵称、创作者UID、创作者昵称、套餐、订阅时间、结束时间、剩余天数、是否开启自动续约、订单号、**备注**、操作「详情」

### 升购演示（小岛日和 → 花漾Hana，`creatorUid: 440012`）

| 订单号 | 类型 | 状态 | 要点 |
|--------|------|------|------|
| `SUB20260501001` | 月度续约 | **已取消** | 升购终止；终止时剩余 21 天 |
| `SUB20260605002` | 年度 | **升购** · 生效中 | 含原订单 21 天折算抵扣 19.60 USDT |
| `SUB20260401001` | 首订月度 | 已过期 | 历史首订 |

- **剩余天数**：升购被取消显示「已取消」标签（非「—」）
- **备注**：如 `升购系统自动取消；剩余 21 天，折算抵扣 19.60 USDT，抵扣计入 SUB20260605002`

### 筛选

用户 UID、创作者 UID、状态（全部/生效中/已过期/已取消）、**剩余天数区间**（最小—最大）  
**查询** + **重置** 紧挨最后一个筛选项；升购取消单按终止时剩余天数参与筛选

### 详情弹窗

- 上：**本次订单** KV 表（含升购抵扣字段）
- 下：**该用户订阅同一创作者的全部记录** 历史子表
- UID 可点击跳转用户详情

### 导出

导出类型 **「订阅管理」**，条件含剩余天数区间。

---

## 5. AdminModal · 谷歌验证优化

**文件：** `js/admin-modal.js`

- `confirmGoogle` 新增 **弹窗内联错误区**（`#fl-google-totp-err`）
- 验证码错误时：**不关闭弹窗**，清空输入框并聚焦，便于重试
- 支持 `opts.inlineError: false` 回退为 toast 提示
- 导出场景默认内联错误（`inlineError: true`）

---

## 6. C 端 · 创作者主页与升购订阅

**页面：** `pages-web/creator-profile.html`  
**脚本：** `js-web/subscribe-modal.js`

### 创作者主页

- 订阅档定价：**月付 28 / 季付 75 / 年付 268 USDT**
- 月付按钮 `disabled` 显示「当前等级」
- 季付卡片 **To 研发玻璃球**：升购逻辑说明（月付未到期改年付 → 结束月付、剩余天数折算抵扣）
- 订阅按钮补充 `data-creator-uid="440012"` 识别升购演示创作者

### 订阅弹层升购（`ovlSubscribe`）

演示数据对齐后台：UID `440012`，月付剩余 **21 天**，折算抵扣 **19.60 USDT**。

| 场景 | 展示 |
|------|------|
| 选季付/年付（高于当前月付） | 套餐原价 → 升购抵扣（剩余 X 天折算）→ **订阅应付**（抵扣后） |
| 余额不足步骤 | 充值缺口按 **实付** 计算（如季付 55.40，非 75.00） |
| 支付密码步骤 | 同步展示升购抵扣行 |
| 第一步摘要 | 文案说明升购抵扣与应付金额 |

### Bug 修复

- 补充 `formatUsdt()` 本地函数，修复升购场景打开弹层时 `ReferenceError` 导致按钮无反应

---

## 7. 运营后台 · 用户列表数据对齐

**文件：** `js/users-list-page.js`

新增演示用户种子，与订单/订阅页 UID 对齐：

- `445201` 王磊（充值处理中 `RCH20260510221`）
- `661204` 陈静（订阅年度生效、提现 `WD20260510055`）
- `771002` 匿名用户（充值失败 `RCH20260509188`）

---

## 8. C 端 · 隐私设置

**页面：** `pages-web/settings-privacy.html`

- 移除 **「第三方数据共享」** 行（OAuth 授权管理入口）

---

## 9. 导航与基础设施

### 侧栏（`admin-nav.js`）

订单分组顺序：充值订单 → 提现订单 → **导出任务列表**

### 样式共用

- `css/orders-list.css`：充值/提现筛选条、时间区间、表尾汇总、横向滚动
- `css/subscriptions.css`：订阅筛选条、详情 KV/历史表、备注列、sticky 序号列

---

## 10. localStorage 键（今日涉及）

```text
fl_admin_export_tasks_v1       // 导出任务队列
fl_admin_export_retention_min_v1 // 导出文件保留时长（分钟，默认 60）
fl_subscribe_return              // C 端订阅中断后返回路径（沿用）
fl_recharge_suggest              // C 端充值建议金额（沿用）
```

---

## 11. 涉及文件汇总

### 新增（运营后台）

| 文件 | 说明 |
|------|------|
| `export-tasks.html` | 导出任务列表页 |
| `css/export-tasks.css` | 导出任务列表样式 |
| `css/orders-list.css` | 充值/提现订单共用样式 |
| `css/subscriptions.css` | 订阅管理样式 |
| `js/admin-export-tasks.js` | 导出任务 Store + `AdminExport.confirm()` |
| `js/export-tasks-page.js` | 导出任务列表页逻辑 |
| `js/orders-recharge-page.js` | 充值订单页 |
| `js/orders-withdraw-page.js` | 提现订单页 |
| `js/subscriptions-page.js` | 订阅管理页 |

### 主要修改（运营后台）

| 文件 | 变更摘要 |
|------|----------|
| `orders-recharge.html` | 内联表格拆出为 JS 驱动 + 筛选/汇总/导出 |
| `orders-withdraw.html` | 同上；冻结数量汇总 |
| `subscriptions.html` | 13 列订单模型 + 升购演示 + 筛选/详情/导出 |
| `js/admin-modal.js` | 谷歌验证内联错误 |
| `js/admin-nav.js` | 导出任务菜单 + 自动加载 export store |
| `js/users-list-page.js` | 补充订单关联 UID 种子 |
| `js/users-ledger-page.js` | 接入 `AdminExport` |
| `js/settings-operation-logs-page.js` | 接入 `AdminExport` |
| `dashboard.html` / `reports.html` | 导出按钮接入统一流程 |
| `activities-*.html` | 导出按钮接入统一流程 |

### 主要修改（C 端）

| 文件 | 变更摘要 |
|------|----------|
| `js-web/subscribe-modal.js` | 升购抵扣逻辑 + `formatUsdt` + 充值/支付步骤 UI |
| `pages-web/creator-profile.html` | 订阅定价、当前等级、玻璃球批注、`data-creator-uid` |
| `pages-web/settings-privacy.html` | 移除第三方数据共享行 |

### 文档

| 文件 |
|------|
| `docs/prototype-changelog-2026-06-25.md`（本文件） |
| `docs/prototype-changelog-2026-06-25.html` |

---

*GOODFANS Web3 Creator · 原型调整记录 · 2026-06-25*
