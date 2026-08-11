/**
 * 创作者实体橱窗 + 点击 + 佣金回传分配
 */
(function (global) {
    var LS_KEY = 'fl_affiliate_showcase_v4';
    var LS_KEY_LEGACY = ['fl_affiliate_showcase_v3', 'fl_affiliate_showcase_v2', 'fl_affiliate_showcase_v1'];
    var DEMO_CREATOR = 'demo_uid_882910';

    /** 流水状态：冲正是独立一条负向记录，不改写原结算单 */
    var STATUS_LABELS = {
        settled: '已结算',
        pending: '待结算',
        reverse: '冲正'
    };

    function nowIso() {
        return new Date().toISOString().slice(0, 16).replace('T', ' ');
    }

    function uid(prefix) {
        return (prefix || 'ash') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function statusLabel(status) {
        return STATUS_LABELS[status] || status || '—';
    }

    /** 平台侧联盟佣金流水号 */
    function genPlatformOrderNo() {
        var d = new Date();
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        var seq = String(Math.floor(Math.random() * 9000) + 1000);
        return 'AC' + y + m + day + seq;
    }

    /** 模拟三方订单号 */
    function genPartnerOrderNo(partnerId) {
        var prefix = (partnerId || '').indexOf('shopify') >= 0 ? 'SHP' : 'AMZ';
        return prefix + '-' + String(Math.floor(Math.random() * 900000) + 100000) + '-' +
            String(Math.floor(Math.random() * 90000) + 10000);
    }

    function seedCommissions() {
        return [
            {
                id: 'acm_seed_settled_01',
                clickId: 'clk_seed_01',
                productId: 'afp_lipstick_02',
                productTitle: 'Velvet Matte Lipstick · Rose Clay',
                creatorId: DEMO_CREATOR,
                partnerId: 'partner_amazon',
                platformOrderNo: 'AC202608060105',
                partnerOrderNo: 'AMZ-482913-77102',
                orderAmount: 24,
                commissionRate: 0.08,
                affiliateGross: 1.92,
                creatorShare: 1.34,
                platformShare: 0.58,
                status: 'settled',
                relatedId: '',
                createdAt: '2026-08-06 01:05'
            },
            {
                id: 'acm_seed_pending_02',
                clickId: 'clk_seed_02',
                productId: 'afp_jacket_01',
                productTitle: 'Urban Tech Softshell Jacket',
                creatorId: DEMO_CREATOR,
                partnerId: 'partner_amazon',
                platformOrderNo: 'AC202608051422',
                partnerOrderNo: 'AMZ-319557-44081',
                orderAmount: 89,
                commissionRate: 0.05,
                affiliateGross: 4.45,
                creatorShare: 3.12,
                platformShare: 1.33,
                status: 'pending',
                relatedId: '',
                createdAt: '2026-08-05 14:22'
            },
            {
                id: 'acm_seed_settled_03',
                clickId: 'clk_seed_03',
                productId: 'afp_camera_03',
                productTitle: 'Compact Mirrorless Camera Kit',
                creatorId: DEMO_CREATOR,
                partnerId: 'partner_shopify',
                platformOrderNo: 'AC202608041118',
                partnerOrderNo: 'SHP-902441-11830',
                orderAmount: 699,
                commissionRate: 0.04,
                affiliateGross: 27.96,
                creatorShare: 19.57,
                platformShare: 8.39,
                status: 'settled',
                relatedId: '',
                createdAt: '2026-08-04 11:18'
            },
            {
                id: 'acm_seed_settled_04',
                clickId: 'clk_seed_04',
                productId: 'afp_mug_04',
                productTitle: 'Ceramic Pour-Over Mug Set',
                creatorId: 'demo_uid_771002',
                partnerId: 'partner_shopify',
                platformOrderNo: 'AC202608030940',
                partnerOrderNo: 'SHP-778210-66315',
                orderAmount: 36,
                commissionRate: 0.1,
                affiliateGross: 3.6,
                creatorShare: 2.52,
                platformShare: 1.08,
                status: 'settled',
                relatedId: '',
                createdAt: '2026-08-03 09:40'
            },
            {
                id: 'acm_seed_reverse_04b',
                clickId: 'clk_seed_04',
                productId: 'afp_mug_04',
                productTitle: 'Ceramic Pour-Over Mug Set',
                creatorId: 'demo_uid_771002',
                partnerId: 'partner_shopify',
                platformOrderNo: 'AC202608031812R',
                partnerOrderNo: 'SHP-778210-66315',
                orderAmount: -36,
                commissionRate: 0.1,
                affiliateGross: -3.6,
                creatorShare: -2.52,
                platformShare: -1.08,
                status: 'reverse',
                relatedId: 'acm_seed_settled_04',
                remark: '第三方退货回传 · 冲销原结算单',
                createdAt: '2026-08-03 18:12'
            },
            {
                id: 'acm_seed_pending_05',
                clickId: 'clk_seed_05',
                productId: 'afp_lipstick_02',
                productTitle: 'Velvet Matte Lipstick · Rose Clay',
                creatorId: 'demo_uid_771002',
                partnerId: 'partner_amazon',
                platformOrderNo: 'AC202608021655',
                partnerOrderNo: 'AMZ-661204-39017',
                orderAmount: 24,
                commissionRate: 0.08,
                affiliateGross: 1.92,
                creatorShare: 1.34,
                platformShare: 0.58,
                status: 'pending',
                relatedId: '',
                createdAt: '2026-08-02 16:55'
            }
        ];
    }

    function defaultSeed() {
        return {
            items: [
                { id: 'shi_1', creatorId: DEMO_CREATOR, productId: 'afp_jacket_01', pinned: true, addedAt: '2026-07-26 10:00' },
                { id: 'shi_2', creatorId: DEMO_CREATOR, productId: 'afp_camera_03', pinned: false, addedAt: '2026-07-26 10:05' },
                { id: 'shi_3', creatorId: DEMO_CREATOR, productId: 'afp_lipstick_02', pinned: false, addedAt: '2026-07-27 09:00' }
            ],
            clicks: [],
            commissions: seedCommissions()
        };
    }

    function ensureDemoCommissions(data) {
        if (!data.commissions) data.commissions = [];
        var seeds = seedCommissions();
        var byId = {};
        data.commissions.forEach(function (c) { byId[c.id] = c; });
        seeds.forEach(function (seed) {
            if (!byId[seed.id]) {
                data.commissions.push(seed);
                byId[seed.id] = seed;
                return;
            }
            var cur = byId[seed.id];
            if (!cur.platformOrderNo) cur.platformOrderNo = seed.platformOrderNo;
            if (!cur.partnerOrderNo) cur.partnerOrderNo = seed.partnerOrderNo;
            if (cur.relatedId == null) cur.relatedId = seed.relatedId || '';
            if (seed.remark && !cur.remark) cur.remark = seed.remark;
        });

        // 去掉与种子重复的旧模拟行（曾出现同一成交两条：一条无订单号）
        var seedIdMap = {};
        seeds.forEach(function (s) { seedIdMap[s.id] = true; });
        data.commissions = data.commissions.filter(function (c) {
            if (seedIdMap[c.id]) return true;
            var dupSeed = seeds.some(function (s) {
                return s.productId === c.productId &&
                    s.creatorId === c.creatorId &&
                    Number(s.orderAmount) === Number(c.orderAmount) &&
                    s.createdAt === c.createdAt &&
                    s.status === c.status;
            });
            return !dupSeed;
        });

        // 其余流水补齐订单号
        data.commissions.forEach(function (c) {
            if (!c.platformOrderNo) c.platformOrderNo = genPlatformOrderNo();
            if (!c.partnerOrderNo) c.partnerOrderNo = genPartnerOrderNo(c.partnerId);
        });
        return data;
    }

    function read() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (raw) {
                var p = JSON.parse(raw);
                if (p && Array.isArray(p.items)) {
                    ensureDemoCommissions(p);
                    write(p);
                    return p;
                }
            }
            for (var i = 0; i < LS_KEY_LEGACY.length; i++) {
                var legacy = localStorage.getItem(LS_KEY_LEGACY[i]);
                if (!legacy) continue;
                var old = JSON.parse(legacy);
                if (old && Array.isArray(old.items)) {
                    // 去掉旧版「单条改状态为 reversed」演示行，改由结算+冲正两条种子覆盖
                    old.commissions = (old.commissions || []).filter(function (c) {
                        return c.id !== 'acm_seed_reversed_04' && c.status !== 'reversed';
                    });
                    ensureDemoCommissions(old);
                    write(old);
                    return old;
                }
            }
        } catch (e) { /* ignore */ }
        var seed = defaultSeed();
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
                platformOrderNo: opts.platformOrderNo || genPlatformOrderNo(),
                partnerOrderNo: opts.partnerOrderNo || genPartnerOrderNo(product.partnerId),
                orderAmount: orderAmount,
                commissionRate: product.commissionRate,
                affiliateGross: split.affiliateGross,
                creatorShare: split.creatorShare,
                platformShare: split.platformShare,
                status: 'settled',
                relatedId: '',
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
            .filter(function (c) { return c.status === 'settled' || c.status === 'reverse'; })
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
        STATUS_LABELS: STATUS_LABELS,
        statusLabel: statusLabel,
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
