/**
 * 积分发奖 · 服务端权威 Mock（C 端只读，结算唯一入口）
 * API 契约：
 *   GET  /api/v1/points/tier-config-published
 *   GET  /api/v1/points/tier-status
 *   POST /api/v1/points/tasks/:taskId/claim
 *   PUT  /api/v1/admin/points-tier-config/publish  （运营发布，非 C 端）
 */
(function (global) {
    var LS_PUBLISHED = 'fl_points_tier_config_published_v1';
    var LS_PROFILE = 'fl_points_user_tier_profile_v1';
    var LS_DAILY_EARNED = 'fl_points_server_daily_earned_v1';
    var LS_BONUS_LEDGER = 'fl_points_tier_bonus_ledger_v1';

    var DEMO_USER_ID = 'demo_uid_882910';

    function getCurrentUserId() {
        if (global.GoodfansAuth && global.GoodfansAuth.getUserId) {
            var id = global.GoodfansAuth.getUserId();
            if (id) return id;
        }
        return DEMO_USER_ID;
    }

    var TASK_CATALOG = {
        act_watch_30: { baseReward: 50, activityTypeId: 'earn_task', name: '观看直播满 30 分钟' },
        act_checkin: { baseReward: 20, activityTypeId: 'earn_checkin', name: '每日签到' },
        act_invite_ref: { baseReward: 200, activityTypeId: 'earn_invite', name: '邀请好友注册' },
        act_first_sub: { baseReward: 200, activityTypeId: 'earn_subscription', name: '首次订阅创作者' },
        act_timer: { baseReward: 128, activityTypeId: 'earn_task', name: '浏览赚积分（计时）' }
    };

    var REALISTIC_PROFILE = {
        userId: DEMO_USER_ID,
        registerDays: 18,
        newUserTierDaysAtRegister: 5,
        newUserTierMultiplierAtRegister: 1.08,
        consecutiveLoginDays: 6,
        consecutiveLoginBonusDaysUsed: 0,
        engagementActions: 2,
        engagementDistinctPosts: 1,
        engagementDistinctAuthors: 1,
        engagementSelfContentOnly: false,
        hasActivePaidSubscription: false,
        subscriptionPaidAmount: 0,
        subscriptionDays: 0
    };

    function todayKey() {
        return new Date().toISOString().slice(0, 10);
    }

    function readJson(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            if (raw) return JSON.parse(raw);
        } catch (e) { /* ignore */ }
        return fallback;
    }

    function writeJson(key, val) {
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch (e) { /* ignore */ }
    }

    function getTierApi() {
        return global.FLPointsTier;
    }

    function getRiskDailyCap() {
        try {
            var raw = localStorage.getItem('fl_points_risk_config_v1');
            if (raw) {
                var risk = JSON.parse(raw);
                if (risk.caps && risk.caps.dailyPointsCap != null) {
                    return risk.caps.dailyPointsCap;
                }
            }
        } catch (e) { /* ignore */ }
        return 480;
    }

    function ensureProfile() {
        var store = readJson(LS_PROFILE, null);
        if (!store || !store[DEMO_USER_ID]) {
            store = {};
            store[DEMO_USER_ID] = JSON.parse(JSON.stringify(REALISTIC_PROFILE));
            writeJson(LS_PROFILE, store);
        }
        return store[DEMO_USER_ID];
    }

    function saveProfile(profile) {
        var store = readJson(LS_PROFILE, {});
        store[profile.userId || DEMO_USER_ID] = profile;
        writeJson(LS_PROFILE, store);
        return profile;
    }

    function getUserProfile(userId) {
        userId = userId || getCurrentUserId();
        var store = readJson(LS_PROFILE, null);
        if (!store || !store[userId]) {
            if (userId === DEMO_USER_ID) return ensureProfile();
            if (global.FLUserRegistry) {
                var acc = global.FLUserRegistry.getByUserId(userId);
                if (acc && acc.tierProfile) {
                    var p = JSON.parse(JSON.stringify(acc.tierProfile));
                    saveProfile(p);
                    return p;
                }
            }
            return null;
        }
        return store[userId];
    }

    function readDailyEarned(userId) {
        var all = readJson(LS_DAILY_EARNED, {});
        var row = all[userId] || {};
        return row[todayKey()] || 0;
    }

    function addDailyEarned(userId, delta) {
        if (!delta || delta <= 0) return readDailyEarned(userId);
        var all = readJson(LS_DAILY_EARNED, {});
        if (!all[userId]) all[userId] = {};
        var key = todayKey();
        all[userId][key] = (all[userId][key] || 0) + delta;
        writeJson(LS_DAILY_EARNED, all);
        return all[userId][key];
    }

    function readServerBonusUsed(userId) {
        var all = readJson(LS_BONUS_LEDGER, {});
        var row = all[userId] || {};
        return row[todayKey()] || 0;
    }

    function addServerBonusUsed(userId, delta) {
        if (!delta || delta <= 0) return readServerBonusUsed(userId);
        var all = readJson(LS_BONUS_LEDGER, {});
        if (!all[userId]) all[userId] = {};
        var key = todayKey();
        all[userId][key] = (all[userId][key] || 0) + delta;
        writeJson(LS_BONUS_LEDGER, all);
        return all[userId][key];
    }

    function createBonusContext(userId) {
        return {
            getUsed: function () { return readServerBonusUsed(userId); },
            addUsed: function (delta) { return addServerBonusUsed(userId, delta); }
        };
    }

    function loadPublishedConfig() {
        var T = getTierApi();
        if (!T) return null;
        var published = readJson(LS_PUBLISHED, null);
        if (published && published.config) {
            return deepMergeConfig(T.DEFAULT_CONFIG, published.config);
        }
        return JSON.parse(JSON.stringify(T.DEFAULT_CONFIG));
    }

    function deepMergeConfig(base, patch) {
        var out = JSON.parse(JSON.stringify(base));
        if (!patch) return out;
        Object.keys(patch).forEach(function (key) {
            if (patch[key] && typeof patch[key] === 'object' && !Array.isArray(patch[key])) {
                out[key] = deepMergeConfig(out[key] || {}, patch[key]);
            } else if (patch[key] !== undefined) {
                out[key] = patch[key];
            }
        });
        if (out.rules && out.rules.registerDaysLte) delete out.rules.registerDaysLte.applyMode;
        return out;
    }

    function publishConfig(draftCfg, options) {
        options = options || {};
        var T = getTierApi();
        var cfg = draftCfg || (T && T.loadConfig()) || {};
        var version = Date.now();
        var payload = {
            version: version,
            publishedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            publishedBy: options.by || '活动运营',
            config: JSON.parse(JSON.stringify(cfg))
        };
        writeJson(LS_PUBLISHED, payload);
        if (!options.silent && T) {
            try {
                localStorage.removeItem('fl_points_tier_bonus_day_v1');
            } catch (e) { /* ignore */ }
        }
        return payload;
    }

    function getPublishedMeta() {
        return readJson(LS_PUBLISHED, null);
    }

    function resolveCheckinDouble(catalog, cfg) {
        var Store = global.MallVouchersStore;
        if (!Store || !Store.getActiveCheckinDouble) {
            return { basePoints: catalog.baseReward, voucherApplied: false };
        }
        var dbl = Store.getActiveCheckinDouble();
        if (!dbl) {
            return { basePoints: catalog.baseReward, voucherApplied: false };
        }
        var mult = dbl.multiplier || 2;
        return {
            basePoints: catalog.baseReward * mult,
            voucherApplied: true,
            voucher: dbl,
            voucherMultiplier: mult,
            tierExcludedByVoucher: true
        };
    }

    function consumeCheckinDouble(voucher) {
        if (!voucher || !global.MallVouchersStore || !global.MallVouchersStore.consumeCheckinDouble) return;
        global.MallVouchersStore.consumeCheckinDouble(voucher.id);
    }

    function maybeIncrementStreakBonusUsed(profile, cfg, matched) {
        if (!matched || !matched.length) return profile;
        var loginRule = (cfg.rules || {}).consecutiveLoginGte;
        if (!loginRule || !loginRule.enabled) return profile;
        var hitLogin = matched.some(function (m) { return m.id === 'consecutiveLoginGte'; });
        if (!hitLogin) return profile;
        var maxDays = loginRule.bonusMaxDays;
        if (maxDays != null && maxDays > 0) {
            profile.consecutiveLoginBonusDaysUsed = (profile.consecutiveLoginBonusDaysUsed || 0) + 1;
        }
        return profile;
    }

    function settleTaskClaim(input) {
        var T = getTierApi();
        if (!T) {
            return Promise.resolve({ rejected: true, reason: '积分服务不可用', code: 'SERVICE_UNAVAILABLE' });
        }

        var taskId = input.taskId;
        var catalog = TASK_CATALOG[taskId];
        if (!catalog) {
            return Promise.resolve({ rejected: true, reason: '未知任务', code: 'UNKNOWN_TASK' });
        }

        var userId = input.userId || getCurrentUserId();
        var profile = getUserProfile(userId);
        if (!profile) {
            return Promise.resolve({ rejected: true, reason: '用户画像不可用', code: 'PROFILE_MISSING' });
        }

        var cfg = loadPublishedConfig();
        var dailyCap = getRiskDailyCap();
        var earned = readDailyEarned(userId);

        var basePoints = catalog.baseReward;
        var voucherNote = '';
        var tierExcludedOverride = false;
        var checkinVoucher = null;

        if (taskId === 'act_checkin') {
            var ck = resolveCheckinDouble(catalog, cfg);
            basePoints = ck.basePoints;
            if (ck.voucherApplied) {
                voucherNote = ' · 翻倍卡生效';
                tierExcludedOverride = !!ck.tierExcludedByVoucher;
                checkinVoucher = ck.voucher;
            }
        }

        if (earned >= dailyCap) {
            return Promise.resolve({
                rejected: true,
                reason: '今日获取积分已达上限（' + dailyCap + '）',
                code: 'DAILY_CAP_EXCEEDED',
                dailyCap: dailyCap,
                dailyEarned: earned
            });
        }

        var calcOpts = {
            activityTypeId: catalog.activityTypeId,
            trackDailyBonus: true,
            bonusContext: createBonusContext(userId),
            tierExcludedOverride: tierExcludedOverride
        };

        var detail = T.calcReward(basePoints, profile, cfg, calcOpts);
        var finalPoints = detail.finalPoints;

        if (earned + finalPoints > dailyCap) {
            finalPoints = Math.max(0, dailyCap - earned);
            detail = Object.assign({}, detail, {
                finalPoints: finalPoints,
                bonusPoints: Math.max(0, finalPoints - basePoints),
                dailyCapTrimmed: true
            });
        }

        if (finalPoints <= 0) {
            return Promise.resolve({
                rejected: true,
                reason: '今日获取积分已达上限',
                code: 'DAILY_CAP_EXCEEDED',
                dailyCap: dailyCap,
                dailyEarned: earned
            });
        }

        if (checkinVoucher) {
            consumeCheckinDouble(checkinVoucher);
        }

        profile = maybeIncrementStreakBonusUsed(profile, cfg, detail.tierBreakdown);
        saveProfile(profile);
        var newEarned = addDailyEarned(userId, finalPoints);

        return Promise.resolve({
            rejected: false,
            taskId: taskId,
            taskName: catalog.name,
            basePoints: basePoints,
            catalogBaseReward: catalog.baseReward,
            finalPoints: finalPoints,
            tierDetail: detail,
            voucherNote: voucherNote,
            dailyEarned: newEarned,
            dailyCap: dailyCap,
            userId: userId
        });
    }

    function previewReward(basePoints, activityTypeId, options) {
        var T = getTierApi();
        if (!T) return null;
        options = options || {};
        var cfg = loadPublishedConfig();
        var profile = getUserProfile(options.userId);
        return T.calcReward(basePoints, profile, cfg, {
            activityTypeId: activityTypeId,
            trackDailyBonus: false,
            tierExcludedOverride: options.tierExcludedOverride
        });
    }

    function fetchUserTierStatus(userId) {
        var T = getTierApi();
        if (!T) return Promise.resolve(null);
        userId = userId || getCurrentUserId();
        var cfg = loadPublishedConfig();
        var profile = getUserProfile(userId);
        var rawMatched = T.matchRules(cfg, profile);
        var resolved = T.resolveMatchedRules(cfg, profile);
        var matched = resolved.matched;
        var tierMul = T.calcTierMultiplier(matched, cfg);
        var combined = T.calcCombinedMultiplier(tierMul, cfg);
        var meta = getPublishedMeta();

        var allRules = Object.keys(T.RULE_META).map(function (id) {
            var rule = (cfg.rules || {})[id] || {};
            var rawHit = rawMatched.some(function (m) { return m.id === id; });
            var isMatched = matched.some(function (m) { return m.id === id; });
            var ruleMeta = T.RULE_META[id];
            var desc = T.buildRuleDesc(id, rule);
            if (id === 'consecutiveLoginGte' && rawHit && resolved.loginSuppressedForBoost) {
                desc += ' · 积分加速卡生效中，连续登录分层暂不叠加';
            }
            return {
                id: id,
                label: ruleMeta.label,
                desc: desc,
                icon: ruleMeta.icon,
                enabled: !!rule.enabled,
                multiplier: rule.multiplier || 1,
                matched: isMatched && rule.enabled,
                suppressedByBoost: id === 'consecutiveLoginGte' && rawHit && resolved.loginSuppressedForBoost
            };
        });

        return Promise.resolve({
            userId: userId,
            effectiveMultiplier: combined.effectiveMultiplier,
            tierMultiplier: tierMul,
            externalMultiplier: combined.externalMultiplier,
            capped: matched.reduce(function (a, r) { return a * r.multiplier; }, 1) > tierMul,
            globalCapped: combined.globalCapped,
            dailyTierBonusCap: cfg.dailyTierBonusCap,
            dailyTierBonusUsed: readServerBonusUsed(userId),
            dailyPointsEarned: readDailyEarned(userId),
            dailyPointsCap: getRiskDailyCap(),
            excludedActivityTypes: cfg.excludedActivityTypes || [],
            rules: allRules,
            matched: matched,
            user: profile,
            config: cfg,
            externalBoost: combined.externalBoost,
            loginSuppressedForBoost: resolved.loginSuppressedForBoost,
            publishedVersion: meta ? meta.version : null,
            publishedAt: meta ? meta.publishedAt : null,
            settlementMode: 'server'
        });
    }

    function syncWalletFromServer(wallet, userId) {
        if (!wallet) return wallet;
        userId = userId || getCurrentUserId();
        wallet.todayEarned = readDailyEarned(userId);
        wallet.todayCap = getRiskDailyCap();
        if (global.MallVouchersStore && global.MallVouchersStore.applyWalletDailyCap) {
            global.MallVouchersStore.applyWalletDailyCap(wallet);
        }
        return wallet;
    }

    global.FLPointsRewardService = {
        DEMO_USER_ID: DEMO_USER_ID,
        TASK_CATALOG: TASK_CATALOG,
        loadPublishedConfig: loadPublishedConfig,
        publishConfig: publishConfig,
        getPublishedMeta: getPublishedMeta,
        getUserProfile: getUserProfile,
        saveProfile: saveProfile,
        settleTaskClaim: settleTaskClaim,
        previewReward: previewReward,
        fetchUserTierStatus: fetchUserTierStatus,
        syncWalletFromServer: syncWalletFromServer,
        readDailyEarned: readDailyEarned,
        getCurrentUserId: getCurrentUserId,
    };
})(typeof window !== 'undefined' ? window : this);
