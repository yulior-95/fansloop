/**
 * 创作者优惠码 · 设置页 CRUD + 订阅收银台校验（localStorage）
 */
(function (global) {
    var LS_KEY = 'fl_creator_promo_codes_v1';
    var DEMO_UID = 'demo_uid_882910';

    var SEED = [
        {
            id: 'promo_luna20',
            code: 'LUNA20',
            discountType: 'percent',
            value: 0.8,
            scope: 'first_month',
            maxUses: 200,
            usedCount: 86,
            expiresAt: '2026-07-31',
            status: 'active',
            creatorUserId: DEMO_UID
        },
        {
            id: 'promo_newyear',
            code: 'NEWYEAR',
            discountType: 'fixed_first',
            value: 5,
            scope: 'first_month',
            maxUses: 200,
            usedCount: 200,
            expiresAt: '2026-01-15',
            status: 'exhausted',
            creatorUserId: DEMO_UID
        }
    ];

    function userId() {
        if (global.FansloopAuth && global.FansloopAuth.getUserId) {
            return global.FansloopAuth.getUserId();
        }
        return DEMO_UID;
    }

    function readAll() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            return Array.isArray(data.items) ? data.items : null;
        } catch (e) {
            return null;
        }
    }

    function writeAll(items) {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify({ items: items, updatedAt: Date.now() }));
        } catch (e) { /* ignore */ }
    }

    function ensureSeed() {
        var items = readAll();
        if (items && items.length) return items;
        writeAll(SEED.slice());
        return SEED.slice();
    }

    function normalizeCode(code) {
        return String(code || '').trim().toUpperCase();
    }

    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function computeStatus(promo) {
        if (!promo) return 'disabled';
        if (promo.status === 'disabled') return 'disabled';
        if (promo.usedCount >= promo.maxUses) return 'exhausted';
        if (promo.expiresAt && promo.expiresAt < todayStr()) return 'expired';
        return 'active';
    }

    function formatDiscountLabel(promo) {
        if (!promo) return '—';
        if (promo.discountType === 'percent') {
            var pct = Math.round(promo.value * 10);
            return pct + ' 折首月';
        }
        if (promo.discountType === 'fixed_first') {
            return '首月 ' + promo.value + ' USDT';
        }
        return '—';
    }

    function statusLabel(status) {
        if (status === 'active') return '进行中';
        if (status === 'exhausted') return '已用完';
        if (status === 'expired') return '已过期';
        if (status === 'disabled') return '已停用';
        return '—';
    }

    function statusTagClass(status) {
        if (status === 'active') return 'tag tag-success';
        return 'tag';
    }

    function list(creatorUserId) {
        var uid = creatorUserId || userId();
        return ensureSeed().filter(function (p) { return p.creatorUserId === uid; });
    }

    function getById(id) {
        return ensureSeed().find(function (p) { return p.id === id; }) || null;
    }

    function getByCode(creatorUserId, code) {
        var norm = normalizeCode(code);
        if (!norm) return null;
        var uid = creatorUserId || userId();
        return ensureSeed().find(function (p) {
            return p.creatorUserId === uid && normalizeCode(p.code) === norm;
        }) || null;
    }

    function calcDiscountedPrice(basePrice, promo, planType) {
        basePrice = Number(basePrice) || 0;
        if (!promo || basePrice <= 0) return basePrice;
        if (promo.discountType === 'percent') {
            return Math.max(0, Math.round(basePrice * promo.value * 100) / 100);
        }
        if (promo.discountType === 'fixed_first') {
            return Math.min(basePrice, Number(promo.value) || 0);
        }
        return basePrice;
    }

    function validate(code, opts) {
        opts = opts || {};
        var norm = normalizeCode(code);
        if (!norm) {
            return { ok: false, error: '请输入优惠码' };
        }
        if (!opts.creatorUserId) {
            return { ok: false, error: '无法识别创作者，请从该创作者主页发起订阅' };
        }
        var promo = getByCode(opts.creatorUserId, norm);
        if (!promo) {
            return { ok: false, error: '优惠码无效或不属于该创作者' };
        }
        var status = computeStatus(promo);
        if (status === 'exhausted') {
            return { ok: false, error: '该优惠码已用完' };
        }
        if (status === 'expired') {
            return { ok: false, error: '该优惠码已过期' };
        }
        if (status === 'disabled') {
            return { ok: false, error: '该优惠码已停用' };
        }
        if (opts.mode === 'renew') {
            return { ok: false, error: '该优惠码仅限新订阅首月使用' };
        }
        if (promo.scope === 'first_month') {
            if (opts.planType && opts.planType !== 'monthly') {
                return { ok: false, error: '该优惠码仅适用于月付首月' };
            }
        }
        var base = Number(opts.basePrice) || 0;
        var finalPrice = calcDiscountedPrice(base, promo, opts.planType);
        return {
            ok: true,
            promo: promo,
            finalPrice: finalPrice,
            saveAmount: Math.max(0, base - finalPrice),
            discountLabel: formatDiscountLabel(promo)
        };
    }

    function save(promo) {
        var items = ensureSeed().slice();
        var idx = items.findIndex(function (p) { return p.id === promo.id; });
        if (idx >= 0) items[idx] = promo;
        else items.unshift(promo);
        writeAll(items);
        return promo;
    }

    function remove(id) {
        var items = ensureSeed().filter(function (p) { return p.id !== id; });
        writeAll(items);
    }

    function incrementUsage(id) {
        var items = ensureSeed().slice();
        var idx = items.findIndex(function (p) { return p.id === id; });
        if (idx < 0) return;
        items[idx].usedCount = (items[idx].usedCount || 0) + 1;
        if (items[idx].usedCount >= items[idx].maxUses) {
            items[idx].status = 'exhausted';
        }
        writeAll(items);
    }

    function nextId() {
        return 'promo_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function resolveCreatorUserId(creatorName, btn) {
        if (btn && btn.getAttribute('data-creator-uid')) {
            return btn.getAttribute('data-creator-uid');
        }
        var name = String(creatorName || '');
        if (/Luna/i.test(name)) return DEMO_UID;
        var reg = global.FLUserPrototypeRegistry;
        if (reg && reg.getByUserId && reg.DEMO_USER_ID && name.indexOf('Luna') >= 0) {
            return reg.DEMO_USER_ID;
        }
        return null;
    }

    global.CreatorPromoCodesStore = {
        DEMO_UID: DEMO_UID,
        list: list,
        getById: getById,
        getByCode: getByCode,
        save: save,
        remove: remove,
        validate: validate,
        calcDiscountedPrice: calcDiscountedPrice,
        incrementUsage: incrementUsage,
        computeStatus: computeStatus,
        formatDiscountLabel: formatDiscountLabel,
        statusLabel: statusLabel,
        statusTagClass: statusTagClass,
        normalizeCode: normalizeCode,
        nextId: nextId,
        resolveCreatorUserId: resolveCreatorUserId
    };
})(typeof window !== 'undefined' ? window : this);
