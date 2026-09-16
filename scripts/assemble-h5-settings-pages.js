const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const chunks = path.join(root, '_tmp-h5-chunks');

function read(name) {
  return fs.readFileSync(path.join(chunks, name), 'utf8');
}

function shell(title, bodyClass, headExtra, mainIntro, mainHtml, footHtml) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="../css/common.css">
<link rel="stylesheet" href="../css/h5-settings-common.css">
<link rel="stylesheet" href="../css/h5-light-theme.css">
<script src="../js/h5-theme-boot.js"></script>
${headExtra}
<style>
.nav-bar { background: var(--bg-primary); }
.app-content {
    padding-top: calc(var(--status-bar-height) + var(--nav-bar-height));
    padding-bottom: 28px;
}
</style>
</head>
<body class="page-settings page-settings-h5 ${bodyClass || ''}">
<div class="status-bar">
    <span class="time">9:41</span>
    <span class="right"><i class="fa-solid fa-signal"></i><i class="fa-solid fa-wifi"></i><i class="fa-solid fa-battery-full"></i></span>
</div>
<div class="nav-bar solid">
    <div class="nav-left"><div class="nav-btn" data-back="settings.html"><i class="fa-solid fa-chevron-left"></i></div></div>
    <div class="nav-title">${title}</div>
    <div class="nav-right"></div>
</div>
<div class="app-content set-h5-main">
${mainIntro}
${mainHtml}
</div>
${footHtml}
<script src="../js/digital-h5-nav.js"></script>
</body>
</html>`;
}

function fixWebLinks(html) {
  return html
    .replace(/href="live-detail\.html"/g, 'href="../pages-web/live-detail.html"')
    .replace(/href="live-translate-demo\.html"/g, 'href="../pages-web/live-translate-demo.html"')
    .replace(/href="messages-translate-demo\.html"/g, 'href="../pages-web/messages-translate-demo.html"')
    .replace(/href="creator-income\.html"/g, 'href="../pages-web/creator-income.html"')
    .replace(/href="profile\.html"/g, 'href="profile.html"')
    .replace(/href="settings-terms\.html/g, 'href="settings-terms.html');
}

// --- notification ---
const notifIntro = `
    <div class="set-page-intro">
        <p>选择你想接收的通知类型与渠道。每一类通知都可以独立选择是否在站内、邮件、推送中收到。</p>
        <div class="intro-actions"><button type="button" class="btn" id="btnNotifReset"><i class="fa-solid fa-rotate-left"></i> 恢复默认</button></div>
    </div>`;
let notifMain = read('notification.html');
notifMain = notifMain.replace(
  'grid-template-columns: repeat(3, 1fr)',
  'grid-template-columns: 1fr'
);
notifMain = notifMain.replace(/<table class="notif-table">/g, '<div class="notif-table-wrap"><table class="notif-table">');
notifMain = notifMain.replace(/<\/table>/g, '</table></div>');
fs.writeFileSync(
  path.join(root, 'pages/settings-notification.html'),
  shell(
    '通知偏好',
    '',
    '',
    notifIntro,
    notifMain,
    `<div class="set-toast" id="setPageToast" role="status"></div>
<script src="../js/h5-settings-common.js"></script>`
  )
);

// --- display ---
const dispHead = `
<link rel="stylesheet" href="../css-web/global-display-prefs.css">
<link rel="stylesheet" href="../css-web/global-accessibility.css">
<link rel="stylesheet" href="../css/h5-settings-display.css">
<script src="../js-web/global-display-prefs.js"></script>`;
const dispIntro = `
    <div class="set-page-intro">
        <p>根据自己的喜好定制 GOODFANS 的视觉效果与本地化体验。所有更改即刻生效。</p>
        <div class="intro-actions"><button type="button" class="btn" id="btnDispReset"><i class="fa-solid fa-rotate-left"></i> 恢复默认</button></div>
    </div>`;
fs.writeFileSync(
  path.join(root, 'pages/settings-display.html'),
  shell(
    '外观与语言',
    'page-settings-display-h5',
    dispHead,
    dispIntro,
    fixWebLinks(read('display.html')),
    fixWebLinks(read('display-tail.html')) +
      `
<script src="../js-web/global-accessibility-store.js"></script>
<script src="../js-web/global-accessibility-settings.js"></script>
<script src="../js-web/fl-timezone-catalog.js"></script>
<script src="../js-web/settings-display-page.js"></script>
<script src="../js/h5-settings-common.js"></script>`
  )
);

// --- subscription ---
const subHead = `
<link rel="stylesheet" href="../css-web/settings-creator.css">
<link rel="stylesheet" href="../css-web/subscribe-modal.css">
<link rel="stylesheet" href="../css/h5-settings-subscription.css">`;
const subIntro = `
    <div class="page-head" hidden aria-hidden="true"><button type="button" class="btn btn-primary">保存</button></div>
    <div class="set-page-intro">
        <p>配置订阅价格、权益与欢迎语，管理粉丝会员体系。</p>
        <div class="intro-actions">
            <button type="button" class="btn" onclick="location.href='profile.html'"><i class="fa-solid fa-eye"></i> 预览主页</button>
            <button type="button" class="btn btn-primary" id="btnSubSaveTop"><i class="fa-solid fa-floppy-disk"></i> 保存</button>
        </div>
    </div>`;
let subMain = read('subscription.html');
subMain = subMain.replace(
  /<table class="promo-table">/,
  '<div class="promo-table-wrap"><table class="promo-table">'
);
subMain = subMain.replace(/<\/table>\s*<\/div>\s*<\/div>\s*<\/div>\s*$/, '</table></div></div></div>');
fs.writeFileSync(
  path.join(root, 'pages/settings-subscription.html'),
  shell(
    '会员订阅设置',
    '',
    subHead,
    subIntro,
    subMain,
    read('subscription-modal.html') +
      `<div id="promoToastHost" aria-live="polite"></div>
<script src="../js/creator-subscription-store.js"></script>
<script src="../js-web/creator-promo-codes-store.js"></script>
<script src="../js-web/settings-subscription-page.js"></script>
<script src="../js-web/settings-subscription-promo-page.js"></script>
<script src="../js/h5-settings-subscription.js"></script>
<script src="../js/h5-settings-common.js"></script>`
  )
);

// --- about ---
const aboutHead = `
<link rel="stylesheet" href="../css-web/settings-about-terms.css">
<link rel="stylesheet" href="../css-web/subscribe-modal.css">
<link rel="stylesheet" href="../css/h5-settings-about.css">`;
const aboutIntro = `
    <div class="set-page-intro">
        <p>面向加密原生用户与创作者的 Web3 内容订阅与打赏平台。</p>
        <div class="intro-actions">
            <button type="button" class="btn" id="aboutCopyVer"><i class="fa-regular fa-copy"></i> 复制版本</button>
            <button type="button" class="btn btn-primary" id="aboutCheckUpdate"><i class="fa-solid fa-cloud-arrow-down"></i> 检查更新</button>
        </div>
    </div>`;
fs.writeFileSync(
  path.join(root, 'pages/settings-about.html'),
  shell(
    '关于 GOODFANS',
    '',
    aboutHead,
    aboutIntro,
    fixWebLinks(read('about.html')),
    read('about-modal.html') +
      `<div class="ab-toast" id="aboutToast" role="status" aria-live="polite"></div>
<script src="../js-web/settings-about-page.js"></script>
<script src="../js/h5-settings-common.js"></script>`
  )
);

// --- terms ---
const termsHead = `
<link rel="stylesheet" href="../css-web/settings-about-terms.css">
<link rel="stylesheet" href="../css/h5-settings-terms.css">`;
const termsIntro = `
    <div class="set-page-intro">
        <p>使用 GOODFANS 前请阅读并理解以下法律文件。</p>
        <div class="intro-actions"><button type="button" class="btn" id="termsDownload"><i class="fa-solid fa-download"></i> 导出当前文档</button></div>
    </div>`;
fs.writeFileSync(
  path.join(root, 'pages/settings-terms.html'),
  shell(
    '条款与协议',
    '',
    termsHead,
    termsIntro,
    read('terms.html'),
    `<script src="../js-web/settings-terms-page.js"></script>
<script src="../js/h5-settings-common.js"></script>`
  )
);

console.log('Assembled H5 settings pages under pages/');
