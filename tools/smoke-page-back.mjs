/**
 * Smoke test: inject page-back-nav into key Web pages via linkedom
 */
import fs from 'fs';
import { parseHTML } from 'linkedom';

const pages = [
  'pages-web/settings-wallet.html',
  'pages-web/settings-privacy.html',
  'pages-web/settings-display.html',
  'pages-web/settings-security.html',
  'pages-web/settings-notification.html',
  'pages-web/settings-subscription.html',
  'pages-web/settings-about.html',
  'pages-web/settings-terms.html',
  'pages-web/recharge.html',
  'pages-web/withdraw-usdt.html',
  'pages-web/withdraw-fiat.html',
  'pages-web/transfer.html',
  'pages-web/funds-history.html',
  'pages-web/funds-flow-detail.html',
  'pages-web/transactions-search.html',
  'pages-web/transaction-detail.html',
  'pages-web/home-points-ledger.html',
  'pages-web/messages-requests.html',
  'pages-web/kyc-intro.html',
  'pages-web/digital-asset-store.html',
  'pages-web/create-digital-asset.html',
  'pages-web/wallet-address-book.html',
  'pages-web/topic-detail.html',
  'pages-web/bookmarks.html',
  'pages-web/notification-detail.html',
  'pages-web/affiliate-catalog.html',
  'pages-web/obs-cohost-pk/host-live-base.html',
  'pages-web/my-digital-assets.html',
  'pages-web/creator-showcase.html',
  'pages-web/points-tier-info.html',
  'pages-web/messages-compose.html',
  'pages-web/messages-group-create.html',
  'pages-web/live-detail.html',
  'pages-web/creator-profile.html'
];

const code = fs.readFileSync('js-web/page-back-nav.js', 'utf8');
const results = [];
let fails = 0;

for (const page of pages) {
  if (!fs.existsSync(page)) {
    results.push(page + ' | MISSING_FILE');
    fails++;
    continue;
  }
  const html = fs.readFileSync(page, 'utf8');
  const { document, window } = parseHTML(html);
  try {
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
  } catch (e) {}
  Object.defineProperty(window, 'location', {
    value: {
      pathname: '/' + page,
      href: 'http://127.0.0.1/' + page,
      origin: 'http://127.0.0.1',
      hash: ''
    },
    configurable: true
  });
  window.history = { length: 1, back() { window.__backed = true; } };
  window.document = document;
  try {
    const fn = new Function(
      'window',
      code +
        ';var el=window.document.querySelector("[data-fl-page-back],#flPageBackBtn,a.back,#linkBack,.pti-back,.ld-ab-back");' +
        'return {has:!!el, text: el ? (el.textContent||"").trim() : "", fallback: window.FL_pageBackFallback ? window.FL_pageBackFallback() : "", page: (window.location.pathname||"").split("/").pop()};'
    );
    const out = fn(window);
    const ok = !!out.has;
    if (!ok) fails++;
    results.push(
      page +
        ' | back=' +
        (ok ? 'YES' : 'NO') +
        ' | page=' +
        out.page +
        ' | label=' +
        JSON.stringify(out.text) +
        ' | fb=' +
        out.fallback
    );
  } catch (e) {
    fails++;
    results.push(page + ' | ERROR ' + e.message);
  }
}

console.log(results.join('\n'));
console.log('FAILS=' + fails);
process.exit(fails ? 1 : 0);
