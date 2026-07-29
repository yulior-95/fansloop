/**
 * 运营后台 · 举报记录
 * 数据源：localStorage fl_content_report_logs_v1（与 C 端 content-report.js 共用）
 */
(function () {
  var M = window.AdminModal;
  var R = window.FL_ContentReport;
  var LOG_KEY = (R && R.LOG_KEY) || 'fl_content_report_logs_v1';

  var TYPE_LABEL = { video: '视频', image: '图文', live: '直播', content: '其他' };
  var STATUS_META = {
    pending: { text: '待处理', cls: 'ant-tag-orange' },
    handled: { text: '已处理', cls: 'ant-tag-green' },
    ignored: { text: '已忽略', cls: 'ant-tag-default' }
  };

  var DEMO = [
    {
      id: 'rpt-demo-1',
      contentId: 'p3',
      contentTitle: '雨夜小提琴现场 · 完整花絮',
      type: 'video',
      reason: 'plagiarism',
      reasonLabel: '搬运、抄袭作品',
      desc: '画面与某站同名视频高度重合，疑似搬运。',
      at: Date.now() - 36e5,
      status: 'pending',
      reporter: 'Luna',
      handledAt: null,
      handledNote: ''
    },
    {
      id: 'rpt-demo-2',
      contentId: 'p7',
      contentTitle: '京都樱花季组图',
      type: 'image',
      reason: 'spam',
      reasonLabel: '违规营销',
      desc: '正文含站外导流链接。',
      at: Date.now() - 86e5,
      status: 'handled',
      reporter: 'Neo',
      handledAt: Date.now() - 72e5,
      handledNote: '已下架并通知创作者'
    },
    {
      id: 'rpt-demo-3',
      contentId: 'live-yeyu',
      contentTitle: '夜雨听弦 · 周末爵士夜',
      type: 'live',
      reason: 'cyberbully',
      reasonLabel: '网络暴力',
      desc: '直播间有人组织辱骂刷屏。',
      at: Date.now() - 172e5,
      status: 'ignored',
      reporter: 'Aria',
      handledAt: Date.now() - 150e5,
      handledNote: '核实为偶发弹幕，已警告发言者'
    },
    {
      id: 'rpt-demo-4',
      contentId: 'ab-rec-2',
      contentTitle: 'Feed 推荐 · 创作定价 AMA',
      type: 'video',
      reason: 'ai',
      reasonLabel: 'AI生成内容问题',
      desc: '未标注 AI 生成，但口型与声线明显不一致。',
      at: Date.now() - 2e5,
      status: 'pending',
      reporter: '当前用户',
      handledAt: null,
      handledNote: ''
    }
  ];

  function esc(s) {
    return M && M.esc ? M.esc(String(s == null ? '' : s)) : String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function readLogs() {
    if (R && typeof R.getLogs === 'function') return R.getLogs();
    try {
      var raw = localStorage.getItem(LOG_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function writeLogs(list) {
    if (R && typeof R.saveLogs === 'function') {
      R.saveLogs(list);
      return;
    }
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify((list || []).slice(0, 200)));
    } catch (e) { /* ignore */ }
  }

  function fmtTime(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    var p = function (n) { return n < 10 ? '0' + n : String(n); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function normalize(row) {
    return {
      id: row.id || ('rpt-' + (row.at || Date.now())),
      contentId: row.contentId || '—',
      contentTitle: row.contentTitle || row.title || row.contentId || '未命名内容',
      type: row.type || 'content',
      reason: row.reason || '',
      reasonLabel: row.reasonLabel || (R && R.reasonLabelOf ? R.reasonLabelOf(row.reason) : row.reason) || '—',
      desc: row.desc || '',
      at: row.at || Date.now(),
      status: row.status || 'pending',
      reporter: row.reporter || '匿名用户',
      handledAt: row.handledAt || null,
      handledNote: row.handledNote || ''
    };
  }

  function filters() {
    return {
      type: (document.getElementById('crFilterType') || {}).value || '',
      status: (document.getElementById('crFilterStatus') || {}).value || '',
      reason: (document.getElementById('crFilterReason') || {}).value || '',
      kw: ((document.getElementById('crSearch') || {}).value || '').trim().toLowerCase()
    };
  }

  function filtered() {
    var f = filters();
    return readLogs().map(normalize).filter(function (row) {
      if (f.type && row.type !== f.type) return false;
      if (f.status && row.status !== f.status) return false;
      if (f.reason && row.reason !== f.reason) return false;
      if (f.kw) {
        var blob = (row.contentId + ' ' + row.contentTitle + ' ' + row.reporter + ' ' + row.desc).toLowerCase();
        if (blob.indexOf(f.kw) < 0) return false;
      }
      return true;
    }).sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
  }

  function renderKpi() {
    var all = readLogs().map(normalize);
    var pending = all.filter(function (r) { return r.status === 'pending'; }).length;
    var handled = all.filter(function (r) { return r.status === 'handled'; }).length;
    var ignored = all.filter(function (r) { return r.status === 'ignored'; }).length;
    var el = document.getElementById('crKpi');
    if (!el) return;
    el.innerHTML =
      '<div class="cr-kpi-card"><div class="lb">全部举报</div><div class="vl">' + all.length + '</div></div>' +
      '<div class="cr-kpi-card is-pending"><div class="lb">待处理</div><div class="vl">' + pending + '</div></div>' +
      '<div class="cr-kpi-card is-handled"><div class="lb">已处理</div><div class="vl">' + handled + '</div></div>' +
      '<div class="cr-kpi-card is-ignored"><div class="lb">已忽略</div><div class="vl">' + ignored + '</div></div>';
  }

  function statusHtml(status) {
    var meta = STATUS_META[status] || STATUS_META.pending;
    return '<span class="ant-tag ' + meta.cls + '">' + meta.text + '</span>';
  }

  function typeHtml(type) {
    return '<span class="cr-type-tag is-' + esc(type) + '">' + esc(TYPE_LABEL[type] || type) + '</span>';
  }

  function render() {
    var list = filtered();
    var body = document.getElementById('crBody');
    var empty = document.getElementById('crEmpty');
    if (!body) return;
    renderKpi();
    if (!list.length) {
      body.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    body.innerHTML = list.map(function (row) {
      var ops = '<button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-cr-act="view" data-id="' + esc(row.id) + '">详情</button>';
      if (row.status === 'pending') {
        ops +=
          '<button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-cr-act="handle" data-id="' + esc(row.id) + '">标记处理</button>' +
          '<button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-cr-act="ignore" data-id="' + esc(row.id) + '" style="color:#8c8c8c">忽略</button>';
      } else {
        ops += '<button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-cr-act="reopen" data-id="' + esc(row.id) + '">重新打开</button>';
      }
      return (
        '<tr data-id="' + esc(row.id) + '">' +
        '<td>' + esc(fmtTime(row.at)) + '</td>' +
        '<td>' + typeHtml(row.type) + '</td>' +
        '<td class="cr-content-cell"><div class="t">' + esc(row.contentTitle) + '</div>' +
        '<div class="id">' + esc(row.contentId) + '</div>' +
        (row.desc ? '<div class="cr-desc-preview">' + esc(row.desc) + '</div>' : '') +
        '</td>' +
        '<td>' + esc(row.reasonLabel) + '</td>' +
        '<td>' + esc(row.reporter) + '</td>' +
        '<td>' + statusHtml(row.status) + '</td>' +
        '<td>' + ops + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function findRow(id) {
    return readLogs().map(normalize).filter(function (r) { return r.id === id; })[0] || null;
  }

  function updateStatus(id, status, note) {
    var list = readLogs().map(normalize);
    var hit = false;
    list = list.map(function (row) {
      if (row.id !== id) return row;
      hit = true;
      row.status = status;
      row.handledAt = status === 'pending' ? null : Date.now();
      row.handledNote = note || '';
      return row;
    });
    if (!hit) return;
    writeLogs(list);
    render();
    if (M && M.toast) M.toast(status === 'pending' ? '已重新打开' : (status === 'handled' ? '已标记处理' : '已忽略'));
  }

  function openDetail(id) {
    var row = findRow(id);
    if (!row || !M) return;
    M.open({
      title: '举报详情 · ' + row.id,
      wide: true,
      body:
        '<table class="cr-detail-table">' +
        '<tr><td>提交时间</td><td>' + esc(fmtTime(row.at)) + '</td></tr>' +
        '<tr><td>类型</td><td>' + typeHtml(row.type) + '</td></tr>' +
        '<tr><td>内容标题</td><td><strong>' + esc(row.contentTitle) + '</strong></td></tr>' +
        '<tr><td>内容 ID</td><td><code>' + esc(row.contentId) + '</code></td></tr>' +
        '<tr><td>举报原因</td><td>' + esc(row.reasonLabel) + ' <span style="color:rgba(0,0,0,.35)">(' + esc(row.reason) + ')</span></td></tr>' +
        '<tr><td>举报描述</td><td class="cr-detail-desc">' + (row.desc ? esc(row.desc) : '（未填写）') + '</td></tr>' +
        '<tr><td>举报人</td><td>' + esc(row.reporter) + '</td></tr>' +
        '<tr><td>状态</td><td>' + statusHtml(row.status) + '</td></tr>' +
        '<tr><td>处理时间</td><td>' + esc(fmtTime(row.handledAt)) + '</td></tr>' +
        '<tr><td>处理备注</td><td class="cr-detail-desc">' + (row.handledNote ? esc(row.handledNote) : '—') + '</td></tr>' +
        '</table>',
      footer: [{ text: '关闭', primary: true, onClick: M.close }]
    });
  }

  function promptHandle(id, status) {
    if (!M) {
      updateStatus(id, status, '');
      return;
    }
    var title = status === 'handled' ? '标记已处理' : '忽略该举报';
    M.open({
      title: title,
      body:
        '<p style="margin:0 0 10px;font-size:13px;color:rgba(0,0,0,.55)">可选填写处理备注，便于复盘。</p>' +
        '<textarea class="ant-input" id="crHandleNote" rows="3" placeholder="例如：已下架 / 警告创作者 / 误报"></textarea>',
      footer: [
        { text: '取消', onClick: M.close },
        {
          text: '确认',
          primary: true,
          onClick: function () {
            var note = (document.getElementById('crHandleNote') || {}).value || '';
            M.close();
            updateStatus(id, status, note.trim());
          }
        }
      ]
    });
  }

  function seedDemo() {
    var existing = readLogs().map(normalize);
    var ids = {};
    existing.forEach(function (r) { ids[r.id] = true; });
    var merged = existing.slice();
    DEMO.forEach(function (d) {
      if (!ids[d.id]) merged.push(d);
    });
    writeLogs(merged);
    render();
    if (M && M.toast) M.toast('已注入演示数据');
  }

  function fillReasonOptions() {
    var sel = document.getElementById('crFilterReason');
    if (!sel) return;
    var reasons = (R && R.REASONS) || [
      { id: 'dislike', label: '我不喜欢' },
      { id: 'plagiarism', label: '搬运、抄袭作品' },
      { id: 'spam', label: '违规营销' },
      { id: 'cyberbully', label: '网络暴力' },
      { id: 'ai', label: 'AI生成内容问题' }
    ];
    sel.innerHTML = '<option value="">全部原因</option>' + reasons.map(function (r) {
      return '<option value="' + esc(r.id) + '">' + esc(r.label) + '</option>';
    }).join('');
  }

  document.getElementById('crBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cr-act]');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    var act = btn.getAttribute('data-cr-act');
    if (act === 'view') openDetail(id);
    else if (act === 'handle') promptHandle(id, 'handled');
    else if (act === 'ignore') promptHandle(id, 'ignored');
    else if (act === 'reopen') updateStatus(id, 'pending', '');
  });

  document.getElementById('crQuery').addEventListener('click', render);
  document.getElementById('crRefresh').addEventListener('click', render);
  document.getElementById('crSeed').addEventListener('click', seedDemo);
  document.getElementById('crReset').addEventListener('click', function () {
    document.getElementById('crFilterType').value = '';
    document.getElementById('crFilterStatus').value = '';
    document.getElementById('crFilterReason').value = '';
    document.getElementById('crSearch').value = '';
    render();
  });
  document.getElementById('crSearch').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') render();
  });

  fillReasonOptions();
  render();
})();
