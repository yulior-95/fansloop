/**
 * 发现页 · 卡片点击 → app-main 沉浸详情
 */
(function () {
    var global = window;
    var T = global.FL_DISCOVER_TAXONOMY;
    var stage;
    var mainEl;
    var videoState = { playing: true, muted: true, tick: null };
    var gridBound = false;

    var api = {
        open: function () {},
        close: function () {},
        init: function () {}
    };
    global.FL_DISCOVER_DETAIL = api;

    if (!T) return;

    function img(id, w) {
        return 'https://images.unsplash.com/' + id + '?w=' + (w || 800) + '&q=85';
    }

    function esc(s) { return T.esc(s); }

    function formatCount(n) {
        if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + 'w';
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return String(Math.round(n));
    }

    function fmt(sec) {
        sec = Math.max(0, Math.floor(sec || 0));
        var m = Math.floor(sec / 60);
        var s = sec % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function toast(msg) {
        var el = document.getElementById('ddToast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { el.classList.remove('show'); }, 2200);
    }

    function getPost(id) {
        return T.posts.find(function (p) { return p.id === id; });
    }

    function isVideoPost(p) {
        return p && p.type === 'video' && !p.live;
    }

    function isVideoControl(target) {
        return target.closest(
            '[data-action="toggle-play"],[data-action="toggle-mute"],' +
            '[data-action="pip"],[data-action="pip-open"],[data-action="seek"],' +
            '[data-action="seek-wrap"],[data-disc-vp-controls],.disc-vp-progress-rail,.disc-vp-btn'
        );
    }

    function buildTagsHtml(p) {
        var html = '';
        if (p.live) html += '<span class="tg live">● LIVE</span>';
        if (p.premium) html += '<span class="tg premium"><i class="fa-solid fa-crown"></i> PREMIUM</span>';
        (p.hashtags || []).forEach(function (h) {
            html += '<span class="tg">#' + esc(h) + '</span>';
        });
        return html;
    }

    function sampleComments(p) {
        return (
            '<article class="dd-comment">' +
            '<div class="av" style="background-image:url(' + img('photo-1472099645785-5658abf4ff4e', 80) + ')"></div>' +
            '<div class="body"><div class="who">访客 <span>1 小时前</span></div>' +
            '<p class="txt">太棒了！期待更多 ' + esc(p.author) + ' 的内容</p>' +
            '<div class="acts"><button type="button">回复</button><button type="button">赞 12</button></div></div></article>'
        );
    }

    function mediaHtml(p) {
        if (isVideoPost(p)) {
            var src = p.videoSrc || '';
            return (
                '<video data-dd-video playsinline muted loop poster="' + img(p.cover, 1600) + '"' +
                (src ? ' src="' + src.replace(/"/g, '&quot;') + '"' : '') + '></video>' +
                '<div class="dd-pause-hint" aria-hidden="true"><div class="ring"><i class="fa-solid fa-play"></i></div></div>' +
                '<div class="disc-vp" data-disc-vp>' +
                '<div class="disc-vp-toolbar" data-disc-vp-controls>' +
                '<button type="button" class="disc-vp-btn disc-vp-play" data-dd-action="toggle-play" aria-label="暂停"><i class="fa-solid fa-pause"></i></button>' +
                '<div class="disc-vp-time"><span data-role="current">0:00</span><span class="sep">/</span><span data-role="duration">0:00</span></div>' +
                '<button type="button" class="disc-vp-btn disc-vp-mute is-muted" data-dd-action="toggle-mute" aria-label="开启声音">' +
                '<i class="fa-solid fa-volume-xmark"></i><i class="fa-solid fa-volume-high"></i></button></div>' +
                '<div class="disc-vp-progress-rail" data-dd-action="seek-wrap">' +
                '<div class="disc-vp-progress" data-dd-action="seek" role="slider">' +
                '<div class="disc-vp-progress-fill" data-role="fill"></div>' +
                '<div class="disc-vp-progress-thumb" data-role="thumb"></div></div></div></div>'
            );
        }
        return '<img src="' + img(p.cover, 1600) + '" alt="' + esc(p.title) + '">';
    }

    function likesLabel(p) {
        if (p.likes == null) return '0';
        return typeof p.likes === 'number' ? formatCount(p.likes) : String(p.likes);
    }

    function commentsLabel(p) {
        var n = p.comments || 0;
        return typeof n === 'number' && n > 999 ? formatCount(n) : String(n);
    }

    function renderStage(p) {
        var av = p.av ? img(p.av, 120) : img('photo-1438761681033-6461ffad8d80', 120);
        stage.innerHTML =
            '<div class="dd-media">' + mediaHtml(p) + '</div>' +
            '<div class="dd-top">' +
            '<button type="button" class="dd-close" id="ddClose" aria-label="关闭详情"><i class="fa-solid fa-arrow-left"></i></button>' +
            '<div class="dd-creator">' +
            '<div class="av" style="background-image:url(\'' + av + '\')"></div>' +
            '<div class="meta"><div class="n">' + esc(p.author) + '</div>' +
            '<div class="h">' + esc(p.handle || '') + '</div></div></div>' +
            '<button type="button" class="dd-follow" id="ddFollow" aria-label="关注"><i class="fa-solid fa-user-plus"></i></button></div>' +
            '<aside class="dd-rail" aria-label="互动操作">' +
            '<button type="button" class="dd-rail-btn" data-dd-like><i class="fa-regular fa-heart"></i><span>' + likesLabel(p) + '</span></button>' +
            '<button type="button" class="dd-rail-btn" data-dd-comment-open><i class="fa-regular fa-comment-dots"></i><span>' + commentsLabel(p) + '</span></button>' +
            '<button type="button" class="dd-rail-btn" data-dd-share><i class="fa-solid fa-share"></i><span>分享</span></button>' +
            '<button type="button" class="dd-rail-btn" data-dd-save><i class="fa-regular fa-bookmark"></i><span>收藏</span></button></aside>' +
            '<footer class="dd-bottom"><h1 class="dd-title">' + esc(p.title) + '</h1>' +
            '<div class="dd-tags">' + buildTagsHtml(p) + '</div></footer>' +
            '<div class="dd-comments-backdrop"></div>' +
            '<aside class="dd-comments-panel" aria-label="评论">' +
            '<header class="dd-comments-head"><div><h3>评论</h3><div class="count" id="ddCommentTotal">' + commentsLabel(p) + ' 条评论</div></div>' +
            '<button type="button" class="dd-comments-close" id="ddCommentsClose"><i class="fa-solid fa-xmark"></i></button></header>' +
            '<div class="dd-comments-list" id="ddCommentList">' + sampleComments(p) + '</div>' +
            '<div class="dd-comments-compose">' +
            '<input type="text" id="ddCommentInput" placeholder="说点什么…" maxlength="500" />' +
            '<button type="button" id="ddSendComment" disabled>发送</button></div></aside>' +
            '<div class="dd-toast" id="ddToast" role="status"></div>';

        bindStageEvents(p);
        if (isVideoPost(p)) bindDetailVideo();
    }

    function bindStageEvents(p) {
        document.getElementById('ddClose').addEventListener('click', close);
        document.getElementById('ddFollow').addEventListener('click', function () {
            var btn = document.getElementById('ddFollow');
            btn.classList.toggle('is-following');
            var on = btn.classList.contains('is-following');
            btn.innerHTML = on ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-user-plus"></i>';
            toast(on ? '已关注 ' + p.author : '已取消关注');
        });
        stage.querySelector('[data-dd-like]').addEventListener('click', function () {
            var btn = stage.querySelector('[data-dd-like]');
            btn.classList.toggle('is-liked');
            var icon = btn.querySelector('i');
            icon.classList.toggle('fa-regular', !btn.classList.contains('is-liked'));
            icon.classList.toggle('fa-solid', btn.classList.contains('is-liked'));
        });
        stage.querySelector('[data-dd-save]').addEventListener('click', function () {
            var btn = stage.querySelector('[data-dd-save]');
            btn.classList.toggle('is-saved');
            var icon = btn.querySelector('i');
            icon.classList.toggle('fa-regular', !btn.classList.contains('is-saved'));
            icon.classList.toggle('fa-solid', btn.classList.contains('is-saved'));
            toast(btn.classList.contains('is-saved') ? '已加入收藏' : '已取消收藏');
        });
        stage.querySelector('[data-dd-share]').addEventListener('click', function () {
            toast('分享链接已复制（原型）');
        });
        stage.querySelector('[data-dd-comment-open]').addEventListener('click', function () {
            stage.classList.add('dd-comments-open');
            document.getElementById('ddCommentInput').focus();
        });
        document.getElementById('ddCommentsClose').addEventListener('click', function () {
            stage.classList.remove('dd-comments-open');
        });
        stage.querySelector('.dd-comments-backdrop').addEventListener('click', function () {
            stage.classList.remove('dd-comments-open');
        });
        stage.querySelectorAll('.dd-tags .tg').forEach(function (tg) {
            tg.addEventListener('click', function () { toast('话题：' + tg.textContent); });
        });

        var input = document.getElementById('ddCommentInput');
        var send = document.getElementById('ddSendComment');
        input.addEventListener('input', function () { send.disabled = !input.value.trim(); });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !send.disabled) sendComment();
        });
        send.addEventListener('click', sendComment);
    }

    function sendComment() {
        var input = document.getElementById('ddCommentInput');
        var list = document.getElementById('ddCommentList');
        var text = (input.value || '').trim();
        if (!text) return;
        var item = document.createElement('article');
        item.className = 'dd-comment';
        item.innerHTML =
            '<div class="av" style="background-image:url(https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80)"></div>' +
            '<div class="body"><div class="who">Luna 🌙 <span>刚刚</span></div>' +
            '<p class="txt"></p><div class="acts"><button type="button">回复</button><button type="button">点赞</button></div></div>';
        item.querySelector('.txt').textContent = text;
        list.prepend(item);
        input.value = '';
        document.getElementById('ddSendComment').disabled = true;
        var n = list.querySelectorAll('.dd-comment').length;
        document.getElementById('ddCommentTotal').textContent = n + ' 条评论';
        stage.querySelector('[data-dd-comment-open] span').textContent = String(n);
        toast('评论已发布');
    }

    function bindDetailVideo() {
        var video = stage.querySelector('video[data-dd-video]');
        if (!video) return;
        videoState.playing = true;
        videoState.muted = true;
        video.muted = true;

        var playBtn = stage.querySelector('[data-dd-action="toggle-play"]');
        var muteBtn = stage.querySelector('[data-dd-action="toggle-mute"]');
        var seekWrap = stage.querySelector('[data-dd-action="seek-wrap"]');

        function syncUi() {
            var cur = video.currentTime || 0;
            var dur = video.duration && isFinite(video.duration) ? video.duration : 60;
            var pct = dur > 0 ? (cur / dur) * 100 : 0;
            var fill = stage.querySelector('[data-role="fill"]');
            var thumb = stage.querySelector('[data-role="thumb"]');
            if (fill) fill.style.width = pct + '%';
            if (thumb) thumb.style.left = pct + '%';
            var curEl = stage.querySelector('[data-role="current"]');
            var durEl = stage.querySelector('[data-role="duration"]');
            if (curEl) curEl.textContent = fmt(cur);
            if (durEl) durEl.textContent = fmt(dur);
        }

        function setPlaying(on) {
            videoState.playing = on;
            stage.classList.toggle('is-paused', !on);
            var ic = playBtn && playBtn.querySelector('i');
            if (ic) ic.className = on ? 'fa-solid fa-pause' : 'fa-solid fa-play';
            if (on) video.play().catch(function () {});
            else video.pause();
            clearInterval(videoState.tick);
            if (on) videoState.tick = setInterval(syncUi, 250);
        }

        playBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            setPlaying(!videoState.playing);
        });
        muteBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            videoState.muted = !videoState.muted;
            video.muted = videoState.muted;
            muteBtn.classList.toggle('is-muted', videoState.muted);
        });
        seekWrap.addEventListener('click', function (e) {
            e.stopPropagation();
            var bar = stage.querySelector('[data-dd-action="seek"]');
            var rect = bar.getBoundingClientRect();
            var ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
            var dur = video.duration && isFinite(video.duration) ? video.duration : 60;
            video.currentTime = ratio * dur;
            syncUi();
        });
        stage.querySelector('.dd-media').addEventListener('click', function (e) {
            if (e.target.closest('[data-disc-vp-controls], [data-dd-action], .dd-rail, .dd-top, .dd-bottom')) return;
            setPlaying(!videoState.playing);
        });
        video.addEventListener('loadedmetadata', syncUi);
        video.addEventListener('timeupdate', syncUi);
        video.addEventListener('ended', function () { setPlaying(false); });
        setPlaying(true);
        syncUi();
    }

    function pauseGridVideo() {
        var VP = global.FL_DISCOVER_VIDEO;
        if (VP && VP.closePip) VP.closePip();
        document.querySelectorAll('#discContentGrid [data-disc-vp] video').forEach(function (v) { v.pause(); });
    }

    function open(id) {
        var p = getPost(id);
        if (!p) return;
        if (p.live) {
            location.href = 'live-detail.html';
            return;
        }
        if (!ensureDom()) return;

        pauseGridVideo();
        renderStage(p);
        stage.hidden = false;
        stage.classList.add('is-open');
        stage.setAttribute('aria-hidden', 'false');
        mainEl.classList.add('app-main--dd');
        document.body.classList.add('disc-detail-open');
        mainEl.scrollTop = 0;

        var params = new URLSearchParams(location.search);
        params.set('post', id);
        history.replaceState({ discDetail: id }, '', location.pathname + '?' + params.toString());
    }

    function close() {
        if (!stage) return;
        clearInterval(videoState.tick);
        stage.hidden = true;
        stage.classList.remove('is-open', 'dd-comments-open', 'is-paused');
        stage.setAttribute('aria-hidden', 'true');
        if (mainEl) mainEl.classList.remove('app-main--dd');
        document.body.classList.remove('disc-detail-open');
        var params = new URLSearchParams(location.search);
        params.delete('post');
        var qs = params.toString();
        history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
        var VP = global.FL_DISCOVER_VIDEO;
        if (VP && VP.refreshFromGrid) VP.refreshFromGrid();
    }

    function onGridClick(e) {
        if (isVideoControl(e.target)) return;
        var tile = e.target.closest('.content-tile[data-post-id]');
        if (!tile || !document.getElementById('discContentGrid').contains(tile)) return;
        e.preventDefault();
        e.stopPropagation();
        open(tile.getAttribute('data-post-id'));
    }

    function ensureDom() {
        mainEl = document.querySelector('.app-main');
        stage = document.getElementById('ddStage');
        return !!(mainEl && stage);
    }

    function bindGrid() {
        if (gridBound) return;
        var grid = document.getElementById('discContentGrid');
        if (!grid) return;
        gridBound = true;
        grid.addEventListener('click', onGridClick, true);
        grid.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            var tile = e.target.closest('.content-tile[data-post-id]');
            if (!tile) return;
            if (isVideoControl(e.target)) return;
            e.preventDefault();
            open(tile.getAttribute('data-post-id'));
        });
    }

    function init() {
        if (!ensureDom()) return;
        bindGrid();
        var post = new URLSearchParams(location.search).get('post');
        if (post && getPost(post) && stage.hidden) open(post);
    }

    api.open = open;
    api.close = close;
    api.init = init;
    api.bindGrid = bindGrid;

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || !stage || stage.hidden) return;
        if (stage.classList.contains('dd-comments-open')) {
            stage.classList.remove('dd-comments-open');
        } else {
            close();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
