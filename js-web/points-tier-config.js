/**
 * 积分分层配置 · 共享 Mock 数据层
 * API: GET/PUT /api/v1/admin/points-tier-config
 *      GET /api/v1/points/tier-status
 */
(function (global) {
    var LS_KEY = 'fl_points_tier_config_v1';

    var RULE_META = {
        registerDaysLte: { label: '新用户注册', hint: '注册天数 ≤ X 天', icon: 'fa-user-plus' },
        consecutiveLoginGte: { label: '连续登录', hint: '连续登录 ≥ X 天', icon: 'fa-calendar-check' },
        hasEngagement: { label: '互动行为', hint: '有点赞 / 评论', icon: 'fa-heart' },
        hasSubscription: { label: '订阅用户', hint: '产生过订阅行为', icon: 'fa-crown' }
    };

    var DEFAULT_CONFIG = {
        maxCombinedMultiplier: 3.0,
        stackMode: 'multiply',
        rules: {
            registerDaysLte: { enabled: true, days: 7, multiplier: 1.0 },
            consecutiveLoginGte: { enabled: true, days: 3, multiplier: 1.2 },
            hasEngagement: { enabled: true, multiplier: 1.15 },
            hasSubscription: { enabled: true, multiplier: 1.5 }
        },
        updatedAt: '2026-06-04 10:00',
        updatedBy: '活动运营'
    };

    var DEFAULT_USER = {
        registerDays: 5,
        consecutiveLoginDays: 4,
        hasEngagement: true,
        hasSubscription: false
    };

    function loadConfig() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (raw) return JSON.parse(raw);
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

    function matchRules(cfg, user) {
        var matched = [];
        var rules = cfg.rules || {};

        if (rules.registerDaysLte && rules.registerDaysLte.enabled &&
            user.registerDays <= (rules.registerDaysLte.days || 0)) {
            matched.push({
                id: 'registerDaysLte',
                label: RULE_META.registerDaysLte.label,
                multiplier: rules.registerDaysLte.multiplier,
                detail: '注册 ' + user.registerDays + ' 天'
            });
        }
        if (rules.consecutiveLoginGte && rules.consecutiveLoginGte.enabled &&
            user.consecutiveLoginDays >= (rules.consecutiveLoginGte.days || 0)) {
            matched.push({
                id: 'consecutiveLoginGte',
                label: RULE_META.consecutiveLoginGte.label,
                multiplier: rules.consecutiveLoginGte.multiplier,
                detail: '已连续 ' + user.consecutiveLoginDays + ' 天'
            });
        }
        if (rules.hasEngagement && rules.hasEngagement.enabled && user.hasEngagement) {
            matched.push({
                id: 'hasEngagement',
                label: RULE_META.hasEngagement.label,
                multiplier: rules.hasEngagement.multiplier,
                detail: '近 7 日有点赞/评论'
            });
        }
        if (rules.hasSubscription && rules.hasSubscription.enabled && user.hasSubscription) {
            matched.push({
                id: 'hasSubscription',
                label: RULE_META.hasSubscription.label,
                multiplier: rules.hasSubscription.multiplier,
                detail: '已订阅创作者'
            });
        }
        return matched;
    }

    function calcEffectiveMultiplier(matched, cfg) {
        if (!matched.length) return 1;
        var raw = matched.reduce(function (acc, r) { return acc * r.multiplier; }, 1);
        var cap = (cfg && cfg.maxCombinedMultiplier) || 3;
        return Math.min(raw, cap);
    }

    function calcReward(basePoints, user, cfg) {
        cfg = cfg || loadConfig();
        user = user || DEFAULT_USER;
        var matched = matchRules(cfg, user);
        var effective = calcEffectiveMultiplier(matched, cfg);
        var finalPoints = Math.round(basePoints * effective);
        var bonus = finalPoints - basePoints;
        return {
            basePoints: basePoints,
            tierMultiplier: effective,
            finalPoints: finalPoints,
            bonusPoints: bonus,
            capped: matched.reduce(function (a, r) { return a * r.multiplier; }, 1) > effective,
            tierBreakdown: matched
        };
    }

    function fetchUserStatus() {
        var cfg = loadConfig();
        var user = JSON.parse(JSON.stringify(DEFAULT_USER));
        var matched = matchRules(cfg, user);
        var allRules = Object.keys(RULE_META).map(function (id) {
            var rule = (cfg.rules || {})[id] || {};
            var isMatched = matched.some(function (m) { return m.id === id; });
            var meta = RULE_META[id];
            var desc = meta.hint;
            if (id === 'registerDaysLte' && rule.days != null) desc = '注册 ≤ ' + rule.days + ' 天 · ×' + rule.multiplier;
            if (id === 'consecutiveLoginGte' && rule.days != null) desc = '连登 ≥ ' + rule.days + ' 天 · ×' + rule.multiplier;
            if (id === 'hasEngagement') desc = '点赞/评论 · ×' + (rule.multiplier || 1);
            if (id === 'hasSubscription') desc = '订阅行为 · ×' + (rule.multiplier || 1);
            return {
                id: id,
                label: meta.label,
                desc: desc,
                icon: meta.icon,
                enabled: !!rule.enabled,
                multiplier: rule.multiplier || 1,
                matched: isMatched && rule.enabled
            };
        });
        return Promise.resolve({
            effectiveMultiplier: calcEffectiveMultiplier(matched, cfg),
            capped: matched.reduce(function (a, r) { return a * r.multiplier; }, 1) > calcEffectiveMultiplier(matched, cfg),
            rules: allRules,
            matched: matched,
            user: user,
            config: cfg
        });
    }

    function formatMultiplier(n) {
        var s = Number(n).toFixed(2).replace(/\.?0+$/, '');
        return '×' + s;
    }

    function enrichLedgerRow(row, cfg, user) {
        if (row.type !== 'earn' || row.points <= 0) return row;
        if (row.tierMultiplier != null) return row;
        var base = row.basePoints || row.points;
        var detail = calcReward(base, user, cfg);
        return Object.assign({}, row, {
            basePoints: detail.basePoints,
            tierMultiplier: detail.tierMultiplier,
            points: detail.finalPoints,
            tierBreakdown: detail.tierBreakdown,
            bonusPoints: detail.bonusPoints
        });
    }

    global.FLPointsTier = {
        LS_KEY: LS_KEY,
        RULE_META: RULE_META,
        DEFAULT_CONFIG: DEFAULT_CONFIG,
        DEFAULT_USER: DEFAULT_USER,
        loadConfig: loadConfig,
        saveConfig: saveConfig,
        resetConfig: resetConfig,
        matchRules: matchRules,
        calcEffectiveMultiplier: calcEffectiveMultiplier,
        calcReward: calcReward,
        fetchUserStatus: fetchUserStatus,
        formatMultiplier: formatMultiplier,
        enrichLedgerRow: enrichLedgerRow
    };
})(typeof window !== 'undefined' ? window : this);
