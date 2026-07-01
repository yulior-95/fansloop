import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'pages-web');
const needle = '<script src="../js-web/global-lang-switch.js" defer></script>';
const patch = '<script src="../js-web/ui-i18n.js" defer></script>\n<script src="../js-web/global-lang-switch.js" defer></script>';

let count = 0;
for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.html')) continue;
    const p = path.join(dir, f);
    let html = fs.readFileSync(p, 'utf8');
    if (!html.includes('global-lang-switch.js') || html.includes('ui-i18n.js')) continue;
    html = html.replace(needle, patch);
    fs.writeFileSync(p, html);
    count++;
}
console.log('Patched ui-i18n into', count, 'files');
