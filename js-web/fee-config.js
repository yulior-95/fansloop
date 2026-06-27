/**
 * 链上充提手续费 · 共享 Mock（后台配置，平台收取）
 * API: GET/PUT /api/v1/admin/fee-config
 */
(function (global) {
    var LS_KEY = 'fl_fee_config_v1';

    /** billingType: percent | fixed */
    var DEFAULT_SCENES = [
        {
            id: 'chain_deposit',
            scene: '链上充值',
            billingType: 'fixed',
            rate: 1,
            minFee: null,
            updatedAt: '2026-06-04 10:00:00',
            updatedBy: '财务配置'
        },
        {
            id: 'chain_withdraw',
            scene: '链上提现',
            billingType: 'percent',
            rate: 0.8,
            minFee: 1,
            updatedAt: '2026-06-04 10:00:00',
            updatedBy: '财务配置'
        }
    ];

    var DEFAULT_CONFIG = {
        scenes: JSON.parse(JSON.stringify(DEFAULT_SCENES)),
        updatedAt: '2026-06-04 10:00:00',
        updatedBy: '财务配置'
    };

    function nowTimestamp() {
        var d = new Date();
        var p = function (n) { return n < 10 ? '0' + n : String(n); };
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
            p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }

    function normalizeTimestamp(ts) {
        if (!ts) return '—';
        var s = String(ts).trim();
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)) return s + ':00';
        return s;
    }

    function billingLabel(type) {
        return type === 'fixed' ? '固定费' : '百分比';
    }

    function formatRate(scene) {
        if (scene.billingType === 'fixed') {
            return scene.rate + ' USDT';
        }
        return scene.rate + '%';
    }

    function formatMinFee(scene) {
        if (scene.minFee == null || scene.minFee === '' || scene.minFee === 0) return '—';
        return scene.minFee + ' USDT';
    }

    function migrate(cfg) {
        var next = Object.assign({}, DEFAULT_CONFIG, cfg || {});
        var byId = {};
        (next.scenes || []).forEach(function (s) { byId[s.id] = s; });
        next.scenes = DEFAULT_SCENES.map(function (def) {
            var cur = byId[def.id] || def;
            var billingType = cur.billingType === 'fixed' ? 'fixed' : 'percent';
            var rate = parseFloat(cur.rate);
            if (isNaN(rate)) rate = def.rate;
            var minFee = cur.minFee;
            if (minFee === '' || minFee === undefined) minFee = def.minFee;
            if (minFee != null) minFee = parseFloat(minFee);
            return {
                id: def.id,
                scene: def.scene,
                billingType: billingType,
                rate: rate,
                minFee: minFee,
                updatedAt: normalizeTimestamp(cur.updatedAt || def.updatedAt),
                updatedBy: cur.updatedBy || def.updatedBy || DEFAULT_CONFIG.updatedBy
            };
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
        var ts = nowTimestamp();
        var next = migrate(Object.assign({}, cfg, meta || {}, {
            updatedAt: ts,
            updatedBy: (meta && meta.updatedBy) || '财务配置'
        }));
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(next));
        } catch (e) { /* ignore */ }
        return next;
    }

    function touchScene(scene, meta) {
        var ts = nowTimestamp();
        return Object.assign({}, scene, {
            updatedAt: ts,
            updatedBy: (meta && meta.updatedBy) || '财务配置'
        });
    }

    function resetConfig() {
        try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
        return migrate(null);
    }

    function getScene(id, cfg) {
        var c = cfg || loadConfig();
        return c.scenes.filter(function (s) { return s.id === id; })[0] || null;
    }

    global.FLFeeConfig = {
        LS_KEY: LS_KEY,
        DEFAULT_CONFIG: DEFAULT_CONFIG,
        billingLabel: billingLabel,
        formatRate: formatRate,
        formatMinFee: formatMinFee,
        formatUpdatedAt: normalizeTimestamp,
        loadConfig: loadConfig,
        saveConfig: saveConfig,
        resetConfig: resetConfig,
        getScene: getScene,
        touchScene: touchScene
    };
})(typeof window !== 'undefined' ? window : this);
