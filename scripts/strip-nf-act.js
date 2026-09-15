const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const re = /\s*<div class="nf-act">[\s\S]*?<\/div>/g;
const paths = [
  path.join(root, 'pages-web/notifications.html'),
  path.join(root, 'pages/notifications.html')
];
for (const p of paths) {
  let c = fs.readFileSync(p, 'utf8');
  const before = (c.match(re) || []).length;
  c = c.replace(re, '');
  c = c.replace(
    /var actions = document\.createElement\('div'\);\s*actions\.className = 'nf-act';[\s\S]*?body\.append\(text, meta, actions\);/,
    'body.append(text, meta);'
  );
  fs.writeFileSync(p, c);
  console.log(path.basename(p), 'removed', before, 'nf-act blocks');
}
