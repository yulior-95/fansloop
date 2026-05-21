/**
 * 首页 Feed v2 · 搜索下拉 / 竖滑 Feed / 直播 Tab / 创作 FAB
 */
(function () {
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

    var FEED_BUILD_VERSION = '9';

    function syncFeedStackVideos(viewport, slideIndex) {
        if (!viewport) return;
        var track = viewport.querySelector('.feed-stack-track');
        if (!track) return;
        track.querySelectorAll('.feed-stack-video').forEach(function (v) {
            v.pause();
            var wrap = v.closest('.feed-video-wrap');
            if (wrap) wrap.classList.remove('is-playing');
        });
        var slides = track.querySelectorAll('.feed-stack-slide');
        var slide = slides[slideIndex];
        if (!slide) return;
        var video = slide.querySelector('.feed-stack-video');
        if (!video) return;
        video.muted = true;
        var playPromise = video.play();
        if (playPromise && playPromise.catch) {
            playPromise.catch(function () {});
        }
        var wrap = video.closest('.feed-video-wrap');
        if (wrap) wrap.classList.add('is-playing');
    }

    function toggleFeedVideo(wrap) {
        if (!wrap) return;
        var video = wrap.querySelector('.feed-stack-video');
        if (!video) return;
        if (video.paused) {
            video.play().catch(function () {});
            wrap.classList.add('is-playing');
        } else {
            video.pause();
            wrap.classList.remove('is-playing');
        }
    }

    function ensureFeedStacksBuilt() {
        var tracks = [
            document.getElementById('feedStackTrack'),
            document.getElementById('feedFollowStackTrack'),
            document.getElementById('feedLiveStackTrack')
        ].filter(Boolean);
        var needBuild = tracks.some(function (t) {
            return t.getAttribute('data-version') !== FEED_BUILD_VERSION || !t.children.length;
        });
        if (!needBuild) return;
        tracks.forEach(function (t) {
            t.innerHTML = '';
            t.removeAttribute('data-feed-interact');
            t.setAttribute('data-version', FEED_BUILD_VERSION);
        });
        if (typeof window.FL_buildFeedStacks === 'function') {
            window.FL_buildFeedStacks({ guest: document.body.classList.contains('is-guest-home') });
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

    function bindFeedStackInteractions() {
        ensureImageLightbox();
        document.querySelectorAll('.feed-stack-track').forEach(function (track) {
            if (track.getAttribute('data-feed-interact') === '1') return;
            track.setAttribute('data-feed-interact', '1');
            track.addEventListener('click', function (e) {
                if (e.target.closest('.dev-glass-wrap')) return;

                var liveTap = e.target.closest('.feed-live-tap');
                if (liveTap) {
                    e.preventDefault();
                    e.stopPropagation();
                    var status = liveTap.getAttribute('data-live-status') || 'live';
                    if (status === 'ended') {
                        liveTap.classList.add('is-ended-flash');
                        setTimeout(function () {
                            liveTap.classList.remove('is-ended-flash');
                        }, 600);
                        toast('直播已结束');
                        return;
                    }
                    if (document.body.classList.contains('is-guest-home')) {
                        location.href = 'modal-login-main.html';
                        return;
                    }
                    location.href = 'live-detail.html';
                    return;
                }

                var hashtag = e.target.closest('.hashtag');
                if (hashtag) {
                    e.stopPropagation();
                    var topic = (hashtag.textContent || '').replace(/^#\s*/, '').trim();
                    if (topic) {
                        window.location.href = 'topic-detail.html?tag=' + encodeURIComponent(topic);
                    }
                    return;
                }

                var videoWrap = e.target.closest('.feed-video-wrap');
                if (videoWrap) {
                    e.stopPropagation();
                    toggleFeedVideo(videoWrap);
                    return;
                }

                var zoomImg = e.target.closest('.feed-img-zoom');
                if (zoomImg) {
                    e.stopPropagation();
                    var lb = document.getElementById('feedImgLightbox');
                    var big = document.getElementById('feedImgLightboxImg') || (lb && lb.querySelector('img'));
                    if (lb && big) {
                        big.id = 'feedImgLightboxImg';
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

    function initFeedStacks() {
        ensureFeedStacksBuilt();
        bindFeedStackInteractions();
        if (typeof window.FL_applyLivePreviewReminds === 'function') {
            window.FL_applyLivePreviewReminds();
        }
    }

    initFeedStacks();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFeedStacks);
    }

    var feedRec = document.getElementById('feedRec');
    var feedFollow = document.getElementById('feedFollow');
    var feedLive = document.getElementById('feedLive');
    var activeStack = null;

    var stackConfigs = [
        {
            id: 'rec',
            panel: feedRec,
            viewportId: 'feedStackViewport',
            trackId: 'feedStackTrack',
            prevId: 'feedStackPrev',
            nextId: 'feedStackNext',
            indicatorId: 'feedStackIndicator'
        },
        {
            id: 'follow',
            panel: feedFollow,
            viewportId: 'feedFollowStackViewport',
            trackId: 'feedFollowStackTrack',
            prevId: 'feedFollowStackPrev',
            nextId: 'feedFollowStackNext',
            indicatorId: 'feedFollowStackIndicator'
        },
        {
            id: 'live',
            panel: feedLive,
            viewportId: 'feedLiveStackViewport',
            trackId: 'feedLiveStackTrack',
            prevId: 'feedLiveStackPrev',
            nextId: 'feedLiveStackNext',
            indicatorId: 'feedLiveStackIndicator'
        }
    ];

    function createFeedStack(cfg) {
        var viewport = document.getElementById(cfg.viewportId);
        var track = document.getElementById(cfg.trackId);
        if (!viewport || !track) return null;

        var slides = [];
        var index = 0;
        var indicator = document.getElementById(cfg.indicatorId);
        var btnPrev = document.getElementById(cfg.prevId);
        var btnNext = document.getElementById(cfg.nextId);

        function refreshSlides() {
            slides = Array.prototype.slice.call(track.querySelectorAll('.feed-stack-slide'));
        }

        function sync() {
            refreshSlides();
            if (!slides.length) return;
            index = Math.max(0, Math.min(index, slides.length - 1));
            var h = slides[0].offsetHeight || viewport.offsetHeight || 600;
            track.style.transform = 'translateY(-' + index * h + 'px)';
            if (indicator) indicator.textContent = (index + 1) + ' / ' + slides.length;
            syncFeedStackVideos(viewport, index);
        }

        function go(dir) {
            refreshSlides();
            index += dir;
            sync();
        }

        btnPrev?.addEventListener('click', function (e) {
            e.stopPropagation();
            go(-1);
        });
        btnNext?.addEventListener('click', function (e) {
            e.stopPropagation();
            go(1);
        });

        viewport.addEventListener('wheel', function (e) {
            if (activeStack !== cfg.id) return;
            if (!cfg.panel || !cfg.panel.classList.contains('active')) return;
            if (Math.abs(e.deltaY) < 8) return;
            e.preventDefault();
            go(e.deltaY > 0 ? 1 : -1);
        }, { passive: false });

        refreshSlides();
        sync();
        if (!slides.length) {
            ensureFeedStacksBuilt();
            refreshSlides();
            sync();
        }

        return {
            id: cfg.id,
            panel: cfg.panel,
            sync: sync,
            go: go,
            reset: function () { index = 0; sync(); }
        };
    }

    var stacks = stackConfigs.map(createFeedStack).filter(Boolean);

    function refreshAllStacks() {
        ensureFeedStacksBuilt();
        stacks.forEach(function (s) { s.sync(); });
    }
    refreshAllStacks();
    document.addEventListener('DOMContentLoaded', refreshAllStacks);

    document.addEventListener('keydown', function (e) {
        if (!activeStack) return;
        var st = stacks.find(function (s) { return s.id === activeStack; });
        if (!st || !st.panel.classList.contains('active')) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); st.go(1); }
        if (e.key === 'ArrowUp') { e.preventDefault(); st.go(-1); }
    });

    window.addEventListener('resize', function () {
        stacks.forEach(function (s) { s.sync(); });
    });

    document.querySelectorAll('#feedTabs .tab[data-feed]').forEach(function (tab) {
        tab.addEventListener('click', function () {
            document.querySelectorAll('#feedTabs .tab[data-feed]').forEach(function (t) {
                t.classList.remove('active');
            });
            tab.classList.add('active');
            var mode = tab.getAttribute('data-feed');
            if (feedRec) feedRec.classList.toggle('active', mode === 'rec');
            if (feedFollow) feedFollow.classList.toggle('active', mode === 'follow');
            if (feedLive) feedLive.classList.toggle('active', mode === 'live');
            activeStack = mode;
            var st = stacks.find(function (s) { return s.id === mode; });
            if (st) st.sync();
        });
    });

    activeStack = 'rec';

    /* —— 创作 FAB —— */
    var fabWrap = document.getElementById('createFabWrap');
    var fabCloseTimer;
    document.getElementById('createFabMain')?.addEventListener('click', function () {
        location.href = 'create.html?type=image';
    });
    document.querySelectorAll('.create-fab-item').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var type = btn.getAttribute('data-create-type') || 'image';
            location.href = 'create.html?type=' + type;
        });
    });
    if (fabWrap) {
        fabWrap.addEventListener('mouseenter', function () {
            clearTimeout(fabCloseTimer);
            fabWrap.classList.add('is-open');
        });
        fabWrap.addEventListener('mouseleave', function () {
            fabCloseTimer = setTimeout(function () {
                fabWrap.classList.remove('is-open');
            }, 280);
        });
        fabWrap.addEventListener('click', function (e) {
            if (e.target.closest('.create-fab-item')) return;
            if (!e.target.closest('.create-fab-main')) {
                fabWrap.classList.toggle('is-open');
            }
        });
    }

    window.renderCreatorPendingLiveCard = function () {
        var badge = document.getElementById('createAsidePendingBadge');
        var numEl = document.getElementById('createAsideMetricPending');
        var copyN = document.getElementById('createAsidePendingCopyN');
        var metricLive = document.getElementById('createAsideMetricLive');
        var mount = document.getElementById('createAsideLiveReservationMount');
        var count = typeof window.ASIDE_PENDING_REVIEW_COUNT === 'number' ? window.ASIDE_PENDING_REVIEW_COUNT : 2;
        if (badge) badge.textContent = '审核 ' + count;
        if (numEl) numEl.textContent = String(count);
        if (copyN) copyN.textContent = String(count);
        if (!mount || typeof flLiveReservationGet !== 'function') return;
        var item = flLiveReservationGet();
        if (metricLive) metricLive.textContent = item ? '1' : '0';
        if (!item) {
            mount.innerHTML = '<div class="aside-live-empty" style="font-size:11px;color:var(--t-tertiary);line-height:1.55;padding:12px;border-radius:10px;background:var(--bg-input);border:1px dashed var(--border)">暂无预约直播。使用「新建直播 / 预约」创建；平台规则：每位创作者 <b style="color:#FDE68A">仅 1 场</b> 预约，超时 30 分钟未开播将自动关闭（原型为本地模拟）。</div>';
            return;
        }
        var tlabel = typeof flLiveReservationFormatTime === 'function' && item.scheduledAt
            ? flLiveReservationFormatTime(item.scheduledAt)
            : String(item.scheduleLabel || '');
        mount.innerHTML =
            '<div class="aside-live-compact" style="padding:11px 12px;border-radius:10px;border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.06)">' +
            '<div style="font-size:12.5px;font-weight:700">' + (item.title || '') + '</div>' +
            '<div style="font-size:10.5px;color:var(--t-secondary);margin-top:6px">' + tlabel + '</div>' +
            '<div style="display:flex;gap:6px;margin-top:10px">' +
            '<button type="button" class="btn btn-secondary btn-sm" onclick="location.href=\'live-detail.html\'"><i class="fa-solid fa-play"></i> 开播准备</button>' +
            '</div></div>';
    };

    if (document.getElementById('createAsideLiveReservationMount')) {
        window.renderCreatorPendingLiveCard();
    }

})();
