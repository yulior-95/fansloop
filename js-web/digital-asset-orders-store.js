/**
 * 数字资产订单 + 用户权益 + 创作者数字收益流水
 */
(function (global) {
    var LS_KEY = 'fl_digital_asset_orders_v1';
    var DEMO_BUYER = 'demo_fan_991001';
    var DEMO_CREATOR = 'demo_uid_882910';

    function nowIso() {
        return new Date().toISOString().slice(0, 16).replace('T', ' ');
    }

    function uid(prefix) {
        return (prefix || 'dao') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function read() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (raw) {
                var p = JSON.parse(raw);
                if (p && Array.isArray(p.orders)) return p;
            }
        } catch (e) { /* ignore */ }
        return { orders: [], entitlements: [], earnings: [] };
    }

    function write(data) {
        try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    }

    function currentUserId() {
        if (global.GoodfansAuth && global.GoodfansAuth.getUserId) {
            return global.GoodfansAuth.getUserId() || DEMO_BUYER;
        }
        return DEMO_BUYER;
    }

    function listOrders(filter) {
        var orders = read().orders.slice();
        filter = filter || {};
        if (filter.creatorId) orders = orders.filter(function (o) { return o.creatorId === filter.creatorId; });
        if (filter.buyerId) orders = orders.filter(function (o) { return o.buyerId === filter.buyerId; });
        if (filter.productId) orders = orders.filter(function (o) { return o.productId === filter.productId; });
        return orders.sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    }

    function listEntitlements(buyerId) {
        buyerId = buyerId || currentUserId();
        return read().entitlements.filter(function (e) { return e.buyerId === buyerId; });
    }

    function hasEntitlement(productId, buyerId) {
        buyerId = buyerId || currentUserId();
        return listEntitlements(buyerId).some(function (e) { return e.productId === productId; });
    }

    function sumCreatorEarnings(creatorId) {
        return read().earnings
            .filter(function (e) { return e.creatorId === (creatorId || DigitalAssetsStore && DigitalAssetsStore.DEMO_CREATOR); })
            .reduce(function (s, e) { return s + (e.amount || 0); }, 0);
    }

    function listEarnings(creatorId) {
        return read().earnings
            .filter(function (e) { return !creatorId || e.creatorId === creatorId; })
            .slice()
            .sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    }

    /**
     * 购买闭环：校验库存 → 扣款 → 写订单/权益/收益 → 增 soldCount
     * @returns {{ ok: boolean, error?: string, order?: object }}
     */
    function purchase(productId, opts) {
        opts = opts || {};
        var Store = global.DigitalAssetsStore;
        var Config = global.MallCommerceConfigStore;
        if (!Store || !Config) return { ok: false, error: '商店未初始化' };

        var product = Store.getById(productId);
        if (!product) return { ok: false, error: '商品不存在' };

        // 已进入支付确认的订单可在下架后完成；新购买仍要求 listed
        var statusOk = product.status === 'listed' ||
            (opts.checkoutLocked && (product.status === 'listed' || product.status === 'delisted' || product.status === 'sold_out'));
        if (product.status === 'sold_out' && !opts.checkoutLocked) {
            return { ok: false, error: '已售罄' };
        }
        if (!statusOk) {
            return { ok: false, error: product.status === 'sold_out' ? '已售罄' : '商品未上架' };
        }

        if (product.supplyMode === 'limited') {
            var left = Store.remaining(product);
            if (left !== null && left <= 0 && !opts.checkoutLocked) return { ok: false, error: '已售罄' };
        }

        var buyerId = opts.buyerId || currentUserId();
        // 访客视角原型：当前登录若是创作者本人，以粉丝身份完成购买演示
        if (opts.asVisitor && product.creatorId && product.creatorId === buyerId) {
            buyerId = DEMO_BUYER;
        }
        if (product.creatorId && product.creatorId === buyerId) {
            return { ok: false, error: '不能购买自己的数字资产' };
        }
        if (hasEntitlement(productId, buyerId)) return { ok: false, error: '已拥有该数字资产' };

        var split = Config.calcDigitalSplit(product.priceUsdt);
        var Assets = global.FLUserAssets;
        if (Assets && Assets.getLiveUsdt) {
            var bal = Assets.getLiveUsdt();
            if (bal < split.priceUsdt) return { ok: false, error: 'USDT 余额不足，请先充值' };
            Assets.addLiveUsdt(-split.priceUsdt);
        }

        var order = {
            id: uid('dao'),
            productId: product.id,
            productTitle: product.title,
            coverUrl: product.coverUrl,
            assetType: product.assetType,
            creatorId: product.creatorId,
            creatorName: product.creatorName,
            buyerId: buyerId,
            priceUsdt: split.priceUsdt,
            platformFee: split.platformFee,
            creatorNet: split.creatorNet,
            feePercent: split.feePercent,
            status: 'completed',
            createdAt: nowIso()
        };

        var entitlement = {
            id: uid('ent'),
            orderId: order.id,
            productId: product.id,
            productTitle: product.title,
            coverUrl: product.coverUrl,
            assetType: product.assetType,
            contentFiles: product.contentFiles || [],
            creatorId: product.creatorId,
            creatorName: product.creatorName,
            buyerId: buyerId,
            priceUsdt: split.priceUsdt,
            grantedAt: nowIso()
        };

        var earning = {
            id: uid('dae'),
            orderId: order.id,
            productId: product.id,
            productTitle: product.title,
            creatorId: product.creatorId,
            amount: split.creatorNet,
            gross: split.priceUsdt,
            platformFee: split.platformFee,
            createdAt: nowIso()
        };

        var data = read();
        data.orders.unshift(order);
        data.entitlements.unshift(entitlement);
        data.earnings.unshift(earning);
        write(data);

        Store.incrementSold(product.id, 1);

        try {
            global.dispatchEvent(new CustomEvent('fl-digital-purchase', { detail: order }));
        } catch (e) { /* ignore */ }

        return { ok: true, order: order, entitlement: entitlement };
    }

    global.DigitalAssetOrdersStore = {
        DEMO_BUYER: DEMO_BUYER,
        listOrders: listOrders,
        listEntitlements: listEntitlements,
        hasEntitlement: hasEntitlement,
        sumCreatorEarnings: sumCreatorEarnings,
        listEarnings: listEarnings,
        purchase: purchase,
        currentUserId: currentUserId
    };
})(typeof window !== 'undefined' ? window : this);
