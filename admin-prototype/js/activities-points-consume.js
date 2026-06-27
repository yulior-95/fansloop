(function () {
    var Store = window.FLPointsConsumeStore;
    var M = window.AdminModal;
    if (!Store) return;

    var tbody = document.getElementById('conTableBody');
    var filterBtn = document.getElementById('conSceneFilterBtn');
    var filterPanel = document.getElementById('conSceneFilterPanel');
    var filterLabel = document.getElementById('conSceneFilterLabel');
    var sceneChecks = document.querySelectorAll('.js-con-scene');
    var allRows = [];

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function fmtPoints(n) {
        var v = Number(n);
        return (v > 0 ? '+' : '') + v.toLocaleString('zh-CN');
    }

    function fmtBalance(n) {
        return Number(n).toLocaleString('zh-CN');
    }

    function renderRow(row) {
        return '<tr data-scene="' + esc(row.consumeScene) + '">' +
            '<td>' + esc(row.time) + '</td>' +
            '<td>' + esc(row.uid) + '</td>' +
            '<td><div class="con-ctx-main">' + esc(row.ruleName) + '</div>' +
            '<div class="con-ctx-sub">' + esc(Store.formatRuleSub(row)) + '</div></td>' +
            '<td style="color:#ff4d4f;font-weight:600">' + fmtPoints(row.points) + '</td>' +
            '<td>' + fmtBalance(row.balanceAvailable) + '</td>' +
            '<td>' + fmtBalance(row.balanceTotal) + '</td>' +
            '<td>' + esc(Store.CONSUME_SCENES[row.consumeScene].label) + '</td>' +
            '<td><div class="con-ctx-sub" style="margin:0">' + esc(Store.formatRef(row)) + '</div></td>' +
            '</tr>';
    }

    function renderTable(rows) {
        if (!tbody) return;
        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">暂无消耗记录</td></tr>';
            return;
        }
        tbody.innerHTML = rows.map(renderRow).join('');
    }

    function getSelectedScenes() {
        return Array.prototype.filter.call(sceneChecks, function (el) { return el.checked; })
            .map(function (el) { return el.value; });
    }

    function updateFilterLabel() {
        var checked = getSelectedScenes();
        var total = sceneChecks.length;
        if (!checked.length || checked.length === total) {
            filterLabel.textContent = '全部消耗场景';
            return;
        }
        if (checked.length === 1) {
            filterLabel.textContent = Store.CONSUME_SCENES[checked[0]].label;
            return;
        }
        filterLabel.textContent = '已选 ' + checked.length + ' 个场景';
    }

    function setPanelOpen(open) {
        filterPanel.classList.toggle('is-open', open);
        filterBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function applyFilter() {
        var selected = getSelectedScenes();
        var uid = (document.getElementById('conUid').value || '').trim();
        var filtered = allRows.filter(function (row) {
            if (selected.length && selected.indexOf(row.consumeScene) === -1) return false;
            if (uid && String(row.uid).indexOf(uid) === -1) return false;
            return true;
        });
        renderTable(filtered);
    }

    filterBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        setPanelOpen(!filterPanel.classList.contains('is-open'));
    });
    filterPanel.addEventListener('click', function (e) { e.stopPropagation(); });
    sceneChecks.forEach(function (el) {
        el.addEventListener('change', updateFilterLabel);
    });
    document.addEventListener('click', function () { setPanelOpen(false); });

    document.getElementById('qCon').addEventListener('click', function () {
        applyFilter();
        M.toast('已按筛选条件查询（原型）');
    });

    document.getElementById('expCon').addEventListener('click', function () {
        if (!window.AdminExport) return;
        AdminExport.confirm({
            title: '导出积分消耗流水',
            body: '<p style="margin:0">含消耗场景、活动编码、关联对象、订单号等字段，导出 Excel。</p>',
            exportType: '消耗流水',
            sourcePage: 'activities-points-consume.html',
            conditionsText: '筛选条件：' + filterLabel.textContent
        });
    });

    Store.fetchLedger().then(function (rows) {
        allRows = rows;
        renderTable(rows);
        updateFilterLabel();
    });
})();
