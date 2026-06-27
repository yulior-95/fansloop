/**
 * 积分风控配置 · 共享 Mock 数据层（后台 / C 端共用 localStorage）
 * 冷静期「活动类型」与后台 activities-points-store 活动类型同源
 * API: GET/PUT /api/v1/admin/points-risk-config
 */
(function (global) {
    var LS_KEY = 'fl_points_risk_config_v1';

    /** 旧版抽象渠道 → 活动类型 ID（localStorage 迁移） */
    var LEGACY_CHANNEL_MAP = {
        invite: 'earn_invite',
        task: 'earn_task',
        checkin: 'earn_checkin',
        interaction: 'earn_interaction',
        campaign: 'campaign'
    };

    var COOLING_HINTS = {
        earn_invite: '双方奖励发放后进入冷静池，期满转入可用积分',
        earn_task: '观看、浏览等日常任务，通常即时可用',
        earn_checkin: '每日 / 连续签到奖励',
        earn_interaction: '点赞、评论等轻量互动',
        earn_subscription: '首次订阅、续订等订阅行为奖励',
        campaign: '研发绑定玩法 · 限时发奖',
        custom_wheel: '转盘抽奖获得的积分奖励'
    };

    /** C 端 / 无活动 Store 时的兜底列表（与 DEFAULT_TYPES 获取类对齐） */
    var FALLBACK_COOLING_TYPES = [
        { id: 'earn_invite', label: '邀请拉新' },
        { id: 'earn_task', label: '计时任务' },
        { id: 'earn_checkin', label: '签到链' },
        { id: 'earn_interaction', label: '互动行为' },
        { id: 'earn_subscription', label: '订阅行为' },
        { id: 'campaign', label: '研发活动' },
        { id: 'custom_wheel', label: '幸运转盘' }
    ];

    var DEFAULT_CHANNEL_COOLING = {
        earn_invite: null,
        earn_task: 0,
        earn_checkin: 0,
        earn_interaction: 0,
        earn_subscription: null,
        campaign: null,
        custom_wheel: 0
    };

    var DEFAULT_CONFIG = {
        coolingEnabled: true,
        coolingPeriodDays: 7,
        channelCooling: JSON.parse(JSON.stringify(DEFAULT_CHANNEL_COOLING)),
        caps: {
            platformDailyBudget: 80000,
            dailyPointsCap: 480,
            inviteRewardDailyCap: 600,
            inviteRewardTotalCap: 12000
        },
        updatedAt: '2026-06-04 10:00',
        updatedBy: '风控'
    };

    function getCoolingTypeRows() {
        var Store = global.FLPointsActivityStore;
        if (Store && Store.getCoolingTypeRows) {
            return Store.getCoolingTypeRows();
        }
        return FALLBACK_COOLING_TYPES.map(function (t) {
            return {
                id: t.id,
                label: t.label,
                hint: COOLING_HINTS[t.id] || '积分发放后适用冷静期规则'
            };
        });
    }

    function migrateChannelCooling(cfg) {
        var cc = cfg.channelCooling || {};
        Object.keys(LEGACY_CHANNEL_MAP).forEach(function (oldKey) {
            if (cc[oldKey] !== undefined && cc[LEGACY_CHANNEL_MAP[oldKey]] === undefined) {
                cc[LEGACY_CHANNEL_MAP[oldKey]] = cc[oldKey];
            }
            delete cc[oldKey];
        });
        getCoolingTypeRows().forEach(function (row) {
            if (cc[row.id] === undefined) {
                cc[row.id] = DEFAULT_CHANNEL_COOLING[row.id] !== undefined
                    ? DEFAULT_CHANNEL_COOLING[row.id]
                    : null;
            }
        });
        cfg.channelCooling = cc;
        return cfg;
    }

    function migrateCaps(cfg) {
        cfg.caps = cfg.caps || {};
        var defaults = DEFAULT_CONFIG.caps;
        Object.keys(defaults).forEach(function (key) {
            if (cfg.caps[key] == null) cfg.caps[key] = defaults[key];
        });
        return cfg;
    }

    function loadConfig() {
        var cfg;
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (raw) cfg = JSON.parse(raw);
        } catch (e) { /* ignore */ }
        if (!cfg) cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        return migrateCaps(migrateChannelCooling(cfg));
    }

    function saveConfig(cfg) {
        var next = migrateChannelCooling(Object.assign({}, cfg, {
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            updatedBy: '风控'
        }));
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(next));
        } catch (e) { /* ignore */ }
        return next;
    }

    function resetConfig() {
        try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
        return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }

    /** typeId；null = 跟随全局；0 = 即时可用；正整数 = 自定义天数 */
    function resolveCoolingDays(typeId, cfg) {
        var c = cfg || loadConfig();
        if (!c.coolingEnabled) return 0;
        var ch = c.channelCooling && c.channelCooling[typeId];
        if (ch === 0) return 0;
        if (ch === null || ch === undefined || ch === '') return c.coolingPeriodDays || 0;
        return Number(ch) || 0;
    }

    function formatCoolingLabel(days) {
        if (!days) return '即时可用';
        return days + ' 天';
    }

    global.FLPointsRisk = {
        LS_KEY: LS_KEY,
        LEGACY_CHANNEL_MAP: LEGACY_CHANNEL_MAP,
        DEFAULT_CONFIG: DEFAULT_CONFIG,
        getCoolingTypeRows: getCoolingTypeRows,
        loadConfig: loadConfig,
        saveConfig: saveConfig,
        resetConfig: resetConfig,
        resolveCoolingDays: resolveCoolingDays,
        formatCoolingLabel: formatCoolingLabel
    };
})(typeof window !== 'undefined' ? window : this);
