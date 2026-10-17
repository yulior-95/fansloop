/** 直播间 · 推广卡片（视频下方、互动区上方） */
(function () {
    if (!window.FLAdService) return;
    var ad = FLAdService.getDeliveringAds('live_room')[0];
    if (!ad || document.getElementById('flAdLivePromo')) return;
    var host = document.querySelector('.lv-host');
    if (!host) return;
    var el = document.createElement('div');
    el.id = 'flAdLivePromo';
    el.style.cssText = 'margin:8px 12px;padding:10px;border-radius:12px;background:rgba(0,0,0,.55);border:1px solid rgba(251,191,36,.35);display:flex;gap:10px;align-items:center;position:relative;z-index:6';
    el.innerHTML = '<span style="font-size:10px;color:#fde68a;border:1px solid rgba(251,191,36,.4);padding:2px 6px;border-radius:6px">广告</span>' +
        '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700;color:#fff">' + ad.title + '</div><div style="font-size:11px;color:rgba(255,255,255,.7)">' + ad.copy + '</div></div>' +
        '<button type="button" style="font-size:11px;padding:6px 10px;border-radius:999px;border:0;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff">了解</button>';
    host.parentNode.insertBefore(el, host.nextSibling);
    window.addEventListener('fl-ad-store-changed', function () { el.remove(); });
})();
