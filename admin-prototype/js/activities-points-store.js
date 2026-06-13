/**
 * 积分活动 · 后台 Mock 数据层（localStorage）
 * API 映射：GET/POST/PUT/DELETE /api/v1/admin/points-activities
 */
(function (global) {
  var LS_KEY = 'fl_admin_points_activities_v2';
  var LS_TYPES = 'fl_admin_points_activity_types_v1';

  var MALL_CATS = [
    { id: 'hot', label: '热门推荐' },
    { id: 'pay', label: '付费权益' },
    { id: 'grow', label: '加速成长' },
    { id: 'vip', label: '会员&装扮' },
    { id: 'asset', label: '资产专区' }
  ];

  var DEFAULT_TYPES = [
    { id: 'earn_task', name: '计时任务', icon: 'fa-clock', schema: 'trigger_duration,freq_daily,reward_points', builtin: true },
    { id: 'earn_invite', name: '邀请拉新', icon: 'fa-user-group', schema: 'inviter_points,invitee_points,cooling_days,risk_review', builtin: true },
    { id: 'earn_checkin', name: '签到链', icon: 'fa-calendar-check', schema: 'streak_days,ladder_rewards,reset_cycle', builtin: true },
    { id: 'earn_interaction', name: '互动行为', icon: 'fa-heart', schema: 'action_type,reward_points,daily_cap', builtin: true },
    { id: 'earn_subscription', name: '订阅行为', icon: 'fa-crown', schema: 'first_sub_bonus,renew_bonus', builtin: true },
    { id: 'redeem_goods', name: '兑换商品', icon: 'fa-store', schema: 'cost_points,stock,valid_days,mall_cats', builtin: true },
    { id: 'campaign', name: '研发活动', icon: 'fa-code', schema: 'start_at,end_at,budget_cap,code_binding', devOnly: true, builtin: true },
    { id: 'custom_wheel', name: '幸运转盘', icon: 'fa-dharmachakra', schema: 'cost_per_spin,prize_pool', builtin: false }
  ];

  var DEFAULT_ACTIVITIES = [
    {
      id: 'act_invite_ref',
      code: 'INVITE_REFERRAL',
      name: '邀请拉新 · 双方奖励',
      typeId: 'earn_invite',
      mallCats: [],
      channel: 'task',
      inviterPoints: 200,
      inviteePoints: 200,
      riskReview: true,
      rewardPoints: 200,
      rewardDesc: '邀请人 +200 / 被邀请人 +200',
      freqDesc: '每日最多 3 次',
      freqPeriod: 'daily',
      freqMax: 3,
      coolingDays: 7,
      dailyCap: 600,
      totalCap: 12000,
      status: 'enabled',
      sort: 1,
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80',
      updatedAt: '2026-06-04 10:00'
    },
    {
      id: 'act_watch_30',
      code: 'WATCH_LIVE_30',
      name: '观看直播满 30 分钟',
      typeId: 'earn_task',
      mallCats: ['grow'],
      channel: 'task',
      rewardPoints: 50,
      rewardDesc: '+50 积分 / 次',
      freqDesc: '每日 3 次',
      freqPeriod: 'daily',
      freqMax: 3,
      triggerMinutes: 30,
      coolingDays: 0,
      dailyCap: 150,
      status: 'enabled',
      sort: 10,
      image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&q=80',
      updatedAt: '2026-06-03 18:20'
    },
    {
      id: 'act_trial_coupon',
      code: 'REDEEM_TRIAL',
      name: '付费内容试看券',
      typeId: 'redeem_goods',
      mallCats: ['hot', 'pay'],
      channel: 'mall',
      rewardPoints: -1600,
      rewardDesc: '消耗 1,600 积分',
      freqDesc: '库存 不限',
      coolingDays: 0,
      status: 'enabled',
      sort: 20,
      image: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=400',
      updatedAt: '2026-06-02 09:00'
    },
    {
      id: 'act_boost_card',
      code: 'REDEEM_BOOST',
      name: '积分加速卡 · 24h',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'points_boost',
      purpose: '兑换后在有效期内提升任务类积分获取倍率，用于促进活跃。',
      usageGuide: '用户在积分商城消耗积分兑换；生效期内完成计时任务，积分按倍率结算。C 端读取活动编码 REDEEM_BOOST 及 effectDurationHours、effectMultiplier 参数。',
      opsUsageNote: '默认每人每日可兑 1 次；调整时长不影响触发逻辑，仅改生效小时数。',
      mallCats: ['hot', 'grow'],
      channel: 'mall',
      rewardPoints: -1200,
      rewardDesc: '消耗 1,200 积分',
      freqDesc: '每人每日 1 次',
      freqPeriod: 'daily',
      freqMax: 1,
      effectDurationHours: 24,
      effectMultiplier: 1.2,
      stock: -1,
      coolingDays: 0,
      status: 'enabled',
      sort: 21,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
      updatedAt: '2026-06-01 14:30'
    },
    {
      id: 'act_checkin_7',
      code: 'CHECKIN_STREAK_7',
      name: '连续签到 7 天',
      typeId: 'earn_checkin',
      mallCats: ['grow'],
      channel: 'task',
      streakDays: 7,
      ladder: '10,20,30,50,70,85,100',
      resetCycle: 'natural_week',
      rewardPoints: 100,
      rewardDesc: '阶梯 10→…→100',
      freqDesc: '每日 1 次',
      freqPeriod: 'daily',
      freqMax: 1,
      coolingDays: 0,
      status: 'draft',
      sort: 30,
      image: 'https://cdn.pixabay.com/photo/2016/11/29/09/16/architecture-1868667_640.jpg',
      updatedAt: '2026-05-28 11:00'
    },
    {
      id: 'act_wheel',
      code: 'LUCKY_WHEEL',
      name: '幸运转盘',
      typeId: 'custom_wheel',
      mallCats: ['hot', 'asset'],
      channel: 'mall',
      spinCost: 500,
      dailySpins: 10,
      rewardPoints: -500,
      rewardDesc: '500 积分 / 次',
      freqDesc: '每日 10 次',
      freqPeriod: 'daily',
      freqMax: 10,
      coolingDays: 0,
      status: 'enabled',
      sort: 40,
      image: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=400',
      updatedAt: '2026-05-25 16:00'
    },
    {
      id: 'act_campaign_demo',
      code: 'SPRING_SHARE_2026',
      name: '春节分享页 · 限时福利',
      typeId: 'campaign',
      devBacked: true,
      purpose: '春节期间引导用户分享活动页，拉新与回流。',
      usageGuide: '用户从活动 H5 完成分享动作后，C 端调用发奖 API 并传入本活动 code。分享判定逻辑由研发实现，运营不可修改。',
      opsUsageNote: '2026 春节档；预算用完后自动停奖。',
      mallCats: [],
      channel: 'task',
      campaignStart: '2026-02-01T00:00',
      campaignEnd: '2026-02-07T23:59',
      budgetCap: 50000,
      rewardPoints: 100,
      rewardDesc: '+100 积分 / 次',
      freqDesc: '每日 1 次',
      freqPeriod: 'daily',
      freqMax: 1,
      coolingDays: 7,
      status: 'enabled',
      sort: 5,
      image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&q=80',
      updatedAt: '2026-01-15 10:00'
    },
    {
      id: 'act_sub_discount',
      code: 'REDEEM_SUB_DISCOUNT',
      name: '订阅折扣券 · 首月 85 折',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'sub_discount',
      purpose: '用户使用积分兑换订阅折扣券，在订阅下单时抵扣应付金额。',
      usageGuide: '商城兑换后写入用户券包；订阅收银台选择该券并传入 code=REDEEM_SUB_DISCOUNT。C 端读取 discountPercent（减免比例）、couponValidDays（持券有效天）、applicablePlan（适用套餐范围）。',
      opsUsageNote: '调整折扣比例或持券天数不改变发券逻辑，仅影响结算参数。',
      mallCats: ['hot', 'pay'],
      channel: 'mall',
      rewardPoints: -2400,
      rewardDesc: '消耗 2,400 积分 · 订阅减 15% · 30 天内有效',
      freqDesc: '每人每日 1 次',
      freqPeriod: 'daily',
      freqMax: 1,
      discountPercent: 15,
      couponValidDays: 30,
      applicablePlan: 'monthly',
      stock: 500,
      coolingDays: 0,
      status: 'enabled',
      sort: 22,
      image: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=400',
      updatedAt: '2026-06-05 09:00'
    },
    {
      id: 'act_sub_free',
      code: 'REDEEM_SUB_FREE',
      name: '免费订阅次数券 · 1 次',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'sub_free_count',
      purpose: '用户使用积分兑换一次（或多次）免费订阅资格，直接开通或续期指定档位。',
      usageGuide: '兑换成功后增加 freeGrantCount 次可用次数；须在 grantValidDays 内于订阅页消耗。C 端读取 freeGrantCount、grantValidDays、grantPlanTier。',
      opsUsageNote: '「次数」= 可免费开通/续订的次数；与持券有效天数分开配置。',
      mallCats: ['pay', 'vip'],
      channel: 'mall',
      rewardPoints: -4800,
      rewardDesc: '消耗 4,800 积分 · 1 次免费订阅 · 14 天内使用',
      freqDesc: '终身 1 次',
      freqPeriod: 'lifetime',
      freqMax: 1,
      freeGrantCount: 1,
      grantValidDays: 14,
      grantPlanTier: 'standard',
      stock: 200,
      coolingDays: 0,
      status: 'enabled',
      sort: 23,
      image: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=400',
      updatedAt: '2026-06-05 09:30'
    }
  ];

  function loadJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return fallback.slice ? fallback.slice() : JSON.parse(JSON.stringify(fallback));
  }

  function saveJson(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  function uid() {
    return 'act_' + Date.now().toString(36);
  }

  function getTypes() {
    return loadJson(LS_TYPES, DEFAULT_TYPES);
  }

  function saveTypes(list) {
    saveJson(LS_TYPES, list);
  }

  function getActivities() {
    var list = loadJson(LS_KEY, DEFAULT_ACTIVITIES);
    var changed = false;
    DEFAULT_ACTIVITIES.forEach(function (def) {
      if (!list.some(function (a) { return a.id === def.id; })) {
        list.push(JSON.parse(JSON.stringify(def)));
        changed = true;
      }
    });
    if (changed) saveActivities(list);
    return list;
  }

  function saveActivities(list) {
    saveJson(LS_KEY, list);
  }

  function getActivity(id) {
    return getActivities().filter(function (a) { return a.id === id; })[0] || null;
  }

  function upsertActivity(act) {
    var list = getActivities();
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === act.id) { idx = i; break; }
    }
    act.updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
    if (idx >= 0) list[idx] = act;
    else list.unshift(act);
    saveActivities(list);
    return act;
  }

  function deleteActivity(id) {
    var list = getActivities().filter(function (a) { return a.id !== id; });
    saveActivities(list);
  }

  function isDevOnlyType(typeId) {
    if (!typeId) return false;
    if (typeId === 'campaign') return true;
    var t = getTypes().filter(function (x) { return x.id === typeId; })[0];
    return !!(t && t.devOnly);
  }

  /** 研发接入的活动实例（含 campaign 与 devBacked 兑换项） */
  function isDevBackedActivity(act) {
    if (!act) return false;
    if (act.devBacked) return true;
    return isDevOnlyType(act.typeId);
  }

  function getTypesForCreate(includeDevOnly) {
    return getTypes().filter(function (t) {
      if (!includeDevOnly && isDevOnlyType(t.id)) return false;
      return true;
    });
  }

  function typeLabel(typeId) {
    var t = getTypes().filter(function (x) { return x.id === typeId; })[0];
    return t ? t.name : typeId;
  }

  function catLabels(ids) {
    if (!ids || !ids.length) return '—';
    return ids.map(function (id) {
      var c = MALL_CATS.filter(function (m) { return m.id === id; })[0];
      return c ? c.label : id;
    }).join('、');
  }

  function statusTag(status) {
    if (status === 'enabled') return '<span class="ant-tag ant-tag-green">启用</span>';
    if (status === 'disabled') return '<span class="ant-tag ant-tag-red">停用</span>';
    if (status === 'draft') return '<span class="ant-tag">草稿</span>';
    return '<span class="ant-tag">' + status + '</span>';
  }

  /** 消耗类不参与积分冷静期（与积分风控页活动类型列表对齐） */
  function isPointsEarnType(typeId) {
    if (!typeId) return false;
    if (typeId === 'redeem_goods') return false;
    if (typeId.indexOf('redeem_') === 0) return false;
    return true;
  }

  var COOLING_HINTS = {
    earn_invite: '双方奖励发放后进入冷静池，期满转入可用积分',
    earn_task: '观看、浏览等日常任务，通常即时可用',
    earn_checkin: '每日 / 连续签到奖励',
    earn_interaction: '点赞、评论等轻量互动',
    earn_subscription: '首次订阅、续订等订阅行为奖励',
    campaign: '研发绑定玩法 · 限时发奖',
    custom_wheel: '转盘抽奖获得的积分奖励'
  };

  function getCoolingTypeRows() {
    return getTypes().filter(function (t) { return isPointsEarnType(t.id); }).map(function (t) {
      return {
        id: t.id,
        label: t.name,
        hint: COOLING_HINTS[t.id] || '自定义获取类活动 · 积分发放后适用冷静期规则'
      };
    });
  }

  global.FLPointsActivityStore = {
    MALL_CATS: MALL_CATS,
    DEFAULT_TYPES: DEFAULT_TYPES,
    getTypes: getTypes,
    saveTypes: saveTypes,
    getActivities: getActivities,
    saveActivities: saveActivities,
    getActivity: getActivity,
    upsertActivity: upsertActivity,
    deleteActivity: deleteActivity,
    typeLabel: typeLabel,
    catLabels: catLabels,
    statusTag: statusTag,
    isPointsEarnType: isPointsEarnType,
    isDevOnlyType: isDevOnlyType,
    isDevBackedActivity: isDevBackedActivity,
    getTypesForCreate: getTypesForCreate,
    getCoolingTypeRows: getCoolingTypeRows,
    uid: uid
  };
})(typeof window !== 'undefined' ? window : this);
