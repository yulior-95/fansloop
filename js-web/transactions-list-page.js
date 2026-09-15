(function () {
    'use strict';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function fmt(n) {
        return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function detailHref(tr) {
        if (!tr) return 'transaction-detail.html';
        var kind = tr.getAttribute('data-tx-kind');
        var order = tr.getAttribute('data-order');
        if (!kind) {
            var types = (tr.getAttribute('data-tx-type') || '').split(/\s+/);
            if (types.indexOf('digital') >= 0) kind = 'digital';
            else if (types.indexOf('affiliate') >= 0) kind = 'affiliate';
            else if (types.indexOf('chain') >= 0) kind = 'chain';
            else if (types.indexOf('recharge') >= 0) kind = 'recharge';
            else if (types.indexOf('withdraw') >= 0) kind = 'withdraw';
            else kind = 'sub';
        }
        if (!order) order = 'TXN' + Date.now();
        return (
            'transaction-detail.html?type=' +
            encodeURIComponent(kind) +
            '&order=' +
            encodeURIComponent(order) +
            '&from=transactions'
        );
    }

    function injectMallRows() {
        var body = document.getElementById('txTodayBody');
        if (!body) return;
        var html = '';
        try {
            if (window.DigitalAssetOrdersStore) {
                window.DigitalAssetOrdersStore.listEarnings().slice(0, 10).forEach(function (e) {
                    var oid = e.id || 'D' + Date.now();
                    html +=
                        '<tr data-tx-type="digital income" data-tx-kind="digital" data-order="' + esc(oid) + '">' +
                        '<td><div class="tx-cell-info"><div class="ic in"><i class="fa-solid fa-gem"></i></div>' +
                        '<div><div class="nm">数字资产销售</div><div class="meta">「' + esc(e.productTitle || '数字商品') + '」创作者实得</div></div></div></td>' +
                        '<td><span class="amt-pos">+ $' + fmt(e.amount) + '</span></td>' +
                        '<td><span class="tag tag-success">已结算</span></td>' +
                        '<td><span class="t-ter fs-12">' + esc((e.createdAt || '').slice(5) || '—') + '</span></td>' +
                        '<td><div class="row-action"><button type="button" title="查看详情"><i class="fa-solid fa-eye"></i></button></div></td></tr>';
                });
            }
            if (window.AffiliateShowcaseStore) {
                window.AffiliateShowcaseStore.listCommissions({
                    creatorId: window.AffiliateShowcaseStore.DEMO_CREATOR
                }).slice(0, 10).forEach(function (c) {
                    var oid = c.id || 'A' + Date.now();
                    html +=
                        '<tr data-tx-type="affiliate income" data-tx-kind="affiliate" data-order="' + esc(oid) + '">' +
                        '<td><div class="tx-cell-info"><div class="ic in"><i class="fa-solid fa-bag-shopping"></i></div>' +
                        '<div><div class="nm">联盟佣金回传</div><div class="meta">「' + esc(c.productTitle || '实体选品') + '」分成实得</div></div></div></td>' +
                        '<td><span class="amt-pos">+ $' + fmt(c.creatorShare) + '</span></td>' +
                        '<td><span class="tag tag-success">已结算</span></td>' +
                        '<td><span class="t-ter fs-12">' + esc((c.createdAt || '').slice(5) || '—') + '</span></td>' +
                        '<td><div class="row-action"><button type="button" title="查看详情"><i class="fa-solid fa-eye"></i></button></div></td></tr>';
                });
            }
        } catch (e) { /* ignore */ }
        if (html) body.insertAdjacentHTML('afterbegin', html);
    }

    function applyFilter(type) {
        type = type || 'all';
        document.querySelectorAll('#txFilterChips .fc').forEach(function (c) {
            c.classList.toggle('active', c.getAttribute('data-tx-type') === type);
        });
        document.querySelectorAll('tr[data-tx-type]').forEach(function (tr) {
            var types = (tr.getAttribute('data-tx-type') || '').split(/\s+/);
            var show = type === 'all' || types.indexOf(type) >= 0;
            tr.style.display = show ? '' : 'none';
        });
        document.querySelectorAll('.section-pill').forEach(function (pill) {
            var table = pill.nextElementSibling;
            if (!table || !table.classList.contains('tx-table')) return;
            var any = false;
            table.querySelectorAll('tr[data-tx-type]').forEach(function (tr) {
                if (tr.style.display !== 'none') any = true;
            });
            pill.style.display = any || type === 'all' ? '' : 'none';
            table.style.display = any || type === 'all' ? '' : 'none';
        });
    }

    function bindDetailNav() {
        var main = document.querySelector('.app-main');
        if (!main) return;
        main.addEventListener('click', function (e) {
            var btn = e.target.closest('.row-action button');
            if (btn) {
                var icon = btn.querySelector('i');
                if (icon && (icon.classList.contains('fa-eye') || icon.classList.contains('fa-up-right-from-square'))) {
                    e.preventDefault();
                    e.stopPropagation();
                    var tr = btn.closest('tr[data-tx-type]');
                    if (tr) location.href = detailHref(tr);
                }
                return;
            }
            var tr = e.target.closest('tr[data-tx-type][data-row-link]');
            if (tr && !e.target.closest('.row-action')) {
                location.href = detailHref(tr);
            }
        });
    }

    injectMallRows();
    bindDetailNav();

    var chips = document.getElementById('txFilterChips');
    if (chips) {
        chips.addEventListener('click', function (e) {
            var fc = e.target.closest('.fc');
            if (!fc) return;
            applyFilter(fc.getAttribute('data-tx-type') || 'all');
        });
    }

    var type = 'all';
    try {
        type = new URLSearchParams(location.search).get('type') || 'all';
    } catch (err) { /* ignore */ }
    if (type === 'digital' || type === 'affiliate') applyFilter(type);
})();
