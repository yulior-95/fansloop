/**
 * 数字虚拟资产商品库 · localStorage Mock
 * API: GET/POST /api/v1/digital-products · admin review endpoints
 */
(function (global) {
    var LS_KEY = 'fl_digital_assets_v5';
    var DEMO_CREATOR = 'demo_uid_882910';

    var ASSET_TYPES = [
        { id: 'nft', label: 'NFT 收藏品' },
        { id: 'image', label: '数字图片' },
        { id: 'video', label: '数字视频' },
        { id: 'exclusive', label: '独家内容' },
        { id: 'membership', label: '数字会员权益' },
        { id: 'other', label: '其他虚拟资产' }
    ];

    var MONKEY_COVERS = [
        'https://images.unsplash.com/photo-1727722158074-b7916daf6af4?w=800&q=80',
        'https://images.unsplash.com/photo-1665663389418-1e8c19f048c0?w=800&q=80',
        'https://images.unsplash.com/photo-1651607792435-e944c20826a2?w=800&q=80',
        'https://cdn.pixabay.com/photo/2019/07/24/14/17/monkey-4360298_640.jpg'
    ];

    function nowIso() {
        return new Date().toISOString().slice(0, 16).replace('T', ' ');
    }

    function uid(prefix) {
        return (prefix || 'da') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function seedProducts() {
        return [
            {
                id: 'da_seed_nft_01',
                creatorId: DEMO_CREATOR,
                creatorName: 'Luna 🌙',
                title: 'Neon Echo · Genesis Pass',
                description: '创世数字通行证，解锁未来 NFT 空投资格与专属社群入口。',
                coverUrl: MONKEY_COVERS[0],
                assetType: 'nft',
                contentFiles: [MONKEY_COVERS[0]],
                priceUsdt: 10,
                supplyMode: 'limited',
                supplyTotal: 100,
                soldCount: 20,
                status: 'listed',
                pinned: true,
                publishedAt: '2026-07-20 12:00',
                rejectReason: '',
                createdAt: '2026-07-18 09:00',
                updatedAt: '2026-07-20 12:00'
            },
            {
                id: 'da_seed_img_02',
                creatorId: DEMO_CREATOR,
                creatorName: 'Luna 🌙',
                title: '富士山日出 · 4K 数字写真包',
                description: '五合目日出组图高清原片，购买后即时下载。',
                coverUrl: MONKEY_COVERS[1],
                assetType: 'image',
                contentFiles: [MONKEY_COVERS[1], MONKEY_COVERS[2]],
                priceUsdt: 4.5,
                supplyMode: 'unlimited',
                supplyTotal: 0,
                soldCount: 86,
                status: 'listed',
                publishedAt: '2026-07-15 08:30',
                rejectReason: '',
                createdAt: '2026-07-14 18:00',
                updatedAt: '2026-07-15 08:30'
            },
            {
                id: 'da_seed_mem_03',
                creatorId: DEMO_CREATOR,
                creatorName: 'Luna 🌙',
                title: '创作者周会 · 数字会员月卡',
                description: '30 日数字会员权益：周会回放、素材库、优先问答。',
                coverUrl: MONKEY_COVERS[2],
                assetType: 'membership',
                contentFiles: ['membership://pass'],
                priceUsdt: 19.9,
                supplyMode: 'limited',
                supplyTotal: 50,
                soldCount: 50,
                status: 'sold_out',
                publishedAt: '2026-07-01 10:00',
                rejectReason: '',
                createdAt: '2026-06-28 11:00',
                updatedAt: '2026-07-22 16:00'
            },
            {
                id: 'da_seed_pending_04',
                creatorId: DEMO_CREATOR,
                creatorName: 'Luna 🌙',
                title: '幕后花絮 · 独家短片',
                description: '待审核的独家视频资产（演示）。',
                coverUrl: MONKEY_COVERS[3],
                assetType: 'video',
                contentFiles: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'],
                priceUsdt: 6,
                supplyMode: 'limited',
                supplyTotal: 200,
                soldCount: 0,
                status: 'pending_review',
                publishedAt: '',
                rejectReason: '',
                createdAt: '2026-07-28 21:00',
                updatedAt: '2026-07-28 21:00'
            }
        ];
    }

    function readAll() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.products) && parsed.version === 5) return parsed;
            }
            try { localStorage.removeItem('fl_digital_assets_v1'); } catch (e1) { /* ignore */ }
            try { localStorage.removeItem('fl_digital_assets_v2'); } catch (e2) { /* ignore */ }
            try { localStorage.removeItem('fl_digital_assets_v3'); } catch (e3) { /* ignore */ }
            try { localStorage.removeItem('fl_digital_assets_v4'); } catch (e4) { /* ignore */ }
        } catch (e) { /* ignore */ }
        var seed = { products: seedProducts(), version: 5 };
        writeAll(seed);
        return seed;
    }

    function writeAll(data) {
        try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    }

    function list(filter) {
        var products = readAll().products.slice();
        filter = filter || {};
        if (filter.creatorId) {
            products = products.filter(function (p) { return p.creatorId === filter.creatorId; });
        }
        if (filter.status) {
            products = products.filter(function (p) { return p.status === filter.status; });
        }
        if (filter.statuses && filter.statuses.length) {
            products = products.filter(function (p) { return filter.statuses.indexOf(p.status) >= 0; });
        }
        if (filter.listedOnly) {
            products = products.filter(function (p) {
                return p.status === 'listed' || p.status === 'sold_out';
            });
        }
        if (filter.inShowcase !== false && !filter.includeRemoved) {
            products = products.filter(function (p) { return p.removedFromShowcase !== true; });
        }
        products.sort(function (a, b) {
            if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
            return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '');
        });
        return products;
    }

    function getById(id) {
        var products = readAll().products;
        for (var i = 0; i < products.length; i++) {
            if (products[i].id === id) return products[i];
        }
        return null;
    }

    function remaining(p) {
        if (!p || p.supplyMode !== 'limited') return null;
        return Math.max(0, (p.supplyTotal || 0) - (p.soldCount || 0));
    }

    function upsert(product) {
        var data = readAll();
        var idx = -1;
        for (var i = 0; i < data.products.length; i++) {
            if (data.products[i].id === product.id) { idx = i; break; }
        }
        product.updatedAt = nowIso();
        if (idx >= 0) data.products[idx] = product;
        else data.products.unshift(product);
        writeAll(data);
        return product;
    }

    function create(partial) {
        var p = Object.assign({
            id: uid('da'),
            creatorId: DEMO_CREATOR,
            creatorName: 'Luna 🌙',
            title: '',
            description: '',
            coverUrl: '',
            assetType: 'other',
            contentFiles: [],
            priceUsdt: 0,
            supplyMode: 'limited',
            supplyTotal: 100,
            soldCount: 0,
            status: 'draft',
            publishedAt: '',
            rejectReason: '',
            createdAt: nowIso()
        }, partial || {});
        return upsert(p);
    }

    function submitForReview(id) {
        var p = getById(id);
        if (!p) return null;
        p.status = 'pending_review';
        p.rejectReason = '';
        return upsert(p);
    }

    function approve(id) {
        var p = getById(id);
        if (!p) return null;
        p.status = 'listed';
        p.rejectReason = '';
        if (!p.publishedAt) p.publishedAt = nowIso();
        return upsert(p);
    }

    function reject(id, reason) {
        var p = getById(id);
        if (!p) return null;
        p.status = 'rejected';
        p.rejectReason = reason || '不符合平台数字资产规范';
        return upsert(p);
    }

    function delist(id) {
        var p = getById(id);
        if (!p) return null;
        p.status = 'delisted';
        return upsert(p);
    }

    function relist(id) {
        var p = getById(id);
        if (!p) return null;
        if (p.removedFromShowcase) return null;
        if (p.supplyMode === 'limited' && remaining(p) === 0) {
            p.status = 'sold_out';
        } else {
            p.status = 'listed';
            if (!p.publishedAt) p.publishedAt = nowIso();
        }
        return upsert(p);
    }

    /** 仅已下架商品可从橱窗移除（软移除，不再展示） */
    function removeFromShowcase(id) {
        var p = getById(id);
        if (!p) return { ok: false, error: '商品不存在' };
        if (p.status !== 'delisted') return { ok: false, error: '请先下架后再移除橱窗' };
        p.removedFromShowcase = true;
        p.pinned = false;
        upsert(p);
        return { ok: true };
    }

    /** 数字商品同橱窗仅允许 1 个置顶 */
    function togglePin(id) {
        var p = getById(id);
        if (!p) return { ok: false, error: '商品不存在' };
        var data = readAll();
        var next = !p.pinned;
        data.products.forEach(function (it) {
            if (it.creatorId !== p.creatorId) return;
            if (it.id === id) it.pinned = next;
            else if (next) it.pinned = false;
        });
        writeAll(data);
        return { ok: true, pinned: next };
    }

    function updateProduct(id, fields) {
        var p = getById(id);
        if (!p) return null;
        fields = fields || {};
        ['title', 'description', 'coverUrl', 'priceUsdt', 'assetType'].forEach(function (k) {
            if (fields[k] !== undefined) p[k] = fields[k];
        });
        return upsert(p);
    }

    function incrementSold(id, qty) {
        qty = qty || 1;
        var p = getById(id);
        if (!p) return null;
        p.soldCount = (p.soldCount || 0) + qty;
        if (p.supplyMode === 'limited' && p.soldCount >= p.supplyTotal) {
            p.status = 'sold_out';
        }
        return upsert(p);
    }

    function typeLabel(typeId) {
        var t = ASSET_TYPES.filter(function (x) { return x.id === typeId; })[0];
        return t ? t.label : typeId;
    }

    function statusLabel(s) {
        var map = {
            draft: '草稿',
            pending_review: '待审核',
            rejected: '已驳回',
            listed: '已上架',
            sold_out: '已售罄',
            delisted: '已下架'
        };
        return map[s] || s;
    }

    global.DigitalAssetsStore = {
        ASSET_TYPES: ASSET_TYPES,
        list: list,
        getById: getById,
        remaining: remaining,
        create: create,
        upsert: upsert,
        submitForReview: submitForReview,
        approve: approve,
        reject: reject,
        delist: delist,
        relist: relist,
        removeFromShowcase: removeFromShowcase,
        togglePin: togglePin,
        updateProduct: updateProduct,
        incrementSold: incrementSold,
        typeLabel: typeLabel,
        statusLabel: statusLabel,
        DEMO_CREATOR: DEMO_CREATOR
    };
})(typeof window !== 'undefined' ? window : this);
