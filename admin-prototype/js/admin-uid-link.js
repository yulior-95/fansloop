/**
 * 后台全局 · UID 点击打开用户详情弹窗
 * 任意带 .js-uid-link[data-uid] 的元素，行为与用户列表一致。
 * 依赖：admin-modal.js、users-list-page.js（AdminUsersList.openUserDetail）
 */
(function () {
  function upgradeUidCells(root) {
    root = root || document;
    if (!root.querySelector) return;
    root.querySelectorAll("main.admin-content table").forEach(function (table) {
      var headers = table.querySelectorAll("thead th");
      var uidCol = -1;
      headers.forEach(function (th, i) {
        var label = String(th.textContent || "").trim();
        if (label === "UID" || label === "用户UID") uidCol = i;
      });
      if (uidCol < 0) return;
      table.querySelectorAll("tbody tr").forEach(function (tr) {
        if (tr.querySelector("td[colspan]")) return;
        var td = tr.children[uidCol];
        if (!td || td.querySelector(".js-uid-link")) return;
        var text = String(td.textContent || "").trim();
        if (/^\d{4,12}$/.test(text)) {
          td.innerHTML =
            '<span class="js-uid-link" data-uid="' +
            text +
            '">' +
            text +
            "</span>";
        }
      });
    });
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest(".js-uid-link");
    if (!link || !link.closest(".admin-app")) return;
    var uid = link.getAttribute("data-uid");
    if (!uid) return;
    var api = window.AdminUsersList;
    if (api && typeof api.openUserDetail === "function") {
      api.openUserDetail(uid);
      return;
    }
    if (window.AdminModal) {
      window.AdminModal.toast("用户详情模块未加载，请刷新页面后重试");
    }
  });

  function boot() {
    upgradeUidCells();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.AdminUidLink = { upgrade: upgradeUidCells };
})();
