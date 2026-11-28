/**
 * 粉丝 · 创作者订阅状态（按登录用户 + 创作者 UID/名称）
 */
(function (global) {
    var KEY = 'fl_fan_creator_subs_v1';
    var PLAN_RANK = { monthly: 1, quarterly: 2, annual: 3 };

    function userId() {
        if (global.GoodfansAuth && global.GoodfansAuth.getUserId) {
            return global.GoodfansAuth.getUserId() || 'guest';
        }
        return 'guest';
    }

    function loadRoot() {
        var root = {};
        try {
            var raw = localStorage.getItem(KEY);
            if (raw) {
                var obj = JSON.parse(raw);
                if (obj && typeof obj === 'object') root = obj;
            }
        } catch (e) { /* ignore */ }
        return ensureTest01Subs(root);
    }

    function ensureTest01Subs(root) {
        if (root._test01SubSeed) return root;
        var uid = 'uid_edcd63ff';
        var byUser = root[uid] || {};
        if (!byUser['uid:demo_uid_882910']) {
            byUser['uid:demo_uid_882910'] = {
                creatorUid: 'demo_uid_882910',
                creatorName: 'Luna 🌙',
                planType: 'monthly',
                price: 9.9,
                basePrice: 9.9,
                updatedAt: Date.parse('2026-11-20T10:00:00+08:00')
            };
        }
        if (!byUser['uid:c_lens']) {
            byUser['uid:c_lens'] = {
                creatorUid: 'c_lens',
                creatorName: 'Lens 旅记',
                planType: 'quarterly',
                price: 24,
                basePrice: 28,
                updatedAt: Date.parse('2026-11-12T10:00:00+08:00')
            };
        }
        root[uid] = byUser;
        root._test01SubSeed = 1;
        saveRoot(root);
        return root;
    }

    function saveRoot(root) {
        try {
            localStorage.setItem(KEY, JSON.stringify(root || {}));
        } catch (e) { /* ignore */ }
    }

    function creatorKey(creatorUid, creatorName) {
        var uid = String(creatorUid || '').trim();
        if (uid) return 'uid:' + uid;
        return 'name:' + String(creatorName || '').trim();
    }

    function planLabel(planType) {
        if (planType === 'annual') return '年付';
        if (planType === 'quarterly') return '季付';
        return '月付';
    }

    function upsert(record) {
        record = record || {};
        var key = creatorKey(record.creatorUid, record.creatorName);
        if (!key || key === 'name:') return null;
        var planType = record.planType || 'monthly';
        if (!PLAN_RANK[planType]) planType = 'monthly';

        var root = loadRoot();
        var byUser = root[userId()] || {};
        var prev = byUser[key];
        var nextRank = PLAN_RANK[planType];
        var prevRank = prev && PLAN_RANK[prev.planType] ? PLAN_RANK[prev.planType] : 0;
        if (prev && nextRank < prevRank) planType = prev.planType;

        var entry = {
            creatorUid: record.creatorUid || (prev && prev.creatorUid) || null,
            creatorName: record.creatorName || (prev && prev.creatorName) || '',
            planType: planType,
            price: record.price != null ? record.price : (prev && prev.price),
            basePrice: record.basePrice != null ? record.basePrice : (prev && prev.basePrice),
            updatedAt: Date.now()
        };
        byUser[key] = entry;
        root[userId()] = byUser;
        saveRoot(root);
        return entry;
    }

    function get(creatorUid, creatorName) {
        var key = creatorKey(creatorUid, creatorName);
        var byUser = loadRoot()[userId()] || {};
        return byUser[key] || null;
    }

    function remove(creatorUid, creatorName) {
        var key = creatorKey(creatorUid, creatorName);
        if (!key || key === 'name:') return false;
        var root = loadRoot();
        var uid = userId();
        var byUser = root[uid];
        if (!byUser || !byUser[key]) return false;
        delete byUser[key];
        root[uid] = byUser;
        saveRoot(root);
        return true;
    }

    global.FLFanCreatorSubs = {
        PLAN_RANK: PLAN_RANK,
        planLabel: planLabel,
        get: get,
        upsert: upsert,
        remove: remove,
        creatorKey: creatorKey
    };
})(typeof window !== 'undefined' ? window : this);
