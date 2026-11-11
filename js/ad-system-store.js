/**
 * 广告系统 · 三端统一模拟数据与状态（localStorage）
 * 原型演示用，非真实投放/支付结果。
 */
(function (global) {
    var STORAGE_KEY = 'fl_ad_system_v2';
    var LEGACY_KEY = 'fl_ad_system_v1';
    var DEMO_UID = 'U102938';

    /**
     * 上架/内容审核（与退款审核独立）
     * 对外展示口径：未提交(空) · 待审核 · 审核通过 · 审核失败
     * draft / none / revoked 在列表中均视为「未提交」
     */
    var AUDIT_STATUS = {
        none: '未提交',
        draft: '未提交',
        pending_review: '待审核',
        approved: '审核通过',
        rejected: '审核失败',
        revoked: '未提交'
    };

    var REFUND_AUDIT_STATUS = {
        pending: '退款待审',
        approved: '退款已通过',
        rejected: '退款已驳回',
        processing: '退款处理中',
        done: '已退款'
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
        {
            code: 'feed_video', name: '短视频信息流', page: '首页 / 订阅 Feed', types: ['品牌曝光', '应用推广'],
            spec: '最多 6 张图或 1 段视频',
            insertEvery: 5, maxPerSession: 3, dailyCap: 3, fallbackMode: 'skip',
            interval: '至少隔 5 条内容插 1 条；单次浏览最多 3 条',
            cap: '同用户同广告每日最多 3 次', fallback: '跳过，不留空位',
            enabled: true, userAllowed: true
        },
        {
            code: 'home_banner', name: '首页 Banner', page: '首页顶部（WEB / H5）', types: ['品牌曝光', '活动推广'],
            spec: '仅图片 JPG/PNG/WebP ≤500KB；WEB 1920×240 / H5 750×200',
            rotateSec: 5, maxPerSession: 5, dailyCap: 8, fallbackMode: 'hide', closable: true,
            interval: '多条轮播 5s；同屏最多 5 条；可关闭',
            cap: '同用户同广告每日最多 8 次', fallback: '隐藏广告位区域',
            enabled: true, userAllowed: true
        },
        {
            code: 'live_room', name: '直播间推广', page: '直播间', types: ['品牌曝光', '直播引流'],
            spec: '小卡 4:3 或横条 Banner',
            intervalMin: 15, maxPerSession: 4, dailyCap: 4, fallbackMode: 'none',
            interval: '每 15 分钟可展示 1 次',
            cap: '单场次最多 4 次 · 每日最多 4 次', fallback: '不展示推广',
            enabled: true, userAllowed: false
        }
    ];

    function nowIso() { return new Date().toISOString(); }

    function defaultTargeting() {
        return {
            regions: [
                { id: 'all', name: '全部' },
                { id: 'cn', name: '中国大陆' },
                { id: 'sg', name: '新加坡' },
                { id: 'jp', name: '日本' },
                { id: 'us', name: '美国' }
            ],
            langs: [
                { id: 'zh-CN', name: '简体中文' },
                { id: 'en', name: 'English' },
                { id: 'ja', name: '日本語' }
            ]
        };
    }

    function defaultFreqCaps() {
        return { feed_video: 3, home_banner: 8, live_room: 4 };
    }

    function defaultRbac() {
        return {
            reviewer: { menus: ['ads-review', 'ads-list'], ops: ['view', 'review'] },
            operator: {
                menus: ['ads-overview', 'ads-list', 'ads-ops-create', 'ads-slots', 'ads-packages', 'ads-advertisers', 'ads-stats', 'ads-risk'],
                ops: ['view', 'pause']
            },
            finance: { menus: ['ads-orders', 'ads-refunds', 'users-ledger'], ops: ['view', 'refund', 'reconcile'] },
            super: { menus: '*', ops: ['view', 'review', 'pause', 'refund', 'package', 'publish_skip_audit', 'reconcile', 'rbac'] }
        };
    }

    function ensureExtras(data) {
        if (!data.targeting) data.targeting = defaultTargeting();
        if (!data.freqCaps) data.freqCaps = defaultFreqCaps();
        if (!data.rbac || !data.rbacRevision || data.rbacRevision < 2) {
            data.rbac = defaultRbac();
            data.rbacRevision = 2;
        }
        if (!data.notices) data.notices = [];
        if (!data.refunds) data.refunds = [];
        if (!data.reconcileLogs) data.reconcileLogs = [];
        return data;
    }

    var DEMO_CATALOG_VERSION = 7;
    /** 旧演示广告补齐套餐字段，与用户下单模型对齐 */
    var DEMO_PACKAGE_MODEL_VERSION = 1;
    /** 首页可展示的投放中样例（信息流 + Banner） */
    var DEMO_HOME_AD_SHOWCASE_VERSION = 14;
    /** 上架审核与投放状态自洽 + 双轨审核口径 */
    var DEMO_AUDIT_CONSISTENCY_VERSION = 2;
    /** 演示账号 U102938 默认「未申请广告主」；升级后从旧 localStorage 移除其资质记录 */
    var DEMO_QUAL_WALKTHROUGH_VERSION = 1;

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
        var pkgBySlot = {
            feed_video: { id: 'PKG-FEED-7', name: '信息流 · 7 天', days: 7, price: 199 },
            home_banner: { id: 'PKG-BANNER-7', name: '首页 Banner · 7 天', days: 7, price: 399 },
            live_room: { id: 'PKG-LIVE-7', name: '直播间推广 · 7 天', days: 7, price: 499 }
        };
            /* 上架审核与投放状态必须自洽：已下架/已结束不可仍为待审核；未提交≠草稿展示 */
            var audits = ['approved', 'approved', 'pending_review', 'pending_review', 'none', 'rejected', 'approved', 'approved'];
        var list = [];
        var titles = ['Web3 创作者峰会', '链上音乐节', 'VIP 订阅季', 'GameFi 新手礼包', '跨境直播带货', 'DEX 手续费返现', 'KOL 联合专场', '数字藏品发售'];
        for (var i = 0; i < 24; i++) {
            var n = 100 + i;
            var audit = audits[i % audits.length];
            var slot = slots[i % slots.length];
            var pkg = pkgBySlot[slot];
            /* 直播间推广仅平台运营可投 */
            var source = (slot === 'live_room' || i % 5 === 0) ? 'platform' : 'user';
            var uid = source === 'platform' ? 'PLATFORM' : (i % 3 === 0 ? 'U220011' : i % 3 === 1 ? 'U330022' : DEMO_UID);
            /* 用户广告须支付成功后才存在，种子数据不再造 unpaid */
            var pay = source === 'platform' ? 'none' : 'paid';
            if (source === 'user' && (audit === 'none' || audit === 'draft')) {
                audit = 'pending_review';
            }
            var del = 'pending_start';
            if (audit === 'approved') {
                del = ['delivering', 'delivering', 'paused', 'ended', 'pending_start', 'removed'][i % 6];
            } else if (audit === 'pending_review') {
                del = 'pending_start';
            } else if (audit === 'rejected') {
                del = 'pending_start';
            } else {
                del = 'pending_start';
            }
            var startAt = '2026-03-' + String(10 + (i % 18)).padStart(2, '0') + 'T10:00:00+08:00';
            var endAt = new Date(new Date(startAt).getTime() + pkg.days * 86400000).toISOString();
            list.push({
                id: 'AD202603' + n,
                name: titles[i % titles.length] + ' · 批次 ' + (i + 1),
                source: source,
                advertiserUid: uid,
                type: types[i % types.length],
                slotCode: slot,
                packageId: source === 'platform' ? (slot === 'live_room' ? pkg.id : '') : pkg.id,
                packageName: source === 'platform' ? (slot === 'live_room' ? pkg.name : '') : pkg.name,
                priceUsdt: source === 'platform' ? (slot === 'live_room' ? pkg.price : 0) : pkg.price,
                title: titles[i % titles.length],
                copy: '限时活动，点击查看详情与落地页规则说明（演示文案 #' + n + '）',
                materialUrl: 'https://picsum.photos/seed/ad-syn-' + n + '/720/1280',
                materialType: 'image',
                landingType: 'external',
                landingUrl: 'https://goodfans.io/campaign/' + n,
                startAt: startAt,
                endAt: endAt,
                audience: { regions: ['全部'], langs: ['zh-CN'], minAge: 18 },
                budgetTotal: source === 'platform' ? (100 + i * 20) : pkg.price,
                budgetDaily: 0,
                billing: 'package',
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
                auditLog: audit === 'rejected'
                    ? [{ at: '2026-03-16T12:00:00+08:00', by: '审核员', action: '审核驳回', note: '素材文案夸大宣传，请修改后重提' }]
                    : []
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
        var ordIds = {};
        (data.orders || []).forEach(function (o) { ordIds[o.id] = 1; });
        data.orders = data.orders || [];
        (tpl.orders || []).forEach(function (o) {
            if (!ordIds[o.id]) { data.orders.push(JSON.parse(JSON.stringify(o))); ordIds[o.id] = 1; }
        });
        var rfIds = {};
        data.refunds = data.refunds || [];
        data.refunds.forEach(function (r) { rfIds[r.id] = 1; });
        (tpl.refunds || []).forEach(function (r) {
            if (!rfIds[r.id]) { data.refunds.push(JSON.parse(JSON.stringify(r))); rfIds[r.id] = 1; }
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
                frozen: 1943,
                spent: 897.6,
                refunded: 120,
                totalRecharge: 5000
            },
            advertisers: [
                { uid: 'U778899', accountStatus: 'pending', applyAt: '2026-03-17T09:00:00+08:00', companyName: 'Test Co', contact: 'a@test.com', rejectReason: '', violationCount: 0 },
                /* 演示用户投放主体：信息流顶栏展示 companyName，不是广告名称 */
                { uid: DEMO_UID, accountStatus: 'approved', applyAt: '2026-11-01T10:00:00+08:00', companyName: '星海互动传媒', contact: 'ads@xinghai.demo', rejectReason: '', violationCount: 0, totalRecharge: 5000, totalSpend: 897.6 }
            ].concat(syntheticAdvertisers()),
            packages: packages,
            orders: [
                { id: 'ORD20260315001', adId: 'AD20260315002', uid: DEMO_UID, packageId: 'PKG-FEED-7', packageName: '信息流 · 7 天', slotCode: 'feed_video', priceSnapshot: 199, durationDays: 7, payStatus: 'paid', paidAmount: 199, refundedAmount: 0, refundableAmount: 199, paidAt: '2026-03-17T14:30:00+08:00', frozen: 199 },
                { id: 'ORD20260225001', adId: 'AD20260228004', uid: DEMO_UID, packageId: 'PKG-FEED-30', packageName: '信息流 · 30 天', slotCode: 'feed_video', priceSnapshot: 699, durationDays: 30, payStatus: 'paid', paidAmount: 699, refundedAmount: 0, refundableAmount: 0, paidAt: '2026-02-25T12:00:00+08:00', frozen: 0 },
                { id: 'ORD20260312001', adId: 'AD20260312003', uid: DEMO_UID, packageId: 'PKG-FEED-7', packageName: '信息流 · 7 天', slotCode: 'feed_video', priceSnapshot: 199, durationDays: 7, payStatus: 'paid', paidAmount: 199, refundedAmount: 0, refundableAmount: 199, paidAt: '2026-03-12T09:20:00+08:00', frozen: 199 },
                /* 测试矩阵订单（各状态） */
                { id: 'ORD20261109001', adId: 'AD20261109001', uid: DEMO_UID, packageId: 'PKG-FEED-7', packageName: '信息流 · 7 天', slotCode: 'feed_video', priceSnapshot: 199, durationDays: 7, payStatus: 'paid', paidAmount: 199, refundedAmount: 0, refundableAmount: 120, paidAt: '2026-11-04T10:00:00+08:00', frozen: 199 },
                { id: 'ORD20261110001', adId: 'AD20261110001', uid: DEMO_UID, packageId: 'PKG-FEED-7', packageName: '信息流 · 7 天', slotCode: 'feed_video', priceSnapshot: 199, durationDays: 7, payStatus: 'paid', paidAmount: 199, refundedAmount: 0, refundableAmount: 199, paidAt: '2026-11-05T09:05:00+08:00', frozen: 199 },
                { id: 'ORD20261110002', adId: 'AD20261110002', uid: DEMO_UID, packageId: 'PKG-FEED-14', packageName: '信息流 · 14 天', slotCode: 'feed_video', priceSnapshot: 349, durationDays: 14, payStatus: 'paid', paidAmount: 349, refundedAmount: 0, refundableAmount: 349, paidAt: '2026-11-06T14:05:00+08:00', frozen: 349 },
                { id: 'ORD20261110003', adId: 'AD20261110003', uid: DEMO_UID, packageId: 'PKG-FEED-7', packageName: '信息流 · 7 天', slotCode: 'feed_video', priceSnapshot: 199, durationDays: 7, payStatus: 'paid', paidAmount: 199, refundedAmount: 0, refundableAmount: 199, paidAt: '2026-11-07T11:05:00+08:00', frozen: 199 },
                { id: 'ORD20261109002', adId: 'AD20261109002', uid: DEMO_UID, packageId: 'PKG-BANNER-7', packageName: '首页 Banner · 7 天', slotCode: 'home_banner', priceSnapshot: 399, durationDays: 7, payStatus: 'paid', paidAmount: 399, refundedAmount: 0, refundableAmount: 200, paidAt: '2026-11-02T11:00:00+08:00', frozen: 399 },
                { id: 'ORD20261109004', adId: 'AD20261109004', uid: DEMO_UID, packageId: 'PKG-FEED-14', packageName: '信息流 · 14 天', slotCode: 'feed_video', priceSnapshot: 349, durationDays: 14, payStatus: 'paid', paidAmount: 349, refundedAmount: 0, refundableAmount: 349, paidAt: '2026-11-07T12:00:00+08:00', frozen: 349 },
                { id: 'ORD20261109005', adId: 'AD20261109005', uid: DEMO_UID, packageId: 'PKG-BANNER-7', packageName: '首页 Banner · 7 天', slotCode: 'home_banner', priceSnapshot: 399, durationDays: 7, payStatus: 'paid', paidAmount: 399, refundedAmount: 0, refundableAmount: 399, paidAt: '2026-11-06T10:00:00+08:00', frozen: 399 },
                { id: 'ORD20261109006', adId: 'AD20261109006', uid: DEMO_UID, packageId: 'PKG-FEED-7', packageName: '信息流 · 7 天', slotCode: 'feed_video', priceSnapshot: 199, durationDays: 7, payStatus: 'paid', paidAmount: 199, refundedAmount: 0, refundableAmount: 80, paidAt: '2026-11-01T08:00:00+08:00', frozen: 199 },
                { id: 'ORD20261109007', adId: 'AD20261109007', uid: DEMO_UID, packageId: 'PKG-FEED-7', packageName: '信息流 · 7 天', slotCode: 'feed_video', priceSnapshot: 199, durationDays: 7, payStatus: 'paid', paidAmount: 199, refundedAmount: 0, refundableAmount: 90, paidAt: '2026-11-03T09:00:00+08:00', frozen: 199, refundTicketId: 'RF20261109001' },
                { id: 'ORD20261109008', adId: 'AD20261109008', uid: DEMO_UID, packageId: 'PKG-FEED-30', packageName: '信息流 · 30 天', slotCode: 'feed_video', priceSnapshot: 699, durationDays: 30, payStatus: 'paid', paidAmount: 699, refundedAmount: 0, refundableAmount: 0, paidAt: '2026-10-01T10:00:00+08:00', frozen: 0 }
            ],
            targeting: defaultTargeting(),
            freqCaps: defaultFreqCaps(),
            rbac: defaultRbac(),
            rbacRevision: 2,
            notices: [
                { id: 'NT-DEMO-1', uid: DEMO_UID, type: 'pay_ok', title: '支付成功', body: '订单 ORD20260315001 已支付并冻结 199 USDT', adId: 'AD20260315002', orderId: 'ORD20260315001', at: '2026-03-17T14:30:00+08:00', read: false },
                { id: 'NT-DEMO-2', uid: DEMO_UID, type: 'audit_pass', title: '广告审核通过', body: '信息流品牌曝光已通过审核，进入投放', adId: 'AD20260315002', orderId: 'ORD20260315001', at: '2026-03-17T16:00:00+08:00', read: false },
                { id: 'NT-DEMO-3', uid: DEMO_UID, type: 'delivery_start', title: '投放已开始', body: '信息流品牌曝光已开始展示', adId: 'AD20260315002', at: '2026-03-18T00:00:00+08:00', read: true }
            ],
            refunds: [
                {
                    id: 'RF20261109001',
                    orderId: 'ORD20261109007',
                    adId: 'AD20261109007',
                    uid: DEMO_UID,
                    amount: 90.55,
                    reason: '活动临时取消，剩余天数暂不投放，申请按规则退回可退金额。',
                    status: 'pending',
                    formulaText: '实付 199 × (4÷7) × (1-5%)',
                    consumedDays: 3,
                    remainingDays: 4,
                    durationDays: 7,
                    createdAt: '2026-11-08T16:00:00+08:00'
                }
            ],
            reconcileLogs: [],
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
                    id: 'AD20261109001',
                    name: '玻尿酸修护精华',
                    source: 'user',
                    advertiserUid: DEMO_UID,
                    type: '品牌曝光',
                    slotCode: 'feed_video',
                    title: '玻尿酸修护精华',
                    copy: '深层补水 · 修护屏障，点击查看活动详情',
                    brandLogoUrl: 'https://images.unsplash.com/photo-1620916562616-fb8c11a6f5d6?auto=format&fit=crop&w=200&h=200&q=80',
                    materialUrl: '../assets/ads/ad-banner-serum-ha.jpg',
                    materialType: 'image',
                    materials: [
                        { type: 'image', url: '../assets/ads/ad-banner-serum-ha.jpg' }
                    ],
                    landingType: 'external',
                    landingUrl: 'https://goodfans.io/campaign/skincare-serum',
                    startAt: '2026-11-01T00:00:00+08:00',
                    endAt: '2026-12-31T23:59:00+08:00',
                    audience: { regions: ['全部'], langs: ['zh-CN'], minAge: 18 },
                    budgetTotal: 199,
                    budgetDaily: 30,
                    billing: 'package',
                    payStatus: 'paid',
                    auditStatus: 'approved',
                    deliveryStatus: 'delivering',
                    orderId: 'ORD20261109001',
                    packageId: 'PKG-FEED-7',
                    packageName: '信息流 · 7 天',
                    priceUsdt: 199,
                    contentVersion: 1,
                    versions: [],
                    rejectReason: '',
                    priority: 8,
                    stats: { impressions: 12680, clicks: 412, spend: 0, conversions: 28 },
                    createdAt: '2026-11-04T10:05:00+08:00',
                    auditLog: [{ at: '2026-11-04T15:00:00+08:00', by: '审核·Ken', action: '审核通过', note: '测试投放中样例' }]
                },
                {
                    id: 'AD20261110001',
                    name: '夏日创作者激励计划',
                    source: 'user',
                    advertiserUid: DEMO_UID,
                    type: '活动推广',
                    slotCode: 'feed_video',
                    title: '夏日创作者激励计划',
                    copy: '报名即领流量券 · 点击查看活动详情（外链打开系统浏览器）',
                    brandLogoUrl: 'https://picsum.photos/seed/ad-brand-logo-summer/200/200',
                    materialUrl: 'https://picsum.photos/seed/ad-summer-feed/720/1280',
                    materialType: 'image',
                    materials: [
                        { type: 'image', url: 'https://picsum.photos/seed/ad-summer-feed/720/1280' },
                        { type: 'image', url: 'https://picsum.photos/seed/ad-summer-feed-b/720/1280' }
                    ],
                    landingType: 'external',
                    landingUrl: 'https://goodfans.io/campaign/summer-boost',
                    startAt: '2026-11-01T00:00:00+08:00',
                    endAt: '2026-12-31T23:59:00+08:00',
                    audience: { regions: ['全部'], langs: ['zh-CN'], minAge: 18 },
                    budgetTotal: 199,
                    budgetDaily: 30,
                    billing: 'package',
                    payStatus: 'paid',
                    auditStatus: 'approved',
                    deliveryStatus: 'delivering',
                    orderId: 'ORD20261110001',
                    packageId: 'PKG-FEED-7',
                    packageName: '信息流 · 7 天',
                    priceUsdt: 199,
                    contentVersion: 1,
                    versions: [],
                    rejectReason: '',
                    priority: 9,
                    stats: { impressions: 4210, clicks: 188, spend: 0, conversions: 14 },
                    createdAt: '2026-11-05T09:00:00+08:00',
                    auditLog: [{ at: '2026-11-05T12:00:00+08:00', by: '审核·Ken', action: '审核通过', note: '外链信息流样例' }]
                },
                {
                    id: 'AD20261110002',
                    name: '爵士夜场 · 直播预告',
                    source: 'user',
                    advertiserUid: DEMO_UID,
                    type: '直播引流',
                    slotCode: 'feed_video',
                    title: '今晚 21:00 开播',
                    copy: '爵士夜场彩排直击 · 点详情进主播主页围观',
                    brandLogoUrl: 'https://picsum.photos/seed/ad-brand-logo-jazz/200/200',
                    materialUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                    materialType: 'video',
                    materials: [
                        {
                            type: 'video',
                            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                            poster: 'https://picsum.photos/seed/ad-jazz-live-nov/720/1280'
                        }
                    ],
                    landingType: 'creator',
                    landingUrl: 'creator-profile.html',
                    startAt: '2026-11-01T00:00:00+08:00',
                    endAt: '2026-12-31T23:59:00+08:00',
                    audience: { regions: ['全部'], langs: ['zh-CN'], minAge: 18 },
                    budgetTotal: 349,
                    budgetDaily: 50,
                    billing: 'package',
                    payStatus: 'paid',
                    auditStatus: 'approved',
                    deliveryStatus: 'delivering',
                    orderId: 'ORD20261110002',
                    packageId: 'PKG-FEED-14',
                    packageName: '信息流 · 14 天',
                    priceUsdt: 349,
                    contentVersion: 1,
                    versions: [],
                    rejectReason: '',
                    priority: 8,
                    stats: { impressions: 9800, clicks: 520, spend: 0, conversions: 41 },
                    createdAt: '2026-11-06T14:00:00+08:00',
                    auditLog: [{ at: '2026-11-06T18:00:00+08:00', by: '审核·Ken', action: '审核通过', note: '直播引流信息流样例' }]
                },
                {
                    id: 'AD20261110003',
                    name: '旅拍器材种草清单',
                    source: 'user',
                    advertiserUid: DEMO_UID,
                    type: '品牌曝光',
                    slotCode: 'feed_video',
                    title: '轻便机身 · 夜景也清晰',
                    copy: '旅拍党本周种草清单已更新，点详情看完整图文',
                    brandLogoUrl: 'https://picsum.photos/seed/ad-brand-logo-lens/200/200',
                    materialUrl: 'https://picsum.photos/seed/ad-lens-gear/720/1280',
                    materialType: 'image',
                    materials: [
                        { type: 'image', url: 'https://picsum.photos/seed/ad-lens-gear/720/1280' }
                    ],
                    landingType: 'external',
                    landingUrl: 'https://goodfans.io/campaign/lens-gear',
                    startAt: '2026-11-01T00:00:00+08:00',
                    endAt: '2026-12-31T23:59:00+08:00',
                    audience: { regions: ['全部'], langs: ['zh-CN'], minAge: 18 },
                    budgetTotal: 199,
                    budgetDaily: 30,
                    billing: 'package',
                    payStatus: 'paid',
                    auditStatus: 'approved',
                    deliveryStatus: 'delivering',
                    orderId: 'ORD20261110003',
                    packageId: 'PKG-FEED-7',
                    packageName: '信息流 · 7 天',
                    priceUsdt: 199,
                    contentVersion: 1,
                    versions: [],
                    rejectReason: '',
                    priority: 7,
                    stats: { impressions: 6100, clicks: 240, spend: 0, conversions: 19 },
                    createdAt: '2026-11-07T11:00:00+08:00',
                    auditLog: [{ at: '2026-11-07T16:00:00+08:00', by: '审核·Ken', action: '审核通过', note: '图文种草信息流样例' }]
                },
                {
                    id: 'AD20261109002',
                    name: '玻尿酸修护精华 Banner',
                    source: 'user',
                    advertiserUid: DEMO_UID,
                    type: '品牌曝光',
                    slotCode: 'home_banner',
                    title: '玻尿酸修护精华',
                    copy: '玻尿酸修护精华（Banner 位仅展示标题与素材图）',
                    brandLogoUrl: 'https://images.unsplash.com/photo-1620916562616-fb8c11a6f5d6?auto=format&fit=crop&w=200&h=200&q=80',
                    materialUrl: '../assets/ads/ad-banner-serum-ha.jpg',
                    materialType: 'image',
                    materials: [
                        { type: 'image', url: '../assets/ads/ad-banner-serum-ha.jpg' }
                    ],
                    landingType: 'external',
                    landingUrl: 'https://goodfans.io/campaign/skincare-serum',
                    startAt: '2026-11-01T00:00:00+08:00',
                    endAt: '2026-12-31T23:59:00+08:00',
                    audience: { regions: ['全部'], langs: ['zh-CN'], minAge: 18 },
                    budgetTotal: 399,
                    budgetDaily: 60,
                    billing: 'package',
                    payStatus: 'paid',
                    auditStatus: 'approved',
                    deliveryStatus: 'delivering',
                    pausedAt: '',
                    pauseReason: '',
                    orderId: 'ORD20261109002',
                    packageId: 'PKG-BANNER-7',
                    packageName: '首页 Banner · 7 天',
                    priceUsdt: 399,
                    contentTags: ['美妆', '护肤', '种草', '品牌'],
                    contentVersion: 1,
                    versions: [],
                    rejectReason: '',
                    priority: 7,
                    stats: { impressions: 8420, clicks: 196, spend: 0, conversions: 11 },
                    createdAt: '2026-11-02T11:10:00+08:00',
                    auditLog: [{ at: '2026-11-02T16:20:00+08:00', by: '审核·Ken', action: '审核通过', note: '护肤 Banner 样例' }]
                },
                {
                    id: 'AD20261109004',
                    name: '周末电竞公开赛引流',
                    source: 'user',
                    advertiserUid: DEMO_UID,
                    type: '直播引流',
                    slotCode: 'feed_video',
                    title: '周末电竞公开赛',
                    copy: '报名观赛赢周边，点详情进主播主页',
                    materialUrl: 'https://picsum.photos/seed/ad-review-nov/720/1280',
                    materialType: 'image',
                    landingType: 'creator',
                    landingUrl: 'creator-profile.html',
                    startAt: '2026-11-12T00:00:00+08:00',
                    endAt: '2026-11-26T23:59:00+08:00',
                    audience: { regions: ['全部'], langs: ['zh-CN'], minAge: 18 },
                    budgetTotal: 349,
                    budgetDaily: 25,
                    billing: 'fixed',
                    payStatus: 'paid',
                    auditStatus: 'pending_review',
                    deliveryStatus: 'pending_start',
                    orderId: 'ORD20261109004',
                    packageId: 'PKG-FEED-14',
                    packageName: '信息流 · 14 天',
                    priceUsdt: 349,
                    contentVersion: 1,
                    versions: [],
                    rejectReason: '',
                    priority: 6,
                    stats: { impressions: 0, clicks: 0, spend: 0, conversions: 0 },
                    createdAt: '2026-11-07T12:05:00+08:00',
                    auditLog: []
                },
                {
                    id: 'AD20261109005',
                    name: '双十一会员日 Banner',
                    source: 'user',
                    advertiserUid: DEMO_UID,
                    type: '品牌曝光',
                    slotCode: 'home_banner',
                    title: '会员日专属礼遇',
                    copy: '',
                    materialUrl: 'https://picsum.photos/seed/ad-pending-nov/1200/675',
                    materialType: 'image',
                    landingType: 'external',
                    landingUrl: 'https://goodfans.io/campaign/pending-start',
                    startAt: '2026-11-15T00:00:00+08:00',
                    endAt: '2026-11-22T23:59:00+08:00',
                    audience: { regions: ['全部'], langs: ['zh-CN'], minAge: 18 },
                    budgetTotal: 399,
                    budgetDaily: 60,
                    billing: 'fixed',
                    payStatus: 'paid',
                    auditStatus: 'approved',
                    deliveryStatus: 'pending_start',
                    orderId: 'ORD20261109005',
                    packageId: 'PKG-BANNER-7',
                    packageName: '首页 Banner · 7 天',
                    priceUsdt: 399,
                    contentVersion: 1,
                    versions: [],
                    rejectReason: '',
                    priority: 5,
                    stats: { impressions: 0, clicks: 0, spend: 0, conversions: 0 },
                    createdAt: '2026-11-06T10:10:00+08:00',
                    auditLog: [{ at: '2026-11-06T18:00:00+08:00', by: '审核·Ken', action: '审核通过', note: '待开始样例' }]
                },
                {
                    id: 'AD20261109006',
                    name: '秋季穿搭灵感合集',
                    source: 'user',
                    advertiserUid: DEMO_UID,
                    type: '品牌曝光',
                    slotCode: 'feed_video',
                    title: '秋季穿搭灵感',
                    copy: '本季流行色与搭配公式一次看懂',
                    materialUrl: 'https://picsum.photos/seed/ad-removed-nov/720/1280',
                    materialType: 'image',
                    landingType: 'external',
                    landingUrl: 'https://goodfans.io/campaign/removed',
                    startAt: '2026-11-01T00:00:00+08:00',
                    endAt: '2026-11-08T23:59:00+08:00',
                    audience: { regions: ['全部'], langs: ['zh-CN'], minAge: 18 },
                    budgetTotal: 199,
                    budgetDaily: 30,
                    billing: 'fixed',
                    payStatus: 'paid',
                    auditStatus: 'approved',
                    deliveryStatus: 'removed',
                    removedAt: '2026-11-07T11:00:00+08:00',
                    removedBy: 'user',
                    removedFeeAction: 'user',
                    removedReason: '用户主动下架',
                    orderId: 'ORD20261109006',
                    packageId: 'PKG-FEED-7',
                    packageName: '信息流 · 7 天',
                    priceUsdt: 199,
                    contentVersion: 1,
                    versions: [],
                    rejectReason: '',
                    priority: 3,
                    stats: { impressions: 5200, clicks: 140, spend: 0, conversions: 9 },
                    createdAt: '2026-11-01T08:10:00+08:00',
                    auditLog: [{ at: '2026-11-01T12:00:00+08:00', by: '审核·Ken', action: '审核通过', note: '下架样例' }]
                },
                {
                    id: 'AD20261109007',
                    name: '咖啡馆联名杯套装',
                    source: 'user',
                    advertiserUid: DEMO_UID,
                    type: '品牌曝光',
                    slotCode: 'feed_video',
                    title: '联名杯套装开售',
                    copy: '限量联名周边，点击查看购买页',
                    materialUrl: 'https://picsum.photos/seed/ad-refund-nov/720/1280',
                    materialType: 'image',
                    landingType: 'external',
                    landingUrl: 'https://goodfans.io/campaign/refund',
                    startAt: '2026-11-03T00:00:00+08:00',
                    endAt: '2026-11-10T23:59:00+08:00',
                    audience: { regions: ['全部'], langs: ['zh-CN'], minAge: 18 },
                    budgetTotal: 199,
                    budgetDaily: 30,
                    billing: 'fixed',
                    payStatus: 'paid',
                    auditStatus: 'approved',
                    deliveryStatus: 'paused',
                    pausedAt: '2026-11-08T10:00:00+08:00',
                    pauseReason: '申请退款前暂停',
                    orderId: 'ORD20261109007',
                    packageId: 'PKG-FEED-7',
                    packageName: '信息流 · 7 天',
                    priceUsdt: 199,
                    contentVersion: 1,
                    versions: [],
                    rejectReason: '',
                    priority: 4,
                    stats: { impressions: 6100, clicks: 180, spend: 0, conversions: 12 },
                    createdAt: '2026-11-03T09:10:00+08:00',
                    auditLog: [{ at: '2026-11-03T14:00:00+08:00', by: '审核·Ken', action: '审核通过', note: '退款待审样例' }]
                },
                {
                    id: 'AD20261109008',
                    name: '国庆出行攻略合集',
                    source: 'user',
                    advertiserUid: DEMO_UID,
                    type: '品牌曝光',
                    slotCode: 'feed_video',
                    title: '国庆出行攻略',
                    copy: '热门目的地与行李清单已整理好',
                    materialUrl: 'https://picsum.photos/seed/ad-ended-nov/720/1280',
                    materialType: 'image',
                    landingType: 'external',
                    landingUrl: 'https://goodfans.io/campaign/ended',
                    startAt: '2026-10-01T00:00:00+08:00',
                    endAt: '2026-10-31T23:59:00+08:00',
                    audience: { regions: ['全部'], langs: ['zh-CN'], minAge: 18 },
                    budgetTotal: 699,
                    budgetDaily: 25,
                    billing: 'fixed',
                    payStatus: 'paid',
                    auditStatus: 'approved',
                    deliveryStatus: 'ended',
                    orderId: 'ORD20261109008',
                    packageId: 'PKG-FEED-30',
                    packageName: '信息流 · 30 天',
                    priceUsdt: 699,
                    contentVersion: 1,
                    versions: [],
                    rejectReason: '',
                    priority: 2,
                    stats: { impressions: 88000, clicks: 2400, spend: 699, conversions: 310 },
                    createdAt: '2026-09-28T10:00:00+08:00',
                    auditLog: [{ at: '2026-09-29T11:00:00+08:00', by: '审核·Ken', action: '审核通过', note: '已结束样例' }]
                }
            ].concat(syntheticAds()),
            finance: [
                { id: 'FIN-R001', uid: DEMO_UID, type: 'recharge', amount: 2000, status: 'success', at: '2026-03-01T10:00:00+08:00', orderNo: 'RC20260301001' },
                { id: 'FIN-F001', uid: DEMO_UID, type: 'freeze', amount: 199, status: 'success', at: '2026-03-17T14:25:00+08:00', orderNo: 'ORD20260315001' },
                { id: 'FIN-S001', uid: DEMO_UID, type: 'spend', amount: 298.6, status: 'success', at: '2026-03-15T23:59:00+08:00', orderNo: 'AD20260228004' },
                { id: 'FIN-F011', uid: DEMO_UID, type: 'freeze', amount: 199, status: 'success', at: '2026-11-04T10:00:00+08:00', orderNo: 'ORD20261109001' },
                { id: 'FIN-F012', uid: DEMO_UID, type: 'freeze', amount: 399, status: 'success', at: '2026-11-02T11:00:00+08:00', orderNo: 'ORD20261109002' },
                { id: 'FIN-F013', uid: DEMO_UID, type: 'freeze', amount: 349, status: 'success', at: '2026-11-07T12:00:00+08:00', orderNo: 'ORD20261109004' },
                { id: 'FIN-F014', uid: DEMO_UID, type: 'freeze', amount: 399, status: 'success', at: '2026-11-06T10:00:00+08:00', orderNo: 'ORD20261109005' },
                { id: 'FIN-F015', uid: DEMO_UID, type: 'freeze', amount: 199, status: 'success', at: '2026-11-01T08:00:00+08:00', orderNo: 'ORD20261109006' },
                { id: 'FIN-F016', uid: DEMO_UID, type: 'freeze', amount: 199, status: 'success', at: '2026-11-03T09:00:00+08:00', orderNo: 'ORD20261109007' }
            ].concat(syntheticFinance()),
            risk: [
                { id: 'RK-001', type: 'report', adId: 'AD20260318001', uid: 'U883311', reason: '频繁出现', at: '2026-03-18T08:12:00+08:00', status: 'open' },
                { id: 'RK-002', type: 'abnormal_click', adId: 'AD20260228004', detail: '短时点击率异常偏高', at: '2026-03-10T02:00:00+08:00', status: 'reviewed' }
            ].concat(syntheticRisk()),
            demoCatalogVersion: DEMO_CATALOG_VERSION,
            demoPackageModelVersion: DEMO_PACKAGE_MODEL_VERSION,
            demoHomeAdShowcaseVersion: DEMO_HOME_AD_SHOWCASE_VERSION,
            opLogs: []
        };
    }

    function normalizeAd(ad) {
        if (!ad) return ad;
        if (ad.deliveryStatus === 'active') ad.deliveryStatus = 'delivering';
        if (ad.deliveryStatus === 'pending') ad.deliveryStatus = 'pending_start';
        if (ad.auditStatus === 'rejected') ad.auditStatus = 'rejected';
        if (ad.auditStatus !== 'rejected') ad.rejectReason = '';
        if (!ad.contentVersion) ad.contentVersion = 1;
        if (!ad.versions) ad.versions = [];
        if (!ad.createdAt) ad.createdAt = new Date().toISOString();
        return ad;
    }

    /** 保证首页 Banner + 信息流能看到投放中样例（每次 bump 版本强制刷新到 delivering） */
    function applyHomeAdShowcaseMigration(data) {
        if (!data || (data.demoHomeAdShowcaseVersion || 0) >= DEMO_HOME_AD_SHOWCASE_VERSION) return data;
        var byId = {};
        (data.ads || []).forEach(function (a) { byId[a.id] = a; });
        function forceDelivering(ad) {
            if (!ad) return;
            ad.userDeleted = false;
            ad.auditStatus = 'approved';
            ad.payStatus = 'paid';
            ad.deliveryStatus = 'delivering';
            ad.startAt = '2026-11-01T00:00:00+08:00';
            ad.endAt = '2026-12-31T23:59:00+08:00';
            ad.pausedAt = '';
            ad.pauseReason = '';
            ad.removedReason = '';
            ad.removedAt = '';
            ad.removedBy = '';
        }
        var feed = byId.AD20261109001;
        if (feed) {
            forceDelivering(feed);
            feed.slotCode = 'feed_video';
            feed.name = '玻尿酸修护精华';
            feed.title = '玻尿酸修护精华';
            delete feed.advertiserName;
            feed.copy = '深层补水 · 修护屏障，点击查看活动详情';
            feed.brandLogoUrl = 'https://images.unsplash.com/photo-1620916562616-fb8c11a6f5d6?auto=format&fit=crop&w=200&h=200&q=80';
            feed.materialType = 'image';
            feed.materialUrl = '../assets/ads/ad-banner-serum-ha.jpg';
            feed.materials = [
                { type: 'image', url: '../assets/ads/ad-banner-serum-ha.jpg' }
            ];
            feed.landingType = 'external';
            feed.landingUrl = 'https://goodfans.io/campaign/skincare-serum';
            feed.contentTags = ['美妆', '护肤', '种草', '品牌'];
        }
        /* 演示广告名称改为正常投放文案，勿用「待支付/投放中」等状态当名称 */
        var nameMap = {
            AD20261110001: { name: '夏日创作者激励计划', title: '夏日创作者激励计划' },
            AD20261110002: { name: '爵士夜场 · 直播预告', title: '今晚 21:00 开播' },
            AD20261110003: { name: '旅拍器材种草清单', title: '轻便机身 · 夜景也清晰' },
            AD20261109003: { name: '新品耳机试听会推广', title: '新品耳机线下试听', copy: '本周末门店试听，限量礼包先到先得' },
            AD20261109004: { name: '周末电竞公开赛引流', title: '周末电竞公开赛', copy: '报名观赛赢周边，点详情进主播主页' },
            AD20261109005: { name: '双十一会员日 Banner', title: '会员日专属礼遇' },
            AD20261109006: { name: '秋季穿搭灵感合集', title: '秋季穿搭灵感', copy: '本季流行色与搭配公式一次看懂' },
            AD20261109007: { name: '咖啡馆联名杯套装', title: '联名杯套装开售', copy: '限量联名周边，点击查看购买页' },
            AD20261109008: { name: '国庆出行攻略合集', title: '国庆出行攻略', copy: '热门目的地与行李清单已整理好' }
        };
        Object.keys(nameMap).forEach(function (id) {
            var ad = byId[id];
            var patch = nameMap[id];
            if (!ad || !patch) return;
            ad.name = patch.name;
            if (patch.title) ad.title = patch.title;
            if (patch.copy) ad.copy = patch.copy;
        });
        data.advertisers = data.advertisers || [];
        var demoAdv = data.advertisers.filter(function (a) { return a.uid === DEMO_UID; })[0];
        if (!demoAdv) {
            data.advertisers.push({
                uid: DEMO_UID,
                accountStatus: 'approved',
                applyAt: '2026-11-01T10:00:00+08:00',
                companyName: '星海互动传媒',
                contact: 'ads@xinghai.demo',
                rejectReason: '',
                violationCount: 0,
                totalRecharge: 5000,
                totalSpend: 897.6
            });
        } else if (!demoAdv.companyName) {
            demoAdv.companyName = '星海互动传媒';
        }
        /* 补充多条投放中信息流，供 WEB 竖滑每隔几条插入 */
        var extraFeed = (seed().ads || []).filter(function (a) {
            return a.id === 'AD20261110001' || a.id === 'AD20261110002' || a.id === 'AD20261110003';
        });
        data.ads = data.ads || [];
        extraFeed.forEach(function (tpl) {
            if (byId[tpl.id]) {
                Object.assign(byId[tpl.id], {
                    slotCode: 'feed_video',
                    auditStatus: 'approved',
                    payStatus: 'paid',
                    deliveryStatus: 'delivering',
                    startAt: tpl.startAt,
                    endAt: tpl.endAt,
                    name: tpl.name,
                    title: tpl.title,
                    copy: tpl.copy,
                    brandLogoUrl: tpl.brandLogoUrl,
                    materialUrl: tpl.materialUrl,
                    materialType: tpl.materialType,
                    materials: tpl.materials,
                    landingType: tpl.landingType,
                    landingUrl: tpl.landingUrl,
                    packageId: tpl.packageId,
                    packageName: tpl.packageName,
                    priceUsdt: tpl.priceUsdt,
                    pausedAt: '',
                    pauseReason: '',
                    removedReason: '',
                    removedAt: '',
                    removedBy: '',
                    userDeleted: false
                });
            } else {
                data.ads.push(JSON.parse(JSON.stringify(tpl)));
            }
        });
        data.orders = data.orders || [];
        var ordIds = {};
        data.orders.forEach(function (o) { ordIds[o.id] = 1; });
        [
            { id: 'ORD20261110001', adId: 'AD20261110001', packageId: 'PKG-FEED-7', packageName: '信息流 · 7 天', priceSnapshot: 199, durationDays: 7, paidAt: '2026-11-05T09:05:00+08:00' },
            { id: 'ORD20261110002', adId: 'AD20261110002', packageId: 'PKG-FEED-14', packageName: '信息流 · 14 天', priceSnapshot: 349, durationDays: 14, paidAt: '2026-11-06T14:05:00+08:00' },
            { id: 'ORD20261110003', adId: 'AD20261110003', packageId: 'PKG-FEED-7', packageName: '信息流 · 7 天', priceSnapshot: 199, durationDays: 7, paidAt: '2026-11-07T11:05:00+08:00' }
        ].forEach(function (o) {
            if (ordIds[o.id]) return;
            data.orders.push({
                id: o.id,
                adId: o.adId,
                uid: DEMO_UID,
                packageId: o.packageId,
                packageName: o.packageName,
                slotCode: 'feed_video',
                priceSnapshot: o.priceSnapshot,
                durationDays: o.durationDays,
                payStatus: 'paid',
                paidAmount: o.priceSnapshot,
                refundedAmount: 0,
                refundableAmount: o.priceSnapshot,
                paidAt: o.paidAt,
                frozen: o.priceSnapshot
            });
        });
        var banner = byId.AD20261109002;
        if (banner) {
            forceDelivering(banner);
            banner.slotCode = 'home_banner';
            banner.name = '玻尿酸修护精华 Banner';
            banner.title = '玻尿酸修护精华';
            banner.copy = '玻尿酸修护精华（Banner 位仅展示标题与素材图）';
            banner.brandLogoUrl = 'https://images.unsplash.com/photo-1620916562616-fb8c11a6f5d6?auto=format&fit=crop&w=200&h=200&q=80';
            banner.materialUrl = '../assets/ads/ad-banner-serum-ha.jpg';
            banner.materialType = 'image';
            banner.materials = [
                { type: 'image', url: '../assets/ads/ad-banner-serum-ha.jpg' }
            ];
            banner.landingType = 'external';
            banner.landingUrl = 'https://goodfans.io/campaign/skincare-serum';
            banner.contentTags = ['美妆', '护肤', '种草', '品牌'];
            banner.packageId = 'PKG-BANNER-7';
            banner.packageName = '首页 Banner · 7 天';
            banner.priceUsdt = 399;
            banner.priority = 10;
        }
        var banner2 = byId.AD20261109005;
        if (banner2) {
            forceDelivering(banner2);
            banner2.slotCode = 'home_banner';
            banner2.name = '双十一会员日 Banner';
            banner2.title = '会员日专属礼遇';
            banner2.copy = '首页 Banner 轮播样例 · 会员日礼遇';
            banner2.brandLogoUrl = 'https://picsum.photos/seed/ad-brand-logo-member/200/200';
            banner2.materialUrl = 'https://picsum.photos/seed/ad-banner-member-day/1200/150';
            banner2.materialType = 'image';
            banner2.materials = [
                { type: 'image', url: 'https://picsum.photos/seed/ad-banner-member-day/1200/150' }
            ];
            banner2.landingType = 'external';
            banner2.landingUrl = 'https://goodfans.io/campaign/member-day';
            banner2.contentTags = ['会员', '活动', '品牌'];
            banner2.packageId = 'PKG-BANNER-7';
            banner2.packageName = '首页 Banner · 7 天';
            banner2.priceUsdt = 399;
            banner2.priority = 9;
        }
        var platformBanner = byId.AD20260318001;
        if (platformBanner) {
            forceDelivering(platformBanner);
            platformBanner.slotCode = 'home_banner';
            platformBanner.payStatus = 'none';
            platformBanner.source = 'platform';
        }
        /* v12：取消广告主「待支付」态 — 清理历史 unpaid/failed 用户广告与未付订单 */
        var dropUnpaid = {};
        (data.ads || []).forEach(function (a) {
            if (a && a.source === 'user' && (a.payStatus === 'unpaid' || a.payStatus === 'failed')) {
                dropUnpaid[a.id] = true;
            }
        });
        if (Object.keys(dropUnpaid).length) {
            data.ads = (data.ads || []).filter(function (a) { return !dropUnpaid[a.id]; });
        }
        data.orders = (data.orders || []).filter(function (o) {
            if (!o) return false;
            if (dropUnpaid[o.adId] && (o.payStatus === 'unpaid' || o.payStatus === 'failed' || o.payStatus === 'processing')) {
                return false;
            }
            if (!dropUnpaid[o.adId] && (o.payStatus === 'unpaid' || o.payStatus === 'failed') &&
                !(data.ads || []).some(function (a) { return a.id === o.adId; })) {
                return false;
            }
            return true;
        });

        data.demoHomeAdShowcaseVersion = DEMO_HOME_AD_SHOWCASE_VERSION;
        save(data);
        try { localStorage.removeItem('fl_ad_impressions_v1'); } catch (e) { /* ignore */ }
        try { sessionStorage.removeItem('fl_ad_banner_closed'); } catch (e) { /* ignore */ }
        return data;
    }

    /** 旧演示广告补齐套餐 / 排期，并与订单字段对齐（用户侧创建的广告已有这些字段） */
    function applyPackageModelMigration(data) {
        if (!data || (data.demoPackageModelVersion || 0) >= DEMO_PACKAGE_MODEL_VERSION) return data;
        var pkgs = data.packages || [];
        var pkgById = {};
        var pkgBySlot = {};
        pkgs.forEach(function (p) {
            pkgById[p.id] = p;
            if (p.enabled !== false && !pkgBySlot[p.slotCode]) pkgBySlot[p.slotCode] = p;
        });
        var ordersByAd = {};
        (data.orders || []).forEach(function (o) {
            if (!o || !o.adId) return;
            if (!ordersByAd[o.adId]) ordersByAd[o.adId] = [];
            ordersByAd[o.adId].push(o);
        });
        (data.ads || []).forEach(function (ad) {
            var ordList = ordersByAd[ad.id] || [];
            var bestOrd = ordList.filter(function (o) {
                return o.payStatus === 'paid' || o.payStatus === 'partial_refunded' || o.payStatus === 'unpaid';
            })[0] || ordList[0];
            if (bestOrd) {
                if (!ad.packageId && bestOrd.packageId) ad.packageId = bestOrd.packageId;
                if (!ad.packageName && bestOrd.packageName) ad.packageName = bestOrd.packageName;
                if (ad.priceUsdt == null && bestOrd.priceSnapshot != null) ad.priceUsdt = bestOrd.priceSnapshot;
                if (!ad.orderId) ad.orderId = bestOrd.id;
            }
            if (!ad.packageId && ad.slotCode && pkgBySlot[ad.slotCode] && ad.source !== 'platform') {
                var fallback = pkgBySlot[ad.slotCode];
                ad.packageId = fallback.id;
                ad.packageName = fallback.name;
                ad.priceUsdt = fallback.priceUsdt;
            }
            if (ad.packageId && pkgById[ad.packageId]) {
                if (!ad.packageName) ad.packageName = pkgById[ad.packageId].name;
                if (ad.priceUsdt == null) ad.priceUsdt = pkgById[ad.packageId].priceUsdt;
            }
            if (ad.auditStatus !== 'rejected') ad.rejectReason = '';
            if (!ad.billing || ad.billing === 'cpm') ad.billing = ad.source === 'platform' ? 'ops' : 'package';
        });
        data.demoPackageModelVersion = DEMO_PACKAGE_MODEL_VERSION;
        save(data);
        return data;
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
            data = ensureExtras(data);
            data.ads.forEach(normalizeAd);
            data = applyDemoQualWalkthroughMigration(data);
            data = mergeDemoRichness(data);
            data = applyPackageModelMigration(data);
            data = applyHomeAdShowcaseMigration(data);
            return applyAuditConsistencyMigration(data);
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

    function clearAdvertiserQual(uid) {
        uid = uid || DEMO_UID;
        var data = load();
        data.advertisers = (data.advertisers || []).filter(function (a) { return a.uid !== uid; });
        save(data);
        try {
            global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        } catch (e) { /* ignore */ }
        return data;
    }

    function applyDemoQualWalkthroughMigration(data) {
        if (!data || (data.demoQualWalkthroughVersion || 0) >= DEMO_QUAL_WALKTHROUGH_VERSION) return data;
        data.advertisers = (data.advertisers || []).filter(function (a) { return a.uid !== DEMO_UID; });
        data.demoQualWalkthroughVersion = DEMO_QUAL_WALKTHROUGH_VERSION;
        save(data);
        return data;
    }

    /**
     * 上架审核对外键：已下架/已结束时，待审与未提交统一视为未提交（不可再审上架）
     */
    function contentAuditKey(ad) {
        if (!ad) return 'none';
        var raw = ad.auditStatus || 'none';
        var closed = ad.deliveryStatus === 'removed' || ad.deliveryStatus === 'ended';
        if (closed && (raw === 'pending_review' || raw === 'draft' || raw === 'none' || raw === 'revoked' || !raw)) {
            return 'none';
        }
        if (raw === 'draft' || raw === 'revoked' || !raw) return 'none';
        return raw;
    }

    function applyAuditConsistencyMigration(data) {
        if (!data || (data.demoAuditConsistencyVersion || 0) >= DEMO_AUDIT_CONSISTENCY_VERSION) return data;
        (data.ads || []).forEach(function (ad) {
            if (!ad) return;
            if (ad.auditStatus === 'draft') ad.auditStatus = 'none';
            var closed = ad.deliveryStatus === 'removed' || ad.deliveryStatus === 'ended';
            if (closed && ad.auditStatus === 'pending_review') {
                /* 下架/结束后上架审核队列关闭；若从未通过则回未提交，已通过则保留通过记录 */
                ad.auditStatus = 'none';
                ad.auditLog = ad.auditLog || [];
                ad.auditLog.push({
                    at: new Date().toISOString(),
                    by: '系统',
                    action: '关闭上架审核',
                    note: '广告已下架或已结束，待审队列自动关闭'
                });
            }
            /* 未通过上架审核的广告不应处于投放中 */
            if (ad.auditStatus !== 'approved' &&
                (ad.deliveryStatus === 'delivering' || ad.deliveryStatus === 'active' || ad.deliveryStatus === 'paused')) {
                ad.deliveryStatus = 'pending_start';
            }
            /* 直播间推广仅平台运营 */
            if (ad.slotCode === 'live_room' && ad.source !== 'platform') {
                ad.source = 'platform';
                ad.advertiserUid = 'PLATFORM';
                ad.payStatus = ad.payStatus === 'paid' ? 'none' : (ad.payStatus || 'none');
            }
        });
        data.demoAuditConsistencyVersion = DEMO_AUDIT_CONSISTENCY_VERSION;
        save(data);
        return data;
    }

    function getAds(filter) {
        filter = filter || {};
        var list = load().ads.slice();
        if (filter.uid) list = list.filter(function (a) { return a.advertiserUid === filter.uid || filter.uid === 'ALL'; });
        /* 用户列表软删：excludeUserDeleted=true 时隐藏；后台默认不传，仍可见留档 */
        if (filter.excludeUserDeleted) list = list.filter(function (a) { return !a.userDeleted; });
        if (filter.source) list = list.filter(function (a) { return a.source === filter.source; });
        if (filter.auditStatus) {
            var want = filter.auditStatus;
            list = list.filter(function (a) {
                var key = contentAuditKey(a);
                if (want === 'none' || want === 'draft' || want === 'unsubmitted') {
                    return key === 'none';
                }
                return key === want || a.auditStatus === want;
            });
        }
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
        return list.sort(function (a, b) {
            var ba = String((b && b.createdAt) || '');
            var aa = String((a && a.createdAt) || '');
            if (ba === aa) return String((b && b.id) || '').localeCompare(String((a && a.id) || ''));
            return ba.localeCompare(aa);
        });
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
        normalizeAd(ad);
        var data = load();
        var idx = data.ads.findIndex(function (a) { return a.id === ad.id; });
        if (idx >= 0) data.ads[idx] = ad;
        else data.ads.unshift(ad);
        save(data);
        try {
            global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        } catch (e) { /* ignore */ }
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
        var ads = data.ads.filter(function (a) { return a.advertiserUid === uid && !a.userDeleted; });
        return {
            balance: data.account.balance,
            frozen: data.account.frozen,
            available: data.account.balance,
            total: (data.account.balance || 0) + (data.account.frozen || 0),
            pendingPay: 0,
            activeCount: ads.filter(function (a) { return a.deliveryStatus === 'delivering' || a.deliveryStatus === 'active'; }).length,
            advertiserStatus: (function () {
                var adv = (load().advertisers || []).filter(function (x) { return x.uid === uid; })[0];
                return adv ? adv.accountStatus : 'none';
            })(),
            pendingAudit: ads.filter(function (a) {
                return a.auditStatus === 'pending_review' &&
                    a.deliveryStatus !== 'removed' &&
                    a.deliveryStatus !== 'ended';
            }).length,
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
            pendingAudit: ads.filter(function (a) {
                return a.auditStatus === 'pending_review' &&
                    a.deliveryStatus !== 'removed' &&
                    a.deliveryStatus !== 'ended';
            }).length,
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
        REFUND_AUDIT_STATUS: REFUND_AUDIT_STATUS,
        contentAuditKey: contentAuditKey,
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
        clearAdvertiserQual: clearAdvertiserQual,
        getAds: getAds,
        getAd: getAd,
        upsertAd: upsertAd,
        nextAdId: nextAdId,
        getDeliveringAds: getDeliveringAds,
        accountSummary: accountSummary,
        adminOverview: adminOverview,
        pushOpLog: pushOpLog,
        getSlots: function () { return load().slots.slice(); },
        getTargeting: function () { return JSON.parse(JSON.stringify(ensureExtras(load()).targeting)); },
        getFreqCaps: function () { return Object.assign({}, ensureExtras(load()).freqCaps); },
        getRbac: function () { return JSON.parse(JSON.stringify(ensureExtras(load()).rbac)); },
        getNotices: function (uid) {
            var list = ensureExtras(load()).notices || [];
            return uid ? list.filter(function (n) { return n.uid === uid; }) : list.slice();
        },
        getRefunds: function () { return (ensureExtras(load()).refunds || []).slice(); },
        getReconcileLogs: function () { return (ensureExtras(load()).reconcileLogs || []).slice(); },
        DEFAULT_RBAC: defaultRbac()
    };
})(typeof window !== 'undefined' ? window : this);
