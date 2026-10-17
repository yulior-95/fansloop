/**
 * 广告系统 · 一期业务规则与状态流转（原型，localStorage）
 * 依赖 FLAdStore；支付/审核/投放均为模拟，Toast/返回值会标明。
 */
(function (global) {
    if (!global.FLAdStore) return;

    var RISK_DOMAIN_BLOCK = ['evil-phish.test', 'malware.demo'];
    var IDEM = {};

    function fail(msg) { return { ok: false, message: msg }; }
    function ok(data) { return { ok: true, data: data || {} }; }

    function advertiser(uid) {
        uid = uid || FLAdStore.DEMO_UID;
        var data = FLAdStore.load();
        return (data.advertisers || []).filter(function (a) { return a.uid === uid; })[0] || null;
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

    function syncDeliveryFromTime(ad) {
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
        else if (now > end) ad.deliveryStatus = 'ended';
        else ad.deliveryStatus = 'delivering';
    }

    function applyAdvertiser(uid, payload) {
        var data = FLAdStore.load();
        data.advertisers = data.advertisers || [];
        var ex = advertiser(uid);
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
        var adv = advertiser(uid);
        if (!adv) return fail('广告主不存在');
        adv.accountStatus = approve ? 'approved' : 'rejected';
        adv.rejectReason = approve ? '' : (reason || '未填写');
        adv.reviewedAt = new Date().toISOString();
        FLAdStore.save(data);
        FLAdStore.pushOpLog({ action: approve ? '资质通过' : '资质驳回', target: uid, reason: reason });
        return ok();
    }

    function getPackage(pkgId) {
        return FLAdStore.load().packages.filter(function (p) { return p.id === pkgId; })[0];
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
        ad.orderId = order.id;
        ad.packageId = pkg.id;
        ad.packageName = pkg.name;
        ad.payStatus = 'unpaid';
        ad.priceUsdt = pkg.priceUsdt;
        FLAdStore.upsertAd(ad);
        FLAdStore.save(data);
        return ok({ order: order });
    }

    function payOrder(orderId, idempotencyKey) {
        idempotencyKey = idempotencyKey || 'pay-' + orderId;
        if (IDEM[idempotencyKey]) return IDEM[idempotencyKey];
        var data = FLAdStore.load();
        var order = (data.orders || []).filter(function (o) { return o.id === orderId; })[0];
        if (!order) { var r = fail('订单不存在'); IDEM[idempotencyKey] = r; return r; }
        if (order.payStatus === 'paid') { var r2 = ok({ order: order, note: '已支付（幂等）' }); IDEM[idempotencyKey] = r2; return r2; }
        if (order.payStatus === 'processing') { var r3 = ok({ order: order, note: '支付处理中' }); IDEM[idempotencyKey] = r3; return r3; }

        var acc = data.account;
        var price = order.priceSnapshot;
        if (acc.balance < price) {
            var r4 = fail('余额不足，还需 ' + (price - acc.balance).toFixed(2) + ' USDT');
            IDEM[idempotencyKey] = r4;
            return r4;
        }

        order.payStatus = 'processing';
        FLAdStore.save(data);

        setTimeout(function () {
            var d2 = FLAdStore.load();
            var o2 = d2.orders.filter(function (o) { return o.id === orderId; })[0];
            if (!o2 || o2.payStatus === 'paid') return;
            if (d2.account.balance < o2.priceSnapshot) {
                o2.payStatus = 'failed';
                FLAdStore.save(d2);
                return;
            }
            d2.account.balance -= o2.priceSnapshot;
            d2.account.spent = (d2.account.spent || 0) + o2.priceSnapshot;
            o2.payStatus = 'paid';
            o2.paidAmount = o2.priceSnapshot;
            o2.refundableAmount = o2.priceSnapshot;
            o2.paidAt = new Date().toISOString();
            o2.idempotencyPaid = idempotencyKey;
            d2.finance.unshift({
                id: 'FIN-P-' + Date.now(),
                uid: o2.uid,
                type: 'ad_purchase',
                amount: -o2.priceSnapshot,
                status: 'success',
                at: new Date().toISOString(),
                orderNo: o2.id
            });
            var ad = FLAdStore.getAd(o2.adId);
            if (ad) {
                ad.payStatus = 'paid';
                ad.auditStatus = ad.auditStatus === 'draft' ? 'pending_review' : ad.auditStatus;
                if (ad.auditStatus === 'approved') syncDeliveryFromTime(ad);
                FLAdStore.upsertAd(ad);
            }
            FLAdStore.save(d2);
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
        return ok();
    }

    function refundOrder(orderId, amount, reason, idempotencyKey) {
        idempotencyKey = idempotencyKey || 'ref-' + orderId;
        if (IDEM[idempotencyKey]) return IDEM[idempotencyKey];
        var data = FLAdStore.load();
        var order = (data.orders || []).filter(function (o) { return o.id === orderId; })[0];
        if (!order) return fail('订单不存在');
        if (order.payStatus !== 'paid' && order.payStatus !== 'partial_refunded') return fail('订单不可退款');
        var max = order.refundableAmount - (order.refundedAmount || 0);
        if (amount <= 0 || amount > max) return fail('可退金额不足，当前最多可退 ' + max.toFixed(2) + ' USDT');
        order.payStatus = 'refund_processing';
        FLAdStore.save(data);
        setTimeout(function () {
            var d2 = FLAdStore.load();
            var o2 = d2.orders.filter(function (o) { return o.id === orderId; })[0];
            if (!o2) return;
            o2.refundedAmount = (o2.refundedAmount || 0) + amount;
            o2.refundableAmount = Math.max(0, o2.paidAmount - o2.refundedAmount);
            d2.account.balance += amount;
            d2.account.refunded = (d2.account.refunded || 0) + amount;
            o2.payStatus = o2.refundableAmount <= 0 ? 'refunded' : 'partial_refunded';
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
            global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        }, 700);
        var r = ok({ processing: true });
        IDEM[idempotencyKey] = r;
        return r;
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

    function updateAdContent(adId, patch) {
        var ad = FLAdStore.getAd(adId);
        if (!ad) return fail('广告不存在');
        var sensitive = ['materialUrl', 'title', 'copy', 'landingUrl', 'landingType'];
        var touched = sensitive.filter(function (k) { return patch[k] !== undefined && patch[k] !== ad[k]; });
        Object.keys(patch).forEach(function (k) { ad[k] = patch[k]; });
        if (touched.length && ad.auditStatus === 'approved') bumpContentVersion(ad, touched);
        if (patch.landingUrl) {
            var v = validateLink(patch.landingUrl);
            if (!v.ok) return v;
        }
        FLAdStore.upsertAd(ad);
        return ok({ ad: ad, reReview: touched.length > 0 });
    }

    function submitForReview(adId) {
        var ad = FLAdStore.getAd(adId);
        if (!ad) return fail('广告不存在');
        if (ad.payStatus !== 'paid') return fail('请先完成套餐支付');
        var v = validateLink(ad.landingUrl);
        if (!v.ok) return v;
        if (!ad.materialUrl) return fail('请上传素材');
        ad.auditStatus = 'pending_review';
        FLAdStore.upsertAd(ad);
        return ok();
    }

    function pauseAd(adId, reason) {
        var ad = FLAdStore.getAd(adId);
        if (!ad) return fail('广告不存在');
        if (ad.deliveryStatus !== 'delivering') return fail('仅投放中的广告可暂停');
        ad.deliveryStatus = 'paused';
        ad.pauseReason = reason || '';
        ad.pausedAt = new Date().toISOString();
        FLAdStore.upsertAd(ad);
        FLAdStore.pushOpLog({ action: '暂停', target: adId, reason: reason });
        global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        return ok();
    }

    function resumeAd(adId) {
        var ad = FLAdStore.getAd(adId);
        if (!ad) return fail('广告不存在');
        if (ad.deliveryStatus !== 'paused') return fail('当前状态不可恢复');
        if (ad.deliveryStatus === 'removed' || ad.deliveryStatus === 'ended') return fail('已结束或已下架的广告不可恢复');
        var adv = advertiser(ad.advertiserUid);
        if (adv && (adv.accountStatus === 'restricted' || adv.accountStatus === 'disabled')) {
            return fail('广告主账号受限，无法恢复投放');
        }
        if (ad.auditStatus !== 'approved') return fail('审核未通过或待审，无法恢复');
        if (ad.payStatus !== 'paid') return fail('订单未支付成功');
        syncDeliveryFromTime(ad);
        if (ad.deliveryStatus === 'ended') return fail('投放周期已结束');
        ad.deliveryStatus = 'delivering';
        FLAdStore.upsertAd(ad);
        global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        return ok();
    }

    function removeAd(adId, reason) {
        var ad = FLAdStore.getAd(adId);
        if (!ad) return fail('广告不存在');
        ad.deliveryStatus = 'removed';
        ad.removedReason = reason || '';
        FLAdStore.upsertAd(ad);
        FLAdStore.pushOpLog({ action: '下架', target: adId, reason: reason });
        global.dispatchEvent(new CustomEvent('fl-ad-store-changed'));
        return ok();
    }

    function getDeliveringAds(slotCode) {
        var list = FLAdStore.getAds();
        return list.filter(function (a) {
            syncDeliveryFromTime(a);
            if (a.auditStatus !== 'approved') return false;
            if (a.payStatus !== 'paid' && a.source === 'user') return false;
            if (a.deliveryStatus !== 'delivering') return false;
            if (slotCode && a.slotCode !== slotCode) return false;
            var adv = advertiser(a.advertiserUid);
            if (adv && (adv.accountStatus === 'restricted' || adv.accountStatus === 'disabled')) return false;
            return true;
        });
    }

    function adminRole() {
        try { return localStorage.getItem('fl_ad_admin_role') || 'operator'; } catch (e) { return 'operator'; }
    }

    function requireAdminPerm(perm) {
        var role = adminRole();
        var map = {
            reviewer: ['review', 'view'],
            operator: ['view', 'review', 'pause'],
            finance: ['view', 'refund'],
            super: ['view', 'review', 'pause', 'refund', 'package', 'publish_skip_audit']
        };
        var allowed = map[role] || map.operator;
        if (allowed.indexOf(perm) < 0) return fail('无权限：当前角色「' + role + '」不可执行此操作');
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
        adminReviewAdvertiser: adminReviewAdvertiser,
        validateLink: validateLink,
        createOrder: createOrder,
        payOrder: payOrder,
        simulatePayFail: simulatePayFail,
        refundOrder: refundOrder,
        updateAdContent: updateAdContent,
        submitForReview: submitForReview,
        pauseAd: pauseAd,
        resumeAd: resumeAd,
        removeAd: removeAd,
        getDeliveringAds: getDeliveringAds,
        syncDeliveryFromTime: syncDeliveryFromTime,
        adminRole: adminRole,
        requireAdminPerm: requireAdminPerm,
        mockRecharge: mockRecharge,
        getPackage: getPackage
    };

    var _getDel = FLAdStore.getDeliveringAds;
    FLAdStore.getDeliveringAds = function (slot) { return global.FLAdService.getDeliveringAds(slot); };
})(typeof window !== 'undefined' ? window : this);
