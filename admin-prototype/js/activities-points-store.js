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

  /** 商城商品卡封面角标（thumb .tag），与 points-mall 对齐 */
  var MALL_THUMB_TAGS = [
    '会员', '30 天', 'VIP', '评论', '装扮', '限量资格', '空投', 'NFT', '质押', '热门', '付费'
  ];

  var MEMBERSHIP_DEV_LOGIC =
    '【会员身份兑换 · C 端业务逻辑（研发实现）】\n' +
    '1. 兑换资格：默认「非会员」或「会员剩余 ≤7 天」可兑；完整会员期内按钮展示「兑换并排队」而非禁用（可由 memberAudience 收紧为仅非会员）。\n' +
    '2. 按钮态：非会员 →「立即兑换」；可叠加 →「兑换并排队」+ 提示「将在当前会员结束后生效」；仅非会员且已是会员 → 置灰「当前已是会员」。\n' +
    '3. 生效：兑换成功写入未激活券；用户须在持券有效天内确认激活。非会员激活后立即开通 N 天；已是会员则 N 天排队到 currentMemberEndAt 之后累加，不覆盖当前权益。\n' +
    '4. 有效期：持券有效天 = 须在此期限内完成激活，过期未激活作废；激活后的会员时长 = membershipDays，与持券期独立。';

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
      devBacked: true,
      goodsTemplate: 'ppv_trial',
      benefitUsageMode: 'count_with_expiry',
      purpose: '用户使用积分兑换单篇付费内容试看资格，解锁后可限时反复观看。',
      usageGuide: '商城兑换后写入券包 type=ppv_trial；付费弹窗选择试看券消耗 1 次。C 端读取 grantUses、grantValidDays、ppvViewHours。',
      opsUsageNote: '按次数消耗（每张券解锁 1 篇）；须配置持券有效天，过期剩余次数作废。',
      mallCats: ['hot', 'pay'],
      channel: 'mall',
      rewardPoints: -1600,
      rewardDesc: '消耗 1,600 积分 · 1 次试看 · 7 天内使用',
      freqDesc: '每人每周 2 次',
      freqPeriod: 'weekly',
      freqMax: 2,
      grantUses: 1,
      grantValidDays: 7,
      ppvViewHours: 24,
      stock: -1,
      coolingDays: 0,
      status: 'enabled',
      sort: 20,
      image: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=400',
      updatedAt: '2026-06-02 09:00'
    },
    {
      id: 'act_tip_bonus',
      code: 'REDEEM_TIP_BOOST',
      name: '打赏加成卡 · 3 次',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'tip_boost',
      benefitUsageMode: 'count_with_expiry',
      purpose: '用户使用积分兑换打赏加成次数；打赏时平台按配置比例额外补贴给创作者，用户仍只付礼物原价。',
      usageGuide: '兑换后写入用户券包 type=tip_boost；每次打赏消耗 1 次。C 端读取 tipGrantUses、grantValidDays、subsidyPercent、maxSubsidyPerTip、minTipAmount、maxTipAmount、subsidyBudgetCap。补贴 = min(打赏额×比例, 单笔补贴上限)。',
      opsUsageNote: '按次数消耗（非时长）以控制平台成本；兑换频控、持券有效期、单笔补贴上限须分开配置。大额打赏场景务必设置 maxSubsidyPerTip。',
      mallCats: ['hot', 'pay'],
      channel: 'mall',
      rewardPoints: -3500,
      rewardDesc: '消耗 3,500 积分 · 3 次打赏补贴 · 14 天内使用',
      freqDesc: '每人每周 2 次',
      freqPeriod: 'weekly',
      freqMax: 2,
      tipGrantUses: 3,
      grantValidDays: 14,
      subsidyPercent: 10,
      maxSubsidyPerTip: 50,
      minTipAmount: 10,
      maxTipAmount: 500,
      subsidyBudgetCap: 100000,
      stock: 410,
      coolingDays: 0,
      status: 'enabled',
      sort: 19,
      image: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=400',
      updatedAt: '2026-06-10 11:00'
    },
    {
      id: 'act_boost_card',
      code: 'REDEEM_BOOST',
      name: '积分加速卡 · 24h',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'points_boost',
      benefitUsageMode: 'duration_unlimited',
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
      status: 'disabled',
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
      benefitUsageMode: 'count_with_expiry',
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
      benefitUsageMode: 'count_with_expiry',
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
    },
    {
      id: 'act_ppv_discount',
      code: 'REDEEM_PPV_DISCOUNT',
      name: '单篇 5 折券',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'ppv_discount',
      benefitUsageMode: 'count_with_expiry',
      purpose: '用户使用积分兑换单篇付费内容折扣券，下单时抵扣应付金额。',
      usageGuide: '兑换后写入券包 type=ppv_discount；付费弹窗选择该券消耗 1 次。C 端读取 discountPercent、grantUses、grantValidDays。',
      opsUsageNote: '每张券仅可用 1 次；须配置持券有效天，过期未用自动作废。不可与试看券叠加。',
      mallCats: ['hot', 'pay'],
      channel: 'mall',
      rewardPoints: -3200,
      rewardDesc: '消耗 3,200 积分 · 5 折 · 1 次 · 14 天内使用',
      freqDesc: '每人每周 1 次',
      freqPeriod: 'weekly',
      freqMax: 1,
      discountPercent: 50,
      grantUses: 1,
      grantValidDays: 14,
      stock: -1,
      coolingDays: 0,
      status: 'enabled',
      sort: 18,
      image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=80',
      updatedAt: '2026-06-10 12:00'
    },
    {
      id: 'act_sub90',
      code: 'REDEEM_SUB_90',
      name: '订阅 9 折券',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'sub_discount',
      benefitUsageMode: 'count_with_expiry',
      purpose: '用户使用积分兑换订阅 9 折券，在订阅下单时抵扣应付金额。',
      usageGuide: '商城兑换后写入券包 type=sub_discount；订阅收银台选券。C 端读取 discountPercent（减免比例）、couponValidDays、applicablePlan。',
      opsUsageNote: '每张券 1 次订阅可用；持券有效天到期后未用作废。与商城「订阅 8 折券」为独立 SKU。',
      mallCats: ['hot', 'pay'],
      channel: 'mall',
      rewardPoints: -2200,
      rewardDesc: '消耗 2,200 积分 · 订阅 9 折 · 7 天内有效',
      freqDesc: '每人每日 1 次',
      freqPeriod: 'daily',
      freqMax: 1,
      discountPercent: 10,
      couponValidDays: 7,
      applicablePlan: 'all',
      stock: -1,
      coolingDays: 0,
      status: 'enabled',
      sort: 17,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
      updatedAt: '2026-06-10 12:00'
    },
    {
      id: 'act_sub80',
      code: 'REDEEM_SUB_80',
      name: '订阅 8 折券',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'sub_discount',
      benefitUsageMode: 'count_with_expiry',
      purpose: '高阶订阅折扣券，减免比例高于 9 折券，不可与其它满减叠加。',
      usageGuide: '同 sub_discount 模板；discountPercent=20 表示 8 折（减 20%）。持券 validDays 较短以控制成本。',
      opsUsageNote: '建议兑换频控严于 9 折券；持券天数与减免比例联动评估毛利。',
      mallCats: ['pay'],
      channel: 'mall',
      rewardPoints: -6800,
      rewardDesc: '消耗 6,800 积分 · 订阅 8 折 · 2 天内有效',
      freqDesc: '每人每周 1 次',
      freqPeriod: 'weekly',
      freqMax: 1,
      discountPercent: 20,
      couponValidDays: 2,
      applicablePlan: 'all',
      stock: 300,
      coolingDays: 0,
      status: 'enabled',
      sort: 16,
      image: 'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=400',
      updatedAt: '2026-06-10 12:00'
    },
    {
      id: 'act_daily_cap_boost',
      code: 'REDEEM_DAILY_CAP_BOOST',
      name: '每日上限提升卡',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'daily_cap_boost',
      benefitUsageMode: 'duration_unlimited',
      purpose: '兑换后当日提升任务类积分获取上限，次日 0 点恢复默认规则。',
      usageGuide: '兑换即生效 type=daily_cap_boost；C 端读取 capFrom、capTo、grantValidDays（通常为 1 即当日）。有效期内不限触发次数。',
      opsUsageNote: '时长制权益：兑换当日有效，无需配置次数；建议每人每日限兑 1 次。',
      mallCats: ['grow'],
      channel: 'mall',
      rewardPoints: -2800,
      rewardDesc: '消耗 2,800 积分 · 当日上限 50→100',
      freqDesc: '每人每日 1 次',
      freqPeriod: 'daily',
      freqMax: 1,
      capFrom: 50,
      capTo: 100,
      grantValidDays: 1,
      stock: -1,
      coolingDays: 0,
      status: 'enabled',
      sort: 24,
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80',
      updatedAt: '2026-06-10 12:00'
    },
    {
      id: 'act_checkin_double',
      code: 'REDEEM_CHECKIN_DOUBLE',
      name: '连续签到翻倍卡',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'checkin_double',
      benefitUsageMode: 'count_with_expiry',
      purpose: '兑换后获得一次签到奖励翻倍机会，含连续天数阶梯基准。',
      usageGuide: '兑换写入 type=checkin_double；下次 claimTask 签到时消耗 1 次并按 multiplier 结算。C 端读取 grantUses、grantValidDays、multiplier。',
      opsUsageNote: '次数 + 有效期：须在期限内完成翻倍签到，过期剩余次数作废。',
      mallCats: ['grow'],
      channel: 'mall',
      rewardPoints: -450,
      rewardDesc: '消耗 450 积分 · 下次签到 ×2 · 7 天内使用',
      freqDesc: '每人每周 1 次',
      freqPeriod: 'weekly',
      freqMax: 1,
      grantUses: 1,
      grantValidDays: 7,
      multiplier: 2,
      stock: -1,
      coolingDays: 0,
      status: 'enabled',
      sort: 25,
      image: 'https://cdn.pixabay.com/photo/2016/11/29/09/16/architecture-1868667_640.jpg',
      updatedAt: '2026-06-10 12:00'
    },
    {
      id: 'act_invite_boost',
      code: 'REDEEM_INVITE_BOOST',
      name: '邀请加成卡 · 7 日',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'invite_boost',
      benefitUsageMode: 'duration_unlimited',
      purpose: '兑换后在有效期内，邀请好友完成的积分/现金返利按加成比例上浮。',
      usageGuide: '兑换即激活 type=invite_boost；邀请页与返利结算读取 bonusPercent、grantValidDays。有效期内不限邀请次数。',
      opsUsageNote: '纯时长制：仅配置有效天数与加成比例，不消耗次数；到期自动失效。',
      mallCats: ['grow'],
      channel: 'mall',
      rewardPoints: -4200,
      rewardDesc: '消耗 4,200 积分 · 邀请返利 +10% · 7 日',
      freqDesc: '每人每月 1 次',
      freqPeriod: 'monthly',
      freqMax: 1,
      grantValidDays: 7,
      bonusPercent: 10,
      stock: -1,
      coolingDays: 0,
      status: 'enabled',
      sort: 26,
      image: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=400',
      updatedAt: '2026-06-10 12:00'
    },
    {
      id: 'act_comment_highlight',
      code: 'REDEEM_COMMENT_HIGHLIGHT',
      name: '评论高亮 · 7 日',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'comment_highlight',
      benefitUsageMode: 'duration_unlimited',
      purpose: '兑换后评论昵称与正文使用专属色值，在帖子评论区区分展示（不置顶）。',
      usageGuide: '兑换激活 type=comment_highlight；评论列表读取 styleId、grantValidDays。有效期内发帖评论均高亮，不限条数。',
      opsUsageNote: '纯时长制装扮权益；styleId 由研发枚举，运营仅选预设色板。',
      mallCats: ['vip'],
      channel: 'mall',
      rewardPoints: -900,
      rewardDesc: '消耗 900 积分 · 评论专属字色 · 7 日',
      freqDesc: '每人每周 1 次',
      freqPeriod: 'weekly',
      freqMax: 1,
      grantValidDays: 7,
      styleId: 'purple',
      stock: -1,
      coolingDays: 0,
      status: 'enabled',
      sort: 27,
      image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=400',
      updatedAt: '2026-06-10 12:00'
    },
    {
      id: 'act_avatar_frame',
      code: 'REDEEM_AVATAR_FRAME',
      name: '专属头像框 · 霓虹',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'avatar_frame',
      benefitUsageMode: 'duration_unlimited',
      purpose: '兑换后全站头像外围显示华丽霓虹外框，头像照片保持原样。',
      usageGuide: '兑换写入 type=avatar_frame 并自动佩戴；全站头像组件读取 frameId、grantValidDays。有效期内持续展示，不限切换次数。',
      opsUsageNote: '纯时长制装扮；frameId 由研发绑定样式资源。',
      mallCats: ['vip'],
      channel: 'mall',
      rewardPoints: -3100,
      rewardDesc: '消耗 3,100 积分 · 霓虹外框 · 30 日',
      freqDesc: '每人每月 1 次',
      freqPeriod: 'monthly',
      freqMax: 1,
      grantValidDays: 30,
      frameId: 'neon',
      stock: -1,
      coolingDays: 0,
      status: 'enabled',
      sort: 28,
      image: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?w=400&q=80',
      updatedAt: '2026-06-10 12:00'
    },
    {
      id: 'act_member_7d',
      code: 'REDEEM_MEMBER_7D',
      name: '会员身份 · 7 天',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'membership_pass',
      benefitUsageMode: 'count_with_expiry',
      devLogicNote: MEMBERSHIP_DEV_LOGIC,
      purpose: '用户使用积分兑换 7 天平台会员体验包，含高清画质、专属客服等权益。',
      usageGuide: '兑换写入 type=membership_pass；须在 grantValidDays 内激活。C 端读取 membershipDays、memberAudience、memberStackPolicy、grantValidDays。',
      opsUsageNote: '默认面向非会员或即将到期用户；已是会员可排队叠加。持券期与会员期分开配置。',
      mallCats: ['hot', 'vip'],
      mallThumbTag: '会员',
      channel: 'mall',
      rewardPoints: -5500,
      rewardDesc: '消耗 5,500 积分 · 7 天会员 · 30 天内激活',
      freqDesc: '限购 1 / 季',
      freqPeriod: 'quarterly',
      freqMax: 1,
      membershipDays: 7,
      grantUses: 1,
      grantValidDays: 30,
      memberAudience: 'non_member_or_expiring',
      memberStackPolicy: 'queue_after_current',
      stock: 320,
      coolingDays: 0,
      status: 'enabled',
      sort: 29,
      image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=400&q=80',
      description: '体验会员权益：高清画质、专属客服入口、评论置顶优先。',
      updatedAt: '2026-06-11 10:00'
    },
    {
      id: 'act_member_30d',
      code: 'REDEEM_MEMBER_30D',
      name: '会员身份 · 30 天',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'membership_pass',
      benefitUsageMode: 'count_with_expiry',
      devLogicNote: MEMBERSHIP_DEV_LOGIC,
      purpose: '用户使用积分兑换完整 30 天会员权益包，续费可叠加时长。',
      usageGuide: '同 membership_pass；membershipDays=30。会员期内兑换按 memberStackPolicy 排队至当前会员结束后生效。',
      opsUsageNote: '年限购 2 次；持券 45 天内须激活。与 7 天体验包共用叠加规则。',
      mallCats: ['vip'],
      mallThumbTag: '30 天',
      channel: 'mall',
      rewardPoints: -18000,
      rewardDesc: '消耗 18,000 积分 · 30 天会员 · 45 天内激活',
      freqDesc: '限购 2 / 年',
      freqPeriod: 'yearly',
      freqMax: 2,
      membershipDays: 30,
      grantUses: 1,
      grantValidDays: 45,
      memberAudience: 'non_member_or_expiring',
      memberStackPolicy: 'queue_after_current',
      stock: 96,
      coolingDays: 0,
      status: 'enabled',
      sort: 30,
      image: 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: '完整月度会员权益包，续费可叠加时长。',
      updatedAt: '2026-06-11 10:00'
    },
    {
      id: 'act_sfl_qual',
      code: 'REDEEM_SFL_QUAL',
      name: 'SFL 兑换资格（非 Token）',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'sfl_qualification',
      benefitUsageMode: 'count_with_expiry',
      purpose: '获得下一阶段 SFL 公募/兑换窗口的抽签资格，非直接到账代币。',
      usageGuide: '兑换写入 type=sfl_qualification；活动页抽签消耗 1 次资格。C 端读取 grantUses、grantValidDays、qualificationWindow。',
      opsUsageNote: '终身限购 1 次；资格须在窗口期内使用，过期作废。库存与窗口期联动控量。',
      mallCats: ['hot', 'asset'],
      mallThumbTag: '限量资格',
      channel: 'mall',
      rewardPoints: -9900,
      rewardDesc: '消耗 9,900 积分 · 1 次抽签资格 · 90 天内有效',
      freqDesc: '限购 1 / 人',
      freqPeriod: 'lifetime',
      freqMax: 1,
      grantUses: 1,
      grantValidDays: 90,
      qualificationWindow: 'SFL_PHASE_2',
      stock: 42,
      coolingDays: 0,
      status: 'enabled',
      sort: 31,
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80',
      description: '获得下一阶段 SFL 公募 / 兑换窗口的抽签资格，非直接到账代币。',
      updatedAt: '2026-06-11 10:00'
    },
    {
      id: 'act_airdrop_ticket',
      code: 'REDEEM_AIRDROP_TICKET',
      name: '空投抽奖券 ×1',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'airdrop_ticket',
      benefitUsageMode: 'count_with_expiry',
      purpose: '参与当期 SFL / 纪念 NFT 空投抽奖，每张券对应 1 次抽奖机会。',
      usageGuide: '兑换写入 type=airdrop_ticket；活动页参与抽奖消耗 1 次。C 端读取 grantUses、grantValidDays、drawRoundId。',
      opsUsageNote: '每期限购 10 张；须在当期开奖前使用，过期未用作废。',
      mallCats: ['asset'],
      mallThumbTag: '空投',
      channel: 'mall',
      rewardPoints: -800,
      rewardDesc: '消耗 800 积分 · 1 次抽奖 · 当期内有效',
      freqDesc: '限购 10 / 期',
      freqPeriod: 'per_round',
      freqMax: 10,
      grantUses: 1,
      grantValidDays: 14,
      drawRoundId: 'AIRDROP_2026_Q2',
      stock: 1800,
      coolingDays: 0,
      status: 'enabled',
      sort: 32,
      image: 'https://images.pexels.com/photos/8370752/pexels-photo-8370752.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: '参与当期 SFL / 纪念 NFT 空投抽奖（规则详见活动页）。',
      updatedAt: '2026-06-11 10:00'
    },
    {
      id: 'act_nft_fee',
      code: 'REDEEM_NFT_FEE',
      name: 'NFT 铸造 / 交易手续费折扣券',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'nft_fee_discount',
      benefitUsageMode: 'count_with_expiry',
      purpose: '指定合集 Mint 或二级市场交易享手续费折扣，单笔补贴有封顶。',
      usageGuide: '兑换写入 type=nft_fee_discount；链上结算时选券消耗 1 次。C 端读取 discountPercent、grantUses、grantValidDays、maxDiscountPerTx、feeScope。',
      opsUsageNote: '每张券 1 次；须在持券期内完成 Mint/交易，过期作废。',
      mallCats: ['asset'],
      mallThumbTag: 'NFT',
      channel: 'mall',
      rewardPoints: -4400,
      rewardDesc: '消耗 4,400 积分 · 手续费 85 折 · 1 次 · 30 天内使用',
      freqDesc: '限购 3 / 月',
      freqPeriod: 'monthly',
      freqMax: 3,
      discountPercent: 15,
      grantUses: 1,
      grantValidDays: 30,
      maxDiscountPerTx: 50,
      feeScope: 'both',
      stock: 210,
      coolingDays: 0,
      status: 'enabled',
      sort: 33,
      image: 'https://cdn.pixabay.com/photo/2021/12/06/04/33/nft-6848611_640.jpg',
      description: '指定合集 Mint 或二级市场手续费 85 折，单笔封顶见券说明。',
      updatedAt: '2026-06-11 10:00'
    },
    {
      id: 'act_staking_boost',
      code: 'REDEEM_STAKING_BOOST',
      name: '质押加成券 · 30 日',
      typeId: 'redeem_goods',
      devBacked: true,
      goodsTemplate: 'staking_boost',
      benefitUsageMode: 'duration_unlimited',
      purpose: 'FansLoop 质押池收益加成，链上活动期内持续生效。',
      usageGuide: '兑换即激活 type=staking_boost；质押结算读取 bonusPercent、grantValidDays。有效期内不限质押笔数。',
      opsUsageNote: '纯时长制；须链上活动期开启才实际加成。每月限购 1 次。',
      mallCats: ['asset'],
      mallThumbTag: '质押',
      channel: 'mall',
      rewardPoints: -12000,
      rewardDesc: '消耗 12,000 积分 · 质押收益 +5% · 30 日',
      freqDesc: '限购 1 / 月',
      freqPeriod: 'monthly',
      freqMax: 1,
      grantValidDays: 30,
      bonusPercent: 5,
      requiresChainActivity: true,
      stock: 75,
      coolingDays: 0,
      status: 'enabled',
      sort: 34,
      image: 'https://images.unsplash.com/photo-1640340434855-6084b1db14fb?w=400&q=80',
      description: 'FansLoop 质押池收益加成 +5%（链上活动期可用）。',
      updatedAt: '2026-06-11 10:00'
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

  var PATCH_KEYS = [
    'goodsTemplate', 'devBacked', 'benefitUsageMode', 'purpose', 'usageGuide', 'opsUsageNote', 'devLogicNote',
    'mallThumbTag', 'description',
    'grantUses', 'grantValidDays', 'ppvViewHours', 'discountPercent', 'couponValidDays',
    'capFrom', 'capTo', 'multiplier', 'bonusPercent', 'styleId', 'frameId',
    'membershipDays', 'memberAudience', 'memberStackPolicy',
    'qualificationWindow', 'drawRoundId', 'maxDiscountPerTx', 'feeScope', 'requiresChainActivity',
    'freqPeriod', 'freqMax', 'freqDesc', 'stock'
  ];

  function patchBuiltinActivities(list) {
    var byId = {};
    DEFAULT_ACTIVITIES.forEach(function (d) { byId[d.id] = d; });
    var changed = false;
    list.forEach(function (a) {
      var def = byId[a.id];
      if (!def) return;
      PATCH_KEYS.forEach(function (k) {
        if (def[k] != null && a[k] == null) {
          a[k] = def[k];
          changed = true;
        }
      });
    });
    return changed;
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
    if (patchBuiltinActivities(list)) changed = true;
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
    if (status === 'draft') return '<span class="ant-tag ant-tag-red">停用</span>';
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
    MALL_THUMB_TAGS: MALL_THUMB_TAGS,
    MEMBERSHIP_DEV_LOGIC: MEMBERSHIP_DEV_LOGIC,
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
