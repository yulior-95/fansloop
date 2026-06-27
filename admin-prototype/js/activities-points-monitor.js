(function () {
    var Store = window.FLAdminPointsTier;
    var M = window.AdminModal;
    if (!Store) return;

    var tbody = document.getElementById('monTableBody');
    var pagerMount = document.getElementById('monPager');
    var pager = null;
    var lastIssues = [];
    var pieChart = null;
    var trendChart = null;

    var PIE_COLORS = ['#1677ff', '#52c41a', '#722ed1', '#fa8c16', '#13c2c2', '#eb2f96'];
    var TREND_DEFAULT_DAYS = 7;

    var STAT_TIPS = {
        issued: {
            calc: '自然日内全平台已发积分合计（基础分 + 分层加成）。分母为积分风控「今日全站积分发放预算」。',
            warn: '进度远超当前时间节奏（如下午已 ≥85%）、超过 100% 超预算、或全天发放量异常偏低。'
        },
        tierPct: {
            calc: '今日领取任务的用户中，至少命中一条分层规则并获得加成的用户占比。',
            warn: '无活动原因下突然飙高（如 >60%）或接近 0%，或与近 7 日基线偏差过大。'
        },
        multiplier: {
            calc: '所有命中分层的发放记录 effectiveMultiplier 加权平均值。',
            warn: '长期接近分层封顶（默认 ×1.5）或全局封顶（×1.65）；或命中占比高但倍率接近 ×1。'
        },
        anomaly: {
            calc: '今日发奖中触发 tierCapped / globalCapped / bonusCapped / dailyCapTrimmed 的次数合计。',
            warn: '数量突增、同一 UID 反复出现、或占发奖笔数比例明显升高。'
        }
    };

    function fmt(n) { return Number(n).toLocaleString('zh-CN'); }

    function statTipHtml(tip) {
        return '<span class="pt-field-tip pt-mon-stat-tip" tabindex="0" aria-label="指标说明">' +
            '<i class="fa-regular fa-circle-question"></i>' +
            '<span class="pt-field-tip-pop">' +
            '<span class="pt-mon-stat-tip-line"><strong>计算</strong> ' + tip.calc + '</span>' +
            '<span class="pt-mon-stat-tip-line"><strong>异常</strong> ' + tip.warn + '</span>' +
            '</span></span>';
    }

    function statCard(label, valueHtml, tipKey) {
        return '<div class="pt-mon-stat">' + statTipHtml(STAT_TIPS[tipKey]) +
            '<div class="k">' + label + '</div><div class="v">' + valueHtml + '</div></div>';
    }

    function renderStats(data) {
        var pct = data.todayBudget ? Math.round((data.todayIssued / data.todayBudget) * 100) : 0;
        document.getElementById('monStats').innerHTML =
            statCard('今日发放总量',
                fmt(data.todayIssued) + ' <span style="font-size:13px;color:rgba(0,0,0,.45)">/ ' +
                fmt(data.todayBudget) + ' (' + pct + '%)</span>', 'issued') +
            statCard('命中分层用户占比',
                '<span style="color:#1890ff">' + data.tierUserPct + '%</span>', 'tierPct') +
            statCard('平均加成倍率',
                '<span style="color:#52c41a">×' + data.avgMultiplier + '</span>', 'multiplier') +
            statCard('异常 / 触顶',
                '<span style="color:#fa541c">' + data.anomalyCount + '</span>', 'anomaly');
    }

    function ensureChart(el, existing) {
        if (!window.echarts || !el) return existing;
        if (existing) {
            existing.dispose();
        }
        return window.echarts.init(el);
    }

    function renderPie(data) {
        var el = document.getElementById('monPie');
        pieChart = ensureChart(el, pieChart);
        if (!pieChart) return;

        var seriesData = (data.ruleContribution || []).map(function (r, i) {
            return {
                name: r.label,
                value: r.points,
                itemStyle: { color: PIE_COLORS[i % PIE_COLORS.length] }
            };
        });

        pieChart.setOption({
            color: PIE_COLORS,
            tooltip: {
                trigger: 'item',
                formatter: function (p) {
                    var row = data.ruleContribution[p.dataIndex];
                    return p.name + '<br/>+' + fmt(p.value) + ' 积分（' + (row ? row.pct : p.percent) + '%）';
                }
            },
            legend: {
                type: 'scroll',
                orient: 'vertical',
                right: 8,
                top: 'middle',
                textStyle: { fontSize: 12 }
            },
            series: [{
                type: 'pie',
                radius: '68%',
                center: ['38%', '50%'],
                avoidLabelOverlap: true,
                itemStyle: { borderColor: '#fff', borderWidth: 2 },
                label: {
                    show: true,
                    formatter: '{b}\n{d}%',
                    fontSize: 11
                },
                labelLine: { length: 8, length2: 6 },
                data: seriesData
            }]
        }, true);
    }

    function renderTrend(data) {
        var el = document.getElementById('monTrend');
        trendChart = ensureChart(el, trendChart);
        if (!trendChart) return;

        var trend = data.trend7d || [];
        var dates = trend.map(function (d) { return d.date; });
        var baseData = trend.map(function (d) { return d.base; });
        var bonusData = trend.map(function (d) { return d.bonus; });
        var total = dates.length;
        var windowDays = Math.min(TREND_DEFAULT_DAYS, total);
        var startPct = total <= windowDays ? 0 : ((total - windowDays) / total) * 100;

        trendChart.setOption({
            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    var lines = [params[0].axisValue];
                    params.forEach(function (p) {
                        lines.push(p.marker + p.seriesName + '：' + fmt(p.value));
                    });
                    return lines.join('<br/>');
                }
            },
            legend: {
                data: ['基础发放', '加成部分'],
                top: 4,
                textStyle: { fontSize: 12 }
            },
            grid: { left: 56, right: 16, top: 40, bottom: 72 },
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: 0,
                    start: startPct,
                    end: 100,
                    height: 22,
                    bottom: 8,
                    borderColor: '#f0f0f0',
                    fillerColor: 'rgba(22,119,255,0.12)',
                    handleStyle: { color: '#1677ff' },
                    textStyle: { fontSize: 11 }
                },
                {
                    type: 'inside',
                    xAxisIndex: 0,
                    start: startPct,
                    end: 100
                }
            ],
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: dates,
                axisLabel: { fontSize: 11, color: 'rgba(0,0,0,0.45)' },
                axisLine: { lineStyle: { color: '#f0f0f0' } }
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    fontSize: 11,
                    color: 'rgba(0,0,0,0.45)',
                    formatter: function (v) { return v >= 1000 ? (v / 1000) + 'k' : v; }
                },
                splitLine: { lineStyle: { color: '#f5f5f5' } }
            },
            series: [
                {
                    name: '基础发放',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 6,
                    lineStyle: { width: 2, color: '#1677ff' },
                    itemStyle: { color: '#1677ff' },
                    areaStyle: { color: 'rgba(22,119,255,0.08)' },
                    data: baseData
                },
                {
                    name: '加成部分',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 6,
                    lineStyle: { width: 2, color: '#52c41a' },
                    itemStyle: { color: '#52c41a' },
                    data: bonusData
                }
            ]
        }, true);
    }

    function renderTable(pageIssues) {
        if (!tbody) return;
        if (!pageIssues.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">暂无发放记录</td></tr>';
            return;
        }
        tbody.innerHTML = pageIssues.map(function (r) {
            var tag = r.status === 'capped'
                ? '<span class="ant-tag ant-tag-orange">触顶</span>'
                : '<span class="ant-tag ant-tag-green">正常</span>';
            return '<tr>' +
                '<td>' + r.time + '</td><td>' + r.uid + '</td><td>' + r.rule + '</td>' +
                '<td>+' + r.base + '</td><td>×' + r.multiplier + '</td><td><strong>+' + r.final + '</strong></td>' +
                '<td>' + tag + '</td></tr>';
        }).join('');
    }

    function render(data) {
        renderStats(data);
        renderPie(data);
        renderTrend(data);

        lastIssues = data.recentIssues || [];
        if (pager) pager.setTotal(lastIssues.length);
        renderTable(pager ? pager.getSlice(lastIssues) : lastIssues);
    }

    function load() {
        Store.fetchMonitor().then(render);
    }

    function resizeCharts() {
        if (pieChart) pieChart.resize();
        if (trendChart) trendChart.resize();
    }

    if (pagerMount && window.AdminPager) {
        pager = window.AdminPager.create({
            mount: pagerMount,
            pageSize: 10,
            onChange: function () {
                if (lastIssues.length) {
                    renderTable(pager.getSlice(lastIssues));
                }
            }
        });
    }

    document.getElementById('btnRefreshMon').addEventListener('click', function () {
        if (pager) pager.resetPage();
        load();
        M.toast('监控数据已刷新（原型 Mock）');
    });

    window.addEventListener('resize', resizeCharts);
    load();
})();
