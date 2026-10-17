/**
 * 广告展示 · 增量注入（首页 Banner / Feed 流 / 举报反馈）
 * 不修改既有 DOM 结构，仅在容器内插入节点。
 */
(function () {
    if (!window.FLAdStore) return;
    function refresh() {
        ['flAdHomeBanner', 'flAdFeedCard', 'flAdWebBanner', 'flAdWebFeed', 'flAdLivePromo'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.remove();
        });
        inject();
    }
    window.addEventListener('fl-ad-store-changed', refresh);
    function inject() {
    var ads = (window.FLAdService ? FLAdService.getDeliveringAds() : FLAdStore.getDeliveringAds());

    function toast(msg) {
        if (window.FLAdUser && FLAdUser.toast) FLAdUser.toast(msg);
        else alert(msg);
    }

    var banner = ads.filter(function (a) { return a.slotCode === 'home_banner'; })[0];
    if (banner) {
        var host = document.querySelector('.app-content') || document.querySelector('.feed-viewport') || document.body;
        if (host && !document.getElementById('flAdHomeBanner')) {
            var el = document.createElement('div');
            el.id = 'flAdHomeBanner';
            el.className = 'ad-home-banner';
            el.style.backgroundImage = "url('" + banner.materialUrl + "')";
            el.innerHTML = '<span class="tag">广告</span><div style="position:absolute;bottom:12px;left:12px;right:12px;color:#fff"><b>' + banner.title + '</b><br><span style="font-size:12px;opacity:.85">' + banner.copy + '</span></div>';
            el.onclick = function () { toast('跳转：' + banner.landingUrl + '（原型）'); };
            host.insertBefore(el, host.firstChild);
        }
    }

    var feedAd = ads.filter(function (a) { return a.slotCode === 'feed_video'; })[0];
    var track = document.querySelector('.feed-track');
    if (feedAd && track && !document.getElementById('flAdFeedCard')) {
        var page = document.createElement('div');
        page.className = 'feed-page ad-feed-card';
        page.id = 'flAdFeedCard';
        page.innerHTML = '<span class="ad-label">赞助</span><div class="feed-video" style="background:url(' + feedAd.materialUrl + ') center/cover;height:100%"><div style="position:absolute;bottom:80px;left:16px;right:16px;color:#fff"><div style="font-size:16px;font-weight:800">' + feedAd.title + '</div><div style="font-size:12px;opacity:.85;margin-top:6px">' + feedAd.copy + '</div><button type="button" class="ad-cta" id="flAdFeedCta">' + (feedAd.landingType === 'live' ? '进入直播' : '了解更多') + '</button><button type="button" style="margin-left:8px;background:transparent;border:0;color:rgba(255,255,255,.7);font-size:11px" id="flAdFeedHide">不感兴趣</button> <button type="button" style="background:transparent;border:0;color:rgba(255,255,255,.7);font-size:11px" id="flAdFeedReport">举报</button></div></div>';
        var pages = track.querySelectorAll('.feed-page');
        if (pages.length >= 3) track.insertBefore(page, pages[2]);
        else track.appendChild(page);
        page.querySelector('#flAdFeedCta').onclick = function (e) { e.stopPropagation(); toast('广告跳转（原型）'); };
        page.querySelector('#flAdFeedHide').onclick = function (e) { e.stopPropagation(); page.remove(); toast('将减少此类广告（原型）'); };
        page.querySelector('#flAdFeedReport').onclick = function (e) { e.stopPropagation(); toast('举报已提交（原型）'); };
    }
    }
    inject();
})();
