# FansLoop Web 原型 · 今日调整记录

> **日期：** 2026 年 6 月 20 日（周六）  
> **范围：** 设置模块、全局偏好、侧栏、钱包与支付等  
> **HTML 版：** [prototype-changelog-2026-06-20.html](./prototype-changelog-2026-06-20.html)

---

## 1. 设置 · 账户资料

**页面：** `pages-web/settings-account.html`

### 调整点

- 基础资料表单第二行字段名由 **Handle** 改为 **用户名**
- 帮助文案同步：`当前 Handle 已使用…` → `当前用户名已使用…`
- 个性域名卡片说明：`基于 Handle 自动生成` → `基于用户名自动生成`

> 输入规则与域名格式（`fansloop.io/@xxx`，字母数字下划线）保持不变，仅 UI 文案中文化。

---

## 2. 设置 · 钱包与支付

**页面：** `pages-web/settings-wallet.html`  
**新增：** `css-web/settings-wallet-page.css` · `js-web/settings-wallet-page.js`

### 新增交互

- 连接新钱包（多步弹层：选提供商 → QR / 等待插件 → 签名 → 成功）
- Coinbase / OKX / WalletConnect → 扫码；MetaMask / Rainbow → 插件等待
- 切换主钱包、QR 收款、编辑备注、解绑（含 2FA 确认）
- 自定义下拉 `set-pref-dd`：默认充值链网络

### 移除 / 精简

- 银行卡 / 法币相关入口
- 快捷支付方式隐藏块
- 快捷充值金额预设
- 小额自动结算

### 业务约束

- 充值 / 提现固定展示 **USDT**
- 备用钱包 USDC → USDT

---

## 3. 设置 · 我的邀请人

**页面：** `pages-web/settings-invite-relation.html`

- 删除「永久关联」卡片内蓝色提示条（注册奖励 / 24h 申诉说明）

---

## 4. 设置 · 通知偏好

**页面：** `pages-web/settings-notification.html`

### 布局优化

- `.dnd-time` 免打扰时段改为单行紧凑布局，减少换行

### 移除区块

- 「每周摘要邮件」
- 「通知频率上限」

---

## 5. 设置 · 外观与语言

**页面：** `pages-web/settings-display.html`  
**新增：** `js-web/settings-display-page.js` · `js-web/global-display-prefs.js` · `css-web/global-display-prefs.css`

### 移除区块

- 强调色 Accent 行
- 显示密度
- 送礼特效
- 减少动效（无障碍）

### 全站生效能力

| 功能 | 机制 |
|------|------|
| 主题 | `html[data-fl-theme]` + `fl_display_prefs_v1` |
| 字体 | `--fl-font-scale` + 主要文案字号映射 |
| 高对比 / 无衬线 / 动效 / 毛玻璃 | `html[data-fl-*]` 属性 |
| 界面语言 | `fansloop-ui-lang` + 侧栏 i18n |

---

## 6. 设置 · 安全

**页面：** `pages-web/settings-security.html`

- 「近期安全活动」悬停说明图标
- 「查看全部安全日志」完整弹层
- 登录设备区块移除多余顶部分割线

---

## 7. 侧栏 Creator Pro & 用户菜单

**脚本：** `creator-pro-store.js` · `sidebar-bottom-interactions.js`

- Pro 卡片按会员状态显隐
- 用户 ⋮ 快捷菜单
- 原型切片：`proto-sidebar-pro-non-member.html` · `proto-sidebar-pro-member.html`

---

## 8. 全局基础设施

| 文件 | 作用 |
|------|------|
| `css-web/common-web.css` | 引入全局外观 CSS；字号缩放 |
| `js-web/global-display-prefs.js` | 外观偏好读写/应用 |
| `js-web/global-lang-switch.js` | 语言切换 + 侧栏 i18n |
| `js-web/app-sidebar-global.js` | 首屏 boot + 侧栏翻译 |

---

## 9. index.html 平铺切片

- `#sidebar-bottom` — 侧栏 Pro / 用户菜单
- `#settings-wallet` — 钱包主页面 + 6 个 modal 深链 iframe

---

## 10. localStorage 键

```
fl_display_prefs_v1           // 外观偏好
fansloop-ui-lang              // 界面语言
fl_settings_wallets_v1        // 钱包列表
fl_settings_wallet_prefs_v1   // 钱包偏好
fl_creator_pro_v1             // Creator Pro
fl_sidebar_collapsed          // 侧栏折叠
fl_global_accessibility_v1    // 跨国界无障碍
```

---

## 涉及 HTML 页面汇总

| 页面 | 变更 |
|------|------|
| `settings-account.html` | Handle → 用户名 |
| `settings-wallet.html` | 重构 + 弹层 |
| `settings-invite-relation.html` | 删提示条 |
| `settings-notification.html` | DND 布局 + 删两行 |
| `settings-display.html` | 外观/语言全站交互 |
| `settings-security.html` | 安全日志弹层 |
| `proto-sidebar-pro-*.html` | 新增切片 |
| `index.html` | 平铺区块 |
