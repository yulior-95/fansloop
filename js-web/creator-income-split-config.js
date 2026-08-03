/**
 * 创作者收入分成 · 共享 Mock（后台 / C 端共用 localStorage）
 * API: GET/PUT /api/v1/admin/creator-income-split-rules
 *      GET /api/v1/creator/income-split-rules
 */
(function (global) {
    var LS_KEY = 'fl_creator_income_split_v1';

    var RULE_DEFS = [
        { id: 'subscription', name: '付费订阅', desc: '按月 / 按年结算', settlementLabel: 'T+3' },
        { id: 'tip_feed', name: '粉丝打赏', desc: '单帖 / 评论 / 私信', settlementLabel: 'T+1' },
        { id: 'tip_live', name: '直播礼物', desc: '直播间打赏与送礼', settlementLabel: 'T+1' },
        { id: 'ppv', name: '付费内容', desc: '单次解锁', settlementLabel: 'T+3' }
    ];

    var DEFAULT_RULES = {
        subscription: { creatorPercent: 85 },
        tip_feed: { creatorPercent: 80 },
        tip_live: { creatorPercent: 80 },
        ppv: { creatorPercent: 85 }
    };

    var DEFAULT_CONFIG = {
        rules: JSON.parse(JSON.stringify(DEFAULT_RULES)),
        levelAdjustEnabled: true,
        updatedAt: '2026-06-04 10:00',
        updatedBy: '财务配置'
    };

    function clampPercent(n) {
        var v = parseInt(n, 10);
        if (isNaN(v)) v = 85;
        if (v < 50) v = 50;
        if (v > 95) v = 95;
        return v;
    }

    function migrate(cfg) {
        var next = Object.assign({}, DEFAULT_CONFIG, cfg || {});
        next.rules = Object.assign({}, DEFAULT_RULES, next.rules || {});
        RULE_DEFS.forEach(function (def) {
            if (!next.rules[def.id]) next.rules[def.id] = { creatorPercent: DEFAULT_RULES[def.id].creatorPercent };
            next.rules[def.id].creatorPercent = clampPercent(next.rules[def.id].creatorPercent);
        });
        return next;
    }

    function loadConfig() {
        var cfg;
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (raw) cfg = JSON.parse(raw);
        } catch (e) { /* ignore */ }
        return migrate(cfg);
    }

    function saveConfig(cfg, meta) {
        var next = migrate(Object.assign({}, cfg, meta || {}, {
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            updatedBy: (meta && meta.updatedBy) || '财务配置'
        }));
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(next));
        } catch (e) { /* ignore */ }
        return next;
    }

    function resetConfig() {
        try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
        return migrate(null);
    }

    function getRule(id, cfg) {
        var c = cfg || loadConfig();
        var def = RULE_DEFS.filter(function (d) { return d.id === id; })[0];
        if (!def) return null;
        var rule = c.rules[id] || DEFAULT_RULES[id];
        return {
            id: def.id,
            name: def.name,
            desc: def.desc,
            settlementLabel: def.settlementLabel,
            creatorPercent: clampPercent(rule.creatorPercent),
            platformPercent: 100 - clampPercent(rule.creatorPercent)
        };
    }

    function getRules(cfg) {
        return RULE_DEFS.map(function (def) {
            return getRule(def.id, cfg);
        });
    }

    /** 收益页「打赏与礼物」合并展示：取粉丝打赏与直播礼物中较低实得（对用户更保守） */
    function getTipGiftCreatorPercent(cfg) {
        var feed = getRule('tip_feed', cfg).creatorPercent;
        var live = getRule('tip_live', cfg).creatorPercent;
        return Math.min(feed, live);
    }

    function renderSplitTableRows(cfg) {
        return getRules(cfg).map(function (r) {
            return '<tr><td>' + r.name + '</td><td>' + r.creatorPercent + '%</td><td>' + r.desc + '</td></tr>';
        }).join('');
    }

    /**
     * 双商城分成只读摘要（主配置在 MallCommerceConfigStore，避免双写）
     */
    function getMallCommerceSummaryRules() {
        var cfg = global.MallCommerceConfigStore && global.MallCommerceConfigStore.load
            ? global.MallCommerceConfigStore.load()
            : { digitalPlatformFeePercent: 10, affiliateCreatorSharePercent: 70 };
        var digitalCreator = 100 - (cfg.digitalPlatformFeePercent || 10);
        return [
            {
                id: 'digital_asset',
                name: '数字资产',
                desc: '创作者自建数字商品售卖；平台抽成由「双商城配置」维护',
                settlementLabel: 'T+0',
                creatorPercent: digitalCreator,
                platformPercent: cfg.digitalPlatformFeePercent || 10,
                readonly: true,
                configHref: 'mall-commerce-config.html'
            },
            {
                id: 'affiliate_commission',
                name: '联盟佣金',
                desc: '第三方联盟回传佣金中创作者实得占比；由「双商城配置」维护',
                settlementLabel: '回传后',
                creatorPercent: cfg.affiliateCreatorSharePercent || 70,
                platformPercent: 100 - (cfg.affiliateCreatorSharePercent || 70),
                readonly: true,
                configHref: 'mall-commerce-config.html'
            }
        ];
    }

    global.FLCreatorIncomeSplit = {
        LS_KEY: LS_KEY,
        RULE_DEFS: RULE_DEFS,
        DEFAULT_CONFIG: DEFAULT_CONFIG,
        loadConfig: loadConfig,
        saveConfig: saveConfig,
        resetConfig: resetConfig,
        getRule: getRule,
        getRules: getRules,
        getTipGiftCreatorPercent: getTipGiftCreatorPercent,
        renderSplitTableRows: renderSplitTableRows,
        getMallCommerceSummaryRules: getMallCommerceSummaryRules,
        clampPercent: clampPercent
    };
})(typeof window !== 'undefined' ? window : this);
