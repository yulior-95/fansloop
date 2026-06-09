/**
 * 积分活动 · 后台 Mock 数据层（localStorage）
 * API 映射：GET/POST/PUT/DELETE /api/v1/admin/points-activities
 */
(function (global) {
  var LS_KEY = 'fl_admin_points_activities_v1';
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
    { id: 'campaign', name: '运营活动', icon: 'fa-bullhorn', schema: 'start_at,end_at,budget_cap', builtin: true },
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
      rewardPoints: 200,
      rewardDesc: '邀请人 +200 / 被邀请人 +200',
      freqDesc: '日邀请奖励上限 600',
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
      mallCats: ['hot', 'grow'],
      channel: 'mall',
      rewardPoints: -1200,
      rewardDesc: '消耗 1,200 积分',
      freqDesc: '每人每日 1 次',
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
      rewardPoints: 100,
      rewardDesc: '阶梯 10→…→100',
      freqDesc: '自然周重置',
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
      rewardPoints: -500,
      rewardDesc: '500 积分 / 次',
      freqDesc: '每日 10 次',
      coolingDays: 0,
      status: 'enabled',
      sort: 40,
      image: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=400',
      updatedAt: '2026-05-25 16:00'
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
    return loadJson(LS_KEY, DEFAULT_ACTIVITIES);
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
    uid: uid
  };
})(typeof window !== 'undefined' ? window : this);
