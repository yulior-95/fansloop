const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const faLink = /font-awesome|all\.min\.css/i;
const skipDir = new Set(['node_modules', '.git', '_scripts', '_tmp-h5-chunks', 'docs', 'admin-prototype']);

function walk(d, out = []) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (skipDir.has(e.name)) continue;
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (e.name.endsWith('.html')) out.push(p);
    }
    return out;
}

const faNames = new Set();
const issues = { faNoLink: [], hPointsEmpty: [], bareI: [] };

for (const f of walk(root)) {
    const rel = path.relative(root, f).replace(/\\/g, '/');
    const html = fs.readFileSync(f, 'utf8');
    const hasFaIcon = /class=["'][^"']*fa-(solid|regular|brands)/i.test(html);
    const hasFaLink = faLink.test(html);
    const viaCommon = html.includes('common.css') || html.includes('common-web.css');

    if (hasFaIcon && !hasFaLink && !viaCommon) issues.faNoLink.push(rel);

    if (html.includes('id="hPointsBtn"')) {
        const m = html.match(/<button[^>]*id="hPointsBtn"[^>]*>([\s\S]*?)<\/button>/i);
        const inner = m ? m[1].trim() : '';
        if (!/<i[^>]*fa-/i.test(inner)) issues.hPointsEmpty.push(rel);
    }

    for (const m of html.matchAll(/class=["']([^"']*fa-[a-z0-9-]+[^"']*)["']/gi)) {
        m[1].split(/\s+/).forEach(function (c) {
            if (c.indexOf('fa-') === 0 && !/^fa-(solid|regular|brands|light|thin|duotone)$/.test(c)) {
                faNames.add(c.slice(3));
            }
        });
    }

    const bareI = [...html.matchAll(/<i(?![^>]*\bclass=)[^>]*>/gi)];
    if (bareI.length) issues.bareI.push({ rel, n: bareI.length });
}

console.log('unique fa icons:', faNames.size);
console.log(JSON.stringify(issues, null, 2));
