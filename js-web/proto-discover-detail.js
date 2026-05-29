/**
 * 发现页 · 沉浸详情原型交互
 */
(function () {
    var stage = document.getElementById('ddStage');
    if (!stage) return;

    var toastEl = document.getElementById('ddToast');
    var toastTimer;

    function toast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
    }

    function closeDetail() {
        location.href = 'discover.html';
    }

    document.getElementById('ddClose')?.addEventListener('click', closeDetail);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (stage.classList.contains('dd-comments-open')) {
                stage.classList.remove('dd-comments-open');
            } else {
                closeDetail();
            }
        }
    });

    var followBtn = document.getElementById('ddFollow');
    if (followBtn) {
        followBtn.addEventListener('click', function () {
            followBtn.classList.toggle('is-following');
            var on = followBtn.classList.contains('is-following');
            followBtn.setAttribute('aria-label', on ? '已关注' : '关注');
            followBtn.innerHTML = on ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-user-plus"></i>';
            toast(on ? '已关注 Lens 旅记' : '已取消关注');
        });
    }

    stage.querySelectorAll('[data-dd-like]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            btn.classList.toggle('is-liked');
            var icon = btn.querySelector('i');
            var count = btn.querySelector('span');
            if (icon) {
                icon.classList.toggle('fa-regular', !btn.classList.contains('is-liked'));
                icon.classList.toggle('fa-solid', btn.classList.contains('is-liked'));
            }
            if (count) {
                var n = parseFloat((count.textContent || '0').replace(/[^\d.]/g, '')) || 0;
                count.textContent = btn.classList.contains('is-liked')
                    ? formatCount(n + 1)
                    : formatCount(Math.max(0, n - 1));
            }
        });
    });

    stage.querySelectorAll('[data-dd-save]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            btn.classList.toggle('is-saved');
            var icon = btn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-regular', !btn.classList.contains('is-saved'));
                icon.classList.toggle('fa-solid', btn.classList.contains('is-saved'));
            }
            toast(btn.classList.contains('is-saved') ? '已加入收藏' : '已取消收藏');
        });
    });

    stage.querySelectorAll('[data-dd-share]').forEach(function (btn) {
        btn.addEventListener('click', function () { toast('分享链接已复制（原型）'); });
    });

    function formatCount(n) {
        if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + 'w';
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return String(Math.round(n));
    }

    /* —— 评论抽屉 —— */
    var commentsOpen = stage.classList.contains('dd-comments-open');

    function openComments() {
        stage.classList.add('dd-comments-open');
        document.getElementById('ddCommentInput')?.focus();
    }
    function closeComments() {
        stage.classList.remove('dd-comments-open');
    }

    stage.querySelectorAll('[data-dd-comment-open]').forEach(function (btn) {
        btn.addEventListener('click', openComments);
    });
    document.getElementById('ddCommentsClose')?.addEventListener('click', closeComments);
    stage.querySelector('.dd-comments-backdrop')?.addEventListener('click', closeComments);

    var commentList = document.getElementById('ddCommentList');
    var commentInput = document.getElementById('ddCommentInput');
    var sendBtn = document.getElementById('ddSendComment');
    var commentTotal = document.getElementById('ddCommentTotal');

    function updateCommentCount() {
        var n = commentList ? commentList.querySelectorAll('.dd-comment').length : 0;
        if (commentTotal) commentTotal.textContent = n + ' 条评论';
        var rail = stage.querySelector('[data-dd-comment-open] span');
        if (rail) rail.textContent = n > 999 ? formatCount(n) : String(n);
    }

    function sendComment() {
        var text = (commentInput?.value || '').trim();
        if (!text || !commentList) return;
        var item = document.createElement('article');
        item.className = 'dd-comment';
        item.innerHTML =
            '<div class="av" style="background-image:url(https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80)"></div>' +
            '<div class="body"><div class="who">Luna 🌙 <span>刚刚</span></div>' +
            '<p class="txt"></p><div class="acts"><button type="button">回复</button><button type="button">点赞</button></div></div>';
        item.querySelector('.txt').textContent = text;
        commentList.prepend(item);
        commentInput.value = '';
        if (sendBtn) sendBtn.disabled = true;
        updateCommentCount();
        toast('评论已发布');
    }

    if (commentInput && sendBtn) {
        sendBtn.disabled = !commentInput.value.trim();
        commentInput.addEventListener('input', function () {
            sendBtn.disabled = !commentInput.value.trim();
        });
        commentInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !sendBtn.disabled) sendComment();
        });
        sendBtn.addEventListener('click', sendComment);
    }

    if (commentsOpen) updateCommentCount();

    stage.querySelectorAll('.dd-tags .tg').forEach(function (tg) {
        tg.addEventListener('click', function () { toast('话题：' + tg.textContent); });
    });

    /* —— 视频播放 —— */
    var video = stage.querySelector('video[data-dd-video]');
    if (!video) return;

    var isPlaying = !stage.classList.contains('is-paused');
    var duration = 60;
    var tickTimer;

    var playBtn = stage.querySelector('[data-action="toggle-play"]');
    var muteBtn = stage.querySelector('[data-action="toggle-mute"]');
    var curEl = stage.querySelector('[data-role="current"]');
    var durEl = stage.querySelector('[data-role="duration"]');
    var fillEl = stage.querySelector('[data-role="fill"]');
    var thumbEl = stage.querySelector('[data-role="thumb"]');
    var seekWrap = stage.querySelector('[data-action="seek-wrap"]');
    var pauseHint = stage.querySelector('.dd-pause-hint');

    function fmt(sec) {
        sec = Math.max(0, Math.floor(sec || 0));
        var m = Math.floor(sec / 60);
        var s = sec % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function setPlaying(on) {
        isPlaying = on;
        stage.classList.toggle('is-paused', !on);
        if (playBtn) {
            var ic = playBtn.querySelector('i');
            if (ic) ic.className = on ? 'fa-solid fa-pause' : 'fa-solid fa-play';
            playBtn.setAttribute('aria-label', on ? '暂停' : '播放');
        }
        if (pauseHint) pauseHint.querySelector('i').className = on ? '' : 'fa-solid fa-play';
        if (on) {
            video.play().catch(function () {});
            startTick();
        } else {
            video.pause();
            stopTick();
        }
    }

    function syncUi() {
        var cur = video.currentTime || 0;
        var dur = video.duration && isFinite(video.duration) ? video.duration : duration;
        if (curEl) curEl.textContent = fmt(cur);
        if (durEl) durEl.textContent = fmt(dur);
        var pct = dur > 0 ? (cur / dur) * 100 : 0;
        if (fillEl) fillEl.style.width = pct + '%';
        if (thumbEl) thumbEl.style.left = pct + '%';
    }

    function startTick() {
        stopTick();
        tickTimer = setInterval(syncUi, 250);
    }
    function stopTick() {
        clearInterval(tickTimer);
    }

    video.addEventListener('loadedmetadata', function () {
        if (video.duration && isFinite(video.duration)) duration = video.duration;
        syncUi();
    });
    video.addEventListener('timeupdate', syncUi);
    video.addEventListener('ended', function () { setPlaying(false); });

    playBtn?.addEventListener('click', function (e) {
        e.stopPropagation();
        setPlaying(!isPlaying);
    });

    stage.querySelector('.dd-media')?.addEventListener('click', function (e) {
        if (e.target.closest('[data-disc-vp-controls], [data-action="seek-wrap"], .dd-rail, .dd-top, .dd-bottom')) return;
        setPlaying(!isPlaying);
    });

    var muted = true;
    video.muted = true;
    muteBtn?.addEventListener('click', function (e) {
        e.stopPropagation();
        muted = !muted;
        video.muted = muted;
        muteBtn.classList.toggle('is-muted', muted);
        muteBtn.setAttribute('aria-label', muted ? '开启声音' : '静音');
    });

    function seekTo(clientX) {
        var rail = stage.querySelector('[data-action="seek"]');
        if (!rail) return;
        var rect = rail.getBoundingClientRect();
        var ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        var dur = video.duration && isFinite(video.duration) ? video.duration : duration;
        video.currentTime = ratio * dur;
        syncUi();
    }

    seekWrap?.addEventListener('click', function (e) {
        e.stopPropagation();
        seekTo(e.clientX);
    });

    setPlaying(isPlaying);
    syncUi();
})();
