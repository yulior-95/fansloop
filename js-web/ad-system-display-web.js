/**
 * WEB 首页 · 广告增量展示（feed-stack + Banner）
 */
(function () {
    if (!window.FLAdStore) return;
    function run() {
        var ads = FLAdStore.getDeliveringAds();
        var banner = ads.filter(function (a) { return a.slotCode === 'home_banner'; })[0];
        var main = document.querySelector('.feed-main-col') || document.querySelector('.app-body');
        if (banner && main && !document.getElementById('flAdWebBanner')) {
            var b = document.createElement('div');
            b.id = 'flAdWebBanner';
            b.className = 'ad-home-banner';
            b.style.margin = '0 0 16px';
            b.style.backgroundImage = "url('" + banner.materialUrl + "')";
            b.innerHTML = '<span class="tag">广告</span>';
            main.insertBefore(b, main.firstChild);
        }
        var feedAd = ads.filter(function (a) { return a.slotCode === 'feed_video'; })[0];
        var track = document.getElementById('feedStackTrack');
        if (feedAd && track && !document.getElementById('flAdWebFeed')) {
            var card = document.createElement('article');
            card.id = 'flAdWebFeed';
            card.className = 'feed-stack-card ad-feed-card';
            card.style.border = '1px solid rgba(251,191,36,.35)';
            card.innerHTML = '<span class="ad-label">赞助</span><div style="aspect-ratio:9/16;max-height:520px;background:url(' + feedAd.materialUrl + ') center/cover;border-radius:12px;position:relative"><div style="position:absolute;bottom:16px;left:16px;right:16px;color:#fff"><b>' + feedAd.title + '</b><p style="font-size:12px;opacity:.85">' + feedAd.copy + '</p><button type="button" class="ad-cta">了解更多</button></div></div>';
            var items = track.querySelectorAll('.feed-stack-card');
            if (items.length > 3) track.insertBefore(card, items[3]);
            else track.appendChild(card);
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(run, 600); });
    else setTimeout(run, 600);
})();
