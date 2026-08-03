# GOODFANS · 跨国界无障碍（Global Accessibility）

> **原型范围**：独立 HTML，不修改 `live-detail.html`、`messages.html` 等既有页面。  
> **存储键**：`localStorage.fl_global_accessibility_v1`

## 1. 产品目标

| 能力 | 用户价值 |
|------|----------|
| 直播自动翻译 | 跨国观看时看懂弹幕与主播口播要点 |
| 无障碍聊天 | 私信/群聊/直播输入：母语输入，对方母语阅读 |

与 **界面 i18n**（`global-lang-switch.js`）分离：只翻译 **UGC 内容**。

## 2. 原型文件

| 文件 | 说明 |
|------|------|
| `pages-web/settings-display.html#ga-global-access` | 已合并：在「界面语言」卡片之后 |
| `pages-web/settings-global-access.html` | 仅跳转到上一地址 |
| `pages-web/live-translate-demo.html` | 直播弹幕 + 字幕 + 侧滑面板 |
| `pages-web/messages-translate-demo.html` | 私信双向翻译气泡 |
| `js-web/global-accessibility-store.js` | 配置 + Mock 翻译表 |
| `css-web/global-accessibility.css` | 演示专用样式 |

## 3. 用户设置模型

```json
{
  "commLang": "zh-CN",
  "liveTranslateChat": true,
  "liveSubtitle": false,
  "chatAutoBoth": true,
  "chatPreviewSend": false,
  "displayMode": "dual",
  "wifiOnly": false
}
```

- `displayMode`: `dual` | `translated-only` | `tap-original`

## 4. 建议 API（正式环境）

### 4.1 用户偏好

- `GET /v1/user/accessibility`
- `PATCH /v1/user/accessibility`

### 4.2 翻译

- `POST /v1/translate`
  - body: `{ text, sourceLang?, targetLang, context: "live_chat"|"dm"|"group" }`
  - response: `{ text, sourceLang, cached }`

### 4.3 消息

- 发送: `originalText` + 服务端按成员 `locale` 写 `translations`
- 拉取: 按 `viewerLocale` 返回主显示文案 + `originalText`（可选）

### 4.4 直播

- WebSocket: `live.{id}.chat.translated` 推送译文
- 字幕: `live.{id}.caption` 流式 `{ text, translated, ts }`

## 5. 接入既有页面（研发清单）

1. **设置 hub**：`settings.html` 增加导航项 → `settings-global-access.html`（或内嵌路由）。
2. **直播**：`live-detail.html` 播放器工具栏增加「译」「无障碍」，逻辑复用 `live-translate-demo.js`。
3. **私信**：`messages.html` 在 `#imInputTa` 上增加 banner + 气泡 `tx-orig` 结构，逻辑复用 `messages-translate-demo.js`。
4. **内容安全**：翻译前后同一套审核 pipeline。

## 6. 分期

| 阶段 | 内容 |
|------|------|
| MVP | 弹幕翻译 + 私信双向翻译（本原型） |
| V1 | 发送前预览、误译反馈 |
| V2 | 直播 ASR 字幕、群聊按成员语言 |
| V3 | 创作者关闭翻译、术语表 |

## 7. 验收（原型）

1. 打开 `settings-global-access.html` 改沟通语言 → 刷新直播/私信演示页生效。
2. `live-translate-demo.html` 开关弹幕翻译，中英弹幕显示译文+原文。
3. `messages-translate-demo.html` 开启「发送前预览」，输入中文见英文预览。
