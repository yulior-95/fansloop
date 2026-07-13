/**
 * 首页 A/B 方案 B · 竖滑 Feed 交互
 */
(function () {
    var FEED_BUILD_VERSION = '4';
    var AB_STORAGE_KEY = 'fl_home_ab_variant';
    var AB_ENTER_KEY = 'fl_home_ab_enter_at';

    function toast(msg) {
        if (typeof window.toast === 'function') {
            window.toast(msg);
            return;
        }
        var host = document.getElementById('toastHostF');
        if (!host) return;
        var t = document.createElement('div');
        t.className = 'toast-f';
        t.textContent = msg;
        host.appendChild(t);
        setTimeout(function () { t.remove(); }, 2400);
    }

    function resolveLiveDetailHref(liveTap, slide, status) {
        if (status === 'ended') return 'live-detail-ab.html';
        var href = (slide && slide.getAttribute('data-detail-href')) || '';
        if (href.indexOf('host=') >= 0) return href;
        var creator = (slide && slide.getAttribute('data-creator')) ||
            (liveTap && liveTap.getAttribute('data-creator'));
        if (creator && window.LiveViewHost && window.LiveViewHost.hrefForCreatorName) {
            return window.LiveViewHost.hrefForCreatorName(creator, 'live');
        }
        if (href) return href;
        return 'live-detail-ab.html';
    }

    function recordAbVariant() {
        try {
            localStorage.setItem(AB_STORAGE_KEY, 'b');
            if (!localStorage.getItem(AB_ENTER_KEY)) {
                localStorage.setItem(AB_ENTER_KEY, String(Date.now()));
            }
        } catch (e) { /* ignore */ }
    }

    recordAbVariant();

    function syncAbFeedVideos(viewport, slideIndex) {
        if (!viewport) return;
        viewport.querySelectorAll('.ab-feed-video, .feed-stack-video').forEach(function (v) {
            v.pause();
            var wrap = v.closest('.feed-video-wrap');
            if (wrap) wrap.classList.remove('is-playing');
        });
        var slides = viewport.querySelectorAll('.ab-feed-slide');
        var slide = slides[slideIndex];
        if (!slide) return;
        var video = slide.querySelector('.ab-feed-video, .feed-stack-video');
        if (!video) return;
        video.muted = true;
        var playPromise = video.play();
        if (playPromise && playPromise.catch) playPromise.catch(function () {});
        var wrap = video.closest('.feed-video-wrap');
        if (wrap) wrap.classList.add('is-playing');
    }

    function toggleFeedVideo(wrap) {
        if (!wrap) return;
        var video = wrap.querySelector('.ab-feed-video, .feed-stack-video');
        if (!video) return;
        if (video.paused) {
            video.play().catch(function () {});
            wrap.classList.add('is-playing');
        } else {
            video.pause();
            wrap.classList.remove('is-playing');
        }
    }

    function ensureAbFeedBuilt() {
        var tracks = [
            document.getElementById('abFeedTrack'),
            document.getElementById('abFeedFollowTrack'),
            document.getElementById('abFeedLiveTrack')
        ].filter(Boolean);
        var needBuild = tracks.some(function (t) {
            return t.getAttribute('data-version') !== FEED_BUILD_VERSION || !t.children.length;
        });
        if (!needBuild) return;
        tracks.forEach(function (t) {
            t.innerHTML = '';
            t.removeAttribute('data-ab-interact');
            t.setAttribute('data-version', FEED_BUILD_VERSION);
        });
        if (typeof window.FL_buildAbFeedStacks === 'function') {
            window.FL_buildAbFeedStacks({ guest: document.body.classList.contains('is-guest-home') });
        }
        if (typeof window.FL_applyPostTextClamp === 'function') {
            window.FL_applyPostTextClamp();
        }
    }

    function ensureImageLightbox() {
        if (document.getElementById('feedImgLightbox')) return;
        var lb = document.createElement('div');
        lb.id = 'feedImgLightbox';
        lb.className = 'feed-img-lightbox';
        lb.innerHTML = '<button type="button" class="feed-img-lightbox-close" aria-label="关闭"><i class="fa-solid fa-xmark"></i></button><img src="" alt="">';
        lb.addEventListener('click', function (e) {
            if (e.target === lb || e.target.closest('.feed-img-lightbox-close')) {
                lb.classList.remove('is-open');
            }
        });
        document.body.appendChild(lb);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                var el = document.getElementById('feedImgLightbox');
                if (el) el.classList.remove('is-open');
            }
        });
    }

    function bindAbFeedInteractions() {
        ensureImageLightbox();
        document.querySelectorAll('.ab-feed-track').forEach(function (track) {
            if (track.getAttribute('data-ab-interact') === '1') return;
            track.setAttribute('data-ab-interact', '1');
            track.addEventListener('click', function (e) {
                if (e.target.closest('.post-text-toggle, .ab-follow-btn.follow-dynamic')) return;

                var railModal = e.target.closest('.ab-rail-btn[data-fl-modal]');
                if (railModal) {
                    e.preventDefault();
                    e.stopPropagation();
                    var modalPage = railModal.getAttribute('data-fl-modal');
                    if (modalPage && typeof window.FL_openInteractionModal === 'function') {
                        window.FL_openInteractionModal(modalPage);
                    }
                    return;
                }

                if (e.target.closest('.ab-feed-ol--br, .ab-feed-ol--tl, .ab-feed-ol--bl')) {
                    if (e.target.closest('.ab-rail-btn, .ab-follow-btn, .hashtag, .post-text-toggle, .btn-open-subscribe, .btn-open-ppv, .pc-sub')) {
                        /* 由各自 handler 处理 */
                    } else if (!e.target.closest('.feed-img-zoom, .feed-video-wrap, .feed-live-tap, .paid-cover')) {
                        return;
                    }
                }

                var liveTap = e.target.closest('.feed-live-tap');
                if (liveTap) {
                    e.preventDefault();
                    e.stopPropagation();
                    var status = liveTap.getAttribute('data-live-status') || 'live';
                    if (status === 'ended') {
                        toast('直播已结束');
                        return;
                    }
                    if (document.body.classList.contains('is-guest-home')) {
                        location.href = 'modal-login-main.html';
                        return;
                    }
                    var liveSlide = liveTap.closest('.ab-feed-slide[data-detail-href], .ab-feed-slide[data-creator]');
                    var creator = liveSlide && liveSlide.getAttribute('data-creator');
                    if (creator && window.LiveViewHost && window.LiveViewHost.stashPendingFromCreator) {
                        window.LiveViewHost.stashPendingFromCreator(creator);
                    }
                    location.href = resolveLiveDetailHref(liveTap, liveSlide, status);
                    return;
                }

                var hashtag = e.target.closest('.hashtag');
                if (hashtag) {
                    e.stopPropagation();
                    var topic = (hashtag.textContent || '').replace(/^#\s*/, '').trim();
                    if (topic) location.href = 'topic-detail.html?tag=' + encodeURIComponent(topic);
                    return;
                }

                var videoWrap = e.target.closest('.feed-video-wrap');
                if (videoWrap && !e.target.closest('.ab-feed-ol')) {
                    e.stopPropagation();
                    toggleFeedVideo(videoWrap);
                    return;
                }

                var zoomImg = e.target.closest('.feed-img-zoom');
                if (zoomImg) {
                    e.stopPropagation();
                    var lb = document.getElementById('feedImgLightbox');
                    var big = lb && lb.querySelector('img');
                    if (lb && big) {
                        big.src = zoomImg.src.replace(/w=\d+/g, 'w=1600');
                        lb.classList.add('is-open');
                    }
                    return;
                }

                var like = e.target.closest('.like-act');
                if (like) {
                    if (like.classList.contains('guest-act')) return;
                    e.preventDefault();
                    e.stopPropagation();
                    var liked = like.classList.toggle('liked');
                    var lic = like.querySelector('i');
                    if (lic) lic.className = liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
                    toast(liked ? '点赞成功' : '已取消点赞');
                    return;
                }

                var bookmark = e.target.closest('.bookmark-act');
                if (bookmark) {
                    if (bookmark.classList.contains('guest-act')) return;
                    e.preventDefault();
                    e.stopPropagation();
                    var saved = bookmark.classList.toggle('saved');
                    var bic = bookmark.querySelector('i');
                    if (bic) bic.className = saved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
                    toast(saved ? '收藏成功' : '已取消收藏');
                }
            });
        });

    }

    if (!document.body.getAttribute('data-ab-follow-delegate')) {
        document.body.setAttribute('data-ab-follow-delegate', '1');
        document.addEventListener('click', function (e) {
            var btn = e.target.closest('.follow-dynamic');
            if (!btn || !document.body.classList.contains('is-home-ab-feed')) return;
            e.stopPropagation();
            var following = btn.getAttribute('data-following') === 'true';
            if (following) {
                btn.setAttribute('data-following', 'false');
                btn.textContent = '+ 关注';
                toast('已取消关注');
            } else {
                btn.setAttribute('data-following', 'true');
                btn.textContent = '已关注';
                toast('关注成功');
            }
        });
    }

    if (!document.body.getAttribute('data-ab-rail-modal-delegate')) {
        document.body.setAttribute('data-ab-rail-modal-delegate', '1');
        document.addEventListener('click', function (e) {
            if (!document.body.classList.contains('is-home-ab-feed')) return;
            var rail = e.target.closest('.ab-rail-btn[data-fl-modal]');
            if (!rail) return;
            e.preventDefault();
            e.stopPropagation();
            var page = rail.getAttribute('data-fl-modal');
            if (page && typeof window.FL_openInteractionModal === 'function') {
                window.FL_openInteractionModal(page);
            }
        });
    }

    if (!document.body.getAttribute('data-guest-act-delegate')) {
        document.body.setAttribute('data-guest-act-delegate', '1');
        document.addEventListener('click', function (e) {
            if (!document.body.classList.contains('is-guest-home')) return;
            var ga = e.target.closest('.guest-act');
            if (!ga) return;
            e.preventDefault();
            e.stopPropagation();
            location.href = 'modal-login-main.html';
        });
    }

    function initAbFeed() {
        ensureAbFeedBuilt();
        bindAbFeedInteractions();
    }

    initAbFeed();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAbFeed);
    }

    var panels = {
        rec: document.getElementById('abFeedRec'),
        follow: document.getElementById('abFeedFollow'),
        live: document.getElementById('abFeedLive')
    };
    var activeStack = 'rec';

    var stackConfigs = [
        { id: 'rec', panel: panels.rec, viewportId: 'abFeedViewport', trackId: 'abFeedTrack', progressId: 'abFeedProgress' },
        { id: 'follow', panel: panels.follow, viewportId: 'abFeedFollowViewport', trackId: 'abFeedFollowTrack', progressId: 'abFeedFollowProgress' },
        { id: 'live', panel: panels.live, viewportId: 'abFeedLiveViewport', trackId: 'abFeedLiveTrack', progressId: 'abFeedLiveProgress' }
    ];

    function syncSlideHeights(viewport) {
        if (!viewport) return;
        var h = viewport.clientHeight;
        if (h < 1) return;
        viewport.querySelectorAll('.ab-feed-slide').forEach(function (slide) {
            slide.style.height = h + 'px';
        });
    }

    function renderProgress(cfg, index, total) {
        var el = document.getElementById(cfg.progressId);
        if (!el) return;
        var maxPips = Math.min(total, 8);
        var html = '';
        for (var p = 0; p < maxPips; p++) {
            var active = p === Math.floor(index / Math.max(1, total / maxPips));
            html += '<span class="pip' + (active ? ' active' : '') + '"></span>';
        }
        el.innerHTML = html;
    }

    function createAbStack(cfg) {
        var viewport = document.getElementById(cfg.viewportId);
        var track = document.getElementById(cfg.trackId);
        if (!viewport || !track) return null;

        var slides = [];
        var index = 0;

        function refreshSlides() {
            slides = Array.prototype.slice.call(track.querySelectorAll('.ab-feed-slide'));
        }

        function sync() {
            refreshSlides();
            syncSlideHeights(viewport);
            if (!slides.length) return;
            index = Math.max(0, Math.min(index, slides.length - 1));
            var h = slides[0].offsetHeight || viewport.clientHeight || 600;
            track.style.transform = 'translateY(-' + index * h + 'px)';
            syncAbFeedVideos(viewport, index);
            renderProgress(cfg, index, slides.length);
            if (typeof window.FL_applyPostTextClamp === 'function') {
                window.FL_applyPostTextClamp(viewport);
            }
            if (index > 0 && cfg.panel) {
                cfg.panel.classList.remove('is-first-visit-hint');
            }
        }

        function go(dir) {
            refreshSlides();
            index += dir;
            sync();
        }

        viewport.addEventListener('wheel', function (e) {
            if (activeStack !== cfg.id) return;
            if (!cfg.panel || !cfg.panel.classList.contains('active')) return;
            if (Math.abs(e.deltaY) < 8) return;
            e.preventDefault();
            go(e.deltaY > 0 ? 1 : -1);
        }, { passive: false });

        var touchStartY = 0;
        viewport.addEventListener('touchstart', function (e) {
            touchStartY = e.changedTouches[0].clientY;
        }, { passive: true });
        viewport.addEventListener('touchend', function (e) {
            if (activeStack !== cfg.id) return;
            var dy = touchStartY - e.changedTouches[0].clientY;
            if (Math.abs(dy) < 40) return;
            go(dy > 0 ? 1 : -1);
        }, { passive: true });

        refreshSlides();
        sync();
        if (!slides.length) {
            ensureAbFeedBuilt();
            refreshSlides();
            sync();
        }

        return { id: cfg.id, panel: cfg.panel, sync: sync, go: go };
    }

    var stacks = stackConfigs.map(createAbStack).filter(Boolean);

    function refreshAll() {
        ensureAbFeedBuilt();
        stacks.forEach(function (s) { s.sync(); });
    }
    refreshAll();
    document.addEventListener('DOMContentLoaded', refreshAll);

    if (typeof ResizeObserver !== 'undefined') {
        document.querySelectorAll('.ab-feed-viewport').forEach(function (viewport) {
            var ro = new ResizeObserver(function () {
                var st = stacks.find(function (s) {
                    return s.panel && s.panel.contains(viewport);
                });
                if (st) st.sync();
            });
            ro.observe(viewport);
        });
    }

    document.addEventListener('keydown', function (e) {
        var st = stacks.find(function (s) { return s.id === activeStack; });
        if (!st || !st.panel.classList.contains('active')) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); st.go(1); }
        if (e.key === 'ArrowUp') { e.preventDefault(); st.go(-1); }
    });

    window.addEventListener('resize', function () {
        stacks.forEach(function (s) { s.sync(); });
    });

    document.querySelectorAll('#abFeedTabs .tab[data-feed]').forEach(function (tab) {
        tab.addEventListener('click', function () {
            document.querySelectorAll('#abFeedTabs .tab[data-feed]').forEach(function (t) {
                t.classList.remove('active');
            });
            tab.classList.add('active');
            var mode = tab.getAttribute('data-feed');
            if (panels.rec) panels.rec.classList.toggle('active', mode === 'rec');
            if (panels.follow) panels.follow.classList.toggle('active', mode === 'follow');
            if (panels.live) panels.live.classList.toggle('active', mode === 'live');
            activeStack = mode;
            var st = stacks.find(function (s) { return s.id === mode; });
            if (st) st.sync();
        });
    });

    var searchBtn = document.getElementById('abFeedSearchBtn');
    var searchPop = document.getElementById('abFeedSearchPop');
    if (searchBtn && searchPop) {
        searchBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            searchPop.classList.toggle('is-open');
            var inp = searchPop.querySelector('input');
            if (searchPop.classList.contains('is-open') && inp) inp.focus();
        });
        document.addEventListener('click', function (e) {
            if (!e.target.closest('#abFeedSearchPop') && !e.target.closest('#abFeedSearchBtn')) {
                searchPop.classList.remove('is-open');
            }
        });
    }

    var fabWrap = document.getElementById('createFabWrap');
    var fabCloseTimer;
    document.getElementById('createFabMain')?.addEventListener('click', function () {
        location.href = 'create.html?type=image';
    });
    document.querySelectorAll('.create-fab-item').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            location.href = 'create.html?type=' + (btn.getAttribute('data-create-type') || 'image');
        });
    });
    if (fabWrap) {
        fabWrap.addEventListener('mouseenter', function () {
            clearTimeout(fabCloseTimer);
            fabWrap.classList.add('is-open');
        });
        fabWrap.addEventListener('mouseleave', function () {
            fabCloseTimer = setTimeout(function () { fabWrap.classList.remove('is-open'); }, 280);
        });
    }

    window.toast = toast;
})();
