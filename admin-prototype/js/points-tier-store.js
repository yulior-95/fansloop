/**
 * 积分分层 · 后台 Mock（与 C 端共用 localStorage key）
 */
(function (global) {
    var T = global.FLPointsTier;
    if (!T) return;

    var MOCK_MONITOR = {
        todayIssued: 48260,
        todayBudget: 80000,
        tierUserPct: 34.2,
        avgMultiplier: 1.28,
        anomalyCount: 2,
        ruleContribution: [
            { id: 'consecutiveLoginGte', label: '连续登录', points: 12400, pct: 42 },
            { id: 'hasEngagement', label: '互动行为', points: 8200, pct: 28 },
            { id: 'hasSubscription', label: '订阅用户', points: 6100, pct: 21 },
            { id: 'registerDaysLte', label: '新用户', points: 2600, pct: 9 }
        ],
        trend7d: [
            { date: '06-05', base: 52000, bonus: 6800 },
            { date: '06-06', base: 54800, bonus: 7200 },
            { date: '06-07', base: 50100, bonus: 6100 },
            { date: '06-08', base: 56300, bonus: 8400 },
            { date: '06-09', base: 58900, bonus: 9100 },
            { date: '06-10', base: 61200, bonus: 9800 },
            { date: '06-11', base: 42100, bonus: 6160 }
        ],
        recentIssues: [
            { time: '2026-06-11 09:42', uid: '882910', rule: '观看满 30 分钟', base: 50, multiplier: 1.38, final: 69, status: 'ok' },
            { time: '2026-06-11 09:15', uid: '102938', rule: '每日签到', base: 20, multiplier: 1.2, final: 24, status: 'ok' },
            { time: '2026-06-11 08:50', uid: '771204', rule: '邀请拉新', base: 200, multiplier: 3.0, final: 600, status: 'capped' },
            { time: '2026-06-11 08:22', uid: '559012', rule: '浏览赚积分', base: 100, multiplier: 1.15, final: 115, status: 'ok' },
            { time: '2026-06-11 07:55', uid: '882910', rule: '观看满 30 分钟', base: 50, multiplier: 1.38, final: 69, status: 'ok' }
        ]
    };

    function getConfig() {
        return T.loadConfig();
    }

    function putConfig(cfg) {
        return T.saveConfig(cfg);
    }

    function simulateUser(uid, overrides) {
        var cfg = getConfig();
        var user = Object.assign({}, T.DEFAULT_USER, overrides || {});
        if (uid === 'new') user = { registerDays: 2, consecutiveLoginDays: 2, hasEngagement: false, hasSubscription: false };
        if (uid === 'vip') user = { registerDays: 120, consecutiveLoginDays: 14, hasEngagement: true, hasSubscription: true };
        var matched = T.matchRules(cfg, user);
        return {
            uid: uid || 'demo',
            user: user,
            matched: matched,
            effectiveMultiplier: T.calcEffectiveMultiplier(matched, cfg),
            sample50: T.calcReward(50, user, cfg),
            sample200: T.calcReward(200, user, cfg)
        };
    }

    function fetchMonitor() {
        return Promise.resolve(JSON.parse(JSON.stringify(MOCK_MONITOR)));
    }

    global.FLAdminPointsTier = {
        getConfig: getConfig,
        putConfig: putConfig,
        resetConfig: T.resetConfig,
        simulateUser: simulateUser,
        fetchMonitor: fetchMonitor,
        RULE_META: T.RULE_META
    };
})(typeof window !== 'undefined' ? window : this);
