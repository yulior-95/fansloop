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

    var currentPostId = null;

    var A = global.FL_DISCOVER_ACCESS || {
        canViewFull: function (p) { return !p || !p.premium; },
        needsTeaser: function (p) { return !!(p && p.premium); },
        payLabel: function () { return '订阅专享'; },
        subscribePrice: function () { return 28; },
        paidPostCount: function () { return 12; }
    };

    var PREVIEW_SEC = 12;

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

    function isShareModalOpen() {
        var root = document.getElementById('flStandaloneModalRoot');
        return !!(root && root.style.display === 'flex');
    }

    function isSubscribeModalOpen() {
        var ovl = document.getElementById('ovlSubscribe');
        return !!(ovl && ovl.classList.contains('show'));
    }

    function openShare() {
        if (window.FL_openInteractionModal) {
            window.FL_openInteractionModal('share-modal.html');
            return;
        }
        toast('分享链接已复制（原型）');
    }

    function openSubscribeFlow(p) {
        function launch() {
            if (window.FL_openSubscribeForCreator) {
                window.FL_openSubscribeForCreator({
                    creator: p.author,
                    price: A.subscribePrice(p),
                    av: p.av ? img(p.av, 200) : ''
                });
                return;
            }
            if (window.FL_openSubscribeModal) {
                var btn = document.createElement('button');
                btn.setAttribute('data-creator', p.author);
                btn.setAttribute('data-plan', String(A.subscribePrice(p)));
                if (p.av) btn.setAttribute('data-av', img(p.av, 200));
                window.FL_openSubscribeModal(btn);
                return;
            }
            location.href = 'flow-subscribe-creator.html';
        }
        if (!document.getElementById('ovlSubscribe') && window.FL_mountSubscribeOverlay) {
            window.FL_mountSubscribeOverlay().then(launch);
            return;
        }
        launch();
    }

    function markCreatorSubscribed(creatorId) {
        if (!creatorId) return;
        try {
            var subs = JSON.parse(localStorage.getItem('fl_disc_mock_subs') || '[]');
            if (subs.indexOf(creatorId) < 0) {
                subs.push(creatorId);
                localStorage.setItem('fl_disc_mock_subs', JSON.stringify(subs));
            }
        } catch (_) { /* noop */ }
    }

    function bindSubscribePaidListener() {
        if (global._flDiscSubPaidBound) return;
        global._flDiscSubPaidBound = true;
        document.addEventListener('fl-subscribe-paid', function (e) {
            var name = e.detail && e.detail.creator;
            if (!name) return;
            var post = T.posts.find(function (p) { return p.author === name; });
            if (!post) return;
            markCreatorSubscribed(post.creatorId);
            if (!stage || stage.hidden || currentPostId !== post.id) return;
            if (window.FL_closeSubscribeModal) window.FL_closeSubscribeModal();
            renderStage(post);
            toast('订阅成功，已解锁完整内容');
        });
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
        (p.hashtags || []).forEach(function (h) {
            html += '<span class="tg">#' + esc(h) + '</span>';
        });
        return html;
    }

    function paywallHtml(p) {
        var price = A.subscribePrice(p);
        var count = A.paidPostCount(p);
        var ppv = p.payType === 'ppv' && p.price != null;
        return (
            '<div class="dd-paywall" role="dialog" aria-label="解锁内容">' +
            '<div class="dd-paywall-icon"><i class="fa-solid fa-lock"></i></div>' +
            '<p class="dd-paywall-tip">' + (ppv ? '按篇购买后可反复观看' : '订阅后查看全部专享内容') + '</p>' +
            '<p class="dd-paywall-sub">@' + esc((p.handle || '').replace(/^@/, '')) + ' 另有 <b>' + count + '</b> 条专享内容</p>' +
            (ppv
                ? '<div class="dd-paywall-price"><span class="amt">$' + esc(String(p.price)) + '</span><span class="unit">USDT · 单篇</span></div>' +
                  '<button type="button" class="dd-paywall-cta" data-dd-unlock-ppv><i class="fa-solid fa-bolt"></i> 支付并解锁</button>' +
                  '<button type="button" class="dd-paywall-ghost" data-dd-subscribe>或订阅 $' + price + '/月</button>'
                : '<div class="dd-paywall-price"><span class="amt">' + price + '</span><span class="unit">USDT / 月</span></div>' +
                  '<button type="button" class="dd-paywall-cta" data-dd-subscribe><i class="fa-solid fa-crown"></i> 立即订阅</button>') +
            '</div>'
        );
    }

    function excerptHtml(p) {
        if (!p.summary) return '';
        return '<p class="dd-excerpt">' + esc(p.summary) + '</p>';
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

    function mediaHtml(p, locked) {
        if (isVideoPost(p)) {
            var src = p.videoSrc || '';
            var loopAttr = locked ? '' : ' loop';
            return (
                '<video data-dd-video playsinline muted' + loopAttr + ' poster="' + img(p.cover, 1600) + '"' +
                (src ? ' src="' + src.replace(/"/g, '&quot;') + '"' : '') + '></video>' +
                (locked ? '<div class="dd-teaser-badge"><i class="fa-solid fa-lock"></i> 试看 ' + PREVIEW_SEC + ' 秒 · 订阅解锁完整版</div>' : '') +
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
        if (locked) {
            var cover = img(p.cover, 1600);
            return (
                '<div class="dd-media-split" aria-hidden="true">' +
                '<div class="dd-media-clear" style="background-image:url(\'' + cover + '\')"></div>' +
                '<div class="dd-media-blur" style="background-image:url(\'' + cover + '\')"></div>' +
                '</div>' +
                '<img src="' + cover + '" alt="" class="dd-media-sr" tabindex="-1" />'
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
        var locked = A.needsTeaser(p);
        var av = p.av ? img(p.av, 120) : img('photo-1438761681033-6461ffad8d80', 120);
        stage.classList.toggle('is-locked', locked);
        stage.innerHTML =
            '<div class="dd-media">' + mediaHtml(p, locked) + (locked ? paywallHtml(p) : '') + '</div>' +
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
            '<button type="button" class="dd-rail-btn" data-dd-save><i class="fa-regular fa-bookmark"></i><span>收藏</span></button>' +
            '<button type="button" class="dd-rail-btn" data-dd-report title="举报"><i class="fa-regular fa-flag"></i><span>举报</span></button></aside>' +
            '<footer class="dd-bottom"><h1 class="dd-title">' + esc(p.title) + '</h1>' +
            (locked ? excerptHtml(p) : '') +
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

        bindStageEvents(p, locked);
        if (isVideoPost(p)) bindDetailVideo(locked);
    }

    function bindStageEvents(p, locked) {
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
        stage.querySelector('[data-dd-report]').addEventListener('click', function () {
            openReport(p);
        });
        stage.querySelector('[data-dd-share]').addEventListener('click', openShare);
        stage.querySelector('[data-dd-comment-open]').addEventListener('click', function () {
            if (locked) {
                toast('订阅或解锁后可评论');
                return;
            }
            stage.classList.add('dd-comments-open');
            document.getElementById('ddCommentInput').focus();
        });
        stage.querySelectorAll('[data-dd-subscribe]').forEach(function (subBtn) {
            subBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                openSubscribeFlow(p);
            });
        });
        var ppvBtn = stage.querySelector('[data-dd-unlock-ppv]');
        if (ppvBtn) {
            ppvBtn.addEventListener('click', function () {
                location.href = 'flow-unlock-paid.html';
            });
        }
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

    function bindDetailVideo(locked) {
        var video = stage.querySelector('video[data-dd-video]');
        if (!video) return;
        videoState.playing = true;
        videoState.muted = true;
        video.muted = true;

        var playBtn = stage.querySelector('[data-dd-action="toggle-play"]');
        var muteBtn = stage.querySelector('[data-dd-action="toggle-mute"]');
        var seekWrap = stage.querySelector('[data-dd-action="seek-wrap"]');

        function onPreviewLimit() {
            if (!locked) return;
            if (video.currentTime >= PREVIEW_SEC) {
                video.pause();
                video.currentTime = PREVIEW_SEC;
                setPlaying(false);
                stage.classList.add('dd-preview-ended');
            }
        }

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
        if (seekWrap) {
            seekWrap.addEventListener('click', function (e) {
                e.stopPropagation();
                if (locked) {
                    toast('订阅后可拖动完整进度');
                    return;
                }
                var bar = stage.querySelector('[data-dd-action="seek"]');
                var rect = bar.getBoundingClientRect();
                var ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                var dur = video.duration && isFinite(video.duration) ? video.duration : 60;
                video.currentTime = ratio * dur;
                syncUi();
            });
        }
        stage.querySelector('.dd-media').addEventListener('click', function (e) {
            if (e.target.closest('[data-disc-vp-controls], [data-dd-action], .dd-rail, .dd-top, .dd-bottom')) return;
            setPlaying(!videoState.playing);
        });
        video.addEventListener('loadedmetadata', syncUi);
        video.addEventListener('timeupdate', function () {
            syncUi();
            onPreviewLimit();
        });
        video.addEventListener('ended', function () { setPlaying(false); });
        setPlaying(true);
        syncUi();
    }

    function pauseGridVideo() {
        var VP = global.FL_DISCOVER_VIDEO;
        if (VP && VP.closePip) VP.closePip();
        document.querySelectorAll('#discContentGrid [data-disc-vp] video').forEach(function (v) { v.pause(); });
    }

    function openReport(p) {
        var R = global.FL_ContentReport;
        if (!R) {
            toast('举报功能暂不可用');
            return;
        }
        var kind = isVideoPost(p) ? 'video' : 'image';
        R.open({
            type: kind,
            contentId: p.id,
            contentTitle: p.title || p.id,
            toast: toast,
            onDone: function () {
                afterReportHide(p.id);
            }
        });
    }

    function afterReportHide(reportedId) {
        var grid = document.getElementById('discContentGrid');
        var tiles = grid
            ? Array.prototype.slice.call(grid.querySelectorAll('.content-tile[data-post-id]'))
            : [];
        var curIdx = -1;
        for (var i = 0; i < tiles.length; i++) {
            if (tiles[i].getAttribute('data-post-id') === reportedId) {
                curIdx = i;
                break;
            }
        }
        var nextId = null;
        if (curIdx >= 0) {
            for (var j = curIdx + 1; j < tiles.length; j++) {
                var cand = tiles[j].getAttribute('data-post-id');
                if (cand && cand !== reportedId) { nextId = cand; break; }
            }
            if (!nextId) {
                for (var k = 0; k < curIdx; k++) {
                    var cand2 = tiles[k].getAttribute('data-post-id');
                    if (cand2 && cand2 !== reportedId) { nextId = cand2; break; }
                }
            }
        }

        var page = global.FL_DISCOVER_PAGE;
        if (page && typeof page.renderPosts === 'function') {
            page.renderPosts();
        } else if (grid) {
            var gone = grid.querySelector('.content-tile[data-post-id="' + reportedId + '"]');
            if (gone) gone.remove();
        }

        if (nextId && getPost(nextId) && !(global.FL_ContentReport && global.FL_ContentReport.isReported(nextId))) {
            open(nextId);
        } else {
            close();
        }
    }

    function open(id) {
        var p = getPost(id);
        if (!p) return;
        if (global.FL_ContentReport && global.FL_ContentReport.isReported(p.id)) {
            toast('该内容已举报，不再展示');
            return;
        }
        if (p.live) {
            if (global.LiveViewHost && global.LiveViewHost.navigateFromFeed) {
                var fakeArticle = document.createElement('article');
                fakeArticle.setAttribute('data-creator', p.author || '');
                fakeArticle.setAttribute('data-live-status', 'live');
                if (p.hostSlug) fakeArticle.setAttribute('data-host-slug', p.hostSlug);
                global.LiveViewHost.navigateFromFeed(fakeArticle, null, 'live', 'discover');
            } else {
                location.href = 'live-detail-ab.html?host=yeyu&nav=discover';
            }
            return;
        }
        if (!ensureDom()) return;

        pauseGridVideo();
        currentPostId = p.id;
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
        stage.classList.remove('is-open', 'dd-comments-open', 'is-paused', 'is-locked', 'dd-preview-ended');
        stage.setAttribute('aria-hidden', 'true');
        if (mainEl) mainEl.classList.remove('app-main--dd');
        document.body.classList.remove('disc-detail-open');
        currentPostId = null;
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
        if (isShareModalOpen() || isSubscribeModalOpen()) return;
        if (stage.classList.contains('dd-comments-open')) {
            stage.classList.remove('dd-comments-open');
        } else {
            close();
        }
    });

    bindSubscribePaidListener();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
