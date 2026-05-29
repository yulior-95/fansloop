/**
 * 发现页 · 真实 <video> 播放 + 悬浮屏
 */
(function (global) {
    var T = global.FL_DISCOVER_TAXONOMY;
    if (!T) return;

    var DEFAULT_SEC = 60;
    var state = {
        videos: [],
        activeId: null,
        playing: false,
        current: 0,
        duration: DEFAULT_SEC,
        muted: true,
        pipOpen: false,
        drag: null
    };

    function img(id, w) {
        return 'https://images.unsplash.com/' + id + '?w=' + (w || 600) + '&q=80';
    }

    function getPost(id) {
        return state.videos.find(function (p) { return p.id === id; }) ||
            T.posts.find(function (p) { return p.id === id; });
    }

    function getIndex(id) {
        return state.videos.findIndex(function (p) { return p.id === id; });
    }

    function fmt(sec) {
        if (!isFinite(sec) || sec < 0) sec = 0;
        sec = Math.floor(sec);
        var h = Math.floor(sec / 3600);
        var m = Math.floor((sec % 3600) / 60);
        var s = sec % 60;
        var pad = function (n) { return n < 10 ? '0' + n : String(n); };
        if (h > 0) return h + ':' + pad(m) + ':' + pad(s);
        return m + ':' + pad(s);
    }

    function inlineVideoEl(postId) {
        var vp = document.querySelector('[data-disc-vp][data-video-id="' + postId + '"]');
        return vp ? vp.querySelector('video.disc-vp-video') : null;
    }

    function pipVideoEl() {
        var pip = document.getElementById('discPip');
        return pip ? pip.querySelector('video.disc-vp-video--pip') : null;
    }

    function playbackVideo() {
        if (state.pipOpen) return pipVideoEl();
        return state.activeId ? inlineVideoEl(state.activeId) : null;
    }

    function allInlineVideos() {
        return document.querySelectorAll('[data-disc-vp] video.disc-vp-video');
    }

    function ensureSrc(video, p) {
        if (!video || !p || !p.videoSrc) return;
        if (video.dataset.srcLoaded !== p.videoSrc) {
            video.src = p.videoSrc;
            video.dataset.srcLoaded = p.videoSrc;
            video.load();
        }
    }

    function toolbarHtml(opts) {
        opts = opts || {};
        var pipBtn = opts.inPip
            ? '<button type="button" class="disc-vp-btn disc-vp-pip" data-action="pip" aria-label="悬浮播放"><i class="fa-solid fa-clone"></i></button>'
            : '<button type="button" class="disc-vp-btn disc-vp-pip" data-action="pip-open" aria-label="悬浮播放"><i class="fa-solid fa-clone"></i></button>';
        return (
            '<div class="disc-vp-toolbar" data-disc-vp-controls>' +
            '<button type="button" class="disc-vp-btn disc-vp-play" data-action="toggle-play" aria-label="播放">' +
            '<i class="fa-solid fa-play"></i></button>' +
            '<div class="disc-vp-time"><span data-role="current">0:00</span><span class="sep">/</span><span data-role="duration">0:00</span></div>' +
            '<button type="button" class="disc-vp-btn disc-vp-mute is-muted" data-action="toggle-mute" aria-label="开启声音">' +
            '<i class="fa-solid fa-volume-xmark"></i><i class="fa-solid fa-volume-high"></i></button>' +
            pipBtn + '</div>'
        );
    }

    function progressRailHtml() {
        return (
            '<div class="disc-vp-progress-rail" data-action="seek-wrap">' +
            '<div class="disc-vp-progress" data-action="seek" role="slider" tabindex="0">' +
            '<div class="disc-vp-progress-fill" data-role="fill"></div>' +
            '<div class="disc-vp-progress-thumb" data-role="thumb"></div></div></div>'
        );
    }

    function buildVideoCoverInner(p) {
        var poster = img(p.cover, 1200);
        var src = p.videoSrc || '';
        return (
            '<div class="disc-vp" data-disc-vp data-video-id="' + p.id + '">' +
            '<video class="disc-vp-video" playsinline loop muted preload="metadata" ' +
            'poster="' + poster + '"' + (src ? ' data-src="' + src + '"' : '') + '></video>' +
            '<div class="disc-vp-poster" style="background-image:url(\'' + poster + '\')"></div>' +
            '<div class="disc-vp-pip-badge" aria-hidden="true">' +
            '<span class="pip-pulse"><i class="fa-solid fa-play"></i></span><span>正在播放</span></div>' +
            toolbarHtml({ inPip: false }) +
            progressRailHtml() + '</div>'
        );
    }

    function buildPipDom() {
        if (document.getElementById('discPip')) return;
        var el = document.createElement('div');
        el.id = 'discPip';
        el.className = 'disc-pip';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML =
            '<div class="disc-pip-shell">' +
            '<div class="disc-pip-panel">' +
            '<button type="button" class="disc-pip-back" data-action="pip-close">' +
            '<i class="fa-solid fa-down-left-and-up-right-to-center"></i> 回到列表</button>' +
            '<div class="disc-pip-media" data-role="pip-media">' +
            '<video class="disc-vp-video disc-vp-video--pip" playsinline loop muted preload="metadata"></video></div>' +
            '<div class="disc-pip-info"><div class="pip-title" data-role="pip-title"></div>' +
            '<div class="pip-author"><span data-role="pip-author"></span></div></div>' +
            toolbarHtml({ inPip: true }) +
            '<div class="disc-vp-progress-rail disc-vp-progress-rail--pip" data-action="seek-wrap">' +
            '<div class="disc-vp-progress" data-action="seek" role="slider" tabindex="0">' +
            '<div class="disc-vp-progress-fill" data-role="fill"></div>' +
            '<div class="disc-vp-progress-thumb" data-role="thumb"></div></div></div></div>' +
            '<div class="disc-pip-nav">' +
            '<button type="button" data-action="pip-prev" aria-label="上一个"><i class="fa-solid fa-chevron-up"></i></button>' +
            '<button type="button" data-action="pip-next" aria-label="下一个"><i class="fa-solid fa-chevron-down"></i></button>' +
            '</div></div>';
        document.body.appendChild(el);
        var pv = pipVideoEl();
        if (pv) bindVideoEvents(pv);
    }

    function pauseAllExcept(keep) {
        allInlineVideos().forEach(function (v) {
            if (v !== keep) {
                v.pause();
                var vp = v.closest('[data-disc-vp]');
                if (vp) vp.classList.remove('is-playing');
            }
        });
        var pip = pipVideoEl();
        if (pip && pip !== keep) pip.pause();
    }

    function applyPlayback() {
        var p = getPost(state.activeId);
        var target = playbackVideo();
        if (!p || !target) return;

        ensureSrc(target, p);
        target.muted = state.muted;

        if (state.pipOpen) {
            var inline = inlineVideoEl(state.activeId);
            if (inline) {
                inline.pause();
                var ivp = inline.closest('[data-disc-vp]');
                if (ivp) ivp.classList.remove('is-playing');
            }
            if (Math.abs(target.currentTime - state.current) > 0.35) {
                target.currentTime = state.current;
            }
        } else {
            var pip = pipVideoEl();
            if (pip) pip.pause();
            if (Math.abs(target.currentTime - state.current) > 0.35) {
                target.currentTime = state.current;
            }
        }

        pauseAllExcept(target);

        var vp = target.closest('[data-disc-vp]') || target.closest('.disc-pip-panel');
        if (state.playing) {
            var playPromise = target.play();
            if (playPromise && playPromise.catch) {
                playPromise.catch(function () { state.playing = false; syncAllUi(); });
            }
            var ivp = target.closest('[data-disc-vp]');
            if (ivp) ivp.classList.add('is-playing');
            var panel = target.closest('.disc-pip-panel');
            if (panel) panel.classList.add('is-playing');
        } else {
            target.pause();
            var ivp2 = target.closest('[data-disc-vp]');
            if (ivp2) ivp2.classList.remove('is-playing');
            var panel2 = target.closest('.disc-pip-panel');
            if (panel2) panel2.classList.remove('is-playing');
        }
    }

    function syncPipVideoSrc() {
        var p = getPost(state.activeId);
        var pip = pipVideoEl();
        if (!p || !pip || !state.pipOpen) return;
        ensureSrc(pip, p);
        pip.poster = img(p.cover, 1200);
    }

    function onVideoTimeUpdate(video) {
        if (video !== playbackVideo()) return;
        state.current = video.currentTime || 0;
        if (video.duration && isFinite(video.duration)) {
            state.duration = video.duration;
        }
        syncAllUi();
    }

    function onVideoLoadedMetadata(video) {
        if (video.duration && isFinite(video.duration)) {
            if (video === playbackVideo() || video === inlineVideoEl(state.activeId)) {
                state.duration = video.duration;
                syncAllUi();
            }
        }
    }

    function bindVideoEvents(video) {
        if (!video || video.getAttribute('data-ev-bound') === '1') return;
        video.setAttribute('data-ev-bound', '1');
        video.addEventListener('timeupdate', function () { onVideoTimeUpdate(video); });
        video.addEventListener('loadedmetadata', function () { onVideoLoadedMetadata(video); });
        video.addEventListener('ended', function () {
            if (video.loop) return;
            state.playing = false;
            syncAllUi();
        });
        video.addEventListener('play', function () {
            var vp = video.closest('[data-disc-vp]');
            if (vp) vp.classList.add('is-playing');
        });
        video.addEventListener('pause', function () {
            var vp = video.closest('[data-disc-vp]');
            if (vp && video !== playbackVideo()) return;
            if (!state.playing && vp) vp.classList.remove('is-playing');
        });
    }

    function lazyLoadVisibleVideos() {
        document.querySelectorAll('[data-disc-vp]').forEach(function (vp) {
            var id = vp.getAttribute('data-video-id');
            var p = getPost(id);
            var video = vp.querySelector('video.disc-vp-video');
            if (!video || !p) return;
            bindVideoEvents(video);
            if (id === state.activeId || vp.closest('.content-tile--hero')) {
                ensureSrc(video, p);
            }
        });
    }

    function setActive(id, opts) {
        opts = opts || {};
        var p = getPost(id);
        if (!p) return;
        state.activeId = id;
        if (opts.resetTime) state.current = 0;
        if (opts.keepPaused) state.playing = false;
        else if (opts.autoplay !== false) state.playing = true;

        lazyLoadVisibleVideos();
        if (state.pipOpen) syncPipVideoSrc();
        applyPlayback();
        syncAllUi();
    }

    function syncProgressUi(root) {
        if (!root) return;
        var pct = state.duration > 0 ? (state.current / state.duration) * 100 : 0;
        pct = Math.max(0, Math.min(100, pct));
        var fill = root.querySelector('[data-role="fill"]');
        var thumb = root.querySelector('[data-role="thumb"]');
        var cur = root.querySelector('[data-role="current"]');
        var dur = root.querySelector('[data-role="duration"]');
        if (fill) fill.style.width = pct + '%';
        if (thumb) thumb.style.left = pct + '%';
        if (cur) cur.textContent = fmt(state.current);
        if (dur) dur.textContent = fmt(state.duration);
    }

    function syncPlayUi(root) {
        if (!root) return;
        var btn = root.querySelector('[data-action="toggle-play"]');
        if (!btn) return;
        var icon = btn.querySelector('i');
        if (state.playing) {
            btn.setAttribute('aria-label', '暂停');
            if (icon) icon.className = 'fa-solid fa-pause';
        } else {
            btn.setAttribute('aria-label', '播放');
            if (icon) icon.className = 'fa-solid fa-play';
        }
    }

    function syncMuteUi(root) {
        if (!root) return;
        var btn = root.querySelector('[data-action="toggle-mute"]');
        if (!btn) return;
        btn.classList.toggle('is-muted', state.muted);
        btn.setAttribute('aria-label', state.muted ? '开启声音' : '静音');
    }

    function syncTileStates() {
        document.querySelectorAll('.content-tile--video').forEach(function (tile) {
            var id = tile.getAttribute('data-post-id');
            tile.classList.toggle('is-pip-source', state.pipOpen && id === state.activeId);
        });
    }

    function syncPipPanel() {
        var pip = document.getElementById('discPip');
        if (!pip) return;
        var p = getPost(state.activeId);
        if (!p || !state.pipOpen) {
            pip.classList.remove('is-open');
            pip.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('disc-pip-active');
            applyPlayback();
            return;
        }
        pip.classList.add('is-open');
        pip.setAttribute('aria-hidden', 'false');
        document.body.classList.add('disc-pip-active');
        var title = pip.querySelector('[data-role="pip-title"]');
        if (title) title.textContent = p.title;
        var author = pip.querySelector('[data-role="pip-author"]');
        if (author) author.textContent = p.author + (p.handle ? ' · ' + p.handle : '');
        var idx = getIndex(state.activeId);
        var prev = pip.querySelector('[data-action="pip-prev"]');
        var next = pip.querySelector('[data-action="pip-next"]');
        if (prev) prev.disabled = idx <= 0;
        if (next) next.disabled = idx < 0 || idx >= state.videos.length - 1;
        syncPipVideoSrc();
        applyPlayback();
        syncProgressUi(pip);
        syncPlayUi(pip);
        syncMuteUi(pip);
    }

    function syncInlinePlayers() {
        document.querySelectorAll('[data-disc-vp]').forEach(function (vp) {
            if (vp.getAttribute('data-video-id') !== state.activeId) return;
            if (state.pipOpen) return;
            syncProgressUi(vp);
            syncPlayUi(vp);
            syncMuteUi(vp);
        });
    }

    function syncAllUi() {
        syncInlinePlayers();
        if (!state.pipOpen) {
            var vp = document.querySelector('[data-disc-vp][data-video-id="' + state.activeId + '"]');
            if (vp) {
                syncProgressUi(vp);
                syncPlayUi(vp);
                syncMuteUi(vp);
            }
        }
        syncPipPanel();
        syncTileStates();
    }

    function seekTo(ratio) {
        ratio = Math.max(0, Math.min(1, ratio));
        state.current = ratio * state.duration;
        var v = playbackVideo();
        if (v && v.duration) {
            v.currentTime = ratio * v.duration;
        }
        syncAllUi();
    }

    function seekFromClientX(bar, clientX) {
        var rect = bar.getBoundingClientRect();
        seekTo((clientX - rect.left) / rect.width);
    }

    function onPointerDown(e) {
        var bar = e.target.closest('[data-action="seek"]');
        if (!bar) return;
        e.preventDefault();
        e.stopPropagation();
        state.drag = { bar: bar };
        bar.classList.add('is-dragging');
        seekFromClientX(bar, e.clientX);
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    }

    function onPointerMove(e) {
        if (state.drag) seekFromClientX(state.drag.bar, e.clientX);
    }

    function onPointerUp() {
        if (state.drag && state.drag.bar) state.drag.bar.classList.remove('is-dragging');
        state.drag = null;
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
    }

    function openPip() {
        if (!state.activeId) return;
        var inline = inlineVideoEl(state.activeId);
        if (inline) {
            state.current = inline.currentTime || state.current;
            if (inline.duration && isFinite(inline.duration)) state.duration = inline.duration;
            inline.pause();
        }
        state.pipOpen = true;
        syncPipPanel();
    }

    function closePip() {
        var pip = pipVideoEl();
        if (pip) {
            state.current = pip.currentTime || state.current;
            pip.pause();
        }
        state.pipOpen = false;
        syncAllUi();
        applyPlayback();
    }

    function switchVideo(delta) {
        var idx = getIndex(state.activeId);
        var next = state.videos[idx + delta];
        if (next) setActive(next.id, { resetTime: false, autoplay: state.playing });
    }

    function handleAction(action) {
        switch (action) {
            case 'toggle-play':
                state.playing = !state.playing;
                applyPlayback();
                syncAllUi();
                break;
            case 'toggle-mute':
                state.muted = !state.muted;
                allInlineVideos().forEach(function (v) { v.muted = state.muted; });
                var pip = pipVideoEl();
                if (pip) pip.muted = state.muted;
                syncAllUi();
                break;
            case 'pip-open':
            case 'pip':
                openPip();
                break;
            case 'pip-close':
                closePip();
                break;
            case 'pip-prev':
                switchVideo(-1);
                break;
            case 'pip-next':
                switchVideo(1);
                break;
        }
    }

    function onClick(e) {
        var seekWrap = e.target.closest('[data-action="seek-wrap"]');
        if (seekWrap && !e.target.closest('[data-action="toggle-play"],[data-action="toggle-mute"],[data-action="pip"],[data-action="pip-open"]')) {
            var bar = seekWrap.querySelector('[data-action="seek"]');
            if (bar) {
                e.preventDefault();
                e.stopPropagation();
                var tile = e.target.closest('.content-tile--video');
                if (tile) setActive(tile.getAttribute('data-post-id'), { keepPaused: !state.playing });
                seekFromClientX(bar, e.clientX);
                return;
            }
        }
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var action = btn.getAttribute('data-action');
        if (action === 'seek') return;
        e.preventDefault();
        e.stopPropagation();
        var tile = e.target.closest('.content-tile--video');
        if (tile) {
            var id = tile.getAttribute('data-post-id');
            if (id !== state.activeId) setActive(id, { autoplay: true });
        }
        handleAction(action);
    }

    function bindNavClose() {
        document.querySelectorAll('.app-sidebar .s-item').forEach(function (item) {
            item.addEventListener('click', function () {
                var oc = item.getAttribute('onclick') || '';
                if (oc.indexOf('discover.html') >= 0) return;
                pauseAllExcept(null);
                closePip();
                state.activeId = null;
                state.playing = false;
            });
        });
    }

    function bindGlobal() {
        buildPipDom();
        var grid = document.getElementById('discContentGrid');
        if (grid && !grid.getAttribute('data-vp-bound')) {
            grid.setAttribute('data-vp-bound', '1');
            grid.addEventListener('click', onClick);
            grid.addEventListener('pointerdown', onPointerDown);
        }
        var pip = document.getElementById('discPip');
        if (pip && !pip.getAttribute('data-vp-bound')) {
            pip.setAttribute('data-vp-bound', '1');
            pip.addEventListener('click', onClick);
            pip.addEventListener('pointerdown', onPointerDown);
        }
        bindNavClose();
    }

    function refreshFromGrid() {
        var list = [];
        document.querySelectorAll('.content-tile--video[data-post-id]').forEach(function (tile) {
            var p = T.posts.find(function (x) { return x.id === tile.getAttribute('data-post-id'); });
            if (p) list.push(p);
        });
        state.videos = list;
        if (state.activeId && getIndex(state.activeId) < 0) {
            state.activeId = null;
            state.pipOpen = false;
            state.playing = false;
        }
        lazyLoadVisibleVideos();
        if (!state.activeId && list.length) {
            setActive(list[0].id, { autoplay: false, keepPaused: true });
        } else if (state.activeId) {
            applyPlayback();
        }
        syncAllUi();
    }

    global.FL_DISCOVER_VIDEO = {
        buildVideoCoverInner: buildVideoCoverInner,
        refreshFromGrid: refreshFromGrid,
        init: function () { bindGlobal(); refreshFromGrid(); },
        closePip: closePip
    };
})(window);
