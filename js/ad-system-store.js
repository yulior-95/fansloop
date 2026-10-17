/**
 * 广告系统 · 三端统一模拟数据与状态（localStorage）
 * 原型演示用，非真实投放/支付结果。
 */
(function (global) {
    var STORAGE_KEY = 'fl_ad_system_v2';
    var LEGACY_KEY = 'fl_ad_system_v1';
    var DEMO_UID = 'U102938';

    var AUDIT_STATUS = {
        draft: '草稿',
        pending_review: '待审核',
        rejected: '审核驳回',
        approved: '审核通过',
        revoked: '审核撤销'
    };

    var PAY_STATUS = {
        unpaid: '待支付',
        processing: '支付处理中',
        paid: '支付成功',
        failed: '支付失败',
        refund_processing: '退款处理中',
        partial_refunded: '部分退款',
        refunded: '已退款',
        refund_failed: '退款失败',
        none: '无需支付'
    };

    var DELIVERY_STATUS = {
        pending_start: '待开始',
        delivering: '投放中',
        paused: '已暂停',
        ended: '已结束',
        removed: '已下架',
        pending: '待开始',
        active: '投放中'
    };

    var ADVERTISER_STATUS = {
        pending: '待审核',
        approved: '已通过',
        rejected: '已驳回',
        restricted: '受限',
        disabled: '禁用'
    };

    var SOURCE = { user: '用户自主投放', platform: '平台运营投放' };

    var SLOTS = [
        { code: 'feed_video', name: '短视频信息流', page: '首页 / 订阅 Feed', types: ['品牌曝光', '应用推广'], spec: '9:16 视频或 1:1 图片', interval: '每 5 条内容 1 条', cap: '单用户每日最多 3 次', fallback: '无广告时跳过', enabled: true, userAllowed: true },
        { code: 'home_banner', name: '首页 Banner', page: '首页顶部', types: ['品牌曝光', '活动推广'], spec: '16:9 静态图 ≤ 500KB', interval: '轮播 5s', cap: '—', fallback: '隐藏 Banner 位', enabled: true, userAllowed: true },
        { code: 'live_room', name: '直播间推广', page: '直播间', types: ['品牌曝光', '直播引流'], spec: '小卡 4:3 或横条 Banner', interval: '每 15 分钟可展示 1 次', cap: '单场次最多 4 次', fallback: '不展示', enabled: true, userAllowed: false }
    ];

    function nowIso() { return new Date().toISOString(); }

    var DEMO_CATALOG_VERSION = 3;

    function syntheticAdvertisers() {
        return [
            { uid: 'U220011', accountStatus: 'approved', applyAt: '2026-01-12T08:00:00+08:00', companyName: 'Nova Digital Pte Ltd', contact: 'ops@nova.sg', rejectReason: '', violationCount: 0, totalRecharge: 12000, totalSpend: 8420.5 },
            { uid: 'U330022', accountStatus: 'approved', applyAt: '2026-02-03T11:20:00+08:00', companyName: '星链互动科技', contact: 'bd@starlink.cn', rejectReason: '', violationCount: 1, totalRecharge: 8000, totalSpend: 5100 },
            { uid: 'U440033', accountStatus: 'restricted', applyAt: '2026-02-20T09:00:00+08:00', companyName: 'QuickPromo LLC', contact: 'legal@quickpromo.com', rejectReason: '', violationCount: 3, totalRecharge: 2000, totalSpend: 1980 },
            { uid: 'U550044', accountStatus: 'pending', applyAt: '2026-03-16T15:30:00+08:00', companyName: '蓝海传媒', contact: '13800138000', rejectReason: '', violationCount: 0 },
            { uid: 'U660055', accountStatus: 'pending', applyAt: '2026-03-17T10:05:00+08:00', companyName: 'Tokyo Live Lab', contact: 'hello@tokyolive.jp', rejectReason: '', violationCount: 0 },
            { uid: 'U770066', accountStatus: 'rejected', applyAt: '2026-03-05T14:00:00+08:00', companyName: '未命名工作室', contact: 'spam@test.local', rejectReason: '主体资质材料不完整', violationCount: 0 },
            { uid: 'U880077', accountStatus: 'approved', applyAt: '2025-12-01T10:00:00+08:00', companyName: 'Global Wallet Ads', contact: 'finance@gwa.io', rejectReason: '', violationCount: 0, totalRecharge: 25000, totalSpend: 22100 }
        ];
    }

    function syntheticAds() {
        var types = ['品牌曝光', '活动推广', '直播引流', '应用推广'];
        var slots = ['feed_video', 'home_banner', 'live_room'];
        var audits = ['approved', 'approved', 'pending_review', 'pending_review', 'pending_review', 'draft', 'rejected', 'approved'];
        var list = [];
        var titles = ['Web3 创作者峰会', '链上音乐节', 'VIP 订阅季', 'GameFi 新手礼包', '跨境直播带货', 'DEX 手续费返现', 'KOL 联合专场', '数字藏品发售'];
        for (var i = 0; i < 24; i++) {
            var n = 100 + i;
            var audit = audits[i % audits.length];
            var slot = slots[i % slots.length];
            var source = i % 5 === 0 ? 'platform' : 'user';
            var uid = source === 'platform' ? 'PLATFORM' : (i % 3 === 0 ? 'U220011' : i % 3 === 1 ? 'U330022' : DEMO_UID);
            var pay = source === 'platform' ? 'none' : (audit === 'draft' ? 'unpaid' : audit === 'pending_review' ? 'paid' : 'paid');
            var del = 'pending_start';
            if (audit === 'approved') {
                del = ['delivering', 'delivering', 'paused', 'ended', 'pending_start', 'removed'][i % 6];
            }
            list.push({
                id: 'AD202603' + n,
                name: titles[i % titles.length] + ' · 批次 ' + (i + 1),
                source: source,
                advertiserUid: uid,
                type: types[i % types.length],
                slotCode: slot,
                title: titles[i % titles.length],
                copy: '限时活动，点击查看详情与落地页规则说明（演示文案 #' + n + '）',
                materialUrl: 'https://picsum.photos/seed/ad-syn-' + n + '/720/1280',
                materialType: 'image',
                landingType: 'external',
                landingUrl: 'https://goodfans.io/campaign/' + n,
                startAt: '2026-03-01T00:00:00+08:00',
                endAt: '2026-04-30T23:59:00+08:00',
                audience: { regions: ['全部'], langs: ['zh-CN'], minAge: 18 },
                budgetTotal: 100 + i * 20,
                budgetDaily: 20 + (i % 5) * 10,
                billing: 'cpm',
                payStatus: pay,
                auditStatus: audit,
                deliveryStatus: del,
                contentVersion: 1,
                versions: [],
                rejectReason: audit === 'rejected' ? '素材文案夸大宣传，请修改后重提' : '',
                priority: (i % 9) + 1,
                stats: {
                    impressions: 1200 * (i + 1),
                    clicks: 35 * (i + 1),
                    spend: Math.round((i + 1) * 12.5 * 10) / 10,
                    conversions: Math.floor(i * 1.7)
                },
                createdAt: '2026-03-' + String(10 + (i % 18)).padStart(2, '0') + 'T' + String(8 + (i % 10)).padStart(2, '0') + ':00:00+08:00',
                auditLog: []
            });
        }
        return list;
    }

    function syntheticFinance() {
        var rows = [];
        var types = ['recharge', 'pay', 'spend', 'refund', 'freeze'];
        for (var i = 0; i < 18; i++) {
            rows.push({
                id: 'FIN-D' + String(200 + i),
                uid: i % 2 ? DEMO_UID : 'U220011',
                type: types[i % types.length],
                amount: Math.round((50 + i * 37.5) * 10) / 10,
                status: i % 7 === 0 ? 'processing' : 'success',
                at: '2026-03-' + String(1 + (i % 28)).padStart(2, '0') + 'T' + String(9 + (i % 8)).padStart(2, '0') + ':15:00+08:00',
                orderNo: 'AD-FIN-' + (202603000 + i)
            });
        }
        return rows;
    }

    function syntheticRisk() {
        return [
            { id: 'RK-101', type: 'domain_block', adId: 'AD202603110', uid: 'U330022', reason: '落地页命中黑名单域名 malware.demo', at: '2026-03-17T06:22:00+08:00', status: 'open' },
            { id: 'RK-102', type: 'report', adId: 'AD202603112', uid: 'U883311', reason: '用户举报素材低俗', at: '2026-03-16T21:10:00+08:00', status: 'open' },
            { id: 'RK-103', type: 'abnormal_click', adId: 'AD202603115', detail: '5 分钟内点击率 > 18%', at: '2026-03-16T03:40:00+08:00', status: 'reviewed' },
            { id: 'RK-104', type: 'freq_cap', adId: 'AD202603118', detail: '单用户日 cap 触发 126 次', at: '2026-03-15T18:00:00+08:00', status: 'reviewed' },
            { id: 'RK-105', type: 'report', adId: 'AD202603120', uid: 'U102001', reason: '虚假宣传收益', at: '2026-03-14T12:33:00+08:00', status: 'open' },
            { id: 'RK-106', type: 'manual', adId: 'AD202603122', reason: '运营人工标记复核', at: '2026-03-13T09:00:00+08:00', status: 'closed' },
            { id: 'RK-107', type: 'abnormal_click', adId: 'AD202603125', detail: '同 IP 段集中点击', at: '2026-03-12T01:12:00+08:00', status: 'open' },
            { id: 'RK-108', type: 'domain_block', adId: 'AD202603128', reason: 'javascript: 协议拦截', at: '2026-03-11T16:45:00+08:00', status: 'reviewed' }
        ];
    }

    function mergeDemoRichness(data) {
        if (!data) return data;
        var need = (data.demoCatalogVersion || 0) < DEMO_CATALOG_VERSION || (data.ads || []).length < 25;
        if (!need) return data;
        var tpl = seed();
        var adIds = {};
        (data.ads || []).forEach(function (a) { adIds[a.id] = 1; });
        tpl.ads.forEach(function (a) {
            if (!adIds[a.id]) {
                data.ads.push(normalizeAd(JSON.parse(JSON.stringify(a))));
                adIds[a.id] = 1;
            }
        });
        var uids = {};
        (data.advertisers || []).forEach(function (a) { uids[a.uid] = 1; });
        tpl.advertisers.forEach(function (a) {
            if (!uids[a.uid]) { data.advertisers.push(JSON.parse(JSON.stringify(a))); uids[a.uid] = 1; }
        });
        var finIds = {};
        (data.finance || []).forEach(function (f) { finIds[f.id] = 1; });
        tpl.finance.forEach(function (f) {
            if (!finIds[f.id]) { data.finance.push(JSON.parse(JSON.stringify(f))); finIds[f.id] = 1; }
        });
        var rkIds = {};
        (data.risk || []).forEach(function (r) { rkIds[r.id] = 1; });
        tpl.risk.forEach(function (r) {
            if (!rkIds[r.id]) { data.risk.push(JSON.parse(JSON.stringify(r))); rkIds[r.id] = 1; }
        });
        var pkgIds = {};
        (data.packages || []).forEach(function (p) { pkgIds[p.id] = 1; });
        tpl.packages.forEach(function (p) {
            if (!pkgIds[p.id]) { data.packages.push(JSON.parse(JSON.stringify(p))); pkgIds[p.id] = 1; }
        });
        data.demoCatalogVersion = DEMO_CATALOG_VERSION;
        save(data);
        return data;
    }

    function seed() {
        var packages = [
            { id: 'PKG-FEED-7', slotCode: 'feed_video', name: '信息流 · 7 天', durationDays: 7, priceUsdt: 199, enabled: true, version: 1 },
            { id: 'PKG-FEED-30', slotCode: 'feed_video', name: '信息流 · 30 天', durationDays: 30, priceUsdt: 699, enabled: true, version: 1 },
            { id: 'PKG-BANNER-7', slotCode: 'home_banner', name: '首页 Banner · 7 天', durationDays: 7, priceUsdt: 399, enabled: true, version: 1 },
            { id: 'PKG-LIVE-7', slotCode: 'live_room', name: '直播间推广 · 7 天', durationDays: 7, priceUsdt: 499, enabled: true, version: 1 },
            { id: 'PKG-BANNER-30', slotCode: 'home_banner', name: '首页 Banner · 30 天', durationDays: 30, priceUsdt: 1299, enabled: true, version: 1 },
            { id: 'PKG-LIVE-30', slotCode: 'live_room', name: '直播间推广 · 30 天', durationDays: 30, priceUsdt: 1599, enabled: false, version: 1 },
            { id: 'PKG-FEED-14', slotCode: 'feed_video', name: '信息流 · 14 天', durationDays: 14, priceUsdt: 349, enabled: true, version: 1 }
        ];
        return {
            version: 2,
            demoUid: DEMO_UID,
            account: {
                uid: DEMO_UID,
                balance: 1280.5,
                frozen: 0,
                spent: 897.6,
                refunded: 120,
                totalRecharge: 5000
            },
            advertisers: [
                { uid: DEMO_UID, accountStatus: 'approved', applyAt: '2026-02-01T10:00:00+08:00', companyName: 'Luna Studio', contact: 'luna@demo.com', rejectReason: '', violationCount: 0, totalRecharge: 5000, totalSpend: 3399.5 },
                { uid: 'U778899', accountStatus: 'pending', applyAt: '2026-03-17T09:00:00+08:00', companyName: 'Test Co', contact: 'a@test.com', rejectReason: '', violationCount: 0 }
            ].concat(syntheticAdvertisers()),
            packages: packages,
            orders: [
                { id: 'ORD20260315001', adId: 'AD20260315002', uid: DEMO_UID, packageId: 'PKG-FEED-7', packageName: '信息流 · 7 天', slotCode: 'feed_video', priceSnapshot: 199, durationDays: 7, payStatus: 'paid', paidAmount: 199, refundedAmount: 0, refundableAmount: 199, paidAt: '2026-03-17T14:30:00+08:00' },
                { id: 'ORD20260225001', adId: 'AD20260228004', uid: DEMO_UID, packageId: 'PKG-FEED-30', packageName: '信息流 · 30 天', slotCode: 'feed_video', priceSnapshot: 699, durationDays: 30, payStatus: 'paid', paidAmount: 699, refundedAmount: 0, refundableAmount: 0, paidAt: '2026-02-25T12:00:00+08:00' }
            ],
            slots: SLOTS.slice(),
            ads: [
                {
                    id: 'AD20260318001',
                    name: 'Creator Pro 春季推广',
                    source: 'platform',
                    advertiserUid: 'PLATFORM',
                    type: '品牌曝光',
                    slotCode: 'home_banner',
                    title: '升级 Creator Pro',
                    copy: '解锁高级数据与优先推流，限时 8 折',
                    materialUrl: 'https://picsum.photos/seed/ad-banner-pro/1200/675',
                    materialType: 'image',
                    landingType: 'activity',
                    landingUrl: 'pages-web/settings-subscription.html',
                    startAt: '2026-03-18T00:00:00+08:00',
                    endAt: '2026-04-18T23:59:00+08:00',
                    audience: { regions: ['全部'], langs: ['zh-CN'], minAge: 18 },
                    budgetTotal: 0,
                    budgetDaily: 0,
                    billing: 'fixed',
                    payStatus: 'none',
                    auditStatus: 'approved',
                    deliveryStatus: 'delivering',
                    contentVersion: 1,
                    versions: [],
                    rejectReason: '',
                    priority: 10,
                    stats: { impressions: 48200, clicks: 1928, spend: 0, conversions: 86 },
                    createdAt: '2026-03-10T10:00:00+08:00',
                    auditLog: [{ at: '2026-03-10T11:00:00+08:00', by: '运营·Mia', action: '审核通过', note: '平台自营' }]
                },
                {
                    id: 'AD20260315002',
                    name: '爵士直播引流',
                    source: 'user',
                    advertiserUid: DEMO_UID,
                    type: '直播引流',
                    slotCode: 'feed_video',
                    title: '今晚即兴爵士直播',
                    copy: '点击预约提醒，进房领 USDT 红包',
                    materialUrl: 'https://picsum.photos/seed/ad-jazz-feed/720/1280',
                    materialType: 'image',
                    landingType: 'live',
                    landingUrl: 'live-detail.html',
                    startAt: '2026-03-20T21:00:00+08:00',
                    endAt: '2026-03-27T23:59:00+08:00',
                    audience: { regions: ['日本', '新加坡'], langs: ['zh-CN', 'en'], minAge: 18 },
                    budgetTotal: 500,
                    budgetDaily: 80,
                    billing: 'cpm',
                    payStatus: 'paid',
                    auditStatus: 'pending_review',
                    deliveryStatus: 'pending_start',
                    orderId: 'ORD20260315001',
                    packageId: 'PKG-FEED-7',
                    packageName: '信息流 · 7 天',
                    priceUsdt: 199,
                    contentVersion: 1,
                    versions: [],
                    rejectReason: '',
                    priority: 5,
                    stats: { impressions: 0, clicks: 0, spend: 0, conversions: 0 },
                    createdAt: '2026-03-17T14:22:00+08:00',
                    auditLog: []
                },
                {
                    id: 'AD20260312003',
                    name: '摄影课程按篇推广',
                    source: 'user',
                    advertiserUid: DEMO_UID,
                    type: '应用推广',
                    slotCode: 'feed_video',
                    title: '胶片人像课限时 5 折',
                    copy: '18 节实战课，支持 USDT 支付',
                    materialUrl: 'https://picsum.photos/seed/ad-photo-course/720/1280',
                    materialType: 'image',
                    landingType: 'profile',
                    landingUrl: 'creator-profile.html',
                    startAt: '2026-03-01T00:00:00+08:00',
                    endAt: '2026-03-31T23:59:00+08:00',
                    audience: { regions: ['全部'], langs: ['zh-CN'], minAge: 18 },
                    budgetTotal: 200,
                    budgetDaily: 30,
                    billing: 'cpc',
                    payStatus: 'paid',
                    auditStatus: 'rejected',
                    deliveryStatus: 'pending_start',
                    orderId: 'ORD20260312001',
                    packageId: 'PKG-FEED-7',
                    priceUsdt: 199,
                    contentVersion: 2,
                    versions: [{ version: 2, at: '2026-03-13T10:00:00+08:00', fields: ['materialUrl'], auditStatus: 'rejected' }],
                    rejectReason: '素材含未授权人像，请替换为自有版权图片后重新提交。',
                    priority: 3,
                    stats: { impressions: 0, clicks: 0, spend: 0, conversions: 0 },
                    createdAt: '2026-03-12T09:10:00+08:00',
                    auditLog: [{ at: '2026-03-13T16:40:00+08:00', by: '审核·Ken', action: '审核拒绝', note: '素材含未授权人像' }]
                },
                {
                    id: 'AD20260228004',
                    name: '钱包充值活动',
                    source: 'user',
                    advertiserUid: DEMO_UID,
                    type: '品牌曝光',
                    slotCode: 'feed_video',
                    title: '充值满 100 送 5 U',
                    copy: '活动详情见钱包页，数量有限',
                    materialUrl: 'https://picsum.photos/seed/ad-wallet/720/1280',
                    materialType: 'image',
                    landingType: 'wallet',
                    landingUrl: 'wallet.html',
                    startAt: '2026-02-28T00:00:00+08:00',
                    endAt: '2026-03-15T23:59:00+08:00',
                    audience: { regions: ['全部'], langs: ['zh-CN'], minAge: 18 },
                    budgetTotal: 300,
                    budgetDaily: 50,
                    billing: 'cpm',
                    payStatus: 'paid',
                    auditStatus: 'approved',
                    deliveryStatus: 'ended',
                    orderId: 'ORD20260225001',
                    packageId: 'PKG-FEED-30',
                    priceUsdt: 699,
                    contentVersion: 1,
                    versions: [],
                    rejectReason: '',
                    priority: 4,
                    stats: { impressions: 120400, clicks: 3612, spend: 298.6, conversions: 412 },
                    createdAt: '2026-02-25T11:00:00+08:00',
                    auditLog: [{ at: '2026-02-26T09:00:00+08:00', by: '审核·Ken', action: '审核通过', note: '' }]
                },
                {
                    id: 'AD20260301005',
                    name: '草稿 · 新品预告',
                    source: 'user',
                    advertiserUid: DEMO_UID,
                    type: '品牌曝光',
                    slotCode: 'feed_video',
                    title: '',
                    copy: '',
                    materialUrl: '',
                    materialType: 'image',
                    landingType: 'external',
                    landingUrl: '',
                    startAt: '',
                    endAt: '',
                    audience: { regions: ['全部'], langs: ['zh-CN'], minAge: 18 },
                    budgetTotal: 100,
                    budgetDaily: 20,
                    billing: 'cpm',
                    payStatus: 'unpaid',
                    auditStatus: 'draft',
                    deliveryStatus: 'pending_start',
                    contentVersion: 1,
                    versions: [],
                    rejectReason: '',
                    priority: 1,
                    stats: { impressions: 0, clicks: 0, spend: 0, conversions: 0 },
                    createdAt: '2026-03-01T08:00:00+08:00',
                    auditLog: []
                }
            ].concat(syntheticAds()),
            finance: [
                { id: 'FIN-R001', uid: DEMO_UID, type: 'recharge', amount: 2000, status: 'success', at: '2026-03-01T10:00:00+08:00', orderNo: 'RC20260301001' },
                { id: 'FIN-F001', uid: DEMO_UID, type: 'freeze', amount: 320, status: 'success', at: '2026-03-17T14:25:00+08:00', orderNo: 'AD20260315002' },
                { id: 'FIN-S001', uid: DEMO_UID, type: 'spend', amount: 298.6, status: 'success', at: '2026-03-15T23:59:00+08:00', orderNo: 'AD20260228004' }
            ].concat(syntheticFinance()),
            risk: [
                { id: 'RK-001', type: 'report', adId: 'AD20260318001', uid: 'U883311', reason: '频繁出现', at: '2026-03-18T08:12:00+08:00', status: 'open' },
                { id: 'RK-002', type: 'abnormal_click', adId: 'AD20260228004', detail: '短时点击率异常偏高', at: '2026-03-10T02:00:00+08:00', status: 'reviewed' }
            ].concat(syntheticRisk()),
            demoCatalogVersion: DEMO_CATALOG_VERSION,
            opLogs: []
        };
    }

    function normalizeAd(ad) {
        if (ad.deliveryStatus === 'active') ad.deliveryStatus = 'delivering';
        if (ad.deliveryStatus === 'pending') ad.deliveryStatus = 'pending_start';
        if (ad.auditStatus === 'rejected') ad.auditStatus = 'rejected';
        if (!ad.contentVersion) ad.contentVersion = 1;
        if (!ad.versions) ad.versions = [];
        return ad;
    }

    function load() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                try { localStorage.removeItem(LEGACY_KEY); } catch (e2) {}
                var s = seed();
                save(s);
                return s;
            }
            var data = JSON.parse(raw);
            if (!data.ads || !data.slots) return seed();
            if (!data.packages) data.packages = seed().packages;
            if (!data.advertisers) data.advertisers = seed().advertisers;
            if (!data.orders) data.orders = seed().orders;
            data.ads.forEach(normalizeAd);
            return mergeDemoRichness(data);
        } catch (e) {
            return seed();
        }
    }

    function save(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function resetDemo() {
        save(seed());
        return load();
    }

    function getAds(filter) {
        filter = filter || {};
        var list = load().ads.slice();
        if (filter.uid) list = list.filter(function (a) { return a.advertiserUid === filter.uid || filter.uid === 'ALL'; });
        if (filter.source) list = list.filter(function (a) { return a.source === filter.source; });
        if (filter.auditStatus) list = list.filter(function (a) { return a.auditStatus === filter.auditStatus; });
        if (filter.deliveryStatus) {
            list = list.filter(function (a) {
                return a.deliveryStatus === filter.deliveryStatus ||
                    (filter.deliveryStatus === 'delivering' && a.deliveryStatus === 'active') ||
                    (filter.deliveryStatus === 'pending_start' && a.deliveryStatus === 'pending');
            });
        }
        if (filter.payStatus) list = list.filter(function (a) { return a.payStatus === filter.payStatus; });
        if (filter.slotCode) list = list.filter(function (a) { return a.slotCode === filter.slotCode; });
        if (filter.q) {
            var q = filter.q.toLowerCase();
            list = list.filter(function (a) {
                return a.id.toLowerCase().indexOf(q) >= 0 || a.name.toLowerCase().indexOf(q) >= 0 || String(a.advertiserUid).toLowerCase().indexOf(q) >= 0;
            });
        }
        return list.sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
    }

    function getAd(id) {
        return load().ads.filter(function (a) { return a.id === id; })[0] || null;
    }

    function pushOpLog(entry) {
        var data = load();
        data.opLogs.unshift({
            id: 'LOG-' + Date.now(),
            at: nowIso(),
            by: entry.by || '运营·Alex',
            action: entry.action,
            target: entry.target,
            reason: entry.reason || ''
        });
        if (data.opLogs.length > 200) data.opLogs.length = 200;
        save(data);
    }

    function upsertAd(ad) {
        var data = load();
        var idx = data.ads.findIndex(function (a) { return a.id === ad.id; });
        if (idx >= 0) data.ads[idx] = ad;
        else data.ads.unshift(ad);
        save(data);
        return ad;
    }

    function nextAdId() {
        var n = load().ads.length + 1;
        return 'AD' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + String(100 + n).slice(-3);
    }

    function getDeliveringAds(slotCode) {
        return getAds().filter(function (a) {
            normalizeAd(a);
            if (a.auditStatus !== 'approved') return false;
            if (a.deliveryStatus !== 'delivering' && a.deliveryStatus !== 'active') return false;
            if (a.source === 'user' && a.payStatus !== 'paid' && a.payStatus !== 'none') return false;
            if (slotCode && a.slotCode !== slotCode) return false;
            return true;
        });
    }

    function accountSummary(uid) {
        uid = uid || DEMO_UID;
        var data = load();
        var ads = data.ads.filter(function (a) { return a.advertiserUid === uid; });
        return {
            balance: data.account.balance,
            frozen: data.account.frozen,
            pendingPay: (load().orders || []).filter(function (o) { return o.uid === uid && o.payStatus === 'unpaid'; }).length,
            activeCount: ads.filter(function (a) { return a.deliveryStatus === 'delivering' || a.deliveryStatus === 'active'; }).length,
            advertiserStatus: (function () {
                var adv = (load().advertisers || []).filter(function (x) { return x.uid === uid; })[0];
                return adv ? adv.accountStatus : 'none';
            })(),
            pendingAudit: ads.filter(function (a) { return a.auditStatus === 'pending_review'; }).length,
            impressions: ads.reduce(function (s, a) { return s + (a.stats.impressions || 0); }, 0),
            clicks: ads.reduce(function (s, a) { return s + (a.stats.clicks || 0); }, 0),
            spend: data.account.spent || ads.reduce(function (s, a) { return s + (a.stats.spend || 0); }, 0)
        };
    }

    function adminOverview() {
        var ads = load().ads;
        var today = new Date().toISOString().slice(0, 10);
        var imp = 0; var clk = 0; var spend = 0;
        ads.forEach(function (a) {
            imp += a.stats.impressions || 0;
            clk += a.stats.clicks || 0;
            spend += a.stats.spend || 0;
        });
        return {
            total: ads.length,
            pendingAudit: ads.filter(function (a) { return a.auditStatus === 'pending_review'; }).length,
            ended: ads.filter(function (a) { return a.deliveryStatus === 'ended'; }).length,
            advertisers: (load().advertisers || []).filter(function (a) { return a.accountStatus === 'approved'; }).length,
            active: ads.filter(function (a) { return a.deliveryStatus === 'delivering' || a.deliveryStatus === 'active'; }).length,
            todayImpressions: Math.round(imp * 0.08),
            todayClicks: Math.round(clk * 0.06),
            todaySpend: Math.round(spend * 0.05 * 100) / 100,
            userShare: ads.filter(function (a) { return a.source === 'user'; }).length,
            platformShare: ads.filter(function (a) { return a.source === 'platform'; }).length,
            date: today
        };
    }

    global.FLAdStore = {
        DEMO_UID: DEMO_UID,
        AUDIT_STATUS: AUDIT_STATUS,
        PAY_STATUS: PAY_STATUS,
        DELIVERY_STATUS: DELIVERY_STATUS,
        ADVERTISER_STATUS: ADVERTISER_STATUS,
        SOURCE: SOURCE,
        getPackages: function () { return load().packages.slice(); },
        getOrders: function (uid) {
            var o = load().orders || [];
            return uid ? o.filter(function (x) { return x.uid === uid; }) : o.slice();
        },
        getAdvertisers: function () { return (load().advertisers || []).slice(); },
        load: load,
        save: save,
        resetDemo: resetDemo,
        getAds: getAds,
        getAd: getAd,
        upsertAd: upsertAd,
        nextAdId: nextAdId,
        getDeliveringAds: getDeliveringAds,
        accountSummary: accountSummary,
        adminOverview: adminOverview,
        pushOpLog: pushOpLog,
        getSlots: function () { return load().slots.slice(); }
    };
})(typeof window !== 'undefined' ? window : this);
