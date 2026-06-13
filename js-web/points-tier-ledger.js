/**
 * 积分流水页 · 分层加成列增强（独立脚本，不改动页内交互逻辑）
 */
(function () {
    var T = window.FLPointsTier;
    var S = window.FLHomePoints;
    if (!T || !S) return;

    function injectColumnHeader() {
        var headRow = document.querySelector('.pl-table thead tr');
        if (!headRow || headRow.querySelector('.pt-th-tier')) return;
        var th = document.createElement('th');
        th.className = 'pt-th-tier';
        th.style.textAlign = 'right';
        th.textContent = '分层加成';
        var last = headRow.querySelector('th:last-child');
        headRow.insertBefore(th, last);
    }

    function augmentTableBody() {
        var tbody = document.getElementById('plTableBody');
        if (!tbody) return;
        S.fetchPointsData().then(function (data) {
            injectColumnHeader();
            var rows = tbody.querySelectorAll('tr');
            var ledger = data.ledger;
            var filterFn = function () { return true; };
            var activeBtn = document.querySelector('#plFilters button.active');
            var f = activeBtn && activeBtn.getAttribute('data-filter');
            if (f === 'earn') filterFn = function (r) { return r.type === 'earn'; };
            if (f === 'spend') filterFn = function (r) { return r.type === 'spend'; };
            if (f === 'frozen') filterFn = function (r) { return r.status === 'frozen'; };
            var visible = ledger.filter(filterFn);

            rows.forEach(function (tr, i) {
                if (tr.querySelector('.pt-tier-col')) return;
                var row = visible[i];
                var td = document.createElement('td');
                td.className = 'pt-tier-col';
                if (row && row.type === 'earn' && row.tierMultiplier > 1) {
                    td.innerHTML = T.formatMultiplier(row.tierMultiplier) +
                        '<div class="pt-tier-sub">基础 ' + S.formatPoints(row.basePoints || row.points) + '</div>';
                } else {
                    td.innerHTML = '<span style="color:var(--t-quaternary)">—</span>';
                }
                var amtCell = tr.querySelector('td:last-child');
                tr.insertBefore(td, amtCell);
            });
        });
    }

    function boot() {
        setTimeout(augmentTableBody, 150);
        var filters = document.getElementById('plFilters');
        if (filters) {
            filters.addEventListener('click', function () {
                setTimeout(augmentTableBody, 200);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
