(function () {
    var STORAGE_KEY = 'gf_h5_live_session';
    var CAM_A = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&q=80';
    var CAM_B = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80';

    function toast(msg) {
        if (window.DigitalH5Nav && window.DigitalH5Nav.toast) {
            window.DigitalH5Nav.toast(msg);
            return;
        }
    }

    function loadSession() {
        try {
            return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    function pad(n) { return String(n).padStart(2, '0'); }

    function formatDuration(sec) {
        var h = Math.floor(sec / 3600);
        var m = Math.floor((sec % 3600) / 60);
        var s = sec % 60;
        if (h > 0) return pad(h) + ':' + pad(m) + ':' + pad(s);
        return pad(m) + ':' + pad(s);
    }

    var session = loadSession();
    var title = session.title || '深夜爵士 · 即兴钢琴';
    var descParts = ['手机摄像头推流', 'USDT 打赏已开启'];
    if (session.monetize) {
        if (session.monetize.sub) descParts.push('订阅专属');
        if (session.monetize.ppv) descParts.push('门票 ' + (session.monetize.ppvPrice || '5') + ' USDT');
        if (session.monetize.free && !session.monetize.sub && !session.monetize.ppv) descParts.push('免费公开');
    }
    if (session.permLabel) descParts.push('可见 · ' + session.permLabel);
    var desc = session.desc || descParts.join(' · ');
    var isLive = false;
    var isPaused = false;
    var micOn = true;
    var camFront = true;
    var elapsed = 0;
    var viewers = 128;
    var giftTotal = 40;
    var timerId = null;
    var dmId = null;

    var root = document.getElementById('lhRoot');
    var prepOvl = document.getElementById('lhPrepOvl');
    var pauseOvl = document.getElementById('lhPauseOvl');
    var countdownEl = document.getElementById('lhCountdown');
    var livePill = document.getElementById('lhLivePill');
    var timerEl = document.getElementById('lhTimer');
    var viewersEl = document.getElementById('lhViewers');
    var titleEl = document.getElementById('lhTitle');
    var subEl = document.getElementById('lhSub');
    var danmaku = document.getElementById('lhDanmaku');
    var giftFloat = document.getElementById('lhGiftFloat');
    var btnMic = document.getElementById('lhBtnMic');
    var btnFlip = document.getElementById('lhBtnFlip');

    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = desc;
    if (root) root.style.backgroundImage = "url('" + CAM_A + "')";

    var skipPrep = (new URLSearchParams(location.search)).get('prep') === '0';
    if (skipPrep || session.started) {
        if (prepOvl) prepOvl.classList.add('hidden');
        startCountdown();
    }

    function markCheck(idx) {
        var li = document.querySelector('.lh-prep-checks li[data-check="' + idx + '"]');
        if (li) li.classList.add('done');
    }

    document.getElementById('lhBtnGrantCam')?.addEventListener('click', function () {
        markCheck('cam');
        toast('相机权限已授权（原型）');
    });
    document.getElementById('lhBtnGrantMic')?.addEventListener('click', function () {
        markCheck('mic');
        toast('麦克风权限已授权（原型）');
    });

    document.getElementById('lhBtnGoLive')?.addEventListener('click', function () {
        markCheck('cam');
        markCheck('mic');
        if (prepOvl) prepOvl.classList.add('hidden');
        startCountdown();
    });

    function startCountdown() {
        if (!countdownEl) return beginLive();
        var n = 3;
        countdownEl.classList.add('show');
        countdownEl.textContent = String(n);
        var t = setInterval(function () {
            n -= 1;
            if (n <= 0) {
                clearInterval(t);
                countdownEl.classList.remove('show');
                beginLive();
                return;
            }
            countdownEl.textContent = String(n);
        }, 800);
    }

    function beginLive() {
        isLive = true;
        session.started = true;
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch (e) { /* ignore */ }
        if (livePill) {
            livePill.classList.remove('is-prep');
            livePill.innerHTML = '<span class="dot"></span> LIVE';
        }
        timerId = setInterval(function () {
            if (!isLive || isPaused) return;
            elapsed += 1;
            if (timerEl) timerEl.textContent = formatDuration(elapsed);
            if (elapsed % 12 === 0 && viewers < 9999) {
                viewers += Math.floor(Math.random() * 18) + 3;
                if (viewersEl) viewersEl.innerHTML = '<i class="fa-solid fa-eye"></i> ' + viewers.toLocaleString();
            }
        }, 1000);
        startDanmakuSim();
        toast('直播已开始 · 观众可见');
    }

    var DM_SAMPLES = [
        { u: 'Nova', m: '今晚音色太绝了！' },
        { u: 'Ken', m: '已订阅，求 Encore 🎹' },
        { u: 'Yuki', m: '可以点《Autumn Leaves》吗' },
        { u: '系统', m: '欢迎新订阅者 @River', sys: true },
        { u: 'Alex', m: '送出星光 ×5', gift: true }
    ];

    function pushDanmaku(item) {
        if (!danmaku) return;
        var el = document.createElement('div');
        el.className = 'lh-dm' + (item.gift ? ' gift' : '');
        el.innerHTML = item.gift
            ? '<i class="fa-solid fa-gift"></i> ' + item.u + ' ' + item.m
            : '<span class="u">' + item.u + '</span>' + item.m;
        danmaku.appendChild(el);
        while (danmaku.children.length > 6) danmaku.removeChild(danmaku.firstChild);
    }

    function showGiftFloat(text) {
        if (!giftFloat) return;
        giftFloat.innerHTML = '<div class="lh-gift-card"><i class="fa-solid fa-gift"></i> ' + text + '</div>';
        clearTimeout(showGiftFloat._t);
        showGiftFloat._t = setTimeout(function () { giftFloat.innerHTML = ''; }, 3200);
        giftTotal += Math.floor(Math.random() * 8) + 2;
    }

    function startDanmakuSim() {
        var i = 0;
        dmId = setInterval(function () {
            if (!isLive || isPaused) return;
            var item = DM_SAMPLES[i % DM_SAMPLES.length];
            i += 1;
            pushDanmaku(item);
            if (item.gift) showGiftFloat(item.u + ' ' + item.m);
        }, 4500);
    }

    document.getElementById('lhBtnBack')?.addEventListener('click', function () {
        if (isLive && !isPaused) {
            document.getElementById('lhEndOvl')?.classList.add('open');
            return;
        }
        location.href = 'create-live.html';
    });

    btnFlip?.addEventListener('click', function () {
        camFront = !camFront;
        if (root) root.style.backgroundImage = "url('" + (camFront ? CAM_A : CAM_B) + "')";
        toast(camFront ? '已切换前置摄像头' : '已切换后置摄像头');
    });

    btnMic?.addEventListener('click', function () {
        micOn = !micOn;
        btnMic.classList.toggle('off', !micOn);
        btnMic.querySelector('i').className = micOn ? 'fa-solid fa-microphone' : 'fa-solid fa-microphone-slash';
        toast(micOn ? '麦克风已开启' : '麦克风已静音');
    });

    document.getElementById('lhBtnBeauty')?.addEventListener('click', function () {
        toast('美颜强度 · 标准（原型）');
    });

    document.getElementById('lhBtnPause')?.addEventListener('click', function () {
        if (!isLive) return;
        isPaused = true;
        pauseOvl?.classList.add('show');
        toast('观众端将看到「主播暂时离开」');
    });

    document.getElementById('lhBtnResume')?.addEventListener('click', function () {
        isPaused = false;
        pauseOvl?.classList.remove('show');
        toast('已继续直播');
    });

    document.getElementById('lhBtnMore')?.addEventListener('click', function () {
        document.getElementById('lhMoreSheet')?.classList.add('open');
    });
    document.getElementById('lhMoreClose')?.addEventListener('click', function () {
        document.getElementById('lhMoreSheet')?.classList.remove('open');
    });
    document.getElementById('lhMoreSheet')?.addEventListener('click', function (e) {
        if (e.target.id === 'lhMoreSheet') e.currentTarget.classList.remove('open');
    });

    document.querySelectorAll('[data-lh-more]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var action = btn.getAttribute('data-lh-more');
            document.getElementById('lhMoreSheet')?.classList.remove('open');
            if (action === 'chat') toast('弹幕管理 · 原型入口');
            if (action === 'cohost') toast('连麦需先结束单人直播（原型）');
            if (action === 'share') toast('分享链接已复制');
            if (action === 'flip') btnFlip?.click();
        });
    });

    document.getElementById('lhBtnEnd')?.addEventListener('click', function () {
        document.getElementById('lhEndOvl')?.classList.add('open');
    });

    document.getElementById('lhEndCancel')?.addEventListener('click', function () {
        document.getElementById('lhEndOvl')?.classList.remove('open');
    });

    document.getElementById('lhEndConfirm')?.addEventListener('click', function () {
        isLive = false;
        clearInterval(timerId);
        clearInterval(dmId);
        try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
        document.getElementById('lhEndDur').textContent = formatDuration(elapsed);
        document.getElementById('lhEndViewers').textContent = viewers.toLocaleString();
        document.getElementById('lhEndGift').textContent = giftTotal.toFixed(1) + ' USDT';
        document.getElementById('lhEndOvl').classList.remove('open');
        document.getElementById('lhSummaryOvl')?.classList.add('open');
    });

    document.getElementById('lhSummaryDone')?.addEventListener('click', function () {
        location.href = 'create.html';
    });
})();
