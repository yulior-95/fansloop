/**
 * 积分分层配置 · 共享 Mock 数据层
 * API: GET/PUT /api/v1/admin/points-tier-config
 *      GET /api/v1/points/tier-status
 */
(function (global) {
    var LS_KEY = 'fl_points_tier_config_v3';
    var LS_BONUS_DAY = 'fl_points_tier_bonus_day_v1';

    var RULE_META = {
        registerDaysLte: { label: '新用户注册', hint: '注册时锁定 · 短窗口低倍率 · 仅对新注册用户配置生效', icon: 'fa-user-plus' },
        consecutiveLoginGte: { label: '连续登录', hint: '高门槛 + 加成天数上限 · 断签失效', icon: 'fa-calendar-check' },
        hasEngagement: { label: '互动行为', hint: '有效互动 + 多作者 · 排除自刷', icon: 'fa-heart' },
        hasSubscription: { label: '订阅用户', hint: '有效付费订阅且连续订阅满 N 天', icon: 'fa-crown' }
    };

    var EXCLUDED_ACTIVITY_OPTIONS = [
        { id: 'earn_invite', label: '邀请拉新' },
        { id: 'earn_task', label: '计时任务' },
        { id: 'earn_checkin', label: '签到链' },
        { id: 'earn_interaction', label: '互动行为' },
        { id: 'earn_subscription', label: '订阅行为' },
        { id: 'campaign', label: '研发活动' },
        { id: 'custom_wheel', label: '幸运转盘' }
    ];

    var DEFAULT_CONFIG = {
        maxCombinedMultiplier: 1.5,
        globalMaxMultiplier: 1.65,
        stackMode: 'multiply',
        externalBoostStackMode: 'max_only',
        dailyTierBonusCap: 80,
        excludedActivityTypes: ['earn_invite', 'campaign'],
        rules: {
            registerDaysLte: { enabled: true, days: 5, multiplier: 1.08 },
            consecutiveLoginGte: {
                enabled: true,
                days: 14,
                multiplier: 1.04,
                bonusMaxDays: 21
            },
            hasEngagement: {
                enabled: true,
                multiplier: 1.06,
                windowDays: 7,
                minActions: 5,
                minDistinctPosts: 3,
                minDistinctAuthors: 2,
                minAccountAgeDays: 3,
                excludeSelfContent: true
            },
            hasSubscription: {
                enabled: true,
                multiplier: 1.08,
                requireActive: true,
                minPaidAmount: 4.99,
                minSubscribedDays: 7
            }
        },
        updatedAt: '2026-06-04 10:00',
        updatedBy: '活动运营'
    };

    var DEFAULT_USER = {
        registerDays: 5,
        newUserTierDaysAtRegister: 5,
        newUserTierMultiplierAtRegister: 1.08,
        consecutiveLoginDays: 16,
        consecutiveLoginBonusDaysUsed: 8,
        engagementActions: 6,
        engagementDistinctPosts: 4,
        engagementDistinctAuthors: 3,
        engagementSelfContentOnly: false,
        hasActivePaidSubscription: true,
        subscriptionPaidAmount: 9.9,
        subscriptionDays: 30,
        hasEngagement: true,
        hasSubscription: true
    };

    function deepMerge(base, patch) {
        if (!patch || typeof patch !== 'object') return base;
        Object.keys(patch).forEach(function (key) {
            if (patch[key] && typeof patch[key] === 'object' && !Array.isArray(patch[key])) {
                base[key] = deepMerge(base[key] || {}, patch[key]);
            } else if (patch[key] !== undefined) {
                base[key] = patch[key];
            }
        });
        return base;
    }

    function loadConfig() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (raw) {
                var cfg = deepMerge(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), JSON.parse(raw));
                if (cfg.rules && cfg.rules.registerDaysLte) delete cfg.rules.registerDaysLte.applyMode;
                return cfg;
            }
        } catch (e) { /* ignore */ }
        return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }

    function saveConfig(cfg) {
        var next = Object.assign({}, cfg, {
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            updatedBy: '活动运营'
        });
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(next));
        } catch (e) { /* ignore */ }
        return next;
    }

    function resetConfig() {
        try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
        return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }

    function todayKey() {
        return new Date().toISOString().slice(0, 10);
    }

    function readDailyBonusUsed() {
        try {
            var raw = localStorage.getItem(LS_BONUS_DAY);
            if (!raw) return 0;
            var row = JSON.parse(raw);
            return row.date === todayKey() ? (row.used || 0) : 0;
        } catch (e) {
            return 0;
        }
    }

    function addDailyBonusUsed(delta) {
        if (!delta || delta <= 0) return;
        var used = readDailyBonusUsed() + delta;
        try {
            localStorage.setItem(LS_BONUS_DAY, JSON.stringify({ date: todayKey(), used: used }));
        } catch (e) { /* ignore */ }
    }

    function isActivityExcluded(cfg, activityTypeId) {
        if (!activityTypeId || !cfg) return false;
        var list = cfg.excludedActivityTypes || [];
        return list.indexOf(activityTypeId) >= 0;
    }

    function engagementQualified(rule, user) {
        if (rule.minAccountAgeDays && (user.registerDays || 0) < rule.minAccountAgeDays) return false;
        if (rule.excludeSelfContent && user.engagementSelfContentOnly) return false;
        var actions = user.engagementActions;
        var posts = user.engagementDistinctPosts;
        var authors = user.engagementDistinctAuthors;
        if (typeof actions !== 'number') return false;
        var minActions = rule.minActions != null ? rule.minActions : 5;
        var minPosts = rule.minDistinctPosts != null ? rule.minDistinctPosts : 3;
        var minAuthors = rule.minDistinctAuthors != null ? rule.minDistinctAuthors : 2;
        if (actions < minActions || posts < minPosts) return false;
        if (authors != null && authors < minAuthors) return false;
        return true;
    }

    function subscriptionQualified(rule, user) {
        var active = user.hasActivePaidSubscription;
        if (active == null) active = user.hasSubscription;
        if (!active) return false;
        var minPaid = rule.minPaidAmount != null ? rule.minPaidAmount : 0;
        var paid = user.subscriptionPaidAmount != null ? user.subscriptionPaidAmount : 0;
        if (paid < minPaid) return false;
        var minSubDays = rule.minSubscribedDays != null ? rule.minSubscribedDays : 7;
        if ((user.subscriptionDays || 0) < minSubDays) return false;
        return true;
    }

    function consecutiveLoginQualified(rule, user) {
        if (!rule || !rule.enabled || (rule.multiplier || 1) <= 1) return null;
        if ((user.consecutiveLoginDays || 0) < (rule.days || 0)) return null;
        var maxBonusDays = rule.bonusMaxDays;
        var used = user.consecutiveLoginBonusDaysUsed || 0;
        if (maxBonusDays != null && maxBonusDays > 0 && used >= maxBonusDays) return null;
        return { used: used, maxBonusDays: maxBonusDays };
    }

    function resolveNewUserTierSnapshot(rule, user) {
        var configuredDays = rule.days || 0;
        var configuredMul = rule.multiplier || 1;
        var lockedDays = user.newUserTierDaysAtRegister;
        var lockedMul = user.newUserTierMultiplierAtRegister;
        if (lockedDays == null || lockedDays === '') lockedDays = configuredDays;
        if (lockedMul == null || lockedMul === '') lockedMul = configuredMul;
        return {
            limitDays: lockedDays,
            multiplier: lockedMul,
            configuredDays: configuredDays,
            configuredMul: configuredMul
        };
    }

    function registerDaysQualified(rule, user) {
        if (!rule || !rule.enabled || (rule.multiplier || 1) <= 1) return null;
        var snap = resolveNewUserTierSnapshot(rule, user);
        if (user.registerDays > snap.limitDays) return null;
        if ((snap.multiplier || 1) <= 1) return null;
        return snap;
    }

    function matchRules(cfg, user) {
        var matched = [];
        var rules = cfg.rules || {};

        var regRule = rules.registerDaysLte;
        var regSnap = regRule && registerDaysQualified(regRule, user);
        if (regSnap) {
            var remain = Math.max(0, regSnap.limitDays - user.registerDays);
            matched.push({
                id: 'registerDaysLte',
                label: RULE_META.registerDaysLte.label,
                multiplier: regSnap.multiplier,
                detail: '注册第 ' + user.registerDays + '/' + regSnap.limitDays + ' 天 · 锁定 ×' + regSnap.multiplier + ' · 剩余 ' + remain + ' 天'
            });
        }

        var loginRule = rules.consecutiveLoginGte;
        var loginSnap = loginRule && consecutiveLoginQualified(loginRule, user);
        if (loginSnap) {
            var loginRemain = loginSnap.maxBonusDays
                ? Math.max(0, loginSnap.maxBonusDays - loginSnap.used)
                : null;
            matched.push({
                id: 'consecutiveLoginGte',
                label: RULE_META.consecutiveLoginGte.label,
                multiplier: loginRule.multiplier,
                detail: '已连续 ' + user.consecutiveLoginDays + ' 天' +
                    (loginRemain != null ? ' · 加成剩余 ' + loginRemain + ' 天' : '') +
                    ' · 断签失效'
            });
        }

        if (rules.hasEngagement && rules.hasEngagement.enabled && engagementQualified(rules.hasEngagement, user) &&
            (rules.hasEngagement.multiplier || 1) > 1) {
            var win = rules.hasEngagement.windowDays || 7;
            matched.push({
                id: 'hasEngagement',
                label: RULE_META.hasEngagement.label,
                multiplier: rules.hasEngagement.multiplier,
                detail: '近 ' + win + ' 日互动 ' + user.engagementActions + ' 次 · ' +
                    user.engagementDistinctPosts + ' 帖 · ' + (user.engagementDistinctAuthors || 0) + ' 作者'
            });
        }
        if (rules.hasSubscription && rules.hasSubscription.enabled && subscriptionQualified(rules.hasSubscription, user) &&
            (rules.hasSubscription.multiplier || 1) > 1) {
            matched.push({
                id: 'hasSubscription',
                label: RULE_META.hasSubscription.label,
                multiplier: rules.hasSubscription.multiplier,
                detail: '付费订阅中 · 已订 ' + (user.subscriptionDays || 0) + ' 天 · 实付 ' + (user.subscriptionPaidAmount || 0)
            });
        }
        return matched;
    }

    function resolveMatchedRules(cfg, user) {
        var matched = matchRules(cfg, user);
        var external = getExternalBoostMultiplier();
        var loginSuppressedForBoost = false;
        if (external.multiplier > 1) {
            loginSuppressedForBoost = matched.some(function (m) { return m.id === 'consecutiveLoginGte'; });
            matched = matched.filter(function (m) { return m.id !== 'consecutiveLoginGte'; });
        }
        return { matched: matched, loginSuppressedForBoost: loginSuppressedForBoost };
    }

    function calcTierMultiplier(matched, cfg) {
        if (!matched.length) return 1;
        var raw = matched.reduce(function (acc, r) { return acc * r.multiplier; }, 1);
        var cap = (cfg && cfg.maxCombinedMultiplier) || 1.5;
        return Math.min(raw, cap);
    }

    function getExternalBoostMultiplier() {
        var Store = global.MallVouchersStore;
        if (!Store || !Store.getActivePointsBoost) return { multiplier: 1, source: null };
        var boost = Store.getActivePointsBoost();
        if (!boost) return { multiplier: 1, source: null };
        return {
            multiplier: boost.multiplier || 1,
            source: boost,
            label: boost.name || '积分加速卡'
        };
    }

    function calcCombinedMultiplier(tierMul, cfg) {
        var external = getExternalBoostMultiplier();
        var mode = (cfg && cfg.externalBoostStackMode) || 'max_only';
        var combined = tierMul;
        if (external.multiplier > 1) {
            if (mode === 'tier_only') combined = tierMul;
            else if (mode === 'max_only') combined = Math.max(tierMul, external.multiplier);
            else combined = tierMul * external.multiplier;
        }
        var globalCap = (cfg && cfg.globalMaxMultiplier) || 1.65;
        return {
            tierMultiplier: tierMul,
            externalMultiplier: external.multiplier,
            effectiveMultiplier: Math.min(combined, globalCap),
            externalBoost: external.source,
            globalCapped: combined > globalCap
        };
    }

    function applyDailyBonusCap(bonus, cfg, track, bonusContext) {
        var cap = cfg && cfg.dailyTierBonusCap;
        if (!cap || cap <= 0 || bonus <= 0) return { bonus: bonus, bonusCapped: false, bonusSkipped: 0 };
        var used = bonusContext && bonusContext.getUsed
            ? bonusContext.getUsed()
            : readDailyBonusUsed();
        var remain = Math.max(0, cap - used);
        var actual = Math.min(bonus, remain);
        if (track && actual > 0) {
            if (bonusContext && bonusContext.addUsed) bonusContext.addUsed(actual);
            else addDailyBonusUsed(actual);
        }
        return {
            bonus: actual,
            bonusCapped: actual < bonus,
            bonusSkipped: bonus - actual,
            dailyBonusUsed: used + actual,
            dailyBonusCap: cap
        };
    }

    function calcReward(basePoints, user, cfg, options) {
        cfg = cfg || loadConfig();
        user = user || DEFAULT_USER;
        options = options || {};

        if (options.tierExcludedOverride || isActivityExcluded(cfg, options.activityTypeId)) {
            return {
                basePoints: basePoints,
                tierMultiplier: 1,
                externalMultiplier: 1,
                effectiveMultiplier: 1,
                finalPoints: basePoints,
                bonusPoints: 0,
                tierExcluded: true,
                excludedActivityType: options.tierExcludedOverride ? 'voucher_policy' : options.activityTypeId,
                tierBreakdown: []
            };
        }

        var resolved = resolveMatchedRules(cfg, user);
        var matched = resolved.matched;
        var loginSuppressedForBoost = resolved.loginSuppressedForBoost;
        var tierMul = calcTierMultiplier(matched, cfg);
        var combined = calcCombinedMultiplier(tierMul, cfg);
        var rawFinal = Math.round(basePoints * combined.effectiveMultiplier);
        var bonus = rawFinal - basePoints;
        var capResult = applyDailyBonusCap(bonus, cfg, options.trackDailyBonus !== false, options.bonusContext);
        var finalPoints = basePoints + capResult.bonus;
        return {
            basePoints: basePoints,
            tierMultiplier: tierMul,
            externalMultiplier: combined.externalMultiplier,
            effectiveMultiplier: combined.effectiveMultiplier,
            finalPoints: finalPoints,
            bonusPoints: capResult.bonus,
            tierCapped: matched.reduce(function (a, r) { return a * r.multiplier; }, 1) > tierMul,
            globalCapped: combined.globalCapped,
            bonusCapped: capResult.bonusCapped,
            dailyTierBonusCap: capResult.dailyBonusCap,
            dailyTierBonusUsed: capResult.dailyBonusUsed,
            tierBreakdown: matched,
            externalBoost: combined.externalBoost,
            loginSuppressedForBoost: loginSuppressedForBoost
        };
    }

    function buildRuleDesc(id, rule) {
        var meta = RULE_META[id];
        if (id === 'registerDaysLte') {
            return '新注册用户享 ≤ ' + (rule.days || 0) + ' 天 · ×' + (rule.multiplier || 1) +
                '（注册时锁定，后台改动不影响已注册用户）';
        }
        if (id === 'consecutiveLoginGte') {
            return '连登 ≥ ' + (rule.days || 0) + ' 天 · ×' + (rule.multiplier || 1) +
                ' · 加成最多 ' + (rule.bonusMaxDays || 21) + ' 天 · 断签失效';
        }
        if (id === 'hasEngagement') {
            return '近 ' + (rule.windowDays || 7) + ' 日 ≥ ' + (rule.minActions || 5) + ' 次互动、≥ ' +
                (rule.minDistinctPosts || 3) + ' 帖、≥ ' + (rule.minDistinctAuthors || 2) +
                ' 作者 · 账号 ≥ ' + (rule.minAccountAgeDays || 3) + ' 天 · ×' + (rule.multiplier || 1);
        }
        if (id === 'hasSubscription') {
            return '有效付费订阅 ≥ ' + (rule.minSubscribedDays || 7) + ' 天 · 实付 ≥ ' +
                (rule.minPaidAmount || 0) + ' · ×' + (rule.multiplier || 1);
        }
        return meta.hint;
    }

    function fetchUserStatus() {
        var RS = global.FLPointsRewardService;
        if (RS && RS.fetchUserTierStatus) {
            return RS.fetchUserTierStatus();
        }
        var cfg = loadConfig();
        var user = JSON.parse(JSON.stringify(DEFAULT_USER));
        var matched = matchRules(cfg, user);
        var tierMul = calcTierMultiplier(matched, cfg);
        var combined = calcCombinedMultiplier(tierMul, cfg);
        var allRules = Object.keys(RULE_META).map(function (id) {
            var rule = (cfg.rules || {})[id] || {};
            var isMatched = matched.some(function (m) { return m.id === id; });
            var meta = RULE_META[id];
            return {
                id: id,
                label: meta.label,
                desc: buildRuleDesc(id, rule),
                icon: meta.icon,
                enabled: !!rule.enabled,
                multiplier: rule.multiplier || 1,
                matched: isMatched && rule.enabled
            };
        });
        return Promise.resolve({
            effectiveMultiplier: combined.effectiveMultiplier,
            tierMultiplier: tierMul,
            externalMultiplier: combined.externalMultiplier,
            capped: matched.reduce(function (a, r) { return a * r.multiplier; }, 1) > tierMul,
            globalCapped: combined.globalCapped,
            dailyTierBonusCap: cfg.dailyTierBonusCap,
            dailyTierBonusUsed: readDailyBonusUsed(),
            excludedActivityTypes: cfg.excludedActivityTypes || [],
            rules: allRules,
            matched: matched,
            user: user,
            config: cfg,
            externalBoost: combined.externalBoost
        });
    }

    function formatMultiplier(n) {
        var s = Number(n).toFixed(2).replace(/\.?0+$/, '');
        return '×' + s;
    }

    function enrichLedgerRow(row, cfg, user) {
        if (row.type !== 'earn' || row.points <= 0) return row;
        if (row.tierMultiplier != null && row.effectiveMultiplier != null) return row;
        var base = row.basePoints || row.points;
        var detail = calcReward(base, user, cfg, {
            trackDailyBonus: false,
            activityTypeId: row.activityTypeId
        });
        return Object.assign({}, row, {
            basePoints: detail.basePoints,
            tierMultiplier: detail.tierMultiplier,
            effectiveMultiplier: detail.effectiveMultiplier,
            points: detail.finalPoints,
            tierBreakdown: detail.tierBreakdown,
            bonusPoints: detail.bonusPoints
        });
    }

    function formatExcludedLabels(ids) {
        if (!ids || !ids.length) return '无';
        return ids.map(function (id) {
            var opt = EXCLUDED_ACTIVITY_OPTIONS.find(function (o) { return o.id === id; });
            return opt ? opt.label : id;
        }).join('、');
    }

    function getConflictNotes(cfg) {
        cfg = cfg || loadConfig();
        var excluded = formatExcludedLabels(cfg.excludedActivityTypes || []);
        return [
            {
                id: 'server_settlement',
                level: 'resolved',
                title: 'C 端仅读已发布配置 · 发奖走服务端结算',
                detail: '运营保存草稿后须「发布上线」；用户端按 POST /api/v1/points/tasks/:id/claim 结算，画像与每日配额由服务端维护，不信任浏览器改 localStorage。'
            },
            {
                id: 'login_vs_boost',
                level: 'info',
                title: '连续登录 × 积分加速卡',
                detail: '两者不同时生效：用户已兑换积分加速卡且在有效期内时，连续登录分层不参与结算；其余分层规则仍可与加速卡按「取较高者」合并。'
            },
            {
                id: 'anti_abuse_hardened',
                level: 'resolved',
                title: '默认防薅参数',
                detail: '分层封顶 ×' + (cfg.maxCombinedMultiplier || 1.5) + '、全局 ×' + (cfg.globalMaxMultiplier || 1.65) +
                    '、每日加成上限 ' + (cfg.dailyTierBonusCap || 80) + ' 分；不参与分层：' + excluded +
                    '；加速卡取较高者；签到翻倍卡生效时只走翻倍、不叠分层。'
            }
        ];
    }

    global.FLPointsTier = {
        LS_KEY: LS_KEY,
        RULE_META: RULE_META,
        EXCLUDED_ACTIVITY_OPTIONS: EXCLUDED_ACTIVITY_OPTIONS,
        DEFAULT_CONFIG: DEFAULT_CONFIG,
        DEFAULT_USER: DEFAULT_USER,
        loadConfig: loadConfig,
        saveConfig: saveConfig,
        resetConfig: resetConfig,
        isActivityExcluded: isActivityExcluded,
        matchRules: matchRules,
        resolveMatchedRules: resolveMatchedRules,
        calcTierMultiplier: calcTierMultiplier,
        calcEffectiveMultiplier: calcTierMultiplier,
        calcCombinedMultiplier: calcCombinedMultiplier,
        calcReward: calcReward,
        fetchUserStatus: fetchUserStatus,
        formatMultiplier: formatMultiplier,
        enrichLedgerRow: enrichLedgerRow,
        buildRuleDesc: buildRuleDesc,
        formatExcludedLabels: formatExcludedLabels,
        getConflictNotes: getConflictNotes,
        readDailyBonusUsed: readDailyBonusUsed,
        resolveNewUserTierSnapshot: resolveNewUserTierSnapshot,
        registerDaysQualified: registerDaysQualified
    };
})(typeof window !== 'undefined' ? window : this);
