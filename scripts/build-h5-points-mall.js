const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const web = fs.readFileSync(path.join(root, 'pages-web/points-mall.html'), 'utf8');
const mainStart = web.indexOf('<div class="pm-hero">');
const ovStart = web.indexOf('<div class="pm-overlay" id="redeemOverlay"');
const scriptsStart = web.indexOf('<script src="../js-web/invite-reward-config.js">');
const main = web.slice(mainStart, ovStart);
const overlays = web.slice(ovStart, scriptsStart);
const out = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>积分商城</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="../css/common.css">
<link rel="stylesheet" href="../css-web/points-mall.css">
<script src="../js/h5-theme-boot.js"></script>
<style>
.nav-bar { background: var(--bg-primary); }
.app-content {
    padding-top: calc(var(--status-bar-height) + var(--nav-bar-height));
    padding-bottom: 28px;
    overflow-x: hidden;
}
.pm-h5-wrap {
    padding: 0 12px;
    --border: var(--border-color);
    --t-primary: var(--text-primary);
    --t-secondary: var(--text-secondary);
    --t-tertiary: var(--text-tertiary);
    --bg-card: var(--bg-card);
    --bg-input: var(--bg-inset);
}
.pm-h5-wrap .pm-hero { margin-left: 0; margin-right: 0; }
.pm-h5-wrap .pm-hero-in { flex-direction: column; }
.pm-h5-wrap .goods-grid { grid-template-columns: 1fr !important; }
.pm-h5-wrap .pm-tabs { overflow-x: auto; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; }
.pm-h5-wrap .usage-scroll-wrap { margin: 0 -4px; }
.pm-h5-wrap .wheel-banner { flex-direction: column; align-items: flex-start; gap: 10px; }
.pm-overlay { position: absolute !important; inset: 0; z-index: 500; }
.pm-modal { max-width: calc(100% - 24px); }
.pm-modal--history, .pm-modal--wheel { max-width: calc(100vw - 24px); margin: 12px auto; }
.history-toolbar { flex-wrap: wrap; }
.history-table { font-size: 11px; }
.toast { z-index: 600; position: absolute; left: 50%; transform: translateX(-50%); bottom: 72px; }
:root[data-theme='light'] .pm-h5-wrap .pm-hero,
:root[data-theme='light'] .pm-h5-wrap .goods-card,
:root[data-theme='light'] .pm-h5-wrap .pm-balance,
:root[data-theme='light'] .pm-h5-wrap .usage-section .usage-card {
    background: var(--bg-card);
    color: var(--text-primary);
}
</style>
<link rel="stylesheet" href="../css/h5-light-theme.css">
</head>
<body>
<div class="status-bar"><span class="time">9:41</span><span class="right"><i class="fa-solid fa-signal"></i><i class="fa-solid fa-wifi"></i><i class="fa-solid fa-battery-full"></i></span></div>
<div class="nav-bar solid">
    <div class="nav-left"><div class="nav-btn" data-back="profile.html"><i class="fa-solid fa-chevron-left"></i></div></div>
    <div class="nav-title">积分商城</div>
    <div class="nav-right"></div>
</div>
<div class="app-content">
<div class="pm-h5-wrap">
${main}
</div>
</div>
<div class="home-indicator"></div>
${overlays}
<script src="../js/digital-h5-nav.js"></script>
<script src="../js-web/invite-reward-config.js"></script>
<script src="../js-web/mall-vouchers-store.js"></script>
<script src="../js-web/mall-benefits-sync.js"></script>
<script src="../js-web/points-mall.js"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'pages/points-mall.html'), out);
console.log('Wrote pages/points-mall.html', main.length, 'chars main');
