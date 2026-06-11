/**
 * 积分商城兑换券 · 用户券包 Mock（localStorage）
 * API: GET /api/v1/wallet/vouchers · POST /api/v1/subscriptions { voucherId }
 */
(function (global) {
    var LS_KEY = 'fl_mall_vouchers_v1';

    var REDEEM_CATALOG = {
        '订阅 9 折券': {
            type: 'sub_discount',
            discount: 0.9,
            planScope: 'all',
            validDays: 7,
            desc: '任意创作者月 / 季 / 年档位可用，单笔限 1 张'
        },
        '订阅 8 折券': {
            type: 'sub_discount',
            discount: 0.8,
            planScope: 'all',
            validDays: 2,
            desc: '高阶折扣，不可与其它满减叠加'
        },
        '付费内容试看券': {
            type: 'ppv_trial',
            discount: 0,
            validDays: 7,
            desc: '免费解锁 1 篇单篇付费内容，解锁后 24h 内可反复观看'
        },
        '单篇 5 折券': {
            type: 'ppv_discount',
            discount: 0.5,
            validDays: 14,
            desc: '单篇付费内容享 5 折，不可与试看券叠加'
        }
    };

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function dateStr(d) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function addDays(days) {
        var d = new Date();
        d.setDate(d.getDate() + days);
        return dateStr(d);
    }

    function defaultVouchers() {
        return [
            { id: 'v_sub90_a', name: '订阅 9 折券', type: 'sub_discount', discount: 0.9, status: 'active', planScope: 'all', expiresAt: addDays(45), redeemedAt: '2026-05-28', source: 'mall' },
            { id: 'v_sub90_b', name: '订阅 9 折券', type: 'sub_discount', discount: 0.9, status: 'active', planScope: 'all', expiresAt: addDays(12), redeemedAt: '2026-06-02', source: 'mall' },
            { id: 'v_sub90_c', name: '订阅 9 折券', type: 'sub_discount', discount: 0.9, status: 'active', planScope: ['monthly', 'quarterly'], expiresAt: addDays(30), redeemedAt: '2026-06-05', source: 'mall' },
            { id: 'v_sub80_a', name: '订阅 8 折券', type: 'sub_discount', discount: 0.8, status: 'active', planScope: 'all', expiresAt: addDays(5), redeemedAt: '2026-06-08', source: 'mall' },
            { id: 'v_sub80_b', name: '订阅 8 折券', type: 'sub_discount', discount: 0.8, status: 'active', planScope: 'all', expiresAt: addDays(18), redeemedAt: '2026-06-01', source: 'mall' },
            { id: 'v_sub90_annual', name: '订阅 9 折券', type: 'sub_discount', discount: 0.9, status: 'active', planScope: ['annual'], expiresAt: addDays(90), redeemedAt: '2026-04-20', source: 'mall', desc: '仅年度档位可用' },
            { id: 'v_sub90_used', name: '订阅 9 折券', type: 'sub_discount', discount: 0.9, status: 'used', planScope: 'all', expiresAt: addDays(20), redeemedAt: '2026-03-15', usedAt: '2026-04-22', source: 'mall' },
            { id: 'v_sub90_exp', name: '订阅 9 折券', type: 'sub_discount', discount: 0.9, status: 'active', planScope: 'all', expiresAt: '2026-01-01', redeemedAt: '2025-12-20', source: 'mall' },
            { id: 'v_ppv_trial_a', name: '付费内容试看券', type: 'ppv_trial', discount: 0, status: 'active', expiresAt: addDays(20), redeemedAt: '2026-06-01', source: 'mall', desc: '免费解锁 1 篇' },
            { id: 'v_ppv_trial_b', name: '付费内容试看券', type: 'ppv_trial', discount: 0, status: 'active', expiresAt: addDays(45), redeemedAt: '2026-05-15', source: 'mall', desc: '免费解锁 1 篇' },
            { id: 'v_ppv_disc50_a', name: '单篇 5 折券', type: 'ppv_discount', discount: 0.5, status: 'active', expiresAt: addDays(30), redeemedAt: '2026-06-03', source: 'mall' },
            { id: 'v_ppv_disc50_b', name: '单篇 5 折券', type: 'ppv_discount', discount: 0.5, status: 'active', expiresAt: addDays(8), redeemedAt: '2026-06-07', source: 'mall' },
            { id: 'v_ppv_trial_used', name: '付费内容试看券', type: 'ppv_trial', discount: 0, status: 'used', expiresAt: addDays(10), redeemedAt: '2026-04-01', usedAt: '2026-04-18', source: 'mall' }
        ];
    }

    function isPpvVoucher(v) {
        return v && (v.type === 'ppv_trial' || v.type === 'ppv_discount');
    }

    function readAll() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function writeAll(list) {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(list));
        } catch (e) { /* noop */ }
    }

    function ensurePpvSeed(data) {
        if (data.some(function (v) { return isPpvVoucher(v); })) return data;
        defaultVouchers().filter(isPpvVoucher).forEach(function (v) { data.unshift(v); });
        writeAll(data);
        return data;
    }

    function list() {
        var data = readAll();
        if (!data) {
            data = defaultVouchers();
            writeAll(data);
            return data;
        }
        return ensurePpvSeed(data);
    }

    function getById(id) {
        return list().find(function (v) { return v.id === id; }) || null;
    }

    function isExpired(v) {
        if (!v || !v.expiresAt) return false;
        return new Date(v.expiresAt + 'T23:59:59').getTime() < Date.now();
    }

    function getPlanType(planEl) {
        if (!planEl) return 'monthly';
        var t = planEl.getAttribute('data-plan-type');
        if (t === 'monthly' || t === 'quarterly' || t === 'annual') return t;
        var label = planEl.querySelector('.p1');
        var text = label ? label.textContent : '';
        if (/年/.test(text)) return 'annual';
        if (/季/.test(text)) return 'quarterly';
        return 'monthly';
    }

    function planScopeLabel(scope) {
        if (!scope || scope === 'all') return '全档位';
        if (Array.isArray(scope)) {
            var map = { monthly: '月度', quarterly: '季度', annual: '年度' };
            return scope.map(function (s) { return map[s] || s; }).join(' / ');
        }
        return String(scope);
    }

    function isPlanInScope(planScope, planType) {
        if (!planScope || planScope === 'all') return true;
        if (Array.isArray(planScope)) return planScope.indexOf(planType) >= 0;
        return planScope === planType;
    }

    function getEligibleForSubscription(planType, basePrice) {
        return list().filter(function (v) {
            if (v.type !== 'sub_discount') return false;
            if (v.status !== 'active') return false;
            if (isExpired(v)) return false;
            if (!isPlanInScope(v.planScope, planType)) return false;
            if (v.minAmount && basePrice < v.minAmount) return false;
            return true;
        });
    }

    function calcDiscountedPrice(basePrice, voucher) {
        if (!voucher || voucher.type !== 'sub_discount') return basePrice;
        var rate = Number(voucher.discount) || 1;
        return Math.round(basePrice * rate * 100) / 100;
    }

    function getEligibleForPpv(basePrice) {
        return list().filter(function (v) {
            if (!isPpvVoucher(v)) return false;
            if (v.status !== 'active') return false;
            if (isExpired(v)) return false;
            if (v.minAmount && basePrice < v.minAmount) return false;
            return true;
        });
    }

    function calcPpvPrice(basePrice, voucher) {
        if (!voucher) return basePrice;
        if (voucher.type === 'ppv_trial') return 0;
        if (voucher.type === 'ppv_discount') {
            var rate = Number(voucher.discount) || 1;
            return Math.round(basePrice * rate * 100) / 100;
        }
        return basePrice;
    }

    function formatPpvVoucherTag(voucher) {
        if (!voucher) return '';
        if (voucher.type === 'ppv_trial') return '免费解锁';
        if (voucher.type === 'ppv_discount') return formatDiscountTag(voucher);
        return '';
    }

    function formatPpvExpiry(voucher) {
        if (!voucher || !voucher.expiresAt) return '长期有效';
        var extra = voucher.type === 'ppv_trial' ? ' · 限 1 篇' : ' · 单篇付费';
        return voucher.expiresAt + ' 前有效' + extra;
    }

    function formatDiscountTag(voucher) {
        if (!voucher || !voucher.discount) return '';
        var zhe = Math.round(voucher.discount * 100) / 10;
        return zhe + ' 折';
    }

    function formatExpiry(voucher) {
        if (!voucher || !voucher.expiresAt) return '长期有效';
        return voucher.expiresAt + ' 前有效 · ' + planScopeLabel(voucher.planScope);
    }

    function addFromRedeem(productName, meta) {
        meta = meta || {};
        var cat = REDEEM_CATALOG[productName];
        if (!cat) return null;
        var id = 'v_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        var voucher = {
            id: id,
            name: productName,
            type: cat.type,
            discount: cat.discount,
            status: 'active',
            expiresAt: addDays(cat.validDays || 7),
            redeemedAt: dateStr(new Date()),
            source: 'mall',
            desc: cat.desc
        };
        if (cat.planScope) voucher.planScope = cat.planScope;
        var all = list();
        all.unshift(voucher);
        writeAll(all);
        return voucher;
    }

    function markUsed(id) {
        if (!id) return;
        var all = list();
        var found = false;
        all.forEach(function (v) {
            if (v.id === id) {
                v.status = 'used';
                v.usedAt = dateStr(new Date());
                found = true;
            }
        });
        if (found) writeAll(all);
    }

    function resetDemo() {
        writeAll(defaultVouchers());
    }

    global.MallVouchersStore = {
        list: list,
        getById: getById,
        getPlanType: getPlanType,
        getEligibleForSubscription: getEligibleForSubscription,
        getEligibleForPpv: getEligibleForPpv,
        calcDiscountedPrice: calcDiscountedPrice,
        calcPpvPrice: calcPpvPrice,
        formatDiscountTag: formatDiscountTag,
        formatPpvVoucherTag: formatPpvVoucherTag,
        formatExpiry: formatExpiry,
        formatPpvExpiry: formatPpvExpiry,
        isPpvVoucher: isPpvVoucher,
        planScopeLabel: planScopeLabel,
        addFromRedeem: addFromRedeem,
        markUsed: markUsed,
        resetDemo: resetDemo,
        REDEEM_CATALOG: REDEEM_CATALOG
    };
})(typeof window !== 'undefined' ? window : this);
