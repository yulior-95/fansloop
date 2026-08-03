/**
 * 双商城全局配置 · 数字平台抽成 + 联盟创作者分成
 * API: GET/PUT /api/v1/admin/mall-commerce-config
 */
(function (global) {
    var LS_KEY = 'fl_mall_commerce_config_v1';

    var DEFAULTS = {
        digitalPlatformFeePercent: 10,
        affiliateCreatorSharePercent: 70,
        updatedAt: '2026-07-29 10:00',
        updatedBy: '财务配置'
    };

    function clamp(n, min, max, fallback) {
        var v = parseInt(n, 10);
        if (isNaN(v)) v = fallback;
        if (v < min) v = min;
        if (v > max) v = max;
        return v;
    }

    function migrate(cfg) {
        var next = Object.assign({}, DEFAULTS, cfg || {});
        next.digitalPlatformFeePercent = clamp(next.digitalPlatformFeePercent, 0, 50, 10);
        next.affiliateCreatorSharePercent = clamp(next.affiliateCreatorSharePercent, 0, 100, 70);
        return next;
    }

    function load() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (raw) return migrate(JSON.parse(raw));
        } catch (e) { /* ignore */ }
        return migrate(null);
    }

    function save(cfg, meta) {
        var next = migrate(Object.assign({}, cfg || load(), meta || {}, {
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            updatedBy: (meta && meta.updatedBy) || '财务配置'
        }));
        try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
        return next;
    }

    function reset() {
        try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
        return migrate(null);
    }

    function digitalCreatorPercent(cfg) {
        var c = cfg || load();
        return 100 - c.digitalPlatformFeePercent;
    }

    function calcDigitalSplit(priceUsdt, cfg) {
        var c = cfg || load();
        var price = Math.round(Number(priceUsdt) * 100) / 100;
        var fee = Math.round(price * c.digitalPlatformFeePercent) / 100;
        var net = Math.round((price - fee) * 100) / 100;
        return { priceUsdt: price, platformFee: fee, creatorNet: net, feePercent: c.digitalPlatformFeePercent };
    }

    function calcAffiliateSplit(affiliateGross, cfg) {
        var c = cfg || load();
        var gross = Math.round(Number(affiliateGross) * 100) / 100;
        var creator = Math.round(gross * c.affiliateCreatorSharePercent) / 100;
        var platform = Math.round((gross - creator) * 100) / 100;
        return {
            affiliateGross: gross,
            creatorShare: creator,
            platformShare: platform,
            creatorSharePercent: c.affiliateCreatorSharePercent
        };
    }

    global.MallCommerceConfigStore = {
        load: load,
        save: save,
        reset: reset,
        digitalCreatorPercent: digitalCreatorPercent,
        calcDigitalSplit: calcDigitalSplit,
        calcAffiliateSplit: calcAffiliateSplit
    };
})(typeof window !== 'undefined' ? window : this);
