/**
 * 设置侧栏 · 退出登录
 */
(function () {
    if (window.FansloopAuth && window.FansloopAuth.ensureDemoLogin) {
        window.FansloopAuth.ensureDemoLogin();
    }
    document.querySelectorAll(".nav-item-logout, [data-action='logout']").forEach(function (el) {
        el.addEventListener("click", function () {
            if (window.confirm("确认退出登录？")) {
                if (window.FansloopAuth) {
                    window.FansloopAuth.logoutAndGoGuest();
                } else {
                    location.href = "guest-home.html";
                }
            }
        });
    });
})();
