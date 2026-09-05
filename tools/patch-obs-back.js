const fs = require('fs');
const path = require('path');
const dir = 'pages-web/obs-cohost-pk';
const oldBtn = '<button type="button" class="btn btn-secondary btn-sm"><i class="fa-solid fa-arrow-left"></i> 返回工作室</button>';
const newBtn = '<button type="button" class="btn btn-secondary btn-sm" data-fl-page-back="1" onclick="location.href=\'../create-live-host.html\'"><i class="fa-solid fa-arrow-left"></i> 返回工作室</button>';

for (const f of fs.readdirSync(dir)) {
  if (!/^host-.*\.html$/.test(f) && !/^viewer-.*\.html$/.test(f)) continue;
  const fp = path.join(dir, f);
  let s = fs.readFileSync(fp, 'utf8');
  if (!s.includes(oldBtn)) {
    console.log('no', f);
    continue;
  }
  s = s.split(oldBtn).join(newBtn);
  fs.writeFileSync(fp, s);
  console.log('fixed', f);
}
