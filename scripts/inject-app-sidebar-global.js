const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'pages-web');
const preScript =
    '<script>try{if(localStorage.getItem(\'fl_sidebar_collapsed\')===\'1\')document.documentElement.classList.add(\'sidebar-collapsed-pre\')}catch(e){}</script>\n';
const bodyScript = '<script src="../js-web/app-sidebar-global.js"></script>\n';

let patched = 0;

fs.readdirSync(pagesDir).forEach((file) => {
    if (!file.endsWith('.html')) return;
    const fp = path.join(pagesDir, file);
    let html = fs.readFileSync(fp, 'utf8');
    if (!html.includes('app-shell')) return;

    let changed = false;

    if (!html.includes('sidebar-collapsed-pre') && html.includes('../css-web/common-web.css')) {
        html = html.replace(
            /<link rel="stylesheet" href="\.\.\/css-web\/common-web\.css">\s*\n?/,
            '<link rel="stylesheet" href="../css-web/common-web.css">\n' + preScript
        );
        changed = true;
    }

    if (!html.includes('app-sidebar-global.js') && html.includes('</body>')) {
        html = html.replace('</body>', bodyScript + '</body>');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(fp, html, 'utf8');
        patched++;
    }
});

console.log('patched', patched, 'files');
