/**
 * 积分分层 · 后台 Mock（草稿与已发布配置分离）
 */
(function (global) {
    var T = global.FLPointsTier;
    var RS = global.FLPointsRewardService;
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

    function baseUser(overrides) {
        return Object.assign({
            registerDays: 5,
            newUserTierDaysAtRegister: 7,
            newUserTierMultiplierAtRegister: 1.12,
            consecutiveLoginDays: 2,
            engagementActions: 0,
            engagementDistinctPosts: 0,
            hasActivePaidSubscription: false,
            hasEngagement: false,
            hasSubscription: false
        }, overrides || {});
    }

    function registerPolicyNote(cfg, user) {
        var rule = (cfg.rules || {}).registerDaysLte;
        if (!rule) return null;
        var snap = T.resolveNewUserTierSnapshot(rule, user);
        var matched = user.registerDays <= snap.limitDays;
        var cfgDays = rule.days || 0;
        var lines = [
            '后台当前配置：' + cfgDays + ' 天 · ×' + (rule.multiplier || 1),
            '该用户锁定：' + snap.limitDays + ' 天 · ×' + snap.multiplier,
            '注册第 ' + user.registerDays + ' 天 · ' + (matched ? '仍命中' : '已超出锁定窗口')
        ];
        if (user.registerDays === 7 && cfgDays === 6) {
            lines.push('改短场景：已注册用户仍按锁定 ' + snap.limitDays + ' 天执行，第7天' + (matched ? '仍生效' : '失效'));
        } else if (user.registerDays === 7 && cfgDays === 9) {
            lines.push('改长场景：已注册用户不追溯延长，锁定窗口仍为 ' + snap.limitDays + ' 天');
        }
        return lines.join(' · ');
    }

    function getConfig() {
        return T.loadConfig();
    }

    function putConfig(cfg) {
        return T.saveConfig(cfg);
    }

    function publishConfig(cfg) {
        if (!RS || !RS.publishConfig) {
            return { error: '发布服务不可用' };
        }
        return RS.publishConfig(cfg || getConfig(), { by: '活动运营' });
    }

    function getPublishedMeta() {
        return RS && RS.getPublishedMeta ? RS.getPublishedMeta() : null;
    }

    function getPublishedConfig() {
        return RS && RS.loadPublishedConfig ? RS.loadPublishedConfig() : getConfig();
    }

    function simulateUser(uid, overrides) {
        var cfg = getConfig();
        var user = Object.assign({}, T.DEFAULT_USER, overrides || {});
        var regRule = cfg.rules && cfg.rules.registerDaysLte;
        if (uid === 'new') {
            user = baseUser({
                registerDays: 2,
                consecutiveLoginDays: 2,
                newUserTierDaysAtRegister: (regRule && regRule.days) || 5,
                newUserTierMultiplierAtRegister: (regRule && regRule.multiplier) || 1.08
            });
        }
        if (uid === 'vip') {
            user = {
                registerDays: 120,
                newUserTierDaysAtRegister: 7,
                newUserTierMultiplierAtRegister: 1.12,
                consecutiveLoginDays: 14,
                engagementActions: 12,
                engagementDistinctPosts: 8,
                hasActivePaidSubscription: true,
                subscriptionPaidAmount: 29.9,
                hasEngagement: true,
                hasSubscription: true
            };
        }
        if (uid === 'abuse') {
            user = baseUser({
                registerDays: 2,
                consecutiveLoginDays: 10,
                engagementActions: 3,
                engagementDistinctPosts: 2,
                engagementDistinctAuthors: 1,
                engagementSelfContentOnly: true,
                hasEngagement: true
            });
        }
        if (uid === 'day7_boundary') {
            user = baseUser({
                registerDays: 7,
                newUserTierDaysAtRegister: 7,
                newUserTierMultiplierAtRegister: 1.08,
                consecutiveLoginDays: 7
            });
        }
        if (uid === 'streak_exhausted') {
            user = baseUser({
                registerDays: 60,
                consecutiveLoginDays: 30,
                consecutiveLoginBonusDaysUsed: 21
            });
        }
        var matched = T.matchRules(cfg, user);
        var tierMul = T.calcTierMultiplier(matched, cfg);
        var combined = T.calcCombinedMultiplier(tierMul, cfg);
        return {
            uid: uid || 'demo',
            user: user,
            matched: matched,
            tierMultiplier: tierMul,
            externalMultiplier: combined.externalMultiplier,
            effectiveMultiplier: combined.effectiveMultiplier,
            registerDaysPolicy: registerPolicyNote(cfg, user),
            sample50: T.calcReward(50, user, cfg, { trackDailyBonus: false }),
            sample200: T.calcReward(200, user, cfg, { trackDailyBonus: false })
        };
    }

    function fetchMonitor() {
        return Promise.resolve(JSON.parse(JSON.stringify(MOCK_MONITOR)));
    }

    global.FLAdminPointsTier = {
        getConfig: getConfig,
        putConfig: putConfig,
        publishConfig: publishConfig,
        getPublishedMeta: getPublishedMeta,
        getPublishedConfig: getPublishedConfig,
        resetConfig: T.resetConfig,
        simulateUser: simulateUser,
        fetchMonitor: fetchMonitor,
        RULE_META: T.RULE_META
    };
})(typeof window !== 'undefined' ? window : this);
