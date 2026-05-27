/**
 * 关注列表 · 未看作品二级浏览（左栏创作者 / 右栏竖滑视频）
 */
(function () {
    var sheet = document.getElementById('sheetUnreadViewer');
    var rail = document.getElementById('unreadFollowRail');
    var scrollEl = document.getElementById('unreadVideoScroll');
    var progEl = document.getElementById('unreadViewerProgress');
    var titleEl = document.getElementById('unreadViewerCreator');
    if (!sheet || !rail || !scrollEl) return;

    var THUMBS = [
        'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=900&q=80',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&q=80',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&q=80',
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900&q=80',
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=80'
    ];

    var creators = [];
    var activeId = null;
    var slideIndex = 0;
    var autoAdvanceLock = false;

    function getFollowingStore() {
        if (window.PfSocialLists && window.PfSocialLists.getStore) {
            return window.PfSocialLists.getStore().following || [];
        }
        return [];
    }

    function ensureVideos(item) {
        if (item.unreadVideos && item.unreadVideos.length) return item.unreadVideos;
        var n = Math.min(item.unreadWorks || 0, 8);
        var list = [];
        for (var i = 0; i < n; i++) {
            list.push({
                id: item.id + '_v' + i,
                title: item.name + ' · 未看作品 ' + (i + 1),
                thumb: THUMBS[i % THUMBS.length],
                duration: (2 + (i % 5)) + ':' + String(10 + i * 7).slice(-2)
            });
        }
        item.unreadVideos = list;
        return list;
    }

    function buildCreators() {
        creators = getFollowingStore().filter(function (c) {
            return (c.unreadWorks || 0) > 0;
        });
        creators.forEach(ensureVideos);
    }

    function activeCreator() {
        for (var i = 0; i < creators.length; i++) {
            if (creators[i].id === activeId) return { item: creators[i], index: i };
        }
        return { item: null, index: -1 };
    }

    function renderRail() {
        rail.innerHTML = creators.map(function (c) {
            var liveCls = c.isLive ? ' is-live' : '';
            var liveBadge = c.isLive ? '<span class="badge-live">直播中</span>' : '';
            return (
                '<button type="button" class="pf-unread-rail-item' + (c.id === activeId ? ' active' : '') + '" data-rail-id="' + c.id + '">' +
                '<span class="pf-av-wrap' + liveCls + '"><span class="av" style="background-image:url(\'' + c.av + '\')"></span>' + liveBadge + '</span>' +
                '<span class="nm">' + c.name + '</span>' +
                '<span class="cnt">' + c.unreadWorks + '</span></button>'
            );
        }).join('');
    }

    function renderSlides(item) {
        var videos = ensureVideos(item);
        scrollEl.innerHTML = videos.map(function (v, idx) {
            return (
                '<section class="pf-unread-slide" data-slide-index="' + idx + '">' +
                '<div class="pf-unread-video" style="background-image:url(\'' + v.thumb + '\')">' +
                '<span class="play"><i class="fa-solid fa-play"></i></span>' +
                '<span class="dur">' + v.duration + '</span>' +
                '<div class="ti">' + v.title + '</div></div>' +
                (idx < videos.length - 1
                    ? '<div class="pf-unread-slide-hint"><i class="fa-solid fa-chevron-down"></i> 上滑查看下一个未看作品</div>'
                    : '<div class="pf-unread-slide-hint"><i class="fa-solid fa-user-group"></i> 已是该创作者最后一个未看 · 可切换上一/下一创作者</div>') +
                '</section>'
            );
        }).join('');
        slideIndex = 0;
        scrollEl.scrollTop = 0;
        updateProgress();
        syncUserNavButtons();
    }

    function updateProgress() {
        var ac = activeCreator();
        if (!ac.item) return;
        var total = ac.item.unreadVideos.length;
        var ci = ac.index + 1;
        var cc = creators.length;
        if (progEl) {
            progEl.textContent = '创作者 ' + ci + '/' + cc + ' · 作品 ' + (slideIndex + 1) + '/' + total;
        }
        if (titleEl) titleEl.textContent = ac.item.name;
    }

    function syncUserNavButtons() {
        var ac = activeCreator();
        var prev = document.getElementById('btnUnreadPrevCreator');
        var next = document.getElementById('btnUnreadNextCreator');
        if (prev) prev.disabled = ac.index <= 0;
        if (next) next.disabled = ac.index < 0 || ac.index >= creators.length - 1;
    }

    function selectCreator(id) {
        activeId = id;
        renderRail();
        var ac = activeCreator();
        if (ac.item) renderSlides(ac.item);
    }

    function switchCreator(delta) {
        var ac = activeCreator();
        var next = ac.index + delta;
        if (next < 0 || next >= creators.length) return;
        selectCreator(creators[next].id);
        showViewerToast(delta > 0 ? '已切换下一创作者' : '已切换上一创作者');
    }

    function showViewerToast(msg) {
        if (window.PfSocialLists && window.PfSocialLists.toast) {
            window.PfSocialLists.toast(msg);
            return;
        }
        var t = document.getElementById('pfToast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(function () { t.classList.remove('show'); }, 2200);
    }

    function open(userId) {
        buildCreators();
        if (!creators.length) {
            showViewerToast('暂无未看作品');
            return;
        }
        activeId = userId;
        var found = creators.some(function (c) { return c.id === userId; });
        if (!found) activeId = creators[0].id;

        var social = document.getElementById('sheetSocialList');
        if (social) social.classList.add('is-under-subscribe');

        renderRail();
        selectCreator(activeId);
        sheet.classList.add('show');
        sheet.setAttribute('aria-hidden', 'false');
    }

    function close() {
        sheet.classList.remove('show');
        sheet.setAttribute('aria-hidden', 'true');
        var social = document.getElementById('sheetSocialList');
        if (social) social.classList.remove('is-under-subscribe');
    }

    function onScrollVideos() {
        var slides = scrollEl.querySelectorAll('.pf-unread-slide');
        if (!slides.length) return;
        var st = scrollEl.scrollTop;
        var h = scrollEl.clientHeight;
        var idx = Math.round(st / Math.max(h, 1));
        if (idx >= slides.length) idx = slides.length - 1;
        if (idx < 0) idx = 0;
        if (idx !== slideIndex) {
            slideIndex = idx;
            updateProgress();
        }
        if (!autoAdvanceLock && idx === slides.length - 1) {
            var nearBottom = st + h >= scrollEl.scrollHeight - 24;
            if (nearBottom) {
                var ac = activeCreator();
                if (ac.index < creators.length - 1) {
                    autoAdvanceLock = true;
                    setTimeout(function () {
                        switchCreator(1);
                        autoAdvanceLock = false;
                    }, 480);
                }
            }
        }
    }

    document.getElementById('btnCloseUnreadViewer')?.addEventListener('click', close);
    sheet.addEventListener('click', function (e) {
        if (e.target === sheet) close();
    });
    rail.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-rail-id]');
        if (!btn) return;
        selectCreator(btn.getAttribute('data-rail-id'));
    });
    scrollEl.addEventListener('scroll', onScrollVideos);
    document.getElementById('btnUnreadPrevCreator')?.addEventListener('click', function () { switchCreator(-1); });
    document.getElementById('btnUnreadNextCreator')?.addEventListener('click', function () { switchCreator(1); });

    scrollEl.addEventListener('wheel', function (e) {
        var ac = activeCreator();
        if (!ac.item) return;
        var atTop = scrollEl.scrollTop <= 2;
        var atBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 8;
        if (e.deltaY > 40 && atBottom && ac.index < creators.length - 1) {
            e.preventDefault();
            switchCreator(1);
        } else if (e.deltaY < -40 && atTop && ac.index > 0) {
            e.preventDefault();
            switchCreator(-1);
        }
    }, { passive: false });

    var params = new URLSearchParams(window.location.search);
    if (params.get('unreadWorks')) {
        setTimeout(function () {
            if (window.PfSocialLists) window.PfSocialLists.openList('following');
            setTimeout(function () { open(params.get('unreadWorks')); }, 500);
        }, 300);
    }

    window.PfUnreadViewer = { open: open, close: close };
})();
