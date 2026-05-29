# 发现页 · 动态标签与推荐体系（研发 / 算法需求说明）

> 版本：v1.0 · 对应原型 `pages-web/discover.html`  
> 目标：类抖音「频道 + 内容流」；内容优先，不堆创作者模块。

---

## 1. 产品定位与信息架构

### 1.1 页面结构（Web）

```
Header（全局搜索 / 通知 / 充值）
Sidebar（主导航）
Main
  ├─ cat-row（横滑垂类频道，GET /api/categories）
  └─ disc-mosaic（4 列网格）
        ├─ 首条：3 列 × 2 行 推荐视频大卡
        └─ 其余：每行 4 列标准卡片
```

### 1.2 明确不做（对标抖音 / YouTube 发现）

| 模块 | 是否展示 | 原因 |
|------|----------|------|
| 发现页 Hero 大 Banner + 页内搜索 | 否 | 全局 Header 已有搜索，重复占首屏 |
| API 调试文案（GET /api/...） | 否 | 用户不可见，放研发文档 |
| 内嵌「划分/推荐」规则大卡 | 否 | 改为右下角玻璃球 hover 摘要 |
| 「推荐关注」列表 | 否 | 抖音发现页以**内容**为主；关注推荐在「关注」Tab / 首页侧栏 |
| 「本周热门创作者」横条 | 否 | YouTube 首页也以视频缩略图为主；创作者发现走搜索 / 话题 / 算法推荐位，非固定榜单 |

**为何不展示创作者横条：** 发现页的核心指标是**内容消费时长与完播**；固定创作者卡片会分散点击、挤占内容位，且与「按垂类刷内容」心智不一致。创作者增长应通过：内容卡片上的作者信息、订阅按钮、搜索、私信转化。

---

## 2. 数据模型

### 2.1 categories（垂类频道）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 如 `photo` |
| slug | string | URL 友好 |
| name | string | 展示名 |
| icon | string | emoji 或 icon url |
| sort | int | 排序 |
| enabled | bool | 是否上线 |

- 接口：`GET /api/categories` → 渲染 `cat-row`
- 原型数据：`js-web/discover-taxonomy.js` → `CATEGORIES`

### 2.2 content_post（内容）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 内容 ID |
| type | enum | image / video / live |
| primary_category_id | string | **频道筛选唯一键** |
| category_ids | string[] | 多标签（不展示在卡片 UI） |
| hashtags | string[] | 话题，参与自动归类 |
| featured | bool | 是否频道内置顶（首条 3×2 大卡） |
| duration_sec | int | 视频时长（秒） |

- 接口：`GET /api/discover/posts?category={id}&cursor=`
- **UI 不展示垂类标签**：一条内容可映射多分类，展示单一垂类易误导。

### 2.3 hashtag_map（话题 → 垂类）

运营可配置 JSON / 表：

```json
{ "京都": "travel", "Vlog": "film", "Web3": "tech" }
```

---

## 3. 划分规则（分类（算法））

**优先级从高到低：**

1. **用户主垂类**：发布时必选（`create-publish-image` 主垂类）→ 写入 `primary_category_id`
2. **话题映射**：正文 `#话题` 命中 `hashtag_map` → 自动归类
3. **创作者默认垂类**：历史发文最多垂类（弱关联，confidence ≤ 0.65，不覆盖 1、2）
4. **多模态模型**（可选）：图文/视频理解 → 仅当 confidence ≥ 0.85 且与用户选择不冲突时落库

**存储策略：**

- `category_ids[]`：多标签全量存储（推荐、检索）
- `primary_category_id`：单值，**频道 Tab 筛选仅用此字段**

**原型试算：** `resolveContentCategory()` in `discover-taxonomy.js`；交互页 `proto-discover-taxonomy.html`

---

## 4. 推荐规则（推荐（算法））

### 4.1 发现页列表

| 规则 | 说明 |
|------|------|
| 频道筛选 | `primary_category_id == 当前频道` 或 `category_ids` 包含（可选扩展） |
| 首条大卡 | 当前频道下 `featured=true` 或置顶视频；无则取列表首条 video |
| 排序 | 默认 `hot_score`（点赞、完播、评论、新鲜度衰减） |
| 个性化 | 用户兴趣向量 × 内容标签向量；冷启动用热门 + 垂类均匀 |

### 4.2 试推与反馈

- 小流量池（1–5% 曝光）→ 监控完播率、互动率、举报/不感兴趣  
- 正向：放大同垂类、同标签  
- 负向：降权或修正 `primary_category`（需人工审核阈值）

### 4.3 破圈

- 当 `hot_score` 超过频道 P99 且完播率 > 阈值，可推给非完全匹配兴趣用户（需频控）

---

## 5. 视频交互（前端）

仅 `type=video` 卡片：

- 暂停/播放、当前/总时长、可拖进度条（hover 加粗）
- 默认静音，点击切换音量
- **悬浮屏 PiP**：仅发现页；列表源位模糊 +「正在播放」；PiP 含完整控件、标题、作者、上/下切换、回到列表；离开发现页（侧栏切走）自动关闭

原型：`discover-video-player.js`（定时器模拟进度，正式接 `<video>` + HLS）

---

## 6. API 草案

```
GET  /api/categories
GET  /api/discover/posts?category=all&limit=20&cursor=
POST /api/content/publish        # body 含 primary_category_id, hashtags[]
GET  /api/hashtag-map            # 运营配置
POST /api/content/{id}/classify  # 试算 / 人工覆写（管理端）
```

---

## 7. 验收清单

- [ ] 首屏仅 **横滑 cat-row + 内容网格**，无 Hero、无 API 文案、无创作者横条
- [ ] cat-row 可横滑，右侧渐变提示
- [ ] 首条 3×2 大卡 + 其余 4 列
- [ ] 卡片不展示垂类分类标签
- [ ] `?category=photo` 深链恢复频道
- [ ] 视频卡控件 + PiP 完整可用
- [ ] 玻璃球 hover 可见划分/推荐摘要
- [ ] 本文档与 `proto-discover-taxonomy.html` 可供研发评审

---

## 8. 相关文件

| 路径 | 用途 |
|------|------|
| `pages-web/discover.html` | 发现页主界面 |
| `js-web/discover-taxonomy.js` | 样本数据 + 归类引擎 |
| `js-web/discover-page.js` | 渲染与频道筛选 |
| `js-web/discover-video-player.js` | 视频控件与 PiP |
| `css-web/discover-v2.css` | 布局与频道 |
| `css-web/discover-video-player.css` | 播放器样式 |
| `pages-web/proto-discover-taxonomy.html` | 规则试算原型 |
