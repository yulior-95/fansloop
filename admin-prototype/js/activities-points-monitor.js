(function () {
    var Store = window.FLAdminPointsTier;
    var M = window.AdminModal;
    if (!Store) return;

    function fmt(n) { return Number(n).toLocaleString('zh-CN'); }

    function render(data) {
        var pct = data.todayBudget ? Math.round((data.todayIssued / data.todayBudget) * 100) : 0;
        document.getElementById('monStats').innerHTML =
            '<div class="pt-mon-stat"><div class="k">今日发放总量</div><div class="v">' + fmt(data.todayIssued) +
            ' <span style="font-size:13px;color:rgba(0,0,0,.45)">/ ' + fmt(data.todayBudget) + ' (' + pct + '%)</span></div></div>' +
            '<div class="pt-mon-stat"><div class="k">命中分层用户占比</div><div class="v" style="color:#1890ff">' + data.tierUserPct + '%</div></div>' +
            '<div class="pt-mon-stat"><div class="k">平均加成倍率</div><div class="v" style="color:#52c41a">×' + data.avgMultiplier + '</div></div>' +
            '<div class="pt-mon-stat"><div class="k">异常 / 触顶</div><div class="v" style="color:#fa541c">' + data.anomalyCount + '</div></div>';

        document.getElementById('monPie').innerHTML =
            '<div class="pt-mon-pie">' + data.ruleContribution.map(function (r) {
                return '<span class="slice">' + r.label + ' ' + r.pct + '% · +' + fmt(r.points) + '</span>';
            }).join('') + '</div>';

        document.getElementById('monTrend').innerHTML =
            '<table style="width:100%;font-size:12px"><thead><tr><th>日期</th><th>基础发放</th><th>加成部分</th></tr></thead><tbody>' +
            data.trend7d.map(function (d) {
                return '<tr><td>' + d.date + '</td><td>' + fmt(d.base) + '</td><td style="color:#52c41a">+' + fmt(d.bonus) + '</td></tr>';
            }).join('') + '</tbody></table>';

        document.getElementById('monTableBody').innerHTML = data.recentIssues.map(function (r) {
            var tag = r.status === 'capped'
                ? '<span class="ant-tag ant-tag-orange">触顶</span>'
                : '<span class="ant-tag ant-tag-green">正常</span>';
            return '<tr data-id="' + r.uid + '-' + r.time + '">' +
                '<td>' + r.time + '</td><td>' + r.uid + '</td><td>' + r.rule + '</td>' +
                '<td>+' + r.base + '</td><td>×' + r.multiplier + '</td><td><strong>+' + r.final + '</strong></td>' +
                '<td>' + tag + '</td>' +
                '<td><button type="button" class="ant-btn ant-btn-link ant-btn-sm js-mon-detail">详情</button></td></tr>';
        }).join('');
    }

    function load() {
        Store.fetchMonitor().then(render);
    }

    document.getElementById('btnRefreshMon').addEventListener('click', function () {
        load();
        M.toast('监控数据已刷新（原型 Mock）');
    });

    document.getElementById('monTableBody').addEventListener('click', function (e) {
        if (!e.target.classList.contains('js-mon-detail')) return;
        var tr = e.target.closest('tr');
        M.open({
            title: '发放明细 · 分层拆解',
            body: '<pre style="margin:0;font-size:12px;background:#fafafa;padding:12px;border-radius:6px">' +
                'basePoints: ' + tr.children[3].textContent + '\n' +
                'tierMultiplier: ' + tr.children[4].textContent + '\n' +
                'finalPoints: ' + tr.children[5].textContent + '\n' +
                'tierBreakdown: 见分层配置命中规则\n' +
                'idempotency_key: ik_' + Math.random().toString(36).slice(2, 8) +
                '</pre>',
            footer: [{ text: '关闭', primary: true, onClick: M.close }]
        });
    });

    load();
})();
