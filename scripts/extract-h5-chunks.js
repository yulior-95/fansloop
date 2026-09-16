const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

function slice(file, start, end) {
  const h = fs.readFileSync(path.join(root, file), 'utf8');
  const i0 = h.indexOf(start);
  const i1 = end ? h.indexOf(end, i0) : h.length;
  if (i0 < 0) throw new Error('start not found: ' + file + ' :: ' + start.slice(0, 40));
  if (i1 < 0) throw new Error('end not found: ' + file);
  return h.slice(i0, i1);
}

const out = path.join(root, '_tmp-h5-chunks');
fs.mkdirSync(out, { recursive: true });

fs.writeFileSync(
  path.join(out, 'about.html'),
  slice('pages-web/settings-about.html', '<div class="about-hero">', '<div class="ab-toast"')
);
const notif = fs.readFileSync(path.join(root, 'pages-web/settings-notification.html'), 'utf8');
const n0 = notif.indexOf('fa-toggle-on');
const nStart = notif.lastIndexOf('<div class="set-card">', n0);
const nEnd = notif.indexOf('</main>', nStart);
if (nStart < 0 || nEnd < 0) throw new Error('notification bounds');
fs.writeFileSync(path.join(out, 'notification.html'), notif.slice(nStart, nEnd));
const disp = fs.readFileSync(path.join(root, 'pages-web/settings-display.html'), 'utf8');
const d0 = disp.indexOf('data-theme="dark"');
const dStart = disp.lastIndexOf('<!--', d0);
const dEnd = disp.indexOf('</main>', d0);
fs.writeFileSync(path.join(out, 'display.html'), disp.slice(dStart, dEnd));
const sub = fs.readFileSync(path.join(root, 'pages-web/settings-subscription.html'), 'utf8');
const s0 = sub.indexOf('id="tierGrid"');
const sStart = sub.lastIndexOf('<div class="set-card">', s0);
const sEnd = sub.indexOf('<div class="inline-overlay" id="ovlPromoEdit"', sStart);
fs.writeFileSync(path.join(out, 'subscription.html'), sub.slice(sStart, sEnd));
const terms = fs.readFileSync(path.join(root, 'pages-web/settings-terms.html'), 'utf8');
const t0 = terms.indexOf('terms-layout');
const tStart = terms.lastIndexOf('<div', t0);
const tEnd = terms.indexOf('</main>', t0);
fs.writeFileSync(path.join(out, 'terms.html'), terms.slice(tStart, tEnd));

// about feedback modal
fs.writeFileSync(
  path.join(out, 'about-modal.html'),
  slice('pages-web/settings-about.html', '<div class="inline-overlay" id="ovlAboutFeedback"', '<script src="../js-web/global-search.js">')
);

// subscription promo modal + scripts tail
fs.writeFileSync(
  path.join(out, 'subscription-modal.html'),
  slice('pages-web/settings-subscription.html', '<div class="inline-overlay" id="ovlPromoEdit"', '<div id="promoToastHost"')
);

// display modals/toasts
fs.writeFileSync(
  path.join(out, 'display-tail.html'),
  slice('pages-web/settings-display.html', '<div id="gaToast">', '<script src="../js-web/global-search.js">')
);

console.log('Wrote chunks to', out);
