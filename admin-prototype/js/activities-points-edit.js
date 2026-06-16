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

  var STYLE_ID_OPTS = [
    { v: 'purple', l: '紫色字色（purple）' },
    { v: 'neon', l: '霓虹字色（neon）' }
  ];

  var FRAME_ID_OPTS = [
    { v: 'neon', l: '霓虹外框（neon）' }
  ];

  var BENEFIT_USAGE_OPTS = [
    { v: 'count_with_expiry', l: '次数制（须配有效天，过期作废剩余次数）' },
    { v: 'duration_unlimited', l: '时长制（有效期内不限次数）' }
  ];

  var MEMBER_AUDIENCE_OPTS = [
    { v: 'non_member_or_expiring', l: '非会员或剩余 ≤7 天可兑' },
    { v: 'non_member_only', l: '仅非会员可兑（会员置灰）' },
    { v: 'everyone', l: '不限（会员也可立即兑换）' }
  ];

  var MEMBER_STACK_OPTS = [
    { v: 'queue_after_current', l: '排队叠加（当前会员结束后生效）' },
    { v: 'reject_if_active', l: '会员期内不可兑（已是会员则禁用）' }
  ];

  var FEE_SCOPE_OPTS = [
    { v: 'mint', l: '仅铸造 Mint' },
    { v: 'trade', l: '仅二级市场交易' },
    { v: 'both', l: '铸造 + 交易' }
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
        if (form.elements.devLogicNote) form.elements.devLogicNote.disabled = true;
      }
    } else if (banner) {
      banner.hidden = true;
    }

    updateActivityBriefHints(devBacked);
    updateDevLogicPanel();
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

  function fillMallThumbTagDatalist() {
    var dl = document.getElementById('mallThumbTagList');
    if (!dl || !S.MALL_THUMB_TAGS) return;
    dl.innerHTML = S.MALL_THUMB_TAGS.map(function (t) {
      return '<option value="' + t + '">';
    }).join('');
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resolveDevLogicNote() {
    var el = document.getElementById('fldDevLogicNote');
    if (el && el.value.trim()) return el.value.trim();
    if (act && act.devLogicNote) return act.devLogicNote;
    if (act && act.goodsTemplate === 'membership_pass' && S.MEMBERSHIP_DEV_LOGIC) {
      return S.MEMBERSHIP_DEV_LOGIC;
    }
    return '';
  }

  function devLogicGlassPreview(note) {
    return '<div class="ap-field ap-field-full ap-dev-glass-field">' +
      '<div class="ap-dev-glass ap-dev-glass-prominent">' +
      '<div class="ap-dev-glass-head">' +
      '<i class="fa-solid fa-wand-magic-sparkles"></i> To 研发 · 业务逻辑说明' +
      '<span class="ap-dev-glass-badge">运营只读</span></div>' +
      '<div class="ap-dev-glass-content">' + escHtml(note).replace(/\n/g, '<br>') + '</div>' +
      '<div class="ap-dev-glass-foot">说明 C 端按钮态、叠加与有效期冲突等业务规则，非字段参数释义。' +
      (canDev && !readOnly ? ' 研发可在下方「活动说明」中修改本文。' : '') +
      '</div></div></div>';
  }

  function syncDevLogicNoteField() {
    var el = document.getElementById('fldDevLogicNote');
    if (!el) return;
    var note = resolveDevLogicNote();
    if (note && !el.value.trim()) el.value = note;
  }

  function updateDevLogicPanel() {
    var wrap = document.getElementById('devLogicGlassWrap');
    var el = document.getElementById('fldDevLogicNote');
    if (!wrap || !el) return;
    var isMembership = act && act.goodsTemplate === 'membership_pass';
    syncDevLogicNoteField();
    if (isMembership) {
      wrap.hidden = !canDev || readOnly;
      el.disabled = readOnly || !canDev;
      return;
    }
    var show = !!(act && act.devBacked && (act.devLogicNote || el.value.trim()));
    wrap.hidden = !show;
    if (!show) return;
    el.disabled = readOnly || !canDev;
  }

  function formatFreqDesc(period, max) {
    if (period === 'none' || !max) return '不限次数';
    if (period === 'daily') return '每日 ' + max + ' 次';
    if (period === 'weekly') return '每周 ' + max + ' 次';
    if (period === 'monthly') return '每月 ' + max + ' 次';
    if (period === 'quarterly') return '限购 ' + max + ' / 季';
    if (period === 'yearly') return '限购 ' + max + ' / 年';
    if (period === 'per_round') return '限购 ' + max + ' / 期';
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
      'tipGrantUses', 'subsidyPercent', 'maxSubsidyPerTip', 'minTipAmount', 'maxTipAmount', 'subsidyBudgetCap',
      'grantUses', 'ppvViewHours', 'capFrom', 'capTo', 'multiplier', 'bonusPercent', 'styleId', 'frameId',
      'benefitUsageMode', 'membershipDays', 'memberAudience', 'memberStackPolicy',
      'qualificationWindow', 'drawRoundId', 'maxDiscountPerTx', 'feeScope', 'requiresChainActivity',
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
      tipGrantUses: act.tipGrantUses,
      subsidyPercent: act.subsidyPercent,
      maxSubsidyPerTip: act.maxSubsidyPerTip,
      minTipAmount: act.minTipAmount,
      maxTipAmount: act.maxTipAmount,
      subsidyBudgetCap: act.subsidyBudgetCap,
      grantUses: act.grantUses,
      ppvViewHours: act.ppvViewHours,
      capFrom: act.capFrom,
      capTo: act.capTo,
      multiplier: act.multiplier,
      bonusPercent: act.bonusPercent,
      styleId: act.styleId,
      frameId: act.frameId,
      benefitUsageMode: act.benefitUsageMode,
      membershipDays: act.membershipDays,
      memberAudience: act.memberAudience,
      memberStackPolicy: act.memberStackPolicy,
      qualificationWindow: act.qualificationWindow,
      drawRoundId: act.drawRoundId,
      maxDiscountPerTx: act.maxDiscountPerTx,
      feeScope: act.feeScope,
      requiresChainActivity: act.requiresChainActivity,
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
      points_boost: '时长制：生效小时内完成任务积分按倍率结算；不限完成次数。',
      ppv_trial: '次数制：每张券解锁 1 篇试看；「持券有效天」到期后未用次数作废。「解锁后观看小时」为单次权益时长。',
      ppv_discount: '次数制：每张券 1 次 5 折下单；须配持券有效天，与试看券不可叠加。',
      sub_discount: '次数制：每张券 1 次订阅可用；「持券有效天」为兑换后须去订阅页用券的期限（与商城兑换频控无关）。',
      sub_free_count: '次数制：「免费次数」= 可开通/续订次数；「兑换后有效天」= 须在此期限内消耗（过期作废）。',
      tip_boost: '次数制：每次打赏消耗 1 次；「持券有效天」到期后剩余次数作废。补贴比例与单笔上限分开配置。',
      daily_cap_boost: '时长制：兑换当日（或配置天数内）提升积分上限，不限任务完成次数；次日 0 点恢复默认。',
      checkin_double: '次数制：下一次签到消耗 1 次并按倍率结算；须在有效天内使用，过期作废。',
      invite_boost: '时长制：有效天内邀请返利按加成比例上浮，不限邀请次数。',
      comment_highlight: '时长制：有效天内评论均展示专属字色，不限评论条数。',
      avatar_frame: '时长制：有效天内全站展示头像外框，不限展示场景。',
      membership_pass: '次数制：兑换获得 1 次会员开通资格；须在持券有效天内激活。持券期 ≠ 会员期。会员叠加规则见「To 研发」说明。',
      sfl_qualification: '次数制：1 次抽签资格；须在资格有效天 / 窗口期内使用，过期作废。非 Token 直发。',
      airdrop_ticket: '次数制：每张券 1 次抽奖；须在当期开奖前使用（grantValidDays 对齐活动期）。',
      nft_fee_discount: '次数制：每张券 1 次 Mint/交易手续费折扣；须在持券期内使用，过期作废。',
      staking_boost: '时长制：有效天内质押收益按加成比例上浮，不限质押笔数；须链上活动期开启。'
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
      } else if (isDevBackedContext(typeId) && tpl === 'ppv_trial') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · 试看券（按次数）') +
          selectField('benefitUsageMode', '权益消耗模式', BENEFIT_USAGE_OPTS, 'count_with_expiry') +
          fieldHint('grantUses', '兑换获得试看次数', 'number', '1', '每 1 次 = 免费解锁 1 篇付费内容') +
          fieldHint('grantValidDays', '兑换后有效天数', 'number', '7', '须在此期限内消耗次数，过期作废') +
          fieldHint('ppvViewHours', '解锁后观看时长（小时）', 'number', '24', '单次解锁后可反复观看的时长') +
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
          selectField('benefitUsageMode', '权益消耗模式', BENEFIT_USAGE_OPTS, 'count_with_expiry') +
          fieldHint('discountPercent', '订阅价减免（%）', 'number', '15', '如 10 = 9 折（减 10%）；作用于订阅应付金额') +
          fieldHint('couponValidDays', '持券有效天数', 'number', '30', '兑换后须在此期限内于订阅页用券，过期作废') +
          selectField('applicablePlan', '适用套餐', APPLICABLE_PLAN_OPTS, 'monthly') +
          field('stock', '库存（-1 不限）', 'number', '500');
      } else if (isDevBackedContext(typeId) && tpl === 'sub_free_count') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · 免费次数') +
          selectField('benefitUsageMode', '权益消耗模式', BENEFIT_USAGE_OPTS, 'count_with_expiry') +
          fieldHint('freeGrantCount', '兑换获得免费次数', 'number', '1', '每 1 次 = 可开通/续订 1 次（档位见下方）') +
          fieldHint('grantValidDays', '兑换后有效天数', 'number', '14', '须在此期限内消耗免费次数，过期作废') +
          selectField('grantPlanTier', '适用订阅档位', GRANT_PLAN_TIER_OPTS, 'standard') +
          field('stock', '库存（-1 不限）', 'number', '200');
      } else if (isDevBackedContext(typeId) && tpl === 'tip_boost') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · 打赏加成（按次数）') +
          selectField('benefitUsageMode', '权益消耗模式', BENEFIT_USAGE_OPTS, 'count_with_expiry') +
          fieldHint('tipGrantUses', '兑换获得打赏次数', 'number', '3', '每 1 次 = 可在 1 笔打赏中使用平台补贴（非时长制）') +
          fieldHint('grantValidDays', '兑换后有效天数', 'number', '14', '须在此期限内消耗全部次数，过期作废') +
          fieldHint('subsidyPercent', '平台补贴比例（%）', 'number', '10', '如 10 = 用户付 100，创作者实收 110') +
          fieldHint('maxSubsidyPerTip', '单笔补贴上限（USDT）', 'number', '50', '防止大额打赏导致平台亏损') +
          fieldHint('minTipAmount', '最低生效打赏额（USDT）', 'number', '10', '低于此金额不触发补贴') +
          fieldHint('maxTipAmount', '单笔最高补贴基数（USDT）', 'number', '500', '超过部分不计入补贴计算') +
          fieldHint('subsidyBudgetCap', '活动补贴总预算（USDT）', 'number', '100000', '平台补贴累计达上限后停发，-1 不限') +
          field('stock', '库存（-1 不限）', 'number', '410');
      } else if (isDevBackedContext(typeId) && tpl === 'ppv_discount') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · 单篇折扣（按次数）') +
          selectField('benefitUsageMode', '权益消耗模式', BENEFIT_USAGE_OPTS, 'count_with_expiry') +
          fieldHint('discountPercent', '折扣力度（% off）', 'number', '50', '如 50 = 5 折（减 50%）') +
          fieldHint('grantUses', '兑换获得使用次数', 'number', '1', '每 1 次 = 1 篇付费内容下单可用') +
          fieldHint('grantValidDays', '兑换后有效天数', 'number', '14', '须在此期限内消耗次数，过期作废') +
          field('stock', '库存（-1 不限）', 'number', '-1');
      } else if (isDevBackedContext(typeId) && tpl === 'daily_cap_boost') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · 每日上限（时长制）') +
          selectField('benefitUsageMode', '权益消耗模式', BENEFIT_USAGE_OPTS, 'duration_unlimited') +
          fieldHint('capFrom', '默认日上限（积分）', 'number', '50', '未兑换时的基准上限') +
          fieldHint('capTo', '提升后日上限（积分）', 'number', '100', '兑换生效当日的上限') +
          fieldHint('grantValidDays', '生效天数', 'number', '1', '通常为 1（仅当日）；多日则连续生效') +
          field('stock', '库存（-1 不限）', 'number', '-1');
      } else if (isDevBackedContext(typeId) && tpl === 'checkin_double') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · 签到翻倍（按次数）') +
          selectField('benefitUsageMode', '权益消耗模式', BENEFIT_USAGE_OPTS, 'count_with_expiry') +
          fieldHint('grantUses', '翻倍可用次数', 'number', '1', '每 1 次 = 下一次签到奖励翻倍') +
          fieldHint('grantValidDays', '兑换后有效天数', 'number', '7', '须在此期限内消耗次数，过期作废') +
          fieldHint('multiplier', '签到奖励倍率', 'number', '2', '如 2 = 奖励 ×2') +
          field('stock', '库存（-1 不限）', 'number', '-1');
      } else if (isDevBackedContext(typeId) && tpl === 'invite_boost') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · 邀请加成（时长制）') +
          selectField('benefitUsageMode', '权益消耗模式', BENEFIT_USAGE_OPTS, 'duration_unlimited') +
          fieldHint('grantValidDays', '生效天数', 'number', '7', '有效期内不限邀请次数') +
          fieldHint('bonusPercent', '返利加成比例（%）', 'number', '10', '如 10 = 邀请返利 +10%') +
          field('stock', '库存（-1 不限）', 'number', '-1');
      } else if (isDevBackedContext(typeId) && tpl === 'comment_highlight') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · 评论高亮（时长制）') +
          selectField('benefitUsageMode', '权益消耗模式', BENEFIT_USAGE_OPTS, 'duration_unlimited') +
          fieldHint('grantValidDays', '生效天数', 'number', '7', '有效期内评论均高亮，不限条数') +
          selectField('styleId', '字色样式', STYLE_ID_OPTS, 'purple') +
          field('stock', '库存（-1 不限）', 'number', '-1');
      } else if (isDevBackedContext(typeId) && tpl === 'avatar_frame') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · 头像框（时长制）') +
          selectField('benefitUsageMode', '权益消耗模式', BENEFIT_USAGE_OPTS, 'duration_unlimited') +
          fieldHint('grantValidDays', '生效天数', 'number', '30', '有效期内全站展示外框') +
          selectField('frameId', '外框样式', FRAME_ID_OPTS, 'neon') +
          field('stock', '库存（-1 不限）', 'number', '-1');
      } else if (isDevBackedContext(typeId) && tpl === 'membership_pass') {
        if (!canDev) html += devBindingBox();
        syncDevLogicNoteField();
        html += devLogicGlassPreview(resolveDevLogicNote());
        html += opsSectionTitle('运营可配 · 会员身份（按次数激活）') +
          selectField('benefitUsageMode', '权益消耗模式', BENEFIT_USAGE_OPTS, 'count_with_expiry') +
          fieldHint('membershipDays', '会员时长（天）', 'number', '7', '激活后实际开通的会员天数') +
          fieldHint('grantUses', '兑换获得开通次数', 'number', '1', '每 1 次 = 可激活 1 段会员时长') +
          fieldHint('grantValidDays', '持券有效天（须激活）', 'number', '30', '兑换后须在此期限内激活，过期未激活作废') +
          selectField('memberAudience', '兑换资格', MEMBER_AUDIENCE_OPTS, 'non_member_or_expiring') +
          selectField('memberStackPolicy', '会员叠加策略', MEMBER_STACK_OPTS, 'queue_after_current') +
          field('stock', '库存（-1 不限）', 'number', '320');
      } else if (isDevBackedContext(typeId) && tpl === 'sfl_qualification') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · SFL 资格（按次数）') +
          selectField('benefitUsageMode', '权益消耗模式', BENEFIT_USAGE_OPTS, 'count_with_expiry') +
          fieldHint('grantUses', '抽签资格次数', 'number', '1', '每 1 次 = 1 次公募/兑换窗口抽签') +
          fieldHint('grantValidDays', '资格有效天', 'number', '90', '须在此期限内参与抽签，过期作废') +
          fieldHint('qualificationWindow', '窗口编码', 'text', 'SFL_PHASE_2', '研发绑定的公募/兑换窗口 ID') +
          field('stock', '库存（-1 不限）', 'number', '42');
      } else if (isDevBackedContext(typeId) && tpl === 'airdrop_ticket') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · 空投抽奖券（按次数）') +
          selectField('benefitUsageMode', '权益消耗模式', BENEFIT_USAGE_OPTS, 'count_with_expiry') +
          fieldHint('grantUses', '每张券抽奖次数', 'number', '1', '每 1 次 = 1 次空投抽奖机会') +
          fieldHint('grantValidDays', '当期内有效天', 'number', '14', '须在当期开奖前使用，过期作废') +
          fieldHint('drawRoundId', '当期编码', 'text', 'AIRDROP_2026_Q2', '研发绑定的空投期次 ID') +
          field('stock', '库存（-1 不限）', 'number', '1800');
      } else if (isDevBackedContext(typeId) && tpl === 'nft_fee_discount') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · NFT 手续费折扣（按次数）') +
          selectField('benefitUsageMode', '权益消耗模式', BENEFIT_USAGE_OPTS, 'count_with_expiry') +
          fieldHint('discountPercent', '手续费减免（%）', 'number', '15', '如 15 = 85 折') +
          fieldHint('grantUses', '可用次数', 'number', '1', '每 1 次 = 1 笔 Mint 或交易') +
          fieldHint('grantValidDays', '持券有效天', 'number', '30', '须在此期限内使用，过期作废') +
          fieldHint('maxDiscountPerTx', '单笔补贴上限（USDT）', 'number', '50', '防止大额交易补贴过高') +
          selectField('feeScope', '适用场景', FEE_SCOPE_OPTS, 'both') +
          field('stock', '库存（-1 不限）', 'number', '210');
      } else if (isDevBackedContext(typeId) && tpl === 'staking_boost') {
        if (!canDev) html += devBindingBox();
        html += opsSectionTitle('运营可配 · 质押加成（时长制）') +
          selectField('benefitUsageMode', '权益消耗模式', BENEFIT_USAGE_OPTS, 'duration_unlimited') +
          fieldHint('grantValidDays', '生效天数', 'number', '30', '有效期内质押收益加成，不限笔数') +
          fieldHint('bonusPercent', '收益加成比例（%）', 'number', '5', '如 5 = 质押收益 +5%') +
          field('requiresChainActivity', '须链上活动期', 'checkbox', true) +
          field('stock', '库存（-1 不限）', 'number', '75');
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
    if (/每月/.test(desc)) return { period: 'monthly', max: max };
    if (/每季|\/ 季/.test(desc)) return { period: 'quarterly', max: max };
    if (/每年|\/ 年/.test(desc)) return { period: 'yearly', max: max };
    if (/\/ 期/.test(desc)) return { period: 'per_round', max: max };
    if (/终身|累计|总共/.test(desc)) return { period: 'lifetime', max: max };
    return { period: 'daily', max: max };
  }

  function populateForm() {
    if (!act) return;
    var fields = ['name', 'code', 'typeId', 'channel', 'status', 'sort', 'image', 'description',
      'rewardPoints', 'rewardDesc', 'dailyCap', 'totalCap', 'purpose', 'usageGuide', 'opsUsageNote',
      'mallThumbTag', 'devLogicNote'];
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
    if (act.goodsTemplate === 'membership_pass') {
      var noteEl = form.elements.devLogicNote;
      if (noteEl && !noteEl.value.trim()) {
        noteEl.value = act.devLogicNote || S.MEMBERSHIP_DEV_LOGIC || '';
      }
    }
    updateFreqMaxState();
    updatePreview();
    renderTypeExtras(act.typeId);
    updateChannelUI();
    updateDevLogicPanel();
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
      } else if (tpl === 'tip_boost') {
        var tu = extra.tipGrantUses != null ? parseInt(extra.tipGrantUses, 10) : 0;
        var tvd = extra.grantValidDays != null ? parseInt(extra.grantValidDays, 10) : 0;
        var sp = extra.subsidyPercent != null ? parseInt(extra.subsidyPercent, 10) : 0;
        rewardDesc = '消耗 ' + cost.toLocaleString() + ' 积分 · ' + tu + ' 次打赏补贴 · 补贴 ' + sp + '% · ' + tvd + ' 天内使用';
      } else if (tpl === 'ppv_trial') {
        var gu = extra.grantUses != null ? parseInt(extra.grantUses, 10) : 1;
        var pvd = extra.grantValidDays != null ? parseInt(extra.grantValidDays, 10) : 0;
        rewardDesc = '消耗 ' + cost.toLocaleString() + ' 积分 · ' + gu + ' 次试看 · ' + pvd + ' 天内使用';
      } else if (tpl === 'ppv_discount') {
        var pd = extra.discountPercent != null ? parseInt(extra.discountPercent, 10) : 0;
        var pdu = extra.grantUses != null ? parseInt(extra.grantUses, 10) : 1;
        var pdd = extra.grantValidDays != null ? parseInt(extra.grantValidDays, 10) : 0;
        rewardDesc = '消耗 ' + cost.toLocaleString() + ' 积分 · ' + (100 - pd) / 10 + ' 折 · ' + pdu + ' 次 · ' + pdd + ' 天内使用';
      } else if (tpl === 'daily_cap_boost') {
        var cf = extra.capFrom != null ? parseInt(extra.capFrom, 10) : 0;
        var ct = extra.capTo != null ? parseInt(extra.capTo, 10) : 0;
        rewardDesc = '消耗 ' + cost.toLocaleString() + ' 积分 · 当日上限 ' + cf + '→' + ct;
      } else if (tpl === 'checkin_double') {
        var cdu = extra.grantUses != null ? parseInt(extra.grantUses, 10) : 1;
        var cdd = extra.grantValidDays != null ? parseInt(extra.grantValidDays, 10) : 0;
        var mul = extra.multiplier != null ? parseFloat(extra.multiplier) : 2;
        rewardDesc = '消耗 ' + cost.toLocaleString() + ' 积分 · 下次签到 ×' + mul + ' · ' + cdd + ' 天内使用';
      } else if (tpl === 'invite_boost') {
        var ibd = extra.grantValidDays != null ? parseInt(extra.grantValidDays, 10) : 0;
        var bp = extra.bonusPercent != null ? parseInt(extra.bonusPercent, 10) : 0;
        rewardDesc = '消耗 ' + cost.toLocaleString() + ' 积分 · 邀请返利 +' + bp + '% · ' + ibd + ' 日';
      } else if (tpl === 'comment_highlight') {
        var chd = extra.grantValidDays != null ? parseInt(extra.grantValidDays, 10) : 0;
        rewardDesc = '消耗 ' + cost.toLocaleString() + ' 积分 · 评论专属字色 · ' + chd + ' 日';
      } else if (tpl === 'avatar_frame') {
        var afd = extra.grantValidDays != null ? parseInt(extra.grantValidDays, 10) : 0;
        rewardDesc = '消耗 ' + cost.toLocaleString() + ' 积分 · 霓虹外框 · ' + afd + ' 日';
      } else if (tpl === 'membership_pass') {
        var md = extra.membershipDays != null ? parseInt(extra.membershipDays, 10) : 0;
        var mgvd = extra.grantValidDays != null ? parseInt(extra.grantValidDays, 10) : 0;
        rewardDesc = '消耗 ' + cost.toLocaleString() + ' 积分 · ' + md + ' 天会员 · ' + mgvd + ' 天内激活';
      } else if (tpl === 'sfl_qualification') {
        var sqd = extra.grantValidDays != null ? parseInt(extra.grantValidDays, 10) : 0;
        rewardDesc = '消耗 ' + cost.toLocaleString() + ' 积分 · 1 次抽签资格 · ' + sqd + ' 天内有效';
      } else if (tpl === 'airdrop_ticket') {
        rewardDesc = '消耗 ' + cost.toLocaleString() + ' 积分 · 1 次抽奖 · 当期内有效';
      } else if (tpl === 'nft_fee_discount') {
        var nfd = extra.discountPercent != null ? parseInt(extra.discountPercent, 10) : 0;
        var nfvd = extra.grantValidDays != null ? parseInt(extra.grantValidDays, 10) : 0;
        rewardDesc = '消耗 ' + cost.toLocaleString() + ' 积分 · 手续费 ' + (100 - nfd) + ' 折 · 1 次 · ' + nfvd + ' 天内使用';
      } else if (tpl === 'staking_boost') {
        var sbd = extra.grantValidDays != null ? parseInt(extra.grantValidDays, 10) : 0;
        var sbp = extra.bonusPercent != null ? parseInt(extra.bonusPercent, 10) : 0;
        rewardDesc = '消耗 ' + cost.toLocaleString() + ' 积分 · 质押收益 +' + sbp + '% · ' + sbd + ' 日';
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
    if (extra.tipGrantUses != null) row.tipGrantUses = parseInt(extra.tipGrantUses, 10);
    if (extra.subsidyPercent != null) row.subsidyPercent = parseInt(extra.subsidyPercent, 10);
    if (extra.maxSubsidyPerTip != null) row.maxSubsidyPerTip = parseInt(extra.maxSubsidyPerTip, 10);
    if (extra.minTipAmount != null) row.minTipAmount = parseInt(extra.minTipAmount, 10);
    if (extra.maxTipAmount != null) row.maxTipAmount = parseInt(extra.maxTipAmount, 10);
    if (extra.subsidyBudgetCap != null) row.subsidyBudgetCap = parseInt(extra.subsidyBudgetCap, 10);
    if (extra.grantUses != null) row.grantUses = parseInt(extra.grantUses, 10);
    if (extra.ppvViewHours != null) row.ppvViewHours = parseInt(extra.ppvViewHours, 10);
    if (extra.capFrom != null) row.capFrom = parseInt(extra.capFrom, 10);
    if (extra.capTo != null) row.capTo = parseInt(extra.capTo, 10);
    if (extra.multiplier != null) row.multiplier = parseFloat(extra.multiplier);
    if (extra.bonusPercent != null) row.bonusPercent = parseInt(extra.bonusPercent, 10);
    if (extra.styleId != null) row.styleId = extra.styleId;
    if (extra.frameId != null) row.frameId = extra.frameId;
    if (extra.benefitUsageMode != null) row.benefitUsageMode = extra.benefitUsageMode;
    if (extra.membershipDays != null) row.membershipDays = parseInt(extra.membershipDays, 10);
    if (extra.memberAudience != null) row.memberAudience = extra.memberAudience;
    if (extra.memberStackPolicy != null) row.memberStackPolicy = extra.memberStackPolicy;
    if (extra.qualificationWindow != null) row.qualificationWindow = extra.qualificationWindow;
    if (extra.drawRoundId != null) row.drawRoundId = extra.drawRoundId;
    if (extra.maxDiscountPerTx != null) row.maxDiscountPerTx = parseInt(extra.maxDiscountPerTx, 10);
    if (extra.feeScope != null) row.feeScope = extra.feeScope;
    if (extra.requiresChainActivity != null) row.requiresChainActivity = !!extra.requiresChainActivity;
    if (extra.spinCost != null) row.spinCost = parseInt(extra.spinCost, 10);
    if (extra.dailySpins != null) row.dailySpins = parseInt(extra.dailySpins, 10);
    if (extra.extraJson != null) row.extraJson = extra.extraJson;

    if (isMallChannel() && form.elements.mallThumbTag) {
      row.mallThumbTag = form.elements.mallThumbTag.value.trim();
    }
    if (form.elements.devLogicNote && form.elements.devLogicNote.value.trim()) {
      row.devLogicNote = form.elements.devLogicNote.value.trim();
    }
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
    if (row.goodsTemplate === 'tip_boost' && row.tipGrantUses != null && /打赏加成卡/.test(row.name)) {
      row.name = '打赏加成卡 · ' + row.tipGrantUses + ' 次';
    }
    if (row.goodsTemplate === 'ppv_discount' && row.discountPercent != null && /单篇/.test(row.name)) {
      row.name = '单篇 ' + ((100 - row.discountPercent) / 10) + ' 折券';
    }
    if (row.goodsTemplate === 'invite_boost' && row.grantValidDays != null && /邀请加成卡/.test(row.name)) {
      row.name = '邀请加成卡 · ' + row.grantValidDays + ' 日';
    }
    if (row.goodsTemplate === 'comment_highlight' && row.grantValidDays != null && /评论高亮/.test(row.name)) {
      row.name = '评论高亮 · ' + row.grantValidDays + ' 日';
    }
    if (row.goodsTemplate === 'membership_pass' && row.membershipDays != null && /会员身份/.test(row.name)) {
      row.name = '会员身份 · ' + row.membershipDays + ' 天';
    }
    if (row.goodsTemplate === 'staking_boost' && row.grantValidDays != null && /质押加成券/.test(row.name)) {
      row.name = '质押加成券 · ' + row.grantValidDays + ' 日';
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
    if (act && act.goodsTemplate === 'tip_boost') {
      var tu = parseInt(extra.tipGrantUses, 10);
      var tvd2 = parseInt(extra.grantValidDays, 10);
      var sp2 = parseInt(extra.subsidyPercent, 10);
      var cap = parseInt(extra.maxSubsidyPerTip, 10);
      var minTip = parseInt(extra.minTipAmount, 10);
      if (!tu || tu < 1) {
        M.toast('打赏次数须 ≥ 1');
        return false;
      }
      if (!tvd2 || tvd2 < 1) {
        M.toast('请填写兑换后有效天数');
        return false;
      }
      if (!sp2 || sp2 < 1 || sp2 > 100) {
        M.toast('补贴比例须为 1–100 的整数');
        return false;
      }
      if (!cap || cap < 1) {
        M.toast('请填写单笔补贴上限');
        return false;
      }
      if (!minTip || minTip < 1) {
        M.toast('请填写最低生效打赏额');
        return false;
      }
    }
    if (act && act.goodsTemplate === 'ppv_trial') {
      var gu = parseInt(extra.grantUses, 10);
      var pvd = parseInt(extra.grantValidDays, 10);
      if (!gu || gu < 1) {
        M.toast('试看次数须 ≥ 1');
        return false;
      }
      if (!pvd || pvd < 1) {
        M.toast('请填写兑换后有效天数');
        return false;
      }
    }
    if (act && act.goodsTemplate === 'ppv_discount') {
      var pdp = parseInt(extra.discountPercent, 10);
      var pdu = parseInt(extra.grantUses, 10);
      var pdd = parseInt(extra.grantValidDays, 10);
      if (!pdp || pdp < 1 || pdp > 99) {
        M.toast('折扣力度须为 1–99 的整数');
        return false;
      }
      if (!pdu || pdu < 1) {
        M.toast('使用次数须 ≥ 1');
        return false;
      }
      if (!pdd || pdd < 1) {
        M.toast('请填写兑换后有效天数');
        return false;
      }
    }
    if (act && act.goodsTemplate === 'daily_cap_boost') {
      var cf = parseInt(extra.capFrom, 10);
      var ct = parseInt(extra.capTo, 10);
      var dcd = parseInt(extra.grantValidDays, 10);
      if (!cf || cf < 1) {
        M.toast('请填写默认日上限');
        return false;
      }
      if (!ct || ct <= cf) {
        M.toast('提升后上限须大于默认上限');
        return false;
      }
      if (!dcd || dcd < 1) {
        M.toast('请填写生效天数');
        return false;
      }
    }
    if (act && act.goodsTemplate === 'checkin_double') {
      var cdu = parseInt(extra.grantUses, 10);
      var cdd = parseInt(extra.grantValidDays, 10);
      var mul = parseFloat(extra.multiplier);
      if (!cdu || cdu < 1) {
        M.toast('翻倍次数须 ≥ 1');
        return false;
      }
      if (!cdd || cdd < 1) {
        M.toast('请填写兑换后有效天数');
        return false;
      }
      if (!mul || mul <= 1) {
        M.toast('签到倍率须大于 1');
        return false;
      }
    }
    if (act && act.goodsTemplate === 'invite_boost') {
      var ibd = parseInt(extra.grantValidDays, 10);
      var ibp = parseInt(extra.bonusPercent, 10);
      if (!ibd || ibd < 1) {
        M.toast('请填写生效天数');
        return false;
      }
      if (!ibp || ibp < 1 || ibp > 100) {
        M.toast('加成比例须为 1–100 的整数');
        return false;
      }
    }
    if (act && act.goodsTemplate === 'comment_highlight') {
      var chd = parseInt(extra.grantValidDays, 10);
      if (!chd || chd < 1) {
        M.toast('请填写生效天数');
        return false;
      }
      if (!extra.styleId) {
        M.toast('请选择字色样式');
        return false;
      }
    }
    if (act && act.goodsTemplate === 'avatar_frame') {
      var afd = parseInt(extra.grantValidDays, 10);
      if (!afd || afd < 1) {
        M.toast('请填写生效天数');
        return false;
      }
      if (!extra.frameId) {
        M.toast('请选择外框样式');
        return false;
      }
    }
    if (act && act.goodsTemplate === 'membership_pass') {
      var mdv = parseInt(extra.membershipDays, 10);
      var mgu = parseInt(extra.grantUses, 10);
      var mgvd2 = parseInt(extra.grantValidDays, 10);
      if (!mdv || mdv < 1) {
        M.toast('请填写会员时长');
        return false;
      }
      if (!mgu || mgu < 1) {
        M.toast('开通次数须 ≥ 1');
        return false;
      }
      if (!mgvd2 || mgvd2 < 1) {
        M.toast('请填写持券有效天');
        return false;
      }
    }
    if (act && act.goodsTemplate === 'sfl_qualification') {
      if (!parseInt(extra.grantUses, 10) || !parseInt(extra.grantValidDays, 10)) {
        M.toast('请填写资格次数与有效天');
        return false;
      }
    }
    if (act && act.goodsTemplate === 'airdrop_ticket') {
      if (!parseInt(extra.grantUses, 10) || !parseInt(extra.grantValidDays, 10)) {
        M.toast('请填写抽奖次数与当期内有效天');
        return false;
      }
    }
    if (act && act.goodsTemplate === 'nft_fee_discount') {
      var nftd = parseInt(extra.discountPercent, 10);
      var nftu = parseInt(extra.grantUses, 10);
      var nftv = parseInt(extra.grantValidDays, 10);
      var nftc = parseInt(extra.maxDiscountPerTx, 10);
      if (!nftd || nftd < 1 || nftd > 99) {
        M.toast('手续费减免须为 1–99');
        return false;
      }
      if (!nftu || !nftv || !nftc) {
        M.toast('请填写次数、有效天与单笔补贴上限');
        return false;
      }
    }
    if (act && act.goodsTemplate === 'staking_boost') {
      if (!parseInt(extra.grantValidDays, 10) || !parseInt(extra.bonusPercent, 10)) {
        M.toast('请填写生效天数与加成比例');
        return false;
      }
    }
    if (act && act.benefitUsageMode === 'count_with_expiry') {
      var usesKey = act.goodsTemplate === 'tip_boost' ? 'tipGrantUses'
        : (act.goodsTemplate === 'sub_free_count' ? 'freeGrantCount' : 'grantUses');
      if (act.goodsTemplate === 'sub_discount') {
        if (!parseInt(extra.couponValidDays, 10)) {
          M.toast('次数制权益须配置持券有效天');
          return false;
        }
      } else if (act.goodsTemplate !== 'sub_discount' && usesKey && form.elements[usesKey]) {
        var u = parseInt(extra[usesKey], 10);
        var d = parseInt(extra.grantValidDays, 10);
        if (u && (!d || d < 1)) {
          M.toast('次数制权益须同时配置有效天数，过期剩余次数作废');
          return false;
        }
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
  fillMallThumbTagDatalist();
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
