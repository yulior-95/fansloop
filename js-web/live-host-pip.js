/**
 * 主播控制台 · 小窗悬浮与侧栏切页
 */
(function () {
    if (!document.body.classList.contains("page-live-host")) return;

    var pip = window.HostLivePip;
    if (!pip) return;

    var stage = document.getElementById("hostStage");
    var btnPip = document.getElementById("btnHostPip");
    var btnBack = document.getElementById("btnBackStudio");

    function syncPipBtn() {
        if (!btnPip) return;
        if (pip.isActive()) {
            btnPip.innerHTML = '<i class="fa-solid fa-expand"></i> 还原画面';
            btnPip.classList.add("is-on");
        } else {
            btnPip.innerHTML = '<i class="fa-solid fa-clone"></i> 小窗悬浮';
            btnPip.classList.remove("is-on");
        }
    }

    function syncStageHidden() {
        if (!stage) return;
        stage.classList.remove("is-pip-hidden");
    }

    function activateAndLeave(href) {
        var title =
            window.LiveMetaStore && window.LiveMetaStore.read
                ? window.LiveMetaStore.read().title
                : document.querySelector(".host-title")?.textContent || "直播中";
        var paused = stage && stage.classList.contains("is-paused");
        pip.activate({ title: title, paused: paused });
        syncPipBtn();
        syncStageHidden();
        if (href) location.href = href;
    }

    if (btnPip) {
        btnPip.addEventListener("click", function () {
            if (pip.isActive()) {
                pip.deactivate();
                syncPipBtn();
                syncStageHidden();
                return;
            }
            activateAndLeave("home.html");
        });
    }

    if (btnBack) {
        btnBack.addEventListener("click", function () {
            activateAndLeave("create.html");
        });
    }

    var sidebar = document.querySelector(".app-sidebar");
    if (sidebar) {
        sidebar.addEventListener(
            "click",
            function (e) {
                var item = e.target.closest(".s-item");
                if (!item || item.classList.contains("active")) return;
                var attr = item.getAttribute("onclick") || "";
                var m = attr.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
                if (!m || m[1].indexOf("create-live-host") >= 0) return;
                e.preventDefault();
                e.stopPropagation();
                activateAndLeave(m[1]);
            },
            true
        );
    }

    syncPipBtn();
    syncStageHidden();
    if (pip.isActive()) pip.mount();

    try {
        if (sessionStorage.getItem("fansloop_host_pip_return")) {
            sessionStorage.removeItem("fansloop_host_pip_return");
            syncStageHidden();
            syncPipBtn();
        }
    } catch (e) {}
})();
