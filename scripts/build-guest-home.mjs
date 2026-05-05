import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const out = path.join(root, 'pages-web', 'guest-home.html');
let h = fs.readFileSync(path.join(root, 'pages-web', 'home.html'), 'utf8');

h = h.replace('<title>首页 · FansLoop</title>', '<title>首页（游客）· FansLoop</title>');
h = h.replace(
  '<link rel="stylesheet" href="../css-web/common-web.css">',
  `<link rel="stylesheet" href="../css-web/common-web.css">
<link rel="stylesheet" href="../css-web/home-feed.css">
<link rel="stylesheet" href="../css-web/prototype-guest-first.css">`
);
h = h.replace(/<style>[\s\S]*?<\/style>\s*<\/head>/, '</head>');

const guestCss = `<style>
@keyframes pulse-live { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.5;transform:scale(.85);} }
.lang-dd{position:absolute;top:calc(100% + 8px);right:0;min-width:140px;background:var(--bg-card);border:1px solid var(--border-strong);border-radius:var(--r-md);box-shadow:var(--shadow-lg);display:none;z-index:120;}
.lang-dd.show{display:block;}
.lang-dd button{width:100%;text-align:left;padding:10px 14px;font-size:12px;color:var(--t-secondary);border-bottom:1px solid var(--border);background:transparent;cursor:pointer;}
.lang-dd button:hover{background:var(--bg-input);color:#fff;}
.lang-wrap{position:relative;}
.composer.guest-composer-wrap{position:relative;overflow:hidden;}
.guest-veil{position:absolute;inset:0;background:rgba(7,7,13,.72);backdrop-filter:blur(4px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:5;cursor:pointer;text-align:center;padding:16px;}
.guest-veil i{font-size:22px;color:var(--brand-purple);}
.guest-veil span{font-size:13px;font-weight:700;color:var(--t-secondary);}
.s-item.is-guest-lock{opacity:.58;}
.feed-panel-follow{display:none!important;}
.feed-panel-guest-follow{display:none;}
.feed-panel-guest-follow.active{display:block;}
.guest-aside-lock .guest-lock-body{position:relative;min-height:120px;}
.guest-aside-veil{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(7,7,13,.7);backdrop-filter:blur(6px);border-radius:var(--r-md);text-align:center;padding:14px;font-size:12px;color:var(--t-secondary);}
.guest-aside-veil strong{color:#fff;font-size:13px;}
</style>`;

h = h.replace('</head>', guestCss + '</head>');

fs.writeFileSync(out, h);
console.log('guest-home base written:', out);
