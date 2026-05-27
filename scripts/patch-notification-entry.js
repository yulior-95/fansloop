const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../pages-web');
const from = "location.href='notifications.html'";
const to = "location.href='notifications.html?tab=unread'";
const scriptTag = '<script src="../js-web/app-sidebar-global.js"></script>';

let sidebarN = 0;
let scriptN = 0;

fs.readdirSync(dir).filter((f) => f.endsWith('.html')).forEach((file) => {
  const p = path.join(dir, file);
  let h = fs.readFileSync(p, 'utf8');
  let changed = false;

  if (h.includes(from)) {
    h = h.split(from).join(to);
    changed = true;
    sidebarN += 1;
  }

  if (h.includes('app-header') && h.includes('fa-regular fa-bell') && h.includes('h-icon') && !h.includes('app-sidebar-global.js')) {
    if (h.includes('</body>')) {
      h = h.replace('</body>', scriptTag + '\n</body>');
      changed = true;
      scriptN += 1;
    }
  }

  if (changed) fs.writeFileSync(p, h, 'utf8');
});

console.log('sidebar links updated:', sidebarN);
console.log('app-sidebar-global.js injected:', scriptN);
