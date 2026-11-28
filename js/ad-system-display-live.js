/**
 * 直播间推广卡 · H5 + WEB
 * 与首页 Banner 一致：素材铺满、左上「广告」、右上关闭；点击整条跳转
 */
(function (global) {
    if (!global.FLAdStore && !global.FLAdService) return;

    var PROMO_ID = 'flAdLivePromo';
    var DISMISS_KEY = 'fl_ad_live_promo_closed';
    var pendingTimers = [];
    var memoryDismissed = false;
    var bound = false;

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/"/g, '&quot;');
    }

    function toast(msg) {
        if (typeof global.toast === 'function') global.toast(msg);
        else if (global.FLAdUser && FLAdUser.toast) FLAdUser.toast(msg);
    }

    function isDismissed() {
        if (memoryDismissed) return true;
        try {
            if (sessionStorage.getItem(DISMISS_KEY) === '1') {
                memoryDismissed = true;
                return true;
            }
        } catch (e) { /* ignore */ }
        return false;
    }

    function clearPending() {
        while (pendingTimers.length) {
            clearTimeout(pendingTimers.pop());
        }
    }

    function removePromo() {
        var el = document.getElementById(PROMO_ID);
        if (el) el.remove();
    }

    function dismissPromo() {
        if (memoryDismissed && !document.getElementById(PROMO_ID)) return;
        memoryDismissed = true;
        try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) { /* ignore */ }
        clearPending();
        removePromo();
        toast('已关闭直播间广告（本次浏览）');
    }

    function pickLiveAd() {
        try {
            var list = global.FLAdService
                ? FLAdService.getDeliveringAds('live_room')
                : (FLAdStore.getDeliveringAds && FLAdStore.getDeliveringAds('live_room')) || [];
            return (list && list[0]) || null;
        } catch (e) {
            return null;
        }
    }

    function coverOf(ad) {
        if (!ad) return '';
        if (ad.materials && ad.materials[0] && ad.materials[0].url) return ad.materials[0].url;
        return ad.materialUrl || ad.brandLogoUrl || '';
    }

    /**
     * 解析插入锚点：{ parent, before }
     * WEB AB：播放器下方 / 简介上方
     * WEB A：播放器下方
     * H5：.lv-host 下方
     */
    function resolveHost() {
        var playerAb = document.getElementById('ldAbPlayer');
        if (playerAb && playerAb.parentNode) {
            return { parent: playerAb.parentNode, before: playerAb.nextSibling };
        }
        var playerA = document.getElementById('livePlayer');
        if (playerA && playerA.parentNode) {
            return { parent: playerA.parentNode, before: playerA.nextSibling };
        }
        var lvHost = document.querySelector('.lv-host');
        if (lvHost && lvHost.parentNode) {
            return { parent: lvHost.parentNode, before: lvHost.nextSibling };
        }
        var videoCol = document.querySelector('.ld-ab-video-col, .live-grid > div');
        if (videoCol) return { parent: videoCol, before: videoCol.firstChild };
        return null;
    }

    function openLanding(ad) {
        if (global.FLAdService && FLAdService.openAdLanding) {
            var res = FLAdService.openAdLanding(ad);
            if (res && res.ok === false) toast(res.message || '无法打开链接');
            else if (res && res.data && res.data.message) toast(res.data.message);
            return;
        }
        var url = ad.landingUrl || '';
        if (ad.landingType === 'external' && url) {
            var href = /^https?:\/\//i.test(url) ? url : ('https://' + url);
            try { global.open(href, '_blank', 'noopener,noreferrer'); } catch (e) { /* ignore */ }
            return;
        }
        toast(url ? ('广告跳转：' + url) : '广告跳转');
    }

    function closeTarget(e) {
        var t = e && e.target;
        if (!t || !t.closest) return null;
        return t.closest('.ad-live-promo-close');
    }

    function onCloseEvent(e) {
        if (!closeTarget(e)) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        dismissPromo();
    }

    function bindCloseOnce() {
        if (bound) return;
        bound = true;
        /* 用 pointerdown 立刻关闭，避免被页面其它层吃掉 click；不再在 mousedown 上 preventDefault 阻断 click */
        document.addEventListener('pointerdown', onCloseEvent, true);
        document.addEventListener('click', onCloseEvent, true);
    }

    global.__flAdLiveClose = function (e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        dismissPromo();
        return false;
    };

    function render() {
        if (isDismissed()) {
            removePromo();
            return;
        }
        var ad = pickLiveAd();
        var host = resolveHost();
        if (!ad || !host) {
            removePromo();
            return;
        }

        bindCloseOnce();

        var existing = document.getElementById(PROMO_ID);
        var cover = coverOf(ad);
        /* 同一条广告已在 DOM：不要重写 innerHTML，避免打断用户点击 */
        if (existing && existing.getAttribute('data-ad-id') === String(ad.id)) {
            return;
        }

        var label = ad.name || ad.id || '直播间广告';
        var el = existing || document.createElement('div');
        el.id = PROMO_ID;
        el.className = 'ad-live-promo' + (cover ? '' : ' ad-live-promo--empty');
        el.setAttribute('data-ad-id', ad.id);
        el.setAttribute('data-ad-slot', 'live_room');
        el.setAttribute('role', 'complementary');
        el.setAttribute('aria-label', '直播间广告');

        var art = cover
            ? '<div class="ad-live-promo-art" role="img" aria-label="' + esc(label) + '" style="background-image:url(\'' + esc(cover) + '\')"></div>'
            : '<div class="ad-live-promo-art ad-live-promo-art--fallback" aria-hidden="true"></div>';

        el.innerHTML =
            art +
            '<span class="ad-live-promo-tag">广告</span>' +
            '<button type="button" class="ad-live-promo-close" aria-label="关闭广告" onclick="return window.__flAdLiveClose && window.__flAdLiveClose(event)">' +
            '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' +
            '</button>';

        el.onclick = function (e) {
            if (isDismissed()) return;
            if (e.target && e.target.closest && e.target.closest('.ad-live-promo-close')) return;
            openLanding(ad);
        };

        if (!existing) host.parent.insertBefore(el, host.before);

        if (global.FLAdService && FLAdService.recordImpression) {
            var key = 'fl_ad_imp_sess_' + ad.id;
            try {
                if (sessionStorage.getItem(key) !== '1') {
                    sessionStorage.setItem(key, '1');
                    FLAdService.recordImpression(ad.id);
                }
            } catch (err) {
                try { FLAdService.recordImpression(ad.id); } catch (e2) { /* ignore */ }
            }
        }
    }

    function schedule() {
        if (isDismissed()) {
            removePromo();
            return;
        }
        clearPending();
        pendingTimers.push(setTimeout(render, 200));
        pendingTimers.push(setTimeout(render, 800));
    }

    global.FLAdLiveDisplayRefresh = function () {
        render();
    };

    global.addEventListener('fl-ad-store-changed', function () {
        schedule();
    });

    bindCloseOnce();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', schedule);
    } else {
        schedule();
    }
})(typeof window !== 'undefined' ? window : this);
