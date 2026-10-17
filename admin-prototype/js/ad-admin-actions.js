/**
 * 运营后台 · 广告写操作（原型）
 */
(function (global) {
    if (!global.FLAdStore) return;

    function mutate(id, fn) {
        var ad = global.FLAdStore.getAd(id);
        if (!ad) return null;
        fn(ad);
        global.FLAdStore.upsertAd(ad);
        return ad;
    }

    global.FLAdAdmin = {
        approve: function (id, by, note) {
            return mutate(id, function (ad) {
                ad.auditStatus = 'approved';
                ad.rejectReason = '';
                var start = ad.startAt ? new Date(ad.startAt).getTime() : 0;
                ad.deliveryStatus = start > Date.now() ? 'pending_start' : 'delivering';
                ad.auditLog.push({ at: new Date().toISOString(), by: by || '审核员', action: '审核通过', note: note || '' });
            });
        },
        reject: function (id, reason, by) {
            if (!reason) return null;
            return mutate(id, function (ad) {
                ad.auditStatus = 'rejected';
                ad.rejectReason = reason;
                ad.deliveryStatus = 'pending';
                ad.auditLog.push({ at: new Date().toISOString(), by: by || '审核员', action: '审核拒绝', note: reason });
            });
        },
        pause: function (id, reason) {
            return mutate(id, function (ad) {
                if (ad.deliveryStatus === 'delivering' || ad.deliveryStatus === 'active') ad.deliveryStatus = 'paused';
                global.FLAdStore.pushOpLog({ action: '暂停广告', target: id, reason: reason || '' });
            });
        },
        resume: function (id) {
            return mutate(id, function (ad) {
                if (ad.deliveryStatus === 'paused') ad.deliveryStatus = 'delivering';
                global.FLAdStore.pushOpLog({ action: '恢复投放', target: id });
            });
        },
        remove: function (id, reason) {
            return mutate(id, function (ad) {
                ad.deliveryStatus = 'removed';
                global.FLAdStore.pushOpLog({ action: '下架广告', target: id, reason: reason || '' });
            });
        },
        savePlatformAd: function (payload) {
            var data = global.FLAdStore.load();
            var ad = payload.id ? global.FLAdStore.getAd(payload.id) : null;
            if (!ad) {
                ad = {
                    id: global.FLAdStore.nextAdId(),
                    source: 'platform',
                    advertiserUid: 'PLATFORM',
                    stats: { impressions: 0, clicks: 0, spend: 0, conversions: 0 },
                    auditLog: [],
                    createdAt: new Date().toISOString(),
                    payStatus: 'none',
                    auditStatus: payload.auditStatus || 'draft',
                    deliveryStatus: 'pending_start'
                };
            }
            Object.keys(payload).forEach(function (k) { if (payload[k] !== undefined) ad[k] = payload[k]; });
            ad.source = 'platform';
            ad.advertiserUid = 'PLATFORM';
            global.FLAdStore.upsertAd(ad);
            global.FLAdStore.pushOpLog({ action: '保存运营广告', target: ad.id });
            return ad;
        }
    };
})(typeof window !== 'undefined' ? window : this);
