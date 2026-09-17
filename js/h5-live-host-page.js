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
    var prepTitleText = document.getElementById('lhPrepTitleText');
    var prepSubText = document.getElementById('lhPrepSubText');
    if (prepTitleText) prepTitleText.textContent = title;
    if (prepSubText) prepSubText.textContent = desc;
    if (root) root.style.backgroundImage = "url('" + CAM_A + "')";

    var skipPrep = (new URLSearchParams(location.search)).get('prep') === '0';
    if (skipPrep || session.started) {
        if (prepOvl) prepOvl.classList.add('hidden');
        startCountdown();
    }

    function markCheck(idx) {
        var li = document.querySelector('.lh-prep-checks li[data-check="' + idx + '"]');
        if (!li) return;
        li.classList.add('done');
        var ic = li.querySelector('i');
        if (ic) ic.className = 'fa-solid fa-circle-check';
    }

    var perm = { cam: false, mic: false };
    var sysPermOvl = document.getElementById('lhSysPermOvl');
    var sysPermTitle = document.getElementById('lhSysPermTitle');
    var sysPermMsg = document.getElementById('lhSysPermMsg');
    var sysPermAllow = document.getElementById('lhSysPermAllow');
    var sysPermDeny = document.getElementById('lhSysPermDeny');

    function showSysPerm(kind, cb) {
        if (!sysPermOvl || !sysPermTitle || !sysPermMsg || !sysPermAllow || !sysPermDeny) {
            cb(true);
            return;
        }
        if (kind === 'camera') {
            sysPermTitle.textContent = '「GOODFANS」想访问您的相机';
            sysPermMsg.textContent = '用于采集直播画面并推流至观众端。';
        } else {
            sysPermTitle.textContent = '「GOODFANS」想访问您的麦克风';
            sysPermMsg.textContent = '用于直播语音互动与连麦。';
        }
        sysPermOvl.hidden = false;
        sysPermOvl.setAttribute('aria-hidden', 'false');
        sysPermOvl.classList.add('open');

        function finish(granted) {
            sysPermOvl.classList.remove('open');
            sysPermOvl.hidden = true;
            sysPermOvl.setAttribute('aria-hidden', 'true');
            sysPermAllow.onclick = null;
            sysPermDeny.onclick = null;
            cb(granted);
        }
        sysPermAllow.onclick = function () { finish(true); };
        sysPermDeny.onclick = function () { finish(false); };
    }

    function ensureMediaPermissions(done) {
        function afterCam(grantedCam) {
            perm.cam = grantedCam;
            if (grantedCam) markCheck('cam');
            if (!grantedCam) {
                toast('需要相机权限才能开播');
                done(false);
                return;
            }
            if (perm.mic) {
                done(true);
                return;
            }
            showSysPerm('microphone', function (grantedMic) {
                perm.mic = grantedMic;
                if (grantedMic) markCheck('mic');
                if (!grantedMic) toast('需要麦克风权限才能开播');
                done(grantedMic);
            });
        }
        if (perm.cam) {
            afterCam(true);
            return;
        }
        showSysPerm('camera', afterCam);
    }

    document.getElementById('lhBtnGoLive')?.addEventListener('click', function () {
        ensureMediaPermissions(function (ok) {
            if (!ok) return;
            if (prepOvl) prepOvl.classList.add('hidden');
            startCountdown();
        });
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

    var micSimTimer = null;
    var rootHint = document.getElementById('lhRootHint');

    function scheduleMicDemo() {
        if (micSimTimer) clearTimeout(micSimTimer);
        micSimTimer = setTimeout(function () {
            if (isLive && micApplyOn && micQueue && !micQueue.length) addMicApply('Fan_01');
        }, 15000);
    }

    function onLiveStarted() {
        if (rootHint) {
            setTimeout(function () { rootHint.classList.add('show'); }, 800);
            setTimeout(function () { rootHint.classList.remove('show'); }, 5200);
        }
        scheduleMicDemo();
        updateMicLiveChrome();
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
        onLiveStarted();
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

    var danmakuOn = true;
    var giftFloatOn = true;
    var micApplyOn = true;
    var SLOT_COUNT = 2;
    var audienceSlots = [null, null];
    var micQueue = [];
    var micQueueId = 0;
    var admins = [
        { name: 'Nova', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80', role: '房管 · 可禁言/踢人' }
    ];
    var lastDmUser = 'Ken';
    var AV_POOL = [
        'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=80',
        'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'
    ];
    var DEMO_NAMES = ['Fan_01', 'River', 'Yuki', 'Alex', 'Mochi'];

    function openSheet(id) {
        var el = document.getElementById(id);
        if (el) el.classList.add('open');
    }
    function closeSheet(id) {
        var el = document.getElementById(id);
        if (el) el.classList.remove('open');
    }
    document.querySelectorAll('[data-lh-sheet-close]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            closeSheet(btn.getAttribute('data-lh-sheet-close'));
        });
    });
    ['lhChatSheet', 'lhCohostSheet', 'lhAdminSheet', 'lhShareSheet', 'lhMoreSheet'].forEach(function (id) {
        var ovl = document.getElementById(id);
        if (!ovl) return;
        ovl.addEventListener('click', function (e) {
            if (e.target === ovl) ovl.classList.remove('open');
        });
    });

    function toggleSwitch(btn, onChange) {
        if (!btn) return;
        btn.addEventListener('click', function () {
            var on = !btn.classList.contains('on');
            btn.classList.toggle('on', on);
            btn.textContent = on ? '开' : '关';
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            if (onChange) onChange(on);
        });
    }

    toggleSwitch(document.getElementById('lhSwitchDanmaku'), function (on) {
        danmakuOn = on;
        if (danmaku) danmaku.style.opacity = on ? '1' : '0.2';
    });
    toggleSwitch(document.getElementById('lhSwitchGiftFloat'), function (on) {
        giftFloatOn = on;
        if (!on && giftFloat) giftFloat.innerHTML = '';
    });
    toggleSwitch(document.getElementById('lhSwitchMicApply'), function (on) {
        micApplyOn = on;
        if (!on) {
            micQueue = [];
            toast('已关闭观众申请连麦');
        } else {
            toast('观众连麦已开启 · 有申请将弹出提示');
            closeSheet('lhCohostSheet');
        }
        updateMicLiveChrome();
    });

    function updateMicPendingBadge() {
        var badge = document.getElementById('lhMicPendingBadge');
        if (!badge) return;
        if (isLive && micApplyOn && micQueue.length) {
            badge.hidden = false;
            badge.textContent = micQueue.length > 9 ? '9+' : String(micQueue.length);
        } else {
            badge.hidden = true;
        }
    }

    function updateMicApplyBanner() {
        var banner = document.getElementById('lhMicApplyBanner');
        if (!banner) return;
        if (!isLive || !micApplyOn || !micQueue.length) {
            banner.hidden = true;
            delete banner.dataset.activeId;
            updateMicPendingBadge();
            return;
        }
        var item = micQueue[0];
        banner.hidden = false;
        banner.dataset.activeId = item.id;
        var avEl = document.getElementById('lhMicApplyAv');
        var nameEl = document.getElementById('lhMicApplyName');
        if (avEl) avEl.style.backgroundImage = "url('" + item.av + "')";
        if (nameEl) nameEl.textContent = item.name;
        var hint = document.getElementById('lhMicApplyQueueHint');
        if (hint) {
            if (micQueue.length > 1) {
                hint.hidden = false;
                hint.textContent = '还有 ' + (micQueue.length - 1) + ' 人排队';
            } else {
                hint.hidden = true;
                hint.textContent = '';
            }
        }
        updateMicPendingBadge();
    }

    function updateMicLiveChrome() {
        var slotsEl = document.getElementById('lhAudienceSlotsLive');
        if (slotsEl) slotsEl.hidden = !isLive || !micApplyOn;
        renderAudienceSlots();
        updateMicApplyBanner();
    }

    function renderAudienceSlots() {
        var wrap = document.getElementById('lhAudienceSlotsLive');
        if (!wrap) return;
        wrap.innerHTML = audienceSlots.map(function (user, idx) {
            if (user) {
                return '<div class="obs-audience-slot is-speaking" data-slot="' + idx + '">' +
                    '<div class="av-wrap">' +
                    '<div class="av" style="background-image:url(\'' + user.av + '\')"></div>' +
                    '<button type="button" class="lh-slot-kick" data-kick-slot="' + idx + '" aria-label="下麦 ' + user.name + '">' +
                    '<i class="fa-solid fa-xmark"></i></button></div>' +
                    '<span class="nm">' + user.name + '</span></div>';
            }
            return '<div class="obs-audience-slot empty" data-slot="' + idx + '">' +
                '<div class="av-wrap"><div class="av"><i class="fa-solid fa-plus"></i></div></div>' +
                '<span class="nm">空席</span></div>';
        }).join('');
        wrap.querySelectorAll('[data-kick-slot]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var i = parseInt(btn.getAttribute('data-kick-slot'), 10);
                if (audienceSlots[i]) {
                    toast(audienceSlots[i].name + ' 已被下麦');
                    audienceSlots[i] = null;
                    updateMicLiveChrome();
                }
            });
        });
    }

    function firstEmptySlot() {
        for (var i = 0; i < audienceSlots.length; i++) {
            if (!audienceSlots[i]) return i;
        }
        return -1;
    }

    function acceptMicApply(id) {
        var item = micQueue.filter(function (q) { return q.id === id; })[0];
        if (!item) return;
        var slot = firstEmptySlot();
        if (slot < 0) {
            toast('席位已满，请先下麦或拒绝');
            return;
        }
        micQueue = micQueue.filter(function (q) { return q.id !== id; });
        audienceSlots[slot] = { name: item.name, av: item.av };
        toast('已同意 ' + item.name + ' 上麦');
        pushDanmaku({ u: '系统', m: item.name + ' 已连麦', sys: true });
        updateMicLiveChrome();
    }

    function rejectMicApply(id) {
        var item = micQueue.filter(function (q) { return q.id === id; })[0];
        micQueue = micQueue.filter(function (q) { return q.id !== id; });
        if (item) toast('已拒绝 ' + item.name + ' 的连麦申请');
        updateMicApplyBanner();
    }

    function addMicApply(name) {
        if (!micApplyOn) {
            toast('当前未开启观众连麦');
            return;
        }
        if (!isLive) {
            toast('请先开始直播');
            return;
        }
        micQueueId += 1;
        var applicant = name || DEMO_NAMES[micQueueId % DEMO_NAMES.length];
        micQueue.push({
            id: 'q' + micQueueId,
            name: applicant,
            av: AV_POOL[micQueueId % AV_POOL.length],
            wait: '刚刚'
        });
        updateMicApplyBanner();
        toast(applicant + ' 申请连麦');
    }

    function renderAdmins() {
        var list = document.getElementById('lhAdminList');
        if (!list) return;
        if (!admins.length) {
            list.innerHTML = '<li style="justify-content:center;color:var(--text-tertiary)">暂无房管</li>';
            return;
        }
        list.innerHTML = admins.map(function (a, idx) {
            return '<li><div class="av" style="background-image:url(\'' + a.av + '\')"></div>' +
                '<div class="meta"><div class="n">' + a.name + '</div><div class="s">' + a.role + '</div></div>' +
                '<button type="button" data-rm-admin="' + idx + '">移除</button></li>';
        }).join('');
        list.querySelectorAll('[data-rm-admin]').forEach(function (b) {
            b.addEventListener('click', function () {
                var i = parseInt(b.getAttribute('data-rm-admin'), 10);
                admins.splice(i, 1);
                renderAdmins();
            });
        });
    }

    updateMicLiveChrome();
    renderAdmins();

    document.getElementById('lhMicApplyAccept')?.addEventListener('click', function () {
        var banner = document.getElementById('lhMicApplyBanner');
        var id = banner && banner.dataset.activeId;
        if (id) acceptMicApply(id);
    });
    document.getElementById('lhMicApplyReject')?.addEventListener('click', function () {
        var banner = document.getElementById('lhMicApplyBanner');
        var id = banner && banner.dataset.activeId;
        if (id) rejectMicApply(id);
    });

    var shareInp = document.getElementById('lhShareLink');
    if (shareInp) {
        var slugPath = (session.creatorSlug || 'luna_web3').replace(/^@/, '').replace(/_/g, '-');
        shareInp.value = 'https://goodfans.app/live/' + slugPath;
    }

    document.getElementById('lhMicDemoApply')?.addEventListener('click', function () {
        if (!micApplyOn) {
            toast('请先开启「允许观众申请连麦」');
            return;
        }
        addMicApply();
        closeSheet('lhCohostSheet');
    });

    document.getElementById('lhAdminFromDm')?.addEventListener('click', function () {
        if (admins.some(function (a) { return a.name === lastDmUser; })) {
            toast(lastDmUser + ' 已是房管');
            return;
        }
        admins.push({
            name: lastDmUser,
            av: AV_POOL[1],
            role: '房管 · 从弹幕任命'
        });
        renderAdmins();
        toast('已任命 ' + lastDmUser + ' 为房管');
    });

    document.getElementById('lhShareCopy')?.addEventListener('click', function () {
        var inp = document.getElementById('lhShareLink');
        if (inp && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(inp.value).then(function () { toast('链接已复制'); });
        } else {
            toast('链接已复制（演示）');
        }
    });

    document.querySelectorAll('[data-lh-more]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var action = btn.getAttribute('data-lh-more');
            closeSheet('lhMoreSheet');
            if (action === 'chat') openSheet('lhChatSheet');
            else if (action === 'cohost') openSheet('lhCohostSheet');
            else if (action === 'admin') openSheet('lhAdminSheet');
            else if (action === 'share') openSheet('lhShareSheet');
            else if (action === 'flip') btnFlip?.click();
        });
    });

    function goCreatorProfile() {
        if (!isLive) return;
        var back = 'live-host.html' + (skipPrep ? '?prep=0' : '');
        var slug = session.creatorSlug || 'luna_web3';
        location.href = 'creator-profile.html?u=' + encodeURIComponent(slug) +
            '&back=' + encodeURIComponent(back);
    }
    if (root) {
        root.addEventListener('click', goCreatorProfile);
        root.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goCreatorProfile();
            }
        });
    }
    var origPushDanmaku = pushDanmaku;
    pushDanmaku = function (item) {
        if (!danmakuOn && !item.sys) return;
        if (item.u && item.u !== '系统') lastDmUser = item.u;
        origPushDanmaku(item);
    };

    var origShowGift = showGiftFloat;
    showGiftFloat = function (text) {
        if (!giftFloatOn) return;
        origShowGift(text);
    };

    document.getElementById('lhBtnEnd')?.addEventListener('click', function () {
        document.getElementById('lhEndOvl')?.classList.add('open');
    });

    document.getElementById('lhEndCancel')?.addEventListener('click', function () {
        document.getElementById('lhEndOvl')?.classList.remove('open');
    });

    document.getElementById('lhEndConfirm')?.addEventListener('click', function () {
        isLive = false;
        if (micSimTimer) clearTimeout(micSimTimer);
        micQueue = [];
        updateMicLiveChrome();
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
