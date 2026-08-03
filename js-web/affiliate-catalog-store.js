/**
 * 实体联盟 · 合作方 / 分类 / 商品库 / 同步任务
 */
(function (global) {
    var LS_KEY = 'fl_affiliate_catalog_v3';
    var LEGACY_KEYS = ['fl_affiliate_catalog_v2', 'fl_affiliate_catalog_v1'];

    function nowIso() {
        return new Date().toISOString().slice(0, 16).replace('T', ' ');
    }

    function uid(prefix) {
        return (prefix || 'af') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    var CAR_IMAGES = [
        'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
        'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80'
    ];

    function calcUsdt(amount, fxRate) {
        var a = Number(amount) || 0;
        var fx = Number(fxRate);
        if (!isFinite(fx) || fx <= 0) fx = 1;
        return Math.round(a * fx * 100) / 100;
    }

    function amazonSdk(p) {
        return {
            ASIN: p.externalId || 'B0DEMO',
            ItemId: p.externalId || 'B0DEMO',
            Title: p.title,
            DetailPageURL: p.affiliateUrl,
            OfferListingPrice: Number(p.priceAmount) || 0,
            CurrencyCode: p.priceCurrency || 'USD',
            Availability: (p.stock != null && p.stock > 0) ? 'InStock' : 'OutOfStock',
            Quantity: p.stock != null ? p.stock : 0,
            CommissionRate: Math.round((Number(p.commissionRate) || 0) * 10000) / 100 + '%',
            PartnerTag: 'goodfans-20',
            BrowseNode: p.categoryId || '',
            Marketplace: 'www.amazon.com',
            SyncSource: 'PA-API-5.0'
        };
    }

    function shopifySdk(p) {
        return {
            product_id: p.externalId || 'gid://shopify/Product/0',
            handle: String(p.externalId || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            title: p.title,
            vendor: 'Shopify Collective',
            product_type: p.categoryId || '',
            'variants[0].price': Number(p.priceAmount) || 0,
            'variants[0].currency_code': p.priceCurrency || 'USD',
            'variants[0].inventory_quantity': p.stock != null ? p.stock : 0,
            commission_rate: Math.round((Number(p.commissionRate) || 0) * 10000) / 100 + '%',
            affiliate_url: p.affiliateUrl,
            SyncSource: 'Shopify Partners SDK'
        };
    }

    function defaultSdk(p) {
        if (p.partnerId === 'partner_shopify') return shopifySdk(p);
        return amazonSdk(p);
    }

    function normalizeProduct(raw) {
        var p = Object.assign({}, raw || {});
        p.priceCurrency = p.priceCurrency || 'USD';
        p.fxRate = p.fxRate != null ? Number(p.fxRate) : 1;
        if (!isFinite(p.fxRate) || p.fxRate <= 0) p.fxRate = 1;
        p.stock = p.stock != null ? Number(p.stock) : 100;
        if (!isFinite(p.stock) || p.stock < 0) p.stock = 0;
        p.priceAmount = Number(p.priceAmount) || 0;
        p.priceUsdt = p.priceUsdt != null ? Number(p.priceUsdt) : calcUsdt(p.priceAmount, p.fxRate);
        p.createdAt = p.createdAt || p.syncedAt || '2026-07-20 10:00';
        p.updatedAt = p.updatedAt || p.syncedAt || p.createdAt;
        p.enabled = p.enabled !== false;
        p.syncStatus = p.syncStatus || 'synced';
        if (!p.partnerSdk || typeof p.partnerSdk !== 'object') {
            p.partnerSdk = defaultSdk(p);
        }
        return p;
    }

    function seed() {
        var products = [
            {
                id: 'afp_jacket_01',
                partnerId: 'partner_amazon',
                externalId: 'B0AMZ-JKT-01',
                title: 'Urban Tech Softshell Jacket',
                imageUrl: CAR_IMAGES[0],
                description: '轻量防风软壳外套，街拍与旅行常用。',
                priceDisplay: '$89.00',
                priceAmount: 89,
                priceCurrency: 'USD',
                fxRate: 1,
                stock: 128,
                categoryId: 'fashion',
                tags: ['jacket', 'outerwear', 'street', 'travel', '外套', 'car'],
                affiliateUrl: 'https://www.amazon.com/dp/demo-jacket-01?tag=goodfans-20',
                commissionRate: 0.05,
                embeddingHint: 'black softshell jacket urban tech outdoor streetwear car',
                syncStatus: 'synced',
                syncedAt: '2026-07-25 11:00',
                createdAt: '2026-07-20 09:12',
                updatedAt: '2026-07-25 11:00',
                enabled: true
            },
            {
                id: 'afp_lipstick_02',
                partnerId: 'partner_amazon',
                externalId: 'B0AMZ-LP-02',
                title: 'Velvet Matte Lipstick · Rose Clay',
                imageUrl: CAR_IMAGES[1],
                description: '雾面唇膏，日常妆容推荐色。',
                priceDisplay: '$24.00',
                priceAmount: 24,
                priceCurrency: 'USD',
                fxRate: 1,
                stock: 520,
                categoryId: 'beauty',
                tags: ['lipstick', 'makeup', 'beauty', '唇膏', '美妆'],
                affiliateUrl: 'https://www.amazon.com/dp/demo-lipstick-02?tag=goodfans-20',
                commissionRate: 0.08,
                embeddingHint: 'rose clay velvet matte lipstick makeup beauty',
                syncStatus: 'synced',
                syncedAt: '2026-07-25 11:00',
                createdAt: '2026-07-21 14:30',
                updatedAt: '2026-07-25 11:00',
                enabled: true
            },
            {
                id: 'afp_camera_03',
                partnerId: 'partner_shopify',
                externalId: 'SHP-CAM-03',
                title: 'Compact Mirrorless Camera Kit',
                imageUrl: CAR_IMAGES[2],
                description: '轻便无反套机，创作者出行拍摄。',
                priceDisplay: '$699.00',
                priceAmount: 699,
                priceCurrency: 'USD',
                fxRate: 1,
                stock: 36,
                categoryId: 'gear',
                tags: ['camera', 'gear', 'vlog', '相机', '数码'],
                affiliateUrl: 'https://demo-shop.myshopify.com/products/camera-kit?ref=goodfans',
                commissionRate: 0.04,
                embeddingHint: 'mirrorless camera kit vlog creator travel photography',
                syncStatus: 'synced',
                syncedAt: '2026-07-26 08:30',
                createdAt: '2026-07-22 08:00',
                updatedAt: '2026-07-26 08:30',
                enabled: true
            },
            {
                id: 'afp_mug_04',
                partnerId: 'partner_shopify',
                externalId: 'SHP-MUG-04',
                title: 'Ceramic Pour-Over Mug Set',
                imageUrl: CAR_IMAGES[3],
                description: '手冲陶瓷杯组，生活方式内容挂载。',
                priceDisplay: '€36.00',
                priceAmount: 36,
                priceCurrency: 'EUR',
                fxRate: 1.08,
                stock: 0,
                categoryId: 'lifestyle',
                tags: ['mug', 'coffee', 'lifestyle', '杯', '咖啡'],
                affiliateUrl: 'https://demo-shop.myshopify.com/products/mug-set?ref=goodfans',
                commissionRate: 0.1,
                embeddingHint: 'ceramic pour over coffee mug lifestyle morning',
                syncStatus: 'synced',
                syncedAt: '2026-07-26 08:30',
                createdAt: '2026-07-23 16:40',
                updatedAt: '2026-07-26 08:30',
                enabled: false
            }
        ].map(normalizeProduct);

        return {
            partners: [
                {
                    id: 'partner_amazon',
                    name: 'Amazon Affiliate',
                    apiEndpoint: 'https://api.amazon.example/affiliate/v1',
                    enabled: true,
                    updatedAt: '2026-07-10 09:00'
                },
                {
                    id: 'partner_shopify',
                    name: 'Shopify Collective',
                    apiEndpoint: 'https://api.shopify.example/partners/v1',
                    enabled: true,
                    updatedAt: '2026-07-12 14:00'
                }
            ],
            categories: [
                { id: 'fashion', name: '服饰穿搭', sort: 1, enabled: true },
                { id: 'beauty', name: '美妆个护', sort: 2, enabled: true },
                { id: 'gear', name: '数码周边', sort: 3, enabled: true },
                { id: 'lifestyle', name: '生活方式', sort: 4, enabled: true }
            ],
            products: products,
            syncJobs: [
                {
                    id: 'sync_demo_1',
                    partnerId: 'partner_amazon',
                    status: 'success',
                    imported: 2,
                    message: '同步完成',
                    startedAt: '2026-07-25 11:00',
                    finishedAt: '2026-07-25 11:01'
                }
            ],
            version: 3
        };
    }

    function migrateLegacy(raw) {
        if (!raw || typeof raw !== 'object') return null;
        var out = {
            partners: (raw.partners || []).map(function (p) {
                var next = Object.assign({}, p);
                delete next.commissionNote;
                return next;
            }),
            categories: Array.isArray(raw.categories) ? raw.categories.slice() : seed().categories,
            products: (raw.products || []).map(normalizeProduct),
            syncJobs: Array.isArray(raw.syncJobs) ? raw.syncJobs.slice() : [],
            version: 3
        };
        return out;
    }

    function read() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (raw) {
                var p = JSON.parse(raw);
                if (p && Array.isArray(p.products) && p.version === 3) {
                    p.products = p.products.map(normalizeProduct);
                    return p;
                }
            }
            for (var i = 0; i < LEGACY_KEYS.length; i++) {
                var leg = localStorage.getItem(LEGACY_KEYS[i]);
                if (!leg) continue;
                try {
                    var migrated = migrateLegacy(JSON.parse(leg));
                    if (migrated && migrated.products.length) {
                        write(migrated);
                        localStorage.removeItem(LEGACY_KEYS[i]);
                        return migrated;
                    }
                } catch (e2) { /* ignore */ }
            }
        } catch (e) { /* ignore */ }
        var s = seed();
        write(s);
        return s;
    }

    function write(data) {
        try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    }

    function listPartners() { return read().partners.slice(); }
    function listCategories() {
        return read().categories.slice().sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); });
    }
    function listProducts(filter) {
        var list = read().products.slice().map(normalizeProduct);
        filter = filter || {};
        if (filter.partnerId) list = list.filter(function (p) { return p.partnerId === filter.partnerId; });
        if (filter.categoryId) list = list.filter(function (p) { return p.categoryId === filter.categoryId; });
        if (filter.enabledOnly) list = list.filter(function (p) { return p.enabled !== false; });
        if (filter.q) {
            var q = String(filter.q).toLowerCase();
            list = list.filter(function (p) {
                return (p.title || '').toLowerCase().indexOf(q) >= 0 ||
                    (p.id || '').toLowerCase().indexOf(q) >= 0 ||
                    (p.externalId || '').toLowerCase().indexOf(q) >= 0 ||
                    (p.tags || []).join(' ').toLowerCase().indexOf(q) >= 0;
            });
        }
        return list;
    }
    function getProduct(id) {
        return listProducts().filter(function (p) { return p.id === id; })[0] || null;
    }
    function getPartner(id) {
        return listPartners().filter(function (p) { return p.id === id; })[0] || null;
    }
    function categoryName(id) {
        var c = listCategories().filter(function (x) { return x.id === id; })[0];
        return c ? c.name : id;
    }

    function savePartner(partner) {
        var data = read();
        var idx = -1;
        for (var i = 0; i < data.partners.length; i++) {
            if (data.partners[i].id === partner.id) { idx = i; break; }
        }
        partner.updatedAt = nowIso();
        delete partner.commissionNote;
        if (idx >= 0) data.partners[idx] = partner;
        else data.partners.push(partner);
        write(data);
        return partner;
    }

    function saveCategory(cat) {
        var data = read();
        var idx = -1;
        for (var i = 0; i < data.categories.length; i++) {
            if (data.categories[i].id === cat.id) { idx = i; break; }
        }
        if (idx >= 0) data.categories[idx] = cat;
        else data.categories.push(cat);
        write(data);
        return cat;
    }

    function upsertProduct(product) {
        var data = read();
        var next = normalizeProduct(product);
        next.updatedAt = nowIso();
        next.priceUsdt = calcUsdt(next.priceAmount, next.fxRate);
        next.priceDisplay = (next.priceCurrency === 'USD' ? '$' : next.priceCurrency === 'EUR' ? '€' : '') +
            Number(next.priceAmount).toFixed(2) +
            (next.priceCurrency === 'USD' || next.priceCurrency === 'EUR' ? '' : ' ' + next.priceCurrency);
        if (!next.partnerSdk || typeof next.partnerSdk !== 'object') {
            next.partnerSdk = defaultSdk(next);
        }
        var idx = -1;
        for (var i = 0; i < data.products.length; i++) {
            if (data.products[i].id === next.id) { idx = i; break; }
        }
        if (idx >= 0) {
            if (!next.createdAt) next.createdAt = data.products[idx].createdAt || nowIso();
            data.products[idx] = next;
        } else {
            next.createdAt = next.createdAt || nowIso();
            data.products.unshift(next);
        }
        write(data);
        return next;
    }

    function setProductEnabled(id, enabled) {
        var p = getProduct(id);
        if (!p) return null;
        p.enabled = !!enabled;
        return upsertProduct(p);
    }

    function deleteProduct(id) {
        var data = read();
        var p = data.products.filter(function (x) { return x.id === id; })[0];
        if (!p) return { ok: false, error: '商品不存在' };
        if (p.enabled !== false) return { ok: false, error: '请先停用后再删除' };
        data.products = data.products.filter(function (x) { return x.id !== id; });
        write(data);
        return { ok: true };
    }

    function runSync(partnerId) {
        var data = read();
        var partner = getPartner(partnerId);
        var job = {
            id: uid('sync'),
            partnerId: partnerId,
            status: 'success',
            imported: data.products.filter(function (p) { return p.partnerId === partnerId; }).length,
            message: (partner ? partner.name : partnerId) + ' 同步完成（原型 Mock）',
            startedAt: nowIso(),
            finishedAt: nowIso()
        };
        data.products.forEach(function (p) {
            if (p.partnerId === partnerId) {
                p.syncStatus = 'synced';
                p.syncedAt = job.finishedAt;
                p.updatedAt = job.finishedAt;
                p.partnerSdk = defaultSdk(normalizeProduct(p));
            }
        });
        data.syncJobs.unshift(job);
        write(data);
        return job;
    }

    function listSyncJobs() {
        return read().syncJobs.slice();
    }

    /**
     * AI 匹配：按 tags / embeddingHint / title 关键词重叠打分
     */
    function matchProducts(hints, limit) {
        limit = limit || 3;
        hints = (hints || []).map(function (h) { return String(h).toLowerCase(); });
        if (!hints.length) hints = ['jacket', 'camera', 'street'];
        var scored = listProducts({ enabledOnly: true }).map(function (p) {
            var hay = ((p.title || '') + ' ' + (p.embeddingHint || '') + ' ' + (p.tags || []).join(' ')).toLowerCase();
            var score = 0;
            hints.forEach(function (h) {
                if (h && hay.indexOf(h) >= 0) score += 2;
                (p.tags || []).forEach(function (t) {
                    if (String(t).toLowerCase() === h) score += 3;
                });
            });
            return { product: p, score: score };
        });
        scored.sort(function (a, b) { return b.score - a.score; });
        var top = scored.filter(function (x) { return x.score > 0; }).slice(0, limit);
        if (!top.length) return scored.slice(0, limit).map(function (x) { return x.product; });
        return top.map(function (x) { return x.product; });
    }

    global.AffiliateCatalogStore = {
        listPartners: listPartners,
        listCategories: listCategories,
        listProducts: listProducts,
        getProduct: getProduct,
        getPartner: getPartner,
        categoryName: categoryName,
        savePartner: savePartner,
        saveCategory: saveCategory,
        upsertProduct: upsertProduct,
        setProductEnabled: setProductEnabled,
        deleteProduct: deleteProduct,
        runSync: runSync,
        listSyncJobs: listSyncJobs,
        matchProducts: matchProducts,
        calcUsdt: calcUsdt,
        defaultSdk: defaultSdk,
        uid: uid,
        nowIso: nowIso
    };
})(typeof window !== 'undefined' ? window : this);
