const fs = require('fs');
const path = require('path');
const { icons } = require('lucide');

const lucideKebab = new Set();
for (const k of Object.keys(icons)) {
    lucideKebab.add(
        k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase()
    );
}
function hasLucide(kebab) {
    return lucideKebab.has(kebab);
}
const webIconsPath = path.join(__dirname, '../js-web/web-icons.js');
const webIconsSrc = fs.readFileSync(webIconsPath, 'utf8');
const mapBlock = webIconsSrc.match(/var FA_TO_LUCIDE = \{([\s\S]*?)\};/);
const FA_TO_LUCIDE = {};
if (mapBlock) {
    for (const m of mapBlock[1].matchAll(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g)) {
        FA_TO_LUCIDE[m[1]] = m[2];
    }
}

function resolve(fa) {
    return FA_TO_LUCIDE[fa] || fa;
}

const root = path.join(__dirname, '..');
const skipDir = new Set(['node_modules', '.git', '_scripts', 'admin-prototype', 'docs']);
const faNames = new Set();

function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (skipDir.has(e.name)) continue;
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith('.html') && (p.includes('pages-web') || p.includes('pages' + path.sep))) {
            const html = fs.readFileSync(p, 'utf8');
            for (const m of html.matchAll(/class=["'][^"']*fa-(solid|regular|brands)\s+fa-([a-z0-9-]+)/gi)) {
                faNames.add(m[2]);
            }
        }
    }
}
walk(root);

const missing = [];
for (const fa of [...faNames].sort()) {
    const luc = resolve(fa);
    if (!hasLucide(luc)) missing.push({ fa, luc });
}

console.log('FA icons used:', faNames.size);
console.log('Missing in Lucide after map:', missing.length);
console.log(missing.slice(0, 80).map((x) => x.fa + ' -> ' + x.luc).join('\n'));
if (missing.length > 80) console.log('... and', missing.length - 80, 'more');
