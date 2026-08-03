/**
 * 链上充提 · 多资产多网络配置（后台可 CRUD）
 * 支持 USDT / USDC 各网络独立：地址、充提手续费、二维码
 * localStorage: fl_fee_config_v2
 */
(function (global) {
    var LS_KEY = 'fl_fee_config_v2';
    var LEGACY_KEY = 'fl_fee_config_v1';

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

    function uid(prefix) {
        return (prefix || 'net') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function placeholderQr(label) {
        var text = encodeURIComponent(label || 'QR');
        return 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + text;
    }

    function normalizeFee(fee, fallback) {
        fee = fee || {};
        fallback = fallback || { billingType: 'fixed', rate: 0, minFee: null };
        var billingType = fee.billingType === 'percent' ? 'percent' : 'fixed';
        var rate = parseFloat(fee.rate);
        if (isNaN(rate)) rate = fallback.rate;
        var minFee = fee.minFee;
        if (minFee === '' || minFee === undefined) minFee = fallback.minFee;
        if (minFee != null && minFee !== '') {
            minFee = parseFloat(minFee);
            if (isNaN(minFee)) minFee = fallback.minFee;
        } else {
            minFee = null;
        }
        return { billingType: billingType, rate: rate, minFee: minFee };
    }

    function normalizeNetwork(raw) {
        var n = Object.assign({}, raw || {});
        n.id = n.id || uid('net');
        n.asset = String(n.asset || 'USDT').toUpperCase() === 'USDC' ? 'USDC' : 'USDT';
        n.networkId = n.networkId || n.id;
        n.networkName = n.networkName || n.networkId;
        n.enabled = n.enabled !== false;
        n.depositAddress = n.depositAddress || '';
        n.withdrawAddress = n.withdrawAddress || '';
        n.depositFee = normalizeFee(n.depositFee, { billingType: 'fixed', rate: 1, minFee: null });
        n.withdrawFee = normalizeFee(n.withdrawFee, { billingType: 'percent', rate: 0.8, minFee: 1 });
        n.depositQrUrl = n.depositQrUrl || placeholderQr(n.asset + '-' + n.networkId + '-deposit');
        n.withdrawQrUrl = n.withdrawQrUrl || placeholderQr(n.asset + '-' + n.networkId + '-withdraw');
        n.sort = n.sort != null ? Number(n.sort) : 100;
        n.updatedAt = normalizeTimestamp(n.updatedAt || nowTimestamp());
        n.updatedBy = n.updatedBy || '财务配置';
        n.createdAt = normalizeTimestamp(n.createdAt || n.updatedAt);
        return n;
    }

    function seedNetworks() {
        return [
            {
                id: 'usdt_trc20',
                asset: 'USDT',
                networkId: 'trc20',
                networkName: 'TRON (TRC20)',
                enabled: true,
                depositAddress: 'TXdemoUsdtTrc20DepositAddr001a3X2',
                withdrawAddress: 'TXdemoUsdtTrc20HotWallet001a3X2',
                depositFee: { billingType: 'fixed', rate: 1, minFee: null },
                withdrawFee: { billingType: 'fixed', rate: 1, minFee: null },
                sort: 10,
                updatedAt: '2026-07-20 10:00:00',
                updatedBy: '财务配置'
            },
            {
                id: 'usdt_erc20',
                asset: 'USDT',
                networkId: 'erc20',
                networkName: 'ETH · Ethereum (ERC20)',
                enabled: true,
                depositAddress: '0xDemoUsdtErc20Deposit000000031ec7',
                withdrawAddress: '0xDemoUsdtErc20HotWallet0000031ec7',
                depositFee: { billingType: 'fixed', rate: 3, minFee: null },
                withdrawFee: { billingType: 'fixed', rate: 5, minFee: null },
                sort: 20,
                updatedAt: '2026-07-20 10:00:00',
                updatedBy: '财务配置'
            },
            {
                id: 'usdt_bep20',
                asset: 'USDT',
                networkId: 'bep20',
                networkName: 'BSC (BEP20)',
                enabled: true,
                depositAddress: '0xDemoUsdtBep20Deposit00000008f2b1',
                withdrawAddress: '0xDemoUsdtBep20HotWallet000008f2b1',
                depositFee: { billingType: 'fixed', rate: 0.5, minFee: null },
                withdrawFee: { billingType: 'fixed', rate: 0.8, minFee: null },
                sort: 30,
                updatedAt: '2026-07-20 10:00:00',
                updatedBy: '财务配置'
            },
            {
                id: 'usdt_poly',
                asset: 'USDT',
                networkId: 'poly',
                networkName: 'Polygon',
                enabled: true,
                depositAddress: '0xDemoUsdtPolyDeposit000000009c4de',
                withdrawAddress: '0xDemoUsdtPolyHotWallet0000009c4de',
                depositFee: { billingType: 'fixed', rate: 0.3, minFee: null },
                withdrawFee: { billingType: 'percent', rate: 0.5, minFee: 0.5 },
                sort: 40,
                updatedAt: '2026-07-20 10:00:00',
                updatedBy: '财务配置'
            },
            {
                id: 'usdc_erc20',
                asset: 'USDC',
                networkId: 'erc20',
                networkName: 'ETH · Ethereum (ERC20)',
                enabled: true,
                depositAddress: '0xDemoUsdcErc20Deposit00000000a5b3',
                withdrawAddress: '0xDemoUsdcErc20HotWallet000000a5b3',
                depositFee: { billingType: 'fixed', rate: 2.5, minFee: null },
                withdrawFee: { billingType: 'fixed', rate: 4, minFee: null },
                sort: 50,
                updatedAt: '2026-07-21 09:30:00',
                updatedBy: '财务配置'
            },
            {
                id: 'usdc_poly',
                asset: 'USDC',
                networkId: 'poly',
                networkName: 'Polygon',
                enabled: true,
                depositAddress: '0xDemoUsdcPolyDeposit000000007e2aa',
                withdrawAddress: '0xDemoUsdcPolyHotWallet0000007e2aa',
                depositFee: { billingType: 'fixed', rate: 0.2, minFee: null },
                withdrawFee: { billingType: 'fixed', rate: 0.5, minFee: null },
                sort: 60,
                updatedAt: '2026-07-21 09:30:00',
                updatedBy: '财务配置'
            },
            {
                id: 'usdc_sol',
                asset: 'USDC',
                networkId: 'sol',
                networkName: 'Solana',
                enabled: true,
                depositAddress: 'SoLDemoUsdcDepositAddr000000004d91c',
                withdrawAddress: 'SoLDemoUsdcHotWalletAddr00004d91c',
                depositFee: { billingType: 'fixed', rate: 0.1, minFee: null },
                withdrawFee: { billingType: 'fixed', rate: 0.2, minFee: null },
                sort: 70,
                updatedAt: '2026-07-21 09:30:00',
                updatedBy: '财务配置'
            },
            {
                id: 'usdc_bep20',
                asset: 'USDC',
                networkId: 'bep20',
                networkName: 'BSC (BEP20)',
                enabled: false,
                depositAddress: '0xDemoUsdcBep20Deposit0000000c1e90',
                withdrawAddress: '0xDemoUsdcBep20HotWallet00000c1e90',
                depositFee: { billingType: 'fixed', rate: 0.5, minFee: null },
                withdrawFee: { billingType: 'percent', rate: 0.6, minFee: 0.5 },
                sort: 80,
                updatedAt: '2026-07-22 14:00:00',
                updatedBy: '财务配置'
            }
        ].map(normalizeNetwork);
    }

    function billingLabel(type) {
        return type === 'fixed' ? '固定费' : '百分比';
    }

    function formatFee(fee, asset) {
        fee = normalizeFee(fee);
        asset = asset || 'USDT';
        if (fee.billingType === 'fixed') {
            return fee.rate + ' ' + asset;
        }
        var s = fee.rate + '%';
        if (fee.minFee != null) s += '（最低 ' + fee.minFee + ' ' + asset + '）';
        return s;
    }

    function formatRate(scene) {
        return formatFee(scene, 'USDT');
    }

    function formatMinFee(scene) {
        if (!scene || scene.minFee == null || scene.minFee === '' || scene.minFee === 0) return '—';
        return scene.minFee + ' USDT';
    }

    function defaultConfig() {
        return {
            version: 2,
            networks: seedNetworks(),
            updatedAt: '2026-07-22 14:00:00',
            updatedBy: '财务配置'
        };
    }

    /** 兼容旧版 scenes 视图（汇总展示） */
    function scenesFromNetworks(networks) {
        var dep = networks.filter(function (n) { return n.enabled; });
        var sampleDep = dep[0] || networks[0];
        var sampleWd = dep[0] || networks[0];
        return [
            {
                id: 'chain_deposit',
                scene: '链上充值（按网络配置）',
                billingType: sampleDep ? sampleDep.depositFee.billingType : 'fixed',
                rate: sampleDep ? sampleDep.depositFee.rate : 1,
                minFee: sampleDep ? sampleDep.depositFee.minFee : null,
                updatedAt: sampleDep ? sampleDep.updatedAt : nowTimestamp(),
                updatedBy: sampleDep ? sampleDep.updatedBy : '财务配置'
            },
            {
                id: 'chain_withdraw',
                scene: '链上提现（按网络配置）',
                billingType: sampleWd ? sampleWd.withdrawFee.billingType : 'percent',
                rate: sampleWd ? sampleWd.withdrawFee.rate : 0.8,
                minFee: sampleWd ? sampleWd.withdrawFee.minFee : 1,
                updatedAt: sampleWd ? sampleWd.updatedAt : nowTimestamp(),
                updatedBy: sampleWd ? sampleWd.updatedBy : '财务配置'
            }
        ];
    }

    function migrate(raw) {
        if (raw && raw.version === 2 && Array.isArray(raw.networks)) {
            return {
                version: 2,
                networks: raw.networks.map(normalizeNetwork),
                updatedAt: normalizeTimestamp(raw.updatedAt),
                updatedBy: raw.updatedBy || '财务配置'
            };
        }
        var base = defaultConfig();
        if (raw && Array.isArray(raw.scenes) && raw.scenes.length) {
            var dep = raw.scenes.filter(function (s) { return s.id === 'chain_deposit'; })[0];
            var wd = raw.scenes.filter(function (s) { return s.id === 'chain_withdraw'; })[0];
            base.networks = base.networks.map(function (n) {
                var next = Object.assign({}, n);
                if (dep) next.depositFee = normalizeFee(dep, n.depositFee);
                if (wd) next.withdrawFee = normalizeFee(wd, n.withdrawFee);
                next.updatedAt = normalizeTimestamp((wd && wd.updatedAt) || (dep && dep.updatedAt) || n.updatedAt);
                next.updatedBy = (wd && wd.updatedBy) || (dep && dep.updatedBy) || n.updatedBy;
                return normalizeNetwork(next);
            });
            base.updatedAt = normalizeTimestamp(raw.updatedAt || base.updatedAt);
            base.updatedBy = raw.updatedBy || base.updatedBy;
        }
        return base;
    }

    function loadConfig() {
        var cfg;
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (raw) cfg = JSON.parse(raw);
            else {
                var leg = localStorage.getItem(LEGACY_KEY);
                if (leg) {
                    cfg = migrate(JSON.parse(leg));
                    write(cfg);
                    return cfg;
                }
            }
        } catch (e) { /* ignore */ }
        var next = migrate(cfg);
        if (!cfg) write(next);
        return next;
    }

    function write(cfg) {
        try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)); } catch (e) { /* ignore */ }
    }

    function saveConfig(cfg, meta) {
        var ts = nowTimestamp();
        var next = migrate(Object.assign({}, cfg, meta || {}, {
            version: 2,
            updatedAt: ts,
            updatedBy: (meta && meta.updatedBy) || '财务配置'
        }));
        write(next);
        return next;
    }

    function listNetworks(filter) {
        filter = filter || {};
        var list = loadConfig().networks.slice().sort(function (a, b) {
            return (a.sort || 0) - (b.sort || 0) || String(a.asset).localeCompare(b.asset);
        });
        if (filter.asset) list = list.filter(function (n) { return n.asset === filter.asset; });
        if (filter.enabled === true) list = list.filter(function (n) { return n.enabled; });
        if (filter.enabled === false) list = list.filter(function (n) { return !n.enabled; });
        if (filter.q) {
            var q = String(filter.q).toLowerCase();
            list = list.filter(function (n) {
                return (n.networkName || '').toLowerCase().indexOf(q) >= 0 ||
                    (n.networkId || '').toLowerCase().indexOf(q) >= 0 ||
                    (n.depositAddress || '').toLowerCase().indexOf(q) >= 0 ||
                    (n.withdrawAddress || '').toLowerCase().indexOf(q) >= 0 ||
                    (n.asset || '').toLowerCase().indexOf(q) >= 0;
            });
        }
        return list;
    }

    function getNetwork(id) {
        return listNetworks().filter(function (n) { return n.id === id; })[0] || null;
    }

    function upsertNetwork(row, meta) {
        var cfg = loadConfig();
        var next = normalizeNetwork(row);
        next.updatedAt = nowTimestamp();
        next.updatedBy = (meta && meta.updatedBy) || '财务配置';
        var idx = -1;
        for (var i = 0; i < cfg.networks.length; i++) {
            if (cfg.networks[i].id === next.id) { idx = i; break; }
        }
        if (idx >= 0) {
            next.createdAt = cfg.networks[idx].createdAt || next.createdAt;
            cfg.networks[idx] = next;
        } else {
            next.createdAt = next.createdAt || next.updatedAt;
            cfg.networks.unshift(next);
        }
        return saveConfig(cfg, meta);
    }

    function deleteNetwork(id) {
        var cfg = loadConfig();
        var before = cfg.networks.length;
        cfg.networks = cfg.networks.filter(function (n) { return n.id !== id; });
        if (cfg.networks.length === before) return { ok: false, error: '网络不存在' };
        saveConfig(cfg);
        return { ok: true };
    }

    function setNetworkEnabled(id, enabled) {
        var n = getNetwork(id);
        if (!n) return null;
        n.enabled = !!enabled;
        return upsertNetwork(n);
    }

    function touchScene(scene, meta) {
        var ts = nowTimestamp();
        return Object.assign({}, scene, {
            updatedAt: ts,
            updatedBy: (meta && meta.updatedBy) || '财务配置'
        });
    }

    function resetConfig() {
        try {
            localStorage.removeItem(LS_KEY);
            localStorage.removeItem(LEGACY_KEY);
        } catch (e) { /* ignore */ }
        var cfg = defaultConfig();
        write(cfg);
        return cfg;
    }

    function getScene(id, cfg) {
        var c = cfg || loadConfig();
        var scenes = c.scenes || scenesFromNetworks(c.networks || []);
        return scenes.filter(function (s) { return s.id === id; })[0] || null;
    }

    global.FLFeeConfig = {
        LS_KEY: LS_KEY,
        billingLabel: billingLabel,
        formatFee: formatFee,
        formatRate: formatRate,
        formatMinFee: formatMinFee,
        formatUpdatedAt: normalizeTimestamp,
        placeholderQr: placeholderQr,
        loadConfig: function () {
            var c = loadConfig();
            c.scenes = scenesFromNetworks(c.networks);
            return c;
        },
        saveConfig: saveConfig,
        resetConfig: resetConfig,
        getScene: getScene,
        touchScene: touchScene,
        listNetworks: listNetworks,
        getNetwork: getNetwork,
        upsertNetwork: upsertNetwork,
        deleteNetwork: deleteNetwork,
        setNetworkEnabled: setNetworkEnabled,
        uid: uid,
        nowTimestamp: nowTimestamp
    };
})(typeof window !== 'undefined' ? window : this);
