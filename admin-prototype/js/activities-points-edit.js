(function () {
  var S = window.FLPointsActivityStore;
  var M = window.AdminModal;
  var Risk = window.FLPointsRisk;
  var Session = window.FLAdminSession;
  if (!S || !M) return;

  var form = document.getElementById('actForm');
  var params = new URLSearchParams(location.search);
  var editId = params.get('id');
  var presetType = params.get('preset');
  var viewOnly = params.get('view') === '1';
  var canDev = Session && Session.canManageDevActivities();
  var act = editId ? S.getActivity(editId) : null;
  var freqDescTouched = false;
  var readOnly = false;

  var RESET_CYCLE_OPTS = [
    { v: 'streak_complete', l: '满连续天数后从第 1 天重计' },
    { v: 'natural_week', l: '自然周重置（每周一从第 1 天）' },
    { v: 'break_reset', l: '断签即从第 1 天重计（不自动满周期重置）' }
  ];

  var ACTION_TYPE_OPTS = [
    { v: 'like', l: '点赞' },
    { v: 'comment', l: '评论' },
    { v: 'share', l: '分享' },
    { v: 'follow', l: '关注创作者' },
    { v: 'gift_light', l: '轻量打赏/送礼' }
  ];

  var APPLICABLE_PLAN_OPTS = [
    { v: 'all', l: '全部订阅套餐' },
    { v: 'monthly', l: '仅连续包月' },
    { v: 'annual', l: '仅年付套餐' }
  ];

  var GRANT_PLAN_TIER_OPTS = [
    { v: 'all', l: '全部档位' },
    { v: 'standard', l: '标准档' },
    { v: 'premium', l: '高级档' }
  ];

  var TYPE_RULES_INTRO = {
    earn_task: '配置<strong>完成条件</strong>（如观看时长）。单次奖励积分与可完成次数在下方「奖励与频控」。',
    earn_invite: '配置<strong>双方奖励分值</strong>及是否走风控。邀请次数与发放上限在下方「奖励与频控」。',
    earn_checkin: '配置<strong>连续签到链</strong>：天数、每日阶梯分值、断签/满周期如何重置。签到固定每日 1 次，不设日积分上限。',
    earn_interaction: '选择<strong>哪一种互动</strong>触发发奖（对应 C 端埋点）。单次奖励与每日可触发次数在下方「奖励与频控」。',
    earn_subscription: '配置<strong>首订 / 续订</strong>各奖励多少积分。首订通常终身 1 次；续订频控在下方配置。',
    redeem_goods: '配置兑换<strong>库存与券有效期</strong>。消耗积分数在下方「积分值」（负数）。',
    campaign: '研发创建骨架并绑定编码；<strong>运营可改</strong>时间窗、预算、奖励与频控，不可改触发逻辑。',
    custom_wheel: '配置<strong>单次消耗</strong>与<strong>每日抽奖次数</strong>。展示文案在下方可选填。'
  };

  function isDevBackedContext(typeId) {
    if (typeId === 'campaign') return true;
    if (act && S.isDevBackedActivity(act)) return true;
    return false;
  }

  function getGoodsTemplate() {
    return (act && act.goodsTemplate) || '';
  }

  if (editId && !act) {
    M.toast('活动不存在');
    setTimeout(function () { location.href = 'activities-points-crud.html'; }, 800);
    return;
  }

  if (presetType === 'campaign' && !canDev) {
    M.toast('研发活动仅限研发或管理员创建');
    setTimeout(function () { location.href = 'activities-points-crud.html'; }, 800);
    return;
  }

  readOnly = viewOnly === true;

  if (act) {
    var opsEditDev = S.isDevBackedActivity(act) && !canDev;
    document.getElementById('pageTitle').textContent = readOnly
      ? '查看活动'
      : (opsEditDev ? '配置活动参数' : '编辑积分活动');
    document.getElementById('hdrMode').textContent = readOnly ? '查看' : (opsEditDev ? '运营配置' : '编辑');
  } else if (presetType === 'campaign') {
    document.getElementById('pageTitle').textContent = '新建研发活动';
    document.getElementById('hdrMode').textContent = '研发活动';
  }

  function isMallChannel() {
    return form.channel.value === 'mall';
  }

  function isConsumeType(typeId) {
    if (!typeId) return false;
    if (typeId === 'redeem_goods' || typeId === 'custom_wheel') return true;
    return typeId.indexOf('redeem_') === 0;
  }

  function parseLadder(str) {
    if (!str) return [];
    return str.split(',').map(function (s) { return parseInt(s.trim(), 10); })
      .filter(function (n) { return !isNaN(n); });
  }

  function maxLadder(ladder) {
    var m = 0;
    ladder.forEach(function (n) { if (n > m) m = n; });
    return m;
  }

  function formatLadderDesc(ladder) {
    if (!ladder.length) return '';
    if (ladder.length === 1) return '+' + ladder[0] + ' 积分 / 天';
    return '阶梯 ' + ladder[0] + '→…→' + ladder[ladder.length - 1];
  }

  function fillTypeSelect() {
    var sel = document.getElementById('fldType');
    sel.innerHTML = '';
    var includeDev = canDev || (act && S.isDevOnlyType(act.typeId));
    S.getTypesForCreate(includeDev).forEach(function (t) {
      var o = document.createElement('option');
      o.value = t.id;
      var suffix = t.devOnly || t.id === 'campaign' ? ' · 研发专用' : (t.builtin ? '' : '（自定义）');
      o.textContent = t.name + suffix;
      sel.appendChild(o);
    });
    if (act && S.isDevOnlyType(act.typeId) && !includeDev) {
      var o2 = document.createElement('option');
      o2.value = act.typeId;
      o2.textContent = S.typeLabel(act.typeId) + ' · 研发专用';
      sel.appendChild(o2);
    }
  }

  function applyFieldLocks() {
    var typeId = form.typeId.value;
    var devBacked = isDevBackedContext(typeId);
    var banner = document.getElementById('devActReadonlyBanner');
    var briefSec = document.getElementById('secActivityBrief');
    var rulesTitle = document.getElementById('secTypeRulesTitle');

    if (briefSec) briefSec.hidden = !devBacked;
    if (rulesTitle) {
      rulesTitle.textContent = devBacked ? '运营可配参数' : '触发规则';
    }

    if (readOnly) {
      if (banner) banner.hidden = true;
      form.querySelectorAll('input, select, textarea').forEach(function (el) { el.disabled = true; });
      document.getElementById('btnSaveDraft').hidden = true;
      form.querySelector('button[type=submit]').hidden = true;
      return;
    }

    form.querySelectorAll('input, select, textarea').forEach(function (el) { el.disabled = false; });
    document.getElementById('btnSaveDraft').hidden = false;
    form.querySelector('button[type=submit]').hidden = false;

    if (devBacked) {
      if (banner) banner.hidden = false;
      if (!canDev) {
        if (form.elements.code) form.elements.code.disabled = true;
        form.typeId.disabled = true;
        if (form.elements.purpose) form.elements.purpose.disabled = true;
        if (form.elements.usageGuide) form.elements.usageGuide.disabled = true;
      }
    } else if (banner) {
      banner.hidden = true;
    }

    updateActivityBriefHints(devBacked);
    updateFreqMaxState();
  }

  function updateActivityBriefHints(devBacked) {
    var briefHint = document.getElementById('briefSectionHint');
    var purposeHint = document.getElementById('purposeHint');
    var usageHint = document.getElementById('usageGuideHint');
    if (!briefHint) return;
    if (!devBacked) return;
    if (!canDev) {
      briefHint.innerHTML = '研发已填写<strong>用途与用法</strong>（只读）；您可改下方<strong>运营可配参数</strong>与补充说明。';
      if (purposeHint) purposeHint.textContent = '研发填写 · 运营只读';
      if (usageHint) usageHint.textContent = '含 C 端触发方式 · 运营只读';
    } else {
      briefHint.innerHTML = '创建研发接入活动时，请写清<strong>用途</strong>与<strong>用法</strong>，便于运营后续调参。';
      if (purposeHint) purposeHint.textContent = '面向运营：说明业务目标与用户感知';
      if (usageHint) usageHint.textContent = '含触发入口、API/埋点说明';
    }
  }

  function fillMallCats() {
    var box = document.getElementById('mallCatChips');
    box.innerHTML = S.MALL_CATS.map(function (c) {
      return '<label><input type="checkbox" name="mallCats" value="' + c.id + '"> ' + c.label + '</label>';
    }).join('');
  }

  function formatFreqDesc(period, max) {
    if (period === 'none' || !max) return '不限次数';
    if (period === 'daily') return '每日 ' + max + ' 次';
    if (period === 'weekly') return '每周 ' + max + ' 次';
    if (period === 'lifetime') return '终身 ' + max + ' 次';
    return '';
  }

  function syncFreqDesc(force) {
    var descEl = document.getElementById('fldFreqDesc');
    if (!descEl) return;
    if (freqDescTouched && !force) return;
    if (form.typeId.value === 'earn_checkin') {
      descEl.value = '每日 1 次';
      return;
    }
    var period = form.freqPeriod.value;
    var max = parseInt(form.freqMax.value, 10);
    if (period === 'none') {
      descEl.value = '不限次数';
      return;
    }
    if (!max || max < 1) {
      descEl.value = '';
      return;
    }
    descEl.value = formatFreqDesc(period, max);
  }

  function updateFreqMaxState() {
    var typeId = form.typeId.value;
    if (typeId === 'earn_checkin' || typeId === 'custom_wheel') return;
    var period = form.freqPeriod.value;
    var maxEl = document.getElementById('fldFreqMax');
    var hint = document.getElementById('freqMaxHint');
    if (period === 'none') {
      maxEl.disabled = true;
      maxEl.value = '';
      if (hint) hint.textContent = '不限次数时无需填写';
    } else {
      maxEl.disabled = false;
      if (hint) hint.textContent = '与周期组合后由系统执行频控';
    }
    syncFreqDesc();
  }

  function resolveCoolingDays(typeId) {
    if (!Risk || !S.isPointsEarnType(typeId)) return 0;
    return Risk.resolveCoolingDays(typeId);
  }

  function updateCoolingPanel() {
    var wrap = document.getElementById('fldCoolingWrap');
    var box = document.getElementById('coolingInherited');
    if (!wrap || !box) return;
    var typeId = form.typeId.value;
    var show = !isMallChannel() && S.isPointsEarnType(typeId);
    wrap.hidden = !show;
    if (!show) return;
    var days = resolveCoolingDays(typeId);
    box.textContent = days > 0 ? days + ' 天（期满转入可用积分）' : '即时可用（0 天）';
  }

  function updateChannelUI() {
    var mallSec = document.getElementById('secMallDisplay');
    if (mallSec) mallSec.hidden = !isMallChannel();
    updateCoolingPanel();
  }

  function suggestChannelForType(typeId) {
    if (typeId === 'redeem_goods' || typeId === 'custom_wheel') {
      form.channel.value = 'mall';
    }
  }

  function setFreqControls(show) {
    ['fldFreqPeriodWrap', 'fldFreqMaxWrap', 'fldFreqDescWrap'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.hidden = !show;
    });
  }

  function setCheckinFreqFixed(show) {
    var fixed = document.getElementById('fldCheckinFreqFixed');
    if (fixed) fixed.hidden = !show;
  }

  function setCapFields(showDaily, showTotal) {
    var daily = document.getElementById('fldDailyCapWrap');
    var total = document.getElementById('fldTotalCapWrap');
    if (daily) daily.hidden = !showDaily;
    if (total) total.hidden = !showTotal;
  }

  function setRewardDescVisible(show, label) {
    var wrap = document.getElementById('fldRewardDescWrap');
    var lbl = document.getElementById('fldRewardDescLabel');
    if (wrap) wrap.hidden = !show;
    if (lbl && label) lbl.textContent = label;
  }

  function applyRewardDefaultsForType(typeId) {
    if (typeId === 'earn_checkin') {
      form.freqPeriod.value = 'daily';
      form.freqMax.value = '1';
      freqDescTouched = false;
      syncFreqDesc(true);
    }
  }

  function updateCodeHintForType(typeId) {
    var el = document.getElementById('fldCodeHint');
    if (!el) return;
    if (typeId === 'campaign') {
      el.innerHTML =
        '研发在发奖逻辑中引用此编码（如 <code>POST /points/claim { code }</code>）。' +
        '<strong>新玩法须先研发接入</strong>，运营不能在此定义触发动作。';
    } else {
      el.textContent = '全局唯一，用于 API / 埋点';
    }
  }

  function opsSectionTitle(text) {
    return '<div class="ap-field ap-field-full" style="grid-column:1/-1;margin:4px 0 2px">' +
      '<strong style="font-size:13px;color:rgba(0,0,0,.85)">' + text + '</strong></div>';
  }

  function devBindingBox() {
    var code = (form.elements.code && form.elements.code.value) || (act && act.code) || '—';
    return opsSectionTitle('研发绑定（不可改）') +
      '<div class="ap-field ap-field-full">' +
      '<label>活动编码</label>' +
      '<div style="padding:8px 12px;background:#f5f5f5;border-radius:6px;font-size:13px;font-family:monospace">' + code + '</div>' +
      '<div class="hint">C 端 / 发奖 API 引用此编码；变更须研发发版</div></div>';
  }

  function campaignDevNotice() {
    return '<div class="ap-field ap-field-full">' +
      '<div style="padding:10px 12px;background:#fffbe6;border:1px solid #ffe58f;border-radius:6px;font-size:12px;line-height:1.65;color:rgba(0,0,0,.75)">' +
      '<i class="fa-solid fa-triangle-exclamation" style="color:#faad14;margin-right:6px"></i>' +
      '<strong>研发专用类型。</strong>新建须研发完成 C 端接入；运营可在已创建活动上调整时效与参数。' +
      '</div></div>';
  }

  function updateTypeRulesIntro(typeId) {
    var el = document.getElementById('typeRulesIntro');
    if (!el) return;
    if (typeId === 'redeem_goods' && act && act.devBacked) {
      var tplIntro = goodsTemplateIntro(act.goodsTemplate);
      el.innerHTML = tplIntro + ' 消耗积分与<strong>商城兑换频控</strong>在下方「奖励与频控」。';
      el.hidden = false;
      return;
    }
    var text = TYPE_RULES_INTRO[typeId];
    if (text) {
      el.innerHTML = text;
      el.hidden = false;
    } else {
      el.innerHTML = '自定义类型：按 schema 填写扩展 JSON；常用字段仍建议在下方「奖励与频控」配置积分与频控。';
      el.hidden = false;
    }
  }

  function updateRewardSectionForType(typeId) {
    var hint = document.getElementById('secRewardTypeHint');
    var ptsWrap = document.getElementById('fldRewardPointsWrap');
    var dailyCapHint = document.getElementById('dailyCapHint');
    if (!hint || !ptsWrap) return;

    ptsWrap.hidden = false;
    setFreqControls(true);
    setCheckinFreqFixed(false);
    setCapFields(true, true);
    setRewardDescVisible(true, '奖励文案');
    hint.hidden = true;
    hint.innerHTML = '';
    if (dailyCapHint) dailyCapHint.textContent = '本活动单日最多发放的积分总量';

    if (typeId === 'earn_invite') {
      ptsWrap.hidden = true;
      hint.hidden = false;
      hint.innerHTML =
        '上方填双方分值与风控；此处填<strong>能成功邀请几次</strong>（频控）与<strong>本活动积分发放上限</strong>（日/累计）。';
    } else if (typeId === 'earn_checkin') {
      ptsWrap.hidden = true;
      setFreqControls(false);
      setCheckinFreqFixed(true);
      setCapFields(false, false);
      hint.hidden = false;
      hint.innerHTML =
        '签到<strong>每日 1 次</strong>，当天得多少分由上方阶梯决定，<strong>无需日积分上限</strong>。' +
        '此处仅需填写 C 端<strong>奖励展示文案</strong>（留空则按阶梯自动生成）。';
      setRewardDescVisible(true, '奖励展示文案');
      applyRewardDefaultsForType(typeId);
    } else if (typeId === 'earn_task') {
      hint.hidden = false;
      hint.innerHTML =
        '「积分值」= 每次完成奖励；「频控」= 周期内最多完成几次。上方「触发时长」仅为完成条件。';
    } else if (typeId === 'earn_interaction') {
      hint.hidden = false;
      hint.innerHTML =
        '上方已选互动类型；此处填<strong>每次触发奖励积分</strong>与<strong>频控</strong>（如每日点赞 10 次）。';
    } else if (typeId === 'earn_subscription') {
      ptsWrap.hidden = true;
      hint.hidden = false;
      hint.innerHTML =
        '首订/续订分值在上方配置。此处「频控」建议：首订选<strong>终身 1 次</strong>；续订按业务选每日/每账期。' +
        '「累计上限」可限制单用户从本活动累计获得积分。';
      setRewardDescVisible(true, '奖励展示文案');
    } else if (typeId === 'campaign') {
      setCapFields(false, false);
      hint.hidden = false;
      hint.innerHTML =
        '参与条件由研发代码绑定「活动编码」，此处只配<strong>单次奖励、频控、展示文案</strong>。' +
        '总预算与有效期在上方；预算用尽或到期后停止发奖。';
    } else if (typeId === 'custom_wheel') {
      ptsWrap.hidden = true;
      setFreqControls(false);
      setCheckinFreqFixed(false);
      setRewardDescVisible(false);
      var descWrap = document.getElementById('fldFreqDescWrap');
      var descHint = document.getElementById('freqDescFieldHint');
      if (descWrap) descWrap.hidden = false;
      if (descHint) descHint.textContent = '留空则按「每日抽奖次数」自动生成；C 端列表展示用';
      hint.hidden = false;
      hint.innerHTML =
        '消耗积分与每日次数在上方配置；保存时自动写入积分值（负数）与频控，无需填写奖励文案。';
    } else if (typeId === 'redeem_goods') {
      setRewardDescVisible(false);
      hint.hidden = false;
      hint.innerHTML = (act && act.devBacked)
        ? '「积分值」= 单次兑换消耗（运营可调价）；权益时长/倍率在上方「运营可配参数」。'
        : '「积分值」填<strong>负数</strong>表示单次兑换消耗；库存与有效期在上方。保存时自动生成「消耗 X 积分」展示文案。';
    }
  }

  function readTypeExtrasFromForm() {
    var extra = {};
    var names = [
      'inviterPts', 'inviteePts', 'riskReview', 'triggerMinutes',
      'streakDays', 'ladder', 'resetCycle', 'actionType',
      'firstSubPoints', 'renewPoints',
      'campaignStart', 'campaignEnd', 'budgetCap',
      'stock', 'validDays', 'effectDurationHours', 'effectMultiplier', 'trialMinutes',
      'discountPercent', 'couponValidDays', 'applicablePlan',
      'freeGrantCount', 'grantValidDays', 'grantPlanTier',
      'spinCost', 'dailySpins', 'extraJson'
    ];
    names.forEach(function (n) {
      var el = form.elements[n];
      if (!el) return;
      if (el.type === 'checkbox') extra[n] = el.checked;
      else if (el.value !== '') extra[n] = el.value;
    });
    return extra;
  }

  function fillTypeExtrasFromAct() {
    if (!act) return;
    var map = {
      inviterPts: act.inviterPoints,
      inviteePts: act.inviteePoints,
      riskReview: act.riskReview,
      triggerMinutes: act.triggerMinutes,
      streakDays: act.streakDays,
      ladder: act.ladder,
      resetCycle: act.resetCycle,
      actionType: act.actionType,
      firstSubPoints: act.firstSubPoints,
      renewPoints: act.renewPoints,
      campaignStart: act.campaignStart,
      campaignEnd: act.campaignEnd,
      budgetCap: act.budgetCap,
      stock: act.stock,
      validDays: act.validDays,
      effectDurationHours: act.effectDurationHours,
      effectMultiplier: act.effectMultiplier,
      trialMinutes: act.trialMinutes,
      discountPercent: act.discountPercent,
      couponValidDays: act.couponValidDays,
      applicablePlan: act.applicablePlan,
      freeGrantCount: act.freeGrantCount,
      grantValidDays: act.grantValidDays,
      grantPlanTier: act.grantPlanTier,
      spinCost: act.spinCost,
      dailySpins: act.dailySpins,
      extraJson: act.extraJson
    };
    Object.keys(map).forEach(function (n) {
      var el = form.elements[n];
      if (!el || map[n] == null) return;
      if (el.type === 'checkbox') el.checked = !!map[n];
      else el.value = map[n];
    });
  }

  function updateTypeRulesBadge() {
    var badge = document.getElementById('typeRulesBadge');
    if (!badge) return;
    var t = S.getTypes().filter(function (x) { return x.id === form.typeId.value; })[0];
    badge.textContent = t ? t.name : '按活动类型';
  }

  function fieldHint(name, label, type, def, hint) {
    return '<div class="ap-field"><label>' + label + '</label>' +
      '<input class="ant-input" name="' + name + '" type="' + type + '" value="' + (def != null ? def : '') + '">' +
      (hint ? '<div class="hint" style="margin-top:4px;line-height:1.5">' + hint + '</div>' : '') +
      '</div>';
  }

  function goodsTemplateIntro(tpl) {
    var map = {
      points_boost: '生效时长与倍率由运营配置；C 端按编码读取 effectDurationHours、effectMultiplier。',
      trial_view: '试看时长与券有效期分开：前者为单次权益，后者为兑换后须使用的时间窗。',
      sub_discount: '「减免比例」作用于订阅应付价；「持券有效天」为兑换后须去订阅页用券的期限（与商城兑换频控无关）。',
      sub_free_count: '「免费次数」= 兑换到账的可开通/续订次数；「兑换后有效天」= 须在此期限内消耗次数（非单次订阅时长）。'
    };
    return map[tpl] || '';
  }

  function field(name, label, type, def) {
    if (type === 'checkbox') {
      return '<div class="ap-field"><label><input type="checkbox" name="' + name + '"' + (def ? ' checked' : '') + '> ' + label + '</label></div>';
    }
    return '<div class="ap-field"><label>' + label + '</label>' +
      '<input class="ant-input" name="' + name + '" type="' + type + '" value="' + (def != null ? def : '') + '"></div>';
  }

  function selectField(name, label, options, def) {
    var opts = options.map(function (o) {
      return '<option value="' + o.v + '"' + (o.v === def ? ' selected' : '') + '>' + o.l + '</option>';
    }).join('');
    return '<div class="ap-field"><label>' + label + '</label>' +
      '<select class="ant-input" name="' + name + '" style="width:100%;height:32px">' + opts + '</select></div>';
  }

  function renderTypeExtras(typeId) {
    var box = document.getElementById('typeExtraFields');
    var html = '';

    if (typeId === 'earn_task') {
      html = field('triggerMinutes', '触发时长（分钟）', 'number', '30');
    } else if (typeId === 'earn_invite') {
      html = field('inviterPts', '邀请人积分', 'number', '200') +
        field('inviteePts', '被邀请人积分', 'number', '200') +
        field('riskReview', '需风控审核', 'checkbox', true);
    } else if (typeId === 'earn_checkin') {
      html = field('streakDays', '连续签到天数', 'number', '7') +
        '<div class="ap-field ap-field-full">' +
        '<label>阶梯奖励（逗号分隔，每日积分）</label>' +
        '<input class="ant-input" name="ladder" type="text" value="10,20,30,50,70,85,100">' +
        '<div class="hint" style="margin-top:6px;line-height:1.55">' +
        '第 N 天连续签到发放第 N 个值；数量须与「连续签到天数」一致。' +
        '</div></div>' +
        selectField('resetCycle', '链重置周期', RESET_CYCLE_OPTS, 'natural_week');
    } else if (typeId === 'earn_interaction') {
      html = selectField('actionType', '互动行为类型', ACTION_TYPE_OPTS, 'like');
    } else if (typeId === 'earn_subscription') {
      html = field('firstSubPoints', '首订奖励积分', 'number', '500') +
        field('renewPoints', '续订奖励积分', 'number', '100');
    } else if (typeId === 'campaign') {
      if (canDev) html += campaignDevNotice();
      if (!canDev) html += devBindingBox();
      html += opsSectionTitle('运营可配 · 时效') +
        field('campaignStart', '开始时间', 'datetime-local', '') +
        field('campaignEnd', '结束时间', 'datetime-local', '') +
        opsSectionTitle('运营可配 · 预算') +
        field('budgetCap', '活动积分总预算', 'number', '50000');
    } else if (typeId === 'redeem_goods') {
      var tpl = getGoodsTemplate();
      if (isDevBackedContext(typeId) && tpl === 'points_boost') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · 权益参数') +
          fieldHint('effectDurationHours', '加速时长（小时）', 'number', '24', '生效期内完成任务积分按倍率结算') +
          fieldHint('effectMultiplier', '积分倍率', 'number', '1.2', '如 1.2 = 120%') +
          field('stock', '库存（-1 不限）', 'number', '-1');
      } else if (isDevBackedContext(typeId) && tpl === 'trial_view') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · 权益参数') +
          fieldHint('trialMinutes', '试看时长（分钟）', 'number', '30', '单次试看权益时长') +
          fieldHint('validDays', '兑换后有效天数', 'number', '7', '须在此期限内发起试看') +
          field('stock', '库存（-1 不限）', 'number', '-1');
      } else if (isDevBackedContext(typeId) && tpl === 'sub_discount') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · 折扣权益') +
          fieldHint('discountPercent', '订阅价减免（%）', 'number', '15', '如 15 = 减 15%（85 折）；作用于订阅应付金额') +
          fieldHint('couponValidDays', '持券有效天数', 'number', '30', '兑换后须在此期限内于订阅页用券') +
          selectField('applicablePlan', '适用套餐', APPLICABLE_PLAN_OPTS, 'monthly') +
          field('stock', '库存（-1 不限）', 'number', '500');
      } else if (isDevBackedContext(typeId) && tpl === 'sub_free_count') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · 免费次数') +
          fieldHint('freeGrantCount', '兑换获得免费次数', 'number', '1', '每 1 次 = 可开通/续订 1 次（档位见下方）') +
          fieldHint('grantValidDays', '兑换后有效天数', 'number', '14', '须在此期限内消耗免费次数') +
          selectField('grantPlanTier', '适用订阅档位', GRANT_PLAN_TIER_OPTS, 'standard') +
          field('stock', '库存（-1 不限）', 'number', '200');
      } else {
        html = field('stock', '库存（-1 不限）', 'number', '-1') +
          field('validDays', '兑换后有效天数', 'number', '1');
      }
    } else if (typeId === 'custom_wheel') {
      html = field('spinCost', '单次消耗积分', 'number', '500') +
        field('dailySpins', '每日抽奖次数', 'number', '10');
    } else {
      html = '<div class="ap-field ap-field-full"><label>扩展配置 JSON</label>' +
        '<textarea class="ant-input" name="extraJson" rows="3" placeholder=\'{"key":"value"}\'></textarea></div>';
    }

    box.innerHTML = html;
    updateTypeRulesBadge();
    updateTypeRulesIntro(typeId);
    updateCodeHintForType(typeId);
    fillTypeExtrasFromAct();
    updateRewardSectionForType(typeId);
    applyFieldLocks();

    var ladderEl = form.elements.ladder;
    if (ladderEl) {
      ladderEl.addEventListener('input', function () { /* ladder sync if needed */ });
    }
  }

  function updatePreview() {
    var url = document.getElementById('fldImage').value.trim();
    var prev = document.getElementById('imgPreview');
    if (url) {
      prev.style.backgroundImage = "url('" + url + "')";
      prev.style.display = 'block';
    } else prev.style.display = 'none';
  }

  function inferFreqFromLegacy(desc) {
    if (!desc) return { period: 'daily', max: null };
    if (/不限/.test(desc)) return { period: 'none', max: null };
    if (/自然周|重置/.test(desc)) return { period: 'daily', max: 1 };
    var m = desc.match(/(\d+)/);
    var max = m ? parseInt(m[1], 10) : null;
    if (/每周|自然周/.test(desc)) return { period: 'weekly', max: max };
    if (/终身|累计|总共/.test(desc)) return { period: 'lifetime', max: max };
    return { period: 'daily', max: max };
  }

  function populateForm() {
    if (!act) return;
    var fields = ['name', 'code', 'typeId', 'channel', 'status', 'sort', 'image', 'description',
      'rewardPoints', 'rewardDesc', 'dailyCap', 'totalCap', 'purpose', 'usageGuide', 'opsUsageNote'];
    fields.forEach(function (k) {
      var el = form.elements[k];
      if (el && act[k] != null) el.value = act[k];
    });
    if (act.typeId === 'earn_checkin') {
      form.freqPeriod.value = 'daily';
      form.freqMax.value = '1';
    } else if (act.freqPeriod) {
      form.freqPeriod.value = act.freqPeriod;
      if (act.freqMax != null) form.freqMax.value = act.freqMax;
    } else {
      var inferred = inferFreqFromLegacy(act.freqDesc);
      form.freqPeriod.value = inferred.period;
      if (inferred.max != null) form.freqMax.value = inferred.max;
    }
    if (act.freqDesc) {
      document.getElementById('fldFreqDesc').value = act.typeId === 'earn_checkin' ? '每日 1 次' : act.freqDesc;
      freqDescTouched = act.typeId !== 'earn_checkin';
    }
    if (act.mallCats) {
      form.querySelectorAll('input[name="mallCats"]').forEach(function (cb) {
        cb.checked = act.mallCats.indexOf(cb.value) >= 0;
      });
    }
    updateFreqMaxState();
    updatePreview();
    renderTypeExtras(act.typeId);
    updateChannelUI();
  }

  function collectForm(statusOverride) {
    var mallCats = [];
    if (isMallChannel()) {
      form.querySelectorAll('input[name="mallCats"]:checked').forEach(function (cb) {
        mallCats.push(cb.value);
      });
    }
    var typeId = form.typeId.value;
    var extra = readTypeExtrasFromForm();
    var period = form.freqPeriod.value;
    var freqMax = period === 'none' ? null : (parseInt(form.freqMax.value, 10) || null);
    var freqDesc = form.freqDesc.value.trim() || formatFreqDesc(period, freqMax);
    var inviter = extra.inviterPts != null ? parseInt(extra.inviterPts, 10) : null;
    var invitee = extra.inviteePts != null ? parseInt(extra.inviteePts, 10) : null;
    var ladder = extra.ladder != null ? parseLadder(extra.ladder) : [];
    var rewardPoints = parseInt(form.rewardPoints.value, 10) || 0;
    var rewardDesc = form.rewardDesc.value.trim();
    var dailyCap = form.dailyCap.value ? parseInt(form.dailyCap.value, 10) : null;
    var totalCap = form.totalCap.value ? parseInt(form.totalCap.value, 10) : null;

    if (typeId === 'earn_invite') {
      rewardPoints = inviter || 0;
      if (!rewardDesc && inviter != null && invitee != null) {
        rewardDesc = '邀请人 +' + inviter + ' / 被邀请人 +' + invitee;
      }
    } else if (typeId === 'earn_checkin') {
      period = 'daily';
      freqMax = 1;
      freqDesc = '每日 1 次';
      rewardPoints = maxLadder(ladder);
      dailyCap = null;
      totalCap = null;
      if (!rewardDesc && ladder.length) rewardDesc = formatLadderDesc(ladder);
    } else if (typeId === 'earn_subscription') {
      var firstSub = extra.firstSubPoints != null ? parseInt(extra.firstSubPoints, 10) : 0;
      var renew = extra.renewPoints != null ? parseInt(extra.renewPoints, 10) : 0;
      rewardPoints = firstSub;
      if (!rewardDesc && (firstSub || renew)) {
        rewardDesc = '首订 +' + firstSub + ' / 续订 +' + renew;
      }
    } else if (typeId === 'custom_wheel') {
      var spinCost = extra.spinCost != null ? parseInt(extra.spinCost, 10) : 0;
      var dailySpins = extra.dailySpins != null ? parseInt(extra.dailySpins, 10) : null;
      period = 'daily';
      freqMax = dailySpins;
      if (!form.freqDesc.value.trim()) {
        freqDesc = dailySpins ? '每日 ' + dailySpins + ' 次' : '';
      }
      rewardPoints = spinCost ? -Math.abs(spinCost) : rewardPoints;
      rewardDesc = spinCost ? '消耗 ' + spinCost + ' 积分 / 次' : rewardDesc;
    } else if (typeId === 'redeem_goods') {
      rewardPoints = rewardPoints > 0 ? -Math.abs(rewardPoints) : rewardPoints;
      var tpl = act && act.goodsTemplate;
      var cost = Math.abs(rewardPoints);
      if (tpl === 'sub_discount') {
        var dp = extra.discountPercent != null ? parseInt(extra.discountPercent, 10) : 0;
        var cvd = extra.couponValidDays != null ? parseInt(extra.couponValidDays, 10) : 0;
        rewardDesc = '消耗 ' + cost.toLocaleString() + ' 积分 · 订阅减 ' + dp + '% · ' + cvd + ' 天内有效';
      } else if (tpl === 'sub_free_count') {
        var fc = extra.freeGrantCount != null ? parseInt(extra.freeGrantCount, 10) : 0;
        var gvd = extra.grantValidDays != null ? parseInt(extra.grantValidDays, 10) : 0;
        rewardDesc = '消耗 ' + cost.toLocaleString() + ' 积分 · ' + fc + ' 次免费订阅 · ' + gvd + ' 天内使用';
      } else if (!rewardDesc && rewardPoints) {
        rewardDesc = '消耗 ' + cost.toLocaleString() + ' 积分';
      }
    } else if (typeId === 'campaign') {
      dailyCap = null;
      if (extra.budgetCap != null) totalCap = parseInt(extra.budgetCap, 10);
    }

    var row = {
      id: act ? act.id : S.uid(),
      name: form.name.value.trim(),
      code: form.code.value.trim().toUpperCase(),
      typeId: typeId,
      channel: form.channel.value,
      status: statusOverride || form.status.value,
      sort: parseInt(form.sort.value, 10) || 100,
      mallCats: mallCats,
      image: isMallChannel() ? form.image.value.trim() : (form.image.value.trim() || ''),
      description: (form.description && form.description.value) || '',
      rewardPoints: rewardPoints,
      rewardDesc: rewardDesc,
      freqPeriod: period,
      freqMax: freqMax,
      freqDesc: freqDesc,
      dailyCap: dailyCap,
      totalCap: totalCap,
      coolingDays: isMallChannel() || !S.isPointsEarnType(typeId) ? 0 : resolveCoolingDays(typeId)
    };

    if (typeId === 'earn_invite') {
      row.inviterPoints = inviter;
      row.inviteePoints = invitee;
      row.riskReview = !!extra.riskReview;
    }
    if (extra.triggerMinutes != null) row.triggerMinutes = parseInt(extra.triggerMinutes, 10);
    if (extra.streakDays != null) row.streakDays = parseInt(extra.streakDays, 10);
    if (extra.ladder != null) row.ladder = extra.ladder;
    if (extra.resetCycle != null) row.resetCycle = extra.resetCycle;
    if (extra.actionType != null) row.actionType = extra.actionType;
    if (extra.firstSubPoints != null) row.firstSubPoints = parseInt(extra.firstSubPoints, 10);
    if (extra.renewPoints != null) row.renewPoints = parseInt(extra.renewPoints, 10);
    if (extra.campaignStart != null) row.campaignStart = extra.campaignStart;
    if (extra.campaignEnd != null) row.campaignEnd = extra.campaignEnd;
    if (extra.budgetCap != null) row.budgetCap = parseInt(extra.budgetCap, 10);
    if (extra.stock != null) row.stock = parseInt(extra.stock, 10);
    if (extra.validDays != null) row.validDays = parseInt(extra.validDays, 10);
    if (extra.effectDurationHours != null) row.effectDurationHours = parseInt(extra.effectDurationHours, 10);
    if (extra.effectMultiplier != null) row.effectMultiplier = parseFloat(extra.effectMultiplier);
    if (extra.trialMinutes != null) row.trialMinutes = parseInt(extra.trialMinutes, 10);
    if (extra.discountPercent != null) row.discountPercent = parseInt(extra.discountPercent, 10);
    if (extra.couponValidDays != null) row.couponValidDays = parseInt(extra.couponValidDays, 10);
    if (extra.applicablePlan != null) row.applicablePlan = extra.applicablePlan;
    if (extra.freeGrantCount != null) row.freeGrantCount = parseInt(extra.freeGrantCount, 10);
    if (extra.grantValidDays != null) row.grantValidDays = parseInt(extra.grantValidDays, 10);
    if (extra.grantPlanTier != null) row.grantPlanTier = extra.grantPlanTier;
    if (extra.spinCost != null) row.spinCost = parseInt(extra.spinCost, 10);
    if (extra.dailySpins != null) row.dailySpins = parseInt(extra.dailySpins, 10);
    if (extra.extraJson != null) row.extraJson = extra.extraJson;

    if (act && act.goodsTemplate) row.goodsTemplate = act.goodsTemplate;
    if (isDevBackedContext(typeId) || (act && act.devBacked)) {
      row.devBacked = true;
      if (form.elements.purpose) row.purpose = form.elements.purpose.value.trim();
      if (form.elements.usageGuide) row.usageGuide = form.elements.usageGuide.value.trim();
      if (form.elements.opsUsageNote) row.opsUsageNote = form.elements.opsUsageNote.value.trim();
    }
    if (row.goodsTemplate === 'points_boost' && row.effectDurationHours && /积分加速卡/.test(row.name)) {
      row.name = '积分加速卡 · ' + row.effectDurationHours + 'h';
    }
    if (row.goodsTemplate === 'sub_discount' && row.discountPercent != null && /订阅折扣券/.test(row.name)) {
      row.name = '订阅折扣券 · 减 ' + row.discountPercent + '%';
    }
    if (row.goodsTemplate === 'sub_free_count' && row.freeGrantCount != null && /免费订阅次数券/.test(row.name)) {
      row.name = '免费订阅次数券 · ' + row.freeGrantCount + ' 次';
    }
    return row;
  }

  function assertCanSave() {
    if (readOnly) return false;
    if (!canDev && S.isDevOnlyType(form.typeId.value) && !act) {
      M.toast('新建研发活动须研发或管理员');
      return false;
    }
    return true;
  }

  function validateBeforeSave() {
    var typeId = form.typeId.value;
    var extra = readTypeExtrasFromForm();

    if (typeId === 'earn_checkin') {
      var days = parseInt(extra.streakDays, 10);
      var ladder = parseLadder(extra.ladder);
      if (!days || days < 1) {
        M.toast('请填写连续签到天数');
        return false;
      }
      if (ladder.length !== days) {
        M.toast('阶梯奖励须为 ' + days + ' 个数值（当前 ' + ladder.length + ' 个）');
        return false;
      }
    }
    if (typeId === 'earn_interaction' && !extra.actionType) {
      M.toast('请选择互动行为类型');
      return false;
    }
    if (typeId === 'earn_subscription') {
      if (extra.firstSubPoints == null && extra.renewPoints == null) {
        M.toast('请填写首订或续订奖励积分');
        return false;
      }
    }
    if (typeId === 'campaign') {
      if (canDev && !form.elements.purpose.value.trim()) {
        M.toast('请填写活动用途');
        return false;
      }
      if (canDev && !form.elements.usageGuide.value.trim()) {
        M.toast('请填写用法说明');
        return false;
      }
      if (!extra.campaignStart || !extra.campaignEnd) {
        M.toast('请填写研发活动开始与结束时间');
        return false;
      }
      if (!extra.budgetCap) {
        M.toast('请填写活动积分总预算');
        return false;
      }
    }
    if (typeId !== 'earn_checkin' && typeId !== 'custom_wheel') {
      if (form.freqPeriod.value !== 'none' && !form.freqMax.value) {
        M.toast('请填写频控次数上限，或选择「不限」');
        return false;
      }
    }
    if (typeId === 'custom_wheel') {
      var spins = form.elements.dailySpins;
      if (!spins || !spins.value) {
        M.toast('请填写每日抽奖次数');
        return false;
      }
    }
    if (act && act.goodsTemplate === 'sub_discount') {
      var dp = parseInt(extra.discountPercent, 10);
      var cvd = parseInt(extra.couponValidDays, 10);
      if (!dp || dp < 1 || dp > 99) {
        M.toast('减免比例须为 1–99 的整数');
        return false;
      }
      if (!cvd || cvd < 1) {
        M.toast('请填写持券有效天数');
        return false;
      }
    }
    if (act && act.goodsTemplate === 'sub_free_count') {
      var fc = parseInt(extra.freeGrantCount, 10);
      var gvd = parseInt(extra.grantValidDays, 10);
      if (!fc || fc < 1) {
        M.toast('免费次数须 ≥ 1');
        return false;
      }
      if (!gvd || gvd < 1) {
        M.toast('请填写兑换后有效天数');
        return false;
      }
    }
    return true;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!assertCanSave()) return;
    if (!form.name.value.trim() || !form.code.value.trim()) {
      M.toast('请填写名称与编码');
      return;
    }
    if (!validateBeforeSave()) return;
    S.upsertActivity(collectForm());
    M.toast('活动已保存');
    setTimeout(function () { location.href = 'activities-points-crud.html'; }, 600);
  });

  document.getElementById('btnSaveDraft').addEventListener('click', function () {
    if (!assertCanSave()) return;
    if (!validateBeforeSave()) return;
    S.upsertActivity(collectForm('draft'));
    M.toast('已存为草稿');
    setTimeout(function () { location.href = 'activities-points-crud.html'; }, 600);
  });

  document.getElementById('fldType').addEventListener('change', function () {
    if (!canDev && S.isDevOnlyType(this.value)) {
      M.toast('研发活动类型仅限研发或管理员');
      this.value = 'earn_task';
      return;
    }
    suggestChannelForType(this.value);
    renderTypeExtras(this.value);
    updateChannelUI();
  });
  document.getElementById('fldChannel').addEventListener('change', updateChannelUI);
  document.getElementById('fldFreqPeriod').addEventListener('change', function () {
    freqDescTouched = false;
    updateFreqMaxState();
  });
  document.getElementById('fldFreqMax').addEventListener('input', function () {
    freqDescTouched = false;
    syncFreqDesc();
  });
  document.getElementById('fldFreqDesc').addEventListener('input', function () {
    freqDescTouched = true;
  });
  document.getElementById('fldImage').addEventListener('input', updatePreview);

  fillTypeSelect();
  fillMallCats();
  if (Session) Session.mountRoleSwitcher(document.querySelector('.admin-header-user'));
  if (act) populateForm();
  else {
    var initType = presetType === 'campaign' ? 'campaign' : 'earn_task';
    if (presetType === 'campaign') form.typeId.value = 'campaign';
    renderTypeExtras(initType);
    updateFreqMaxState();
    updateChannelUI();
  }
  applyFieldLocks();
})();
