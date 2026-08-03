/**
 * Creator Pro 平台会员 · 按用户隔离（localStorage）
 * 未购买或已过期 → 侧栏展示升级卡片；有效期内 → 隐藏卡片
 */
(function (global) {
    var LS_KEY = 'fl_creator_pro_v1';

    function userId() {
        if (global.GoodfansAuth && global.GoodfansAuth.getUserId) {
            return global.GoodfansAuth.getUserId();
        }
        return null;
    }

    function readProtoOverride() {
        var p = new URLSearchParams(location.search);
        var v = p.get('fl_creator_pro');
        if (v === 'active' || v === 'member' || v === '1') return 'active';
        if (v === 'none' || v === '0' || v === 'inactive') return 'none';
        return null;
    }

    function readAll() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function writeAll(data) {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(data));
        } catch (e) { /* ignore */ }
    }

    function getRecord(uid) {
        if (!uid) return null;
        return readAll()[uid] || null;
    }

    function parseDate(str) {
        if (!str) return null;
        var d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
    }

    function isActiveForUser(uid) {
        var override = readProtoOverride();
        if (override === 'active') return true;
        if (override === 'none') return false;
        var rec = getRecord(uid || userId());
        if (!rec || !rec.expiresAt) return false;
        var exp = parseDate(rec.expiresAt);
        return exp && exp > new Date();
    }

    function shouldShowProCard(uid) {
        return !isActiveForUser(uid);
    }

    function getExpiresAt(uid) {
        var rec = getRecord(uid || userId());
        return rec && rec.expiresAt ? rec.expiresAt : null;
    }

    function getPlanLabel(uid) {
        var rec = getRecord(uid || userId());
        if (!rec) return '';
        if (rec.plan === 'yearly') return '年付';
        if (rec.plan === 'monthly') return '月付';
        return rec.planLabel || 'Pro';
    }

    function setMembership(uid, opts) {
        opts = opts || {};
        uid = uid || userId();
        if (!uid) return null;
        var all = readAll();
        var days = opts.days || 30;
        var now = new Date();
        var exp = new Date(now.getTime() + days * 86400000);
        all[uid] = {
            plan: opts.plan || 'monthly',
            planLabel: opts.planLabel || (opts.plan === 'yearly' ? '年付' : '月付'),
            activatedAt: now.toISOString(),
            expiresAt: opts.expiresAt || exp.toISOString()
        };
        writeAll(all);
        try {
            global.dispatchEvent(new CustomEvent('fl-creator-pro-change', { detail: { uid: uid } }));
        } catch (e) { /* ignore */ }
        return all[uid];
    }

    function clearMembership(uid) {
        uid = uid || userId();
        if (!uid) return;
        var all = readAll();
        delete all[uid];
        writeAll(all);
        try {
            global.dispatchEvent(new CustomEvent('fl-creator-pro-change', { detail: { uid: uid } }));
        } catch (e) { /* ignore */ }
    }

    global.FLCreatorPro = {
        isActive: isActiveForUser,
        shouldShowProCard: shouldShowProCard,
        getExpiresAt: getExpiresAt,
        getPlanLabel: getPlanLabel,
        setMembership: setMembership,
        clearMembership: clearMembership,
        getRecord: getRecord
    };
})(typeof window !== 'undefined' ? window : this);
