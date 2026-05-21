const fs = require('fs');
const p = require('path').join(__dirname, '../pages-web/guest-home.html');
let h = fs.readFileSync(p, 'utf8');

if (!h.includes('home-feed-v2.css')) {
  h = h.replace(
    '<link rel="stylesheet" href="../css-web/home-feed.css">',
    '<link rel="stylesheet" href="../css-web/home-feed.css">\n<link rel="stylesheet" href="../css-web/home-feed-v2.css">'
  );
}
if (!h.includes('is-guest-home')) {
  h = h.replace('<body>', '<body class="is-guest-home">');
}

h = h.replace(
  '<div class="h-search h-search-live">\n            <div class="hs-inner">',
  '<div class="h-search h-search-live h-search-unified">\n            <div class="hs-inner">'
);
h = h.replace(
  '<input type="search" id="globalSearchInp"',
  '<input type="search" id="globalSearchInp"'
);
if (!h.includes('id="globalSearchDrop"')) {
  h = h.replace(
    '</div>\n            <button type="button" id="btnGlobalSearch">',
    '</div>\n            <div class="gs-drop" id="globalSearchDrop"></div>\n            <button type="button" id="btnGlobalSearch">'
  );
}

h = h.replace('<div class="feed-grid">', '<div class="feed-grid feed-grid--immersive">');
h = h.replace(
  '<div class="feed-grid feed-grid--immersive">\n\n            <!-- 主 Feed -->\n            <div>',
  '<div class="feed-grid feed-grid--immersive">\n            <div class="feed-main-col">'
);

// Remove composer block
const compStart = '<!-- Composer · 与 home 布局一致，游客遮罩 -->';
const compEnd = '<div class="guest-quota-row"';
const ci = h.indexOf(compStart);
const cj = h.indexOf(compEnd);
if (ci >= 0 && cj > ci) {
  h = h.slice(0, ci) + '<!-- Composer 已改为右下角 FAB（游客点击跳转登录） -->\n                ' + h.slice(cj);
}

// Add live tab
if (!h.includes('data-feed="live"')) {
  h = h.replace(
    '<div class="tab" data-feed="follow"',
    '<div class="tab" data-feed="follow"'
  );
  h = h.replace(
    '<div class="grow"></div>\n                    <button type="button" class="more" id="btnFeedFilter">',
    '<div class="tab" data-feed="live" role="button" tabindex="0"><i class="fa-solid fa-tower-broadcast"></i>直播</div>\n                    <div class="grow"></div>\n                    <button type="button" class="more" id="btnFeedFilter">'
  );
}

h = h.replace('class="feed-panel-rec active" id="feedRec"', 'class="feed-panel-rec feed-panel active" id="feedRec"');

const recStart = '<div class="feed-panel-rec feed-panel active" id="feedRec">';
const recEnd = '<div class="feed-panel-guest-follow';
let ri = h.indexOf(recStart);
let rj = h.indexOf(recEnd);
if (ri < 0) {
  recEnd = '<!-- Post 1';
  rj = h.indexOf(recEnd);
}
if (ri >= 0 && rj > ri) {
  const recBlock = `                <div class="feed-panel-rec feed-panel active" id="feedRec">
                <div class="feed-stack-viewport" id="feedStackViewport">
                <div class="feed-stack-track" id="feedStackTrack" data-stack="rec" data-build="30"></div>
                <div class="feed-stack-ui">
                    <button type="button" class="feed-stack-nav-btn" id="feedStackPrev" title="上一条"><i class="fa-solid fa-chevron-up"></i></button>
                    <span class="feed-stack-indicator" id="feedStackIndicator">1 / 30</span>
                    <button type="button" class="feed-stack-nav-btn" id="feedStackNext" title="下一条"><i class="fa-solid fa-chevron-down"></i></button>
                </div>
                </div>
                <p class="feed-stack-hint">滚轮或 ↑ ↓ 键切换 · 登录后可互动</p>
                </div>

                `;
  h = h.slice(0, ri) + recBlock + h.slice(rj);
}

// Remove old flat articles until guest-follow or aside
const artStart = h.indexOf('<!-- Post 1');
const gfStart = h.indexOf('<div class="feed-panel-guest-follow');
const asideStart = h.indexOf('<aside class="feed-aside">');
let cutEnd = gfStart > 0 ? gfStart : asideStart;
if (artStart >= 0 && cutEnd > artStart) {
  h = h.slice(0, artStart) + h.slice(cutEnd);
}

// guest follow panel -> stack
const gfBlock = `                <div class="feed-panel-follow feed-panel" id="feedFollow">
                <div class="feed-stack-viewport" id="feedFollowStackViewport">
                <div class="feed-stack-track" id="feedFollowStackTrack" data-stack="follow" data-build="30"></div>
                <div class="feed-stack-ui">
                    <button type="button" class="feed-stack-nav-btn" id="feedFollowStackPrev"><i class="fa-solid fa-chevron-up"></i></button>
                    <span class="feed-stack-indicator" id="feedFollowStackIndicator">1 / 30</span>
                    <button type="button" class="feed-stack-nav-btn" id="feedFollowStackNext"><i class="fa-solid fa-chevron-down"></i></button>
                </div>
                </div>
                </div>

                <div class="feed-panel-live feed-panel" id="feedLive">
                <div class="feed-stack-viewport" id="feedLiveStackViewport">
                <div class="feed-stack-track" id="feedLiveStackTrack" data-stack="live" data-build="30"></div>
                <div class="feed-stack-ui">
                    <button type="button" class="feed-stack-nav-btn" id="feedLiveStackPrev"><i class="fa-solid fa-chevron-up"></i></button>
                    <span class="feed-stack-indicator" id="feedLiveStackIndicator">1 / 30</span>
                    <button type="button" class="feed-stack-nav-btn" id="feedLiveStackNext"><i class="fa-solid fa-chevron-down"></i></button>
                </div>
                </div>
                </div>

                `;

if (h.includes('feed-panel-guest-follow')) {
  const gfi = h.indexOf('<div class="feed-panel-guest-follow');
  const gfj = h.indexOf('<aside class="feed-aside">');
  if (gfi >= 0 && gfj > gfi) {
    h = h.slice(0, gfi) + gfBlock + h.slice(gfj);
  }
} else if (!h.includes('id="feedFollowStackTrack"')) {
  const ai = h.indexOf('<aside class="feed-aside">');
  if (ai >= 0) h = h.slice(0, ai) + gfBlock + h.slice(ai);
}

// Close feed-main-col before aside
if (!h.includes('feed-main-col') || h.indexOf('</div>\n\n            <aside') < 0) {
  h = h.replace('<aside class="feed-aside">', '            </div>\n\n            <!--aside class="feed-aside" hidden>');
  h = h.replace('</aside>\n\n        </div>', '</aside-->\n\n        </div>');
}

// FAB
if (!h.includes('createFabWrap')) {
  const fab = `
<div class="create-fab-wrap" id="createFabWrap">
    <div class="create-fab-menu">
        <button type="button" class="create-fab-item live" data-create-type="live"><i class="fa-solid fa-tower-broadcast"></i> 开直播</button>
        <button type="button" class="create-fab-item video" data-create-type="video"><i class="fa-solid fa-video"></i> 视频</button>
        <button type="button" class="create-fab-item image" data-create-type="image"><i class="fa-regular fa-image"></i> 图文</button>
    </div>
    <button type="button" class="create-fab-main" id="createFabMain" title="登录后发布"><i class="fa-solid fa-plus"></i></button>
</div>
`;
  h = h.replace('</div>\n\n<link rel="stylesheet" href="../css-web/host-live-pip-global.css">', '</div>\n' + fab + '\n<link rel="stylesheet" href="../css-web/host-live-pip-global.css">');
}

if (!h.includes('feed-stack-builder.js')) {
  h = h.replace(
    '<script src="../js-web/host-live-pip-global.js"></script>',
    '<script src="../js-web/feed-stack-builder.js"></script>\n<script src="../js-web/home-feed-v2.js"></script>\n<script src="../js-web/host-live-pip-global.js"></script>'
  );
}

// FAB guest login
if (!h.includes('createFabMain')) {
  /* already added */
} else if (!h.includes('guestFabLogin')) {
  h = h.replace(
    '<script src="../js-web/home-feed-v2.js"></script>',
    `<script src="../js-web/home-feed-v2.js"></script>
<script>
document.getElementById('createFabMain')?.addEventListener('click', function(){ location.href='modal-login-main.html'; });
document.querySelectorAll('.create-fab-item').forEach(function(b){
  b.addEventListener('click', function(e){ e.stopPropagation(); location.href='modal-login-main.html'; });
});
</script>`
  );
}

fs.writeFileSync(p, h);
console.log('patched guest-home.html');
