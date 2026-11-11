/**
 * 广告系统 · 一期业务规则与状态流转（原型，localStorage）
 * 依赖 FLAdStore；支付/审核/投放均为模拟，Toast/返回值会标明。
 */
(function (global) {
    if (!global.FLAdStore) return;

    var RISK_DOMAIN_BLOCK = ['evil-phish.test', 'malware.demo'];
    var IDEM = {};
    var MS_DAY = 86400000;
    /** 开投后按剩余天数退款时的手续费率（原型默认 5%） */
    var REFUND_SERVICE_FEE_RATE = 0.05;

    function toMs(iso) {
        if (!iso) return null;
        var t = new Date(iso).getTime();
        return isNaN(t) ? null : t;
    }

    function computeRefundQuote(order, ad, nowMs) {
        nowMs = nowMs == null ? Date.now() : nowMs;
        if (!order || !ad) return { ok: false, message: '订单或广告不存在' };
        var paid = order.paidAmount || order.priceSnapshot || 0;
        var refunded = order.refundedAmount || 0;
        var dur = order.durationDays || 7;
        if (order.payStatus !== 'paid' && order.payStatus !== 'partial_refunded') {
            return { ok: false, message: '订单未支付成功' };
        }
        var startMs = toMs(ad.startAt);
        if (!startMs) return { ok: false, message: '请先设置投放开始时间' };

        var consumed = 0;
        var feeRate = 0;
        var ds = ad.deliveryStatus;

        if (ds === 'pending_start' && nowMs < startMs) {
            consumed = 0;
            feeRate = 0;
        } else if (ds === 'delivering' || ds === 'paused' || ds === 'active') {
            var endCap = startMs + dur * MS_DAY;
            var adEnd = toMs(ad.endAt);
            if (adEnd) endCap = Math.min(endCap, adEnd);
            /* 暂停期间冻结消耗进度（以 pausedAt 计），恢复后按顺延后的 endAt 继续 */
            var clockMs = (ds === 'paused' && toMs(ad.pausedAt)) ? toMs(ad.pausedAt) : nowMs;
            var evalNow = Math.min(clockMs, endCap);
            var elapsed = evalNow - startMs;
            consumed = elapsed <= 0 ? 0 : Math.min(dur, Math.ceil(elapsed / MS_DAY));
            feeRate = REFUND_SERVICE_FEE_RATE;
        } else if (ds === 'pending_start' && nowMs >= startMs) {
            consumed = 0;
            feeRate = 0;
        } else if (ds === 'ended' || ds === 'removed') {
            consumed = dur;
            feeRate = REFUND_SERVICE_FEE_RATE;
        } else {
            return { ok: false, message: '当前状态不可申请退款' };
        }

        var remaining = Math.max(0, dur - consumed);
        var gross = remaining <= 0 ? 0 : paid * (remaining / dur) * (1 - feeRate);
        gross = Math.round(gross * 100) / 100;
        var maxNow = Math.round(Math.max(0, gross - refunded) * 100) / 100;

        return {
            ok: true,
            durationDays: dur,
            consumedDays: consumed,
            remainingDays: remaining,
            feeRate: feeRate,
            paidAmount: paid,
            refundedAmount: refunded,
            grossRefundable: gross,
            maxRefundNow: maxNow,
            formulaText: remaining <= 0
                ? '套餐天数已消耗完毕，无可退金额'
                : '实付 ' + paid + ' × (' + remaining + '÷' + dur + ') × (1-' + Math.round(feeRate * 100) + '%)'
        };
    }

    function computeRefundQuoteForOrder(orderId, nowMs) {
        var data = FLAdStore.load();
        var order = (data.orders || []).filter(function (o) { return o.id === orderId; })[0];
        if (!order) return { ok: false, message: '订单不存在' };
        var ad = FLAdStore.getAd(order.adId);
        return computeRefundQuote(order, ad, nowMs);
    }

    function syncOrderRefundable(orderId, nowMs) {
        var data = FLAdStore.load();
        var order = (data.orders || []).filter(function (o) { return o.id === orderId; })[0];
        if (!order) return null;
        var ad = FLAdStore.getAd(order.adId);
        var q = computeRefundQuote(order, ad, nowMs);
        if (q.ok) order.refundableAmount = q.grossRefundable;
        FLAdStore.save(data);
        return q;
    }

    function applyPackageSchedule(ad, packageId) {
        var pkg = getPackage(packageId);
        if (!pkg) return fail('套餐不存在');
        if (!ad.startAt) return fail('请设置投放开始时间');
        var startMs = toMs(ad.startAt);
        if (!startMs) return fail('开始时间格式无效');
        ad.endAt = new Date(startMs + pkg.durationDays * MS_DAY).toISOString();
        ad.packageId = pkg.id;
        ad.packageName = pkg.name;
        ad.priceUsdt = pkg.priceUsdt;
        return ok({ endAt: ad.endAt, durationDays: pkg.durationDays });
    }

    function validatePackageSchedule(ad) {
        var pkg = getPackage(ad.packageId);
        if (!pkg || !ad.startAt) return ok();
        var startMs = toMs(ad.startAt);
        var expectedEnd = startMs + pkg.durationDays * MS_DAY;
        if (!ad.endAt) {
            ad.endAt = new Date(expectedEnd).toISOString();
            return ok();
        }
        var endMs = toMs(ad.endAt);
        if (Math.abs(endMs - expectedEnd) > 120000) {
            return fail('结束时间须为开始时间 +' + pkg.durationDays + ' 天（与所选套餐一致）');
        }
        return ok();
    }

    /** 未支付前：排期须未开始且未结束，否则需先改时间再支付 */
    function assertSchedulePayable(ad, nowMs) {
        nowMs = nowMs == null ? Date.now() : nowMs;
        if (!ad) return fail('广告不存在');
        if (!ad.startAt) return fail('请先设置投放开始时间');
        var startMs = toMs(ad.startAt);
        if (startMs == null) return fail('开始时间格式无效');
        var endMs = toMs(ad.endAt);
        if (endMs == null && ad.packageId) {
            var pkg = getPackage(ad.packageId);
            if (pkg) endMs = startMs + pkg.durationDays * MS_DAY;
        }
        if (endMs != null && endMs <= nowMs) {
            return fail('排期已结束，请先修改投放时间后再支付');
        }
        if (startMs <= nowMs) {
            return fail('投放开始时间已过，请先修改排期后再支付');
        }
        return ok({ startAt: ad.startAt, endAt: ad.endAt || (endMs ? new Date(endMs).toISOString() : '') });
    }

    function fail(msg) { return { ok: false, message: msg }; }
    function ok(data) { return { ok: true, data: data || {} }; }

    function findAdvertiserIn(data, uid) {
        uid = uid || FLAdStore.DEMO_UID;
        return ((data && data.advertisers) || []).filter(function (a) { return a.uid === uid; })[0] || null;
    }

    function advertiser(uid) {
        return findAdvertiserIn(FLAdStore.load(), uid || FLAdStore.DEMO_UID);
    }

    function canCreatePaidAd(uid) {
        var adv = advertiser(uid);
        if (!adv) return fail('请先申请广告主资格');
        if (adv.accountStatus === 'pending') return fail('广告主资质审核中，暂不可创建付费广告');
        if (adv.accountStatus === 'rejected') return fail('资质被驳回：' + (adv.rejectReason || '') + '，请重新申请');
        if (adv.accountStatus === 'restricted') return fail('账号已限制发布广告，请联系客服');
        if (adv.accountStatus === 'disabled') return fail('账号已禁用，无法创建广告');
        if (adv.accountStatus !== 'approved') return fail('未取得广告主资格');
        return ok();
    }

    function aspectMatch(w, h, ratios) {
        if (!w || !h) return false;
        var r = w / h;
        return ratios.some(function (pair) {
            var target = pair[0] / pair[1];
            return Math.abs(r - target) < 0.08;
        });
    }

    var IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
    var VIDEO_MIMES = ['video/mp4', 'video/webm'];

    var MATERIAL_RULES = {
        feed_video: {
            allowVideo: true,
            maxImages: 6,
            maxImageBytes: 2 * 1024 * 1024,
            maxVideoBytes: 20 * 1024 * 1024,
            ratios: [[9, 16], [1, 1]],
            hint: '信息流：可上传最多 6 张 9:16 / 1:1 图（每张 ≤2MB），或 1 段 MP4/WebM 视频（≤20MB）。图片与视频不可混用。'
        },
        home_banner: {
            allowVideo: false,
            maxImages: 6,
            maxImageBytes: 512 * 1024,
            maxVideoBytes: 0,
            /* WEB 横幅约 8:1；H5 约 15:4；亦兼容常见通栏比例 */
            ratios: [[8, 1], [15, 4], [6, 1], [5, 1], [16, 5]],
            webSize: '1920×240（亦可 1200×150）',
            h5Size: '750×200',
            formatsLabel: 'JPG / PNG / WebP',
            hint: '首页 Banner 仅支持图片，不可上传视频。格式 JPG/PNG/WebP；每张 ≤500KB；最多 6 张轮播。分辨率：WEB 推荐 1920×240（或 1200×150），H5 推荐 750×200；比例约 8:1 或 15:4。'
        },
        live_room: {
            allowVideo: false,
            maxImages: 4,
            maxImageBytes: 1024 * 1024,
            maxVideoBytes: 0,
            ratios: [[4, 3], [16, 9]],
            hint: '最多 4 张 4:3 或 16:9 图片，每张 ≤1MB（仅平台运营）'
        }
    };

    /**
     * 投放密度与排序（防随意/过度投放）
     * 展示层须遵守：信息流最少隔 N 条内容、单次会话上限；Banner 轮播上限与间隔。
     */
    var DELIVERY_RULES = {
        feed_video: {
            minContentBetween: 5,
            maxPerSession: 3,
            rotateMs: 0,
            fairWeight: true
        },
        home_banner: {
            minContentBetween: 0,
            maxPerSession: 5,
            rotateMs: 5000,
            fairWeight: true
        },
        live_room: {
            minContentBetween: 0,
            maxPerSession: 1,
            rotateMs: 0,
            fairWeight: true
        }
    };

    var TYPE_TAG_MAP = {
        '品牌曝光': ['品牌', '种草'],
        '直播引流': ['直播', '娱乐'],
        '活动推广': ['活动', '促销'],
        '应用推广': ['应用', '工具']
    };

    function materialAccept(slotCode) {
        var rule = MATERIAL_RULES[slotCode] || MATERIAL_RULES.feed_video;
        return rule.allowVideo
            ? 'image/jpeg,image/png,image/webp,video/mp4,video/webm'
            : 'image/jpeg,image/png,image/webp';
    }

    function validateMaterial(slotCode, meta) {
        meta = meta || {};
        if (!slotCode) return fail('请先选择广告位');
        var rule = MATERIAL_RULES[slotCode];
        if (!rule) return fail('未知广告位素材规范');
        var mime = meta.mimeType || '';
        var isVideo = VIDEO_MIMES.indexOf(mime) >= 0;
        var isImage = IMAGE_MIMES.indexOf(mime) >= 0;
        if (mime && !isImage && !isVideo) {
            return fail(rule.allowVideo ? '仅支持 JPG / PNG / WebP 图片，或 MP4 / WebM 视频' : '仅支持 JPG / PNG / WebP 图片');
        }
        if (isVideo && !rule.allowVideo) return fail('该广告位仅支持图片素材');
        var maxBytes = isVideo ? rule.maxVideoBytes : rule.maxImageBytes;
        if (meta.sizeBytes && maxBytes && meta.sizeBytes > maxBytes) return fail('素材文件过大：' + rule.hint);
        if (meta.width && meta.height && !aspectMatch(meta.width, meta.height, rule.ratios)) {
            return fail('尺寸比例不符合要求（' + rule.hint + '）');
        }
        return ok({ hint: rule.hint, kind: isVideo ? 'video' : 'image' });
    }

    function validateLink(url) {
        if (!url || !String(url).trim()) return fail('请填写跳转链接');
        var u = String(url).trim();
        if (/^javascript:/i.test(u)) return fail('不允许 javascript 链接');
        if (/^https?:\/\//i.test(u)) {
            try {
                var host = new URL(u).hostname;
                if (RISK_DOMAIN_BLOCK.some(function (d) { return host.indexOf(d) >= 0; })) {
                    return fail('链接域名存在安全风险，已被拦截（模拟）');
                }
            } catch (e) { return fail('链接格式无效'); }
        }
        return ok();
    }

    function syncDeliveryFromTime(ad, persist) {
        if (ad.deliveryStatus === 'removed' || ad.deliveryStatus === 'ended') return;
        var payReady = ad.payStatus === 'paid' || (ad.source === 'platform' && ad.payStatus === 'none');
        if (ad.auditStatus !== 'approved' || !payReady) {
            ad.deliveryStatus = 'pending_start';
            return;
        }
        var now = Date.now();
        var start = ad.startAt ? new Date(ad.startAt).getTime() : 0;
        var end = ad.endAt ? new Date(ad.endAt).getTime() : Infinity;
        if (ad.deliveryStatus === 'paused') return;
        if (now < start) ad.deliveryStatus = 'pending_start';
        else if (now > end) {
            if (ad.deliveryStatus !== 'ended') {
                ad.deliveryStatus = 'ended';
                if (persist !== false) settleOrderOnEnd(ad);
            } else ad.deliveryStatus = 'ended';
        } else ad.deliveryStatus = 'delivering';
    }

    function isUserLoggedIn() {
        try {
            var a = JSON.parse(localStorage.getItem('goodfans_auth') || '{}');
            return !!a.loggedIn;
        } catch (e) {
            return true;
        }
    }

    function isKycApprovedForAds() {
        if (global.GoodfansKycStore && global.GoodfansKycStore.isApproved()) return true;
        try {
            if (localStorage.getItem('h5_withdraw_kyc_passed') === '1') return true;
            var raw = localStorage.getItem('goodfans_kyc');
            if (raw) {
                var k = JSON.parse(raw);
                if (k.authStatus === 'approved' || k.status === 'approved') return true;
            }
        } catch (e2) { /* ignore */ }
        return false;
    }

    /**
     * 申请广告主前置（对齐主流平台：实名/KYC + 协议；不要求预充值/押金/创作者身份）
     */
    function checkAdvertiserApplyPrerequisites(uid) {
        uid = uid || FLAdStore.DEMO_UID;
        var items = [];
        var blockers = [];

        var loggedIn = isUserLoggedIn();
        items.push({ id: 'login', label: '已登录平台账号', ok: loggedIn, required: true });
        if (!loggedIn) blockers.push({ id: 'login', message: '请先登录后再申请广告主', action: 'login' });

        var kycOk = isKycApprovedForAds();
        items.push({ id: 'kyc', label: '已完成 KYC 身份验证', ok: kycOk, required: true, action: kycOk ? null : 'kyc' });
        if (!kycOk) blockers.push({ id: 'kyc', message: '请先完成 KYC 身份验证', action: 'kyc' });

        var ex = advertiser(uid);
        var st = ex ? ex.accountStatus : 'none';
        if (st === 'pending') {
            items.push({ id: 'qual', label: '当前无进行中的资质申请', ok: false, required: true });
            blockers.push({ id: 'qual', message: '资质审核中，请耐心等待结果' });
        } else if (st === 'approved') {
            items.push({ id: 'qual', label: '当前无进行中的资质申请', ok: false, required: true });
            blockers.push({ id: 'qual', message: '您已是广告主，无需重复申请' });
        } else {
            items.push({ id: 'qual', label: '当前无进行中的资质申请', ok: true, required: true });
        }

        items.push({ id: 'wallet', label: '无需广告账户余额（创编支付时再充值）', ok: true, required: false, info: true });
        items.push({ id: 'deposit', label: '无需押金或保证金', ok: true, required: false, info: true });
        items.push({ id: 'goods', label: '无需开通创作者或上架商品', ok: true, required: false, info: true });

        return {
            ok: blockers.length === 0,
            items: items,
            blockers: blockers,
            message: blockers.length ? blockers[0].message : ''
        };
    }

    function applyAdvertiser(uid, payload) {
        if (!payload || !payload.agreedToTerms) return fail('请先阅读并同意《广告主服务协议》');
        if (!payload.companyName || !String(payload.companyName).trim()) return fail('请填写投放主体名称');
        if (!payload.contact || !String(payload.contact).trim()) return fail('请填写联系邮箱');
        var pre = checkAdvertiserApplyPrerequisites(uid);
        if (!pre.ok) return fail(pre.message || '暂不满足申请条件');
        var data = FLAdStore.load();
        data.advertisers = data.advertisers || [];
        var ex = findAdvertiserIn(data, uid);
        if (ex && ex.accountStatus === 'approved') return fail('您已是广告主');
        if (ex && ex.accountStatus === 'pending') return fail('申请审核中，请耐心等待');
        var row = {
            uid: uid,
            accountStatus: 'pending',
            applyAt: new Date().toISOString(),
            companyName: payload.companyName || '',
            contact: payload.contact || '',
            rejectReason: '',
            violationCount: ex ? ex.violationCount : 0
        };
        if (ex) Object.assign(ex, row);
        else data.advertisers.push(row);
        FLAdStore.save(data);
        FLAdStore.pushOpLog({ action: '提交广告主申请', target: uid, by: '用户' });
        return ok({ status: 'pending' });
    }

    function adminReviewAdvertiser(uid, approve, reason) {
        var data = FLAdStore.load();
        var adv = findAdvertiserIn(data, uid);
        if (!adv) return fail('广告主不存在');
        adv.accountStatus = approve ? 'approved' : 'rejected';
        adv.rejectReason = approve ? '' : (reason || '未填写');
        adv.reviewedAt = new Date().toISOString();
        FLAdStore.save(data);
        FLAdStore.pushOpLog({ action: approve ? '资质通过' : '资质驳回', target: uid, reason: reason });
        return ok({ status: adv.accountStatus });
    }

    function adminSetAdvertiserStatus(uid, status, reason) {
        var data = FLAdStore.load();
        var adv = findAdvertiserIn(data, uid);
        if (!adv) return fail('广告主不存在');
        adv.accountStatus = status;
        if (status === 'restricted') adv.restrictReason = reason || '运营限制发布';
        FLAdStore.save(data);
        FLAdStore.pushOpLog({ action: '广告主状态变更', target: uid, reason: status + (reason ? ' · ' + reason : '') });
        return ok({ status: adv.accountStatus });
    }

    function getPackage(pkgId) {
        return FLAdStore.load().packages.filter(function (p) { return p.id === pkgId; })[0];
    }

    function pushNotice(uid, type, title, body, extra) {
        extra = extra || {};
        var data = FLAdStore.load();
        data.notices = data.notices || [];
        data.notices.unshift({
            id: 'NT-' + Date.now(),
            uid: uid,
            type: type,
            title: title,
            body: body || '',
            adId: extra.adId || '',
            orderId: extra.orderId || '',
            at: new Date().toISOString(),
            read: false
        });
        if (data.notices.length > 80) data.notices.length = 80;
        FLAdStore.save(data);
    }

    function impressionKey() { return 'fl_ad_impressions_v1'; }

    function todayKey() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function readImpressions() {
        try { return JSON.parse(localStorage.getItem(impressionKey()) || '{}'); } catch (e) { return {}; }
    }

    function writeImpressions(map) {
        localStorage.setItem(impressionKey(), JSON.stringify(map));
    }

    function recordImpression(adId, viewerId) {
        viewerId = viewerId || 'demo-viewer';
        var map = readImpressions();
        map[viewerId] = map[viewerId] || {};
        map[viewerId][adId] = map[viewerId][adId] || {};
        var day = todayKey();
        map[viewerId][adId][day] = (map[viewerId][adId][day] || 0) + 1;
        writeImpressions(map);
        return map[viewerId][adId][day];
    }

    function underFreqCap(ad, viewerId) {
        viewerId = viewerId || 'demo-viewer';
        var caps = FLAdStore.getFreqCaps();
        var cap = caps[ad.slotCode];
        if (!cap) return true;
        var map = readImpressions();
        var n = (((map[viewerId] || {})[ad.id] || {})[todayKey()]) || 0;
        return n < cap;
    }

    function todayImpressionCount(adId, viewerId) {
        viewerId = viewerId || 'demo-viewer';
        var map = readImpressions();
        return (((map[viewerId] || {})[adId] || {})[todayKey()]) || 0;
    }

    /** 一期统一投放：不做地域 / 语言定向过滤 */
    function audienceMatches(/* ad, ctx */) {
        return true;
    }

    /** 从广告文案/类型/素材标注推导内容标签（正式环境由视觉/ASR 算法写入 contentTags） */
    function contentTagsOf(ad) {
        var tags = [];
        var seen = {};
        function push(t) {
            t = String(t || '').trim();
            if (!t || seen[t]) return;
            seen[t] = 1;
            tags.push(t);
        }
        (ad.contentTags || []).forEach(push);
        (TYPE_TAG_MAP[ad.type] || []).forEach(push);
        var blob = [ad.title, ad.copy, ad.name].join(' ');
        ['直播', '音乐', '摄影', '旅拍', '夜景', '活动', '激励', '种草', '器材', '爵士', '创作者', '品牌'].forEach(function (k) {
            if (blob.indexOf(k) >= 0) push(k);
        });
        return tags;
    }

    /** 观众兴趣画像：正式来自刷视频行为；原型可读 localStorage 或演示默认 */
    function viewerInterestProfile(ctx) {
        ctx = ctx || {};
        if (ctx.interests && ctx.interests.length) return ctx.interests.slice();
        try {
            var raw = localStorage.getItem('fl_viewer_interests');
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) return parsed;
            }
        } catch (e) { /* ignore */ }
        return ['创作者', '直播', '音乐', '摄影', '种草'];
    }

    function matchScore(ad, ctx) {
        var tags = contentTagsOf(ad);
        var interests = viewerInterestProfile(ctx);
        if (!tags.length || !interests.length) return 0.35;
        var hit = 0;
        var set = {};
        interests.forEach(function (t) { set[t] = 1; });
        tags.forEach(function (t) { if (set[t]) hit += 1; });
        return hit / Math.max(tags.length, 1);
    }

    /**
     * 多人同时投放时的排序：兴趣匹配分 × 运营优先级 ÷ (1+当日曝光) → 公平轮转、抑制刷屏
     */
    function rankAdsForDelivery(ads, slotCode, ctx) {
        ctx = ctx || {};
        var rules = DELIVERY_RULES[slotCode] || { maxPerSession: 6, fairWeight: true };
        var viewerId = ctx.viewerId || 'demo-viewer';
        var scored = (ads || []).map(function (ad) {
            /* 平台运营广告固定最高优先，无需表单填写 */
            var pri = ad.source === 'platform' ? 99 : (Number(ad.priority) || 5);
            var match = matchScore(ad, ctx);
            var shown = todayImpressionCount(ad.id, viewerId);
            var fair = rules.fairWeight === false ? 1 : (1 / (1 + shown));
            var score = (0.55 * match + 0.25 * (pri / 10) + 0.2) * fair;
            return { ad: ad, score: score, match: match };
        });
        scored.sort(function (a, b) {
            if (b.score !== a.score) return b.score - a.score;
            return String(b.ad.id).localeCompare(String(a.ad.id));
        });
        var max = rules.maxPerSession || 6;
        return scored.slice(0, max).map(function (row) { return row.ad; });
    }

    /**
     * 丢弃未支付成功的用户广告与未付订单（支付失败回滚 / 清理历史待支付）。
     * 已支付或平台广告不可丢弃。
     */
    function discardUnpaidAd(adId) {
        var data = FLAdStore.load();
        var ad = (data.ads || []).filter(function (a) { return a.id === adId; })[0];
        if (!ad) return ok({ removed: false });
        if (ad.source === 'platform' || ad.payStatus === 'paid' || ad.payStatus === 'partial_refunded' || ad.payStatus === 'none') {
            return fail('已支付或平台广告不可丢弃');
        }
        data.ads = (data.ads || []).filter(function (a) { return a.id !== adId; });
        data.orders = (data.orders || []).filter(function (o) {
            if (o.adId !== adId) return true;
            return !(o.payStatus === 'unpaid' || o.payStatus === 'failed' || o.payStatus === 'processing');
        });
        FLAdStore.save(data);
        try {
            global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        } catch (e) { /* ignore */ }
        return ok({ removed: true });
    }

    /** 清理某用户侧残留的待支付/支付失败广告（产品：无待支付列表态） */
    function purgeUnpaidUserAds(uid) {
        var data = FLAdStore.load();
        var dropIds = {};
        (data.ads || []).forEach(function (a) {
            if (a.advertiserUid === uid && a.source === 'user' &&
                (a.payStatus === 'unpaid' || a.payStatus === 'failed')) {
                dropIds[a.id] = true;
            }
        });
        var keys = Object.keys(dropIds);
        if (!keys.length) return ok({ removed: 0 });
        data.ads = (data.ads || []).filter(function (a) { return !dropIds[a.id]; });
        data.orders = (data.orders || []).filter(function (o) {
            if (!dropIds[o.adId]) return true;
            return !(o.payStatus === 'unpaid' || o.payStatus === 'failed' || o.payStatus === 'processing');
        });
        FLAdStore.save(data);
        try {
            global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        } catch (e) { /* ignore */ }
        return ok({ removed: keys.length });
    }

    function createOrder(adId, packageId, uid) {
        var gate = canCreatePaidAd(uid);
        if (!gate.ok) return gate;
        var ad = FLAdStore.getAd(adId);
        var pkg = getPackage(packageId);
        if (!ad || !pkg) return fail('广告或套餐不存在');
        if (!pkg.enabled) return fail('套餐已停售');
        var data = FLAdStore.load();
        data.orders = data.orders || [];
        var existing = data.orders.filter(function (o) {
            return o.adId === adId && (o.payStatus === 'unpaid' || o.payStatus === 'processing' || o.payStatus === 'failed');
        })[0];
        if (existing && existing.payStatus === 'processing') return fail('该广告已有支付处理中的订单，请勿重复下单');
        if (existing && existing.payStatus === 'unpaid') return ok({ order: existing, reused: true });
        if (existing && existing.payStatus === 'failed') {
            existing.payStatus = 'unpaid';
            existing.packageId = pkg.id;
            existing.packageName = pkg.name;
            existing.priceSnapshot = pkg.priceUsdt;
            existing.durationDays = pkg.durationDays;
            FLAdStore.save(data);
            return ok({ order: existing, reused: true });
        }
        var paidOpen = data.orders.filter(function (o) {
            return o.adId === adId && (o.payStatus === 'paid' || o.payStatus === 'partial_refunded');
        })[0];
        if (paidOpen) return fail('该广告已有已支付订单，不可重复占用资金');
        var order = {
            id: 'ORD' + Date.now(),
            adId: adId,
            uid: uid,
            packageId: pkg.id,
            packageName: pkg.name,
            slotCode: pkg.slotCode,
            priceSnapshot: pkg.priceUsdt,
            durationDays: pkg.durationDays,
            payStatus: 'unpaid',
            paidAmount: 0,
            refundedAmount: 0,
            refundableAmount: 0,
            createdAt: new Date().toISOString(),
            idempotencyPaid: null
        };
        data.orders.unshift(order);
        var adInData = (data.ads || []).filter(function (a) { return a.id === adId; })[0];
        if (adInData) {
            adInData.orderId = order.id;
            adInData.packageId = pkg.id;
            adInData.packageName = pkg.name;
            adInData.payStatus = 'unpaid';
            adInData.priceUsdt = pkg.priceUsdt;
            if (!adInData.createdAt) adInData.createdAt = new Date().toISOString();
        }
        FLAdStore.save(data);
        try {
            global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        } catch (e) { /* ignore */ }
        return ok({ order: order });
    }

    /**
     * 创编：余额校验通过后才落库广告+订单，并启动支付；失败则回滚不留待支付记录。
     * 支付成功后由 payOrder 回调将广告标为 paid 并进入 pending_review。
     */
    function createAndPayAd(adFields, packageId, uid, idempotencyKey) {
        idempotencyKey = idempotencyKey || ('create-pay-' + Date.now());
        if (IDEM[idempotencyKey] && IDEM[idempotencyKey].ok && IDEM[idempotencyKey].data && IDEM[idempotencyKey].data.settled) {
            return IDEM[idempotencyKey];
        }
        var gate = canCreatePaidAd(uid);
        if (!gate.ok) return gate;
        var pkg = getPackage(packageId);
        if (!pkg) return fail('套餐不存在');
        if (!pkg.enabled) return fail('套餐已停售');
        var data0 = FLAdStore.load();
        if ((data0.account.balance || 0) < pkg.priceUsdt) {
            return fail('余额不足，还需 ' + (pkg.priceUsdt - (data0.account.balance || 0)).toFixed(2) + ' USDT');
        }
        var adId = (adFields && adFields.id) || FLAdStore.nextAdId();
        var ad = Object.assign({}, adFields || {}, {
            id: adId,
            advertiserUid: uid,
            source: 'user',
            packageId: pkg.id,
            packageName: pkg.name,
            priceUsdt: pkg.priceUsdt,
            slotCode: pkg.slotCode || (adFields && adFields.slotCode) || '',
            payStatus: 'unpaid',
            auditStatus: 'none',
            deliveryStatus: 'pending_start',
            billing: 'fixed_package',
            contentVersion: (adFields && adFields.contentVersion) || 1,
            versions: (adFields && adFields.versions) || [],
            auditLog: (adFields && adFields.auditLog) || [],
            stats: (adFields && adFields.stats) || { impressions: 0, clicks: 0, spend: 0, conversions: 0 },
            createdAt: (adFields && adFields.createdAt) || new Date().toISOString()
        });
        var sch = applyPackageSchedule(ad, packageId);
        if (!sch.ok) return sch;
        var schPay = assertSchedulePayable(ad);
        if (!schPay.ok) return schPay;
        var link = validateLink(ad.landingUrl);
        if (!link.ok) return link;
        if (!ad.brandLogoUrl) return fail('请上传品牌头像 / LOGO');
        var mats = Array.isArray(ad.materials) ? ad.materials : [];
        if (!ad.materialUrl && !mats.length) return fail('请上传素材');
        if (ad.materialMeta && !ad.materialMeta.validated) return fail('请上传符合规范的素材');

        /* 同一份 data 写入广告+未付订单，避免 upsert 触发列表 heal 把 unpaid 清掉 */
        var dataWrite = FLAdStore.load();
        dataWrite.ads = dataWrite.ads || [];
        dataWrite.orders = dataWrite.orders || [];
        var existIdx = dataWrite.ads.findIndex(function (a) { return a.id === adId; });
        if (existIdx >= 0) dataWrite.ads[existIdx] = ad;
        else dataWrite.ads.unshift(ad);
        var order = {
            id: 'ORD' + Date.now(),
            adId: adId,
            uid: uid,
            packageId: pkg.id,
            packageName: pkg.name,
            slotCode: pkg.slotCode,
            priceSnapshot: pkg.priceUsdt,
            durationDays: pkg.durationDays,
            payStatus: 'unpaid',
            paidAmount: 0,
            refundedAmount: 0,
            refundableAmount: 0,
            createdAt: new Date().toISOString(),
            idempotencyPaid: null
        };
        ad.orderId = order.id;
        dataWrite.orders.unshift(order);
        FLAdStore.save(dataWrite);

        var pay = payOrder(order.id, idempotencyKey);
        if (!pay.ok) {
            discardUnpaidAd(adId);
            return pay;
        }
        return ok({
            ad: FLAdStore.getAd(adId),
            order: order,
            processing: true,
            adId: adId,
            orderId: order.id
        });
    }

    function payOrder(orderId, idempotencyKey) {
        idempotencyKey = idempotencyKey || 'pay-' + orderId;
        if (IDEM[idempotencyKey]) return IDEM[idempotencyKey];
        var data = FLAdStore.load();
        var order = (data.orders || []).filter(function (o) { return o.id === orderId; })[0];
        if (!order) { var r = fail('订单不存在'); IDEM[idempotencyKey] = r; return r; }
        if (order.payStatus === 'paid') { var r2 = ok({ order: order, note: '已支付（幂等）' }); IDEM[idempotencyKey] = r2; return r2; }
        if (order.payStatus === 'processing') { var r3 = ok({ order: order, note: '支付处理中' }); IDEM[idempotencyKey] = r3; return r3; }

        var adForPay = FLAdStore.getAd(order.adId);
        var schPay = assertSchedulePayable(adForPay);
        if (!schPay.ok) {
            IDEM[idempotencyKey] = schPay;
            return schPay;
        }

        var acc = data.account;
        var price = order.priceSnapshot;
        if (acc.balance < price) {
            var r4 = fail('余额不足，还需 ' + (price - acc.balance).toFixed(2) + ' USDT');
            IDEM[idempotencyKey] = r4;
            return r4;
        }

        order.payStatus = 'processing';
        var adProc = (data.ads || []).filter(function (a) { return a.id === order.adId; })[0];
        if (adProc && (adProc.payStatus === 'unpaid' || adProc.payStatus === 'failed')) {
            adProc.payStatus = 'processing';
        }
        FLAdStore.save(data);

        setTimeout(function () {
            var d2 = FLAdStore.load();
            var o2 = (d2.orders || []).filter(function (o) { return o.id === orderId; })[0];
            if (!o2 || o2.payStatus === 'paid') return;
            if (d2.account.balance < o2.priceSnapshot) {
                o2.payStatus = 'failed';
                FLAdStore.save(d2);
                /* 支付失败：回滚未付广告，不保留待支付列表态 */
                discardUnpaidAd(o2.adId);
                pushNotice(o2.uid, 'pay_fail', '支付失败', '订单支付失败，广告未创建成功', { orderId: o2.id, adId: o2.adId });
                global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
                return;
            }
            d2.account.balance -= o2.priceSnapshot;
            d2.account.frozen = (d2.account.frozen || 0) + o2.priceSnapshot;
            o2.payStatus = 'paid';
            o2.paidAmount = o2.priceSnapshot;
            o2.frozen = o2.priceSnapshot;
            o2.paidAt = new Date().toISOString();
            o2.idempotencyPaid = idempotencyKey;
            d2.finance.unshift({
                id: 'FIN-FZ-' + Date.now(),
                uid: o2.uid,
                type: 'freeze',
                amount: o2.priceSnapshot,
                status: 'success',
                at: new Date().toISOString(),
                orderNo: o2.id,
                note: '套餐支付冻结'
            });
            /* 必须改同一份 d2 再一次 save，避免 upsertAd 后又被旧 ads 覆盖回 unpaid */
            var ad = (d2.ads || []).filter(function (a) { return a.id === o2.adId; })[0];
            if (ad) {
                ad.payStatus = 'paid';
                if (ad.auditStatus === 'draft' || ad.auditStatus === 'none' || !ad.auditStatus) {
                    ad.auditStatus = 'pending_review';
                }
                if (ad.auditStatus === 'approved') syncDeliveryFromTime(ad);
            }
            FLAdStore.save(d2);
            syncOrderRefundable(orderId);
            pushNotice(o2.uid, 'pay_ok', '支付成功', '订单 ' + o2.id + ' 已支付并冻结 ' + o2.priceSnapshot + ' USDT', { orderId: o2.id, adId: o2.adId });
            if (ad && ad.auditStatus === 'pending_review') {
                pushNotice(o2.uid, 'audit_pending', '已提交审核', '广告 ' + (ad.name || ad.id) + ' 进入审核中', { adId: ad.id, orderId: o2.id });
            }
            global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        }, 800);

        var rProc = ok({ order: order, processing: true });
        IDEM[idempotencyKey] = rProc;
        return rProc;
    }

    function simulatePayFail(orderId) {
        var data = FLAdStore.load();
        var order = (data.orders || []).filter(function (o) { return o.id === orderId; })[0];
        if (!order) return fail('订单不存在');
        order.payStatus = 'failed';
        var ad = FLAdStore.getAd(order.adId);
        if (ad) { ad.payStatus = 'failed'; FLAdStore.upsertAd(ad); }
        FLAdStore.save(data);
        pushNotice(order.uid, 'pay_fail', '支付失败', '订单 ' + order.id + ' 支付失败，可重试', { orderId: order.id, adId: order.adId });
        return ok();
    }

    function queryPayStatus(orderId) {
        var order = (FLAdStore.load().orders || []).filter(function (o) { return o.id === orderId; })[0];
        if (!order) return fail('订单不存在');
        return ok({ order: order, payStatus: order.payStatus });
    }

    function handlePayCallback(orderId, payload) {
        payload = payload || {};
        var data = FLAdStore.load();
        var order = (data.orders || []).filter(function (o) { return o.id === orderId; })[0];
        if (!order) return fail('订单不存在');
        data.reconcileLogs = data.reconcileLogs || [];
        var log = {
            id: 'RC-' + Date.now(),
            orderId: orderId,
            at: new Date().toISOString(),
            kind: payload.duplicate ? 'duplicate' : (payload.delayed ? 'delayed' : (payload.success === false ? 'fail' : 'success')),
            note: payload.note || ''
        };
        if (payload.duplicate || order.payStatus === 'paid') {
            log.kind = 'duplicate';
            log.note = log.note || '重复回调，已忽略（幂等）';
            data.reconcileLogs.unshift(log);
            FLAdStore.save(data);
            return ok({ ignored: true, payStatus: order.payStatus });
        }
        if (payload.success === false) {
            order.payStatus = 'failed';
            var adF = FLAdStore.getAd(order.adId);
            if (adF) { adF.payStatus = 'failed'; FLAdStore.upsertAd(adF); }
            data.reconcileLogs.unshift(log);
            FLAdStore.save(data);
            pushNotice(order.uid, 'pay_fail', '支付失败', '对账回调：订单支付失败', { orderId: orderId, adId: order.adId });
            return ok({ payStatus: 'failed' });
        }
        data.reconcileLogs.unshift(log);
        FLAdStore.save(data);
        return payOrder(orderId, 'cb-' + orderId);
    }

    function refundOrder(orderId, amount, reason, idempotencyKey, opts) {
        opts = opts || {};
        idempotencyKey = idempotencyKey || 'ref-' + orderId;
        if (IDEM[idempotencyKey]) return IDEM[idempotencyKey];
        var data = FLAdStore.load();
        var order = (data.orders || []).filter(function (o) { return o.id === orderId; })[0];
        if (!order) return fail('订单不存在');
        if (order.payStatus !== 'paid' && order.payStatus !== 'partial_refunded') return fail('订单不可退款');
        var ad = FLAdStore.getAd(order.adId);
        syncOrderRefundable(orderId);
        order = FLAdStore.load().orders.filter(function (o) { return o.id === orderId; })[0];
        var quote = computeRefundQuote(order, ad);
        /* 平台下架后状态变为 removed，报价会变成 0；审核通过的退款单用下架前锁定的 ticket.amount */
        var max = quote.ok ? quote.maxRefundNow : 0;
        if (opts.trustedAmount != null) {
            max = Math.max(max, Number(opts.trustedAmount) || 0);
        }
        if (!quote.ok && opts.trustedAmount == null) return fail(quote.message);
        if (amount <= 0 || amount > max + 0.001) {
            return fail('可退金额不足，当前最多可退 ' + max.toFixed(2) + ' USDT' +
                (quote.ok ? '（' + quote.formulaText + '）' : ''));
        }
        order.payStatus = 'refund_processing';
        FLAdStore.save(data);
        setTimeout(function () {
            var d2 = FLAdStore.load();
            var o2 = d2.orders.filter(function (o) { return o.id === orderId; })[0];
            if (!o2) return;
            o2.refundedAmount = (o2.refundedAmount || 0) + amount;
            var unfreeze = Math.min(amount, o2.frozen || 0);
            o2.frozen = Math.max(0, (o2.frozen || 0) - unfreeze);
            d2.account.frozen = Math.max(0, (d2.account.frozen || 0) - unfreeze);
            d2.account.balance += amount;
            d2.account.refunded = (d2.account.refunded || 0) + amount;
            syncOrderRefundable(orderId);
            o2 = d2.orders.filter(function (o) { return o.id === orderId; })[0];
            var leftRef = (o2.refundableAmount || 0) - (o2.refundedAmount || 0);
            o2.payStatus = leftRef <= 0.001 ? 'refunded' : 'partial_refunded';
            var adRf = FLAdStore.getAd(o2.adId);
            if (adRf && leftRef <= 0.001) {
                adRf.deliveryStatus = 'removed';
                adRf.payStatus = o2.payStatus;
                FLAdStore.upsertAd(adRf);
            } else if (adRf && (adRf.deliveryStatus === 'delivering' || adRf.deliveryStatus === 'paused')) {
                adRf.deliveryStatus = 'removed';
                FLAdStore.upsertAd(adRf);
            }
            d2.finance.unshift({
                id: 'FIN-RF-' + Date.now(),
                uid: o2.uid,
                type: 'refund',
                amount: amount,
                status: 'success',
                at: new Date().toISOString(),
                orderNo: o2.id,
                note: reason || ''
            });
            FLAdStore.save(d2);
            pushNotice(o2.uid, 'refund_result', '退款已到账', amount.toFixed(2) + ' USDT 已退回广告账户', { orderId: o2.id, adId: o2.adId });
            global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        }, 700);
        var r = ok({ processing: true });
        IDEM[idempotencyKey] = r;
        return r;
    }

    function requestRefund(orderId, reason) {
        var data = FLAdStore.load();
        var order = (data.orders || []).filter(function (o) { return o.id === orderId; })[0];
        if (!order) return fail('订单不存在');
        var reasonText = String(reason || '').trim();
        if (!reasonText || reasonText.length < 4) return fail('请填写退款申请理由（至少 4 个字）');
        if (reasonText.length > 200) return fail('申请理由请控制在 200 字以内');
        var adForRf = (data.ads || []).filter(function (a) { return a.id === order.adId; })[0];
        if (adForRf && (adForRf.deliveryStatus === 'delivering' || adForRf.deliveryStatus === 'active')) {
            return fail('请先暂停后再申请退款');
        }
        if (adForRf && adForRf.deliveryStatus !== 'pending_start' && adForRf.deliveryStatus !== 'paused') {
            return fail('当前状态不可申请退款');
        }
        var quote = computeRefundQuoteForOrder(orderId);
        if (!quote.ok) return fail(quote.message);
        if (quote.maxRefundNow <= 0) return fail('当前无可退金额');
        data.refunds = data.refunds || [];
        var open = data.refunds.filter(function (x) { return x.orderId === orderId && x.status === 'pending'; })[0];
        if (open) return fail('该订单已有待审核退款申请');
        var ticket = {
            id: 'RF' + Date.now(),
            orderId: orderId,
            adId: order.adId,
            uid: order.uid,
            amount: quote.maxRefundNow,
            reason: reasonText,
            status: 'pending',
            formulaText: quote.formulaText,
            consumedDays: quote.consumedDays,
            remainingDays: quote.remainingDays,
            durationDays: quote.durationDays,
            createdAt: new Date().toISOString()
        };
        data.refunds.unshift(ticket);
        order.refundTicketId = ticket.id;
        /* 待审核中申请退款：退出上架审核队列，避免一边等审一边退款 */
        var adRfApply = (data.ads || []).filter(function (a) { return a.id === order.adId; })[0];
        if (adRfApply && adRfApply.auditStatus === 'pending_review') {
            adRfApply.auditStatus = 'none';
            adRfApply.auditLog = adRfApply.auditLog || [];
            adRfApply.auditLog.push({
                at: new Date().toISOString(),
                by: '系统',
                action: '退款申请·退出上架审核',
                note: '用户申请退款，关闭待审'
            });
        }
        FLAdStore.save(data);
        pushNotice(order.uid, 'refund_apply', '退款申请已提交', '申请退款 ' + ticket.amount.toFixed(2) + ' USDT，等待财务审核', { orderId: orderId, adId: order.adId });
        FLAdStore.pushOpLog({ action: '用户申请退款', target: orderId, reason: reasonText });
        try {
            global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        } catch (e) { /* ignore */ }
        return ok({ ticket: ticket });
    }

    function adminDecideRefund(ticketId, approve, reason) {
        var perm = requireAdminPerm('refund');
        if (!perm.ok) return perm;
        var data = FLAdStore.load();
        var ticket = (data.refunds || []).filter(function (x) { return x.id === ticketId; })[0];
        if (!ticket) return fail('退款单不存在');
        if (ticket.status !== 'pending') return fail('该退款单已处理');
        ticket.reviewedAt = new Date().toISOString();
        ticket.reviewNote = reason || '';
        if (!approve) {
            ticket.status = 'rejected';
            FLAdStore.save(data);
            pushNotice(ticket.uid, 'refund_result', '退款申请未通过', reason || '财务驳回', { orderId: ticket.orderId, adId: ticket.adId });
            return ok({ ticket: ticket });
        }
        ticket.status = 'approved';
        FLAdStore.save(data);
        return refundOrder(ticket.orderId, ticket.amount, ticket.reason, 'rf-admin-' + ticket.id, {
            trustedAmount: ticket.amount
        });
    }

    /**
     * 超时未审自动取消：startAt 已过仍为 pending_review → 退出审核队列并全额退款。
     * 在广告中心 / 详情 / 后台审核入口调用。
     */
    function expireStalePendingReviewAds(nowMs) {
        nowMs = nowMs == null ? Date.now() : nowMs;
        var data = FLAdStore.load();
        var targets = [];
        (data.ads || []).forEach(function (ad) {
            if (!ad || ad.source === 'platform') return;
            if (ad.auditStatus !== 'pending_review') return;
            if (ad.payStatus !== 'paid' && ad.payStatus !== 'partial_refunded') return;
            if (ad.deliveryStatus === 'removed' || ad.deliveryStatus === 'ended') return;
            var startMs = toMs(ad.startAt);
            if (startMs == null || startMs > nowMs) return;
            ad.auditStatus = 'none';
            ad.removedBy = 'system';
            ad.removedReason = '超过投放开始时间仍未审核，系统自动取消';
            ad.removedFeeAction = 'refund_remaining';
            ad.auditLog = ad.auditLog || [];
            ad.auditLog.push({
                at: new Date().toISOString(),
                by: '系统',
                action: '超时未审·自动取消',
                note: '超过 startAt 仍待审核，取消并退款'
            });
            targets.push({ adId: ad.id, uid: ad.advertiserUid, name: ad.name || ad.id });
        });
        if (!targets.length) return ok({ expired: 0 });
        FLAdStore.save(data);

        var refunding = 0;
        targets.forEach(function (row) {
            var ad = FLAdStore.getAd(row.adId);
            if (!ad) return;
            var d2 = FLAdStore.load();
            var order = (d2.orders || []).filter(function (o) {
                return o.adId === row.adId && (o.payStatus === 'paid' || o.payStatus === 'partial_refunded');
            })[0];
            if (!order) {
                ad.deliveryStatus = 'removed';
                FLAdStore.upsertAd(ad);
                pushNotice(row.uid, 'audit_expire', '广告已自动取消', row.name + ' 超过开始时间仍未审核，已取消（无有效已付订单）', { adId: row.adId });
                return;
            }
            var openRf = (d2.refunds || []).some(function (t) {
                return t.orderId === order.id &&
                    (t.status === 'pending' || t.status === 'processing' || t.status === 'approved');
            });
            var amount = Math.round(Math.max(0, (order.paidAmount || order.priceSnapshot || 0) - (order.refundedAmount || 0)) * 100) / 100;
            if (amount <= 0 || openRf) {
                ad.deliveryStatus = 'removed';
                FLAdStore.upsertAd(ad);
                pushNotice(row.uid, 'audit_expire', '广告已自动取消', row.name + ' 超过开始时间仍未审核，系统已取消', { adId: row.adId, orderId: order.id });
                return;
            }
            d2.refunds = d2.refunds || [];
            var ticket = {
                id: 'RF-AUTO-' + Date.now() + '-' + String(row.adId).slice(-4),
                orderId: order.id,
                adId: row.adId,
                uid: order.uid,
                amount: amount,
                reason: '超过投放开始时间仍未审核，系统自动取消退款',
                status: 'approved',
                formulaText: '超时未审 · 未开投全额退',
                auto: true,
                createdAt: new Date().toISOString(),
                reviewedAt: new Date().toISOString(),
                reviewNote: '系统自动通过'
            };
            d2.refunds.unshift(ticket);
            var ordRef = (d2.orders || []).filter(function (o) { return o.id === order.id; })[0];
            if (ordRef) ordRef.refundTicketId = ticket.id;
            FLAdStore.save(d2);
            pushNotice(row.uid, 'audit_expire', '广告已自动取消并退款',
                row.name + ' 超过开始时间仍未审核，系统已取消并退回 ' + amount.toFixed(2) + ' USDT',
                { adId: row.adId, orderId: order.id });
            refundOrder(order.id, amount, ticket.reason, 'rf-auto-expire-' + order.id, { trustedAmount: amount });
            refunding++;
        });
        try {
            global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        } catch (e) { /* ignore */ }
        FLAdStore.pushOpLog({
            action: '超时未审自动取消',
            target: targets.map(function (t) { return t.adId; }).join(','),
            reason: '共 ' + targets.length + ' 条'
        });
        return ok({ expired: targets.length, refunding: refunding });
    }

    function adminReviewAd(adId, approve, reason, by) {
        var perm = requireAdminPerm('review');
        if (!perm.ok) return perm;
        expireStalePendingReviewAds();
        var ad = FLAdStore.getAd(adId);
        if (!ad) return fail('广告不存在');
        if (ad.auditStatus !== 'pending_review') {
            return fail('该广告已不在待审队列（可能因超过开始时间已自动取消并退款）');
        }
        if (approve) {
            var startMs = toMs(ad.startAt);
            if (startMs != null && startMs <= Date.now()) {
                expireStalePendingReviewAds();
                return fail('已超过投放开始时间，不可再通过；系统将自动取消并退款');
            }
            ad.auditStatus = 'approved';
            ad.rejectReason = '';
            syncDeliveryFromTime(ad);
            ad.auditLog = ad.auditLog || [];
            ad.auditLog.push({ at: new Date().toISOString(), by: by || '审核员', action: '审核通过', note: reason || '' });
            FLAdStore.upsertAd(ad);
            pushNotice(ad.advertiserUid, 'audit_pass', '广告审核通过', (ad.name || ad.id) + ' 已通过审核', { adId: ad.id });
            if (ad.deliveryStatus === 'delivering') {
                pushNotice(ad.advertiserUid, 'delivery_start', '投放已开始', (ad.name || ad.id) + ' 已开始展示', { adId: ad.id });
            } else if (ad.deliveryStatus === 'pending_start') {
                pushNotice(ad.advertiserUid, 'audit_pass', '待投放', (ad.name || ad.id) + ' 将于开始时间自动投放', { adId: ad.id });
            }
            return ok({ ad: ad });
        }
        if (!reason || !String(reason).trim()) return fail('驳回须填写原因');
        ad.auditStatus = 'rejected';
        ad.rejectReason = String(reason).trim();
        ad.deliveryStatus = 'pending_start';
        ad.auditLog = ad.auditLog || [];
        ad.auditLog.push({ at: new Date().toISOString(), by: by || '审核员', action: '审核驳回', note: ad.rejectReason });
        FLAdStore.upsertAd(ad);
        pushNotice(ad.advertiserUid, 'audit_reject', '广告审核未通过', ad.rejectReason, { adId: ad.id });
        return ok({ ad: ad });
    }

    function settleOrderOnEnd(ad, note) {
        if (!ad) return;
        var data = FLAdStore.load();
        var order = (data.orders || []).filter(function (o) {
            return o.id === ad.orderId || o.adId === ad.id;
        })[0];
        if (!order || !(order.frozen > 0)) return;
        var amt = order.frozen;
        order.frozen = 0;
        data.account.frozen = Math.max(0, (data.account.frozen || 0) - amt);
        data.account.spent = (data.account.spent || 0) + amt;
        data.finance.unshift({
            id: 'FIN-SP-' + Date.now(),
            uid: order.uid,
            type: 'spend',
            amount: -amt,
            status: 'success',
            at: new Date().toISOString(),
            orderNo: order.id,
            note: note || '投放结束，冻结转消耗'
        });
        FLAdStore.save(data);
        if (!note) {
            pushNotice(order.uid, 'delivery_end', '投放已结束', (ad.name || ad.id) + ' 投放结束，冻结资金已结算', { adId: ad.id, orderId: order.id });
        }
    }

    function bumpContentVersion(ad, fields) {
        ad.contentVersion = (ad.contentVersion || 1) + 1;
        ad.versions = ad.versions || [];
        ad.versions.unshift({
            version: ad.contentVersion,
            at: new Date().toISOString(),
            fields: fields,
            auditStatus: 'pending_review'
        });
        var wasApproved = ad.auditStatus === 'approved';
        ad.auditStatus = 'pending_review';
        ad.rejectReason = '';
        if (wasApproved) ad.deliveryStatus = 'pending_start';
        return ad;
    }

    /**
     * 驳回后改套餐或排期。
     * 更换套餐：原订单未开投则退回余额，并在同一事务内扣新套餐款（当场支付成功才落库变更）；
     * 余额不足（含退回后）则整笔失败、不改套餐。不再产生待支付广告/订单。
     */
    function changePackageOnRejected(adId, packageId, startAt) {
        var data = FLAdStore.load();
        var ad = (data.ads || []).filter(function (a) { return a.id === adId; })[0];
        if (!ad) return fail('广告不存在');
        var canChange = ad.auditStatus === 'rejected' || ad.auditStatus === 'draft' || ad.auditStatus === 'none';
        if (!canChange) {
            return fail('当前状态不可改套餐（仅驳回或未提交时可改）');
        }
        if (ad.payStatus !== 'paid' && ad.payStatus !== 'partial_refunded' && ad.payStatus !== 'none') {
            return fail('广告支付状态异常，请重新创建');
        }
        if (ad.deliveryStatus === 'delivering' || ad.deliveryStatus === 'active') {
            return fail('投放中不可改套餐，请先暂停');
        }
        var pkg = getPackage(packageId);
        if (!pkg) return fail('套餐不存在');
        if (!pkg.enabled) return fail('套餐已停售');
        if (startAt) ad.startAt = startAt;
        if (!ad.startAt) return fail('请设置投放开始时间');
        var startMs = toMs(ad.startAt);
        if (startMs != null && startMs <= Date.now()) {
            return fail('投放开始时间须晚于当前时间');
        }
        var samePkg = ad.packageId === packageId;
        /* 先校验排期，再动账，避免半截扣款 */
        var schPre = applyPackageSchedule(ad, packageId);
        if (!schPre.ok) return schPre;
        var schPay = assertSchedulePayable(ad);
        if (!schPay.ok) return schPay;

        if (samePkg) {
            ad.slotCode = pkg.slotCode;
            FLAdStore.save(data);
            try {
                global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
            } catch (e) { /* ignore */ }
            return ok({ ad: ad, needPay: false, samePackage: true });
        }

        var paidOrd = (data.orders || []).filter(function (o) {
            return o.adId === adId && (o.payStatus === 'paid' || o.payStatus === 'partial_refunded');
        })[0];
        var back = 0;
        if (paidOrd) {
            back = Math.max(0, (paidOrd.paidAmount || paidOrd.priceSnapshot || 0) - (paidOrd.refundedAmount || 0));
        }
        var price = pkg.priceUsdt;
        var bal = data.account.balance || 0;
        if (bal + back < price) {
            return fail('余额不足（含原套餐退回后仍差 ' + (price - bal - back).toFixed(2) + ' USDT），无法更换套餐');
        }

        if (paidOrd) {
            if (back > 0) {
                data.account.balance = bal + back;
                data.account.frozen = Math.max(0, (data.account.frozen || 0) - (paidOrd.frozen || back));
                data.account.refunded = (data.account.refunded || 0) + back;
                paidOrd.refundedAmount = (paidOrd.refundedAmount || 0) + back;
                data.finance = data.finance || [];
                data.finance.unshift({
                    id: 'FIN-RF-PKG-' + Date.now(),
                    uid: ad.advertiserUid,
                    type: 'refund',
                    amount: back,
                    status: 'success',
                    at: new Date().toISOString(),
                    orderNo: paidOrd.id,
                    note: '改套餐·原订单退回（未开投）'
                });
            }
            paidOrd.frozen = 0;
            paidOrd.payStatus = 'refunded';
            paidOrd.refundableAmount = 0;
        }

        data.account.balance = (data.account.balance || 0) - price;
        data.account.frozen = (data.account.frozen || 0) + price;
        var newOrder = {
            id: 'ORD' + Date.now(),
            adId: adId,
            uid: ad.advertiserUid,
            packageId: pkg.id,
            packageName: pkg.name,
            slotCode: pkg.slotCode,
            priceSnapshot: price,
            durationDays: pkg.durationDays,
            payStatus: 'paid',
            paidAmount: price,
            refundedAmount: 0,
            refundableAmount: price,
            frozen: price,
            paidAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            idempotencyPaid: 'pkg-swap-' + adId + '-' + Date.now()
        };
        data.orders = data.orders || [];
        data.orders.unshift(newOrder);
        data.finance = data.finance || [];
        data.finance.unshift({
            id: 'FIN-FZ-PKG-' + Date.now(),
            uid: ad.advertiserUid,
            type: 'freeze',
            amount: price,
            status: 'success',
            at: new Date().toISOString(),
            orderNo: newOrder.id,
            note: '改套餐·新订单支付冻结'
        });

        ad.slotCode = pkg.slotCode;
        ad.packageId = pkg.id;
        ad.packageName = pkg.name;
        ad.priceUsdt = price;
        ad.orderId = newOrder.id;
        ad.payStatus = 'paid';
        ad.deliveryStatus = 'pending_start';
        FLAdStore.save(data);
        try {
            global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        } catch (e) { /* ignore */ }
        pushNotice(ad.advertiserUid, 'pay_ok', '套餐已更换', '已退回原套餐并完成新套餐支付', { adId: adId, orderId: newOrder.id });
        return ok({ ad: ad, needPay: false, samePackage: false, paid: true, order: newOrder });
    }

    /**
     * 轻量一致性修复。
     * 注意：不要在列表刷新时 discard unpaid —— 创编支付过程会短暂写入 unpaid，
     * 若此处丢弃会导致 createOrder 报「广告或套餐不存在」。残留清理见 purgeUnpaidUserAds。
     */
    function healAdPayOrderConsistency(adId) {
        var data = FLAdStore.load();
        var ad = (data.ads || []).filter(function (a) { return a.id === adId; })[0];
        if (!ad) return null;
        var orders = (data.orders || []).filter(function (o) { return o.adId === adId; });
        var paid = orders.filter(function (o) {
            return o.payStatus === 'paid' || o.payStatus === 'partial_refunded' || o.payStatus === 'refund_processing';
        })[0];
        if (paid && ad.orderId !== paid.id) {
            ad.orderId = paid.id;
            FLAdStore.save(data);
        }
        return FLAdStore.getAd(adId) || ad;
    }

    function updateAdContent(adId, patch) {
        var ad = FLAdStore.getAd(adId);
        if (!ad) return fail('广告不存在');
        if (findRefundInFlight(adId)) return fail('退款审核中，暂不可修改');
        if (ad.deliveryStatus === 'delivering' || ad.deliveryStatus === 'active') {
            return fail('投放中不可修改，请先暂停');
        }
        if (ad.auditStatus === 'approved' && ad.deliveryStatus !== 'paused' && ad.deliveryStatus !== 'pending_start') {
            return fail('当前状态不可修改');
        }
        var sensitive = ['materialUrl', 'materials', 'brandLogoUrl', 'title', 'copy', 'landingUrl', 'landingType'];
        var touched = sensitive.filter(function (k) { return patch[k] !== undefined && patch[k] !== ad[k]; });
        Object.keys(patch).forEach(function (k) { ad[k] = patch[k]; });
        var needsReReview = false;
        if (touched.length && ad.auditStatus === 'approved') {
            bumpContentVersion(ad, touched);
            needsReReview = true;
        }
        if (patch.landingUrl) {
            var v = validateLink(patch.landingUrl);
            if (!v.ok) return v;
        }
        if (patch.brandLogoUrl !== undefined && !String(patch.brandLogoUrl || '').trim()) {
            return fail('请上传品牌头像 / LOGO');
        }
        FLAdStore.upsertAd(ad);
        return ok({ ad: ad, reReview: needsReReview });
    }

    function submitForReview(adId) {
        var ad = FLAdStore.getAd(adId);
        if (!ad) return fail('广告不存在');
        if (ad.payStatus !== 'paid') return fail('请先完成套餐支付');
        var v = validateLink(ad.landingUrl);
        if (!v.ok) return v;
        if (!ad.brandLogoUrl) return fail('请上传品牌头像 / LOGO');
        var mats = Array.isArray(ad.materials) ? ad.materials : [];
        if (!ad.materialUrl && !mats.length) return fail('请上传素材');
        if (ad.materialMeta) {
            if (!ad.materialMeta.validated) return fail('请上传符合规范的素材');
            if (mats.length) {
                var i;
                for (i = 0; i < mats.length; i++) {
                    var matItem = validateMaterial(ad.slotCode, mats[i]);
                    if (!matItem.ok) return matItem;
                }
                var rule = MATERIAL_RULES[ad.slotCode];
                var kind0 = mats[0] && mats[0].kind;
                if (kind0 === 'video' && mats.length > 1) return fail('视频只能上传 1 个');
                if (kind0 === 'image' && rule && mats.length > (rule.maxImages || 1)) {
                    return fail('图片最多 ' + rule.maxImages + ' 张');
                }
            } else {
                var mat = validateMaterial(ad.slotCode, ad.materialMeta);
                if (!mat.ok) return mat;
            }
        }
        var sch = validatePackageSchedule(ad);
        if (!sch.ok) return sch;
        ad.auditStatus = 'pending_review';
        FLAdStore.upsertAd(ad);
        pushNotice(ad.advertiserUid, 'audit_pending', '已重新提交审核', (ad.name || ad.id) + ' 已进入待审核', { adId: ad.id });
        return ok();
    }

    /**
     * 暂停：仅投放中可操作。
     * 【产品/研发】竞价广告（Meta/Google/TikTok）普遍有暂停且不计费；
     * 本产品为一口价排期套餐，暂停须冻结剩余天数并在恢复时顺延 endAt，
     * 否则「剩 5 天却空转日历」不合理。风控强制停投可用运营下架。
     */
    /** 退款审核中 / 退款处理中：锁定修改、恢复、下架等投放侧变更 */
    function findRefundInFlight(adId) {
        var tickets = (FLAdStore.getRefunds ? FLAdStore.getRefunds() : []).filter(function (t) {
            return t.adId === adId && (t.status === 'pending' || t.status === 'processing');
        });
        if (tickets[0]) return tickets[0];
        var ord = (FLAdStore.getOrders() || []).filter(function (o) {
            return o.adId === adId && o.payStatus === 'refund_processing';
        })[0];
        return ord ? { status: 'processing', orderId: ord.id, adId: adId } : null;
    }

    function pauseAd(adId, reason) {
        var ad = FLAdStore.getAd(adId);
        if (!ad) return fail('广告不存在');
        if (findRefundInFlight(adId)) return fail('退款处理中，暂不可暂停');
        if (ad.deliveryStatus !== 'delivering' && ad.deliveryStatus !== 'active') return fail('仅投放中的广告可暂停');
        if (ad.auditStatus !== 'approved') return fail('审核未通过，无法暂停');
        ad.deliveryStatus = 'paused';
        ad.pauseReason = reason || '';
        ad.pausedAt = new Date().toISOString();
        FLAdStore.upsertAd(ad);
        FLAdStore.pushOpLog({ action: '暂停', target: adId, reason: reason || '用户暂停（剩余天数冻结）' });
        global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        return ok({ pausedAt: ad.pausedAt, endAt: ad.endAt });
    }

    function resumeAd(adId) {
        var ad = FLAdStore.getAd(adId);
        if (!ad) return fail('广告不存在');
        if (findRefundInFlight(adId)) return fail('退款审核中，暂不可恢复投放');
        if (ad.deliveryStatus !== 'paused') return fail('当前状态不可恢复');
        var adv = advertiser(ad.advertiserUid);
        if (adv && (adv.accountStatus === 'restricted' || adv.accountStatus === 'disabled')) {
            return fail('广告主账号受限，无法恢复投放');
        }
        if (ad.auditStatus !== 'approved') return fail('审核未通过或待审，无法恢复');
        if (ad.payStatus !== 'paid' && ad.payStatus !== 'none' && ad.payStatus !== 'partial_refunded') {
            return fail('订单未支付成功');
        }
        var pauseMs = 0;
        var pausedAtMs = toMs(ad.pausedAt);
        if (pausedAtMs != null) pauseMs = Math.max(0, Date.now() - pausedAtMs);
        if (pauseMs > 0) {
            var endMs = toMs(ad.endAt);
            if (endMs != null) ad.endAt = new Date(endMs + pauseMs).toISOString();
            ad.pauseTotalMs = (ad.pauseTotalMs || 0) + pauseMs;
        }
        ad.pausedAt = '';
        ad.resumedAt = new Date().toISOString();
        ad.deliveryStatus = 'delivering';
        syncDeliveryFromTime(ad);
        if (ad.deliveryStatus === 'ended') {
            FLAdStore.upsertAd(ad);
            return fail('剩余投放时间已用尽，无法恢复');
        }
        FLAdStore.upsertAd(ad);
        FLAdStore.pushOpLog({
            action: '恢复',
            target: adId,
            reason: pauseMs ? ('排期顺延 ' + Math.round(pauseMs / 3600000) + ' 小时') : '恢复投放'
        });
        global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        return ok({ endAt: ad.endAt, extendedMs: pauseMs });
    }

    /**
     * 下架：永久停止展示，不可恢复（与暂停不同）；用户端不可重新上架，需新建广告。
     * 用户侧：审核通过 + 已暂停 + 无退款在途。
     * 运营侧（opts.force）：投放中 / 暂停 / 待开始均可强制下架；须填写原因。
     * opts.feeAction：
     *   - forfeit（默认）：不自动退款，剩余冻结结转为已消费
     *   - refund_remaining：按下架前剩余天数生成退款单（待财务审核）
     */
    function removeAd(adId, reason, opts) {
        opts = opts || {};
        var ad = FLAdStore.getAd(adId);
        if (!ad) return fail('广告不存在');
        if (ad.deliveryStatus === 'removed') return fail('广告已下架');
        if (ad.deliveryStatus === 'ended') return fail('广告已结束，无需下架');
        var reasonText = String(reason || '').trim();
        if (opts.force) {
            if (!reasonText || reasonText.length < 4) return fail('请填写平台下架原因（至少 4 个字）');
            if (reasonText.length > 200) return fail('下架原因请控制在 200 字以内');
        }
        if (!opts.force && findRefundInFlight(adId)) return fail('退款审核中，暂不可下架');
        if (!opts.force) {
            if (ad.auditStatus !== 'approved') return fail('仅审核通过的广告可下架');
            if (ad.deliveryStatus !== 'paused') return fail('请先暂停后再下架');
        } else if (
            ad.deliveryStatus !== 'paused' &&
            ad.deliveryStatus !== 'delivering' &&
            ad.deliveryStatus !== 'active' &&
            ad.deliveryStatus !== 'pending_start'
        ) {
            return fail('当前投放状态不可下架');
        }

        var feeAction = opts.feeAction === 'refund_remaining' ? 'refund_remaining' : 'forfeit';
        var refundTicket = null;
        var dataPre = FLAdStore.load();
        var order = (dataPre.orders || []).filter(function (o) {
            return o.adId === adId || o.id === ad.orderId;
        })[0];

        /* 须在改为 removed 前报价，否则剩余天数会被算成 0 */
        if (opts.force && feeAction === 'refund_remaining' && order &&
            (order.payStatus === 'paid' || order.payStatus === 'partial_refunded')) {
            var quote = computeRefundQuote(order, ad);
            if (quote.ok && quote.maxRefundNow > 0) {
                dataPre.refunds = dataPre.refunds || [];
                refundTicket = {
                    id: 'RF' + Date.now(),
                    orderId: order.id,
                    adId: adId,
                    uid: order.uid,
                    amount: quote.maxRefundNow,
                    reason: '平台下架退剩余天数：' + reasonText,
                    status: 'pending',
                    formulaText: quote.formulaText,
                    consumedDays: quote.consumedDays,
                    remainingDays: quote.remainingDays,
                    durationDays: quote.durationDays,
                    source: 'platform_remove',
                    createdAt: new Date().toISOString()
                };
                dataPre.refunds.unshift(refundTicket);
                order.refundTicketId = refundTicket.id;
                FLAdStore.save(dataPre);
            }
        }

        ad.deliveryStatus = 'removed';
        ad.removedReason = reasonText || (opts.force ? '平台下架' : '用户主动下架');
        ad.removedAt = new Date().toISOString();
        ad.removedBy = opts.force ? 'platform' : 'user';
        ad.removedFeeAction = opts.force ? feeAction : 'user';
        /* 下架后关闭上架审核队列：待审 → 未提交；已通过/已失败保留结果供留档 */
        if (ad.auditStatus === 'pending_review' || ad.auditStatus === 'draft') {
            ad.auditStatus = 'none';
            ad.auditLog = ad.auditLog || [];
            ad.auditLog.push({
                at: new Date().toISOString(),
                by: opts.force ? '运营' : '用户',
                action: '关闭上架审核',
                note: '广告已下架，上架审核队列关闭'
            });
        }
        FLAdStore.upsertAd(ad);

        if (opts.force && feeAction === 'forfeit') {
            settleOrderOnEnd(ad, '平台下架，剩余冻结结转为已消费（不退款）');
        }

        var feeNote = !opts.force
            ? ''
            : (feeAction === 'refund_remaining'
                ? (refundTicket
                    ? ('；已生成退款单 ' + refundTicket.id + '（' + refundTicket.amount.toFixed(2) + ' USDT，待财务审核）')
                    : '；当前无可退金额，未生成退款单')
                : '；费用不退，剩余冻结已结转为消耗');

        pushNotice(
            ad.advertiserUid,
            'delivery_end',
            opts.force ? '广告已被平台下架' : '广告已下架',
            (ad.name || ad.id) + ' 已停止展示，不可恢复投放，如需继续请新建广告。原因：' +
                (ad.removedReason || '—') + feeNote,
            { adId: ad.id }
        );
        FLAdStore.pushOpLog({
            action: opts.force ? '运营强制下架' : '下架',
            target: adId,
            reason: reasonText + (opts.force ? (' · 费用=' + feeAction) : '')
        });
        global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        return ok({ feeAction: feeAction, refundTicket: refundTicket });
    }

    /**
     * 用户侧删除已下架广告（软删）。
     *
     * 【研发注意 / Backend】
     * - 用户「删除」仅写入 userDeleted / userDeletedAt，从广告主列表隐藏。
     * - 后台广告管理、订单、支付/退款、审核与操作日志必须永久留档，禁止物理删除。
     * - 管理端列表默认仍可见该广告（可标「用户已删除」）；审计与财务对账不因用户删列表而丢失。
     */
    function deleteAdForUser(adId) {
        var ad = FLAdStore.getAd(adId);
        if (!ad) return fail('广告不存在');
        if (ad.userDeleted) return fail('广告已从列表移除');
        if (ad.deliveryStatus !== 'ended' && ad.deliveryStatus !== 'removed') {
            return fail('仅已结束或已下架的广告可删除');
        }
        ad.userDeleted = true;
        ad.userDeletedAt = new Date().toISOString();
        FLAdStore.upsertAd(ad);
        FLAdStore.pushOpLog({ action: '用户删除（软删·后台留档）', target: adId, reason: '用户从列表移除；后台与订单记录保留' });
        global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        return ok({ archived: true });
    }

    /**
     * 用户举报广告 → 写入风控事件（后台 ads-risk 展示）
     * 同用户同广告 10 分钟内去重。
     */
    function reportAd(adId, opts) {
        opts = opts || {};
        var ad = FLAdStore.getAd(adId);
        if (!ad) return fail('广告不存在');
        var reasonLabel = String(opts.reason || opts.reasonLabel || '').trim();
        if (!reasonLabel) return fail('请选择举报原因');
        var desc = String(opts.desc || '').trim();
        if (desc.length > 500) return fail('补充说明请控制在 500 字以内');
        var uid = opts.uid || FLAdStore.DEMO_UID || 'demo-viewer';
        var data = FLAdStore.load();
        data.risk = data.risk || [];
        var now = Date.now();
        var dup = data.risk.some(function (r) {
            if (!r || r.type !== 'report' || r.adId !== adId || r.uid !== uid) return false;
            var t = new Date(r.at).getTime();
            return !isNaN(t) && (now - t) < 10 * 60 * 1000;
        });
        if (dup) return fail('你已举报过该广告，请稍后再试');
        var reasonText = reasonLabel + (desc ? ('；' + desc) : '');
        var row = {
            id: 'RK' + Date.now(),
            type: 'report',
            adId: adId,
            adName: ad.name || ad.title || '',
            uid: uid,
            reason: reasonText,
            reasonLabel: reasonLabel,
            reasonId: opts.reasonId || '',
            detail: desc,
            at: new Date().toISOString(),
            status: 'open',
            source: opts.source || 'user'
        };
        data.risk.unshift(row);
        FLAdStore.save(data);
        FLAdStore.pushOpLog({
            action: '用户举报广告',
            target: adId,
            reason: reasonText,
            by: uid
        });
        global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        return ok(row);
    }

    function getDeliveringAds(slotCode, ctx) {
        ctx = ctx || {};
        var list = FLAdStore.getAds().filter(function (a) {
            syncDeliveryFromTime(a, false);
            if (a.auditStatus !== 'approved') return false;
            if (a.payStatus !== 'paid' && a.payStatus !== 'none' && a.source === 'user') return false;
            if (a.source === 'platform' && a.payStatus !== 'none' && a.payStatus !== 'paid') return false;
            if (a.deliveryStatus !== 'delivering') return false;
            if (slotCode && a.slotCode !== slotCode) return false;
            var slot = FLAdStore.getSlots().filter(function (s) { return s.code === a.slotCode; })[0];
            if (slot && slot.enabled === false) return false;
            var adv = advertiser(a.advertiserUid);
            if (adv && (adv.accountStatus === 'restricted' || adv.accountStatus === 'disabled')) return false;
            if (!audienceMatches(a, ctx)) return false;
            if (!underFreqCap(a, ctx.viewerId)) return false;
            return true;
        });
        if (slotCode) return rankAdsForDelivery(list, slotCode, ctx);
        /* 未指定位：按位分别排序后拼接，避免混排冲刷某一广告位 */
        var out = [];
        ['feed_video', 'home_banner', 'live_room'].forEach(function (code) {
            var part = list.filter(function (a) { return a.slotCode === code; });
            out = out.concat(rankAdsForDelivery(part, code, ctx));
        });
        return out;
    }

    function adminRole() {
        try { return localStorage.getItem('fl_ad_admin_role') || 'super'; } catch (e) { return 'super'; }
    }

    function requireAdminPerm(perm) {
        var role = adminRole();
        var rbac = FLAdStore.getRbac();
        var row = rbac[role] || rbac.operator;
        var allowed = (row && row.ops) || ['view'];
        if (allowed.indexOf(perm) < 0) return fail('无权限：当前角色「' + role + '」不可执行此操作（审核与资金权限已隔离）');
        return ok();
    }

    function roleCanMenu(menuKey) {
        var role = adminRole();
        var rbac = FLAdStore.getRbac();
        var row = rbac[role] || rbac.operator;
        if (!row) return true;
        if (row.menus === '*' || (row.menus && row.menus.indexOf('*') >= 0)) return true;
        return (row.menus || []).indexOf(menuKey) >= 0;
    }

    function saveRbac(next) {
        var perm = requireAdminPerm('rbac');
        if (!perm.ok) return perm;
        var data = FLAdStore.load();
        data.rbac = next;
        FLAdStore.save(data);
        return ok();
    }

    function saveTargeting(next) {
        var data = FLAdStore.load();
        data.targeting = next;
        FLAdStore.save(data);
        return ok();
    }

    function saveFreqCaps(next) {
        var data = FLAdStore.load();
        data.freqCaps = next;
        FLAdStore.save(data);
        return ok();
    }

    function markNoticeRead(id) {
        var data = FLAdStore.load();
        (data.notices || []).forEach(function (n) { if (n.id === id) n.read = true; });
        FLAdStore.save(data);
        return ok();
    }

    function mockRecharge(amount) {
        var data = FLAdStore.load();
        data.account.balance += amount;
        data.finance.unshift({
            id: 'FIN-RC-' + Date.now(),
            uid: data.account.uid,
            type: 'recharge',
            amount: amount,
            status: 'success',
            at: new Date().toISOString(),
            orderNo: 'SIM-RC'
        });
        FLAdStore.save(data);
        return ok({ balance: data.account.balance });
    }

    global.FLAdService = {
        advertiser: advertiser,
        canCreatePaidAd: canCreatePaidAd,
        applyAdvertiser: applyAdvertiser,
        checkAdvertiserApplyPrerequisites: checkAdvertiserApplyPrerequisites,
        isKycApprovedForAds: isKycApprovedForAds,
        adminReviewAdvertiser: adminReviewAdvertiser,
        adminSetAdvertiserStatus: adminSetAdvertiserStatus,
        validateLink: validateLink,
        validateMaterial: validateMaterial,
        materialAccept: materialAccept,
        MATERIAL_RULES: MATERIAL_RULES,
        createOrder: createOrder,
        createAndPayAd: createAndPayAd,
        discardUnpaidAd: discardUnpaidAd,
        purgeUnpaidUserAds: purgeUnpaidUserAds,
        payOrder: payOrder,
        simulatePayFail: simulatePayFail,
        queryPayStatus: queryPayStatus,
        handlePayCallback: handlePayCallback,
        refundOrder: refundOrder,
        requestRefund: requestRefund,
        adminDecideRefund: adminDecideRefund,
        adminReviewAd: adminReviewAd,
        recordImpression: recordImpression,
        roleCanMenu: roleCanMenu,
        saveRbac: saveRbac,
        saveTargeting: saveTargeting,
        saveFreqCaps: saveFreqCaps,
        markNoticeRead: markNoticeRead,
        pushNotice: pushNotice,
        updateAdContent: updateAdContent,
        changePackageOnRejected: changePackageOnRejected,
        healAdPayOrderConsistency: healAdPayOrderConsistency,
        findRefundInFlight: findRefundInFlight,
        submitForReview: submitForReview,
        pauseAd: pauseAd,
        adminPauseAd: function (id, reason) {
            var perm = requireAdminPerm('pause');
            if (!perm.ok) return perm;
            return pauseAd(id, reason);
        },
        resumeAd: resumeAd,
        adminResumeAd: function (id) {
            var perm = requireAdminPerm('pause');
            if (!perm.ok) return perm;
            return resumeAd(id);
        },
        removeAd: removeAd,
        adminRemoveAd: function (id, reason, feeAction) {
            var perm = requireAdminPerm('pause');
            if (!perm.ok) return perm;
            return removeAd(id, reason, { force: true, feeAction: feeAction || 'forfeit' });
        },
        deleteAdForUser: deleteAdForUser,
        reportAd: reportAd,
        getDeliveringAds: getDeliveringAds,
        rankAdsForDelivery: rankAdsForDelivery,
        matchScore: matchScore,
        contentTagsOf: contentTagsOf,
        viewerInterestProfile: viewerInterestProfile,
        DELIVERY_RULES: DELIVERY_RULES,
        syncDeliveryFromTime: syncDeliveryFromTime,
        expireStalePendingReviewAds: expireStalePendingReviewAds,
        adminRole: adminRole,
        requireAdminPerm: requireAdminPerm,
        mockRecharge: mockRecharge,
        getPackage: getPackage,
        REFUND_SERVICE_FEE_RATE: REFUND_SERVICE_FEE_RATE,
        computeRefundQuote: computeRefundQuote,
        computeRefundQuoteForOrder: computeRefundQuoteForOrder,
        syncOrderRefundable: syncOrderRefundable,
        applyPackageSchedule: applyPackageSchedule,
        validatePackageSchedule: validatePackageSchedule,
        assertSchedulePayable: assertSchedulePayable
    };

    var _getDel = FLAdStore.getDeliveringAds;
    FLAdStore.getDeliveringAds = function (slot) { return global.FLAdService.getDeliveringAds(slot); };
})(typeof window !== 'undefined' ? window : this);
