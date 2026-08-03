/**
 * 创作者实体橱窗 + 点击 + 佣金回传分配
 */
(function (global) {
    var LS_KEY = 'fl_affiliate_showcase_v1';
    var DEMO_CREATOR = 'demo_uid_882910';

    function nowIso() {
        return new Date().toISOString().slice(0, 16).replace('T', ' ');
    }

    function uid(prefix) {
        return (prefix || 'ash') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function read() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (raw) {
                var p = JSON.parse(raw);
                if (p && Array.isArray(p.items)) return p;
            }
        } catch (e) { /* ignore */ }
        var seed = {
            items: [
                { id: 'shi_1', creatorId: DEMO_CREATOR, productId: 'afp_jacket_01', pinned: true, addedAt: '2026-07-26 10:00' },
                { id: 'shi_2', creatorId: DEMO_CREATOR, productId: 'afp_camera_03', pinned: false, addedAt: '2026-07-26 10:05' },
                { id: 'shi_3', creatorId: DEMO_CREATOR, productId: 'afp_lipstick_02', pinned: false, addedAt: '2026-07-27 09:00' }
            ],
            clicks: [],
            commissions: []
        };
        write(seed);
        return seed;
    }

    function write(data) {
        try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    }

    function listShowcase(creatorId) {
        creatorId = creatorId || DEMO_CREATOR;
        var Catalog = global.AffiliateCatalogStore;
        return read().items
            .filter(function (it) { return it.creatorId === creatorId; })
            .map(function (it) {
                var product = Catalog ? Catalog.getProduct(it.productId) : null;
                return Object.assign({}, it, { product: product });
            })
            .filter(function (it) { return !!it.product; })
            .sort(function (a, b) {
                if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                return (b.addedAt || '').localeCompare(a.addedAt || '');
            });
    }

    function hasInShowcase(creatorId, productId) {
        return read().items.some(function (it) {
            return it.creatorId === creatorId && it.productId === productId;
        });
    }

    function addToShowcase(productId, creatorId) {
        creatorId = creatorId || DEMO_CREATOR;
        if (hasInShowcase(creatorId, productId)) return { ok: false, error: '已在橱窗中' };
        var Catalog = global.AffiliateCatalogStore;
        if (!Catalog || !Catalog.getProduct(productId)) return { ok: false, error: '商品不存在' };
        var data = read();
        var item = {
            id: uid('shi'),
            creatorId: creatorId,
            productId: productId,
            pinned: false,
            addedAt: nowIso()
        };
        data.items.unshift(item);
        write(data);
        return { ok: true, item: item };
    }

    function removeFromShowcase(productId, creatorId) {
        creatorId = creatorId || DEMO_CREATOR;
        var data = read();
        data.items = data.items.filter(function (it) {
            return !(it.creatorId === creatorId && it.productId === productId);
        });
        write(data);
        return { ok: true };
    }

    function togglePin(productId, creatorId) {
        creatorId = creatorId || DEMO_CREATOR;
        var data = read();
        var target = null;
        data.items.forEach(function (it) {
            if (it.creatorId === creatorId && it.productId === productId) target = it;
        });
        if (!target) return { ok: false, error: '不在橱窗中' };
        var next = !target.pinned;
        // 实体选品同橱窗仅允许 1 个置顶
        data.items.forEach(function (it) {
            if (it.creatorId !== creatorId) return;
            if (it.productId === productId) it.pinned = next;
            else if (next) it.pinned = false;
        });
        write(data);
        return { ok: true, pinned: next };
    }

    /**
     * 记录外跳点击；可选立即模拟成交回传
     */
    function recordClickAndMaybeConvert(productId, opts) {
        opts = opts || {};
        var Catalog = global.AffiliateCatalogStore;
        var Config = global.MallCommerceConfigStore;
        var product = Catalog && Catalog.getProduct(productId);
        if (!product) return { ok: false, error: '商品不存在' };

        var creatorId = opts.creatorId || DEMO_CREATOR;
        var click = {
            id: uid('clk'),
            productId: productId,
            creatorId: creatorId,
            source: opts.source || 'showcase',
            createdAt: nowIso()
        };
        var data = read();
        data.clicks.unshift(click);

        var commission = null;
        if (opts.simulateConvert !== false) {
            var orderAmount = product.priceAmount || 0;
            var affiliateGross = Math.round(orderAmount * (product.commissionRate || 0) * 100) / 100;
            var split = Config
                ? Config.calcAffiliateSplit(affiliateGross)
                : { affiliateGross: affiliateGross, creatorShare: affiliateGross * 0.7, platformShare: affiliateGross * 0.3 };

            commission = {
                id: uid('acm'),
                clickId: click.id,
                productId: productId,
                productTitle: product.title,
                creatorId: creatorId,
                partnerId: product.partnerId,
                orderAmount: orderAmount,
                commissionRate: product.commissionRate,
                affiliateGross: split.affiliateGross,
                creatorShare: split.creatorShare,
                platformShare: split.platformShare,
                status: 'settled',
                createdAt: nowIso()
            };
            data.commissions.unshift(commission);
        }

        write(data);
        return { ok: true, click: click, commission: commission, affiliateUrl: product.affiliateUrl };
    }

    function listCommissions(filter) {
        filter = filter || {};
        var list = read().commissions.slice();
        if (filter.creatorId) list = list.filter(function (c) { return c.creatorId === filter.creatorId; });
        return list.sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    }

    function listClicks() {
        return read().clicks.slice();
    }

    function sumCreatorCommissions(creatorId) {
        return listCommissions({ creatorId: creatorId || DEMO_CREATOR })
            .reduce(function (s, c) { return s + (c.creatorShare || 0); }, 0);
    }

    /** 某商品被多少创作者放入橱窗推广 */
    function countCreatorsForProduct(productId) {
        var map = {};
        read().items.forEach(function (it) {
            if (it.productId === productId) map[it.creatorId] = true;
        });
        return Object.keys(map).length;
    }

    global.AffiliateShowcaseStore = {
        DEMO_CREATOR: DEMO_CREATOR,
        listShowcase: listShowcase,
        hasInShowcase: hasInShowcase,
        addToShowcase: addToShowcase,
        removeFromShowcase: removeFromShowcase,
        togglePin: togglePin,
        recordClickAndMaybeConvert: recordClickAndMaybeConvert,
        listCommissions: listCommissions,
        listClicks: listClicks,
        sumCreatorCommissions: sumCreatorCommissions,
        countCreatorsForProduct: countCreatorsForProduct
    };
})(typeof window !== 'undefined' ? window : this);
