# GOODFANS Web 端高保真原型 · PRD

**文档版本**：2026-05-09  
**原型仓库路径**：`web3-app-prototype/pages-web/`（HTML + CSS + Font Awesome）  
**主索引**：`index-web.html`（分组 iframe）、`index-web-flat.html`（平铺 iframe）、交互演示壳 `yanshi-web.html`  

> **说明**：本文档描述当前 **`pages-web`** 下已实现的原型界面与业务规则。  
> **`pages/home.html`** 为移动端竖屏单列原型，与本文 Web 端主线分离；Web 高保真以 **`pages-web/home.html`** 为准。  
> **截图**：请将浏览器截图保存至 `docs/prd/screenshots/`，文件名与下表一致后，下方图片即可正常显示。

---

## 1. 文档与原型范围

### 1.1 目标读者

- 产品 / 设计：对齐信息架构与文案  
- 前端开发：页面清单、交互与本地存储约定  
- 测试：验收清单与规则边界  

### 1.2 技术栈与约束

- 静态 HTML，样式 `css-web/common-web.css` 等  
- 图标：Font Awesome 6  
- 配图：Unsplash / 等公开图床 URL  
- **不包含** 真实后端；预约直播等使用 `localStorage` 模拟（见第 3 节规则）  

---

## 2. 截图占位（请补充实际 PNG）

以下路径相对于本文档：`./prd/screenshots/`。

### 2.1 首页 · 待审核与预约侧栏

![首页右侧 · 待审核与预约模块](./prd/screenshots/home-aside-review-live.png)

**页面文件**：`pages-web/home.html`  

**可见文案（原型）**

- 卡片标题：**待审核与预约**；角标：**审核 2**（与待审核数量一致）  
- 双指标：**待审核投稿 → 2**；**预约直播 → 0 或 1**  
- 说明：当前有 **2** 条投稿正在审核…；每位创作者最多保留 **1** 场预约直播  
- 主按钮：**进入创作内容 · 待审核**；**新建直播 / 预约**  
- 分区：**预约直播详情** — 无预约时展示空态说明；有预约时展示标题、时间、形式、**开播准备 / 关闭**  

### 2.2 首页 · 信息流与强提醒（可选）

![首页信息流与预约条](./prd/screenshots/home-feed-composer.png)

**说明**：当存在预约且进入「开播前 20 分钟」窗口时，主栏顶部可出现强提醒条（与侧栏数据同源）。  

### 2.3 创建直播弹窗

![创建直播](./prd/screenshots/create-publish-live.png)

**页面文件**：`pages-web/create-publish-live.html`（通常由 `FL_openInteractionModal` 以 iframe 打开）  

### 2.4 创作中心 · 预约列表

![创作中心预约区块](./prd/screenshots/create-center-live.png)

**页面文件**：`pages-web/create.html`，锚点 `#live-res`  

---

## 3. 全局业务规则（原型）

### 3.1 预约直播（本地 `fl-live-reservation.js`）

| 规则 | 说明 |
|------|------|
| 唯一预约 | 每位创作者（浏览器维度）同时仅 **1** 条预约，存 `localStorage` 键 `fl_live_reservation` |
| 重复创建 | 已有预约时再提交预约 → 提示 **「已存在预约直播」** |
| 开播前 20 分钟 | `scheduledAt - 20min ≤ now < scheduledAt` 时，首页 / 创作页展示 **强提醒** |
| 超时关闭 | `now > scheduledAt + 30 分钟` 时自动清除预约，并一次性 Toast **预约直播已超时，平台已自动关闭**（原型） |
| 关闭预约 | 用户可在首页主卡片、右侧详情、创作中心等处 **关闭预约** |

### 3.2 待审核内容（演示数据）

- 侧栏与文案中 **待审核条数当前固定为 2**（与「待审核列表」演示表一致），后续可对接真实接口字段 `pendingCount`。  

### 3.3 弹窗通信（嵌入父页时）

- 打开：`postMessage({ type: 'goodfans-open-modal', page })`（见 `fl-interaction-modal.js`）  
- 关闭：`goodfans-close-modal`  
- 预约成功：`goodfans-live-scheduled`（演示壳 `yanshi-web.html` 会转发至内层 iframe）  

---

## 4. 模块与页面对照

### 4.1 访客优先 / 登录注册

| 功能 | 页面文件 | 说明 |
|------|-----------|------|
| 游客首页 | `guest-home.html` | 默认落地 |
| 登录主弹窗 | `modal-login-main.html` | 钱包 / 邮箱入口 |
| 邮箱登录注册链路 | `modal-email-login.html` 等 | 验证码 / 密码 / 冲突提示 |
| 忘记密码 | `modal-email-forgot-password.html` | |
| 登录错误合集 | `login-errors.html` | 多种异常状态 |
| 绑定冲突 | `modal-bind-email-conflict.html`、`modal-bind-wallet-conflict.html` | |

### 4.2 主场景（App Shell）

| 功能 | 页面文件 |
|------|-----------|
| 首页 Feed | `home.html` |
| 发现 | `discover.html` |
| 消息 | `messages.html` |
| 个人主页 | `profile.html` |
| 钱包总览 | `wallet.html` |

### 4.3 内容创作与直播

| 功能 | 页面文件 |
|------|-----------|
| 创作中心 | `create.html`（待审核表、预约直播块、`#pending` / `#live-res`） |
| 发布图文 / 视频 / 付费 | `create-publish-image.html`、`create-publish-video.html`、`create-publish-paid.html` |
| 创建直播弹窗 | `create-publish-live.html` |
| OBS 配置说明 | `modal-live-obs-guide.html` |
| 解锁 / 订阅流程 | `flow-unlock-paid.html`、`flow-subscribe-creator.html` |

### 4.4 话题与直播

| 功能 | 页面文件 |
|------|-----------|
| 话题广场 / 详情 | `topics.html`、`topic-detail.html` |
| 直播列表 / 直播间 | `live-all.html`、`live-detail.html` |
| 创作者主页 | `creator-profile.html` |

### 4.5 交互弹窗（二级）

| 功能 | 页面文件 |
|------|-----------|
| 评论 / 分享 / 送礼 | `comment-modal.html`、`share-modal.html`、`gift-modal.html` |

### 4.6 设置中心

| 功能 | 页面文件 |
|------|-----------|
| 总览与子页 | `settings.html` 及 `settings-account.html` … `settings-display.html` |

### 4.7 充值 / 提现 / 账变

| 功能 | 页面文件（节选） |
|------|-------------------|
| 充值 USDT / 法币 | `recharge.html`、`recharge-fiat.html` 等 |
| 提现银行卡 / USDT | `withdraw-fiat.html`、`withdraw-usdt.html` 等 |
| MoonPay 相关弹窗 | `modal-recharge-wallet-moonpay.html` 等 |
| 账变与详情 | `transactions.html`、`transaction-detail.html` 等 |

### 4.8 积分与演示壳

| 功能 | 页面文件 |
|------|-----------|
| 积分商城 / 计时奖励 | `points-mall.html`、`modal-points-reward.html` |
| 全站交互演示 | `yanshi-web.html` |

---

## 5. 页面清单（`pages-web` 全部 HTML）

以下为当前目录下原型页面文件（用于开发与测试勾选），共 **85** 个文件：

<details>
<summary>展开文件名列表</summary>

- `bookmarks.html`
- `comment-modal.html`
- `create-publish-image.html`
- `create-publish-live.html`
- `create-publish-paid.html`
- `create-publish-video.html`
- `create.html`
- `creator-income.html`
- `creator-profile.html`
- `discover.html`
- `flow-subscribe-creator.html`
- `flow-unlock-paid.html`
- `funds-flow-detail.html`
- `funds-history.html`
- `gift-modal.html`
- `guest-home.html`
- `home.html`
- `live-all.html`
- `live-detail.html`
- `login-errors.html`
- `login-modal-home-overlay.html`
- `messages.html`
- `modal-bind-email-conflict.html`
- `modal-bind-wallet-conflict.html`
- `modal-email-forgot-password.html`
- `modal-email-login-password.html`
- `modal-email-login.html`
- `modal-email-register-code.html`
- `modal-email-unregistered-prompt.html`
- `modal-footer-troubleshoot.html`
- `modal-live-obs-guide.html`
- `modal-login-help.html`
- `modal-login-main.html`
- `modal-metamask-troubleshoot.html`
- `modal-points-reward.html`
- `modal-poster-share.html`
- `modal-recharge-fiat-moonpay.html`
- `modal-recharge-wallet-moonpay.html`
- `modal-wallet-auth.html`
- `modal-wallet-tutorial.html`
- `modal-withdraw-bank-moonpay.html`
- `modal-withdraw-chain-moonpay.html`
- `notifications.html`
- `onboarding-profile-complete.html`
- `points-mall.html`
- `profile.html`
- `recharge-fiat-bind.html`
- `recharge-fiat-switch-card.html`
- `recharge-fiat-verify.html`
- `recharge-fiat.html`
- `recharge-timeout.html`
- `recharge.html`
- `settings-account.html`
- `settings-display.html`
- `settings-notification.html`
- `settings-privacy.html`
- `settings-security-binding.html`
- `settings-security.html`
- `settings-wallet.html`
- `settings.html`
- `share-modal.html`
- `subscriptions.html`
- `topic-detail.html`
- `topics.html`
- `transaction-appeal-detail.html`
- `transaction-appeal.html`
- `transaction-contact.html`
- `transaction-detail.html`
- `transaction-more-menu.html`
- `transaction-share-poster.html`
- `transactions-export.html`
- `transactions-search.html`
- `transactions.html`
- `wallet-address-book.html`
- `wallet-list-full.html`
- `wallet.html`
- `withdraw-fiat-edit.html`
- `withdraw-fiat-success.html`
- `withdraw-fiat-verify-pwd.html`
- `withdraw-fiat-verify.html`
- `withdraw-fiat.html`
- `withdraw-help-modal.html`
- `withdraw-recipient-add.html`
- `withdraw-usdt.html`
- `yanshi-web.html`

</details>

---

## 6. 验收建议（节选）

- [ ] `home.html` 侧栏双指标与 **审核 2**、预约 0/1 一致；预约详情与主栏、创作中心数据一致  
- [ ] 预约创建、关闭、超时后各入口同步刷新  
- [ ] `create-publish-live.html` 与 `fl-live-reservation.js` 规则符合第 3 节  
- [ ] `index-web.html` / `index-web-flat.html` 可嵌入打开主要页面无 404  

---

## 7. 修订记录

| 日期 | 变更摘要 |
|------|-----------|
| 2026-05-09 | 初版：模块化 PRD、规则说明、截图占位、`pages-web` 全列表；首页侧栏合并待审核与预约展示 |  
