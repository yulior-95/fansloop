# FansLoop Web 原型 · 今日调整记录

> **日期：** 2026 年 6 月 24 日（周三）  
> **范围：** 运营后台（RBAC、用户列表/资产、KYC 审核、地址簿、账变、全站分页与 UID）、C 端设置（关于/条款/安全/KYC）、钱包与充值  
> **请用浏览器打开 HTML 版（勿直接打开本 .md）：** [prototype-changelog-2026-06-24.html](./prototype-changelog-2026-06-24.html)

---

## 1. 运营后台 · RBAC 与系统设置

**页面：** `settings-roles.html` · `settings-members.html` · `settings-operation-logs.html`  
**新增：** `js/settings-rbac.js` · `css/settings-rbac.css` · `js/settings-roles-page.js` · `js/settings-members-page.js` · `js/settings-operation-logs-page.js`

### 角色管理

- 角色列表 + 权限树勾选（模块/操作粒度）
- 新建 / 编辑 / 删除角色；系统内置角色不可删
- 种子：超级管理员、运营、财务、客服、只读

### 成员管理

- 后台账号列表：姓名、邮箱、角色、状态、最近登录
- 邀请成员、编辑角色、禁用/启用、重置密码（原型弹窗）

### 操作日志

- 按模块、操作人、时间筛选
- 记录登录、角色变更、用户处置等审计字段

### 预览入口

- `admin-prototype/index.html` 平铺 iframe 预览角色 / 成员 / 操作日志切片

---

## 2. 运营后台 · 用户列表

**页面：** `users-list.html`  
**脚本：** `js/users-list-page.js`

### 列表

- 宽表布局：UID、昵称、邮箱、手机、KYC、注册时间、最近登录、状态等
- **UID 蓝色可点击** → 用户详情弹窗
- 底部分页（`AdminPager`）

### 用户详情弹窗（四 Tab）

| Tab | 内容 |
|-----|------|
| 基本信息 | 资料、KYC 状态、注册/登录元数据 |
| 资产 | 多币种余额摘要 |
| 账变记录 | 按类型筛选的流水子表 |
| 安全 | 设备、登录日志摘要 |

### 运营操作

- **KYC 认证**（代客完成）→ 写入审核记录且直接「通过」
- **支付密码重置**：两步确认 + 谷歌验证（`AdminModal.confirmGoogle`）
- 冻结 / 解冻、备注（原型占位）

---

## 3. 运营后台 · 用户资产

**页面：** `users-assets.html`  
**脚本：** `js/users-assets-page.js`

- 同一用户多钱包地址 **rowspan** 合并展示
- UID 复用全局 `js-uid-link` 打开用户详情
- 列表铺满卡片 + 底部分页

---

## 4. 弹窗与验证 · AdminModal

**文件：** `js/admin-modal.js` · `css/admin-modals.css`

| API | 说明 |
|-----|------|
| `AdminModal.notify(msg)` | 轻提示（替代部分 `toast`） |
| `AdminModal.confirmGoogle(opts)` | 敏感操作谷歌验证码确认 |
| 自动注入 | 加载 `users-list-page.js` + `admin-uid-link.js`（避免重复 script） |

弹窗样式从 `admin-shell.css` 迁入 `admin-modals.css`，与用户列表详情、KYC 审核弹窗共用。

---

## 5. 全局 UID 可点击

**文件：** `js/admin-uid-link.js`

- 任意 `.js-uid-link[data-uid]` 点击 → `AdminUsersList.openUserDetail(uid)`
- `upgradeUidCells()`：扫描表头为 **「UID」** 或 **「用户UID」** 的列，自动包裹纯数字 UID
- 由 `admin-modal.js` 在引入 Modal 的页面自动加载；JS 渲染列表需手写 `js-uid-link` 或调用 `AdminUidLink.upgrade()`

---

## 6. KYC 审核记录（核心重构）

**页面：** `kyc-manage.html`（侧栏「KYC 管理」→ **「KYC 审核记录」**）  
**新增：** `js/admin-kyc-audit-store.js` · `js/kyc-manage-page.js` · `css/kyc-manage.css`

### 数据来源

| 来源 | 写入 | 初始状态 |
|------|------|----------|
| C 端用户提交 | `kyc-store.js` → `fl_admin_kyc_audit_v1` | 待审核（钱包 zkMe 可自动通过） |
| 后台代认证 | 用户列表「KYC 认证」→ `pushFromAdminApprove` | **直接通过** |

### 列表（12 列 + 分页）

序号、用户 UID（可点）、真实姓名（OCR）、状态（待审核/通过/驳回）、设备名称、设备号、IP、地区、注册/提交/审核时间（精确到秒）、操作「查看」

### 筛选

- 独立字段：**UID、真实姓名、状态、提交时间区间、审核时间区间**
- 提交时间默认近一个月；审核时间默认空；**重置**恢复默认

### 查看弹窗

- 证件缩略图点击 **页内放大预览**（非新开标签）
- **审核记录表**：每次提交一行（含证件图、审核人、拒绝原因）
- **驳回记录表**：仅 `status === "驳回"` 的历史
- **审核进度时间轴**：用户提交 → 生成记录 → API 机审；分值分流（直接通过 / 转人工 / 驳回）；API 异常才人工介入
- 待审核：单选通过/驳回 + 拒绝原因；提交需谷歌验证
- 找不到用户时 `notify` 轻提示（非阻断弹窗）

### To 研发玻璃体批注

页面标题下 4 个玻璃球（②来源 ③列表 ④详情 ⑤代认证），悬停气泡说明需求第 2～5 点。

### 布局

- 列表铺满主内容区；序号 + UID 左 sticky，操作右 sticky
- 分页条：共 X 条居左，页码居右

---

## 7. KYC 机审 · 人脸匹配分值

**页面：** `risk-kyc-face.html`  
**新增：** `js/admin-kyc-config-store.js` · `js/risk-kyc-face.js`

- 配置 **直接通过分数**（默认 85）、**人工审核下限**（默认 60）
- `evaluateFaceScore(score)` 返回：`auto_pass` / `manual_review` / `auto_reject`
- 规则预览区实时展示三分流区间
- 侧栏入口：**全局参数 / KYC 人脸匹配**；`settings-global.html` 增加跳转卡片

---

## 8. 运营后台 · 全站列表分页

**文件：** `js/admin-pagination.js` · `css/admin-shell.css`（分页条样式）

### API

```text
AdminPager.create({ mount, pageSize, onChange })
AdminPager.bindDomTbody(table, options)
AdminPager.bootStaticTables()
```

- `admin-nav.js` 自动 `document.write` 加载分页脚本
- JS 驱动列表 tbody 加 `data-pager="js"` 避免与静态引导重复绑定

### 已接入页面

用户列表、用户资产、KYC 审核、地址簿、账变记录、操作日志、成员、角色、积分监控、活动类型；充值/提现订单由假分页改为真分页。

---

## 9. 地址簿管理

**页面：** `users-address-book.html`  
**新增：** `js/users-address-book-page.js` · `css/users-address-book.css`

### 变更

- 侧栏移除 **「银行卡」** 菜单（`users-bank-cards.html` 文件保留）
- 去掉页顶说明文案
- **「地址」→「提现地址」**；网络显示 `TRON(TRC20)` 格式
- 去掉操作列；UID 蓝色可点
- 筛选：UID、地址/网络/备注关键词
- 列表全宽铺满 + 分页

---

## 10. 账变记录

**页面：** `users-ledger.html`  
**新增：** `js/users-ledger-page.js` · `css/users-ledger.css`

### 筛选类型（8 种）

链上充值、链上提现、积分人工充值、积分人工扣除、积分消耗、积分获取、充值手续费、提现手续费

### 列表字段（无操作列）

序号、账变类型、用户UID、订单号、币种（USDT/JF）、汇率、数量（2 位小数）、收支类型（收入/支出）、金额(CNY)、冻结手续费、手续费、账变时间、变动备注

- 冻结手续费：下单冻结额，不会随失败减少
- 手续费：实际扣除；失败单为 0 显示「—」
- 积分类备注含活动名称（演示数据）

---

## 11. C 端 · 设置模块

### 关于 FansLoop

**页面：** `pages-web/settings-about.html`  
**新增：** `js-web/settings-about-page.js` · `css-web/settings-about-terms.css`

- 应用信息、版本号、检查更新（原型）
- 设置导航新增 **「关于」** 分组

### 服务条款

**页面：** `pages-web/settings-terms.html`  
**新增：** `js-web/settings-terms-page.js`

- 用户协议 / 隐私政策 Tab；正文滚动区

### 安全

**页面：** `pages-web/settings-security.html` · `js-web/settings-security-page.js`

- 安全评分展示优化
- 与 KYC、支付密码状态联动（只读摘要）

### 设置导航

`js-web/settings-nav.js` — 新增关于/条款入口；创作者分组保持精简

---

## 12. C 端 · KYC 与 UID

**文件：** `js-web/kyc-store.js` · `js-web/user-prototype-registry.js`

- 用户提交证件/钱包验证时推送后台审核流水
- KYC 状态按用户维度存储；与后台 `AdminKycAuditStore` 共用 `fl_admin_kyc_audit_v1`
- 演示账号 **publicUid** 统一为 **6 位数字**（与后台种子对齐）
- 各 KYC 流程页挂载 `kyc-store` 脚本

---

## 13. C 端 · 钱包与充值

### 钱包

**页面：** `pages-web/wallet.html`

- 总余额卡片 **「转账」按钮隐藏**（`hidden`）

### 充值

**页面：** `pages-web/recharge.html` · `js-web/recharge-flow.js` · `css-web/recharge-flow.css`

- 充值币种 **固定 USDT**，移除币种下拉与搜索
- 展示为静态只读 `fl-dd-static-coin` 样式

---

## 14. 导航与基础设施

### 侧栏（`admin-nav.js`）

- 移除银行卡入口
- KYC 管理 → KYC 审核记录
- 新增 risk-kyc-face 入口

### 跨端对齐

| 概念 | C 端 | 后台 |
|------|------|------|
| 用户 UID | `FLUserRegistry` / `publicUid` | 列表种子、`MOCK_USERS` |
| KYC 审核 | `kyc-store.js` 写入 | `admin-kyc-audit-store.js` 读取 |
| 用户详情 | — | `AdminUsersList.openUserDetail` |

---

## 15. localStorage 键（今日涉及）

```text
fl_admin_kyc_audit_v1      // KYC 审核流水（C 端写入 + 后台读写）
fl_admin_kyc_face_config_v1 // 机审人脸分值阈值
fl_admin_session           // 后台登录会话
fl_admin_rbac_v1           // 角色权限（RBAC store）
fl_settings_wallets_v1     // C 端钱包（沿用）
fl_display_prefs_v1        // 全站外观（沿用）
```

---

## 16. 涉及文件汇总

### 新增（运营后台）

| 文件 | 说明 |
|------|------|
| `css/settings-rbac.css` | RBAC 页样式 |
| `css/kyc-manage.css` | KYC 审核列表/弹窗 |
| `css/users-address-book.css` | 地址簿全宽表 |
| `css/users-ledger.css` | 账变全宽表 |
| `js/settings-rbac.js` | 角色权限数据与 UI |
| `js/settings-roles-page.js` | 角色页 |
| `js/settings-members-page.js` | 成员页 |
| `js/settings-operation-logs-page.js` | 操作日志页 |
| `js/users-list-page.js` | 用户列表 + 详情弹窗 |
| `js/users-assets-page.js` | 用户资产 |
| `js/admin-uid-link.js` | 全局 UID 点击 |
| `js/admin-kyc-audit-store.js` | KYC 审核数据层 |
| `js/admin-kyc-config-store.js` | 机审分值配置 |
| `js/kyc-manage-page.js` | KYC 审核页 |
| `js/risk-kyc-face.js` | 人脸匹配配置页 |
| `js/users-address-book-page.js` | 地址簿页 |
| `js/users-ledger-page.js` | 账变页 |
| `risk-kyc-face.html` | 机审阈值配置 |

### 新增（C 端）

| 文件 | 说明 |
|------|------|
| `pages-web/settings-about.html` | 关于页 |
| `pages-web/settings-terms.html` | 条款页 |
| `js-web/settings-about-page.js` | 关于页逻辑 |
| `js-web/settings-terms-page.js` | 条款页逻辑 |
| `css-web/settings-about-terms.css` | 关于/条款共用样式 |

### 主要修改

| 文件 | 变更摘要 |
|------|----------|
| `admin-prototype/users-list.html` | 宽表 + 外链 users-list-page.js |
| `admin-prototype/users-assets.html` | 多钱包 rowspan + 分页 |
| `admin-prototype/kyc-manage.html` | 全面重构 |
| `admin-prototype/users-address-book.html` | 地址簿重做 |
| `admin-prototype/users-ledger.html` | 账变重做 |
| `admin-prototype/js/admin-modal.js` | notify / confirmGoogle / UID 注入 |
| `admin-prototype/js/admin-pagination.js` | 全站分页扩展 |
| `admin-prototype/js/admin-nav.js` | 导航项调整 |
| `admin-prototype/index.html` | RBAC 平铺预览 |
| `js-web/kyc-store.js` | 推送后台审核 + 用户维度 KYC |
| `js-web/settings-nav.js` | 关于/条款导航 |
| `js-web/settings-security-page.js` | 安全评分 |
| `pages-web/wallet.html` | 隐藏转账 |
| `pages-web/recharge.html` | 固定 USDT |
| `orders-recharge.html` / `orders-withdraw.html` | 真分页 |

### 文档

| 文件 |
|------|
| `docs/prototype-changelog-2026-06-24.md`（本文件） |
| `docs/prototype-changelog-2026-06-24.html` |

---

*FansLoop Web3 Creator · 原型调整记录 · 2026-06-24*
