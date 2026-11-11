/**
 * WEB 首页 · 广告展示
 * - home_banner：主栏顶部轮播（与 H5 同位能力）
 * - feed_video：竖滑原生帖，按投放密度插入
 */
(function () {
    if (!window.FLAdStore) return;

    var bannerTimer = null;

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/"/g, '&quot;');
    }

    function toast(msg) {
        if (typeof window.toast === 'function') window.toast(msg);
        else if (window.FLAdUser && FLAdUser.toast) FLAdUser.toast(msg);
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
            onDone: function () { /* 已写入 FLAdStore.risk */ }
        });
    }

    function deliveryRules(slot) {
        try {
            return (window.FLAdService && FLAdService.DELIVERY_RULES && FLAdService.DELIVERY_RULES[slot]) || {};
        } catch (e) {
            return {};
        }
    }

    function materialsOf(ad) {
        if (ad.materials && ad.materials.length) return ad.materials;
        if (ad.materialUrl) {
            return [{
                url: ad.materialUrl,
                type: ad.materialType || (/(\.mp4|\.webm|\.mov)(\?|$)/i.test(ad.materialUrl) ? 'video' : 'image')
            }];
        }
        return [];
    }

    function coverOf(ad) {
        var list = materialsOf(ad);
        return list[0] && list[0].url ? list[0].url : '';
    }

    function isVideoMat(m) {
        if (!m) return false;
        if (m.type === 'video') return true;
        return /(\.mp4|\.webm|\.mov)(\?|$)/i.test(m.url || '');
    }

    function ctaLabel() {
        return '查看详情';
    }

    function ctaGlassHtml(ad) {
        var tipId = 'devAdCtaTip_' + (ad.id || 'x');
        var tip =
            '落地为外部网页时：点击「查看详情」唤起系统浏览器打开链接（原型用 Toast 模拟）。' +
            '落地为主播主页时进入站内主页。按钮文案统一为「查看详情」，不区分「查看主页」。';
        return (
            '<span class="dev-glass-wrap dev-glass-wrap--feed dev-glass-wrap--pop-below ad-cta-glass">' +
            '<span class="dev-glass-sphere" tabindex="0" aria-describedby="' + tipId + '">' +
            '<span class="dev-glass-sphere-shine"></span>' +
            '<span class="dev-glass-sphere-txt">To 研发</span></span>' +
            '<span class="dev-glass-pop" id="' + tipId + '" role="tooltip">' + esc(tip) + '</span></span>'
        );
    }

    function advertiserBrand(ad) {
        try {
            var data = FLAdStore.load();
            var adv = (data.advertisers || []).filter(function (a) {
                return a.uid === ad.advertiserUid;
            })[0];
            if (adv && adv.companyName) return adv.companyName;
        } catch (e) { /* ignore */ }
        return ad.companyName || '品牌广告';
    }

    function advertiserAvatarHtml(ad, brand) {
        if (ad.brandLogoUrl) {
            return (
                '<div class="av av-md ad-feed-av has-logo" style="background-image:url(\'' +
                esc(ad.brandLogoUrl) +
                '\')" title="' + esc(brand || '') + '"></div>'
            );
        }
        var initial = String(brand || '广').charAt(0);
        return (
            '<div class="av av-md ad-feed-av" aria-hidden="true" title="' +
            esc(brand || '') +
            '">' + esc(initial) + '</div>'
        );
    }

    function openLanding(ad) {
        var url = ad.landingUrl || '';
        if (window.FLAdService && FLAdService.recordClick) FLAdService.recordClick(ad.id);
        if (ad.landingType === 'external') {
            toast(url ? ('已唤起系统浏览器打开：' + url + '（原型）') : '外链打开（原型）');
            return;
        }
        if (ad.landingType === 'creator' || ad.landingType === 'live') {
            toast(url ? ('进入主播主页：' + url + '（原型）') : '进入主播主页（原型）');
            return;
        }
        toast(url ? ('广告跳转：' + url + '（原型）') : '广告跳转（原型）');
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

    /** 频控打满时原型仍兜底展示投放中广告，但仍遵守单次会话上限 */
    function pickSlotAds(slot, ads) {
        var rules = deliveryRules(slot);
        var max = rules.maxPerSession || 3;
        var list = (ads || []).filter(function (a) { return a.slotCode === slot; });
        if (!list.length) {
            try {
                var all = (FLAdStore.getAds && FLAdStore.getAds()) || (FLAdStore.load().ads || []);
                list = all.filter(function (a) {
                    return a.slotCode === slot &&
                        a.auditStatus === 'approved' &&
                        (a.deliveryStatus === 'delivering' || a.deliveryStatus === 'active') &&
                        (a.payStatus === 'paid' || a.payStatus === 'none');
                });
                if (window.FLAdService && FLAdService.rankAdsForDelivery) {
                    list = FLAdService.rankAdsForDelivery(list, slot, {});
                }
            } catch (err) {
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
        } catch (err) { /* ignore */ }
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
        var banner = document.getElementById('flAdWebBanner');
        if (banner) banner.remove();
        document.querySelectorAll('.feed-stack-slide--ad, #flAdWebFeedSlide').forEach(function (el) {
            el.remove();
        });
    }

    function buildMediaHtml(ad) {
        var mats = materialsOf(ad);
        if (!mats.length) {
            return '<div class="post-media-wrap"><div class="post-media post-media--center ad-feed-media-empty">暂无素材</div></div>';
        }
        var first = mats[0];
        if (isVideoMat(first)) {
            var poster = (mats[1] && mats[1].url) || first.poster || coverOf(ad);
            return (
                '<div class="post-media-wrap">' +
                '<div class="post-media post-media--center post-media--video feed-video-wrap">' +
                '<video class="feed-stack-video" playsinline muted loop preload="metadata"' +
                (poster ? ' poster="' + esc(poster) + '"' : '') + '>' +
                '<source src="' + esc(first.url) + '" type="video/mp4"></video>' +
                '<div class="post-media-play feed-video-play-overlay" aria-hidden="true"><i class="fa-solid fa-play"></i></div>' +
                '</div></div>'
            );
        }
        var images = mats.filter(function (m) { return !isVideoMat(m); }).slice(0, 4);
        if (images.length >= 2) {
            return (
                '<div class="post-media-wrap"><div class="post-media post-media--center grid-2">' +
                images.map(function (m) {
                    return '<img class="feed-img-zoom" src="' + esc(m.url) + '" alt="">';
                }).join('') +
                '</div></div>'
            );
        }
        return (
            '<div class="post-media-wrap"><div class="post-media post-media--center">' +
            '<img class="feed-img-zoom" src="' + esc(images[0].url) + '" alt="' + esc(ad.title || '') + '">' +
            '</div></div>'
        );
    }

    function buildFeedAdSlide(ad) {
        var brand = advertiserBrand(ad);
        var copy = String(ad.copy || '').trim();
        var cta = ctaLabel();
        var slide = document.createElement('div');
        slide.className = 'feed-stack-slide feed-stack-slide--ad';
        slide.id = 'flAdWebFeedSlide-' + ad.id;
        slide.setAttribute('data-feed-id', 'stack-rec-ad-' + ad.id);
        slide.setAttribute('data-ad-id', ad.id);

        var textHtml = copy
            ? '<div class="post-text">' + esc(copy) + '</div>'
            : '';

        slide.innerHTML =
            '<article class="post-card post-card--immersive ad-feed-card" data-post-type="ad" data-ad-id="' + esc(ad.id) + '">' +
            '<div class="post-head ad-feed-head">' +
            advertiserAvatarHtml(ad, brand) +
            '<div class="pi-info">' +
            '<div class="name">' + esc(brand) + ' <span class="ad-label">广告</span></div>' +
            '<div class="pi-meta-row"><div class="meta ad-feed-meta-line">赞助内容</div>' +
            ctaGlassHtml(ad) +
            '</div></div>' +
            '<div class="pi-actions ad-feed-cta-wrap">' +
            '<button type="button" class="follow-btn ad-cta" data-ad-cta="1">' + esc(cta) + '</button>' +
            '</div></div>' +
            '<div class="post-card-body ad-feed-body">' +
            textHtml +
            buildMediaHtml(ad) +
            '</div>' +
            '<div class="post-actions ad-feed-foot">' +
            '<button type="button" class="a-btn ad-cta" data-ad-cta="1"><i class="fa-solid fa-arrow-up-right-from-square"></i><span>' + esc(cta) + '</span></button>' +
            '<button type="button" class="a-btn" data-ad-hide="1"><i class="fa-regular fa-eye-slash"></i><span>不感兴趣</span></button>' +
            '<button type="button" class="a-btn" data-ad-report="1"><i class="fa-regular fa-flag"></i><span>举报</span></button>' +
            '</div>' +
            '</article>';

        slide.querySelectorAll('[data-ad-cta]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                openLanding(ad);
            });
        });
        var hide = slide.querySelector('[data-ad-hide]');
        if (hide) hide.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            slide.remove();
            if (typeof window.FL_refreshFeedStacks === 'function') window.FL_refreshFeedStacks();
            toast('将减少此类广告（原型）');
        });
        var report = slide.querySelector('[data-ad-report]');
        if (report) report.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            openAdReport(ad);
        });
        return slide;
    }

    function bannerHost() {
        var tabs = document.getElementById('feedTabs');
        if (tabs && tabs.parentNode) return { parent: tabs.parentNode, before: tabs.nextSibling };
        var col = document.querySelector('.feed-main-col');
        if (col) return { parent: col, before: col.firstChild };
        return null;
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

    function injectBannerAds(ads) {
        var banners = pickSlotAds('home_banner', ads);
        var host = bannerHost();
        if (!banners.length || !host || bannerDismissed()) return;
        if (document.getElementById('flAdWebBanner')) return;

        var wrap = document.createElement('div');
        wrap.id = 'flAdWebBanner';
        wrap.className = 'ad-home-banner-carousel ad-home-banner-carousel--web';
        wrap.setAttribute('data-ad-slot', 'home_banner');

        banners.forEach(function (ad, i) {
            var slide = document.createElement('button');
            slide.type = 'button';
            slide.className = 'ad-home-banner' + (i === 0 ? ' is-on' : '');
            slide.setAttribute('data-ad-id', ad.id);
            slide.setAttribute('aria-label', '广告 ' + (ad.title || '品牌推广'));
            slide.innerHTML =
                '<span class="tag">广告</span>' +
                '<div class="ad-home-banner-inner">' +
                '<div class="ad-home-banner-copy"><b>' + esc(ad.title || '品牌推广') + '</b></div>' +
                '<div class="ad-home-banner-art" style="background-image:url(\'' + esc(coverOf(ad)) + '\')"></div>' +
                '</div>';
            slide.addEventListener('click', function () { openLanding(ad); });
            wrap.appendChild(slide);
            if (i === 0) recordImpressionOnce(ad.id);
        });

        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'ad-home-banner-close';
        closeBtn.setAttribute('aria-label', '关闭广告');
        closeBtn.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
        closeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dismissBanner(wrap);
        });
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
            clearBannerTimer();
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
    }

    function injectFeedAds(ads) {
        var feedAds = pickSlotAds('feed_video', ads);
        var track = document.getElementById('feedStackTrack');
        if (!feedAds.length || !track) return;
        if (track.querySelector('.feed-stack-slide--ad')) return;
        var interval = deliveryRules('feed_video').minContentBetween || 5;
        feedAds.forEach(function (feedAd, i) {
            var slide = buildFeedAdSlide(feedAd);
            var slides = track.querySelectorAll('.feed-stack-slide:not(.feed-stack-slide--ad)');
            var insertAt = interval * (i + 1) - 1;
            if (slides.length > insertAt) track.insertBefore(slide, slides[insertAt]);
            else track.appendChild(slide);
            recordImpressionOnce(feedAd.id);
        });
        if (typeof window.FL_refreshFeedStacks === 'function') window.FL_refreshFeedStacks();
    }

    function run() {
        var all = deliveringAds();
        injectBannerAds(all.length ? all : deliveringAds('home_banner'));
        injectFeedAds(all.length ? all : deliveringAds('feed_video'));
    }

    function scheduleRun() {
        setTimeout(run, 500);
        setTimeout(run, 1200);
    }

    window.addEventListener('fl-ad-store-changed', function () {
        removeInjected();
        scheduleRun();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleRun);
    } else {
        scheduleRun();
    }
})();
