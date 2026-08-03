/**
 * 视频暂停 · AI 商品识别匹配（原型）
 * 依赖 AffiliateCatalogStore.matchProducts + AffiliateShowcaseStore 外跳
 */
(function (global) {
    var DEFAULT_HINTS = ['jacket', 'camera', 'street', '外套', '相机'];

    function ensureRail(container) {
        var rail = container.querySelector('.af-ai-rail');
        if (rail) return rail;
        rail = document.createElement('div');
        rail.className = 'af-ai-rail';
        rail.setAttribute('aria-live', 'polite');
        container.style.position = container.style.position || 'relative';
        container.appendChild(rail);
        return rail;
    }

    function render(rail, products) {
        if (!products.length) {
            rail.classList.remove('show');
            rail.innerHTML = '';
            return;
        }
        rail.innerHTML =
            '<div class="af-ai-head"><i class="fa-solid fa-wand-magic-sparkles"></i> AI 识别到相关商品</div>' +
            products.map(function (p) {
                return (
                    '<div class="af-ai-card" data-id="' + p.id + '" role="button" tabindex="0">' +
                    '<img src="' + p.imageUrl + '" alt="">' +
                    '<div><div class="t">' + p.title + '</div>' +
                    '<div class="p">' + p.priceDisplay + '</div>' +
                    '<div class="cta">点击跳转第三方购买 →</div></div></div>'
                );
            }).join('');
        rail.classList.add('show');
        rail.querySelectorAll('.af-ai-card').forEach(function (card) {
            function go() {
                if (global.AffiliateCommercePages && global.AffiliateCommercePages.openExternal) {
                    global.AffiliateCommercePages.openExternal(card.getAttribute('data-id'), 'ai_video');
                }
            }
            card.addEventListener('click', go);
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
            });
        });
    }

    function matchAndShow(rail, hints) {
        var Catalog = global.AffiliateCatalogStore;
        if (!Catalog) return;
        var products = Catalog.matchProducts(hints || DEFAULT_HINTS, 3);
        render(rail, products);
    }

    function bindVideo(video, container, hints) {
        if (!video) return;
        var rail = ensureRail(container || video.parentElement);
        function onPause() {
            if (video.ended) return;
            matchAndShow(rail, hints);
        }
        function onPlay() {
            rail.classList.remove('show');
        }
        video.addEventListener('pause', onPause);
        video.addEventListener('play', onPlay);
        // 若初始已暂停，也展示一次便于演示
        if (video.paused && !video.ended) {
            setTimeout(function () { matchAndShow(rail, hints); }, 600);
        }
    }

    function autoInit() {
        var video = document.querySelector('[data-dd-video], video.disc-vp-video, .disc-vp-stage video, video');
        if (!video) return;
        var stage = video.closest('.disc-vp-stage, .dd-player, .dd-media, .player') || video.parentElement;
        bindVideo(video, stage, DEFAULT_HINTS);
    }

    global.AiProductMatch = {
        bindVideo: bindVideo,
        autoInit: autoInit,
        matchAndShow: matchAndShow
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }
})(typeof window !== 'undefined' ? window : this);
