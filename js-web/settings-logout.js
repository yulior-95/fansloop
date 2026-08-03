/**
 * 设置侧栏 · 退出登录（事件委托，兼容动态导航）
 */
(function () {
    if (window.GoodfansAuth && window.GoodfansAuth.ensureDemoLogin) {
        window.GoodfansAuth.ensureDemoLogin();
    }

    function onLogoutClick(e) {
        var el = e.target.closest(".nav-item-logout, [data-action='logout']");
        if (!el) return;
        e.preventDefault();
        if (window.confirm("确认退出登录？")) {
            if (window.GoodfansAuth) {
                window.GoodfansAuth.logoutAndGoGuest();
            } else {
                location.href = "guest-home.html";
            }
        }
    }

    document.addEventListener("click", onLogoutClick);
})();
