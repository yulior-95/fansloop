/**
 * 首页仪表盘 · Ant Design Charts（@antv/g2plot）
 */
(function () {
  var G2 = window.G2Plot;
  var charts = {};
  var COLORS = ['#1677ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2'];

  var LABELS = ['4/28', '4/29', '4/30', '5/1', '5/2', '5/3', '5/4', '5/5', '5/6', '5/7', '5/8', '5/9', '5/10', '5/11'];
  var REG_DATA = [820, 932, 901, 934, 1290, 1330, 1320, 1450, 1502, 1620, 1701, 1820, 1902, 1984];
  var DAU_DATA = [12000, 13200, 12800, 14000, 15100, 16000, 15800, 17200, 18100, 19000, 20500, 21200, 22800, 24100];

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

  function initCharts() {
    if (!G2) return;
    var DualAxes = G2.DualAxes;
    var Pie = G2.Pie;

    var regData = REG_DATA.map(function (v, i) {
      return { day: LABELS[i], reg: v };
    });
    var dauData = DAU_DATA.map(function (v, i) {
      return { day: LABELS[i], dau: v };
    });

    mountPlot('trend', document.getElementById('chartTrend'), DualAxes, baseConfig({
      data: [regData, dauData],
      xField: 'day',
      yField: ['reg', 'dau'],
      geometryOptions: [
        { geometry: 'line', color: COLORS[0], smooth: true, lineStyle: { lineWidth: 2 } },
        { geometry: 'line', color: COLORS[1], smooth: true, lineStyle: { lineWidth: 2 } }
      ],
      meta: {
        reg: { alias: '注册量' },
        dau: { alias: 'DAU' }
      }
    }));

    mountPlot('pie', document.getElementById('chartPie'), Pie, baseConfig({
      data: [
        { type: '创作者订阅', value: 38 },
        { type: '付费直播 / PPV', value: 22 },
        { type: '链上充值手续费', value: 28 },
        { type: '打赏及其他', value: 12 }
      ],
      angleField: 'value',
      colorField: 'type',
      radius: 0.9,
      innerRadius: 0.58,
      color: COLORS,
      label: {
        type: 'outer',
        content: '{name}\n{percentage}'
      },
      statistic: {
        title: { content: '今日收入' },
        content: { content: '100%' }
      },
      interactions: [{ type: 'element-active' }]
    }));
  }

  function init() {
    if (window.AdminMetricTip) AdminMetricTip.bind();
    if (!G2) {
      console.warn('[dashboard] G2Plot 未加载');
      return;
    }
    initCharts();
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(initCharts, 150);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
