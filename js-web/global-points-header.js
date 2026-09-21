/**
 * 全站顶栏 · 积分入口（与首页 #hPointsBtn 一致，各主导航页常驻）
 */
(function (global) {
    var LOADING = false;
    var QUEUED = [];

    function assetBase() {
        var scripts = global.document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src || '';
            if (src.indexOf('global-points-header') >= 0 || src.indexOf('app-sidebar-global') >= 0) {
                return src.replace(/\/js-web\/[^/]+$/, '/');
            }
        }
        return '../';
    }

    function ensureCss() {
        if (global.document.querySelector('link[data-fl-points-header-css]')) return;
        var link = global.document.createElement('link');
        link.rel = 'stylesheet';
        link.href = assetBase() + 'css-web/home-points.css';
        link.setAttribute('data-fl-points-header-css', '1');
        global.document.head.appendChild(link);
    }

    function paintPointsBtn(btn, totalFormatted, title) {
        if (!btn) return;
        if (global.FLPointsHeaderUi && global.FLPointsHeaderUi.paint) {
            global.FLPointsHeaderUi.paint(btn, totalFormatted, title);
            return;
        }
        btn.innerHTML =
            '<span class="ic"><i class="fa-solid fa-coins"></i></span>' +
            '<span class="val">' + totalFormatted + '</span>' +
            '<span class="sub">积分</span>';
        if (title) btn.title = title;
    }

    function renderBtn(data) {
        var btn = global.document.getElementById('hPointsBtn');
        var S = global.FLHomePoints;
        if (!btn || !S || !data || !data.wallet) return;
        var w = data.wallet;
        var total = S.getTotalPoints ? S.getTotalPoints(w) : (w.available || 0) + (w.frozen || 0);
        paintPointsBtn(
            btn,
            S.formatPoints(total),
            '总 ' + S.formatPoints(total) +
                ' · 可用 ' + S.formatPoints(w.available) +
                ' · 冷静中 ' + S.formatPoints(w.frozen)
        );
    }

    function refreshPointsHeader() {
        if (!global.FLHomePoints || !global.FLHomePoints.fetchPointsData) return;
        global.FLHomePoints.fetchPointsData().then(function (data) {
            renderBtn(data);
        });
    }

    function openDrawerBare() {
        var mask = global.document.getElementById('hpDrawerMask');
        var drawer = global.document.getElementById('hpDrawer');
        if (!mask || !drawer) return;
        mask.classList.add('is-open');
        drawer.classList.add('is-open');
        mask.setAttribute('aria-hidden', 'false');
        global.document.body.style.overflow = 'hidden';
    }

    function refreshAndOpenDrawer() {
        if (!global.FLHomePoints || !global.FLHomePoints.fetchPointsData) {
            openDrawerBare();
            return;
        }
        global.FLHomePoints.fetchPointsData().then(function (data) {
            if (global.FLProfilePointsUI && typeof global.FLProfilePointsUI.refreshAndOpen === 'function') {
                global.FLProfilePointsUI.refreshAndOpen(data);
                return;
            }
            if (global.FLHomePointsUI && typeof global.FLHomePointsUI.refreshAndOpen === 'function') {
                global.FLHomePointsUI.refreshAndOpen(data);
                return;
            }
            openDrawerBare();
        });
    }

    function openPointsCenter() {
        var mask = global.document.getElementById('hpDrawerMask');
        var drawer = global.document.getElementById('hpDrawer');
        if (mask && drawer) {
            refreshAndOpenDrawer();
            return;
        }
        if (global.FLGlobalPointsDrawer && typeof global.FLGlobalPointsDrawer.ensure === 'function') {
            global.FLGlobalPointsDrawer.ensure(function (ok) {
                if (!ok) return;
                refreshAndOpenDrawer();
            });
            return;
        }
        refreshAndOpenDrawer();
    }

    function ensureButton() {
        var header = global.document.querySelector('.app-header');
        if (!header) return null;
        var actions = header.querySelector('.h-actions');
        if (!actions) return null;

        var btn = global.document.getElementById('hPointsBtn');
        if (!btn) {
            btn = global.document.createElement('button');
            btn.type = 'button';
            btn.className = 'h-points';
            btn.id = 'hPointsBtn';
            btn.title = '我的积分';
            paintPointsBtn(btn, '—', '我的积分');
            var cta = actions.querySelector('.h-cta');
            if (cta) actions.insertBefore(btn, cta);
            else {
                var av = actions.querySelector('.h-avatar');
                if (av) actions.insertBefore(btn, av);
                else actions.appendChild(btn);
            }
        } else if (global.FLPointsHeaderUi && global.FLPointsHeaderUi.ensureDefault) {
            global.FLPointsHeaderUi.ensureDefault(btn);
        }

        if (btn.getAttribute('data-fl-points-bound') !== '1') {
            btn.setAttribute('data-fl-points-bound', '1');
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                openPointsCenter();
            });
        }
        return btn;
    }

    function loadScript(src, cb) {
        var s = global.document.createElement('script');
        s.src = src;
        s.onload = function () { if (cb) cb(); };
        s.onerror = function () { if (cb) cb(); };
        global.document.body.appendChild(s);
    }

    function ensurePointsStore(cb) {
        if (global.FLHomePoints) {
            cb();
            return;
        }
        QUEUED.push(cb);
        if (LOADING) return;
        LOADING = true;
        var base = assetBase() + 'js-web/';
        var chain = [
            base + 'invite-reward-config.js',
            base + 'points-tier-config.js',
            base + 'points-reward-service.js',
            base + 'home-points-store.js'
        ];
        var i = 0;
        function next() {
            if (i >= chain.length) {
                LOADING = false;
                var pending = QUEUED.slice();
                QUEUED = [];
                pending.forEach(function (fn) { fn(); });
                return;
            }
            loadScript(chain[i], function () {
                i += 1;
                next();
            });
        }
        next();
    }

    function apply() {
        if (!global.document.querySelector('.app-shell')) return;
        ensureCss();
        ensureButton();
        ensurePointsStore(refreshPointsHeader);
    }

    global.FLGlobalPointsHeader = {
        apply: apply,
        refresh: refreshPointsHeader,
        render: renderBtn,
        open: openPointsCenter
    };

    if (global.document.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', apply);
    } else {
        apply();
    }

    global.addEventListener('fl-points-data-change', function (e) {
        if (e.detail) renderBtn(e.detail);
    });
    global.addEventListener('goodfans-auth-change', function () {
        ensurePointsStore(refreshPointsHeader);
    });
})((typeof window !== 'undefined') ? window : this);
