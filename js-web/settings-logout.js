/**
 * 设置侧栏 · 退出登录（事件委托，兼容动态导航）
 */
(function () {
    if (window.FansloopAuth && window.FansloopAuth.ensureDemoLogin) {
        window.FansloopAuth.ensureDemoLogin();
    }

    function onLogoutClick(e) {
        var el = e.target.closest(".nav-item-logout, [data-action='logout']");
        if (!el) return;
        e.preventDefault();
        if (window.confirm("确认退出登录？")) {
            if (window.FansloopAuth) {
                window.FansloopAuth.logoutAndGoGuest();
            } else {
                location.href = "guest-home.html";
            }
        }
    }

    document.addEventListener("click", onLogoutClick);
})();
