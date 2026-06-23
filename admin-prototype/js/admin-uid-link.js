/**
 * 后台全局 · UID 点击打开用户详情弹窗
 * 任意带 .js-uid-link[data-uid] 的元素，行为与用户列表一致。
 * 依赖：admin-modal.js、users-list-page.js（AdminUsersList.openUserDetail）
 */
(function () {
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
})();
