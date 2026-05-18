/**
 * 创作中心 · 直播扩展（直播预告 / OBS 配置 / 打赏开关）
 */
(function () {
    if (!document.getElementById('liveModeSeg')) return;

    var liveMode = 'now'; // now | preview

    var liveModeSeg = document.getElementById('liveModeSeg');
    var liveNowBlock = document.getElementById('liveNowBlock');
    var livePreviewBlock = document.getElementById('livePreviewBlock');
    var liveModeTag = document.getElementById('liveModeTag');
    var livePreviewCover = document.getElementById('livePreviewCover');
    var livePreviewCoverInput = document.getElementById('livePreviewCoverInput');
    var livePreviewTime = document.getElementById('livePreviewTime');
    var obsGuideOverlay = document.getElementById('crObsGuideOverlay');
    var pubBtn = document.getElementById('btnPublishMain');

    function pad(n) { return String(n).padStart(2, '0'); }

    function defaultPreviewTimeISO() {
        var d = new Date();
        d.setDate(d.getDate() + 2);
        d.setHours(21, 0, 0, 0);
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T21:00';
    }

    if (livePreviewTime && !livePreviewTime.value) {
        livePreviewTime.value = defaultPreviewTimeISO();
    }

    window.crGetLiveMode = function () { return liveMode; };
    window.crIsLivePreview = function () { return liveMode === 'preview'; };

    window.crUpdatePublishButton = function (type) {
        if (!pubBtn || type !== 'live') return;
        if (liveMode === 'preview') {
            pubBtn.innerHTML = '<i class="fa-solid fa-bullhorn"></i> 发布直播预告';
        } else {
            pubBtn.innerHTML = '<i class="fa-solid fa-tower-broadcast"></i> 进入主播直播间';
        }
    };

    function syncLiveModeUI() {
        liveModeSeg?.querySelectorAll('button[data-live-mode]').forEach(function (btn) {
            btn.classList.toggle('selected', btn.getAttribute('data-live-mode') === liveMode);
        });
        if (liveNowBlock) liveNowBlock.style.display = liveMode === 'now' ? 'block' : 'none';
        if (livePreviewBlock) livePreviewBlock.style.display = liveMode === 'preview' ? 'block' : 'none';
        if (liveModeTag) {
            if (liveMode === 'preview') {
                liveModeTag.className = 'tag tag-info';
                liveModeTag.innerHTML = '<i class="fa-solid fa-bullhorn"></i> 图文预告';
            } else {
                liveModeTag.className = 'tag tag-danger';
                liveModeTag.innerHTML = '<i class="fa-solid fa-circle"></i> 未开播';
            }
        }
        document.querySelectorAll('[data-live-now-only]').forEach(function (el) {
            var showLive = document.getElementById('panelLive')?.style.display !== 'none';
            el.style.display = showLive && liveMode === 'now' ? '' : 'none';
        });
        if (window.crUpdatePublishButton) {
            var isLive = document.getElementById('panelLive')?.style.display !== 'none';
            if (isLive) window.crUpdatePublishButton('live');
        }
    }

    window.crToggleLiveOnlyUI = function (show) {
        document.querySelectorAll('[data-live-only]').forEach(function (el) {
            if (el.hasAttribute('data-live-now-only')) return;
            el.style.display = show ? '' : 'none';
        });
        if (show) {
            var block = document.getElementById('liveConfigSection');
            if (block && liveMode === 'now') block.classList.add('show');
        }
        syncLiveModeUI();
    };

    function setLiveMode(mode) {
        liveMode = mode === 'preview' ? 'preview' : 'now';
        syncLiveModeUI();
        if (window.crShowToast) {
            window.crShowToast(liveMode === 'preview'
                ? '直播预告将以图文动态发布，不创建直播间'
                : '已切换为立即开播（OBS 推流）');
        }
    }

    liveModeSeg?.querySelectorAll('button[data-live-mode]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            setLiveMode(btn.getAttribute('data-live-mode'));
        });
    });

    function copyEl(id) {
        var el = document.getElementById(id);
        if (!el) return;
        var t = el.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(t).then(function () {
                if (window.crShowToast) window.crShowToast('已复制到剪贴板');
            });
        }
    }

    document.querySelectorAll('.switch').forEach(function (sw) {
        sw.addEventListener('click', function () { sw.classList.toggle('on'); });
    });

    document.querySelectorAll('.live-config-block .btn-copy').forEach(function (btn) {
        btn.addEventListener('click', function () {
            copyEl(btn.getAttribute('data-copy'));
        });
    });

    document.getElementById('btnCrObsGuide')?.addEventListener('click', function () {
        obsGuideOverlay?.classList.add('show');
    });
    obsGuideOverlay?.addEventListener('click', function (e) {
        if (e.target === obsGuideOverlay) obsGuideOverlay.classList.remove('show');
    });

    livePreviewCover?.addEventListener('click', function () {
        livePreviewCoverInput?.click();
    });
    livePreviewCoverInput?.addEventListener('change', function () {
        var f = livePreviewCoverInput.files && livePreviewCoverInput.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
            livePreviewCover.style.backgroundImage = "url('" + ev.target.result + "')";
        };
        reader.readAsDataURL(f);
        livePreviewCoverInput.value = '';
    });

    syncLiveModeUI();
})();
