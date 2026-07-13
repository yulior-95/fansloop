/**
 * 基于 create-live-host / live-detail 结构生成 OBS 连麦 PK 状态原型页
 * 运行: node pages-web/obs-cohost-pk/gen-states.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;

const I = {
  luna: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
  night: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80',
  echo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80',
  jazz: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1400&q=80',
  concert: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80',
  dj: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=1200&q=80',
  fan: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=80',
  viewer: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600',
};

const HOST_HEAD = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>{{TITLE}}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="../../css-web/common-web.css">
<link rel="stylesheet" href="../../css-web/live-host.css">
<link rel="stylesheet" href="../../css-web/obs-cohost-pk.css">
<link rel="stylesheet" href="../../css-web/dev-glass-note.css">
<script src="../../js-web/dev-glass-viewport.js" defer></script>
</head>
<body class="page-live-host">
<div class="app-shell">
    <aside class="app-sidebar">
        <div class="s-brand"><div class="logo"><i class="fa-solid fa-infinity"></i></div><div class="name">FansLoop<span>Web3 Creator</span></div></div>
        <div class="s-section">主导航</div>
        <div class="s-item" onclick="location.href='../home.html'"><span class="ic"><i class="fa-solid fa-house"></i></span><span class="lb">首页</span></div>
        <div class="s-item active" onclick="location.href='../create.html'"><span class="ic"><i class="fa-solid fa-pen-to-square"></i></span><span class="lb">创建内容</span></div>
        <div class="s-section">互动</div>
        <div class="s-item" onclick="location.href='../notifications.html'"><span class="ic"><i class="fa-regular fa-bell"></i></span><span class="lb">通知</span><span class="badge">12</span></div>
        <div class="s-bottom">
            <div class="s-user">
                <div class="av" style="background-image:url('${I.luna}')"></div>
                <div class="info"><div class="n">Luna 🌙</div><div class="e">直播中</div></div>
            </div>
        </div>
    </aside>
    <header class="app-header">
        <div class="h-search h-search-live h-search-unified"><div class="hs-inner"><i class="fa-solid fa-magnifying-glass"></i><input type="search" placeholder="直播中…" /></div></div>
        <div class="h-actions">
            <button type="button" class="btn btn-secondary btn-sm"><i class="fa-solid fa-arrow-left"></i> 返回工作室</button>
            <div class="h-avatar" style="background-image:url('${I.luna}')"></div>
        </div>
    </header>
    <main class="app-main">
        <div class="page-head"><div class="ph-l"><h1>主播直播控制台</h1></div></div>
        <div class="live-host-grid">
            <div>{{STAGE}}</div>
            <aside class="host-side">{{SIDEBAR}}</aside>
        </div>
    </main>
</div>
{{MODALS}}
</body>
</html>`;

const VIEWER_HEAD = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>{{TITLE}}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="../../css-web/common-web.css">
<link rel="stylesheet" href="../../css-web/obs-cohost-pk.css">
<link rel="stylesheet" href="../../css-web/live-detail-extra.css">
<link rel="stylesheet" href="../../css-web/dev-glass-note.css">
<style>
.live-grid { display: grid; grid-template-columns: 1fr 360px; gap: 18px; }
@media (max-width: 1280px) { .live-grid { grid-template-columns: 1fr; } }
.live-player { background: #000; border-radius: var(--r-lg); overflow: hidden; border: 1px solid var(--border); position: relative; aspect-ratio: 16/9; background: url('${I.viewer}') center/cover; }
.live-player::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.6)); pointer-events: none; }
.live-player .top-overlay { position: absolute; top: 18px; left: 18px; right: 18px; display: flex; align-items: center; gap: 10px; z-index: 4; }
.live-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; background: rgba(220,38,38,0.85); color: #fff; font-size: 11px; font-weight: 800; }
.live-pill .dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; animation: pulse 1.2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.viewers { padding: 5px 10px; border-radius: 999px; background: rgba(0,0,0,0.45); color: #fff; font-size: 11px; font-weight: 700; }
.creator-bar { display: flex; align-items: center; gap: 12px; margin-top: 14px; padding: 12px 14px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--r-lg); }
.creator-bar .av { width: 44px; height: 44px; border-radius: 50%; background-size: cover; }
.chat-side { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--r-lg); display: flex; flex-direction: column; min-height: 520px; }
.chat-side-hd { padding: 12px 14px; border-bottom: 1px solid var(--border); font-weight: 800; font-size: 13px; }
.chat-msgs { flex: 1; padding: 12px; overflow-y: auto; font-size: 12.5px; line-height: 1.65; }
.chat-msgs .sys { color: var(--t-tertiary); font-size: 11px; }
.chat-input { display: flex; gap: 8px; padding: 10px 12px; border-top: 1px solid var(--border); }
.chat-input input { flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-input); color: #fff; font-size: 12px; }
.action-strip { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.action-strip .ac { padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border); font-size: 12px; font-weight: 600; cursor: pointer; background: var(--bg-elevated); color: var(--t-secondary); }
.action-strip .ac.tip { background: rgba(251,191,36,0.12); border-color: rgba(251,191,36,0.3); color: #fde68a; }
</style>
</head>
<body>
<div class="app-shell">
    <aside class="app-sidebar">
        <div class="s-brand"><div class="logo"><i class="fa-solid fa-infinity"></i></div><div class="name">FansLoop<span>Web3 Creator</span></div></div>
        <div class="s-item active"><span class="ic"><i class="fa-solid fa-house"></i></span><span class="lb">首页</span></div>
        <div class="s-item"><span class="ic"><i class="fa-solid fa-compass"></i></span><span class="lb">发现</span></div>
        <div class="s-bottom"><div class="s-user"><div class="av" style="background-image:url('${I.fan}')"></div><div class="info"><div class="n">Fan_01</div><div class="e">观众</div></div></div></div>
    </aside>
    <header class="app-header">
        <div class="h-search h-search-live h-search-unified"><div class="hs-inner"><i class="fa-solid fa-magnifying-glass"></i><input type="search" placeholder="搜索…" /></div></div>
        <div class="h-actions"><button class="h-cta"><i class="fa-solid fa-bolt"></i>充值</button></div>
    </header>
    <main class="app-main" style="padding-top:18px">
        <div class="live-grid">
            <div>{{PLAYER}}</div>
            <aside class="chat-side">{{CHAT}}</aside>
        </div>
    </main>
</div>
{{EXTRA}}
</body>
</html>`;

function cohostCard(body, pkEnabled = false) {
  const pkBtn = pkEnabled
    ? '<button type="button" class="btn btn-primary btn-sm"><i class="fa-solid fa-hand-fist"></i> 发起 PK</button>'
    : '<button type="button" class="btn btn-secondary btn-sm" disabled><i class="fa-solid fa-lock"></i> 发起 PK</button>';
  return `<div class="card host-cohost-card">
    <div class="card-hd"><span class="hd-l"><i class="fa-solid fa-link" style="color:#C084FC"></i> 连麦 &amp; PK</span></div>
    <div class="card-bd host-cohost-bd">
      <div class="host-cohost-toolbar">
        <button type="button" class="btn btn-primary btn-sm"><i class="fa-solid fa-shuffle"></i> 随机匹配</button>
        <button type="button" class="btn btn-secondary btn-sm"><i class="fa-solid fa-user-plus"></i> 指定连麦</button>
      </div>
      <div class="host-cohost-toolbar" style="margin-top:8px">
        <button type="button" class="btn btn-secondary btn-sm"><i class="fa-solid fa-toggle-on"></i> 观众上麦</button>
        ${pkBtn}
      </div>
      ${body}
    </div>
  </div>`;
}

function hostStageBase(className, inner, bg = I.jazz) {
  const cls = className ? ` host-stage ${className}` : ' host-stage';
  const style = className && className.includes('cohost') ? '' : ` style="background-image:url('${bg}')"`;
  return `<div class="${cls.trim()}" id="hostStage"${style}>
    <div class="host-top">
      <span class="host-live-pill"><span class="dot"></span> LIVE</span>
      <span class="host-meta-chip"><i class="fa-solid fa-eye"></i> 2,418 观看</span>
      <span class="host-meta-chip"><i class="fa-regular fa-clock"></i> 00:42:18</span>
    </div>
    ${inner}
    <div class="host-bottom"><div><div class="host-title">深夜爵士 · 即兴钢琴</div><div class="host-sub">OBS 推流中 · 合流由服务端完成</div></div></div>
  </div>`;
}

function hostSidebar(extra = '') {
  return `${extra}
  <div class="card card-stat">
    <div class="card-hd"><span class="hd-l"><i class="fa-solid fa-chart-simple" style="color:#6EE7B7"></i> 实时数据</span></div>
    <div class="card-bd card-bd-align">
      <div class="stat-row"><span>峰值在线</span><b>2,418</b></div>
      <div class="stat-row"><span>礼物收益</span><b style="color:#FBBF24">128 USDT</b></div>
    </div>
  </div>`;
}

function writeHost(file, title, stage, sidebar, modals = '') {
  const html = HOST_HEAD.replace('{{TITLE}}', title)
    .replace('{{STAGE}}', stage)
    .replace('{{SIDEBAR}}', sidebar)
    .replace('{{MODALS}}', modals);
  fs.writeFileSync(path.join(OUT, file), html, 'utf8');
  console.log('wrote', file);
}

function writeViewer(file, title, player, chat, extra = '') {
  const html = VIEWER_HEAD.replace('{{TITLE}}', title)
    .replace('{{PLAYER}}', player)
    .replace('{{CHAT}}', chat)
    .replace('{{EXTRA}}', extra);
  fs.writeFileSync(path.join(OUT, file), html, 'utf8');
  console.log('wrote', file);
}

const cohost2Cells = `
  <div class="host-cohost-cell" style="background-image:url('${I.jazz}')"><div class="host-cohost-label"><span class="av" style="background-image:url('${I.luna}')"></span> Luna 🌙（我）</div></div>
  <div class="host-cohost-cell" style="background-image:url('${I.concert}')"><div class="host-cohost-label"><span class="av" style="background-image:url('${I.night}')"></span> 夜雨听弦</div></div>
  <div class="host-cohost-top"><span class="host-cohost-chip host-cohost-chip--link"><i class="fa-solid fa-link"></i> 连麦中 · 2/3</span><span class="host-cohost-chip">合流延迟 ~2.1s</span></div>`;

const cohost3Cells = `
  <div class="host-cohost-cell host-cohost-cell--main" style="background-image:url('${I.jazz}')"><div class="host-cohost-label"><span class="av" style="background-image:url('${I.luna}')"></span> Luna 🌙</div></div>
  <div class="host-cohost-cell" style="background-image:url('${I.concert}')"><div class="host-cohost-label"><span class="av" style="background-image:url('${I.night}')"></span> 夜雨听弦</div></div>
  <div class="host-cohost-cell" style="background-image:url('${I.dj}')"><div class="host-cohost-label"><span class="av" style="background-image:url('${I.echo}')"></span> EchoDJ</div></div>
  <div class="host-cohost-top"><span class="host-cohost-chip host-cohost-chip--link"><i class="fa-solid fa-link"></i> 连麦中 · 3/3</span></div>`;

const pkHud = `<div class="obs-pk-hud">
  <div class="obs-pk-timer">02:47</div>
  <div class="obs-pk-bars">
    <div class="obs-pk-bar-wrap"><div class="obs-pk-bar-meta"><span>Luna 🌙</span><span>1,240 USDT</span></div><div class="obs-pk-bar obs-pk-bar--a"><span></span></div></div>
    <div class="obs-pk-vs">VS</div>
    <div class="obs-pk-bar-wrap"><div class="obs-pk-bar-meta"><span>夜雨听弦</span><span>892 USDT</span></div><div class="obs-pk-bar obs-pk-bar--b"><span></span></div></div>
  </div>
</div>`;

const audienceSlots = `<div class="obs-audience-slots">
  <div class="obs-audience-slot is-speaking"><div class="av-wrap"><div class="av" style="background-image:url('${I.fan}')"></div></div><span class="nm">Fan_01</span></div>
  <div class="obs-audience-slot empty"><div class="av-wrap"><div class="av"><i class="fa-solid fa-plus"></i></div></div><span class="nm">空席</span></div>
</div>`;

// --- Host states ---
writeHost('host-live-base.html', '主播控制台 · 连麦入口',
  hostStageBase('', ''),
  hostSidebar(cohostCard('<p class="host-cohost-hint">最多 3 位主播连麦 · 观众上麦默认 2 席</p>')));

writeHost('host-random-matching.html', '随机匹配连麦中',
  hostStageBase('', `<div class="host-matching-overlay">
    <div class="host-matching-radar"><i class="fa-solid fa-satellite-dish"></i></div>
    <h3>正在为你匹配连麦主播…</h3>
    <p>系统将从在线主播池中寻找合适对象，请保持 OBS 推流不断开。</p>
    <div class="host-matching-steps">
      <span class="step done">进入匹配池</span><span class="step active">算法筛选</span><span class="step">发送邀请</span><span class="step">等待同意</span>
    </div>
    <span class="dev-glass-wrap" style="margin-top:8px">
      <span class="dev-glass-sphere" tabindex="0" aria-describedby="glass-match-algo"><span class="dev-glass-sphere-shine"></span><span class="dev-glass-sphere-txt">To 研发</span></span>
      <span class="dev-glass-pop dev-glass-pop--wide" id="glass-match-algo" role="tooltip">
        <strong>随机匹配算法（服务端）</strong><br>
        1. 候选池：直播中 & 未连麦 & 未 PK & 开启连麦权限<br>
        2. 加权：品类 Jaccard 40% + 观众量级同档 30% + 历史互斥降权 20% + 随机 10%<br>
        3. 排除：黑名单、30min 内拒绝、连麦人数≥3<br>
        4. 超时 30s 扩大品类；60s 失败提示重试
      </span>
    </span>
  </div>`),
  hostSidebar(cohostCard('<p class="host-cohost-hint" style="color:#fde68a"><i class="fa-solid fa-spinner fa-spin"></i> 匹配中 · 已等待 12s</p>')));

writeHost('host-invite-incoming.html', '收到连麦邀请',
  hostStageBase('', ''),
  hostSidebar(cohostCard('<p class="host-cohost-hint">等待你处理连麦邀请…</p>')),
  `<div class="obs-modal-backdrop">
    <div class="obs-modal"><div class="obs-modal-head"><h3><i class="fa-solid fa-bell" style="color:#c084fc"></i> 连麦邀请</h3><p>夜雨听弦 邀请你加入连麦（当前 1/3 位）</p></div>
    <div class="obs-modal-body"><div class="obs-approve-row"><div class="av" style="width:40px;height:40px;border-radius:50%;background:url('${I.night}') center/cover"></div><div><b>夜雨听弦</b><div style="font-size:11px;color:var(--t-tertiary)">爵士 · 1.2k 在线</div></div></div></div>
    <div class="obs-modal-foot"><button type="button" class="btn btn-secondary">拒绝</button><button type="button" class="btn btn-primary">同意连麦</button></div></div>
  </div>`);

writeHost('host-directed-picker.html', '指定连麦',
  hostStageBase('', ''),
  hostSidebar(cohostCard('<p class="host-cohost-hint">搜索并选择在播主播发起连麦</p>')),
  `<div class="obs-modal-backdrop"><div class="obs-modal"><div class="obs-modal-head"><h3><i class="fa-solid fa-user-plus" style="color:#c084fc"></i> 指定连麦</h3><p>搜索正在直播的主播</p></div>
    <div class="obs-modal-body"><div class="obs-search"><i class="fa-solid fa-magnifying-glass"></i><input placeholder="搜索主播昵称…" value="夜" /></div>
    <div class="obs-host-pick">
      <div class="obs-host-pick-item selected"><div class="av" style="background-image:url('${I.night}')"></div><div class="info"><div class="n">夜雨听弦</div><div class="s">爵士 · 1,204 在线</div></div><i class="fa-solid fa-circle" style="color:#ef4444;font-size:8px"></i></div>
      <div class="obs-host-pick-item"><div class="av" style="background-image:url('${I.echo}')"></div><div class="info"><div class="n">EchoDJ</div><div class="s">电子 · 856 在线</div></div></div>
    </div></div>
    <div class="obs-modal-foot"><button type="button" class="btn btn-secondary">取消</button><button type="button" class="btn btn-primary">发送连麦邀请</button></div></div></div>`);

writeHost('host-cohost-2.html', '双主播连麦',
  hostStageBase('host-stage--cohost-2', cohost2Cells),
  hostSidebar(cohostCard(`<div class="host-cohost-members">
    <div class="host-cohost-member"><div class="av" style="background-image:url('${I.luna}')"></div><div class="meta"><div class="n">Luna 🌙</div><div class="s">房主 · OBS</div></div></div>
    <div class="host-cohost-member"><div class="av" style="background-image:url('${I.night}')"></div><div class="meta"><div class="n">夜雨听弦</div><div class="s">RTMP 复用</div></div></div>
  </div><button type="button" class="btn btn-secondary btn-sm btn-block" style="margin-top:8px;border-color:rgba(239,68,68,0.4);color:#fca5a5"><i class="fa-solid fa-phone-slash"></i> 退出连麦</button>`, true)));

writeHost('host-cohost-3.html', '三主播连麦',
  hostStageBase('host-stage--cohost-3', cohost3Cells),
  hostSidebar(cohostCard(`<div class="host-cohost-members">
    <div class="host-cohost-member"><div class="av" style="background-image:url('${I.luna}')"></div><div class="meta"><div class="n">Luna 🌙</div><div class="s">左全高</div></div></div>
    <div class="host-cohost-member"><div class="av" style="background-image:url('${I.night}')"></div><div class="meta"><div class="n">夜雨听弦</div><div class="s">右上</div></div></div>
    <div class="host-cohost-member"><div class="av" style="background-image:url('${I.echo}')"></div><div class="meta"><div class="n">EchoDJ</div><div class="s">右下</div></div></div>
  </div>`, true)));

writeHost('host-audience-mic-panel.html', '观众上麦管理',
  hostStageBase('', ''),
  hostSidebar(cohostCard(`<p class="host-cohost-hint"><i class="fa-solid fa-toggle-on" style="color:#6ee7b7"></i> 观众上麦已开启 · 默认 2 席</p>
    <div class="host-cohost-queue-item"><div class="av" style="background-image:url('${I.fan}')"></div><div class="meta"><div class="n">Fan_01</div><div class="s">申请上麦 · 等待 8s</div></div><div class="host-cohost-queue-actions"><button class="btn btn-primary btn-sm">同意</button><button class="btn btn-secondary btn-sm">拒绝</button></div></div>
    <div class="host-cohost-queue-item"><div class="av" style="background-image:url('https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80')"></div><div class="meta"><div class="n">Ken</div><div class="s">申请上麦</div></div><div class="host-cohost-queue-actions"><button class="btn btn-primary btn-sm">同意</button><button class="btn btn-secondary btn-sm">拒绝</button></div></div>`)));

writeHost('host-audience-mic-live.html', '观众在麦',
  hostStageBase('', audienceSlots),
  hostSidebar(cohostCard(`<p class="host-cohost-hint">在麦观众 · 可强制踢下麦</p>
    <div class="host-cohost-member"><div class="av" style="background-image:url('${I.fan}')"></div><div class="meta"><div class="n">Fan_01</div><div class="s">开麦中 · 声纹波动</div></div><button class="btn btn-secondary btn-sm" style="color:#fca5a5"><i class="fa-solid fa-user-slash"></i></button></div>`)));

writeHost('host-pk-setup.html', '发起 PK',
  hostStageBase('host-stage--cohost-2', cohost2Cells),
  hostSidebar(cohostCard('<p class="host-cohost-hint">连麦中 · 可发起 PK</p>', true)),
  `<div class="obs-modal-backdrop"><div class="obs-modal"><div class="obs-modal-head"><h3><i class="fa-solid fa-hand-fist" style="color:#fbbf24"></i> 发起 PK</h3><p>选择 PK 形式与时长（后台配置固定选项）</p></div>
    <div class="obs-modal-body obs-pk-form">
      <div class="field"><label>PK 形式</label><div class="obs-pk-types"><div class="obs-pk-type active"><i class="fa-solid fa-gift"></i><br>礼物总金额</div><div class="obs-pk-type"><i class="fa-regular fa-thumbs-up"></i><br>点赞总个数</div></div></div>
      <div class="field"><label>PK 时长</label><div class="obs-pk-durations"><span class="obs-pk-dur">1 分钟</span><span class="obs-pk-dur active">3 分钟</span><span class="obs-pk-dur">5 分钟</span><span class="obs-pk-dur">10 分钟</span></div></div>
    </div>
    <div class="obs-modal-foot"><button type="button" class="btn btn-secondary">取消</button><button type="button" class="btn btn-primary">发送 PK 申请</button></div></div></div>`);

writeHost('host-pk-pending.html', '等待全员同意 PK',
  hostStageBase('host-stage--cohost-2', cohost2Cells),
  hostSidebar(cohostCard('', true)),
  `<div class="obs-modal-backdrop"><div class="obs-modal"><div class="obs-modal-head"><h3><i class="fa-solid fa-hourglass-half" style="color:#fbbf24"></i> 等待全员同意 PK</h3><p>礼物总金额 · 3 分钟 · 需所有在麦主播同意后开始</p></div>
    <div class="obs-modal-body"><div class="obs-approve-list">
      <div class="obs-approve-row"><div class="av" style="width:32px;height:32px;border-radius:50%;background:url('${I.luna}') center/cover"></div> Luna 🌙（发起方）<span class="status ok">已同意</span></div>
      <div class="obs-approve-row"><div class="av" style="width:32px;height:32px;border-radius:50%;background:url('${I.night}') center/cover"></div> 夜雨听弦 <span class="status wait">等待中</span></div>
    </div></div>
    <div class="obs-modal-foot"><button type="button" class="btn btn-secondary">取消 PK</button><button type="button" class="btn btn-primary">同意 PK</button></div></div></div>`);

writeHost('host-pk-active.html', 'PK 进行中',
  hostStageBase('host-stage--cohost-2', cohost2Cells + pkHud),
  hostSidebar(cohostCard('<p class="host-cohost-hint" style="color:#fde68a"><i class="fa-solid fa-bolt"></i> PK 进行中 · 礼物总金额</p>', true)));

// --- Viewer states ---
const viewerPlayerBase = (className, inner) => `<div class="live-player${className ? ' ' + className : ''}">${inner}
  <div class="top-overlay"><span class="live-pill"><span class="dot"></span> LIVE</span><span class="viewers"><i class="fa-regular fa-eye"></i> 2,486</span></div></div>
  <div class="creator-bar"><div class="av" style="background-image:url('${I.luna}')"></div><div style="flex:1"><div style="font-weight:800">Luna 🌙</div><div style="font-size:11px;color:var(--t-tertiary)">爵士夜即兴</div></div></div>
  <div class="action-strip"><div class="ac"><i class="fa-regular fa-bell"></i> 关注</div><div class="ac" id="btnApplyMic"><i class="fa-solid fa-microphone"></i> 申请上麦</div><div class="ac tip"><i class="fa-solid fa-gift"></i> 打赏</div></div>`;

const viewerChatBase = (footer) => `<div class="chat-side-hd">聊天室</div><div class="chat-msgs"><div class="sys">欢迎进入直播间</div><p><b style="color:#c084fc">Luna</b> 今晚即兴爵士～</p></div>${footer}`;

writeViewer('viewer-live-base.html', '观众观看直播',
  viewerPlayerBase('', ''),
  viewerChatBase(`<div class="chat-input"><input placeholder="说点什么…" /><button class="btn btn-secondary btn-sm"><i class="fa-solid fa-microphone"></i> 申请上麦</button></div>`));

writeViewer('viewer-cohost-watch.html', '观看双主播连麦',
  viewerPlayerBase('live-player--cohost-2', `
  <div class="live-cohost-cell" style="background-image:url('${I.jazz}')"><div class="live-cohost-label"><span class="av" style="background-image:url('${I.luna}')"></span> Luna</div></div>
  <div class="live-cohost-cell" style="background-image:url('${I.concert}')"><div class="live-cohost-label"><span class="av" style="background-image:url('${I.night}')"></span> 夜雨听弦</div></div>`),
  viewerChatBase('<div class="chat-input"><input placeholder="说点什么…" /></div>'));

writeViewer('viewer-pk-watch.html', '观看 PK',
  viewerPlayerBase('live-player--cohost-2', `
  <div class="live-cohost-cell" style="background-image:url('${I.jazz}')"></div>
  <div class="live-cohost-cell" style="background-image:url('${I.concert}')"></div>${pkHud}`),
  viewerChatBase('<div class="chat-input"><input placeholder="为喜欢的主播送礼助力 PK…" /></div>'));

writeViewer('viewer-apply-mic.html', '申请上麦',
  viewerPlayerBase('', ''),
  viewerChatBase(`<div style="padding:10px 12px;border-top:1px solid var(--border)"><button class="btn btn-primary btn-sm btn-block"><i class="fa-solid fa-microphone"></i> 申请上麦</button><p style="font-size:11px;color:var(--t-tertiary);margin:8px 0 0">主播已开启上麦 · 默认 2 席 · 等待审批</p></div><div class="chat-input"><input placeholder="说点什么…" /></div>`));

writeViewer('viewer-mic-rejected.html', '上麦被拒绝',
  viewerPlayerBase('', ''),
  viewerChatBase('<div class="chat-input"><input placeholder="说点什么…" /></div>'),
  `<div class="obs-toast-banner"><i class="fa-solid fa-circle-xmark" style="color:#f87171"></i> 主播拒绝了你的上麦申请，可稍后再试</div>`);

writeViewer('viewer-mic-on.html', '上麦成功',
  viewerPlayerBase('', audienceSlots),
  viewerChatBase(`<div class="ld-mic-bar"><i class="fa-solid fa-microphone" style="color:#6ee7b7"></i> 你已上麦 · 麦克风已开启<div class="actions"><button class="btn btn-secondary btn-sm">静音</button><button class="btn btn-secondary btn-sm" style="color:#fca5a5">下麦</button></div></div><div class="chat-input"><input placeholder="说点什么…" /></div>`));

console.log('Done. All state pages generated.');
