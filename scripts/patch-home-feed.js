const fs = require('fs');
const p = require('path').join(__dirname, '../pages-web/home.html');
let h = fs.readFileSync(p, 'utf8');

const start = '<div class="feed-stack-track" id="feedStackTrack">';
const end = '<div class="feed-stack-ui">';
const i = h.indexOf(start);
const j = h.indexOf(end);
if (i < 0 || j < 0) throw new Error('rec markers not found');
const replacement =
  start +
  '\n                <!-- 内容由 feed-stack-builder.js 生成 30 条 -->\n                </div>\n                ';
h = h.slice(0, i) + replacement + h.slice(j);

const fStart = '<div class="feed-panel-follow feed-panel" id="feedFollow">';
const fEnd = '<div class="feed-panel-live feed-panel" id="feedLive">';
const fi = h.indexOf(fStart);
const fj = h.indexOf(fEnd);
if (fi < 0 || fj < 0) throw new Error('follow markers not found');
const followBlock = `                <div class="feed-panel-follow feed-panel" id="feedFollow">
                <div class="feed-stack-viewport" id="feedFollowStackViewport">
                <div class="feed-stack-track" id="feedFollowStackTrack" data-stack="follow" data-build="30"></div>
                <div class="feed-stack-ui">
                    <button type="button" class="feed-stack-nav-btn" id="feedFollowStackPrev" title="上一条"><i class="fa-solid fa-chevron-up"></i></button>
                    <span class="feed-stack-indicator" id="feedFollowStackIndicator">1 / 30</span>
                    <button type="button" class="feed-stack-nav-btn" id="feedFollowStackNext" title="下一条"><i class="fa-solid fa-chevron-down"></i></button>
                </div>
                </div>
                <p class="feed-stack-hint">关注创作者动态 · 滚轮或 ↑ ↓ 切换</p>
                </div>

                `;
h = h.slice(0, fi) + followBlock + h.slice(fj);

const lStart = '<div class="feed-panel-live feed-panel" id="feedLive">';
const lEnd = '<p class="feed-stack-hint" style="margin-top:12px">';
const li = h.indexOf(lStart);
const lj = h.indexOf(lEnd);
if (li < 0 || lj < 0) throw new Error('live markers not found');
const liveBlock = `                <div class="feed-panel-live feed-panel" id="feedLive">
                <div class="feed-stack-viewport" id="feedLiveStackViewport">
                <div class="feed-stack-track" id="feedLiveStackTrack" data-stack="live" data-build="30"></div>
                <div class="feed-stack-ui">
                    <button type="button" class="feed-stack-nav-btn" id="feedLiveStackPrev" title="上一条"><i class="fa-solid fa-chevron-up"></i></button>
                    <span class="feed-stack-indicator" id="feedLiveStackIndicator">1 / 30</span>
                    <button type="button" class="feed-stack-nav-btn" id="feedLiveStackNext" title="下一条"><i class="fa-solid fa-chevron-down"></i></button>
                </div>
                </div>
                <p class="feed-stack-hint">正在直播 · 滚轮或 ↑ ↓ 切换</p>
                </div>

                `;
h = h.slice(0, li) + liveBlock + h.slice(lj);

h = h.replace('id="feedStackIndicator">1 / 5', 'id="feedStackIndicator">1 / 30');
if (!h.includes('feed-stack-builder.js')) {
  h = h.replace(
    '<script src="../js-web/home-feed-v2.js"></script>',
    '<script src="../js-web/feed-stack-builder.js"></script>\n<script src="../js-web/home-feed-v2.js"></script>'
  );
}
fs.writeFileSync(p, h);
console.log('patched home.html');
