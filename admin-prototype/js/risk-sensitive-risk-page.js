/**
 * 敏感词风控管理页 · 异常数据 / 操作日志 / 阶梯参数
 */
(function () {
  var M = window.AdminModal;
  var Store = window.FLSensitiveRiskStore;
  if (!M || !Store) return;

  var operator = 'limin';
  var hitFilter = {
    uid: '',
    status: '',
    triggerStart: '',
    triggerEnd: '',
    operatedStart: '',
    operatedEnd: ''
  };
  var logFilter = {
    uid: '',
    opStart: '',
    opEnd: '',
    triggerStart: '',
    triggerEnd: '',
    operatedStart: '',
    operatedEnd: ''
  };
  var hitPage = { page: 1, pageSize: 10 };
  var hitPager = null;
  var logPage = { page: 1, pageSize: 10 };
  var logPager = null;
  var tierDraft = [];
  var configDraft = null;
  var countdownTimer = null;

  function esc(s) {
    return M.esc(s == null ? '' : String(s));
  }

  function sceneLabel(scene) {
    return Store.SCENE_LABELS[scene] || scene || '—';
  }

  function statusTag(status) {
    if (status === 'muted') {
      return '<span class="ant-tag ant-tag-orange">禁言中</span>';
    }
    if (status === 'pending') {
      return '<span class="ant-tag ant-tag-red">待处理</span>';
    }
    return '<span class="ant-tag ant-tag-default">' + esc(status) + '</span>';
  }

  function devGlassHtml(tipId, label, title, bodyHtml) {
    return (
      '<span class="sr-dev-glass-wrap">' +
      '<span class="sr-dev-glass-sphere" tabindex="0" aria-describedby="' + tipId + '">' +
      '<span class="sr-dev-glass-shine"></span>' +
      '<span class="sr-dev-glass-txt">' + esc(label) + '</span></span>' +
      '<span class="sr-dev-glass-pop" id="' + tipId + '" role="tooltip">' +
      '<strong>' + esc(title) + '</strong>' + bodyHtml +
      '</span></span>'
    );
  }

  function mountDevGlass() {
    var bar = document.getElementById('srDevGlass');
    if (!bar) return;
    bar.innerHTML =
      '<span style="font-size:12px;font-weight:600;color:#531dab;white-space:nowrap"><i class="fa-solid fa-flask"></i> To 研发</span>' +
      devGlassHtml('srDevTip', '联动', '敏感词风控 · 研发说明',
        '<p style="margin:0 0 8px"><b>异常数据</b>：「同场景次数」= 该 UID 在当前触发场景下的历史累计命中数（IM / 直播分开）。</p>' +
        '<p style="margin:0 0 8px"><b>阶梯匹配</b>：仅在<b>同场景 + 统计窗口</b>内计数，如直播第 8 次不会叠加 IM 命中。</p>' +
        '<p style="margin:0 0 8px"><b>触发事件</b>：如「7天内≥8次 · 禁言小时」；倒计时仅自动禁言展示，永久/人工为 <code>--</code>。</p>' +
        '<p style="margin:0">用户端 IM / 直播命中时 <code>recordHit</code> 写入；存储键 <code>' + esc(Store.KEY) + '</code>。</p>');
  }

  function initTabs() {
    var bar = document.getElementById('srTabs');
    if (!bar) return;
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-tab]');
      if (!btn) return;
      var tab = btn.getAttribute('data-tab');
      bar.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      document.querySelectorAll('.admin-tab-panel').forEach(function (p) {
        p.classList.toggle('active', p.id === tab);
      });
    });
  }

  function filterVal(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function parseFilterTime(val) {
    if (!val) return null;
    var dt = new Date(val);
    return isNaN(dt.getTime()) ? null : dt.getTime();
  }

  function recordTimeMs(str) {
    if (!str || str === '—') return null;
    var dt = new Date(String(str).replace(/-/g, '/'));
    return isNaN(dt.getTime()) ? null : dt.getTime();
  }

  function inTimeRange(recordVal, startVal, endVal) {
    if (!startVal && !endVal) return true;
    var ms = recordTimeMs(recordVal);
    if (ms == null) return false;
    var start = parseFilterTime(startVal);
    var end = parseFilterTime(endVal);
    if (start != null && ms < start) return false;
    if (end != null && ms > end) return false;
    return true;
  }

  function slicePage(list, page, pageSize) {
    var total = list.length;
    var tp = Math.max(1, Math.ceil(total / pageSize) || 1);
    var p = page;
    if (p < 1) p = 1;
    if (p > tp) p = tp;
    var start = (p - 1) * pageSize;
    return { rows: list.slice(start, start + pageSize), total: total, page: p };
  }

  function ensureHitPager() {
    if (hitPager) return hitPager;
    var mount = document.getElementById('hitPager');
    if (!mount || !window.AdminPager) return null;
    hitPager = AdminPager.create({
      mount: mount,
      pageSize: hitPage.pageSize,
      onChange: function (page, size) {
        hitPage.page = page;
        hitPage.pageSize = size;
        renderHits();
      }
    });
    return hitPager;
  }

  function visibleHits() {
    return Store.read().hits.filter(function (h) {
      if (h.status !== 'pending' && h.status !== 'muted') return false;
      if (hitFilter.uid && String(h.uid).indexOf(hitFilter.uid) < 0) return false;
      if (hitFilter.status && h.status !== hitFilter.status) return false;
      if (!inTimeRange(h.time, hitFilter.triggerStart, hitFilter.triggerEnd)) return false;
      if (!inTimeRange(h.lastOperatedAt, hitFilter.operatedStart, hitFilter.operatedEnd)) return false;
      return true;
    });
  }

  function visibleLogs() {
    return Store.read().logs.filter(function (row) {
      if (logFilter.uid && String(row.uid).indexOf(logFilter.uid) < 0) return false;
      if (!inTimeRange(row.time, logFilter.opStart, logFilter.opEnd)) return false;
      if (!inTimeRange(row.triggerTime, logFilter.triggerStart, logFilter.triggerEnd)) return false;
      var operatedAt = row.operatedAt || row.time;
      if (!inTimeRange(operatedAt, logFilter.operatedStart, logFilter.operatedEnd)) return false;
      return true;
    });
  }

  function renderHits() {
    var tbody = document.getElementById('hitTbody');
    if (!tbody) return;
    var all = visibleHits();
    var pager = ensureHitPager();
    var sliced = slicePage(all, hitPage.page, hitPage.pageSize);
    hitPage.page = sliced.page;
    if (pager) pager.setTotal(sliced.total);

    if (!sliced.rows.length) {
      tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">暂无待处理或禁言中的记录</td></tr>';
      return;
    }

    var data = Store.read();
    tbody.innerHTML = sliced.rows.map(function (row, i) {
      var seq = (hitPage.page - 1) * hitPage.pageSize + i + 1;
      var hitTotal = Store.countUserSceneHits(row.uid, row.scene, data);
      var ops = '';
      if (row.status === 'pending') {
        ops =
          '<button type="button" class="ant-btn ant-btn-sm ant-btn-danger" data-act="mute" data-id="' + esc(row.id) + '">禁言</button> ' +
          '<button type="button" class="ant-btn ant-btn-sm" data-act="ignore" data-id="' + esc(row.id) + '">忽略</button>';
      } else if (row.status === 'muted') {
        ops = '<button type="button" class="ant-btn ant-btn-sm ant-btn-primary" data-act="unmute" data-id="' + esc(row.id) + '">解禁</button>';
      }
      return (
        '<tr data-id="' + esc(row.id) + '">' +
        '<td class="col-sticky-left-1">' + seq + '</td>' +
        '<td class="col-sticky-left-2"><strong>' + hitTotal + '</strong></td>' +
        '<td class="col-sticky-left-3">' + esc(row.uid) + '</td>' +
        '<td>' + esc(sceneLabel(row.scene)) + '</td>' +
        '<td>' + esc(row.time) + '</td>' +
        '<td>' + esc(row.tierEvent || '—') + '</td>' +
        '<td>' + esc(row.clientIp || '—') + '</td>' +
        '<td>' + statusTag(row.status) + '</td>' +
        '<td class="js-mute-cd" data-id="' + esc(row.id) + '">' + esc(Store.muteCountdown(row)) + '</td>' +
        '<td>' + esc(row.lastOperator || '—') + '</td>' +
        '<td>' + esc(row.lastOperatedAt || '—') + '</td>' +
        '<td class="col-sticky-right">' + ops + '</td></tr>'
      );
    }).join('');
  }

  function refreshCountdowns() {
    var cells = document.querySelectorAll('.js-mute-cd');
    if (!cells.length) return;
    var data = Store.read();
    cells.forEach(function (cell) {
      var id = cell.getAttribute('data-id');
      var row = data.hits.find(function (h) { return h.id === id; });
      if (row) cell.textContent = Store.muteCountdown(row);
    });
  }

  function startCountdownTimer() {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(refreshCountdowns, 1000);
  }

  function ensureLogPager() {
    if (logPager) return logPager;
    var mount = document.getElementById('logPager');
    if (!mount || !window.AdminPager) return null;
    logPager = AdminPager.create({
      mount: mount,
      pageSize: logPage.pageSize,
      onChange: function (page, size) {
        logPage.page = page;
        logPage.pageSize = size;
        renderLogs();
      }
    });
    return logPager;
  }

  function renderLogs() {
    var tbody = document.getElementById('logTbody');
    if (!tbody) return;
    var all = visibleLogs();
    var pager = ensureLogPager();
    var sliced = slicePage(all, logPage.page, logPage.pageSize);
    logPage.page = sliced.page;
    if (pager) pager.setTotal(sliced.total);

    if (!sliced.rows.length) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">暂无日志</td></tr>';
      return;
    }
    tbody.innerHTML = sliced.rows.map(function (row, i) {
      var seq = (logPage.page - 1) * logPage.pageSize + i + 1;
      return (
        '<tr>' +
        '<td class="col-sticky-left-1">' + seq + '</td>' +
        '<td class="col-sticky-left-2"><strong>' + esc(row.hitCount != null ? row.hitCount : '—') + '</strong></td>' +
        '<td class="col-sticky-left-3">' + esc(row.uid) + '</td>' +
        '<td>' + esc(sceneLabel(row.scene)) + '</td>' +
        '<td>' + esc(row.triggerTime || '—') + '</td>' +
        '<td>' + esc(row.tierEvent || '—') + '</td>' +
        '<td>' + esc(row.clientIp || '—') + '</td>' +
        '<td>' + esc(row.action) + '</td>' +
        '<td>' + esc(row.operator) + '</td>' +
        '<td class="col-sticky-right">' + esc(row.operatedAt || row.time || '—') + '</td></tr>'
      );
    }).join('');
  }

  function actionOptions(selected) {
    var actions = [
      ['auto_ignore', '自动忽略'],
      ['mute_hours', '禁言小时'],
      ['mute_permanent', '禁言永久'],
      ['manual_disable', '手动禁言']
    ];
    return actions.map(function (pair) {
      var sel = pair[0] === selected ? ' selected' : '';
      return '<option value="' + pair[0] + '"' + sel + '>' + pair[1] + '</option>';
    }).join('');
  }

  function loadTierDraft() {
    var data = Store.read();
    configDraft = {
      statWindowDays: data.riskConfig.statWindowDays,
      countScope: data.riskConfig.countScope,
      scenes: (data.riskConfig.scenes || []).slice()
    };
    tierDraft = data.tierRules.map(function (r) {
      return {
        id: r.id,
        threshold: r.threshold,
        action: r.action,
        hours: r.hours || 1,
        enabled: r.enabled !== false
      };
    });
  }

  function renderConfigSummary() {
    var el = document.getElementById('cfgSummary');
    if (!el || !configDraft) return;
    el.textContent = Store.configSummary(configDraft);
  }

  function renderRiskConfig() {
    if (!configDraft) return;
    var winEl = document.getElementById('cfgStatWindow');
    var scopeEl = document.getElementById('cfgCountScope');
    if (winEl) winEl.value = String(configDraft.statWindowDays);
    if (scopeEl) scopeEl.value = configDraft.countScope || 'effective';
    document.querySelectorAll('.js-cfg-scene').forEach(function (cb) {
      cb.checked = configDraft.scenes.indexOf(cb.value) >= 0;
    });
    renderConfigSummary();
  }

  function syncConfigFromDom() {
    if (!configDraft) configDraft = Store.defaultRiskConfig();
    var winEl = document.getElementById('cfgStatWindow');
    var scopeEl = document.getElementById('cfgCountScope');
    configDraft.statWindowDays = parseInt(winEl && winEl.value, 10);
    if (isNaN(configDraft.statWindowDays)) configDraft.statWindowDays = 7;
    configDraft.countScope = scopeEl ? scopeEl.value : 'effective';
    var scenes = [];
    document.querySelectorAll('.js-cfg-scene:checked').forEach(function (cb) {
      scenes.push(cb.value);
    });
    configDraft.scenes = scenes.length ? scenes : ['im', 'live'];
    configDraft = Store.normalizeRiskConfig(configDraft);
  }

  function bindConfigEvents() {
    var winEl = document.getElementById('cfgStatWindow');
    var scopeEl = document.getElementById('cfgCountScope');
    var scenesEl = document.getElementById('cfgScenes');
    function onCfgChange() {
      syncConfigFromDom();
      renderConfigSummary();
    }
    if (winEl) winEl.addEventListener('change', onCfgChange);
    if (scopeEl) scopeEl.addEventListener('change', onCfgChange);
    if (scenesEl) scenesEl.addEventListener('change', onCfgChange);
  }

  function renderTier() {
    var tbody = document.getElementById('tierTbody');
    if (!tbody) return;
    if (!tierDraft.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:rgba(0,0,0,.45)">暂无规则，请新增</td></tr>';
      return;
    }
    tbody.innerHTML = tierDraft.map(function (row, i) {
      var hoursDisabled = row.action !== 'mute_hours' ? ' disabled style="opacity:.45"' : '';
      return (
        '<tr data-idx="' + i + '">' +
        '<td><input class="ant-input sr-tier-input js-tier-threshold" type="number" min="1" value="' + esc(row.threshold) + '"></td>' +
        '<td><select class="ant-input sr-tier-select js-tier-action">' + actionOptions(row.action) + '</select></td>' +
        '<td><input class="ant-input sr-tier-input js-tier-hours" type="number" min="1" value="' + esc(row.hours) + '"' + hoursDisabled + '></td>' +
        '<td><input type="checkbox" class="js-tier-enabled"' + (row.enabled ? ' checked' : '') + '></td>' +
        '<td><button type="button" class="ant-btn ant-btn-link ant-btn-sm js-tier-del" style="color:#ff4d4f">删除</button></td>' +
        '</tr>'
      );
    }).join('');
  }

  function syncTierFromDom() {
    var tbody = document.getElementById('tierTbody');
    if (!tbody) return;
    tbody.querySelectorAll('tr[data-idx]').forEach(function (tr) {
      var idx = parseInt(tr.getAttribute('data-idx'), 10);
      var row = tierDraft[idx];
      if (!row) return;
      var th = tr.querySelector('.js-tier-threshold');
      var act = tr.querySelector('.js-tier-action');
      var hrs = tr.querySelector('.js-tier-hours');
      var en = tr.querySelector('.js-tier-enabled');
      row.threshold = parseInt(th && th.value, 10) || 1;
      row.action = act ? act.value : 'mute_hours';
      row.hours = parseInt(hrs && hrs.value, 10) || 1;
      row.enabled = !!(en && en.checked);
    });
  }

  function openMuteModal(hitId) {
    var row = Store.read().hits.find(function (h) { return h.id === hitId; });
    M.open({
      title: '手动禁言',
      body:
        '<p style="margin:0 0 12px;font-size:13px">UID <strong>' + esc(row ? row.uid : '') + '</strong> · 记录 ' + esc(hitId) + '</p>' +
        '<label style="display:block;margin-bottom:6px">禁言时长（小时）</label>' +
        '<input class="ant-input" id="srMuteHours" type="number" min="1" value="24" style="width:120px;margin-bottom:12px">' +
        '<label style="display:block;margin-bottom:6px">备注</label>' +
        '<input class="ant-input" id="srMuteRemark" style="width:100%" placeholder="可选">',
      footer: [
        { text: '取消', onClick: M.close },
        {
          text: '确认禁言',
          primary: true,
          danger: true,
          onClick: function () {
            var hours = parseInt(document.getElementById('srMuteHours').value, 10) || 24;
            var remark = (document.getElementById('srMuteRemark').value || '').trim();
            Store.muteHit(hitId, operator, hours, remark);
            M.close();
            M.toast('已禁言');
            renderHits();
            renderLogs();
          }
        }
      ]
    });
  }

  function openIgnoreModal(hitId) {
    var row = Store.read().hits.find(function (h) { return h.id === hitId; });
    M.open({
      title: '忽略记录',
      body:
        '<p style="margin:0 0 12px">确认忽略 UID <strong>' + esc(row ? row.uid : '') + '</strong> 的命中记录？</p>' +
        '<input class="ant-input" id="srIgnoreRemark" style="width:100%" placeholder="备注（可选）">',
      footer: [
        { text: '取消', onClick: M.close },
        {
          text: '确认忽略',
          onClick: function () {
            var remark = (document.getElementById('srIgnoreRemark').value || '').trim();
            Store.ignoreHit(hitId, operator, remark);
            M.close();
            M.toast('已忽略');
            renderHits();
            renderLogs();
          }
        }
      ]
    });
  }

  function openUnmuteModal(hitId) {
    var row = Store.read().hits.find(function (h) { return h.id === hitId; });
    M.open({
      title: '解禁',
      body: '<p style="margin:0 0 12px">确认解除 UID <strong>' + esc(row ? row.uid : '') + '</strong> 的禁言？</p>' +
        '<input class="ant-input" id="srUnmuteRemark" style="width:100%" placeholder="备注（可选）">',
      footer: [
        { text: '取消', onClick: M.close },
        {
          text: '确认解禁',
          primary: true,
          onClick: function () {
            var remark = (document.getElementById('srUnmuteRemark').value || '').trim();
            Store.unmuteHit(hitId, operator, remark);
            M.close();
            M.toast('已解禁');
            renderHits();
            renderLogs();
          }
        }
      ]
    });
  }

  var FT = window.AdminFilterToolbar;
  if (FT) {
    FT.onQuery("btnHitSearch", function () {
      hitFilter.uid = filterVal("hitFilterUid");
      hitFilter.status = filterVal("hitFilterStatus");
      hitFilter.triggerStart = filterVal("hitFilterTriggerStart");
      hitFilter.triggerEnd = filterVal("hitFilterTriggerEnd");
      hitFilter.operatedStart = filterVal("hitFilterOperatedStart");
      hitFilter.operatedEnd = filterVal("hitFilterOperatedEnd");
      hitPage.page = 1;
      renderHits();
    });
    FT.onReset("btnHitReset", function () {
      hitFilter = {
        uid: "",
        status: "",
        triggerStart: "",
        triggerEnd: "",
        operatedStart: "",
        operatedEnd: ""
      };
      hitPage.page = 1;
      renderHits();
    });
    FT.onQuery("btnLogSearch", function () {
      logFilter.uid = filterVal("logFilterUid");
      logFilter.opStart = filterVal("logFilterOpStart");
      logFilter.opEnd = filterVal("logFilterOpEnd");
      logFilter.triggerStart = filterVal("logFilterTriggerStart");
      logFilter.triggerEnd = filterVal("logFilterTriggerEnd");
      logFilter.operatedStart = filterVal("logFilterOperatedStart");
      logFilter.operatedEnd = filterVal("logFilterOperatedEnd");
      logPage.page = 1;
      renderLogs();
    });
    FT.onReset("btnLogReset", function () {
      logFilter = {
        uid: "",
        opStart: "",
        opEnd: "",
        triggerStart: "",
        triggerEnd: "",
        operatedStart: "",
        operatedEnd: ""
      };
      logPage.page = 1;
      renderLogs();
    });
  }

  var hitTbody = document.getElementById('hitTbody');
  if (hitTbody) {
    hitTbody.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      var act = btn.getAttribute('data-act');
      if (act === 'mute') openMuteModal(id);
      else if (act === 'ignore') openIgnoreModal(id);
      else if (act === 'unmute') openUnmuteModal(id);
    });
  }

  document.getElementById('btnTierAdd').addEventListener('click', function () {
    syncTierFromDom();
    syncConfigFromDom();
    tierDraft.push({
      id: 'TR_' + Date.now().toString(36),
      threshold: 10,
      action: 'manual_disable',
      hours: 1,
      enabled: true
    });
    renderTier();
  });

  function openSaveTierModal() {
    syncTierFromDom();
    syncConfigFromDom();
    var data = Store.read();
    var preview = Store.previewRiskSave(data, { config: configDraft, rules: tierDraft });
    if (!preview.configChanged && !preview.rulesChanged) {
      M.toast('参数无变更');
      return;
    }

    var body =
      '<div style="font-size:13px;line-height:1.65">' +
      '<p style="margin:0 0 12px"><b>保存后将如何处理？</b></p>' +
      '<ul style="margin:0 0 12px;padding-left:18px">' +
      '<li><b>禁言中（' + preview.mutedCount + ' 条）</b>：维持现状，不自动解禁/加刑；倒计时继续走。</li>' +
      '<li><b>待处理（' + preview.pendingCount + ' 条）</b>：维持待处理状态，不自动禁言/忽略。</li>' +
      '<li><b>后续新命中</b>：按保存后的统计窗口与阶梯重新计数匹配。</li>' +
      '</ul>';

    if (preview.configChanged) {
      body +=
        '<p style="margin:0 0 8px;padding:10px 12px;background:#fafafa;border-radius:8px;border:1px solid #f0f0f0">' +
        '<span style="color:rgba(0,0,0,.45)">统计策略</span><br>' +
        'v' + preview.oldVersion + '：' + esc(preview.oldBrief) + '<br>' +
        '→ v' + (preview.oldVersion + 1) + '：' + esc(preview.newBrief) +
        '</p>' +
        '<label style="display:flex;align-items:flex-start;gap:8px;margin:12px 0 0;font-size:13px;cursor:pointer">' +
        '<input type="checkbox" id="srReconcilePending" style="margin-top:3px">' +
        '<span>同步更新<b>待处理</b>记录的「触发事件」展示文案（按新窗口重算，<b>不改变</b>处置状态）</span></label>';
    } else {
      body += '<p style="margin:0;color:rgba(0,0,0,.45)">仅阶梯规则调整：已产生记录不追溯，新命中按新规则匹配。</p>';
    }
    body += '</div>';

    M.open({
      title: '保存风控参数',
      body: body,
      footer: [
        { text: '取消', onClick: M.close },
        {
          text: '确认保存',
          primary: true,
          onClick: function () {
            var reconcile = false;
            var cb = document.getElementById('srReconcilePending');
            if (cb) reconcile = !!cb.checked;
            Store.saveRiskParams(
              { config: configDraft, rules: tierDraft },
              { operator: operator, reconcilePendingDisplay: reconcile }
            );
            M.close();
            M.toast('参数已保存');
            loadTierDraft();
            renderRiskConfig();
            renderTier();
            renderHits();
            renderLogs();
          }
        }
      ]
    });
  }

  document.getElementById('btnTierSave').addEventListener('click', openSaveTierModal);

  var tierTbody = document.getElementById('tierTbody');
  if (tierTbody) {
    tierTbody.addEventListener('change', function (e) {
      var sel = e.target.closest('.js-tier-action');
      if (!sel) return;
      var tr = sel.closest('tr');
      var hrs = tr && tr.querySelector('.js-tier-hours');
      if (!hrs) return;
      if (sel.value === 'mute_hours') {
        hrs.disabled = false;
        hrs.style.opacity = '1';
      } else {
        hrs.disabled = true;
        hrs.style.opacity = '0.45';
      }
    });
    tierTbody.addEventListener('click', function (e) {
      var btn = e.target.closest('.js-tier-del');
      if (!btn) return;
      syncTierFromDom();
      var tr = btn.closest('tr');
      var idx = parseInt(tr.getAttribute('data-idx'), 10);
      tierDraft.splice(idx, 1);
      renderTier();
    });
  }

  window.addEventListener('fl-sensitive-risk-change', function () {
    renderHits();
    renderLogs();
  });

  mountDevGlass();
  initTabs();
  bindConfigEvents();
  loadTierDraft();
  ensureHitPager();
  ensureLogPager();
  renderRiskConfig();
  renderHits();
  renderLogs();
  renderTier();
  startCountdownTimer();
})();
