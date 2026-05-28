/**
 * 主播直播小窗 · 全站悬浮（localStorage 跨页保持）
 */
(function (global) {
    var KEY = "fansloop_host_pip";
    var CONSOLE_PATH = /create-live-host\.html$/;
    var COVER =
        "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80";

    function read() {
        try {
            var o = JSON.parse(localStorage.getItem(KEY) || "{}");
            return {
                active: !!o.active,
                paused: !!o.paused,
                title: o.title || "直播中",
                x: typeof o.x === "number" ? o.x : null,
                y: typeof o.y === "number" ? o.y : null
            };
        } catch (e) {
            return { active: false, paused: false, title: "直播中", x: null, y: null };
        }
    }

    function write(patch) {
        var cur = read();
        var next = Object.assign(cur, patch || {});
        try {
            localStorage.setItem(KEY, JSON.stringify(next));
        } catch (e) {}
        return next;
    }

    function isConsolePage() {
        return CONSOLE_PATH.test(location.pathname) || /create-live-host\.html/.test(location.href);
    }

    function getTitle() {
        if (global.LiveMetaStore && global.LiveMetaStore.read) {
            return global.LiveMetaStore.read().title || "直播中";
        }
        return read().title;
    }

    function mountPip() {
        var state = read();
        if (!state.active || isConsolePage()) {
            removePip();
            return;
        }
        if (document.getElementById("hostGlobalPip")) return;

        var pip = document.createElement("div");
        pip.id = "hostGlobalPip";
        pip.className = "host-global-pip" + (state.paused ? " is-paused" : "");
        pip.innerHTML =
            '<div class="hgp-hd" data-hgp-drag="1">' +
            '<span class="hgp-live"><span class="dot"></span><span class="lbl">LIVE</span></span>' +
            '<span class="hgp-title"></span>' +
            '<span class="hgp-hd-actions">' +
            '<button type="button" data-hgp-console title="回到控制台"><i class="fa-solid fa-up-right-and-down-left-from-center"></i></button>' +
            "</span></div>" +
            '<div class="hgp-video" data-hgp-console tabindex="0" role="button" aria-label="回到主播直播控制台">' +
            '<span class="hgp-hint">点击回到直播控制台</span></div>';

        var titleEl = pip.querySelector(".hgp-title");
        var video = pip.querySelector(".hgp-video");
        if (titleEl) titleEl.textContent = getTitle();
        if (video) video.style.backgroundImage = "url('" + COVER + "')";

        var right = 24;
        var bottom = 24;
        var w = 300;
        var h = pip.offsetHeight || 200;
        var left = state.x != null ? state.x : Math.max(8, window.innerWidth - w - right);
        var top = state.y != null ? state.y : Math.max(8, window.innerHeight - h - bottom);
        pip.style.left = left + "px";
        pip.style.top = top + "px";

        document.body.appendChild(pip);
        bindDrag(pip);
        bindActions(pip);
    }

    function removePip() {
        var el = document.getElementById("hostGlobalPip");
        if (el) el.parentNode.removeChild(el);
    }

    function goConsole() {
        var base =
            location.pathname.indexOf("/pages-web/") >= 0
                ? "create-live-host.html"
                : "pages-web/create-live-host.html";
        try {
            sessionStorage.setItem("fansloop_host_pip_return", "1");
        } catch (e) {}
        location.href = base;
    }

    function bindActions(pip) {
        pip.querySelectorAll("[data-hgp-console]").forEach(function (el) {
            el.addEventListener("click", function (e) {
                e.stopPropagation();
                goConsole();
            });

        });
    }

    function bindDrag(pip) {
        var handle = pip.querySelector("[data-hgp-drag]");
        if (!handle) return;
        var dragging = false;
        var startX = 0;
        var startY = 0;
        var origL = 0;
        var origT = 0;

        function onDown(e) {
            if (e.target.closest("button")) return;
            dragging = true;
            pip.classList.add("is-dragging");
            var ev = e.touches ? e.touches[0] : e;
            startX = ev.clientX;
            startY = ev.clientY;
            origL = pip.offsetLeft;
            origT = pip.offsetTop;
            e.preventDefault();
        }

        function onMove(e) {
            if (!dragging) return;
            var ev = e.touches ? e.touches[0] : e;
            var nl = origL + (ev.clientX - startX);
            var nt = origT + (ev.clientY - startY);
            nl = Math.max(0, Math.min(nl, window.innerWidth - pip.offsetWidth));
            nt = Math.max(0, Math.min(nt, window.innerHeight - pip.offsetHeight));
            pip.style.left = nl + "px";
            pip.style.top = nt + "px";
            pip.style.right = "auto";
            pip.style.bottom = "auto";
        }

        function onUp() {
            if (!dragging) return;
            dragging = false;
            pip.classList.remove("is-dragging");
            write({ x: pip.offsetLeft, y: pip.offsetTop });
        }

        handle.addEventListener("mousedown", onDown);
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        handle.addEventListener("touchstart", onDown, { passive: false });
        document.addEventListener("touchmove", onMove, { passive: false });
        document.addEventListener("touchend", onUp);
    }

    function syncConsoleStage() {
        var stage = document.getElementById("hostStage");
        if (!stage || !isConsolePage()) return;
        /* 在控制台页始终展示大画面；小窗仅在其他页面悬浮 */
        stage.classList.remove("is-pip-hidden");
    }

    function refreshPaused() {
        var state = read();
        var pip = document.getElementById("hostGlobalPip");
        if (pip) pip.classList.toggle("is-paused", state.paused);
    }

    global.HostLivePip = {
        read: read,
        activate: function (opts) {
            opts = opts || {};
            write({
                active: true,
                title: opts.title || getTitle(),
                paused: !!opts.paused
            });
            mountPip();
            syncConsoleStage();
        },
        deactivate: function () {
            write({ active: false, x: null, y: null });
            removePip();
            syncConsoleStage();
        },
        setPaused: function (paused) {
            write({ paused: !!paused });
            refreshPaused();
        },
        mount: mountPip,
        goConsole: goConsole,
        isActive: function () {
            return read().active;
        }
    };

    function boot() {
        mountPip();
        syncConsoleStage();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }

    window.addEventListener("storage", function (e) {
        if (e.key === KEY) boot();
    });
})(typeof window !== "undefined" ? window : this);
