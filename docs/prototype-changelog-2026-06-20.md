# GOODFANS Web 原型 · 今日调整记录

> **日期：** 2026 年 6 月 20 日（周六）  
> **范围：** 设置模块、全局偏好、侧栏、钱包与支付、订阅、会员订阅设置、优惠码、创作者主页、等级与周榜、按篇购买文案、跨国界无障碍、直播页等  
> **HTML 版：** [prototype-changelog-2026-06-20.html](./prototype-changelog-2026-06-20.html)

---

## 1. 设置 · 账户资料

**页面：** `pages-web/settings-account.html`

- 基础资料第二行字段名 **Handle** → **用户名**
- 帮助文案：`当前 Handle 已使用…` → `当前用户名已使用…`
- 个性域名说明：`基于 Handle 自动生成` → `基于用户名自动生成`
- 输入规则（`goodfans.io/@xxx`、字母数字下划线）不变

---

## 2. 设置 · 钱包与支付

**页面：** `pages-web/settings-wallet.html`  
**新增：** `css-web/settings-wallet-page.css` · `js-web/settings-wallet-page.js`

### 新增交互

- 连接新钱包（多步弹层：选提供商 → QR / 插件等待 → 签名 → 成功）
- Coinbase / OKX / WalletConnect → 扫码；MetaMask / Rainbow → 插件等待
- 切换主钱包、QR 收款、编辑备注、解绑（2FA 确认）
- 自定义下拉 `set-pref-dd`：默认充值链网络

### 移除 / 精简

- 银行卡 / 法币入口、快捷支付方式隐藏块、快捷充值金额、小额自动结算、**订阅自动续费**卡片（迁至订阅页）

### 业务约束

- 充值 / 提现固定 **USDT**；备用钱包 USDC → USDT

### 存储

- `fl_settings_wallets_v1` · `fl_settings_wallet_prefs_v1`

---

## 3. 设置 · 我的邀请人

**页面：** `pages-web/settings-invite-relation.html`

- 删除「永久关联」卡片内蓝色提示条（注册奖励 / 24h 申诉说明）

---

## 4. 设置 · 通知偏好

**页面：** `pages-web/settings-notification.html`

- `.dnd-time` 免打扰区改为单行紧凑布局（图标 + 标题/时区 + 时间选择器）
- 删除「每周摘要邮件」
- 删除「通知频率上限」

---

## 5. 设置 · 外观与语言

**页面：** `pages-web/settings-display.html`  
**新增：** `js-web/settings-display-page.js` · `js-web/global-display-prefs.js` · `css-web/global-display-prefs.css`

### 移除区块

- 强调色 Accent、显示密度、送礼特效、减少动效（无障碍）
- **界面动画**开关（卡片精简后仅保留毛玻璃）

### 主题 / 字体 / 开关（全站）

| 功能 | 机制 |
|------|------|
| 主题（深/浅/跟随系统） | `html[data-fl-theme]` + `fl_display_prefs_v1` |
| 字体 5 档滑块 | `--fl-font-scale` · `common-web.css` 基准字号 |
| 高对比 / 无衬线 / 毛玻璃 | `html[data-fl-high-contrast]` 等属性 |
| 界面语言 | `goodfans-ui-lang` + 侧栏 i18n + 顶栏搜索/充值 |

- 「动画与视觉效果」卡片改名为 **视觉效果**，副标题聚焦顶栏/浮层毛玻璃

### 时区（全站）

**原「区域与货币」卡片改为「时区」：**

- 删除：显示货币、日期格式、时间格式、每周第一天
- 保留并增强：**显示时区**（默认 **跟随系统**）
- 自定义下拉 `.ga-dd` + 搜索框，加载 **全球 IANA 时区**（`Intl.supportedValuesOf('timeZone')`，400+ 项）
- 新增 `js-web/fl-timezone-catalog.js`：按 UTC 偏移排序、城市中文名、搜索过滤
- 写入 `fl_display_prefs_v1.timezone` · `html[data-fl-timezone]`
- 下方实时预览当前时间

---

## 6. 设置 · 跨国界无障碍（合并在外观页）

**页面：** `pages-web/settings-display.html#ga-global-access`  
**脚本：** `js-web/global-accessibility-settings.js` · `js-web/global-accessibility-store.js`  
**样式：** `css-web/global-accessibility.css`

### 下拉样式统一（`.ga-dd`）

- **沟通语言**、**显示偏好**、**时区**：原生 `<select>` 改为与钱包页一致的自定样式下拉
- 触发器：图标/国旗 + 主标题 + 副标题 + chevron；面板：圆角卡片、选中高亮、✓
- **显示偏好**下拉：`ga-dd--dropup` 向上展开，修复卡片 `overflow:hidden` 遮挡
- `.mid` 纵向排列，修复主/副标题挤在一行

### 翻译演示

- 「直播翻译演示 / 私信翻译演示 / 正式直播页」点击后打开 **全屏弹层** `#gaDemoOverlay`
- 内嵌 iframe 加载 `live-translate-demo.html`、`messages-translate-demo.html`、`live-detail.html`
- 演示页读取 `fl_global_accessibility_v1`，与设置页配置同步
- 支持 Esc / 遮罩 / 关闭按钮

---

## 7. 订阅 · 我的订阅页

**页面：** `pages-web/subscriptions.html`  
**脚本：** `js-web/subscriptions-page.js` · `css-web/subscriptions-page.css`

### 管理订阅弹层（`#subManageOverlay`）

- **搜索**：按创作者昵称过滤（`#subManageSearch`）
- **滚动懒加载**：每页 6 条，向下滚动加载更多
- **完整列表**：左栏 rail 创作者 + `SUB_MANAGE_EXTRA` 扩展数据（12+ 位），移除「另有 7 位…」截断提示
- **摘要条**：显示总订阅数 / 当前筛选结果数
- **自动续订开关**：每行独立 toggle，持久化 `fl_sub_auto_renew_v1`
- **行点击**：进入详情（到期时间、续费、查看主页、取消订阅）
- **修复**：去除重复事件绑定；底部「关闭」按钮可用

### 与钱包页去重

- `settings-wallet.html` 删除 **订阅自动续费** 卡片（该能力统一在订阅模块管理）

---

## 8. 设置 · 会员订阅设置

**页面：** `pages-web/settings-subscription.html`  
**脚本：** `js-web/settings-subscription-page.js` · `js-web/settings-subscription-promo-page.js` · `js-web/creator-promo-codes-store.js` · `css-web/settings-creator.css`

### 订阅周期与定价

- 原三档权益（基础 / 标准 / 尊享）改为 **月付 / 季付 / 年付** 三周期卡片
- 点击卡片编辑对应周期价格；示例：28 / 75 / 268 USDT
- 校验规则：**月付 < 季付 < 年付**（USDT 总价），最低 5 USDT；不合法时输入框红框 + `#subPriceHint` 错误文案
- 移除顶部 stat-strip（活跃订阅者、本月收入等）→ 引导至 **创作者收入**

### 优惠码（创作者侧）

- **新建优惠码** 按钮 → 弹层表单（代码、折扣类型、力度、上限、有效期、启用/停用）
- 表格行 **编辑** → 同弹层；可删除
- 种子数据：`LUNA20`（8 折首月）、`NEWYEAR`（首月 5 USDT · 已用完）
- 存储：`fl_creator_promo_codes_v1`（按创作者账号）

### 移除 / 精简

- 「链上 + 法币双通道」标签、订阅封面图整行
- **「默认变现策略」整卡**（新内容默认订阅专属、按篇购买开关、默认单篇价格）→ 改在 **创建内容** 页发布时设置

### 保留

- 7 天免费试用、欢迎消息、优惠码管理

---

## 9. 订阅收银台 · 创作者优惠码（业务闭环）

**脚本：** `js-web/subscribe-modal.js` · `js-web/creator-promo-codes-store.js` · `css-web/subscribe-modal.css`  
**页面：** 挂载订阅弹层的 `home.html` · `profile.html` · `subscriptions.html` · `creator-profile.html` · `discover.html` 等

### 粉丝订阅 Step 1

- 新增 **创作者优惠码** 输入区（计划选择与积分商城兑换券之间）
- 输入 + **应用**；校验创作者归属、有效期、用量、仅新订阅首月、仅月付
- 与商城兑换券 **不可叠加**（应用其一自动清除另一项）
- 价格摘要、支付密码页展示原价 / 抵扣 / 实付；扣款成功后 `incrementUsage`

### 演示

- 订阅 Luna → 月付 → 输入 `LUNA20` → 28 USDT 折至 22.4 USDT

---

## 10. 设置 · 创作者导航精简

**脚本：** `js-web/settings-nav.js`

- 「创作者」分组仅保留 **会员订阅设置**
- 移除侧栏入口：**收益与提现**（收入见主导航「创作者收入」）、**直播配置**（OBS 等见 **创建内容** 页直播 Tab）

---

## 11. 创作者主页 · 订阅周期档卡

**页面：** `pages-web/creator-profile.html`

### 粉丝可见订阅档（`.sub-tier-row`）

- 原三档 **免费关注 / 优质订阅 / 挚友订阅** → **月付 / 季付 / 年付**
- 定价与设置页对齐：**28 / 75 / 268 USDT**（月 / 季 / 年）
- 三档权益相同，季付 / 年付突出节省比例与折合月价
- 按钮文案不变：**当前等级** · **立即订阅** · **升级挚友**
- 季付 / 年付按钮接入 `btn-open-subscribe`（`data-plan` 75 / 268）

### 订阅弹层（同页内嵌）

- 计划选项同步为 **月付 / 季付 / 年付**（28 / 75 / 268 USDT）

---

## 12. 侧栏 · 创作者收入 Chip

**脚本：** `js-web/creator-income-store.js` · `js-web/app-sidebar-global.js` · `css-web/common-web.css`

- 「创作者收入」菜单 chip 由静态 `+$28` 改为 **当月收入**（动态）
- 有数据才展示（Luna 演示：298.40 USDT → chip `+298.4`）；非 Creator 或当月为 0 → **隐藏**
- 悬停气泡 + `title`：**本月创作者收入（USDT）**；支持中/英/繁
- 存储：`fl_creator_income_v1`（按账号 + 自然月）

---

## 13. 全站文案 · 「按篇购买」统一用语

面向用户的 **PPV / 解锁 / 单篇付费** 等术语，统一为通俗表述：

| 原说法 | 现说法 |
|--------|--------|
| PPV、单篇付费 | **按篇购买** |
| 解锁价、解锁 | **本篇价格、购买、付费** |
| 非订阅者 | **未订阅的粉丝** |

**涉及页面 / 脚本（主要）：**

- `settings-subscription.html` · `settings-creator-earnings.html`
- `create.html` · `create-studio.js`（变现设置、发布预览）
- `feed-stack-builder.js` · `ppv-unlock-modal.js`（Feed 遮罩与购买弹层）
- `subscribe-modal.js` · `settings-pay-password.js` · `mall-vouchers-store.js`
- `discover-detail.js` · `profile.html` · `points-mall.html`

> 代码内部仍保留 `ppv` 等标识符；「To 研发」气泡中的技术说明未改。

---

## 14. 设置 · 安全

**页面：** `pages-web/settings-security.html`  
**脚本：** `js-web/settings-security-page.js` · `css-web/settings-security-page.css`

- 「近期安全活动」标题右侧悬停说明图标
- 「查看全部安全日志」完整弹层（分类筛选、列表、详情）
- 登录设备区块移除多余顶部分割线

---

## 15. 侧栏 Creator Pro & 用户菜单

**脚本：** `js-web/creator-pro-store.js` · `js-web/sidebar-bottom-interactions.js` · `css-web/sidebar-bottom.css`

- 未购 Pro → 展示升级卡片；已购 → 隐藏
- 用户行 ⋮ 快捷菜单（主页 / 钱包 / Pro / 设置 / 退出）
- 点击头像/昵称 → 我的主页
- 全站经 `app-sidebar-global.js` 注入
- 侧栏 Pro 会员标签文案 **Pro** → **会员**；移除 Fan/Creator 英文角色行（`proto-sidebar-user-display.html` 同步）

**原型切片：** `proto-sidebar-pro-non-member.html` · `proto-sidebar-pro-member.html`

---

## 16. 直播 · 观看页

**页面：** `pages-web/live-detail.html`

- 直播聊天室 Tab **房主** → **管理员**（`data-chat-tab="host"` 逻辑不变）
- 聊天消息内「订阅了房主」等文案未改

---

## 17. 全局基础设施

| 文件 | 作用 |
|------|------|
| `css-web/common-web.css` | 引入 `global-display-prefs.css`；`font-size: calc(14px * var(--fl-font-scale))` |
| `css-web/global-display-prefs.css` | 浅色主题、高对比、无衬线、毛玻璃、字体缩放 |
| `js-web/global-display-prefs.js` | 外观 + **时区**偏好读写/首屏应用 |
| `js-web/global-lang-switch.js` | 修复 `applyDict` / `zh-TW`；侧栏 i18n 字典；导出 `DICT` |
| `js-web/app-sidebar-global.js` | 首屏 boot 外观+时区；侧栏 i18n；**创作者收入 chip 动态化** |
| `js-web/creator-income-store.js` | 当月创作者收入 · 侧栏 chip 数据源 |
| `js-web/creator-level-store.js` | 创作者 LV1–10 等级 · 周榜计分 · 主页徽章数据源 |
| `js-web/creator-profile-page.js` | 创作者主页 Tab / 侧栏弹层 / 卡片跳转 / 关注打赏私信 |
| `js-web/proto-discover-detail.js` | 发现详情交互；关闭时读取 `?from=` 返回来源页 |
| `js-web/settings-display-page.js` | 外观页交互、时区下拉、toast |
| `js-web/fl-timezone-catalog.js` | 全球 IANA 时区目录与搜索 |
| `js-web/global-accessibility-settings.js` | 无障碍设置 + 演示弹层 + ga-dd |
| `css-web/global-accessibility.css` | ga-dd / ga-demo-overlay / 演示页样式 |

---

## 18. index.html 平铺切片

| 锚点 | 内容 |
|------|------|
| `#sidebar-bottom` | 侧栏 Pro 卡片 & 用户菜单 |
| `#settings-wallet` | 钱包主页面 + 6 个 `?modal=` iframe |
| `#ga-global-access` | 跨国界无障碍（settings-display 内） |

---

## 19. localStorage 键一览

```
fl_display_prefs_v1           // 主题 / 字体 / 高对比 / 无衬线 / 毛玻璃 / 时区
goodfans-ui-lang              // 界面语言
fl_settings_wallets_v1        // 钱包列表
fl_settings_wallet_prefs_v1   // 钱包偏好
fl_creator_pro_v1             // Creator Pro
fl_sidebar_collapsed          // 侧栏折叠
fl_global_accessibility_v1    // 跨国界无障碍（沟通语言、翻译开关等）
fl_sub_auto_renew_v1          // 各创作者订阅自动续订 ON/OFF
fl_sub_read_item_ids_v1       // 订阅 Feed 已读项
fl_sub_unread_counts_v1       // 订阅 Tab 未读数
fl_creator_income_v1          // 创作者当月收入（侧栏 chip）
fl_creator_promo_codes_v1     // 创作者优惠码列表
fl_creator_level_v1           // 创作者等级 & 周榜快照（按账号）
```

---

## 20. 涉及文件汇总

### HTML 页面

| 页面 | 变更摘要 |
|------|----------|
| `settings-account.html` | Handle → 用户名 |
| `subscriptions.html` | 管理订阅弹层搜索/懒加载/完整列表 |
| `settings-subscription.html` | 月/季/年付定价；优惠码 CRUD；删默认变现策略 |
| `creator-profile.html` | 订阅档卡 → 月/季/年付；Tab 动态渲染；等级/打赏榜弹层；卡片跳转详情 |
| `proto-discover-detail-*.html` | 详情页关闭支持 `?from=` 返回创作者主页 |
| `proto-sidebar-user-display.html` | Pro 标签 → 会员；移除 Fan/Creator 角色行 |
| `settings-creator-earnings.html` | 单篇购买收入文案（仍可通过 URL 访问，已移出设置导航） |
| `create.html` | 变现设置 · 按篇购买 |
| `profile.html` · `points-mall.html` | 按篇购买相关描述 |
| `settings-wallet.html` | 删订阅自动续费卡片（迁至订阅页） |
| `settings-invite-relation.html` | 删提示条 |
| `settings-notification.html` | DND 布局 + 删两行 |
| `settings-display.html` | 外观/语言/时区/无障碍/演示弹层 |
| `settings-security.html` | 安全日志弹层 |
| `live-detail.html` | 聊天 Tab 房主 → 管理员 |
| `proto-sidebar-pro-*.html` | 新增 Pro 侧栏切片 |
| `index.html` | wallet / sidebar 平铺 |
| `index-web.html` | SS03 钱包等描述更新 |

### 新增 JS / CSS（今日）

| 文件 |
|------|
| `js-web/settings-wallet-page.js` |
| `css-web/settings-wallet-page.css` |
| `js-web/global-display-prefs.js` |
| `css-web/global-display-prefs.css` |
| `js-web/settings-display-page.js` |
| `js-web/subscriptions-page.js` |
| `js-web/settings-subscription-page.js` |
| `js-web/settings-subscription-promo-page.js` |
| `js-web/creator-promo-codes-store.js` |
| `js-web/creator-income-store.js` |
| `js-web/creator-level-store.js` |
| `js-web/creator-profile-page.js` |
| `js-web/proto-discover-detail.js`（`from` 返回来源页） |
| `js-web/subscribe-modal.js`（优惠码输入 + 抵扣） |
| `js-web/settings-nav.js`（创作者导航精简） |
| `js-web/fl-timezone-catalog.js` |
| `js-web/create-studio.js` · `feed-stack-builder.js` · `ppv-unlock-modal.js`（按篇购买文案） |
| `js-web/creator-pro-store.js`（侧栏 Pro） |
| `css-web/sidebar-bottom.css`（若今日新增/扩展） |

### 文档

| 文件 |
|------|
| `docs/prototype-changelog-2026-06-20.md` |
| `docs/prototype-changelog-2026-06-20.html` |

---

## 21. 创作者主页 · Tab 与内容详情

**页面：** `pages-web/creator-profile.html`  
**脚本：** `js-web/creator-profile-page.js`

### Tab 结构

- 动态渲染 **作品 / 视频 / 订阅独享** 三个 Tab（`TAB_CONTENT` + `renderWorkGrid`）
- **移除 Tab：直播回放、关于**（产品暂无直播回放能力；关于信息不再单独成 Tab）
- Tab 切换：`switchTab` · 键盘 Enter/Space 可访问

### 卡片点击 → 现有详情页

| Tab | 跳转 |
|-----|------|
| 作品 | `proto-discover-detail-image.html` |
| 视频 | `proto-discover-detail-video.html` |
| 订阅独享（锁定） | `proto-discover-detail-paid-teaser.html` |

- URL 携带 `?from=creator-profile.html`（可选 `&title=`）
- `proto-discover-detail.js` 关闭详情时优先返回 `from` 参数指定页面

---

## 22. 创作者主页 · 侧栏与顶栏互动

**页面：** `pages-web/creator-profile.html`  
**脚本：** `js-web/creator-profile-page.js`

### 侧栏

- **最近订阅者**：标题下增加说明「最近成为本创作者会员的粉丝（非你的订阅列表）」；周期标签改为 **月付 / 季付 / 年付**
- **本月打赏 TOP**：侧栏展示 TOP 3；**查看完整榜单** → 弹层 `#ovlCpTipRank`（TOP 10 完整列表）

### 顶栏操作

- **私信** → `messages.html?peer=…&from=profile&tab=dm`
- **关注** → 切换已关注 / 关注状态与图标
- **打赏** → 接入礼物弹层（`FL_openGiftModal` / `FL_buildGiftModalUrl`，携带创作者 LV）

---

## 23. 创作者等级 & 周榜

**页面：** `pages-web/creator-profile.html`  
**脚本：** `js-web/creator-level-store.js` · `js-web/creator-profile-page.js`  
**挂载：** 同页引入 `creator-income-store.js`（月收入参与升级判定）

### 概念区分

- **创作者等级 LV1–10**：平台分成与周榜排名，依据订阅数 / 月收入 / 作品数 / 认证
- 与 **粉丝订阅周期**（月/季/年付）、**评论区粉丝 LV** 为独立体系

### 主页展示

- 头像区徽章 `#cpCreatorLevelBadge`（如 `LV 7 · 周榜 TOP 12`）由 store 动态渲染
- 点击徽章 → 弹层 `#ovlCpCreatorLevel`：当前等级、实得比例、周榜排名、升级进度、LV 规则表、周榜计分公式

### 周榜

- 近 7 日热度分 = 新订阅×15 + 打赏 USDT×1 + 互动×0.05 + 直播分钟×0.8 + 发帖×20
- 每周一 UTC 0:00 重置；Luna 演示数据纳入候选池

### 存储

- `fl_creator_level_v1`（按账号 + 自然周）
