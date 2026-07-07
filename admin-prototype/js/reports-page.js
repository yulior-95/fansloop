/**
 * 报表统计 · 核心概览 / 用户数据 / 内容数据
 * 图表：Ant Design Charts（@antv/g2plot，与 @ant-design/charts 同源，便于 React 迁移）
 */
(function () {
  var M = window.AdminModal;
  if (!M) return;

  var G2 = window.G2Plot;
  var charts = {};
  var DAYS = ['5/5', '5/6', '5/7', '5/8', '5/9', '5/10', '5/11'];

  var COLORS = ['#1677ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];

  var OVERVIEW_ROWS = [
    { date: '2026-05-11', reg: 1284, dau: 48200, recharge: '¥ 620k', withdraw: '¥ 210k', subs: 312, passRate: '92.4%' },
    { date: '2026-05-10', reg: 1142, dau: 46700, recharge: '¥ 580k', withdraw: '¥ 198k', subs: 288, passRate: '91.1%' },
    { date: '2026-05-09', reg: 1003, dau: 45100, recharge: '¥ 560k', withdraw: '¥ 185k', subs: 265, passRate: '90.8%' },
    { date: '2026-05-08', reg: 950, dau: 44500, recharge: '¥ 540k', withdraw: '¥ 172k', subs: 241, passRate: '91.5%' },
    { date: '2026-05-07', reg: 880, dau: 44000, recharge: '¥ 500k', withdraw: '¥ 168k', subs: 228, passRate: '90.2%' }
  ];

  var USER_ROWS = [
    { date: '2026-05-11', reg: 1284, dau: 48200, mau: 312000, ret1: '42.6%', ret7: '18.3%', creators: 86, kyc: 412, paid: 3840 },
    { date: '2026-05-10', reg: 1142, dau: 46700, mau: 308500, ret1: '41.8%', ret7: '17.9%', creators: 72, kyc: 388, paid: 3712 },
    { date: '2026-05-09', reg: 1003, dau: 45100, mau: 305200, ret1: '41.2%', ret7: '17.5%', creators: 68, kyc: 356, paid: 3620 },
    { date: '2026-05-08', reg: 950, dau: 44500, mau: 301800, ret1: '40.9%', ret7: '17.2%', creators: 61, kyc: 340, paid: 3588 },
    { date: '2026-05-07', reg: 880, dau: 44000, mau: 298600, ret1: '40.5%', ret7: '16.8%', creators: 55, kyc: 318, paid: 3510 }
  ];

  var CONTENT_ROWS = [
    { date: '2026-05-11', total: 4820, video: 2140, post: 1680, live: 186, autoPass: '92.4%', manual: 37, blocked: 128, interact: '186k' },
    { date: '2026-05-10', total: 4510, video: 1980, post: 1590, live: 172, autoPass: '91.1%', manual: 42, blocked: 141, interact: '172k' },
    { date: '2026-05-09', total: 4380, video: 1920, post: 1540, live: 168, autoPass: '90.8%', manual: 48, blocked: 156, interact: '165k' },
    { date: '2026-05-08', total: 4210, video: 1850, post: 1480, live: 160, autoPass: '91.5%', manual: 35, blocked: 119, interact: '158k' },
    { date: '2026-05-07', total: 4050, video: 1780, post: 1420, live: 152, autoPass: '90.2%', manual: 51, blocked: 163, interact: '149k' }
  ];

  function fmt(n) {
    return Number(n).toLocaleString('zh-CN');
  }

  function esc(s) {
    return M.esc(s == null ? '' : String(s));
  }

  function destroyChart(key) {
    if (charts[key]) {
      charts[key].destroy();
      charts[key] = null;
    }
  }

  function baseConfig(extra) {
    var cfg = {
      autoFit: true,
      padding: 'auto',
      legend: { position: 'bottom' },
      animation: false,
      theme: { styleSheet: { brandColor: COLORS[0], paletteQualitative10: COLORS } }
    };
    if (!extra) return cfg;
    Object.keys(extra).forEach(function (k) { cfg[k] = extra[k]; });
    return cfg;
  }

  function mountPlot(key, el, PlotCtor, config) {
    destroyChart(key);
    if (!G2 || !PlotCtor || !el) return;
    charts[key] = new PlotCtor(el, config);
    charts[key].render();
  }

  function longSeries(days, seriesMap) {
    var rows = [];
    Object.keys(seriesMap).forEach(function (name) {
      seriesMap[name].forEach(function (val, i) {
        rows.push({ day: days[i], type: name, value: val });
      });
    });
    return rows;
  }

  function initTabs() {
    var bar = document.getElementById('repTabs');
    if (!bar) return;
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-tab]');
      if (!btn) return;
      var tab = btn.getAttribute('data-tab');
      bar.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      document.querySelectorAll('.admin-tab-panel').forEach(function (p) {
        p.classList.toggle('active', p.id === tab);
      });
      if (window.AdminMetricTip && AdminMetricTip.hidePortal) AdminMetricTip.hidePortal();
      setTimeout(function () {
        if (tab === 'tOverview') initOverviewCharts();
        if (tab === 'tUser') initUserCharts();
        if (tab === 'tContent') initContentCharts();
      }, 60);
    });
  }

  function renderOverviewTable() {
    var tbody = document.getElementById('repOverviewBody');
    if (!tbody) return;
    tbody.innerHTML = OVERVIEW_ROWS.map(function (r) {
      return '<tr>' +
        '<td>' + esc(r.date) + '</td>' +
        '<td>' + fmt(r.reg) + '</td>' +
        '<td>' + fmt(r.dau) + '</td>' +
        '<td>' + esc(r.recharge) + '</td>' +
        '<td>' + esc(r.withdraw) + '</td>' +
        '<td>' + fmt(r.subs) + '</td>' +
        '<td>' + esc(r.passRate) + '</td>' +
        '<td><button type="button" class="ant-btn ant-btn-link ant-btn-sm js-rep-row" data-kind="overview">详情</button></td>' +
        '</tr>';
    }).join('');
  }

  function renderUserTable() {
    var tbody = document.getElementById('repUserBody');
    if (!tbody) return;
    tbody.innerHTML = USER_ROWS.map(function (r) {
      return '<tr>' +
        '<td>' + esc(r.date) + '</td>' +
        '<td>' + fmt(r.reg) + '</td>' +
        '<td>' + fmt(r.dau) + '</td>' +
        '<td>' + fmt(r.mau) + '</td>' +
        '<td>' + esc(r.ret1) + '</td>' +
        '<td>' + esc(r.ret7) + '</td>' +
        '<td>' + fmt(r.creators) + '</td>' +
        '<td>' + fmt(r.kyc) + '</td>' +
        '<td>' + fmt(r.paid) + '</td>' +
        '<td><button type="button" class="ant-btn ant-btn-link ant-btn-sm js-rep-row" data-kind="user">详情</button></td>' +
        '</tr>';
    }).join('');
  }

  function renderContentTable() {
    var tbody = document.getElementById('repContentBody');
    if (!tbody) return;
    tbody.innerHTML = CONTENT_ROWS.map(function (r) {
      return '<tr>' +
        '<td>' + esc(r.date) + '</td>' +
        '<td>' + fmt(r.total) + '</td>' +
        '<td>' + fmt(r.video) + '</td>' +
        '<td>' + fmt(r.post) + '</td>' +
        '<td>' + fmt(r.live) + '</td>' +
        '<td>' + esc(r.autoPass) + '</td>' +
        '<td>' + fmt(r.manual) + '</td>' +
        '<td>' + fmt(r.blocked) + '</td>' +
        '<td>' + esc(r.interact) + '</td>' +
        '<td><button type="button" class="ant-btn ant-btn-link ant-btn-sm js-rep-row" data-kind="content">详情</button></td>' +
        '</tr>';
    }).join('');
  }

  function initOverviewCharts() {
    if (!G2) return;
    var DualAxes = G2.DualAxes;
    var Line = G2.Line;

    var regData = [900, 920, 880, 950, 1000, 1100, 1284].map(function (v, i) {
      return { day: DAYS[i], reg: v };
    });
    var dauData = [42, 43, 44, 44.5, 45, 46.2, 48.2].map(function (v, i) {
      return { day: DAYS[i], dau: v };
    });

    mountPlot('ov1', document.getElementById('repOv1'), DualAxes, baseConfig({
      data: [regData, dauData],
      xField: 'day',
      yField: ['reg', 'dau'],
      geometryOptions: [
        { geometry: 'column', color: COLORS[0], columnWidthRatio: 0.45 },
        { geometry: 'line', color: COLORS[1], smooth: true, lineStyle: { lineWidth: 2 } }
      ],
      meta: {
        reg: { alias: '注册' },
        dau: { alias: 'DAU/1000' }
      },
      yAxis: {
        reg: { title: { text: '注册' } },
        dau: { title: { text: 'DAU/1000' } }
      }
    }));

    mountPlot('ov2', document.getElementById('repOv2'), Line, baseConfig({
      data: longSeries(DAYS, {
        '充值(万)': [52, 54, 50, 57, 58, 58, 62],
        '订阅收入(万)': [18, 19, 19.5, 20, 21, 21.5, 23]
      }),
      xField: 'day',
      yField: 'value',
      seriesField: 'type',
      smooth: true,
      color: [COLORS[0], COLORS[3]],
      point: { size: 3, shape: 'circle' }
    }));
  }

  function initUserCharts() {
    if (!G2) return;
    var Line = G2.Line;
    var Pie = G2.Pie;

    mountPlot('usr1', document.getElementById('repUsr1'), Line, baseConfig({
      data: longSeries(DAYS, {
        '新增注册': [820, 850, 880, 950, 1000, 1142, 1284],
        '次日留存%': [39.5, 40.1, 40.5, 40.9, 41.2, 41.8, 42.6],
        '7日留存%': [16.2, 16.5, 16.8, 17.2, 17.5, 17.9, 18.3]
      }),
      xField: 'day',
      yField: 'value',
      seriesField: 'type',
      smooth: true,
      color: [COLORS[0], COLORS[1], COLORS[6]],
      point: { size: 3 }
    }));

    mountPlot('usr2', document.getElementById('repUsr2'), Pie, baseConfig({
      data: [
        { type: '普通粉丝', value: 68.4 },
        { type: '认证创作者', value: 4.2 },
        { type: '付费订阅用户', value: 12.8 },
        { type: '未转化访客', value: 14.6 }
      ],
      angleField: 'value',
      colorField: 'type',
      radius: 0.9,
      innerRadius: 0.62,
      color: COLORS,
      label: {
        type: 'outer',
        content: '{name}\n{percentage}'
      },
      statistic: {
        title: { content: '用户结构' },
        content: { content: '100%' }
      },
      legend: { position: 'right' },
      interactions: [{ type: 'element-active' }]
    }));
  }

  function initContentCharts() {
    if (!G2) return;
    var Column = G2.Column;
    var Pie = G2.Pie;
    var Bar = G2.Bar;

    mountPlot('cnt1', document.getElementById('repCnt1'), Column, baseConfig({
      data: longSeries(DAYS, {
        '短视频': [1520, 1580, 1650, 1780, 1850, 1980, 2140],
        '图文帖子': [1280, 1320, 1360, 1420, 1480, 1590, 1680],
        '直播场次': [128, 135, 142, 152, 160, 172, 186]
      }),
      xField: 'day',
      yField: 'value',
      seriesField: 'type',
      isGroup: true,
      color: [COLORS[3], COLORS[0], COLORS[6]],
      columnWidthRatio: 0.55
    }));

    mountPlot('cnt2', document.getElementById('repCnt2'), Pie, baseConfig({
      data: [
        { type: '短视频', value: 44.4 },
        { type: '图文帖子', value: 34.8 },
        { type: '直播回放', value: 12.6 },
        { type: '评论/弹幕', value: 8.2 }
      ],
      angleField: 'value',
      colorField: 'type',
      radius: 0.9,
      color: [COLORS[3], COLORS[0], COLORS[4], COLORS[2]],
      label: {
        type: 'spider',
        content: '{name}\n{percentage}'
      },
      legend: { position: 'right' },
      interactions: [{ type: 'element-active' }]
    }));

    mountPlot('cnt3', document.getElementById('repCnt3'), Bar, baseConfig({
      data: [
        { stage: '机审通过', value: 28420, color: COLORS[1] },
        { stage: '转人工', value: 312, color: COLORS[6] },
        { stage: '驳回/拦截', value: 948, color: '#ff4d4f' },
        { stage: '申诉成功', value: 86, color: COLORS[0] }
      ],
      xField: 'value',
      yField: 'stage',
      seriesField: 'stage',
      color: function (datum) { return datum.color; },
      legend: false,
      barStyle: { radius: [0, 4, 4, 0] },
      label: {
        position: 'right',
        formatter: function (datum) { return fmt(datum.value); }
      }
    }));
  }

  function resizeCharts() {
    var active = document.querySelector('.admin-tab-panel.active');
    if (!active) return;
    if (active.id === 'tOverview') initOverviewCharts();
    if (active.id === 'tUser') initUserCharts();
    if (active.id === 'tContent') initContentCharts();
  }

  function detailBody(kind, date) {
    if (kind === 'user') {
      return '<div class="rep-detail-grid">' +
        '<div><span class="k">日期</span><span class="v">' + esc(date) + '</span></div>' +
        '<div><span class="k">渠道拆分</span><span class="v">邀请 28% · 自然 52% · 广告 20%</span></div>' +
        '<div><span class="k">创作者入驻</span><span class="v">86 人（KYC 通过 74）</span></div>' +
        '<div><span class="k">活跃分层</span><span class="v">高活 12.4% · 中活 31.6% · 低活 56.0%</span></div>' +
        '<div><span class="k">付费转化</span><span class="v">注册→首充 3.8% · 订阅 2.1%</span></div>' +
        '</div>';
    }
    if (kind === 'content') {
      return '<div class="rep-detail-grid">' +
        '<div><span class="k">日期</span><span class="v">' + esc(date) + '</span></div>' +
        '<div><span class="k">审核漏斗</span><span class="v">提交 5,120 → 机审 4,728 → 人工 37 → 上线 4,691</span></div>' +
        '<div><span class="k">违规类型</span><span class="v">色情 42% · 广告 31% · 侵权 18% · 其他 9%</span></div>' +
        '<div><span class="k">互动指标</span><span class="v">点赞 128k · 评论 38k · 分享 12k · 完播率 41%</span></div>' +
        '<div><span class="k">人均消费</span><span class="v">浏览 8.6 条/人 · 时长 12.4 分钟</span></div>' +
        '</div>';
    }
    return '<p style="margin:0 0 8px">漏斗、渠道拆分、留存等下钻指标（原型占位）。</p>' +
      '<p style="margin:0;color:rgba(0,0,0,.45);font-size:13px">日期：' + esc(date) + '</p>';
  }

  function bindEvents() {
    document.getElementById('repCsv').addEventListener('click', function () {
      if (!window.AdminExport) return;
      var activeTab = document.querySelector('#repTabs button.active');
      var tabLabel = activeTab ? activeTab.textContent.trim() : '报表统计';
      AdminExport.confirm({
        title: '导出报表',
        body: '<p style="margin:0">按当前时间范围导出「' + esc(tabLabel) + '」聚合指标 Excel 表。</p>',
        exportType: '报表统计',
        sourcePage: 'reports.html',
        conditionsText: '时间范围：当前页选择范围 · 维度：' + tabLabel
      });
    });

    document.getElementById('repApply').addEventListener('click', function () {
      M.toast('时间范围已应用，图表将刷新（原型）');
      var active = document.querySelector('.admin-tab-panel.active');
      if (!active) return;
      if (active.id === 'tOverview') initOverviewCharts();
      if (active.id === 'tUser') initUserCharts();
      if (active.id === 'tContent') initContentCharts();
    });

    document.querySelector('main.admin-content').addEventListener('click', function (e) {
      if (!e.target.classList.contains('js-rep-row')) return;
      var tr = e.target.closest('tr');
      var date = tr.cells[0].textContent;
      var kind = e.target.getAttribute('data-kind') || 'overview';
      var titles = { overview: '经营日报', user: '用户日报', content: '内容日报' };
      M.open({
        title: (titles[kind] || '日报') + ' · ' + date,
        wide: true,
        body: detailBody(kind, date),
        footer: [{ text: '关闭', primary: true, onClick: M.close }]
      });
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCharts, 150);
    });
  }

  function init() {
    if (!G2) {
      console.warn('[reports] G2Plot 未加载，请检查 @antv/g2plot CDN');
      return;
    }
    if (window.AdminMetricTip) AdminMetricTip.bind();
    initTabs();
    renderOverviewTable();
    renderUserTable();
    renderContentTable();
    bindEvents();
    initOverviewCharts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
