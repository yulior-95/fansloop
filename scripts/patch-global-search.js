const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../pages-web');

function unifiedSearch(placeholder) {
  const ph = placeholder.replace(/"/g, '&quot;');
  return `<div class="h-search h-search-live h-search-unified">
            <div class="hs-inner">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="search" placeholder="${ph}" autocomplete="off" />
            </div>
            <div class="gs-drop"></div>
        </div>`;
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
let n = 0;

files.forEach((file) => {
  let h = fs.readFileSync(path.join(dir, file), 'utf8');
  if (!h.includes('app-header')) return;
  let changed = false;

  // 静态 h-search（含 kbd）
  h = h.replace(
    /<div class="h-search">\s*<i class="fa-solid fa-magnifying-glass"><\/i>\s*<span>([^<]*)<\/span>\s*<span class="kbd">⌘ K<\/span>\s*<\/div>/g,
    function (_, ph) {
      changed = true;
      return unifiedSearch(ph.trim());
    }
  );
  // 静态 h-search（无 kbd）
  h = h.replace(
    /<div class="h-search">\s*<i class="fa-solid fa-magnifying-glass"><\/i>\s*<span>([^<]*)<\/span>\s*<\/div>/g,
    function (_, ph) {
      if (h.indexOf('h-search-unified') !== -1 && _) return _;
      changed = true;
      return unifiedSearch(ph.trim());
    }
  );
  // discover / subscriptions 仅 span 无 icon
  h = h.replace(
    /<div class="h-search">\s*<i class="fa-solid fa-magnifying-glass"><\/i>\s*<span>搜索创作者、内容或话题…<\/span>\s*<span class="kbd">⌘ K<\/span>\s*<\/div>/g,
    function () {
      changed = true;
      return unifiedSearch('搜索创作者、内容或话题…');
    }
  );

  // points-mall 等 h-search-live + 按钮
  h = h.replace(
    /<div class="h-search h-search-live">\s*<div class="hs-inner">[\s\S]*?<\/div>\s*<button[^>]*>[\s\S]*?<\/button>\s*<\/div>/g,
    function (block) {
      const m = block.match(/placeholder="([^"]*)"/);
      const ph = m ? m[1] : '搜索…';
      changed = true;
      return unifiedSearch(ph);
    }
  );

  // 移除独立搜索按钮（已统一为圆角输入框）
  if (h.includes('btnGlobalSearch')) {
    h = h.replace(/\s*<button type="button" id="btnGlobalSearch">搜索<\/button>/g, '');
    changed = true;
  }

  if (!h.includes('global-search.js') && h.includes('h-search-unified')) {
    h = h.replace(
      /<script src="\.\.\/js-web\/global-search\.js"><\/script>\s*/g,
      ''
    );
    h = h.replace(
      /(<script src="\.\.\/js-web\/[^"]+\.js"><\/script>\s*)+<\/body>/,
      function (m) {
        if (m.includes('global-search.js')) return m;
        changed = true;
        return '<script src="../js-web/global-search.js"></script>\n' + m;
      }
    );
    if (!h.includes('global-search.js')) {
      h = h.replace('</body>', '<script src="../js-web/global-search.js"></script>\n</body>');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(path.join(dir, file), h);
    n++;
    console.log('patched', file);
  }
});

console.log('done', n, 'files');
