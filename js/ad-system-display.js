/**
 * 广告展示 · H5 首页 Banner 轮播 + Feed 密度插入
 * 不修改既有 DOM 结构，仅在容器内插入节点。
 * 注意：home.html 会 rebuild #homeFeedTrack，须在 Feed 就绪后重注。
 */
(function () {
    if (!window.FLAdStore) return;

    var bannerTimer = null;
    var injectScheduled = false;

    function toast(msg) {
        if (window.FLAdUser && FLAdUser.toast) FLAdUser.toast(msg);
        else if (window.DigitalH5Nav && DigitalH5Nav.toast) DigitalH5Nav.toast(msg);
        else alert(msg);
    }

    function openAdReport(ad) {
        if (!window.FL_ContentReport || !FL_ContentReport.open) {
            toast('举报组件未加载');
            return;
        }
        FL_ContentReport.open({
            type: 'ad',
            title: '举报广告',
            contentId: ad.id,
            contentTitle: ad.title || ad.name || ad.id,
            toast: toast,
            onDone: function () {
                /* 已写入 FLAdStore.risk，后台「广告风控」可见 */
            }
        });
    }

    function deliveryRules(slot) {
        try {
            return (window.FLAdService && FLAdService.DELIVERY_RULES && FLAdService.DELIVERY_RULES[slot]) || {};
        } catch (e) {
            return {};
        }
    }

    function isVideoUrl(url) {
        return /\.(mp4|webm|mov)(\?|$)/i.test(String(url || ''));
    }

    function coverOf(ad) {
        var mats = ad.materials || [];
        var i;
        for (i = 0; i < mats.length; i++) {
            if (mats[i] && mats[i].poster) return mats[i].poster;
        }
        for (i = 0; i < mats.length; i++) {
            if (mats[i] && mats[i].url && mats[i].type !== 'video' && !isVideoUrl(mats[i].url)) {
                return mats[i].url;
            }
        }
        if (ad.materialUrl && !isVideoUrl(ad.materialUrl)) return ad.materialUrl;
        if (mats[0] && mats[0].url && !isVideoUrl(mats[0].url)) return mats[0].url;
        return ad.materialUrl || '';
    }

    function deliveringAds(slot) {
        try {
            return (window.FLAdService
                ? FLAdService.getDeliveringAds(slot)
                : FLAdStore.getDeliveringAds(slot)) || [];
        } catch (err) {
            return [];
        }
    }

    function pickSlotAds(slot) {
        var rules = deliveryRules(slot);
        var max = rules.maxPerSession || 3;
        var list = deliveringAds(slot);
        if (!list.length) {
            try {
                var all = (FLAdStore.getAds && FLAdStore.getAds()) || (FLAdStore.load().ads || []);
                list = all.filter(function (a) {
                    return a.slotCode === slot &&
                        a.auditStatus === 'approved' &&
                        (a.deliveryStatus === 'delivering' || a.deliveryStatus === 'active') &&
                        (a.payStatus === 'paid' || a.payStatus === 'none') &&
                        !a.userDeleted;
                });
                if (window.FLAdService && FLAdService.rankAdsForDelivery) {
                    list = FLAdService.rankAdsForDelivery(list, slot, {});
                }
            } catch (e) {
                list = [];
            }
        }
        return list.slice(0, max);
    }

    function recordImpressionOnce(adId) {
        if (!adId || !window.FLAdService || !FLAdService.recordImpression) return;
        var key = 'fl_ad_imp_sess_' + adId;
        try {
            if (sessionStorage.getItem(key) === '1') return;
            sessionStorage.setItem(key, '1');
        } catch (e) { /* ignore */ }
        FLAdService.recordImpression(adId);
    }

    function clearBannerTimer() {
        if (bannerTimer) {
            clearInterval(bannerTimer);
            bannerTimer = null;
        }
    }

    function removeInjected() {
        clearBannerTimer();
        ['flAdHomeBanner', 'flAdFeedCard', 'flAdWebBanner', 'flAdWebFeed', 'flAdLivePromo'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.remove();
        });
        document.querySelectorAll(
            '.feed-page.ad-feed-card, .ad-home-banner-carousel, [id^="flAdFeedCard-"]'
        ).forEach(function (el) {
            el.remove();
        });
    }

    function refresh() {
        removeInjected();
        inject();
    }

    function bannerDismissed() {
        try { return sessionStorage.getItem('fl_ad_banner_closed') === '1'; } catch (e) { return false; }
    }

    function dismissBanner(wrap) {
        try { sessionStorage.setItem('fl_ad_banner_closed', '1'); } catch (e) { /* ignore */ }
        clearBannerTimer();
        if (wrap && wrap.parentNode) wrap.remove();
        toast('已关闭首页广告（本次浏览）');
    }

    function bannerHost() {
        /* 竖滑首页：插在顶部操作栏之后，绝不盖住搜索/推荐 Tab */
        var topNav = document.querySelector('.top-nav');
        if (topNav && topNav.parentNode) {
            return { parent: topNav.parentNode, before: topNav.nextSibling };
        }
        var host = document.querySelector('[data-ad-banner-host], .ad-banner-host, .app-content');
        if (host) return { parent: host, before: host.firstChild };
        return null;
    }

    function placeBannerBelowTopNav(wrap) {
        if (!wrap) return;
        /* absolute 相对 body（375 机身）；用 top-nav 相对机身的底部，避免挡住操作栏 */
        var topNav = document.querySelector('.top-nav');
        var body = document.body;
        var bodyTop = body.getBoundingClientRect().top;
        var navBottom = topNav
            ? (topNav.getBoundingClientRect().bottom - bodyTop)
            : 92;
        wrap.style.left = '12px';
        wrap.style.right = '12px';
        wrap.style.width = 'auto';
        wrap.style.top = Math.round(Math.max(0, navBottom) + 12) + 'px';
    }

    function injectBanner() {
        var banners = pickSlotAds('home_banner');
        var host = bannerHost();
        if (!banners.length || !host || bannerDismissed()) return;
        if (document.getElementById('flAdHomeBanner')) return;

        var wrap = document.createElement('div');
        wrap.id = 'flAdHomeBanner';
        wrap.className = 'ad-home-banner-carousel ad-home-banner-carousel--h5 ad-home-banner-carousel--dock';
        wrap.setAttribute('data-ad-slot', 'home_banner');

        banners.forEach(function (ad, i) {
            var el = document.createElement('div');
            el.className = 'ad-home-banner' + (i === 0 ? ' is-on' : '');
            el.setAttribute('data-ad-id', ad.id);
            el.setAttribute('aria-label', '广告 ' + (ad.title || ''));
            el.innerHTML =
                '<span class="tag">广告</span>' +
                '<div class="ad-home-banner-inner">' +
                '<div class="ad-home-banner-copy"><b>' + (ad.title || '').replace(/</g, '&lt;') + '</b></div>' +
                '<div class="ad-home-banner-art" style="background-image:url(\'' + coverOf(ad).replace(/'/g, '%27') + '\')"></div>' +
                '</div>';
            el.onclick = function () {
                if (window.FLAdService && FLAdService.recordClick) FLAdService.recordClick(ad.id);
                toast('跳转：' + (ad.landingUrl || '') + '（原型）');
            };
            wrap.appendChild(el);
            if (i === 0) recordImpressionOnce(ad.id);
        });

        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'ad-home-banner-close';
        closeBtn.setAttribute('aria-label', '关闭广告');
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            dismissBanner(wrap);
        };
        wrap.appendChild(closeBtn);

        if (banners.length > 1) {
            var dots = document.createElement('div');
            dots.className = 'ad-home-banner-dots';
            banners.forEach(function (_, i) {
                var d = document.createElement('span');
                d.className = 'ad-home-banner-dot' + (i === 0 ? ' is-on' : '');
                dots.appendChild(d);
            });
            wrap.appendChild(dots);
            var idx = 0;
            var rotateMs = deliveryRules('home_banner').rotateMs || 5000;
            bannerTimer = setInterval(function () {
                var slides = wrap.querySelectorAll('.ad-home-banner');
                var dotEls = wrap.querySelectorAll('.ad-home-banner-dot');
                if (slides.length < 2) return;
                slides[idx].classList.remove('is-on');
                if (dotEls[idx]) dotEls[idx].classList.remove('is-on');
                idx = (idx + 1) % slides.length;
                slides[idx].classList.add('is-on');
                if (dotEls[idx]) dotEls[idx].classList.add('is-on');
                recordImpressionOnce(slides[idx].getAttribute('data-ad-id'));
            }, rotateMs);
        }

        host.parent.insertBefore(wrap, host.before);
        placeBannerBelowTopNav(wrap);
        if (!window.__flAdBannerDockBound) {
            window.__flAdBannerDockBound = true;
            window.addEventListener('resize', function () {
                placeBannerBelowTopNav(document.getElementById('flAdHomeBanner'));
            });
            window.addEventListener('orientationchange', function () {
                setTimeout(function () {
                    placeBannerBelowTopNav(document.getElementById('flAdHomeBanner'));
                }, 80);
            });
        }
    }

    function injectFeed() {
        var feedAds = pickSlotAds('feed_video');
        var track = document.getElementById('homeFeedTrack') || document.querySelector('.feed-track');
        if (!feedAds.length || !track) return;
        if (track.querySelector('.feed-page.ad-feed-card')) return;
        var pages = track.querySelectorAll('.feed-page:not(.ad-feed-card)');
        if (!pages.length) return;

        var ruleGap = deliveryRules('feed_video').minContentBetween || 5;
        function relayoutFeedPages() {
            Array.prototype.forEach.call(track.querySelectorAll('.feed-page'), function (p, i) {
                p.style.transform = 'translateY(' + (i * 100) + '%)';
                p.setAttribute('data-feed-index', String(i));
            });
        }
        var contentCount = track.querySelectorAll('.feed-page:not(.ad-feed-card)').length;
        /* 内容条数不够时缩短间隔，避免广告全堆在末尾、滑不到 */
        var interval = Math.min(ruleGap, Math.max(2, Math.floor(contentCount / (feedAds.length + 1)) || 2));
        feedAds.forEach(function (feedAd, i) {
            var page = document.createElement('div');
            page.className = 'feed-page ad-feed-card';
            page.id = 'flAdFeedCard-' + feedAd.id;
            page.setAttribute('data-ad-id', feedAd.id);
            var feedCover = coverOf(feedAd);
            var feedCopy = String(feedAd.copy || feedAd.title || '').replace(/</g, '&lt;');
            page.innerHTML =
                '<div class="feed-video" style="background:url(\'' + feedCover.replace(/'/g, '%27') + '\') center/cover;height:100%">' +
                '<div class="gradient-overlay-bottom"></div>' +
                '</div>' +
                '<span class="ad-label ad-label--feed">广告</span>' +
                '<div class="action-bar ad-feed-actions">' +
                '<button type="button" class="action" data-ad-hide="1" aria-label="不感兴趣">' +
                '<i class="fa-solid fa-thumbs-down"></i><span class="count">不感兴趣</span>' +
                '</button>' +
                '<button type="button" class="action" data-ad-report="1" aria-label="举报">' +
                '<i class="fa-solid fa-triangle-exclamation"></i><span class="count">举报</span>' +
                '</button>' +
                '</div>' +
                '<div class="feed-info ad-feed-info">' +
                '<div class="ad-feed-copy">' + feedCopy + '</div>' +
                '<button type="button" class="ad-cta" data-ad-cta="1">' +
                '<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> 查看详情' +
                '</button>' +
                '</div>';

            var livePages = track.querySelectorAll('.feed-page:not(.ad-feed-card)');
            var insertAt = interval * (i + 1) - 1;
            if (livePages.length > insertAt) track.insertBefore(page, livePages[insertAt]);
            else if (livePages.length) track.insertBefore(page, livePages[livePages.length - 1].nextSibling);
            else track.appendChild(page);

            recordImpressionOnce(feedAd.id);
            page.querySelector('[data-ad-cta]').onclick = function (e) {
                e.stopPropagation();
                if (window.FLAdService && FLAdService.recordClick) FLAdService.recordClick(feedAd.id);
                toast('广告跳转（原型）');
            };
            page.querySelector('[data-ad-hide]').onclick = function (e) {
                e.stopPropagation();
                page.remove();
                relayoutFeedPages();
                toast('将减少此类广告（原型）');
            };
            page.querySelector('[data-ad-report]').onclick = function (e) {
                e.stopPropagation();
                openAdReport(feedAd);
            };
        });
        relayoutFeedPages();
    }

    function inject() {
        injectBanner();
        injectFeed();
    }

    function scheduleInject() {
        if (injectScheduled) return;
        injectScheduled = true;
        setTimeout(function () {
            injectScheduled = false;
            refresh();
        }, 0);
        setTimeout(refresh, 400);
        setTimeout(refresh, 1200);
    }

    window.FLAdDisplayRefresh = refresh;
    window.addEventListener('fl-ad-store-changed', scheduleInject);
    window.addEventListener('fl-home-feed-ready', scheduleInject);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleInject);
    } else {
        scheduleInject();
    }
})();
