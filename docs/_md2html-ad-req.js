const fs = require('fs');
const mdPath = require('path').join(__dirname, 'ad-system-requirements.md');
const outPath = require('path').join(__dirname, 'ad-system-requirements.html');
const md = fs.readFileSync(mdPath, 'utf8');

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inline(s) {
  let t = esc(s);
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#fff">$1</strong>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return t;
}

function slugify(text) {
  return (
    text
      .replace(/[^\w\u4e00-\u9fff\-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'sec'
  );
}

const lines = md.replace(/\r\n/g, '\n').split('\n');
const toc = [];
const html = [];
let i = 0;
let inCode = false;
let codeLang = '';
let codeBuf = [];
let inTable = false;
let tableRows = [];
let listType = null;

function flushList() {
  if (!listType) return;
  html.push('</' + listType + '>');
  listType = null;
}

function flushTable() {
  if (!inTable) return;
  const rows = tableRows.slice();
  inTable = false;
  tableRows = [];
  if (!rows.length) return;
  const parseRow = (row) =>
    row
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());
  const head = parseRow(rows[0]);
  html.push(
    '<table><thead><tr>' +
      head.map((c) => '<th>' + inline(c) + '</th>').join('') +
      '</tr></thead><tbody>'
  );
  for (let r = 1; r < rows.length; r++) {
    const cells = parseRow(rows[r]);
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
    html.push(
      '<tr>' + cells.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>'
    );
  }
  html.push('</tbody></table>');
}

while (i < lines.length) {
  const line = lines[i];

  if (inCode) {
    if (line.trim().startsWith('```')) {
      const body = codeBuf.join('\n');
      if (codeLang === 'mermaid') {
        html.push('<pre class="mermaid-block">' + esc(body) + '</pre>');
        html.push(
          '<p style="font-size:12px;color:rgba(255,255,255,.45)">（Mermaid 源码；正式渲染可接 mermaid.js）</p>'
        );
      } else {
        html.push('<pre>' + esc(body) + '</pre>');
      }
      inCode = false;
      codeBuf = [];
      codeLang = '';
    } else {
      codeBuf.push(line);
    }
    i++;
    continue;
  }

  if (line.trim().startsWith('```')) {
    flushList();
    flushTable();
    inCode = true;
    codeLang = line.trim().slice(3).trim();
    codeBuf = [];
    i++;
    continue;
  }

  if (line.trim().startsWith('|')) {
    flushList();
    if (!inTable) {
      inTable = true;
      tableRows = [];
    }
    tableRows.push(line);
    i++;
    continue;
  } else if (inTable) {
    flushTable();
  }

  if (/^---\s*$/.test(line)) {
    flushList();
    i++;
    continue;
  }

  const h = line.match(/^(#{1,4})\s+(.+)$/);
  if (h) {
    flushList();
    const level = h[1].length;
    const raw = h[2].trim();
    const id = 's' + (toc.length + 1) + '-' + slugify(raw).slice(0, 48);
    if (level === 1) {
      // document title handled in page header
    } else if (level === 2) {
      toc.push({ id, text: raw, level });
      html.push('<h2 id="' + id + '">' + inline(raw) + '</h2>');
    } else if (level === 3) {
      toc.push({ id, text: raw, level });
      html.push('<h3 id="' + id + '">' + inline(raw) + '</h3>');
    } else {
      toc.push({ id, text: raw, level });
      html.push(
        '<h3 id="' +
          id +
          '" style="font-size:13.5px;color:#fde68a">' +
          inline(raw) +
          '</h3>'
      );
    }
    i++;
    continue;
  }

  const bq = line.match(/^>\s?(.*)$/);
  if (bq) {
    flushList();
    const parts = [bq[1]];
    while (i + 1 < lines.length && /^>\s?/.test(lines[i + 1])) {
      i++;
      parts.push(lines[i].replace(/^>\s?/, ''));
    }
    html.push('<blockquote>' + parts.map(inline).join('<br>') + '</blockquote>');
    i++;
    continue;
  }

  const ul = line.match(/^[-*]\s+(.+)$/);
  if (ul) {
    if (listType !== 'ul') {
      flushList();
      listType = 'ul';
      html.push('<ul>');
    }
    html.push('<li>' + inline(ul[1]) + '</li>');
    i++;
    continue;
  }

  const ol = line.match(/^\d+\.\s+(.+)$/);
  if (ol) {
    if (listType !== 'ol') {
      flushList();
      listType = 'ol';
      html.push('<ol>');
    }
    html.push('<li>' + inline(ol[1]) + '</li>');
    i++;
    continue;
  }

  if (!line.trim()) {
    flushList();
    i++;
    continue;
  }

  flushList();

  if (/^\\\[/.test(line.trim()) || /R_\{max\}/.test(line) || /D_\{\\mathrm/.test(line)) {
    const block = [line];
    while (i + 1 < lines.length) {
      const n = lines[i + 1];
      if (!n.trim()) break;
      if (/^#{1,4}\s/.test(n) || n.trim().startsWith('|') || n.trim().startsWith('```')) break;
      if (
        /^\\\]/.test(n.trim()) ||
        /R_|\\times|\\Bigl|\\mathrm|D_\{\\mathrm|^\s*\$/.test(n) ||
        /^\\\[/.test(block[0].trim())
      ) {
        i++;
        block.push(n);
        if (/^\\\]/.test(n.trim())) break;
        continue;
      }
      break;
    }
    html.push('<pre>' + esc(block.join('\n')) + '</pre>');
    i++;
    continue;
  }

  html.push('<p>' + inline(line) + '</p>');
  i++;
}

flushList();
flushTable();

const tocHtml = toc
  .filter((t) => t.level <= 3)
  .map((t) => {
    const pad = t.level === 3 ? ' style="margin-left:12px"' : '';
    return '<li' + pad + '><a href="#' + t.id + '">' + esc(t.text) + '</a></li>';
  })
  .join('\n');

const page = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>广告系统一期 · 需求说明（完整版）· GOODFANS</title>
<style>
:root {
    --bg: #0f0f17; --card: #1a1a28; --border: rgba(255,255,255,0.1);
    --text: rgba(255,255,255,0.92); --muted: rgba(255,255,255,0.55); --accent: #f59e0b;
    --code-bg: rgba(255,255,255,0.06);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif; background: var(--bg); color: var(--text); line-height: 1.65; padding: 32px 20px 80px; }
.wrap { max-width: 960px; margin: 0 auto; }
header { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
header h1 { font-size: 26px; font-weight: 800; }
header p { color: var(--muted); margin-top: 8px; font-size: 14px; }
.badge { display: inline-block; margin-top: 10px; padding: 4px 10px; border-radius: 999px; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.35); color: #fde68a; font-size: 12px; font-weight: 600; margin-right: 8px; }
.badge-h5 { background: rgba(34,197,94,0.12); border-color: rgba(34,197,94,0.35); color: #86efac; }
.badge-web { background: rgba(59,130,246,0.12); border-color: rgba(59,130,246,0.35); color: #93c5fd; }
.badge-admin { background: rgba(168,85,247,0.15); border-color: rgba(168,85,247,0.35); color: #c4b5fd; }
.toc { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 16px 18px; margin-bottom: 24px; max-height: 420px; overflow: auto; }
.toc h2 { font-size: 14px; margin: 0 0 10px; }
.toc ol { margin: 0 0 0 18px; font-size: 13px; color: var(--muted); }
.toc li { margin: 4px 0; }
.toc a { color: var(--text); text-decoration: none; }
.toc a:hover { color: #fde68a; }
article h2 { font-size: 19px; font-weight: 700; margin: 36px 0 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
article h3 { font-size: 15px; font-weight: 700; margin: 20px 0 10px; color: #fde68a; }
article p, article li { font-size: 14px; color: var(--muted); }
article ul, article ol { margin: 10px 0 10px 22px; }
article li { margin: 6px 0; }
article table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px; }
article th, article td { border: 1px solid var(--border); padding: 9px 11px; text-align: left; vertical-align: top; }
article th { background: var(--card); color: var(--text); }
article tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
article code { font-family: ui-monospace, Consolas, monospace; font-size: 12px; background: var(--code-bg); padding: 2px 6px; border-radius: 4px; color: #fde68a; }
article pre { font-family: ui-monospace, Consolas, monospace; font-size: 11.5px; background: var(--code-bg); padding: 14px 16px; border-radius: 8px; overflow-x: auto; margin: 12px 0; color: #e9d5ff; line-height: 1.45; border: 1px solid var(--border); white-space: pre; }
article a { color: #93c5fd; }
article blockquote { margin: 14px 0; padding: 12px 16px; border-left: 3px solid var(--accent); background: rgba(245,158,11,0.08); color: var(--muted); font-size: 13.5px; border-radius: 0 8px 8px 0; }
article strong { color: #fff; }
footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid var(--border); color: var(--muted); font-size: 12px; }
</style>
</head>
<body>
<div class="wrap">
<header>
    <h1>广告系统一期 · 需求说明（完整版）</h1>
    <p>由 <a href="ad-system-requirements.md">ad-system-requirements.md</a> 全量导出。摘要版：<a href="guanggao.html">guanggao.html</a></p>
    <blockquote style="margin-top:14px">
        数据：<code>localStorage</code> 键 <code>fl_ad_system_v2</code>（重置：<code>localStorage.removeItem('fl_ad_system_v2')</code>）<br>
        脚本：<a href="../js/ad-system-store.js">js/ad-system-store.js</a>（模型）· <a href="../js/ad-system-api.js">js/ad-system-api.js</a>（规则）· <a href="../js/ad-system-user.js">js/ad-system-user.js</a>（用户端 UI）
    </blockquote>
    <span class="badge">广告系统</span>
    <span class="badge badge-admin">后台</span>
    <span class="badge badge-h5">H5</span>
    <span class="badge badge-web">WEB</span>
</header>
<nav class="toc">
    <h2>目录</h2>
    <ol>
${tocHtml}
    </ol>
</nav>
<article>
${html.join('\n')}
</article>
<footer>
    与 Markdown 源保持同步。匹配投放算法见 §7.3.1 / §7.7。研发阅读建议用本 HTML 全文版。重新导出：<code>node docs/_md2html-ad-req.js</code>
</footer>
</div>
</body>
</html>
`;

fs.writeFileSync(outPath, page, 'utf8');
console.log('Wrote', outPath, 'bytes', fs.statSync(outPath).size, 'toc', toc.length);
