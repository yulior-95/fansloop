/**
 * 创作者收入页 · 账变筛选 / 来源分布周期 / 弹窗导出与规则 / 明细跳转
 */
(function () {
    var DIST_KEYS = ['sub', 'tip', 'live', 'ppv'];
    var DIST_COLORS = {
        sub: '#A855F7',
        tip: '#EC4899',
        live: '#10B981',
        ppv: '#3B82F6',
        gift: '#F59E0B'
    };

    var DIST_BY_PERIOD = {
        '7': {
            total: '291.18',
            sub: { am: '148.40 USDT', pc: '52.0%', pct: 52 },
            tip: { am: '79.96 USDT', pc: '28.0%', pct: 28 },
            live: { am: '39.98 USDT', pc: '14.0%', pct: 14 },
            ppv: { am: '17.13 USDT', pc: '6.0%', pct: 6 },
            gift: { am: '5.71 USDT', pc: '2.0%', pct: 2 }
        },
        '30': {
            total: '1,280.50',
            sub: { am: '640.25 USDT', pc: '50.0%', pct: 50 },
            tip: { am: '358.54 USDT', pc: '28.0%', pct: 28 },
            live: { am: '179.27 USDT', pc: '14.0%', pct: 14 },
            ppv: { am: '76.83 USDT', pc: '6.0%', pct: 6 },
            gift: { am: '25.61 USDT', pc: '2.0%', pct: 2 }
        },
        '90': {
            total: '3,899.03',
            sub: { am: '1,920.75 USDT', pc: '48.5%', pct: 48.5 },
            tip: { am: '1,107.84 USDT', pc: '28.0%', pct: 28 },
            live: { am: '553.92 USDT', pc: '14.0%', pct: 14 },
            ppv: { am: '237.39 USDT', pc: '6.0%', pct: 6 },
            gift: { am: '79.13 USDT', pc: '2.5%', pct: 2.5 }
        }
    };

    var CHART_PATHS = {
        '7': 'M0,150 Q40,130 80,118 T160,95 T240,70 T320,58 L320,180 L0,180 Z',
        '30': 'M0,140 Q30,120 60,108 T120,90 T180,72 T240,54 T320,36 L320,180 L0,180 Z',
        '90': 'M0,155 Q25,145 50,138 T100,120 T200,88 T280,62 T320,48 L320,180 L0,180 Z'
    };

    var CHART_LINES = {
        '7': 'M0,150 Q40,130 80,118 T160,95 T240,70 T320,58',
        '30': 'M0,140 Q30,120 60,108 T120,90 T180,72 T240,54 T320,36',
        '90': 'M0,155 Q25,145 50,138 T100,120 T200,88 T280,62 T320,48'
    };

    var CHART_X = {
        '7': ['4/19', '4/21', '4/23', '4/24', '4/25'],
        '30': ['4/1', '4/7', '4/14', '4/21', '4/25'],
        '90': ['2/1', '3/1', '3/15', '4/1', '4/25']
    };

    var CHART_PERIOD_LABELS = {
        '7': '近 7 天',
        '30': '近 30 天',
        '90': '近 90 天'
    };

    var ROW_TX = [
        { id: 'tx_sub_001', cat: 'sub' },
        { id: 'tx_tip_002', cat: 'tip' },
        { id: 'tx_live_003', cat: 'live' },
        { id: 'tx_sub_004', cat: 'sub' },
        { id: 'tx_tip_005', cat: 'tip' },
        { id: 'tx_sub_006', cat: 'sub' }
    ];

    var toastEl;
    var currentPeriod = '30';
    var currentFilter = 'all';

    function showToast(msg) {
        if (!toastEl) toastEl = document.getElementById('ciToast');
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
    }

    function openModal(page) {
        if (window.FL_openInteractionModal) {
            window.FL_openInteractionModal(page);
            return;
        }
        location.href = page;
    }

    function polarXY(cx, cy, r, deg) {
        var rad = (deg - 90) * Math.PI / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }

    function donutSlice(cx, cy, rOut, rIn, startDeg, endDeg) {
        var large = (endDeg - startDeg) > 180 ? 1 : 0;
        var p1 = polarXY(cx, cy, rOut, startDeg);
        var p2 = polarXY(cx, cy, rOut, endDeg);
        var p3 = polarXY(cx, cy, rIn, endDeg);
        var p4 = polarXY(cx, cy, rIn, startDeg);
        return [
            'M', p1.x.toFixed(2), p1.y.toFixed(2),
            'A', rOut, rOut, 0, large, 1, p2.x.toFixed(2), p2.y.toFixed(2),
            'L', p3.x.toFixed(2), p3.y.toFixed(2),
            'A', rIn, rIn, 0, large, 0, p4.x.toFixed(2), p4.y.toFixed(2),
            'Z'
        ].join(' ');
    }

    function highlightDistSegment(key) {
        var svg = document.getElementById('distPieSvg');
        if (svg) {
            svg.querySelectorAll('path[data-key]').forEach(function (p) {
                p.style.opacity = !key || p.getAttribute('data-key') === key ? '1' : '0.35';
            });
        }
        document.querySelectorAll('.dist-legend .dist-row').forEach(function (row) {
            row.classList.toggle('highlight', key && row.getAttribute('data-dist') === key);
            row.classList.toggle('dimmed', key && row.getAttribute('data-dist') !== key);
        });
    }

    function renderPieChart(period) {
        var data = DIST_BY_PERIOD[period];
        var svg = document.getElementById('distPieSvg');
        var totalEl = document.getElementById('distPieTotal');
        if (!data || !svg) return;
        if (totalEl) totalEl.textContent = data.total;
        var cx = 100;
        var cy = 100;
        var rOut = 88;
        var rIn = 54;
        var pctSum = DIST_KEYS.reduce(function (s, k) { return s + (data[k] ? data[k].pct : 0); }, 0) || 100;
        var cursor = 0;
        var html = '';
        DIST_KEYS.forEach(function (key) {
            var item = data[key];
            if (!item) return;
            var sweep = (item.pct / pctSum) * 360;
            var start = cursor;
            var end = cursor + sweep;
            cursor = end;
            html += '<path data-key="' + key + '" fill="' + DIST_COLORS[key] + '" d="' +
                donutSlice(cx, cy, rOut, rIn, start, end) + '"></path>';
        });
        svg.innerHTML = html;
        svg.querySelectorAll('path[data-key]').forEach(function (path) {
            var key = path.getAttribute('data-key');
            path.addEventListener('mouseenter', function () { highlightDistSegment(key); });
            path.addEventListener('mouseleave', function () { highlightDistSegment(null); });
            path.addEventListener('click', function () {
                var row = document.querySelector('.dist-legend .dist-row[data-dist="' + key + '"]');
                if (row) row.click();
            });
        });
        highlightDistSegment(null);
    }

    function syncDistPeriod(period) {
        currentPeriod = period;
        var data = DIST_BY_PERIOD[period];
        if (!data) return;
        DIST_KEYS.forEach(function (key) {
            var row = document.querySelector('.dist-legend .dist-row.' + key);
            if (!row || !data[key]) return;
            var am = row.querySelector('.am');
            var pcc = row.querySelector('.pcc');
            if (am) am.textContent = data[key].am;
            if (pcc) pcc.textContent = data[key].pc;
        });
        renderPieChart(period);
        var area = document.querySelector('.chart-svg path[fill^="url"]');
        var line = document.querySelector('.chart-svg path[stroke="#A855F7"]');
        if (area && CHART_PATHS[period]) area.setAttribute('d', CHART_PATHS[period]);
        if (line && CHART_LINES[period]) line.setAttribute('d', CHART_LINES[period]);
        var xWrap = document.querySelector('.chart-x');
        if (xWrap && CHART_X[period]) {
            xWrap.innerHTML = CHART_X[period].map(function (x) { return '<span>' + x + '</span>'; }).join('');
        }
        var periodLabel = document.getElementById('chartPeriodLabel');
        if (periodLabel) periodLabel.textContent = CHART_PERIOD_LABELS[period] || '近 30 天';
    }

    function bindPeriodTabs() {
        document.querySelectorAll('.dist-card .chart-tabs .ct').forEach(function (tab, idx) {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.dist-card .chart-tabs .ct').forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                var map = ['7', '30', '90'];
                syncDistPeriod(map[idx] || '30');
            });
        });
    }

    function rowCategory(row) {
        if (row.querySelector('.tag.sub')) return 'sub';
        if (row.querySelector('.tag.tip')) return 'tip';
        if (row.querySelector('.tag.live')) return 'live';
        if (row.querySelector('.tag.ppv') || row.querySelector('.tag.paid')) return 'paid';
        return 'all';
    }

    function applyListFilter(filter) {
        currentFilter = filter;
        var rows = document.querySelectorAll('.list-card .income-row');
        var visible = 0;
        rows.forEach(function (row) {
            var cat = rowCategory(row);
            var show = filter === 'all' || cat === filter;
            row.style.display = show ? '' : 'none';
            if (show) visible++;
        });
        if (filter !== 'all' && visible === 0) {
            showToast('当前筛选暂无匹配记录');
        }
    }

    function bindListTabs() {
        var map = { '全部': 'all', '订阅': 'sub', '打赏': 'tip', '直播': 'live', '付费': 'paid' };
        document.querySelectorAll('.list-card .fl-tabs .ft').forEach(function (tab) {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.list-card .fl-tabs .ft').forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                applyListFilter(map[tab.textContent.trim()] || 'all');
            });
        });
    }

    function bindIncomeRows() {
        var rows = document.querySelectorAll('.list-card .income-row');
        rows.forEach(function (row, i) {
            row.style.cursor = 'pointer';
            row.setAttribute('role', 'button');
            row.setAttribute('tabindex', '0');
            row.addEventListener('click', function () {
                var meta = ROW_TX[i] || { id: 'tx_income_' + (i + 1) };
                location.href = 'transaction-detail.html?id=' + encodeURIComponent(meta.id) + '&from=creator-income';
            });
            row.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); row.click(); }
            });
        });
    }

    function bindHeaderActions() {
        var bell = document.querySelector('.app-header .h-icon');
        if (bell) bell.addEventListener('click', function () { location.href = 'notifications.html?tab=unread'; });
        var avatar = document.querySelector('.app-header .h-avatar');
        if (avatar) {
            avatar.style.cursor = 'pointer';
            avatar.addEventListener('click', function () { location.href = 'profile.html'; });
        }
    }

    function bindPageHeadButtons() {
        var phBtns = document.querySelectorAll('.page-head .ph-r .btn');
        phBtns.forEach(function (btn) {
            if (btn.textContent.indexOf('导出') >= 0) {
                btn.removeAttribute('onclick');
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openModal('transactions-export.html?from=creator-income');
                });
            }
        });
    }

    function openRulesOverlay() {
        var overlay = document.getElementById('ciRulesOverlay');
        if (!overlay) return;
        overlay.classList.add('show');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeRulesOverlay() {
        var overlay = document.getElementById('ciRulesOverlay');
        if (!overlay) return;
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function bindRulesOverlay() {
        var overlay = document.getElementById('ciRulesOverlay');
        var btnOpen = document.getElementById('btnIncomeRules');
        if (btnOpen) {
            btnOpen.addEventListener('click', function (e) {
                e.preventDefault();
                openRulesOverlay();
            });
        }
        if (overlay) {
            overlay.addEventListener('click', function () { closeRulesOverlay(); });
        }
        var btnClose = document.getElementById('ciRulesClose');
        if (btnClose) btnClose.addEventListener('click', closeRulesOverlay);
        var btnTx = document.getElementById('ciRulesTx');
        if (btnTx) {
            btnTx.addEventListener('click', function () {
                closeRulesOverlay();
                location.href = 'transactions.html';
            });
        }
        var btnWd = document.getElementById('ciRulesWithdraw');
        if (btnWd) {
            btnWd.addEventListener('click', function () {
                closeRulesOverlay();
                location.href = 'withdraw-fiat.html';
            });
        }
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay && overlay.classList.contains('show')) {
                closeRulesOverlay();
            }
        });
    }

    function bindWithdrawCard() {
        var pending = document.querySelector('.withdraw-card .pending');
        if (pending) {
            pending.style.cursor = 'pointer';
            pending.addEventListener('click', function () {
                showToast('148.20 USDT 处于 1–3 天结算锁定期，到期后自动进入可提现余额');
            });
        }
    }

    function bindDeltaHints() {
        document.querySelectorAll('.total-card .delta.delta-action').forEach(function (delta) {
            delta.addEventListener('click', function () {
                var label = (delta.querySelector('.l') || {}).textContent || '';
                if (label.indexOf('订阅') >= 0) location.href = 'subscriptions.html';
            });
        });
    }

    function bindDistRows() {
        var labels = {
            sub: '付费订阅',
            tip: '粉丝打赏',
            live: '直播收入',
            ppv: '付费内容',
            gift: '私信礼物'
        };
        document.querySelectorAll('.dist-legend .dist-row').forEach(function (row) {
            var key = row.getAttribute('data-dist') || DIST_KEYS.find(function (k) { return row.classList.contains(k); });
            if (!key) return;
            row.style.cursor = 'pointer';
            row.addEventListener('mouseenter', function () { highlightDistSegment(key); });
            row.addEventListener('mouseleave', function () { highlightDistSegment(null); });
            row.addEventListener('click', function () {
                document.querySelectorAll('.list-card .fl-tabs .ft').forEach(function (t) {
                    t.classList.toggle('active', t.textContent.trim() === (key === 'sub' ? '订阅' : key === 'tip' ? '打赏' : key === 'live' ? '直播' : key === 'ppv' ? '付费' : '全部'));
                });
                if (key === 'gift') {
                    applyListFilter('all');
                    showToast('私信礼物收入已计入「打赏」类明细');
                    return;
                }
                if (key === 'ppv') applyListFilter('paid');
                else applyListFilter(key);
                document.querySelector('.list-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                showToast('已筛选：' + (labels[key] || ''));
            });
        });
    }

    function applyDeepLinks() {
        var params = new URLSearchParams(location.search);
        if (params.get('export') === 'open') openModal('transactions-export.html?from=creator-income');
        if (params.get('rules') === 'open') openRulesOverlay();
        var tab = params.get('tab');
        if (tab) {
            document.querySelectorAll('.list-card .fl-tabs .ft').forEach(function (t) {
                if (t.textContent.trim() === tab) t.click();
            });
        }
        var period = params.get('period');
        if (period) {
            var idx = { '7': 0, '30': 1, '90': 2 }[period];
            var tabs = document.querySelectorAll('.dist-card .chart-tabs .ct');
            if (tabs[idx]) tabs[idx].click();
        }
    }

    function init() {
        bindPeriodTabs();
        bindListTabs();
        bindIncomeRows();
        bindHeaderActions();
        bindPageHeadButtons();
        bindRulesOverlay();
        bindWithdrawCard();
        bindDeltaHints();
        bindDistRows();
        syncDistPeriod(currentPeriod);
        applyDeepLinks();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
