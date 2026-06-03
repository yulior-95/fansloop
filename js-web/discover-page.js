/**
 * 发现页 · 横滑频道 + 马赛克网格
 * 游客：仅几条免费内容 · 登录：免费完整 + 付费 Teaser，推荐算法见 discover-access.js
 */
(function () {
    var T = window.FL_DISCOVER_TAXONOMY;
    var A = window.FL_DISCOVER_ACCESS;
    if (!T || !A) return;

    var VP = window.FL_DISCOVER_VIDEO;
    var activeCat = 'all';

    function img(id, w) {
        return 'https://images.unsplash.com/' + id + '?w=' + (w || 600) + '&q=80';
    }

    function isVideoPost(p) {
        return p.type === 'video' && !p.live;
    }

    function pickFeatured(list) {
        if (!list.length) return null;
        var freeFirst = list.filter(function (p) { return A.isFreePost(p); });
        var pool = freeFirst.length ? freeFirst : list;
        return pool.find(function (p) { return p.featured; }) ||
            pool.find(function (p) { return p.type === 'video'; }) ||
            pool[0];
    }

    function buildTileHtml(p, opts) {
        opts = opts || {};
        var hero = !!opts.hero;
        var video = isVideoPost(p);
        var teaser = A.needsTeaser(p);
        var tags = '';

        if (teaser) {
            tags += '<span class="tg paid"><i class="fa-solid fa-lock"></i>' + T.esc(A.payLabel(p)) + '</span>';
        }
        if (p.live) tags += '<span class="tg live">● LIVE</span>';
        if (video) tags += '<span class="tg video"><i class="fa-solid fa-play"></i> 视频</span>';

        var stats = '';
        if (p.live) {
            stats = '<span><i class="fa-solid fa-eye"></i> ' + p.views + '</span>' +
                '<span class="live-txt"><i class="fa-solid fa-circle"></i> 直播中</span>';
        } else {
            if (p.likes) stats += '<span><i class="fa-solid fa-heart"></i> ' + p.likes + '</span>';
            if (p.comments) stats += '<span><i class="fa-regular fa-comment"></i> ' + p.comments + '</span>';
            if (p.views) stats += '<span><i class="fa-solid fa-eye"></i> ' + p.views + '</span>';
            if (p.duration && video) stats += '<span><i class="fa-solid fa-clock"></i> ' + p.duration + '</span>';
        }

        var coverUrl = img(p.cover, hero ? 1200 : 600);
        var coverMedia = (video && VP && VP.buildVideoCoverInner)
            ? VP.buildVideoCoverInner(p)
            : '<img class="ct-cover-img" src="' + coverUrl + '" alt="" loading="lazy" decoding="async" />';
        var tileClass = 'content-tile' +
            (hero ? ' content-tile--hero' : '') +
            (video ? ' content-tile--video' : '') +
            (teaser ? ' content-tile--paid' : '');

        return (
            '<article class="' + tileClass + '" data-post-id="' + p.id + '" tabindex="0" role="button" aria-label="查看：' + T.esc(p.title) + '">' +
            '<div class="ct-cover">' +
            coverMedia +
            (tags ? '<div class="ct-tags">' + tags + '</div>' : '') +
            '<div class="ct-meta' + (video ? ' ct-meta--video' : '') + '">' +
            '<div class="ct-title">' + T.esc(p.title) + '</div>' +
            '<div class="ct-author">' + T.esc(p.author) + (p.handle ? ' · ' + T.esc(p.handle) : '') + '</div></div></div>' +
            '<div class="ct-stats">' + stats + '</div></article>'
        );
    }

    function renderCatRow() {
        var row = document.getElementById('discCatRow');
        if (!row) return;
        row.innerHTML = T.getCategories().map(function (c) {
            return (
                '<button type="button" class="cat-pill' + (c.id === activeCat ? ' active' : '') + '" data-cat="' + c.id + '">' +
                '<span class="ico">' + c.icon + '</span>' + T.esc(c.name) +
                '</button>'
            );
        }).join('');
        syncCatScrollFade();
    }

    function syncCatScrollFade() {
        var wrap = document.getElementById('discCatScroll');
        var row = document.getElementById('discCatRow');
        if (!wrap || !row) return;
        var canScroll = row.scrollWidth > row.clientWidth + 4;
        var atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 8;
        wrap.classList.toggle('has-overflow', canScroll);
        wrap.classList.toggle('is-end', atEnd);
        wrap.classList.toggle('has-scroll-left', row.scrollLeft > 8);
    }

    function renderPosts() {
        var grid = document.getElementById('discContentGrid');
        if (!grid) return;
        if (VP && VP.closePip) VP.closePip();

        var list = A.filterFeedForDiscover(activeCat);

        if (!list.length) {
            grid.innerHTML =
                '<div class="disc-empty"><i class="fa-regular fa-compass"></i>' +
                '<p>该领域暂无内容</p><span>切换「全部」或其他垂类试试</span></div>';
            grid.className = 'disc-mosaic disc-mosaic--empty';
            return;
        }

        grid.className = 'disc-mosaic';
        var featured = pickFeatured(list);
        var rest = list.filter(function (p) { return p.id !== featured.id; });
        var html = buildTileHtml(featured, { hero: true });
        rest.forEach(function (p) { html += buildTileHtml(p, { hero: false }); });
        grid.innerHTML = html;

        if (VP && VP.refreshFromGrid) VP.refreshFromGrid();
        var DD = window.FL_DISCOVER_DETAIL;
        if (DD) {
            if (DD.bindGrid) DD.bindGrid();
            else if (DD.init) DD.init();
        }
    }

    function setCategory(id) {
        activeCat = id || 'all';
        renderCatRow();
        renderPosts();
        var params = new URLSearchParams(location.search);
        if (id === 'all') params.delete('category');
        else params.set('category', id);
        var qs = params.toString();
        history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    }

    function bindCatRow() {
        var row = document.getElementById('discCatRow');
        var wrap = document.getElementById('discCatScroll');
        if (!row || row.getAttribute('data-bound') === '1') return;
        row.setAttribute('data-bound', '1');
        row.addEventListener('click', function (e) {
            var pill = e.target.closest('.cat-pill[data-cat]');
            if (pill) setCategory(pill.getAttribute('data-cat'));
        });
        row.addEventListener('scroll', syncCatScrollFade, { passive: true });
        window.addEventListener('resize', syncCatScrollFade);
        if (wrap) {
            wrap.addEventListener('wheel', function (e) {
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    row.scrollLeft += e.deltaY;
                    e.preventDefault();
                }
            }, { passive: false });
        }
    }

    function init() {
        VP = window.FL_DISCOVER_VIDEO;
        var cat = new URLSearchParams(location.search).get('category');
        if (cat && T.getCategoryById(cat)) activeCat = cat;
        renderCatRow();
        renderPosts();
        bindCatRow();
        if (VP && VP.init) VP.init();
        setTimeout(syncCatScrollFade, 80);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.FL_discoverSetCategory = setCategory;
})();
