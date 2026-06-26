# FansLoop Web 原型 · 今日调整记录

> **日期：** 2026 年 6 月 26 日（周五）  
> **对比基准：** [2026-06-25 变更记录](./prototype-changelog-2026-06-25.md)（导出任务、充提订单、订阅升购等）  
> **范围：** 风控安全三模块（会员白名单、敏感词管理、敏感词风控管理）重构/新增；C 端白名单与敏感词联动；通知偏好精简  
> **请用浏览器打开 HTML 版（勿直接打开本 .md）：** [prototype-changelog-2026-06-26.html](./prototype-changelog-2026-06-26.html)

---

## 1. 运营后台 · 会员白名单（重构）

**页面：** `risk-whitelist.html`  
**新增：** `js/risk-whitelist-page.js` · `css/risk-whitelist.css` · `js-web/risk-whitelist-store.js`

### 相对 6/25 的变化

6/25 为静态双 Tab（订阅场景 / 付费直播观看）演示页；今日重构为 **四 Tab + localStorage 数据层 + RBAC 权限点 + C 端联动**。

### 四个 Tab

| Tab | 能力 |
|-----|------|
| 邮箱白名单 | 邮箱后缀列表；系统预置 40+ 常见后缀；增删改查 + 分页 |
| 手续费白名单 | UID + 适用范围（充值 / 提现）；备注、创建人、创建时间 |
| 付费直播观看白名单 | UID 列表；创建人、创建时间 |
| 付费内容观看白名单 | UID 列表；创建人、创建时间 |

### 筛选与操作

- 各 Tab 独立筛选条：**查询** + **重置**
- 邮箱 Tab：按后缀关键词
- 手续费 Tab：UID + 适用范围
- 直播 / 内容 Tab：UID
- 按钮带 `data-perm` 与 RBAC 联动（无权限时隐藏）

### To 研发玻璃球

各 Tab 顶部批注说明后台配置与用户端行为对应关系。

---

## 2. 运营后台 · 敏感词管理（重构）

**页面：** `risk-sensitive-words.html`  
**新增：** `js/risk-sensitive-words-page.js` · `css/risk-sensitive-words.css` · `js-web/chat-sensitive-words-store.js`

### 相对 6/25 的变化

6/25 为静态表格（词 / 分组 / 动作 / 更新）；今日改为 **统一词库 + 多场景适用范围 + 开关 + 弹窗 CRUD**。

### 列表字段

敏感词、**适用范围**（多选标签）、是否开启（**开关直接切换**）、添加时间、修改时间、操作（编辑 / 删除）

### 适用范围（表头感叹号 tooltip）

| 场景 | 处置 |
|------|------|
| 即时聊天 | 脱敏发送 |
| 直播互动 | 脱敏发送 |
| 内容发布 | 拦截 / 驳回 |
| 资料类 | 保存报错 |

### 筛选

敏感词关键词；**查询** + **重置**；右上角 **新增敏感词**

### 数据层

- `processOutgoing(text, scene, meta)`：按场景返回脱敏/拦截结果
- 命中时联动 `FLSensitiveRiskStore.recordHit()` 写入风控记录
- 存储键：`fl_admin_chat_sensitive_words_v1`

---

## 3. 运营后台 · 敏感词风控管理（新增）

**页面：** `risk-sensitive-risk.html`（新页面）  
**新增：** `js/risk-sensitive-risk-page.js` · `css/risk-sensitive-risk.css` · `js-web/sensitive-risk-store.js`

### 三 Tab 结构

#### Tab 1 · 异常敏感词数据

**列表（12 列 + 分页）**

序号、同场景次数、用户 UID、触发场景、触发时间、触发事件、操作 IP、状态、禁言倒计时、操作人、最新操作时间、操作

- 仅展示 **待处理 / 禁言中**（已忽略不出现在本 Tab）
- **同场景次数**：该 UID 在当前场景下的历史累计命中（IM / 直播分开）
- 左右滑动时固定：序号、同场景次数、UID（左）+ 操作（右）
- 操作：待处理 → 禁言 / 忽略；禁言中 → 解禁
- 禁言倒计时仅 **自动禁言小时** 展示；永久 / 人工为 `--`

**筛选**

用户 UID、状态、**触发时间区间**、**最新操作时间区间**；**查询** + **重置**

#### Tab 2 · 操作日志

**列表（10 列 + 分页）**

序号、**异常次数**（tooltip：截至本次风控，用户历史触发次数，包含当前）、用户 UID、触发场景、触发时间、触发事件、操作 IP、操作事件、操作人、最新操作时间

- 左右滑动固定：序号、异常次数、UID（左）+ 最新操作时间（右）

**筛选**

用户 UID、**操作时间**、**触发时间**、**最新操作时间**（均为起止区间）；**查询** + **重置**

#### Tab 3 · 风控参数管理

**全局统计策略**

| 配置项 | 选项 |
|--------|------|
| 统计窗口 | 近 7 / 30 / 90 天、终身累计 |
| 计数范围 | 仅有效命中 / 全部命中（含已忽略） |
| 启用场景 | 即时聊天、直播互动（**各场景独立计数，不合并**） |

**阶梯规则**

窗口内触发 ≥ N 次 → 结局（自动忽略 / 禁言小时 / 禁言永久 / 手动禁言）+ 禁言时长 + 启用开关

**策略变更原则（保存弹窗说明）**

- **禁言中**：维持现状，不追溯改判
- **待处理**：维持状态，不自动禁言/忽略
- **后续新命中**：按新策略计数匹配
- 可选：同步更新待处理记录的「触发事件」展示文案（不改变处置状态）
- `configVersion` + 命中快照 `evalConfigVersion` / `evalSnapshot`：已产生记录不追溯

**触发事件文案示例**

`7天内·直播互动≥8次 · 禁言小时（1h）`

### To 研发玻璃球

说明同场景计数、分场景阶梯、存储键 `fl_admin_sensitive_risk_v1` 等。

---

## 4. 导航与 RBAC

### 侧栏（`admin-nav.js`）

风控安全分组新增/调整：

- **会员白名单**（重构）
- **敏感词管理**（重构，原静态页升级）
- **敏感词风控管理**（**新菜单**）

### 角色权限（`settings-rbac.js`）

会员白名单新增权限树：

- 查看
- 邮箱：添加 / 编辑 / 删除
- 手续费：添加 / 编辑 / 删除
- 直播白名单：添加 / 删除
- 内容白名单：添加 / 删除

---

## 5. C 端联动

### 邮箱注册白名单

**文件：** `js-web/auth-unified-flow.js` · `pages-web/modal-login-main.html`

- 注册时校验邮箱后缀是否在后台白名单
- 不在白名单内提示使用常见邮箱或联系客服

### 付费直播观看白名单

**文件：** `js-web/live-whitelist-access.js` · `pages-web/live-detail.html`

- URL `?paidLive=1` 展示付费门控
- 白名单 UID 自动解锁并 toast 提示
- 监听 `fl-risk-whitelist-change` 实时同步

### 付费内容（PPV）白名单

**文件：** `js-web/ppv-unlock-modal.js` · `js-web/feed-stack-builder.js` · `pages-web/home.html`

- 白名单用户点击 PPV 解锁 **跳过支付弹层**，直接解锁并派发 `fl-ppv-unlocked`
- Feed 流对白名单用户展示已解锁状态

### 敏感词脱敏（直播）

**文件：** `js-web/live-detail.js` · `js-web/live-host.js` · `pages-web/live-detail.html` · `pages-web/create-live-host.html`

- 观众端发送弹幕走 `FLChatSensitiveWordsStore.processOutgoing(..., 'live')`
- 命中后整段脱敏展示（`is-sensitive` / `m-masked` 样式）
- 主播端演示弹幕同步脱敏样式
- 命中写入 `FLSensitiveRiskStore.recordHit`，场景 `live`

---

## 6. C 端 · 通知偏好（已提交）

**页面：** `pages-web/settings-notification.html`  
**提交：** `964da14`（2026-06-26 10:36）

- 移除 **短信** 通知渠道列
- 页头说明文案同步：站内 / 邮件 / 推送（不含短信）

---

## 7. localStorage 键（今日涉及）

```text
fl_admin_risk_whitelist_v1          // 会员白名单（邮箱/手续费/直播/内容）
fl_admin_chat_sensitive_words_v1  // 敏感词库
fl_admin_sensitive_risk_v1        // 敏感词风控（命中/日志/阶梯参数，seedVersion=8）
```

---

## 8. 涉及文件汇总

### 新增

| 文件 | 说明 |
|------|------|
| `admin-prototype/risk-sensitive-risk.html` | 敏感词风控管理页 |
| `admin-prototype/css/risk-sensitive-risk.css` | 风控页样式（筛选、sticky 列、tooltip） |
| `admin-prototype/css/risk-sensitive-words.css` | 敏感词管理样式 |
| `admin-prototype/css/risk-whitelist.css` | 会员白名单样式 |
| `admin-prototype/js/risk-sensitive-risk-page.js` | 风控页逻辑 |
| `admin-prototype/js/risk-sensitive-words-page.js` | 敏感词管理逻辑 |
| `admin-prototype/js/risk-whitelist-page.js` | 会员白名单逻辑 |
| `js-web/risk-whitelist-store.js` | 白名单 Store |
| `js-web/chat-sensitive-words-store.js` | 敏感词 Store |
| `js-web/sensitive-risk-store.js` | 风控 Store |
| `js-web/live-whitelist-access.js` | 付费直播门控 |

### 主要修改（运营后台）

| 文件 | 变更摘要 |
|------|----------|
| `risk-whitelist.html` | 四 Tab 重构 + 筛选分页 + RBAC |
| `risk-sensitive-words.html` | 适用范围 + 开关 + JS 驱动列表 |
| `js/admin-nav.js` | 新增敏感词风控菜单项 |
| `js/settings-rbac.js` | 白名单权限树 |

### 主要修改（C 端 / 共享）

| 文件 | 变更摘要 |
|------|----------|
| `js-web/auth-unified-flow.js` | 邮箱后缀白名单校验 |
| `js-web/live-detail.js` | 直播弹幕敏感词脱敏 |
| `js-web/live-host.js` | 主播端脱敏演示 |
| `js-web/ppv-unlock-modal.js` | 内容白名单直通解锁 |
| `js-web/feed-stack-builder.js` | Feed PPV 白名单态 |
| `pages-web/live-detail.html` | 引入 store + 脱敏样式 + 付费门控 |
| `pages-web/create-live-host.html` | 引入敏感词 store |
| `pages-web/home.html` | 引入白名单 store |
| `pages-web/modal-login-main.html` | 引入白名单 store |
| `pages-web/settings-notification.html` | 移除短信渠道 |

### 文档

| 文件 |
|------|
| `docs/prototype-changelog-2026-06-26.md`（本文件） |
| `docs/prototype-changelog-2026-06-26.html` |

---

## 9. 与 6 月 25 日对比一览

| 维度 | 6/25 | 6/26（今日） |
|------|------|----------------|
| 订单 / 订阅 | 充提订单重构、订阅升购、导出任务 | 沿用，无结构性变更 |
| 风控白名单 | 静态 2 Tab 演示 | 四 Tab + Store + C 端联动 |
| 敏感词 | 静态词表 | 多场景词库 + 脱敏/拦截 + 风控写入 |
| 敏感词风控 | 无（仅有旧 `risk-abnormal-speech.html`） | 新页面：异常数据 / 日志 / 阶梯参数 |
| C 端 | 升购订阅、隐私设置 | + 邮箱白名单、PPV/直播白名单、直播脱敏 |
| 通知 | — | 移除短信渠道 |

---

*FansLoop Web3 Creator · 原型调整记录 · 2026-06-26*
