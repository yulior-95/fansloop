/**
 * 悬浮窗播放 · 主画面缺省占位（全站复用）
 */
(function (global) {
    var VIEWER_KEY = "fl_live_pip_state";
    var HOST_KEY = "fansloop_host_pip";

    var PLACEHOLDER_HTML =
        '<div class="fl-pip-placeholder" data-fl-pip-placeholder hidden>' +
        '<div class="fl-pip-placeholder-inner">' +
        '<div class="ico"><i class="fa-solid fa-window-restore"></i></div>' +
        '<h3>正在悬浮窗播放</h3>' +
        '<p data-fl-pip-sub>直播画面已移至小窗，可继续浏览页面其他内容</p>' +
        '<button type="button" class="fl-pip-restore-main" data-fl-pip-restore>' +
        '<i class="fa-solid fa-up-right-and-down-left-from-center"></i> 还原到大屏' +
        "</button></div></div>";

    var TILE_PLACEHOLDER_HTML =
        '<div class="fl-pip-placeholder fl-pip-placeholder--tile" data-fl-pip-placeholder hidden>' +
        '<div class="fl-pip-placeholder-inner">' +
        '<div class="ico"><i class="fa-solid fa-clone"></i></div>' +
        '<h3>正在悬浮窗播放</h3>' +
        '<p data-fl-pip-sub>视频已移至右下角小窗</p>' +
        '<button type="button" class="fl-pip-restore-main" data-fl-pip-restore>' +
        '<i class="fa-solid fa-down-left-and-up-right-to-center"></i> 还原到大屏' +
        "</button></div></div>";

    function qs(sel, root) {
        if (!sel) return null;
        if (typeof sel === "string") return (root || document).querySelector(sel);
        return sel;
    }

    function readViewerPip() {
        try {
            var raw = localStorage.getItem(VIEWER_KEY) || "";
            if (!raw) return null;
            var obj = JSON.parse(raw);
            return obj && obj.active ? obj : null;
        } catch (e) {
            return null;
        }
    }

    function readHostPip() {
        try {
            if (global.HostLivePip && global.HostLivePip.read) {
                var s = global.HostLivePip.read();
                return s && s.active ? s : null;
            }
            var raw = localStorage.getItem(HOST_KEY) || "";
            if (!raw) return null;
            var obj = JSON.parse(raw);
            return obj && obj.active ? obj : null;
        } catch (e) {
            return null;
        }
    }

    function ensureCss() {
        if (document.querySelector('link[data-fl-pip-placeholder-css]')) return;
        var base = "../css-web/";
        var scripts = document.querySelectorAll('script[src*="live-pip-placeholder"]');
        if (scripts.length) {
            var src = scripts[scripts.length - 1].getAttribute("src") || "";
            base = src.replace(/live-pip-placeholder\.js.*$/, "").replace(/js-web\/?$/, "css-web/");
            if (base.indexOf("css-web") < 0) base = "../css-web/";
        }
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = base + "live-pip-placeholder.css";
        link.setAttribute("data-fl-pip-placeholder-css", "1");
        document.head.appendChild(link);
    }

    function ensurePlaceholder(player, variant) {
        if (!player) return null;
        var existing = player.querySelector("[data-fl-pip-placeholder]");
        if (existing) return existing;
        player.insertAdjacentHTML("afterbegin", variant === "tile" ? TILE_PLACEHOLDER_HTML : PLACEHOLDER_HTML);
        return player.querySelector("[data-fl-pip-placeholder]");
    }

    function isPipActive(cfg) {
        cfg = cfg || {};
        if (cfg.localPipWin && cfg.localPipWin.classList.contains("open")) return true;
        if (cfg.checkHostPip !== false && readHostPip()) return true;
        if (cfg.checkViewerPip !== false && readViewerPip()) return true;
        if (typeof cfg.isActiveFn === "function" && cfg.isActiveFn()) return true;
        return false;
    }

    function hookGlobalPipClose(cfg) {
        var node = document.getElementById("flGlobalLivePip");
        if (!node) return;
        var btnClose = node.querySelector("[data-pip-close]");
        if (btnClose && !btnClose.dataset.flPipHooked) {
            btnClose.dataset.flPipHooked = "1";
            btnClose.addEventListener("click", function () {
                setTimeout(function () {
                    sync(cfg);
                }, 0);
            });
        }
    }

    function closeAll(cfg) {
        if (cfg && cfg.localPipWin) cfg.localPipWin.classList.remove("open");
        if (global.FL_closeGlobalLivePip) {
            global.FL_closeGlobalLivePip();
        } else {
            try {
                localStorage.removeItem(VIEWER_KEY);
            } catch (e) {}
            var gp = document.getElementById("flGlobalLivePip");
            if (gp) gp.classList.remove("show");
        }
        if (global.HostLivePip && global.HostLivePip.deactivate) {
            global.HostLivePip.deactivate();
        }
    }

    function sync(cfg) {
        cfg = cfg || {};
        var player = qs(cfg.player);
        if (!player) return false;
        ensureCss();
        var placeholder =
            qs(cfg.placeholder, player) ||
            ensurePlaceholder(player, cfg.variant);
        var active = isPipActive(cfg);
        var activeClass = cfg.activeClass || "is-pip-active";

        player.classList.toggle(activeClass, active);
        if (cfg.pipBtn) {
            var btn = qs(cfg.pipBtn);
            if (btn) btn.classList.toggle("is-on", active);
        }
        if (placeholder) placeholder.hidden = !active;
        var sub = placeholder && placeholder.querySelector("[data-fl-pip-sub]");
        if (sub && cfg.subText) sub.textContent = cfg.subText;
        if (typeof cfg.onChange === "function") cfg.onChange(active);
        hookGlobalPipClose(cfg);
        return active;
    }

    function bind(cfg) {
        cfg = cfg || {};
        var player = qs(cfg.player);
        if (!player) return;

        var localPipWin = qs(cfg.localPipWin);
        var pipBtn = qs(cfg.pipBtn);
        var runtime = {
            player: player,
            localPipWin: localPipWin,
            pipBtn: pipBtn,
            placeholder: qs(cfg.placeholder),
            activeClass: cfg.activeClass || "is-pip-active",
            variant: cfg.variant,
            subText: cfg.subText,
            checkHostPip: cfg.checkHostPip,
            checkViewerPip: cfg.checkViewerPip,
            isActiveFn: cfg.isActiveFn,
            onChange: cfg.onChange
        };

        function toast(msg) {
            if (typeof cfg.toast === "function") cfg.toast(msg);
        }

        function openLocalPip() {
            if (!localPipWin) return;
            var pipBody = localPipWin.querySelector(".pip-body");
            var pipTitle = localPipWin.querySelector("[data-pip-title], .pip-hd > span, #ldAbPipTitle");
            if (typeof cfg.onLocalOpen === "function") cfg.onLocalOpen(localPipWin);
            else if (pipBody && player.style.backgroundImage) {
                pipBody.style.backgroundImage = player.style.backgroundImage;
            }
            if (pipTitle && typeof cfg.getTitle === "function") {
                pipTitle.textContent = cfg.getTitle();
            }
            localPipWin.classList.add("open");
            sync(runtime);
        }

        function restoreAll(msg) {
            closeAll(runtime);
            sync(runtime);
            if (msg) toast(msg);
            if (typeof cfg.onRestore === "function") cfg.onRestore();
        }

        if (pipBtn) {
            pipBtn.addEventListener("click", function () {
                if (isPipActive(runtime)) {
                    restoreAll(cfg.restoreToast || "已还原到大屏播放");
                    return;
                }
                var payload =
                    typeof cfg.getPayload === "function"
                        ? cfg.getPayload()
                        : { role: "viewer", active: true };
                if (payload && global.FL_openGlobalLivePip) {
                    global.FL_openGlobalLivePip(payload);
                    sync(runtime);
                    toast(cfg.openToast || "已开启悬浮窗，切换站内页面将持续显示");
                    return;
                }
                openLocalPip();
                toast(cfg.openToastLocal || "已开启悬浮窗");
            });
        }

        [cfg.pipClose, cfg.pipRestore, cfg.restoreBtn].forEach(function (sel) {
            var el = qs(sel);
            if (!el) return;
            el.addEventListener("click", function () {
                restoreAll(cfg.closeToast || "已关闭悬浮窗");
                if (sel === cfg.pipRestore && player.scrollIntoView) {
                    player.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            });
        });

        player.addEventListener("click", function (e) {
            var restore = e.target.closest("[data-fl-pip-restore]");
            if (!restore || !player.contains(restore)) return;
            e.preventDefault();
            restoreAll(cfg.restoreToast || "已还原到大屏播放");
        });

        window.addEventListener("storage", function (e) {
            if (e.key === VIEWER_KEY || e.key === HOST_KEY) sync(runtime);
        });
        window.addEventListener("fl-live-pip-change", function () {
            sync(runtime);
        });
        window.addEventListener("load", function () {
            sync(runtime);
        });
        setTimeout(function () {
            sync(runtime);
        }, 120);

        return {
            sync: function () {
                return sync(runtime);
            },
            close: function () {
                restoreAll();
            },
            isActive: function () {
                return isPipActive(runtime);
            }
        };
    }

    global.FLLivePipPlaceholder = {
        VIEWER_KEY: VIEWER_KEY,
        HOST_KEY: HOST_KEY,
        ensurePlaceholder: ensurePlaceholder,
        ensureCss: ensureCss,
        isActive: isPipActive,
        sync: sync,
        close: closeAll,
        bind: bind,
        readViewer: readViewerPip,
        readHost: readHostPip
    };
})(typeof window !== "undefined" ? window : this);
