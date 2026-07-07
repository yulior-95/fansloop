/**
 * 运营指标说明 · 数据来源 + 统计方式（hover 提示）
 * 气泡挂载到 body（fixed），避免 admin-content overflow 裁切。
 */
(function (global) {
  var PORTAL_ID = 'adminMetricTipPortal';
  var activeTip = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var TIPS = {
    todayReg: {
      source: 'users 用户表 · register_event 注册埋点',
      calc: '自然日 00:00–24:00（UTC+8）内 created_at 落今日的独立注册用户数；同一设备多账号各计 1；剔除运营后台手动创建与测试账号。'
    },
    todayDau: {
      source: 'behavior_event 行为埋点 · session 会话表',
      calc: '自然日内至少有一次有效活跃的独立 UID。有效活跃含 App/Web 打开、浏览 Feed、直播观看 ≥30s、发消息等；未登录访问、爬虫与内部测试流量不计入。'
    },
    todayRecharge: {
      source: 'orders_recharge 链上充值订单表',
      calc: '按订单 created_at 落在今日的 USDT 充值金额合计，含待确认与已到账。不含昨日创建今日到账的订单；credited_at 不参与本指标。'
    },
    pendingReview: {
      source: 'content_review_queue 人工审核队列表',
      calc: '当前状态为 pending_manual 且未分配或处理中的内容条数，实时快照；含帖子、短视频、评论与资料修改。'
    },
    chartTrend: {
      source: 'users 注册表 · behavior_event 日活聚合表',
      calc: '按自然日聚合近 14 日注册量与 DAU；注册取 created_at 计数，DAU 取日活去重 UID；T+1 凌晨 02:00 完成前一日封账。'
    },
    chartRevenue: {
      source: 'orders_subscription · orders_live · orders_recharge · ledger 账变流水',
      calc: '自然日 credited_at 落今日的已到账收入，按业务类型拆分占比；法币通道与内部调账不计入；「打赏及其他」为未单列杂项收入合计。'
    },
    repChartRegDau: {
      source: 'users 注册表 · dau_daily 日活汇总表',
      calc: '选定日期范围内按日聚合注册量与 DAU；DAU 折线展示为 DAU/1000 便于与注册柱图同屏对比。'
    },
    repChartGmv: {
      source: 'orders_recharge · orders_subscription · ledger',
      calc: '按日汇总链上充值与订阅收入（万 USDT）；充值按 created_at，订阅按到账时间；仅统计已确认到账订单。'
    },
    repTableCore: {
      source: 'users · orders_recharge · orders_withdraw · subscriptions · content_audit_log',
      calc: '按自然日聚合经营核心指标；机审通过率 = 机审通过数 /（机审通过 + 转人工 + 驳回）×100%，分母不含申诉中内容。'
    },
    totalUsers: {
      source: 'users 用户表',
      calc: '截至当前 status=active 的累计注册用户数；今日新增为自然日 created_at 落今日的数量。'
    },
    monthMau: {
      source: 'mau_monthly 月活汇总表 · behavior_event',
      calc: '自然月内至少一次有效活跃的独立 UID；月环比 =（本月截至今日 MAU − 上月同期 MAU）/ 上月同期 MAU。'
    },
    ret1: {
      source: 'retention_daily 留存汇总表',
      calc: '次日留存 = T 日注册用户中 T+1 日仍活跃占比；7 日留存 = T 日注册用户在 T+7 仍活跃占比；活跃口径同 DAU。'
    },
    creators: {
      source: 'creator_profile 创作者资料表',
      calc: 'creator_status=verified 的累计认证创作者数；今日入驻为今日通过创作者认证审核的独立用户数。'
    },
    kycPaid: {
      source: 'kyc_record · orders_recharge · subscriptions',
      calc: 'KYC 通过：今日 kyc_status 变为 approved 的用户数；付费用户：今日发生首充或订阅续费的去重 UID。'
    },
    repChartUserTrend: {
      source: 'users · retention_daily',
      calc: '按日展示新增注册、次日留存率与 7 日留存率；留存率为百分比，注册为绝对值，同图多轴展示。'
    },
    repChartUserStruct: {
      source: 'user_segment_snapshot 用户分层快照',
      calc: '按末次活跃身份归类占比；付费订阅与创作者身份重叠时去重计入付费侧；每日 00:30 刷新快照。'
    },
    repTableUser: {
      source: 'users · dau_daily · mau_monthly · creator_profile · kyc_record · paid_user_daily',
      calc: '按自然日聚合用户维度指标；MAU 为截至该日所在自然月的月活累计值（非当日 MAU）。'
    },
    todayContent: {
      source: 'content_post · content_video · live_session',
      calc: '自然日 published_at 落今日且 audit_status=published 的内容总条数；直播以场次计。'
    },
    videoPost: {
      source: 'content_video · content_post',
      calc: '今日新增短视频与图文帖子数量及占今日新增内容比例；草稿与审核中内容不计入。'
    },
    liveSessions: {
      source: 'live_session 直播场次表',
      calc: '自然日实际开播且时长 ≥5 分钟的场次；场均观看 = 今日直播累计观看人次 / 场次数。'
    },
    autoPassRate: {
      source: 'content_audit_log 内容审核日志',
      calc: '机审通过率 = auto_pass /（auto_pass + manual + rejected）×100%；转人工为今日进入人工队列且仍未结案的条数。'
    },
    blocked: {
      source: 'content_audit_log · sensitive_word_hit',
      calc: '今日 audit_result=rejected 的内容条数，含敏感词拦截、鉴黄未通过与侵权下架；申诉中未计入。'
    },
    interactTotal: {
      source: 'interaction_like · interaction_comment · interaction_share · tip_ledger',
      calc: '自然日发生的点赞、评论、分享与打赏行为次数合计；同一用户对同一内容重复点赞仅计 1 次。'
    },
    repChartContentTrend: {
      source: 'content_video · content_post · live_session',
      calc: '按日聚合短视频、图文帖子发布量与直播场次；均以 published_at 自然日归属。'
    },
    repChartContentType: {
      source: 'content 全量内容表 · interaction 互动表',
      calc: '选定时间范围内各类型内容数量占比；评论/弹幕按互动事件条数计入。'
    },
    repChartAuditFunnel: {
      source: 'content_audit_log',
      calc: '近 7 日审核各阶段累计量：机审通过、转人工、驳回/拦截、申诉成功重新上线；按审核流水去重计数。'
    },
    repTableContent: {
      source: 'content_* · content_audit_log · interaction_daily',
      calc: '按自然日聚合内容发布、审核与互动指标；互动量为当日点赞+评论+分享+打赏次数合计。'
    }
  };

  function popContentHtml(source, calc) {
    return '<span class="admin-metric-tip-line"><strong>数据来源</strong> ' + esc(source) + '</span>' +
      '<span class="admin-metric-tip-line"><strong>统计方式</strong> ' + esc(calc) + '</span>';
  }

  function ensurePortal() {
    var portal = document.getElementById(PORTAL_ID);
    if (portal) return portal;
    portal = document.createElement('div');
    portal.id = PORTAL_ID;
    portal.className = 'admin-metric-tip-portal';
    portal.setAttribute('role', 'tooltip');
    portal.hidden = true;
    document.body.appendChild(portal);
    return portal;
  }

  function hidePortal() {
    var portal = document.getElementById(PORTAL_ID);
    if (!portal) return;
    portal.hidden = true;
    portal.classList.remove('is-below');
    activeTip = null;
  }

  function showPortal(tipEl) {
    var portal = ensurePortal();
    var source = tipEl.getAttribute('data-tip-source');
    var calc = tipEl.getAttribute('data-tip-calc');
    if (!source || !calc) return;

    portal.innerHTML = popContentHtml(source, calc);
    portal.hidden = false;
    activeTip = tipEl;

    var rect = tipEl.getBoundingClientRect();
    var pw = portal.offsetWidth;
    var ph = portal.offsetHeight;
    var gap = 8;
    var margin = 8;
    var placeBelow = rect.top < ph + gap + margin;
    var top = placeBelow ? rect.bottom + gap : rect.top - ph - gap;
    var left = rect.left + rect.width / 2 - pw / 2;

    left = Math.max(margin, Math.min(left, window.innerWidth - pw - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - ph - margin));

    portal.style.top = top + 'px';
    portal.style.left = left + 'px';
    portal.classList.toggle('is-below', placeBelow);
  }

  function createTipElement(source, calc, ariaLabel) {
    var wrap = document.createElement('span');
    wrap.className = 'pt-field-tip admin-metric-tip';
    wrap.tabIndex = 0;
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('aria-label', ariaLabel || '指标说明');
    wrap.setAttribute('data-tip-source', source);
    wrap.setAttribute('data-tip-calc', calc);

    var icon = document.createElement('i');
    icon.className = 'fa-regular fa-circle-question';
    icon.setAttribute('aria-hidden', 'true');
    wrap.appendChild(icon);

    return wrap;
  }

  function bindPortalEvents(tipEl) {
    if (tipEl._metricPortalBound) return;
    tipEl._metricPortalBound = true;

    tipEl.addEventListener('mouseenter', function () { showPortal(tipEl); });
    tipEl.addEventListener('focus', function () { showPortal(tipEl); });
    tipEl.addEventListener('mouseleave', function () {
      if (activeTip === tipEl) hidePortal();
    });
    tipEl.addEventListener('blur', function () {
      if (activeTip === tipEl) hidePortal();
    });
  }

  function bindPortalGlobal() {
    if (global._adminMetricTipGlobalBound) return;
    global._adminMetricTipGlobalBound = true;

    window.addEventListener('scroll', hidePortal, true);
    window.addEventListener('resize', hidePortal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hidePortal();
    });
  }

  function bind(root) {
    var scope = root || document;
    scope.querySelectorAll('[data-metric-tip]').forEach(function (el) {
      if (el._metricTipBound) return;
      el._metricTipBound = true;

      var key = el.getAttribute('data-metric-tip');
      var tip = TIPS[key];
      if (!tip) return;

      var label = el.getAttribute('data-metric-label') || el.textContent.trim();
      el.classList.add('admin-metric-title');
      if (el.classList.contains('ant-card-head-title')) {
        el.classList.add('admin-metric-head');
      }

      el.textContent = '';
      el.appendChild(document.createTextNode(label));
      var tipEl = createTipElement(tip.source, tip.calc, label);
      el.appendChild(tipEl);
      bindPortalEvents(tipEl);
    });
    bindPortalGlobal();
  }

  function html(source, calc, ariaLabel) {
    return createTipElement(source, calc, ariaLabel).outerHTML;
  }

  function tipHtml(key, ariaLabel) {
    var tip = TIPS[key];
    if (!tip) return '';
    return html(tip.source, tip.calc, ariaLabel);
  }

  global.AdminMetricTip = {
    TIPS: TIPS,
    html: html,
    tipHtml: tipHtml,
    bind: bind,
    esc: esc,
    hidePortal: hidePortal
  };
})(window);
