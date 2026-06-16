(function () {
  var S = window.FLPointsActivityStore;
  var M = window.AdminModal;
  var Session = window.FLAdminSession;
  var Pager = window.AdminPager;
  if (!S || !M) return;

  var canDev = Session && Session.canManageDevActivities();
  var pager = null;

  function esc(s) {
    return M.esc(s);
  }

  function isDevAct(a) {
    return S.isDevBackedActivity(a);
  }

  function filterList() {
    var q = (document.getElementById('fQ').value || '').trim().toLowerCase();
    var typeId = document.getElementById('fType').value;
    var cat = document.getElementById('fCat').value;
    var status = document.getElementById('fStatus').value;
    var channel = document.getElementById('fChannel').value;
    return S.getActivities().filter(function (a) {
      if (q && a.name.toLowerCase().indexOf(q) < 0 && (a.code || '').toLowerCase().indexOf(q) < 0) return false;
      if (typeId && a.typeId !== typeId) return false;
      if (cat && (!a.mallCats || a.mallCats.indexOf(cat) < 0)) return false;
      if (status && a.status !== status) return false;
      if (channel && a.channel !== channel) return false;
      return true;
    });
  }

  function renderStats() {
    var list = S.getActivities();
    var enabled = list.filter(function (a) { return a.status === 'enabled'; }).length;
    var mall = list.filter(function (a) { return a.channel === 'mall'; }).length;
    var task = list.filter(function (a) { return a.channel === 'task'; }).length;
    var devActs = list.filter(function (a) { return isDevAct(a); }).length;
    var el = document.getElementById('apStats');
    if (!el) return;
    el.innerHTML =
      '<div class="ant-card ant-card-bordered ap-stat-card"><div class="ant-card-body"><div class="k">活动总数</div><div class="v">' + list.length + '</div></div></div>' +
      '<div class="ant-card ant-card-bordered ap-stat-card"><div class="ant-card-body"><div class="k">启用中</div><div class="v" style="color:#52c41a">' + enabled + '</div></div></div>' +
      '<div class="ant-card ant-card-bordered ap-stat-card"><div class="ant-card-body"><div class="k">商城兑换类</div><div class="v" style="color:#722ed1">' + mall + '</div></div></div>' +
      '<div class="ant-card ant-card-bordered ap-stat-card"><div class="ant-card-body"><div class="k">任务获取类</div><div class="v" style="color:#1890ff">' + task + '</div></div></div>' +
      (devActs ? '<div class="ant-card ant-card-bordered ap-stat-card"><div class="ant-card-body"><div class="k">研发接入</div><div class="v" style="color:#fa8c16">' + devActs + '</div></div></div>' : '');
  }

  function fillFilters() {
    var fType = document.getElementById('fType');
    var fCat = document.getElementById('fCat');
    if (fType) {
      S.getTypes().forEach(function (t) {
        var o = document.createElement('option');
        o.value = t.id;
        o.textContent = t.name + (S.isDevOnlyType(t.id) ? ' · 研发' : '');
        fType.appendChild(o);
      });
    }
    if (fCat) {
      S.MALL_CATS.forEach(function (c) {
        var o = document.createElement('option');
        o.value = c.id;
        o.textContent = c.label;
        fCat.appendChild(o);
      });
    }
  }

  function actionLinks(a) {
    var dev = isDevAct(a);
    var href = 'activities-points-edit.html?id=' + encodeURIComponent(a.id);
    var html = '<a class="ant-btn ant-btn-link ant-btn-sm" href="' + href + '">' + (dev && !canDev ? '配置' : '编辑') + '</a>';
    if (canDev || !dev) {
      html += '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-copy">复制</button>';
    }
    html += (a.status === 'enabled'
      ? '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-disable">停用</button>'
      : '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-enable">启用</button>');
    if (canDev || !dev) {
      html += '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-del" style="color:#ff4d4f">删除</button>';
    }
    return html;
  }

  function renderTable() {
    var all = filterList();
    if (pager) pager.setTotal(all.length);
    var list = pager ? pager.getSlice(all) : all;
    var tbody = document.getElementById('actTbody');
    if (!tbody) return;
    if (!all.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:rgba(0,0,0,.45)">暂无匹配活动</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (a) {
      var cool = a.coolingDays > 0 ? a.coolingDays + ' 天' : '即时可用';
      var devTag = isDevAct(a) ? ' <span class="ant-tag ant-tag-orange" style="font-size:11px">研发接入</span>' : '';
      return '<tr data-id="' + esc(a.id) + '">' +
        '<td><div class="ap-name-cell">' +
        '<div class="ap-thumb" style="background-image:url(\'' + esc(a.image) + '\')"></div>' +
        '<div><div><strong>' + esc(a.name) + '</strong>' + devTag + '</div>' +
        '<div class="meta"><code>' + esc(a.code) + '</code> · ' + (a.channel === 'mall' ? '商城' : '任务') +
        (a.mallThumbTag ? ' · <span class="ant-tag" style="font-size:10px;margin:0">' + esc(a.mallThumbTag) + '</span>' : '') +
        '</div></div></div></td>' +
        '<td>' + esc(S.typeLabel(a.typeId)) + '</td>' +
        '<td>' + esc(S.catLabels(a.mallCats)) + '</td>' +
        '<td>' + esc(a.rewardDesc || '') + '</td>' +
        '<td>' + esc(a.freqDesc || '—') + '</td>' +
        '<td>' + cool + '</td>' +
        '<td>' + S.statusTag(a.status) + '</td>' +
        '<td>' + actionLinks(a) + '</td></tr>';
    }).join('');
  }

  function refresh(resetPage) {
    renderStats();
    if (resetPage && pager) pager.resetPage();
    renderTable();
  }

  document.getElementById('btnNewAct').addEventListener('click', function () {
    location.href = 'activities-points-edit.html';
  });

  var btnDev = document.getElementById('btnNewDevAct');
  if (btnDev) {
    if (canDev) btnDev.hidden = false;
    btnDev.addEventListener('click', function () {
      location.href = 'activities-points-edit.html?preset=campaign';
    });
  }

  if (Session) Session.mountRoleSwitcher(document.querySelector('.admin-header-user'));

  document.getElementById('btnSearch').addEventListener('click', function () {
    refresh(true);
  });
  document.getElementById('btnReset').addEventListener('click', function () {
    document.getElementById('fQ').value = '';
    document.getElementById('fType').value = '';
    document.getElementById('fCat').value = '';
    document.getElementById('fStatus').value = '';
    document.getElementById('fChannel').value = '';
    refresh(true);
  });
  document.getElementById('fQ').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') refresh(true);
  });

  document.getElementById('actTbody').addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var tr = btn.closest('tr');
    var id = tr && tr.getAttribute('data-id');
    if (!id) return;
    var act = S.getActivity(id);
    if (!act) return;

    if (btn.classList.contains('js-copy')) {
      if (isDevAct(act) && !canDev) {
        M.toast('无权复制研发接入活动');
        return;
      }
      var copy = JSON.parse(JSON.stringify(act));
      copy.id = S.uid();
      copy.code = act.code + '_COPY';
      copy.name = act.name + '（副本）';
      copy.status = 'draft';
      S.upsertActivity(copy);
      M.toast('已复制为草稿');
      refresh(false);
    }
    if (btn.classList.contains('js-disable')) {
      M.open({
        title: '停用活动',
        body: '<p style="margin:0">停用后用户端不再展示/触发；进行中的进度按后端策略结算。</p>',
        footer: [
          { text: '取消', onClick: M.close },
          { text: '确认停用', danger: true, onClick: function () {
            act.status = 'disabled';
            S.upsertActivity(act);
            M.close();
            M.toast('已停用');
            refresh(false);
          }}
        ]
      });
    }
    if (btn.classList.contains('js-enable')) {
      act.status = 'enabled';
      S.upsertActivity(act);
      M.toast('已启用');
      refresh(false);
    }
    if (btn.classList.contains('js-del')) {
      M.open({
        title: '删除活动',
        body: '<p style="margin:0;color:#ff4d4f">删除后不可恢复（原型 localStorage）。生产环境建议软删除。</p>',
        footer: [
          { text: '取消', onClick: M.close },
          { text: '确认删除', danger: true, onClick: function () {
            S.deleteActivity(id);
            M.close();
            M.toast('已删除');
            refresh(true);
          }}
        ]
      });
    }
  });

  if (Pager) {
    pager = Pager.create({
      mount: document.getElementById('actPager'),
      pageSize: 5,
      onChange: function () {
        renderTable();
      }
    });
  }

  fillFilters();
  refresh(true);
})();
