# 发现页 · 内容沉浸详情（高保真原型规格）

> 版本 v1.0 · 对应 `pages-web/proto-discover-detail-*.html`

## 1. 用户体验分析

### 1.1 产品定位

FansLoop Web 是 Web3 创作者平台：发现页承担「逛内容 → 快速消费 → 互动转化」链路，对标桌面端短视频/图文浏览体验（类抖音 Web），同时保留订阅、打赏、链上资产等差异化能力。

### 1.2 核心用户需求

| 用户目标 | 设计响应 |
|---------|---------|
| 快速沉浸观看 | 点击卡片后主内容区全屏铺满（侧栏与顶栏保留，详情仅在 `app-main` 内） |
| 识别创作者 | 顶部：头像 + 名称 + 关注 |
| 理解内容 | 底部渐变区：标题 + 话题标签 |
| 轻量互动 | 右侧透明操作轨：点赞 / 评论 / 分享 / 收藏 |
| 视频可控 | 保留播放/暂停、进度条、静音（与发现卡片控件一致） |
| 深度讨论 | 评论按钮打开右侧面板：列表 + 发表 |

### 1.3 核心交互逻辑

```
发现网格 discContentGrid
    │ 点击卡片（非视频控件区域）
    ▼
沉浸详情 dd-stage（覆盖 app-main）
    ├─ Esc / 关闭 → 返回 discover.html
    ├─ 顶栏创作者区 → 可跳转创作者主页（原型为 toast）
    ├─ 右侧轨
    │   ├─ 点赞 → 切换态 + 计数动画
    │   ├─ 评论 → 打开 dd-comments 抽屉
    │   ├─ 分享 → toast / 后续接 share-modal
    │   └─ 收藏 → 切换态
    ├─ 底部标题区 → 话题可点击（原型 toast）
    └─ 视频态
        ├─ 单击画面 → 播放/暂停
        ├─ 工具条 → 播放、时间、静音、PiP（可选）
        └─ 底边进度条 → 拖拽 seek
```

## 2. 产品界面设计（信息架构）

| 区域 | 层级 | 元素 |
|------|------|------|
| 全局壳 | L0 | Header（搜索/通知/充值）+ Sidebar（主导航） |
| 详情舞台 | L1 | `dd-stage` 绝对定位填满 `app-main` |
| 媒体层 | L2 | 全屏 `object-fit: cover` 图片或 `<video>` |
| 遮罩层 | L2 | 顶/底渐变，保证文字可读 |
| 创作者条 | L3 | 关闭、头像、名称、关注按钮 |
| 操作轨 | L3 | 右下固定，纵向图标 + 计数 |
| 元信息 | L3 | 底部标题、标签 chips |
| 视频控件 | L3 | 复用 `disc-vp-*` 语义，贴底 |
| 评论抽屉 | L4 | 宽 420px，列表 + 输入框，遮罩可点关闭 |

## 3. 高保真 UI 规范

- **画布**：`--bg-canvas` 深色 + 品牌紫粉渐变光晕（与 `common-web.css` 一致）
- **操作轨**：`backdrop-filter: blur(12px)` + `rgba(0,0,0,0.35)` 圆角胶囊
- **字体**：Inter；标题 18–20px/700；标签 12px 紫色描边 chip
- **图片**：Unsplash 真实摄影（北海道、京都樱花等），禁止灰色占位块
- **动效**：详情进入 `fade + scale(0.98→1)` 280ms；评论抽屉 `translateX` 320ms

## 4. HTML 原型文件清单

| 文件 | 状态说明 |
|------|---------|
| `proto-discover-detail-image.html` | 图文详情默认态 |
| `proto-discover-detail-video.html` | 视频播放中 + 控件 |
| `proto-discover-detail-comments.html` | 评论抽屉已展开 |
| `css-web/proto-discover-detail.css` | 详情舞台样式 |
| `js-web/proto-discover-detail.js` | 视频/评论/互动逻辑 |

## 5. 研发对接要点

- 路由建议：`/discover/post/:id`，详情为同页 overlay 或独立路由，**不遮挡** `sidebar`/`header` DOM 区域。
- 接口：`GET /api/posts/:id`、`GET/POST /api/posts/:id/comments`。
- 视频：HLS / MP4；进度条与 `discover-video-player.js` 事件模型可对齐。
- 无障碍：`role="dialog"`、`aria-modal`、Esc 关闭、焦点陷阱（评论抽屉内）。
