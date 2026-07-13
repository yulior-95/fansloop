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

    function syncStagePip() {
        if (!stage) return;
        if (window.FLLivePipPlaceholder) {
            window.FLLivePipPlaceholder.sync({
                player: stage,
                checkViewerPip: false,
                checkHostPip: true,
                isActiveFn: function () {
                    return pip.isActive();
                },
                subText: "推流画面已在悬浮小窗中，可切换站内其他页面"
            });
            var restore = stage.querySelector("[data-fl-pip-restore]");
            if (restore && !restore.dataset.hostPipBound) {
                restore.dataset.hostPipBound = "1";
                restore.addEventListener("click", function () {
                    pip.deactivate();
                    syncStagePip();
                    syncPipBtn();
                });
            }
        } else {
            stage.classList.toggle("is-pip-active", pip.isActive());
        }
    }

    function syncStageHidden() {
        syncStagePip();
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
    syncStagePip();
    if (pip.isActive()) pip.mount();

    window.addEventListener("fl-live-pip-change", syncStagePip);
    window.addEventListener("storage", function (e) {
        if (e.key === "fansloop_host_pip") syncStagePip();
    });

    try {
        if (sessionStorage.getItem("fansloop_host_pip_return")) {
            sessionStorage.removeItem("fansloop_host_pip_return");
            syncStageHidden();
            syncPipBtn();
        }
    } catch (e) {}
})();
