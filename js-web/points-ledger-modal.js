/**
 * 积分流水 · 全站弹窗（home / profile 抽屉、积分商城余额区）
 */
(function (global) {
    var currentFilter = 'all';
    var overlay = null;

    function assetBase() {
        var scripts = global.document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src || '';
            if (src.indexOf('points-ledger-modal') >= 0 || src.indexOf('app-sidebar-global') >= 0) {
                return src.replace(/\/js-web\/[^/]+$/, '/');
            }
        }
        return '../';
    }

    function ensureCss() {
        if (global.document.querySelector('link[data-fl-points-ledger-modal-css]')) return;
        var link = global.document.createElement('link');
        link.rel = 'stylesheet';
        link.href = assetBase() + 'css-web/points-ledger-modal.css';
        link.setAttribute('data-fl-points-ledger-modal-css', '1');
        global.document.head.appendChild(link);
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function ensureOverlay() {
        if (overlay) return overlay;
        overlay = global.document.getElementById('pointsLedgerOverlay');
        if (overlay) return overlay;

        overlay = global.document.createElement('div');
        overlay.className = 'pm-overlay plm-overlay pm-overlay--ledger';
        overlay.id = 'pointsLedgerOverlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML =
            '<div class="pm-modal pm-modal--ledger" role="dialog" aria-modal="true" aria-labelledby="plModalTitle">' +
            '<div class="mh">' +
            '<h3 id="plModalTitle"><i class="fa-solid fa-receipt" style="color:#FBBF24;margin-right:8px"></i>积分获取与消耗明细</h3>' +
            '<button type="button" class="pm-modal-close" id="plModalClose" aria-label="关闭"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<div class="ledger-modal-body">' +
            '<p style="font-size:12px;color:var(--t-secondary);margin:0 0 12px;line-height:1.5">任务奖励、邀请冷静期、商城兑换与转盘消耗，与首页积分抽屉同源。</p>' +
            '<div class="pl-summary" id="plModalSummary"></div>' +
            '<div class="pl-filters" id="plModalFilters">' +
            '<button type="button" class="active" data-filter="all">全部</button>' +
            '<button type="button" data-filter="earn">获取</button>' +
            '<button type="button" data-filter="spend">消耗</button>' +
            '<button type="button" data-filter="frozen">冷静中</button>' +
            '</div>' +
            '<div class="ledger-table-scroll">' +
            '<table class="pl-table">' +
            '<thead><tr>' +
            '<th>时间</th><th>来源 / 用途</th><th>状态</th><th style="text-align:right">积分变动</th>' +
            '</tr></thead>' +
            '<tbody id="plModalTableBody"></tbody>' +
            '</table></div></div></div>';
        global.document.body.appendChild(overlay);

        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
            if (e.target.closest('#plModalClose, .pm-modal-close')) {
                e.preventDefault();
                close();
            }
        });

        var filters = overlay.querySelector('#plModalFilters');
        if (filters) {
            filters.addEventListener('click', function (e) {
                var btn = e.target.closest('button[data-filter]');
                if (!btn) return;
                currentFilter = btn.getAttribute('data-filter') || 'all';
                filters.querySelectorAll('button').forEach(function (b) {
                    b.classList.toggle('active', b === btn);
                });
                if (global.FLHomePoints) {
                    global.FLHomePoints.fetchPointsData().then(renderAll);
                }
            });
        }
        return overlay;
    }

    function statusLabel(row) {
        if (row.status === 'frozen') return '<span class="pl-status frozen">冷静中</span>';
        if (row.type === 'spend') return '<span class="pl-status spent">已消耗</span>';
        return '<span class="pl-status available">可用</span>';
    }

    function renderSummary(data) {
        var el = global.document.getElementById('plModalSummary');
        var S = global.FLHomePoints;
        if (!el || !S || !data.wallet) return;
        var w = data.wallet;
        el.innerHTML =
            '<div class="card avail"><div class="k">可用积分</div><div class="v">' + S.formatPoints(w.available) + '</div></div>' +
            '<div class="card frozen"><div class="k">冷静中</div><div class="v">' + S.formatPoints(w.frozen) + '</div></div>' +
            '<div class="card"><div class="k">今日已获</div><div class="v" style="color:#C084FC">' + S.formatPoints(w.todayEarned) + '</div></div>' +
            '<div class="card"><div class="k">今日上限</div><div class="v">' + S.formatPoints(w.todayCap) + '</div></div>';
    }

    function renderTable(data) {
        var el = global.document.getElementById('plModalTableBody');
        var S = global.FLHomePoints;
        if (!el || !S || !data.ledger) return;
        var rows = data.ledger.filter(function (r) {
            if (currentFilter === 'all') return true;
            if (currentFilter === 'earn') return r.type === 'earn';
            if (currentFilter === 'spend') return r.type === 'spend';
            if (currentFilter === 'frozen') return r.status === 'frozen';
            return true;
        });
        el.innerHTML = rows.map(function (r) {
            var cls = r.points > 0 ? 'plus' : 'minus';
            var txt = r.points > 0 ? '+' + S.formatPoints(r.points) : S.formatPoints(r.points);
            var note = r.status === 'frozen' && r.unfreezeAt
                ? ' · ' + escapeHtml(r.unfreezeAt) + ' 解冻'
                : '';
            return '<tr><td style="font-size:12px;color:var(--t-tertiary)">' + escapeHtml(r.time) + '</td>' +
                '<td><strong>' + escapeHtml(r.task) + '</strong>' +
                (note ? '<div style="font-size:11px;color:var(--t-tertiary);margin-top:2px">' + note + '</div>' : '') +
                '</td><td>' + statusLabel(r) + '</td>' +
                '<td style="text-align:right" class="pl-amt ' + cls + '">' + txt + '</td></tr>';
        }).join('');
    }

    function renderAll(data) {
        renderSummary(data);
        renderTable(data);
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
        if (global.FLGlobalPointsHeader && typeof global.FLGlobalPointsHeader.apply === 'function') {
            var base = assetBase() + 'js-web/';
            var chain = [
                base + 'invite-reward-config.js',
                base + 'points-tier-config.js',
                base + 'points-reward-service.js',
                base + 'home-points-store.js'
            ];
            var i = 0;
            function next() {
                if (i >= chain.length) { cb(); return; }
                loadScript(chain[i], function () { i += 1; next(); });
            }
            next();
            return;
        }
        cb();
    }

    function open() {
        ensureCss();
        ensureOverlay();
        ensurePointsStore(function () {
            if (!global.FLHomePoints) return;
            global.FLHomePoints.fetchPointsData().then(function (data) {
                renderAll(data);
                overlay.classList.add('show');
                overlay.setAttribute('aria-hidden', 'false');
                global.document.body.classList.add('pl-ledger-modal-open');
                if (global.FLWebIcons && typeof global.FLWebIcons.refresh === 'function') {
                    global.FLWebIcons.refresh(overlay);
                }
            });
        });
    }

    function close() {
        if (!overlay) return;
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
        global.document.body.classList.remove('pl-ledger-modal-open');
    }

    function bindLedgerLinks() {
        global.document.addEventListener('click', function (e) {
            var link = e.target.closest('.pm-balance-ledger-link');
            if (!link) return;
            e.preventDefault();
            open();
        });
    }

    global.document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (overlay && overlay.classList.contains('show')) close();
    });

    global.FLPointsLedgerModal = { open: open, close: close };

    function boot() {
        if (!global.document.querySelector('.app-shell')) return;
        ensureCss();
        bindLedgerLinks();
    }

    if (global.document.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})((typeof window !== 'undefined') ? window : this);
