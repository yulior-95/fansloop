/**
 * 用户功能控制开关页
 */
(function () {
  var M = window.AdminModal;
  var Store = window.FLUserFeatureSwitchStore;
  if (!M || !Store) return;

  var operator = "limin";
  var tbody = document.getElementById("ufcTbody");
  var pagerMount = document.getElementById("ufcPager");
  var filterUid = document.getElementById("ufcFilterUid");
  var filterNickname = document.getElementById("ufcFilterNickname");
  var filterEmail = document.getElementById("ufcFilterEmail");
  var pager = null;
  var filters = { uid: "", nickname: "", email: "" };
  var activeConfigUid = null;

  function esc(s) {
    return M.esc(s == null ? "" : String(s));
  }

  function buildSearchQuery() {
    return [filters.uid, filters.nickname, filters.email].filter(Boolean).join(" ").trim();
  }

  function filteredUsers() {
    var uidQ = filters.uid.trim();
    var nickQ = filters.nickname.trim().toLowerCase();
    var emailQ = filters.email.trim().toLowerCase();
    var hasFilter = !!(uidQ || nickQ || emailQ);

    if (!hasFilter) {
      return Store.searchUsers("");
    }

    return Store.listAllUsersWithMeta().filter(function (u) {
      if (uidQ && String(u.uid).indexOf(uidQ) === -1) return false;
      if (nickQ && String(u.nickname || "").toLowerCase().indexOf(nickQ) === -1) return false;
      if (emailQ && String(u.email || "").toLowerCase().indexOf(emailQ) === -1) return false;
      return true;
    });
  }

  function latestUpdated(uid) {
    var overrides = Store.getUserOverrides(uid);
    var latest = "";
    Object.keys(overrides).forEach(function (k) {
      var row = overrides[k];
      if (row && row.updatedAt && row.updatedAt > latest) latest = row.updatedAt;
    });
    return latest || "—";
  }

  function switchHtml(uid, featureKey, enabled) {
    var on = enabled !== false;
    return (
      '<button type="button" role="switch" class="ant-switch ant-switch-small ufc-row-switch' +
      (on ? " ant-switch-checked" : "") +
      '" data-uid="' +
      esc(uid) +
      '" data-key="' +
      esc(featureKey) +
      '" aria-checked="' +
      (on ? "true" : "false") +
      '">' +
      '<div class="ant-switch-handle"></div>' +
      '<span class="ant-switch-inner">' +
      '<span class="ant-switch-inner-checked">开启</span>' +
      '<span class="ant-switch-inner-unchecked">关闭</span>' +
      "</span></button>"
    );
  }

  function renderTable() {
    if (!tbody) return;
    var list = filteredUsers();
    if (pager) pager.setTotal(list.length);
    var pageList = pager ? pager.getSlice(list) : list;
    var offset = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;

    if (!pageList.length) {
      var emptyMsg = buildSearchQuery()
        ? "未找到匹配用户"
        : "暂无已配置限制的用户，请通过 UID / 昵称 / 邮箱搜索后配置";
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">' +
        esc(emptyMsg) +
        "</td></tr>";
      return;
    }

    tbody.innerHTML = pageList
      .map(function (u, i) {
        var blocked = u.blockedCount || Store.countBlocked(u.uid);
        return (
          '<tr data-uid="' +
          esc(u.uid) +
          '">' +
          "<td>" +
          (offset + i + 1) +
          "</td>" +
          "<td>" +
          esc(u.uid) +
          "</td>" +
          "<td><strong>" +
          esc(u.nickname) +
          "</strong></td>" +
          "<td>" +
          (u.email ? esc(u.email) : '<span style="color:rgba(0,0,0,.35)">—</span>') +
          "</td>" +
          "<td>" +
          (blocked
            ? '<span class="ant-tag ant-tag-orange">' + blocked + " 项</span>"
            : '<span class="ant-tag ant-tag-green">无限制</span>') +
          "</td>" +
          "<td style=\"font-size:13px;font-variant-numeric:tabular-nums\">" +
          esc(latestUpdated(u.uid)) +
          "</td>" +
          '<td><button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-act="config" data-uid="' +
          esc(u.uid) +
          '">功能配置</button></td>' +
          "</tr>"
        );
      })
      .join("");
  }

  function featureModalBody(uid) {
    var user = Store.getUser(uid);
    var overrides = Store.getUserOverrides(uid);
    var rows = Store.FEATURE_CATALOG.map(function (f, i) {
      var allowed = overrides[f.key] ? overrides[f.key].enabled !== false : true;
      return (
        "<tr>" +
        "<td>" +
        (i + 1) +
        "</td>" +
        "<td>" +
        esc(f.name) +
        "</td>" +
        "<td><code>" +
        esc(f.key) +
        "</code></td>" +
        "<td>" +
        esc(f.desc) +
        "</td>" +
        "<td>" +
        switchHtml(uid, f.key, allowed) +
        "</td>" +
        "</tr>"
      );
    }).join("");

    return (
      '<div class="ufc-user-head">' +
      "<div><strong>UID " +
      esc(uid) +
      " · " +
      esc(user ? user.nickname : "—") +
      "</strong>" +
      (user && user.email ? "<br><span>" + esc(user.email) + "</span>" : "") +
      "</div></div>" +
      '<div class="ufc-modal-table-wrap">' +
      '<div class="ant-table ant-table-bordered ant-table-small">' +
      "<table><thead class=\"ant-table-thead\"><tr>" +
      "<th style=\"width:56px\">序号</th><th style=\"width:120px\">功能名称</th><th style=\"width:200px\">参数名称</th><th>描述</th><th style=\"width:88px\">状态</th>" +
      "</tr></thead><tbody class=\"ant-table-tbody\" id=\"ufcModalTbody\">" +
      rows +
      "</tbody></table></div></div>"
    );
  }

  function openConfigModal(uid) {
    var user = Store.getUser(uid);
    if (!user) {
      M.toast("用户不存在");
      return;
    }
    activeConfigUid = uid;
    M.open({
      title: "用户功能配置",
      wide: true,
      body: featureModalBody(uid),
      footer: [{ text: "关闭", onClick: function () { activeConfigUid = null; M.close(); } }]
    });
  }

  document.addEventListener("click", function (e) {
    var sw = e.target.closest("#ufcModalTbody .ufc-row-switch");
    if (!sw || !activeConfigUid) return;
    e.preventDefault();
    var uid = activeConfigUid;
    var featureKey = sw.getAttribute("data-key");
    var feature = Store.getFeature(featureKey);
    var overrides = Store.getUserOverrides(uid);
    var currentlyAllowed = overrides[featureKey] ? overrides[featureKey].enabled !== false : true;
    var nextAllowed = !currentlyAllowed;

    M.confirmGoogle({
      title: nextAllowed ? "为用户开启功能" : "为用户关闭功能",
      message:
        (nextAllowed ? "即将为 UID " : "即将限制 UID ") +
        uid +
        (nextAllowed ? " 恢复「" : " 关闭「") +
        (feature ? feature.name : featureKey) +
        "」功能。请输入当前登录账号的谷歌验证码确认。",
      onCancel: function () {
        openConfigModal(uid);
      },
      onVerified: function () {
        Store.setFeature(uid, featureKey, nextAllowed, operator);
        M.toast((nextAllowed ? "已开启：" : "已限制：") + (feature ? feature.name : featureKey));
        renderTable();
        openConfigModal(uid);
      }
    });
  });

  function applyFilters() {
    filters.uid = ((filterUid && filterUid.value) || "").trim();
    filters.nickname = ((filterNickname && filterNickname.value) || "").trim();
    filters.email = ((filterEmail && filterEmail.value) || "").trim();
    if (pager) pager.resetPage();
    renderTable();
  }

  function resetFilters() {
    filters = { uid: "", nickname: "", email: "" };
    if (pager) pager.resetPage();
    renderTable();
  }

  if (tbody) {
    tbody.addEventListener("click", function (e) {
      var btn = e.target.closest('[data-act="config"]');
      if (!btn) return;
      openConfigModal(btn.getAttribute("data-uid"));
    });
  }

  var FT = window.AdminFilterToolbar;
  if (FT) {
    FT.onQuery("ufcSearch", applyFilters);
    FT.onReset("ufcReset", resetFilters);
  }

  if (pagerMount && window.AdminPager) {
    pager = window.AdminPager.create({
      mount: pagerMount,
      pageSize: 10,
      onChange: function () {
        renderTable();
      }
    });
  }

  renderTable();
})();
