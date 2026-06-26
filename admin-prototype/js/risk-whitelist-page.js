/**
 * 会员白名单页 · 四 Tab 列表与弹窗 CRUD
 */
(function () {
  var M = window.AdminModal;
  var Store = window.FLRiskWhitelistStore;
  if (!M || !Store) return;

  var operator = 'limin';
  var panels = ['tEmail', 'tFee', 'tLive', 'tContent'];
  var state = {
    tEmail: { filter: '', page: 1, pageSize: 10 },
    tFee: { filterUid: '', filterScope: '', page: 1, pageSize: 10 },
    tLive: { filterUid: '', page: 1, pageSize: 10 },
    tContent: { filterUid: '', page: 1, pageSize: 10 }
  };
  var pagers = {};

  function esc(s) {
    return M.esc(s == null ? '' : String(s));
  }

  function hasPerm(id) {
    var Rbac = window.AdminRbac;
    var role = window.FLAdminSession ? FLAdminSession.getRole() : 'ROLE_ROOT';
    if (!Rbac || !Rbac.ROLE_DEFAULT_PERMS) return true;
    var perms = Rbac.ROLE_DEFAULT_PERMS[role];
    if (perms == null) return true;
    return perms.indexOf(id) >= 0;
  }

  function applyPermissions() {
    document.querySelectorAll('[data-perm]').forEach(function (el) {
      var ok = hasPerm(el.getAttribute('data-perm'));
      if (ok) el.removeAttribute('data-perm-hidden');
      else el.setAttribute('data-perm-hidden', '1');
    });
  }

  function confirmDelete(title, body, onOk) {
    M.open({
      title: title || '确认删除',
      body: body,
      footer: [
        { text: '取消', onClick: M.close },
        {
          text: '确认删除',
          danger: true,
          onClick: function () {
            M.close();
            onOk();
          }
        }
      ]
    });
  }

  function initTabs() {
    var bar = document.getElementById('wlTabs');
    if (!bar) return;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-tab]');
      if (!b) return;
      var id = b.getAttribute('data-tab');
      bar.querySelectorAll('button').forEach(function (x) {
        x.classList.toggle('active', x === b);
      });
      panels.forEach(function (pid) {
        var p = document.getElementById(pid);
        if (p) p.classList.toggle('active', p.id === id);
      });
    });
  }

  function devGlassHtml(tipId, label, title, bodyHtml) {
    return (
      '<span class="wl-dev-glass-wrap">' +
      '<span class="wl-dev-glass-sphere" tabindex="0" aria-describedby="' + tipId + '">' +
      '<span class="wl-dev-glass-shine"></span>' +
      '<span class="wl-dev-glass-txt">' + esc(label) + '</span></span>' +
      '<span class="wl-dev-glass-pop" id="' + tipId + '" role="tooltip">' +
      '<strong>' + esc(title) + '</strong>' + bodyHtml +
      '</span></span>'
    );
  }

  function slicePage(list, page, pageSize) {
    var total = list.length;
    var tp = Math.max(1, Math.ceil(total / pageSize) || 1);
    var p = page;
    if (p < 1) p = 1;
    if (p > tp) p = tp;
    var start = (p - 1) * pageSize;
    return { rows: list.slice(start, start + pageSize), total: total, page: p, totalPages: tp };
  }

  function ensurePager(key, mountId, onChange) {
    if (pagers[key]) return pagers[key];
    var mount = document.getElementById(mountId);
    if (!mount || !window.AdminPager) return null;
    pagers[key] = AdminPager.create({
      mount: mount,
      pageSize: state[key].pageSize,
      onChange: function (page, size) {
        state[key].page = page;
        state[key].pageSize = size;
        onChange();
      }
    });
    return pagers[key];
  }

  function actionBtn(text, cls, attrs) {
    return '<button type="button" class="ant-btn ant-btn-link ant-btn-sm ' + (cls || '') + '" ' + (attrs || '') + '>' + text + '</button>';
  }

  /* ── 邮箱白名单 ── */
  function filterEmailRows() {
    var q = state.tEmail.filter.toLowerCase();
    var rows = Store.read().emailSuffixes.slice();
    if (q) {
      rows = rows.filter(function (r) {
        return String(r.suffix || '').toLowerCase().indexOf(q) >= 0 ||
          String(r.remark || '').toLowerCase().indexOf(q) >= 0;
      });
    }
    return rows;
  }

  function renderEmailTable() {
    var tbody = document.getElementById('emailTbody');
    if (!tbody) return;
    var filtered = filterEmailRows();
    var pg = slicePage(filtered, state.tEmail.page, state.tEmail.pageSize);
    state.tEmail.page = pg.page;
    if (!pg.rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">暂无数据</td></tr>';
    } else {
      tbody.innerHTML = pg.rows.map(function (row, i) {
        var seq = (pg.page - 1) * state.tEmail.pageSize + i + 1;
        return (
          '<tr data-id="' + esc(row.id) + '">' +
          '<td>' + seq + '</td>' +
          '<td><code>' + esc(row.suffix) + '</code></td>' +
          '<td>' + esc(row.createdAt) + '</td>' +
          '<td>' + esc(row.remark || '—') + '</td>' +
          '<td>' +
          actionBtn('编辑', '', 'data-perm="risk-wl-email-edit" data-act="email-edit" data-id="' + esc(row.id) + '"') +
          actionBtn('删除', 'js-wl-del', 'data-perm="risk-wl-email-delete" data-act="email-del" data-id="' + esc(row.id) + '" style="color:#ff4d4f"') +
          '</td></tr>'
        );
      }).join('');
    }
    var pager = ensurePager('tEmail', 'emailPager', renderEmailTable);
    if (pager) pager.setTotal(pg.total);
    applyPermissions();
  }

  function openEmailForm(editId) {
    var row = null;
    if (editId) {
      row = Store.read().emailSuffixes.find(function (r) { return r.id === editId; });
      if (!row) return;
    }
    M.open({
      title: editId ? '编辑邮箱后缀' : '添加邮箱后缀',
      body:
        '<p style="margin:0 0 12px;font-size:12px;color:rgba(0,0,0,.45)">仅后缀可编辑；保存时自动去重（如 gmail.com → @gmail.com）。</p>' +
        '<label style="display:block;margin-bottom:6px">邮箱后缀 <span style="color:#ff4d4f">*</span></label>' +
        '<input class="ant-input" id="wlEmailSuffix" style="width:100%;max-width:360px;margin-bottom:12px" placeholder="如 @gmail.com" value="' + esc(row ? row.suffix : '') + '">' +
        '<label style="display:block;margin-bottom:6px">备注</label>' +
        '<input class="ant-input" id="wlEmailRemark" style="width:100%;max-width:360px" placeholder="选填" value="' + esc(row ? row.remark : '') + '">',
      footer: [
        { text: '取消', onClick: M.close },
        {
          text: editId ? '保存' : '添加',
          primary: true,
          onClick: function () {
            var suffix = document.getElementById('wlEmailSuffix').value;
            var remark = document.getElementById('wlEmailRemark').value;
            var res = editId
              ? Store.updateEmailSuffix(editId, suffix, remark)
              : Store.addEmailSuffix(suffix, remark, operator);
            if (!res.ok) {
              M.toast(res.message);
              return;
            }
            M.close();
            M.toast(editId ? '已保存' : '已添加');
            renderEmailTable();
          }
        }
      ]
    });
  }

  /* ── 手续费白名单 ── */
  function filterFeeRows() {
    var uidQ = state.tFee.filterUid;
    var scopeQ = state.tFee.filterScope;
    return Store.read().feeWhitelist.filter(function (r) {
      if (uidQ && String(r.uid).indexOf(uidQ) < 0) return false;
      if (scopeQ && (!r.scopes || r.scopes.indexOf(scopeQ) < 0)) return false;
      return true;
    });
  }

  function scopeTags(scopes) {
    return (scopes || []).map(function (s) {
      return '<span class="ant-tag ant-tag-blue wl-scope-tag">' + esc(Store.scopeLabel(s)) + '</span>';
    }).join('');
  }

  function renderFeeTable() {
    var tbody = document.getElementById('feeTbody');
    if (!tbody) return;
    var filtered = filterFeeRows();
    var pg = slicePage(filtered, state.tFee.page, state.tFee.pageSize);
    state.tFee.page = pg.page;
    if (!pg.rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">暂无数据</td></tr>';
    } else {
      tbody.innerHTML = pg.rows.map(function (row, i) {
        var seq = (pg.page - 1) * state.tFee.pageSize + i + 1;
        return (
          '<tr data-id="' + esc(row.id) + '">' +
          '<td>' + seq + '</td>' +
          '<td>' + esc(row.uid) + '</td>' +
          '<td>' + esc(row.nickname || '—') + '</td>' +
          '<td>' + scopeTags(row.scopes) + '</td>' +
          '<td>' + esc(row.createdBy) + '</td>' +
          '<td>' + esc(row.createdAt) + '</td>' +
          '<td>' + esc(row.remark || '—') + '</td>' +
          '<td>' +
          actionBtn('编辑', '', 'data-perm="risk-wl-fee-edit" data-act="fee-edit" data-id="' + esc(row.id) + '"') +
          actionBtn('删除', '', 'data-perm="risk-wl-fee-delete" data-act="fee-del" data-id="' + esc(row.id) + '" style="color:#ff4d4f"') +
          '</td></tr>'
        );
      }).join('');
    }
    var pager = ensurePager('tFee', 'feePager', renderFeeTable);
    if (pager) pager.setTotal(pg.total);
    applyPermissions();
  }

  function feeScopeFields(scopes, readonlyUid) {
    var checked = function (s) { return scopes && scopes.indexOf(s) >= 0 ? ' checked' : ''; };
    return (
      '<div class="wl-modal-scopes">' +
      '<label><input type="checkbox" value="recharge"' + checked('recharge') + '> 充值</label>' +
      '<label><input type="checkbox" value="withdraw"' + checked('withdraw') + '> 提现</label>' +
      '<p style="margin:8px 0 0;font-size:11px;color:rgba(0,0,0,.45)">后续若有其他消耗手续费场景，在此同步扩展选项。</p>' +
      '</div>' +
      (readonlyUid ? '' :
        '<label style="display:block;margin:12px 0 6px">用户 UID <span style="color:#ff4d4f">*</span></label>' +
        '<input class="ant-input" id="wlFeeUid" style="width:100%;max-width:320px;margin-bottom:12px" placeholder="数字 UID">' +
        '<label style="display:block;margin-bottom:6px">用户昵称</label>' +
        '<input class="ant-input" id="wlFeeNick" style="width:100%;max-width:320px;margin-bottom:12px" placeholder="选填">')
    );
  }

  function readFeeScopes() {
    var scopes = [];
    document.querySelectorAll('.wl-modal-scopes input[type=checkbox]:checked').forEach(function (cb) {
      scopes.push(cb.value);
    });
    return scopes;
  }

  function openFeeForm(editId) {
    var row = editId ? Store.read().feeWhitelist.find(function (r) { return r.id === editId; }) : null;
    M.open({
      title: editId ? '编辑手续费白名单' : '添加手续费白名单',
      body:
        (editId
          ? '<p style="margin:0 0 12px;font-size:12px;color:rgba(0,0,0,.45)">UID：' + esc(row.uid) + ' · ' + esc(row.nickname) + '（不可改 UID）</p>'
          : '') +
        feeScopeFields(row ? row.scopes : ['recharge'], !!editId) +
        '<label style="display:block;margin-bottom:6px">备注</label>' +
        '<input class="ant-input" id="wlFeeRemark" style="width:100%;max-width:360px" value="' + esc(row ? row.remark : '') + '">',
      footer: [
        { text: '取消', onClick: M.close },
        {
          text: editId ? '保存' : '添加',
          primary: true,
          onClick: function () {
            var scopes = readFeeScopes();
            var remark = document.getElementById('wlFeeRemark').value;
            var res;
            if (editId) {
              res = Store.updateFeeEntry(editId, { scopes: scopes, remark: remark });
            } else {
              res = Store.addFeeEntry({
                uid: document.getElementById('wlFeeUid').value,
                nickname: document.getElementById('wlFeeNick').value,
                scopes: scopes,
                remark: remark,
                createdBy: operator
              });
            }
            if (!res.ok) {
              M.toast(res.message);
              return;
            }
            M.close();
            M.toast(editId ? '已保存' : '已添加');
            renderFeeTable();
          }
        }
      ]
    });
  }

  /* ── UID 白名单（直播 / 内容） ── */
  function renderUidTable(listKey, tbodyId, pagerKey, pagerMountId, filterUid, rowHtmlFn, refreshFn) {
    var tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    var rows = Store.read()[listKey].filter(function (r) {
      return !filterUid || String(r.uid).indexOf(filterUid) >= 0;
    });
    var st = state[pagerKey];
    var pg = slicePage(rows, st.page, st.pageSize);
    st.page = pg.page;
    if (!pg.rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">暂无数据</td></tr>';
    } else {
      tbody.innerHTML = pg.rows.map(function (row, i) {
        var seq = (pg.page - 1) * st.pageSize + i + 1;
        return rowHtmlFn(row, seq);
      }).join('');
    }
    var pager = ensurePager(pagerKey, pagerMountId, refreshFn);
    if (pager) pager.setTotal(pg.total);
    applyPermissions();
  }

  function renderLiveTable() {
    renderUidTable('liveWhitelist', 'liveTbody', 'tLive', 'livePager', state.tLive.filterUid, function (row, seq) {
      return (
        '<tr data-id="' + esc(row.id) + '">' +
        '<td>' + seq + '</td>' +
        '<td>' + esc(row.uid) + '</td>' +
        '<td>' + esc(row.createdBy) + '</td>' +
        '<td>' + esc(row.createdAt) + '</td>' +
        '<td>' + actionBtn('删除', '', 'data-perm="risk-wl-live-delete" data-act="live-del" data-id="' + esc(row.id) + '" style="color:#ff4d4f"') + '</td>' +
        '</tr>'
      );
    }, renderLiveTable);
  }

  function renderContentTable() {
    renderUidTable('contentWhitelist', 'contentTbody', 'tContent', 'contentPager', state.tContent.filterUid, function (row, seq) {
      return (
        '<tr data-id="' + esc(row.id) + '">' +
        '<td>' + seq + '</td>' +
        '<td>' + esc(row.uid) + '</td>' +
        '<td>' + esc(row.createdBy) + '</td>' +
        '<td>' + esc(row.createdAt) + '</td>' +
        '<td>' + actionBtn('删除', '', 'data-perm="risk-wl-content-delete" data-act="content-del" data-id="' + esc(row.id) + '" style="color:#ff4d4f"') + '</td>' +
        '</tr>'
      );
    }, renderContentTable);
  }

  function openUidAdd(kind) {
    var isLive = kind === 'live';
    M.open({
      title: isLive ? '添加付费直播观看白名单' : '添加付费内容观看白名单',
      body:
        '<label style="display:block;margin-bottom:6px">用户 UID <span style="color:#ff4d4f">*</span></label>' +
        '<input class="ant-input" id="wlUidInput" style="width:100%;max-width:320px" placeholder="数字 UID">' +
        '<p style="margin:12px 0 0;font-size:12px;color:rgba(0,0,0,.45)">加入后，该用户在前端可直接解锁' + (isLive ? '付费直播' : '付费内容') + '，无需再走付费流程。</p>',
      footer: [
        { text: '取消', onClick: M.close },
        {
          text: '添加',
          primary: true,
          onClick: function () {
            var uidVal = document.getElementById('wlUidInput').value;
            var res = isLive ? Store.addLiveEntry(uidVal, operator) : Store.addContentEntry(uidVal, operator);
            if (!res.ok) {
              M.toast(res.message);
              return;
            }
            M.close();
            M.toast('已添加');
            if (isLive) renderLiveTable();
            else renderContentTable();
          }
        }
      ]
    });
  }

  function bindFilters() {
    document.getElementById('btnEmailSearch').addEventListener('click', function () {
      state.tEmail.filter = (document.getElementById('emailFilterSuffix').value || '').trim();
      state.tEmail.page = 1;
      renderEmailTable();
    });
    document.getElementById('btnEmailReset').addEventListener('click', function () {
      document.getElementById('emailFilterSuffix').value = '';
      state.tEmail.filter = '';
      state.tEmail.page = 1;
      renderEmailTable();
    });
    document.getElementById('btnFeeSearch').addEventListener('click', function () {
      state.tFee.filterUid = (document.getElementById('feeFilterUid').value || '').trim();
      state.tFee.filterScope = document.getElementById('feeFilterScope').value;
      state.tFee.page = 1;
      renderFeeTable();
    });
    document.getElementById('btnFeeReset').addEventListener('click', function () {
      document.getElementById('feeFilterUid').value = '';
      document.getElementById('feeFilterScope').value = '';
      state.tFee.filterUid = '';
      state.tFee.filterScope = '';
      state.tFee.page = 1;
      renderFeeTable();
    });
    document.getElementById('btnLiveSearch').addEventListener('click', function () {
      state.tLive.filterUid = (document.getElementById('liveFilterUid').value || '').trim();
      state.tLive.page = 1;
      renderLiveTable();
    });
    document.getElementById('btnLiveReset').addEventListener('click', function () {
      document.getElementById('liveFilterUid').value = '';
      state.tLive.filterUid = '';
      state.tLive.page = 1;
      renderLiveTable();
    });
    document.getElementById('btnContentSearch').addEventListener('click', function () {
      state.tContent.filterUid = (document.getElementById('contentFilterUid').value || '').trim();
      state.tContent.page = 1;
      renderContentTable();
    });
    document.getElementById('btnContentReset').addEventListener('click', function () {
      document.getElementById('contentFilterUid').value = '';
      state.tContent.filterUid = '';
      state.tContent.page = 1;
      renderContentTable();
    });
  }

  function bindToolbar() {
    document.getElementById('btnEmailAdd').addEventListener('click', function () { openEmailForm(null); });
    document.getElementById('btnFeeAdd').addEventListener('click', function () { openFeeForm(null); });
    document.getElementById('btnLiveAdd').addEventListener('click', function () { openUidAdd('live'); });
    document.getElementById('btnContentAdd').addEventListener('click', function () { openUidAdd('content'); });
  }

  function bindTableActions() {
    document.querySelector('main.admin-content').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn || btn.getAttribute('data-perm-hidden') === '1') return;
      var act = btn.getAttribute('data-act');
      var id = btn.getAttribute('data-id');
      if (act === 'email-edit') openEmailForm(id);
      else if (act === 'email-del') {
        var emRow = Store.read().emailSuffixes.find(function (r) { return r.id === id; });
        confirmDelete('确认删除邮箱后缀', '<p style="margin:0">确认删除后缀 <strong>' + esc(emRow ? emRow.suffix : '') + '</strong>？删除后该后缀邮箱将无法注册。</p>', function () {
          Store.removeEmailSuffix(id);
          M.toast('已删除');
          renderEmailTable();
        });
      } else if (act === 'fee-edit') openFeeForm(id);
      else if (act === 'fee-del') {
        var feeRow = Store.read().feeWhitelist.find(function (r) { return r.id === id; });
        confirmDelete('确认删除', '<p style="margin:0">确认将 UID <strong>' + esc(feeRow ? feeRow.uid : '') + '</strong> 从手续费白名单移除？</p>', function () {
          Store.removeFeeEntry(id);
          M.toast('已删除');
          renderFeeTable();
        });
      } else if (act === 'live-del') {
        var liveRow = Store.read().liveWhitelist.find(function (r) { return r.id === id; });
        confirmDelete('确认删除', '<p style="margin:0">确认将 UID <strong>' + esc(liveRow ? liveRow.uid : '') + '</strong> 从付费直播观看白名单移除？</p>', function () {
          Store.removeLiveEntry(id);
          M.toast('已删除');
          renderLiveTable();
        });
      } else if (act === 'content-del') {
        var cntRow = Store.read().contentWhitelist.find(function (r) { return r.id === id; });
        confirmDelete('确认删除', '<p style="margin:0">确认将 UID <strong>' + esc(cntRow ? cntRow.uid : '') + '</strong> 从付费内容观看白名单移除？</p>', function () {
          Store.removeContentEntry(id);
          M.toast('已删除');
          renderContentTable();
        });
      }
    });
  }

  function mountDevGlassBars() {
    var defaultSuffixHtml = '';
    if (Store.DEFAULT_SUFFIXES && Store.DEFAULT_SUFFIXES.length) {
      defaultSuffixHtml =
        '<p style="margin:10px 0 4px;font-weight:600;color:#531dab">默认预置后缀（' + Store.DEFAULT_SUFFIXES.length + ' 条）</p>' +
        '<p style="margin:0;font-size:11px;line-height:1.55;color:rgba(0,0,0,.55)">' +
        Store.DEFAULT_SUFFIXES.map(function (s) { return esc(s); }).join(' · ') +
        '</p>';
    }
    var emailBar = document.getElementById('emailDevGlass');
    if (emailBar) {
      emailBar.innerHTML =
        '<span style="font-size:12px;font-weight:600;color:#531dab;white-space:nowrap"><i class="fa-solid fa-flask"></i> To 研发</span>' +
        devGlassHtml('wlDevEmail', '规则', '邮箱白名单 · 研发说明',
          '<p style="margin:0 0 8px"><b>2.1 列表字段</b>：序号、邮箱后缀、创建时间、备注、操作（删除 / 编辑）。</p>' +
          '<p style="margin:0 0 8px"><b>2.2 操作</b>：删除、编辑；<b>仅邮箱后缀可编辑</b>。</p>' +
          '<p style="margin:0 0 8px"><b>2.3 去重</b>：邮箱后缀保存时须去重，重复后缀不可再次添加。</p>' +
          '<p style="margin:0 0 8px">仅白名单内的后缀邮箱地址才允许注册，避免被人利用无名邮箱系统大量注册。</p>' +
          defaultSuffixHtml);
    }
    var feeBar = document.getElementById('feeDevGlass');
    if (feeBar) {
      feeBar.innerHTML =
        '<span style="font-size:12px;font-weight:600;color:#531dab;white-space:nowrap"><i class="fa-solid fa-flask"></i> To 研发</span>' +
        devGlassHtml('wlDevFee', '规则', '手续费白名单 · 研发说明',
          '列表字段：序号、用户 UID、用户昵称、适用范围、创建人、创建时间（精确到秒）、备注、操作（删除 / 编辑）。<br>' +
          '编辑时可调整<b>适用范围</b>：充值、提现；后续若有其他消耗手续费场景须在此同步扩展。<br>' +
          '命中白名单的用户在对应场景免平台手续费（与用户端充提流程联动）。');
    }
    var liveBar = document.getElementById('liveDevGlass');
    if (liveBar) {
      liveBar.innerHTML =
        '<span style="font-size:12px;font-weight:600;color:#531dab;white-space:nowrap"><i class="fa-solid fa-flask"></i> To 研发</span>' +
        devGlassHtml('wlDevLive', '规则', '付费直播观看白名单 · 研发说明',
          '列表字段：序号、用户 UID、创建人、创建时间（精确到秒）、操作（删除）。<br>' +
          '白名单用户可直接解锁付费直播观看，前端<b>跳过付费流程</b>（读 <code>fl_admin_risk_whitelist_v1.liveWhitelist</code>）。');
    }
    var contentBar = document.getElementById('contentDevGlass');
    if (contentBar) {
      contentBar.innerHTML =
        '<span style="font-size:12px;font-weight:600;color:#531dab;white-space:nowrap"><i class="fa-solid fa-flask"></i> To 研发</span>' +
        devGlassHtml('wlDevContent', '规则', '付费内容观看白名单 · 研发说明',
          '列表字段：序号、用户 UID、创建人、创建时间（精确到秒）、操作（删除）。<br>' +
          '白名单用户可直接解锁付费内容（PPV），前端<b>跳过付费弹层</b>（读 <code>contentWhitelist</code>）。');
    }
  }

  initTabs();
  mountDevGlassBars();
  bindFilters();
  bindToolbar();
  bindTableActions();
  applyPermissions();
  renderEmailTable();
  renderFeeTable();
  renderLiveTable();
  renderContentTable();
})();
