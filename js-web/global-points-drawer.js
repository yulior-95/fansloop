/**
 * 全站积分抽屉 · 无 #hpDrawer 的页面动态注入（顶栏 #hPointsBtn 当前页打开）
 */
(function (global) {
    var LOADING = false;
    var QUEUED = [];

    function assetBase() {
        var scripts = global.document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src || '';
            if (src.indexOf('global-points-drawer') >= 0 || src.indexOf('global-points-header') >= 0 || src.indexOf('app-sidebar-global') >= 0) {
                return src.replace(/\/js-web\/[^/]+$/, '/');
            }
        }
        return '../';
    }

    function loadScript(src, cb) {
        if (global.document.querySelector('script[src="' + src + '"]')) {
            if (cb) cb();
            return;
        }
        var s = global.document.createElement('script');
        s.src = src;
        s.onload = function () { if (cb) cb(); };
        s.onerror = function () { if (cb) cb(); };
        global.document.body.appendChild(s);
    }

    function ensureToastHost() {
        if (global.document.getElementById('toastHostF')) return;
        var t = global.document.createElement('div');
        t.className = 'toast-host-f';
        t.id = 'toastHostF';
        global.document.body.appendChild(t);
    }

    function ensureDrawerDom() {
        if (global.document.getElementById('hpDrawer')) return;
        ensureToastHost();
        var frag = global.document.createElement('div');
        frag.innerHTML =
            '<div class="hp-drawer-mask" id="hpDrawerMask" aria-hidden="true"></div>' +
            '<aside class="hp-drawer" id="hpDrawer" aria-label="积分明细">' +
            '<div class="hp-drawer-head">' +
            '<div><h2><i class="fa-solid fa-coins"></i>积分中心</h2>' +
            '<p>查看可用/冷静积分、今日进度，以及各任务获取与消耗记录</p></div>' +
            '<button type="button" class="hp-drawer-close" id="hpDrawerClose" aria-label="关闭"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<div class="hp-drawer-summary"><div class="grid3">' +
            '<div class="cell avail"><div class="k">可用积分</div><div class="v" id="hpDrawerAvail">—</div></div>' +
            '<div class="cell frozen"><div class="k">冷静中</div><div class="v" id="hpDrawerFrozen">—</div></div>' +
            '<div class="cell today"><div class="k">今日已获</div><div class="v" id="hpDrawerToday">—</div></div>' +
            '</div></div>' +
            '<div class="hp-drawer-tabs">' +
            '<button type="button" class="active" data-tab="Tasks">赚积分任务</button>' +
            '<button type="button" data-tab="Ledger">获取明细</button>' +
            '</div>' +
            '<div class="hp-drawer-body">' +
            '<div class="hp-drawer-panel active" id="hpPanelTasks">' +
            '<div id="hpDrawerTasks"></div>' +
            '<p style="font-size:11px;color:var(--t-tertiary);margin-top:12px;line-height:1.5">' +
            '<i class="fa-solid fa-snowflake"></i> 邀请类奖励进入 7 天冷静期，期满转入可用积分方可兑换。</p>' +
            '<h4 style="font-size:12px;font-weight:700;margin:16px 0 8px;color:var(--t-secondary)">商城热门兑换</h4>' +
            '<div class="hp-mall-preview" id="hpMallPreview"></div></div>' +
            '<div class="hp-drawer-panel" id="hpPanelLedger">' +
            '<div id="hpDrawerLedger"></div>' +
            '<button type="button" class="btn btn-secondary btn-sm btn-block hp-drawer-ledger-full" id="hpDrawerGoLedger" style="margin-top:14px">' +
            '<i class="fa-solid fa-receipt"></i> 查看完整流水</button></div></div>' +
            '<div class="hp-drawer-foot">' +
            '<button type="button" class="btn btn-secondary" id="hpDrawerCloseFoot"><i class="fa-solid fa-xmark"></i> 关闭</button>' +
            '<button type="button" class="btn btn-primary" id="hpDrawerGoMall"><i class="fa-solid fa-store"></i> 积分商城</button>' +
            '</div></aside>';
        while (frag.firstChild) global.document.body.appendChild(frag.firstChild);
    }

    function ensureHomePointsController(cb) {
        if (global.FLHomePointsUI) {
            cb();
            return;
        }
        QUEUED.push(cb);
        if (LOADING) return;
        LOADING = true;
        var base = assetBase() + 'js-web/';
        function afterStore() {
            loadScript(base + 'points-ledger-modal.js', function () {
                loadScript(base + 'home-points.js', function () {
                    LOADING = false;
                    var pending = QUEUED.slice();
                    QUEUED = [];
                    pending.forEach(function (fn) { fn(); });
                });
            });
        }
        if (global.FLHomePoints) {
            afterStore();
            return;
        }
        loadScript(base + 'invite-reward-config.js', function () {
            loadScript(base + 'points-tier-config.js', function () {
                loadScript(base + 'points-reward-service.js', function () {
                    loadScript(base + 'home-points-store.js', afterStore);
                });
            });
        });
    }

    function ensure(cb) {
        if (!global.document.querySelector('.app-shell')) {
            if (cb) cb(false);
            return;
        }
        ensureDrawerDom();
        ensureHomePointsController(function () {
            if (cb) cb(true);
        });
    }

    global.FLGlobalPointsDrawer = {
        ensure: ensure,
        ensureDom: ensureDrawerDom
    };
})((typeof window !== 'undefined') ? window : this);
