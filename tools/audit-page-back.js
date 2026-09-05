const fs = require('fs');
const path = require('path');
const { parseHTML } = require('linkedom');

const code = fs.readFileSync('js-web/page-back-nav.js', 'utf8');
const main = new Set([
  'home.html', 'guest-home.html', 'subscriptions.html', 'discover.html', 'create.html',
  'messages.html', 'notifications.html', 'wallet.html', 'creator-income.html', 'points-mall.html',
  'transactions.html', 'profile.html', 'settings.html', 'yanshi-web.html', 'index.html'
]);

function walk(d, acc = []) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) {
      if (f.name === 'partials') continue;
      walk(p, acc);
    } else if (f.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

function hasBack(window) {
  const doc = window.document;
  if (doc.querySelector('[data-fl-page-back],#flPageBackBtn,a.back,#linkBack,.pti-back,.ld-ab-back,#daBackShowcase,#csBackProfile')) {
    return true;
  }
  const els = doc.querySelectorAll('a,button');
  for (let i = 0; i < els.length; i++) {
    const t = ((els[i].textContent || '') + (els[i].getAttribute('title') || '')).replace(/\s+/g, '');
    if (t.includes('返回') || t.includes('上一步') || t.includes('回到')) return true;
  }
  return false;
}

const pages = walk('pages-web').filter((p) => !main.has(path.basename(p)));
let ok = 0;
let fail = 0;
const fails = [];

for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  const { document, window } = parseHTML(html);
  try {
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
  } catch (e) {}
  Object.defineProperty(window, 'location', {
    value: {
      pathname: '/' + page.replace(/\\/g, '/'),
      href: 'http://127.0.0.1/' + page.replace(/\\/g, '/'),
      origin: 'http://127.0.0.1',
      hash: ''
    },
    configurable: true
  });
  window.history = { length: 1, back() {} };
  window.document = document;
  try {
    const fn = new Function('window', code + '; return true;');
    fn(window);
    if (hasBack(window)) ok++;
    else {
      fail++;
      fails.push(page);
    }
  } catch (e) {
    fail++;
    fails.push(page + ' ERR ' + e.message);
  }
}

console.log('TOTAL_SUB=' + pages.length + ' OK=' + ok + ' FAIL=' + fail);
console.log(fails.join('\n'));
process.exit(fail ? 1 : 0);
