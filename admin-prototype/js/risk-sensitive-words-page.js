/**
 * 敏感词管理页
 */
(function () {
  var M = window.AdminModal;
  var Store = window.FLChatSensitiveWordsStore;
  if (!M || !Store) return;

  var operator = 'limin';
  var tbody = document.getElementById('swTbody');
  var filterInput = document.getElementById('swFilterWord');
  var filterQ = '';

  function esc(s) {
    return M.esc(s == null ? '' : String(s));
  }

  function confirmDelete(body, onOk) {
    M.open({
      title: '确认删除',
      body: body,
      footer: [
        { text: '取消', onClick: M.close },
        { text: '确认删除', danger: true, onClick: function () { M.close(); onOk(); } }
      ]
    });
  }

  function devGlassHtml(tipId, label, title, bodyHtml) {
    return (
      '<span class="sw-dev-glass-wrap">' +
      '<span class="sw-dev-glass-sphere" tabindex="0" aria-describedby="' + tipId + '">' +
      '<span class="sw-dev-glass-shine"></span>' +
      '<span class="sw-dev-glass-txt">' + esc(label) + '</span></span>' +
      '<span class="sw-dev-glass-pop" id="' + tipId + '" role="tooltip">' +
      '<strong>' + esc(title) + '</strong>' + bodyHtml +
      '</span></span>'
    );
  }

  function scopeTagsHtml(scopes) {
    var labels = Store.scopeLabels(scopes);
    if (!labels.length) return '<span style="color:rgba(0,0,0,.35)">—</span>';
    return labels.map(function (lb) {
      return '<span class="ant-tag ant-tag-blue" style="margin:0 4px 4px 0">' + esc(lb) + '</span>';
    }).join('');
  }

  function scopeCheckboxesHtml(selected) {
    var sel = selected || Store.DEFAULT_SCOPES;
    return Object.keys(Store.SCOPES).map(function (key) {
      var s = Store.SCOPES[key];
      var checked = sel.indexOf(key) >= 0 ? ' checked' : '';
      return (
        '<label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px;cursor:pointer">' +
        '<input type="checkbox" class="sw-scope-cb" value="' + esc(key) + '"' + checked + '> ' + esc(s.label) +
        '</label>'
      );
    }).join('');
  }

  function readScopeSelection() {
    var boxes = document.querySelectorAll('.sw-scope-cb:checked');
    var scopes = [];
    boxes.forEach(function (b) { scopes.push(b.value); });
    return scopes;
  }

  function switchHtml(id, enabled) {
    var on = enabled !== false;
    return (
      '<button type="button" role="switch" class="ant-switch sw-row-switch' + (on ? ' ant-switch-checked' : '') + '"' +
      ' data-id="' + esc(id) + '" aria-checked="' + (on ? 'true' : 'false') + '" aria-label="' + (on ? '开启' : '关闭') + '">' +
      '<div class="ant-switch-handle"></div></button>'
    );
  }

  function mountDevGlass() {
    var bar = document.getElementById('swDevGlass');
    if (!bar) return;
    bar.innerHTML =
      '<span style="font-size:12px;font-weight:600;color:#531dab;white-space:nowrap"><i class="fa-solid fa-flask"></i> To 研发</span>' +
      devGlassHtml('swDevTip', '规则', '敏感词 · 研发说明',
        '<p style="margin:0 0 8px"><b>适用范围</b>：即时聊天、直播互动、内容发布、资料类，支持多选；未选场景不命中该词。</p>' +
        '<p style="margin:0 0 8px"><b>处置</b>：IM / 直播 → <code>processOutgoing(scene)</code> 整段脱敏；内容 / 资料 → <code>blocked: true</code> 拦截。</p>' +
        '<p style="margin:0 0 8px"><b>去重</b>：保存时忽略大小写与词内空白差异。</p>' +
        '<p style="margin:0">命中记录写入 <code>FLSensitiveRiskStore</code>，阶梯风控见「敏感词风控管理」。存储键 <code>' + esc(Store.KEY) + '</code>。</p>');
  }

  function filteredRows() {
    var q = filterQ.toLowerCase();
    return Store.read().words.filter(function (row) {
      if (!q) return true;
      return String(row.word || '').toLowerCase().indexOf(q) >= 0;
    });
  }

  function renderTable() {
    if (!tbody) return;
    var rows = filteredRows();
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">暂无数据</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (row) {
      return (
        '<tr data-id="' + esc(row.id) + '">' +
        '<td><strong>' + esc(row.word) + '</strong></td>' +
        '<td>' + scopeTagsHtml(row.scopes) + '</td>' +
        '<td>' + switchHtml(row.id, row.enabled) + '</td>' +
        '<td>' + esc(row.createdAt) + '</td>' +
        '<td>' + esc(row.updatedAt) + '</td>' +
        '<td>' + esc(row.updatedBy || '—') + '</td>' +
        '<td>' +
        '<button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-act="edit" data-id="' + esc(row.id) + '">编辑</button>' +
        '<button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-act="del" data-id="' + esc(row.id) + '" style="color:#ff4d4f">删除</button>' +
        '</td></tr>'
      );
    }).join('');
  }

  function openForm(editId) {
    var row = editId ? Store.read().words.find(function (r) { return r.id === editId; }) : null;
    M.open({
      title: editId ? '编辑敏感词' : '新增敏感词',
      body:
        '<p style="margin:0 0 12px;font-size:12px;color:rgba(0,0,0,.45)">请至少选择一个适用范围；保存时自动去重。</p>' +
        '<label style="display:block;margin-bottom:6px">敏感词 <span style="color:#ff4d4f">*</span></label>' +
        '<input class="ant-input" id="swFldWord" style="width:100%;max-width:360px;margin-bottom:16px" placeholder="如：微信" value="' + esc(row ? row.word : '') + '">' +
        '<label style="display:block;margin-bottom:8px;font-weight:600">适用范围 <span style="color:#ff4d4f">*</span></label>' +
        '<div style="margin-bottom:16px">' + scopeCheckboxesHtml(row ? row.scopes : null) + '</div>' +
        '<label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">' +
        '<input type="checkbox" id="swFldEnabled"' + (row && row.enabled === false ? '' : ' checked') + '> 是否开启</label>',
      footer: [
        { text: '取消', onClick: M.close },
        {
          text: editId ? '保存' : '添加',
          primary: true,
          onClick: function () {
            var word = document.getElementById('swFldWord').value;
            var enabled = document.getElementById('swFldEnabled').checked;
            var scopes = readScopeSelection();
            var res;
            if (editId) {
              res = Store.updateWord(editId, { word: word, enabled: enabled, scopes: scopes }, operator);
            } else {
              res = Store.addWord(word, operator, scopes);
              if (res.ok && !enabled) {
                Store.updateWord(res.row.id, { enabled: false }, operator);
              }
            }
            if (!res.ok) {
              M.toast(res.message);
              return;
            }
            M.close();
            M.toast(editId ? '已保存' : '已添加');
            renderTable();
          }
        }
      ]
    });
  }

  document.getElementById('btnSwNew').addEventListener('click', function () { openForm(null); });

  document.getElementById('btnSwSearch').addEventListener('click', function () {
    filterQ = (filterInput && filterInput.value || '').trim();
    renderTable();
  });

  document.getElementById('btnSwReset').addEventListener('click', function () {
    if (filterInput) filterInput.value = '';
    filterQ = '';
    renderTable();
  });

  if (tbody) {
    tbody.addEventListener('click', function (e) {
      var sw = e.target.closest('.sw-row-switch');
      if (sw) {
        e.preventDefault();
        var sid = sw.getAttribute('data-id');
        var srow = Store.read().words.find(function (r) { return r.id === sid; });
        if (!srow) return;
        var nextOn = srow.enabled === false;
        Store.updateWord(sid, { enabled: nextOn }, operator);
        M.toast(nextOn ? '已开启' : '已关闭');
        renderTable();
        return;
      }
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      var act = btn.getAttribute('data-act');
      var row = Store.read().words.find(function (r) { return r.id === id; });
      if (act === 'edit') openForm(id);
      else if (act === 'del') {
        confirmDelete(
          '<p style="margin:0">确认删除敏感词 <strong>' + esc(row ? row.word : '') + '</strong>？删除后用户端即时生效。</p>',
          function () {
            Store.removeWord(id);
            M.toast('已删除');
            renderTable();
          }
        );
      }
    });
  }

  mountDevGlass();
  renderTable();
})();
