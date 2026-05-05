import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'pages-web');
const SNIPPET = `
<link rel="stylesheet" href="../css-web/global-lang-switch.css">
<script src="../js-web/global-lang-switch.js" defer></script>`;

let count = 0;
for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.html')) continue;
    if (f === 'yanshi-web.html') continue;
    const p = path.join(dir, f);
    let html = fs.readFileSync(p, 'utf8');
    if (html.includes('global-lang-switch.js')) continue;
    if (!html.includes('</head>')) continue;
    html = html.replace('</head>', SNIPPET + '\n</head>');
    fs.writeFileSync(p, html);
    count++;
}
console.log('Injected global-lang into', count, 'files');
