const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const web = fs.readFileSync(path.join(root, 'pages-web/notifications.html'), 'utf8');

const styleStart = web.indexOf('<style>');
const styleEnd = web.indexOf('</style>', styleStart) + 8;
const inlineStyles = web.slice(styleStart, styleEnd);

const mainStart = web.indexOf('<div class="nf-filter"');
const mainEnd = web.indexOf('<!-- 右侧 -->');
const main = web.slice(mainStart, mainEnd);

const scriptStart = web.indexOf('<script>\n(function () {\n    var typeMap');
const scriptEnd = web.indexOf('</script>', scriptStart) + 9;
const inlineScript = web.slice(scriptStart, scriptEnd);

const toastStart = web.indexOf('<div class="nf-toast-host"');
const cddStart = web.indexOf('<div class="cdd-root"');
const overlays = web.slice(toastStart, cddStart);

const headActions = `
<div class="nf-h5-head">
    <p class="nf-h5-sub">未读与互动提醒 · 与 Web 通知中心一致</p>
    <div class="nf-h5-btns">
        <button type="button" class="nf-h5-btn" id="btnMarkAllReadTop"><i class="fa-solid fa-check-double"></i> 全部已读</button>
        <button type="button" class="nf-h5-btn" id="btnNfSettings"><i class="fa-solid fa-gear"></i> 设置</button>
    </div>
</div>`;

const out = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>通知中心</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="../css/common.css">
<link rel="stylesheet" href="../css-web/notifications-interactions.css">
<script src="../js/h5-theme-boot.js"></script>
${inlineStyles}
<style>
.nav-bar { background: var(--bg-primary); }
.app-content {
    padding-top: calc(var(--status-bar-height) + var(--nav-bar-height));
    padding-bottom: 28px;
}
.nf-h5-head { margin: 0 16px 10px; }
.nf-h5-sub { font-size: 11px; color: var(--text-tertiary); margin: 0 0 8px; line-height: 1.45; }
.nf-h5-btns { display: flex; gap: 8px; }
.nf-h5-btn {
    flex: 1; height: 34px; border-radius: 10px;
    border: 1px solid var(--border-color);
    background: var(--bg-card); color: var(--text-secondary);
    font-size: 11px; font-weight: 600;
}
.nf-h5-wrap {
    padding: 0 12px;
    --border: var(--border-color);
    --border-strong: var(--border-color);
    --bg-hover: rgba(168, 85, 247, 0.06);
    --t-primary: var(--text-primary);
    --t-secondary: var(--text-secondary);
    --t-tertiary: var(--text-tertiary);
    --t-quaternary: var(--text-tertiary);
    --brand-grad: var(--brand-gradient);
    --brand-purple: #a855f7;
    --r-md: 12px;
    --r-lg: 14px;
    --r-xl: 16px;
    --success-light: #6ee7b7;
    --warning-light: #fbbf24;
    --info-light: #93c5fd;
}
.nf-h5-wrap .nf-filter { width: 100%; max-width: 100%; overflow-x: auto; flex-wrap: nowrap; }
.nf-h5-wrap .nf-list { border-radius: 14px; }
.nf-h5-wrap .nf-item { padding: 14px 14px 14px 18px; }
.nf-h5-wrap .nf-thumb { width: 44px; height: 44px; }
.nf-overlay { position: absolute !important; z-index: 500; padding: 12px; align-items: flex-end; }
.nf-overlay.show { display: flex; }
.nf-modal { max-width: 100%; max-height: 88%; border-radius: 16px 16px 0 0; margin: 0; }
.nf-toast-host { position: absolute; z-index: 600; pointer-events: none; }
:root[data-theme='light'] .nf-list,
:root[data-theme='light'] .nf-filter,
:root[data-theme='light'] .nf-bulk { background: var(--bg-card); }
</style>
<link rel="stylesheet" href="../css/h5-light-theme.css">
</head>
<body>
<div class="status-bar"><span class="time">9:41</span><span class="right"><i class="fa-solid fa-signal"></i><i class="fa-solid fa-wifi"></i><i class="fa-solid fa-battery-full"></i></span></div>
<div class="nav-bar solid">
    <div class="nav-left"><div class="nav-btn" data-back="profile.html"><i class="fa-solid fa-chevron-left"></i></div></div>
    <div class="nav-title">通知中心</div>
    <div class="nav-right"></div>
</div>
<div class="app-content">
${headActions}
<div class="nf-h5-wrap">
${main}
</div>
</div>
<div class="home-indicator"></div>
${overlays}
<script src="../js/digital-h5-nav.js"></script>
<script src="../js-web/tip-events-store.js"></script>
<script src="../js-web/notification-system-announcements.js"></script>
<script src="../js-web/notifications-interactions.js"></script>
${inlineScript}
<script>
document.getElementById('btnNfWalletGo')?.addEventListener('click', function () { location.href = 'wallet.html'; });
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'pages/notifications.html'), out);
console.log('Wrote pages/notifications.html');
