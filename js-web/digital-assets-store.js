/**
 * 数字商品库 · 图片合集 / 视频作品（localStorage Mock）
 * API: GET/POST /api/v1/digital-products · admin review endpoints
 */
(function (global) {
    var LS_KEY = 'fl_digital_assets_v7';
    var LEGACY_KEYS = [
        'fl_digital_assets_v6',
        'fl_digital_assets_v5',
        'fl_digital_assets_v4',
        'fl_digital_assets_v3',
        'fl_digital_assets_v2',
        'fl_digital_assets_v1'
    ];
    var DEMO_CREATOR = 'demo_uid_882910';

    var ASSET_TYPES = [
        { id: 'image', label: '图片合集' },
        { id: 'video', label: '视频作品' },
        { id: 'bundle', label: '图视作品包' }
    ];

    var ALLOWED_TYPES = { image: true, video: true, bundle: true };

    var COVERS = [
        'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
        'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80',
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80'
    ];

    function nowIso() {
        return new Date().toISOString().slice(0, 16).replace('T', ' ');
    }

    function uid(prefix) {
        return (prefix || 'da') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function isVideoUrl(url) {
        var u = String(url || '');
        return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u) ||
            /gtv-videos-bucket|\/video\//i.test(u);
    }

    function mediaItems(p) {
        return ((p && p.contentFiles) || []).map(function (f) {
            if (f && typeof f === 'object') {
                return { kind: f.kind === 'video' ? 'video' : 'image', url: String(f.url || '') };
            }
            var url = String(f || '');
            return { kind: isVideoUrl(url) ? 'video' : 'image', url: url };
        }).filter(function (x) { return x.url; });
    }

    function mediaCounts(p) {
        var items = mediaItems(p);
        var images = 0;
        var videos = 0;
        items.forEach(function (it) {
            if (it.kind === 'video') videos += 1;
            else images += 1;
        });
        return { images: images, videos: videos, total: items.length };
    }

    function mediaSummary(p) {
        var c = mediaCounts(p);
        var parts = [];
        if (c.images) parts.push(c.images + ' 张图');
        if (c.videos) parts.push(c.videos + ' 个视频');
        return parts.join(' · ') || '无素材';
    }

    function mapLegacyType(typeId) {
        if (typeId === 'video') return 'video';
        if (typeId === 'bundle') return 'bundle';
        if (typeId === 'image') return 'image';
        if (typeId === 'nft') return 'image';
        return 'image';
    }

    function normalizeProduct(p) {
        if (!p || typeof p !== 'object') return p;
        p.assetType = ALLOWED_TYPES[p.assetType] ? p.assetType : mapLegacyType(p.assetType);
        if (p.nftTraits) delete p.nftTraits;
        if (p.chainNetwork) delete p.chainNetwork;
        if (!Array.isArray(p.contentFiles)) p.contentFiles = [];
        p.autoList = p.autoList !== false;
        p.forceDelisted = !!p.forceDelisted;
        return p;
    }

    function seedProducts() {
        return [
            {
                id: 'da_seed_img_01',
                creatorId: DEMO_CREATOR,
                creatorName: 'Luna 🌙',
                title: '富士山日出 · 4K 写真合集',
                description: '五合目日出组图高清原片共 8 张，购买后可浏览与下载全套。',
                coverUrl: COVERS[0],
                assetType: 'image',
                contentFiles: [
                    COVERS[0],
                    COVERS[1],
                    'https://images.unsplash.com/photo-1490806843957-31f4c9a91c8e?w=800&q=80',
                    'https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&q=80'
                ],
                priceUsdt: 4.5,
                supplyMode: 'unlimited',
                supplyTotal: 0,
                soldCount: 86,
                status: 'listed',
                pinned: true,
                publishedAt: '2026-07-15 08:30',
                rejectReason: '',
                createdAt: '2026-07-14 18:00',
                updatedAt: '2026-07-15 08:30'
            },
            {
                id: 'da_seed_vid_02',
                creatorId: DEMO_CREATOR,
                creatorName: 'Luna 🌙',
                title: '城市夜色 · 延时短片',
                description: '约 3 分钟 4K 延时成片，购买后可在线播放与下载原片。',
                coverUrl: COVERS[2],
                assetType: 'video',
                contentFiles: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'],
                priceUsdt: 6,
                supplyMode: 'limited',
                supplyTotal: 200,
                soldCount: 42,
                status: 'listed',
                publishedAt: '2026-07-20 12:00',
                rejectReason: '',
                createdAt: '2026-07-18 09:00',
                updatedAt: '2026-07-20 12:00'
            },
            {
                id: 'da_seed_img_03',
                creatorId: DEMO_CREATOR,
                creatorName: 'Luna 🌙',
                title: '街头人像 · 黑白胶片风合集',
                description: '街拍人像 12 张，含调色预设说明。限量售卖。',
                coverUrl: COVERS[1],
                assetType: 'image',
                contentFiles: [
                    COVERS[1],
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'
                ],
                priceUsdt: 8,
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
                title: '幕后花絮 · 拍摄纪实短片',
                description: '待审核的视频作品（演示）。',
                coverUrl: COVERS[3],
                assetType: 'video',
                contentFiles: [
                    { kind: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
                    { kind: 'image', url: COVERS[3] }
                ],
                priceUsdt: 5,
                supplyMode: 'limited',
                supplyTotal: 100,
                soldCount: 0,
                status: 'pending_review',
                autoList: false,
                publishedAt: '',
                rejectReason: '',
                createdAt: '2026-08-10 21:00',
                updatedAt: '2026-08-10 21:00'
            },
            {
                id: 'da_seed_rejected_05',
                creatorId: DEMO_CREATOR,
                creatorName: 'Luna 🌙',
                title: '旅拍随手拍 · 未命名合集',
                description: '演示驳回态：创作者可见驳回原因并可修改后重新提交。',
                coverUrl: COVERS[0],
                assetType: 'image',
                contentFiles: [COVERS[0]],
                priceUsdt: 3,
                supplyMode: 'unlimited',
                supplyTotal: 0,
                soldCount: 0,
                status: 'rejected',
                publishedAt: '',
                rejectReason: '封面与合集内容关联性不足，请补充清晰作品说明并完善图片清单后重新提交。',
                createdAt: '2026-08-08 15:20',
                updatedAt: '2026-08-09 11:05'
            },
            {
                id: 'da_seed_bundle_06',
                creatorId: DEMO_CREATOR,
                creatorName: 'Luna 🌙',
                title: '旅拍花絮 · 图视作品包',
                description: '写真 4 张 + 幕后短片，购买后可浏览图片并播放视频。',
                coverUrl: COVERS[4],
                assetType: 'bundle',
                contentFiles: [
                    { kind: 'image', url: COVERS[4] },
                    { kind: 'image', url: COVERS[0] },
                    { kind: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' }
                ],
                priceUsdt: 9.9,
                supplyMode: 'limited',
                supplyTotal: 80,
                soldCount: 12,
                status: 'listed',
                autoList: true,
                publishedAt: '2026-08-12 10:00',
                rejectReason: '',
                createdAt: '2026-08-11 16:00',
                updatedAt: '2026-08-12 10:00'
            }
        ];
    }

    function migrateProducts(list) {
        return (list || []).map(function (p) {
            return normalizeProduct(Object.assign({}, p));
        }).filter(function (p) {
            return ALLOWED_TYPES[p.assetType];
        });
    }

    function readAll() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.products) && parsed.version === 7) {
                    parsed.products = migrateProducts(parsed.products);
                    var ids = {};
                    parsed.products.forEach(function (p) { ids[p.id] = true; });
                    seedProducts().forEach(function (s) {
                        if (!ids[s.id]) parsed.products.push(s);
                    });
                    return parsed;
                }
            }
            for (var i = 0; i < LEGACY_KEYS.length; i++) {
                try {
                    var legacy = localStorage.getItem(LEGACY_KEYS[i]);
                    if (!legacy) continue;
                    var old = JSON.parse(legacy);
                    if (old && Array.isArray(old.products)) {
                        var migrated = {
                            products: migrateProducts(old.products),
                            version: 7
                        };
                        // 若迁移后为空，用新种子
                        if (!migrated.products.length) migrated.products = seedProducts();
                        writeAll(migrated);
                        try { localStorage.removeItem(LEGACY_KEYS[i]); } catch (eRm) { /* ignore */ }
                        return migrated;
                    }
                } catch (eOne) { /* ignore */ }
            }
            LEGACY_KEYS.forEach(function (k) {
                try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
            });
        } catch (e) { /* ignore */ }
        var seed = { products: seedProducts(), version: 7 };
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
        if (filter.assetType) {
            products = products.filter(function (p) { return p.assetType === filter.assetType; });
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
        product = normalizeProduct(product);
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
            assetType: 'image',
            contentFiles: [],
            priceUsdt: 0,
            supplyMode: 'limited',
            supplyTotal: 100,
            soldCount: 0,
            autoList: true,
            forceDelisted: false,
            status: 'draft',
            publishedAt: '',
            rejectReason: '',
            createdAt: nowIso()
        }, partial || {});
        if (!ALLOWED_TYPES[p.assetType]) p.assetType = 'image';
        delete p.nftTraits;
        delete p.chainNetwork;
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
        p.rejectReason = '';
        p.reviewedAt = nowIso();
        // 创作者选择「通过后暂不上架」时，审核通过即进入已下架，由创作者手动上架
        if (p.autoList === false) {
            p.status = 'delisted';
            return upsert(p);
        }
        p.status = (p.supplyMode === 'limited' && remaining(p) === 0) ? 'sold_out' : 'listed';
        if (!p.publishedAt) p.publishedAt = nowIso();
        return upsert(p);
    }

    function reject(id, reason) {
        var p = getById(id);
        if (!p) return null;
        p.status = 'rejected';
        p.rejectReason = reason || '不符合平台数字商品规范（请检查版权与素材质量）';
        return upsert(p);
    }

    function delist(id, opts) {
        var p = getById(id);
        if (!p) return null;
        opts = opts || {};
        p.status = 'delisted';
        p.forceDelisted = !!opts.force;
        return upsert(p);
    }

    function relist(id, opts) {
        var p = getById(id);
        if (!p) return null;
        opts = opts || {};
        if (p.removedFromShowcase) return null;
        if (p.forceDelisted && !opts.adminForce) return null;
        if (opts.adminForce) p.forceDelisted = false;
        if (p.supplyMode === 'limited' && remaining(p) === 0) {
            p.status = 'sold_out';
        } else {
            p.status = 'listed';
            if (!p.publishedAt) p.publishedAt = nowIso();
        }
        return upsert(p);
    }

    function creatorRelistBlocked(p) {
        if (p && p.forceDelisted) return '运营已强制下架，核实完成前不可自行上架';
        return '';
    }

    function shelfStatus(p) {
        if (!p) return '';
        if (p.status === 'delisted') return 'delisted';
        if (p.status === 'listed' || p.status === 'sold_out') return 'listed';
        return p.status;
    }

    function shelfLabel(p) {
        if (!p) return '';
        if (p.status === 'delisted') return p.forceDelisted ? '已下架（强制）' : '已下架';
        if (p.status === 'listed' || p.status === 'sold_out') return '已上架';
        return statusLabel(p.status);
    }

    function removeFromShowcase(id) {
        var p = getById(id);
        if (!p) return { ok: false, error: '商品不存在' };
        if (p.status !== 'delisted') return { ok: false, error: '请先下架后再移除橱窗' };
        p.removedFromShowcase = true;
        p.pinned = false;
        upsert(p);
        return { ok: true };
    }

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
        ['title', 'description', 'coverUrl', 'priceUsdt', 'assetType', 'contentFiles', 'supplyMode', 'supplyTotal', 'autoList'].forEach(function (k) {
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

    /** 商品数量文案：限量份数 / 无限 */
    function supplyLabel(p) {
        if (!p) return '';
        if (p.supplyMode !== 'limited') return '不限个数 · 已售 ' + (p.soldCount || 0);
        return (p.supplyTotal || 0) + ' 份 · 已售 ' + (p.soldCount || 0) + ' · 剩余 ' + remaining(p);
    }

    /** 创作者设置的上架意向 */
    function listIntentLabel(p) {
        return (p && p.autoList === false) ? '通过后下架' : '通过后上架';
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
        supplyLabel: supplyLabel,
        listIntentLabel: listIntentLabel,
        mediaItems: mediaItems,
        mediaCounts: mediaCounts,
        mediaSummary: mediaSummary,
        isVideoUrl: isVideoUrl,
        creatorRelistBlocked: creatorRelistBlocked,
        shelfStatus: shelfStatus,
        shelfLabel: shelfLabel,
        DEMO_CREATOR: DEMO_CREATOR
    };
})(typeof window !== 'undefined' ? window : this);
