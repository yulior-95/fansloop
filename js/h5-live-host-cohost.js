/**
 * H5 主播工作台 · 连麦 & PK（对齐 js-web/live-host-cohost.js）
 */
(function (global) {
    var I = {
        me: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
        night: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80',
        echo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80',
        jazz: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1400&q=80',
        concert: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80'
    };

    var hooks = {};
    var state = {
        matching: false,
        cohost: false,
        pk: false,
        pkSettling: false,
        pkType: 'gift',
        pkDurSec: 180,
        pkRemaining: 0,
        pkScoreA: 1240,
        pkScoreB: 892,
        lastPkWinner: '',
        myName: 'Luna 🌙'
    };

    var stage, cohostLayer, root, dynamic, btnMatch, btnDirected, btnAud, btnPk, modalHost, matchTimer;
    var pkTimerId = null;
    var pkScoreTickId = null;
    var pkSettleAutoDismiss = null;

    function toast(msg) {
        if (hooks.toast) hooks.toast(msg);
    }

    function $(id) {
        return document.getElementById(id);
    }

    function audienceMicOn() {
        return hooks.getMicApplyOn ? hooks.getMicApplyOn() : false;
    }

    function setAudienceMic(on, silent) {
        if (hooks.setMicApplyOn) hooks.setMicApplyOn(!!on, !!silent);
    }

    function isLive() {
        return hooks.getIsLive ? hooks.getIsLive() : false;
    }

    function isCohostMode() {
        return !!(state.cohost || state.matching || state.pk);
    }

    function setDynamic(html) {
        if (!dynamic) return;
        dynamic.innerHTML = html || '';
    }

    function setCohostToolbarDisabled(block) {
        block = !!block || audienceMicOn();
        [btnMatch, btnDirected].forEach(function (btn) {
            if (!btn) return;
            btn.disabled = block;
            btn.classList.toggle('is-disabled', block);
            if (audienceMicOn()) {
                btn.title = '观众上麦已开启，请先关闭后再发起主播连麦';
            } else if (state.cohost || state.matching) {
                btn.title = '主播连麦进行中';
            } else {
                btn.removeAttribute('title');
            }
        });
    }

    function updatePkBtn() {
        if (!btnPk) return;
        var canPk = state.cohost && !state.pk;
        btnPk.disabled = !canPk;
        btnPk.title = canPk ? '发起 PK' : state.pk ? 'PK 进行中' : '需先完成主播连麦';
        btnPk.classList.toggle('btn-primary', canPk);
        btnPk.classList.toggle('btn-secondary', !canPk);
    }

    function updateAudienceBtn() {
        if (!btnAud) return;
        var on = audienceMicOn();
        var cohostBlocked = isCohostMode();
        btnAud.innerHTML = '<i class="fa-solid ' + (on ? 'fa-toggle-on' : 'fa-microphone-lines') + '"></i> ' +
            (on ? '关闭上麦' : '观众上麦');
        btnAud.classList.toggle('btn-primary', on);
        btnAud.classList.toggle('btn-secondary', !on);
        btnAud.disabled = cohostBlocked && !on;
        btnAud.title = cohostBlocked && !on
            ? '主播连麦进行中，不可与观众上麦同时开启'
            : on ? '关闭观众上麦' : '开启观众上麦（与主播连麦互斥）';
    }

    function syncToolbarState() {
        setCohostToolbarDisabled(isCohostMode());
        updatePkBtn();
        updateAudienceBtn();
    }

    function cohostExitBtnHtml(extraClass) {
        return '<button type="button" class="lh-cohost-exit' + (extraClass ? ' ' + extraClass : '') +
            '" title="退出连麦，恢复单人直播"><i class="fa-solid fa-phone-slash"></i> 退出连麦</button>';
    }

    function formatPkScore(n) {
        var v = Math.max(0, Math.floor(n || 0));
        return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function formatPkTimer(sec) {
        sec = Math.max(0, sec | 0);
        var m = String(Math.floor(sec / 60)).padStart(2, '0');
        var s = String(sec % 60).padStart(2, '0');
        return m + ':' + s;
    }

    function pkBarPct(a, b) {
        var sum = a + b;
        if (sum <= 0) return 50;
        return Math.round((a / sum) * 100);
    }

    function pkScoreUnitSuffix() {
        return state.pkType === 'like' ? '' : ' USDT';
    }

    function pkHudHtml() {
        var unit = pkScoreUnitSuffix();
        var pctA = pkBarPct(state.pkScoreA, state.pkScoreB);
        var timerText = state.pkSettling ? '00:00' : formatPkTimer(state.pkRemaining || state.pkDurSec);
        return '<div class="lh-pk-hud lh-pk-hud--dock' + (state.pkSettling ? ' is-frozen' : '') + '">' +
            '<div class="lh-pk-dock">' +
            '<div class="lh-pk-dock-col lh-pk-dock-col--a">' +
            '<div class="lh-pk-dock-head"><span class="lh-pk-dock-name">' + state.myName + '</span>' +
            '<span class="lh-pk-dock-score" id="lhPkScoreA">' + formatPkScore(state.pkScoreA) + unit + '</span></div>' +
            '<div class="lh-pk-bar lh-pk-bar--a"><span id="lhPkBarA" style="width:' + pctA + '%"></span></div></div>' +
            '<div class="lh-pk-dock-mid"><span class="lh-pk-timer" id="lhPkTimer">' + timerText + '</span></div>' +
            '<div class="lh-pk-dock-col lh-pk-dock-col--b">' +
            '<div class="lh-pk-dock-head"><span class="lh-pk-dock-name">夜雨听弦</span>' +
            '<span class="lh-pk-dock-score" id="lhPkScoreB">' + formatPkScore(state.pkScoreB) + unit + '</span></div>' +
            '<div class="lh-pk-bar lh-pk-bar--b"><span id="lhPkBarB" style="width:' + (100 - pctA) + '%"></span></div></div></div></div>';
    }

    function updateLhPkHud() {
        var unit = pkScoreUnitSuffix();
        var pctA = pkBarPct(state.pkScoreA, state.pkScoreB);
        var scoreA = document.getElementById('lhPkScoreA');
        var scoreB = document.getElementById('lhPkScoreB');
        var barA = document.getElementById('lhPkBarA');
        var barB = document.getElementById('lhPkBarB');
        if (scoreA) scoreA.textContent = formatPkScore(state.pkScoreA) + unit;
        if (scoreB) scoreB.textContent = formatPkScore(state.pkScoreB) + unit;
        if (barA) barA.style.width = pctA + '%';
        if (barB) barB.style.width = (100 - pctA) + '%';
    }

    function stopPkSimulation() {
        clearInterval(pkTimerId);
        clearInterval(pkScoreTickId);
        pkTimerId = null;
        pkScoreTickId = null;
    }

    function clearPkSettlementUi() {
        clearTimeout(pkSettleAutoDismiss);
        pkSettleAutoDismiss = null;
        if (!cohostLayer) return;
        cohostLayer.classList.remove('lh-cohost-layer--pk-settle');
        cohostLayer.querySelectorAll('.lh-pk-settle-flash').forEach(function (el) {
            el.remove();
        });
    }

    function markPkWinnerCells(winnerSide) {
        if (!cohostLayer) return;
        var cells = cohostLayer.querySelectorAll('.lh-cohost-cell');
        if (cells.length < 2) return;
        cells[0].classList.toggle('is-pk-winner', winnerSide === 'a');
        cells[0].classList.toggle('is-pk-loser', winnerSide === 'b');
        cells[1].classList.toggle('is-pk-winner', winnerSide === 'b');
        cells[1].classList.toggle('is-pk-loser', winnerSide === 'a');
    }

    function pkSettlementOverlayHtml(winnerSide) {
        var unit = pkScoreUnitSuffix();
        var aName = state.myName;
        var bName = '夜雨听弦';
        var aScore = formatPkScore(state.pkScoreA) + unit;
        var bScore = formatPkScore(state.pkScoreB) + unit;
        var winnerName = winnerSide === 'a' ? aName : bName;
        var winnerScore = winnerSide === 'a' ? aScore : bScore;
        var winnerAv = winnerSide === 'a' ? I.me : I.night;
        var confetti = '';
        for (var i = 0; i < 14; i += 1) {
            confetti += '<span class="lh-pk-confetti-piece" style="--i:' + i + '"></span>';
        }
        return '<div class="lh-pk-settle-flash" role="dialog" aria-labelledby="lhPkSettleTitle">' +
            '<div class="lh-pk-confetti" aria-hidden="true">' + confetti + '</div>' +
            '<div class="lh-pk-settle-card">' +
            '<div class="lh-pk-settle-badge"><i class="fa-solid fa-flag-checkered"></i> PK 结算</div>' +
            '<div class="lh-pk-settle-winner">' +
            '<div class="lh-pk-settle-crown"><i class="fa-solid fa-crown"></i></div>' +
            '<div class="lh-pk-settle-av" style="background-image:url(\'' + winnerAv + '\')"></div>' +
            '<h3 id="lhPkSettleTitle">' + winnerName + ' 获胜</h3>' +
            '<p class="lh-pk-settle-score">' + winnerScore + '</p></div>' +
            '<div class="lh-pk-settle-actions">' +
            '<button type="button" class="btn btn-primary btn-sm btn-block" data-pk-settle-dismiss>关闭</button>' +
            '</div></div></div>';
    }

    function dismissPkSettlement() {
        if (!state.pkSettling) return;
        clearPkSettlementUi();
        var winner = state.lastPkWinner;
        state.pk = false;
        state.pkSettling = false;
        showCohostLayer(cohostStageHtml(false));
        renderCohostMembers();
        syncToolbarState();
        toast(winner ? 'PK 已结束 · ' + winner + ' 获胜' : 'PK 已结束');
    }

    function triggerPkEnd() {
        if (!state.pk || state.pkSettling) return;
        stopPkSimulation();
        state.pkSettling = true;
        var winnerSide = state.pkScoreA >= state.pkScoreB ? 'a' : 'b';
        state.lastPkWinner = winnerSide === 'a' ? state.myName : '夜雨听弦';
        markPkWinnerCells(winnerSide);
        updateLhPkHud();
        var timerEl = document.getElementById('lhPkTimer');
        if (timerEl) {
            timerEl.textContent = '00:00';
            timerEl.classList.remove('is-urgent');
        }
        var hud = cohostLayer && cohostLayer.querySelector('.lh-pk-hud--dock');
        if (hud) hud.classList.add('is-frozen');
        if (cohostLayer) {
            cohostLayer.classList.add('lh-cohost-layer--pk-settle');
            cohostLayer.insertAdjacentHTML('beforeend', pkSettlementOverlayHtml(winnerSide));
        }
        renderCohostMembers();
        pkSettleAutoDismiss = setTimeout(function () {
            if (state.pkSettling) dismissPkSettlement();
        }, 12000);
    }

    function startPkSimulation() {
        stopPkSimulation();
        state.pkRemaining = state.pkDurSec || 180;
        updateLhPkHud();
        var timerEl = document.getElementById('lhPkTimer');
        if (timerEl) timerEl.textContent = formatPkTimer(state.pkRemaining);

        pkTimerId = setInterval(function () {
            state.pkRemaining = Math.max(0, state.pkRemaining - 1);
            var el = document.getElementById('lhPkTimer');
            if (el) {
                el.textContent = formatPkTimer(state.pkRemaining);
                el.classList.toggle('is-urgent', state.pkRemaining > 0 && state.pkRemaining <= 30);
            }
            if (state.pkRemaining <= 0) triggerPkEnd();
        }, 1000);

        pkScoreTickId = setInterval(function () {
            if (state.pkSettling) return;
            if (Math.random() > 0.45) {
                state.pkScoreA += state.pkType === 'like'
                    ? Math.floor(Math.random() * 40 + 8)
                    : Math.floor(Math.random() * 30 + 5);
            } else {
                state.pkScoreB += state.pkType === 'like'
                    ? Math.floor(Math.random() * 35 + 6)
                    : Math.floor(Math.random() * 28 + 4);
            }
            updateLhPkHud();
        }, 2800);
    }

    function cohostStageHtml(withPk) {
        var pk = withPk || state.pk ? pkHudHtml() : '';
        return '<div class="lh-cohost-grid">' +
            '<div class="lh-cohost-cell" style="background-image:url(\'' + I.jazz + '\')">' +
            '<div class="lh-cohost-label"><span class="av" style="background-image:url(\'' + I.me + '\')"></span> ' +
            state.myName + '（我）</div></div>' +
            '<div class="lh-cohost-cell" style="background-image:url(\'' + I.concert + '\')">' +
            '<div class="lh-cohost-label"><span class="av" style="background-image:url(\'' + I.night + '\')"></span> 夜雨听弦</div></div>' +
            '</div>' +
            '<div class="lh-cohost-top">' +
            '<span class="lh-cohost-chip lh-cohost-chip--link"><i class="fa-solid fa-link"></i> 连麦中 · 2/3</span>' +
            (state.pk
                ? '<span class="lh-cohost-chip lh-cohost-chip--pk"><i class="fa-solid fa-bolt"></i> PK 进行中</span>'
                : '<span class="lh-cohost-chip">合流延迟 ~2.1s</span>') +
            cohostExitBtnHtml('lh-cohost-exit-stage') +
            '</div>' + pk;
    }

    function showCohostLayer(html) {
        if (!cohostLayer || !stage) return;
        cohostLayer.hidden = false;
        cohostLayer.setAttribute('aria-hidden', 'false');
        cohostLayer.innerHTML = html;
        stage.classList.add('lh-stage--cohost-2');
        if (root) root.classList.add('lh-root--cohost-hidden');
    }

    function clearCohostLayer() {
        if (!cohostLayer || !stage) return;
        stopPkSimulation();
        clearPkSettlementUi();
        cohostLayer.hidden = true;
        cohostLayer.setAttribute('aria-hidden', 'true');
        cohostLayer.innerHTML = '';
        cohostLayer.classList.remove('lh-cohost-layer--pk-settle');
        stage.classList.remove('lh-stage--cohost-2');
        if (root) root.classList.remove('lh-root--cohost-hidden');
    }

    function renderCohostMembers() {
        var pkHint = '';
        if (state.pkSettling) {
            pkHint = '<p class="lh-cohost-hint lh-cohost-hint--wait lh-cohost-hint--pk-settle"><i class="fa-solid fa-trophy"></i> PK 结算中 · ' +
                (state.lastPkWinner || '—') + ' 获胜 · 点击「关闭」结束结算</p>';
        } else if (state.pk) {
            pkHint = '<p class="lh-cohost-hint lh-cohost-hint--pk"><i class="fa-solid fa-bolt"></i> PK 进行中 · ' +
                (state.pkType === 'like' ? '点赞总个数' : '礼物总金额') + ' · ' +
                formatPkTimer(state.pkRemaining || state.pkDurSec) + '</p>' +
                '<button type="button" class="btn btn-secondary btn-sm btn-block" id="lhPkDemoEnd" style="margin-bottom:10px">' +
                '<i class="fa-solid fa-flag-checkered"></i> 结束 PK（演示）</button>';
        }
        setDynamic(
            pkHint +
            '<div class="lh-cohost-members">' +
            '<div class="lh-cohost-member"><div class="av" style="background-image:url(\'' + I.me + '\')"></div>' +
            '<div class="meta"><div class="n">' + state.myName + '</div><div class="s">房主 · 手机推流</div></div></div>' +
            '<div class="lh-cohost-member"><div class="av" style="background-image:url(\'' + I.night + '\')"></div>' +
            '<div class="meta"><div class="n">夜雨听弦</div><div class="s">RTMP 复用</div></div></div></div>' +
            cohostExitBtnHtml('btn btn-secondary btn-sm lh-cohost-exit-block')
        );
    }

    function connectCohost(partnerName) {
        state.matching = false;
        state.cohost = true;
        clearTimeout(matchTimer);
        setCohostToolbarDisabled(true);
        showCohostLayer(cohostStageHtml(false));
        renderCohostMembers();
        syncToolbarState();
        closeModal();
        if (hooks.onCohostChange) hooks.onCohostChange(true);
        toast('已与 ' + (partnerName || '夜雨听弦') + ' 建立主播连麦');
    }

    function exitCohost() {
        state.cohost = false;
        state.pk = false;
        state.pkSettling = false;
        state.matching = false;
        clearCohostLayer();
        setCohostToolbarDisabled(false);
        setDynamic('');
        syncToolbarState();
        if (hooks.onCohostChange) hooks.onCohostChange(false);
        toast('已退出主播连麦');
    }

    function closeModal() {
        if (modalHost) modalHost.innerHTML = '';
    }

    function openModal(html, onReady) {
        closeModal();
        if (!modalHost) return;
        var backdrop = document.createElement('div');
        backdrop.className = 'lh-obs-modal-backdrop';
        backdrop.innerHTML = html;
        modalHost.appendChild(backdrop);
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop || e.target.closest('[data-modal-close]')) closeModal();
        });
        if (onReady) onReady(backdrop);
    }

    function showDirectedPicker() {
        if (audienceMicOn()) {
            toast('观众上麦已开启，请先关闭后再发起主播连麦');
            return;
        }
        if (!isLive()) {
            toast('请先开始直播');
            return;
        }
        openModal(
            '<div class="lh-obs-modal" role="dialog">' +
            '<div class="lh-obs-modal-head"><h3><i class="fa-solid fa-user-plus" style="color:#c084fc"></i> 指定连麦</h3>' +
            '<p>搜索正在直播且可连麦的主播</p></div>' +
            '<div class="lh-obs-modal-body"><div class="lh-obs-search"><i class="fa-solid fa-magnifying-glass"></i>' +
            '<input type="search" placeholder="搜索主播昵称…" value="夜" /></div>' +
            '<div class="lh-obs-host-pick">' +
            '<div class="lh-obs-host-pick-item selected" data-host="夜雨听弦" role="button" tabindex="0">' +
            '<div class="av" style="background-image:url(\'' + I.night + '\')"></div>' +
            '<div class="info"><div class="n">夜雨听弦</div><div class="s">爵士 · 1,204 在线 · 可连麦</div></div></div>' +
            '<div class="lh-obs-host-pick-item" data-host="EchoDJ" role="button" tabindex="0">' +
            '<div class="av" style="background-image:url(\'' + I.echo + '\')"></div>' +
            '<div class="info"><div class="n">EchoDJ</div><div class="s">电子 · 856 在线</div></div></div></div></div>' +
            '<div class="lh-obs-modal-foot">' +
            '<button type="button" class="btn btn-secondary btn-sm" data-modal-close>取消</button>' +
            '<button type="button" class="btn btn-primary btn-sm" id="lhDirectedSend">发送连麦邀请</button></div></div>',
            function (rootEl) {
                var selected = '夜雨听弦';
                rootEl.querySelectorAll('.lh-obs-host-pick-item').forEach(function (item) {
                    item.addEventListener('click', function () {
                        rootEl.querySelectorAll('.lh-obs-host-pick-item').forEach(function (x) {
                            x.classList.remove('selected');
                        });
                        item.classList.add('selected');
                        selected = item.getAttribute('data-host') || '夜雨听弦';
                    });
                });
                var send = rootEl.querySelector('#lhDirectedSend');
                if (send) {
                    send.addEventListener('click', function () {
                        toast('已向 ' + selected + ' 发送连麦邀请');
                        closeModal();
                        setDynamic('<p class="lh-cohost-hint lh-cohost-hint--wait"><i class="fa-solid fa-hourglass-half"></i> 等待 ' +
                            selected + ' 同意连麦…</p>');
                        setTimeout(function () { connectCohost(selected); }, 1400);
                    });
                }
            }
        );
    }

    function showPkSetup() {
        if (!state.cohost || state.pk) return;
        openModal(
            '<div class="lh-obs-modal" role="dialog">' +
            '<div class="lh-obs-modal-head"><h3><i class="fa-solid fa-hand-fist" style="color:#fbbf24"></i> 发起 PK</h3>' +
            '<p>选择 PK 形式与时长（后台配置固定选项）</p></div>' +
            '<div class="lh-obs-modal-body lh-pk-form">' +
            '<div class="field"><label>PK 形式</label><div class="lh-pk-types">' +
            '<button type="button" class="lh-pk-type active" data-pk-type="gift"><i class="fa-solid fa-gift"></i><br>礼物总金额</button>' +
            '<button type="button" class="lh-pk-type" data-pk-type="like"><i class="fa-regular fa-thumbs-up"></i><br>点赞总个数</button></div></div>' +
            '<div class="field"><label>PK 时长</label><div class="lh-pk-durations">' +
            '<span class="lh-pk-dur">1 分钟</span><span class="lh-pk-dur active">3 分钟</span>' +
            '<span class="lh-pk-dur">5 分钟</span><span class="lh-pk-dur">10 分钟</span></div></div></div>' +
            '<div class="lh-obs-modal-foot">' +
            '<button type="button" class="btn btn-secondary btn-sm" data-modal-close>取消</button>' +
            '<button type="button" class="btn btn-primary btn-sm" id="lhPkSend">发送 PK 申请</button></div></div>',
            function (rootEl) {
                rootEl.querySelectorAll('.lh-pk-type').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        rootEl.querySelectorAll('.lh-pk-type').forEach(function (x) { x.classList.remove('active'); });
                        btn.classList.add('active');
                        state.pkType = btn.getAttribute('data-pk-type') || 'gift';
                    });
                });
                rootEl.querySelectorAll('.lh-pk-dur').forEach(function (span) {
                    span.addEventListener('click', function () {
                        rootEl.querySelectorAll('.lh-pk-dur').forEach(function (x) { x.classList.remove('active'); });
                        span.classList.add('active');
                        var m = (span.textContent || '').match(/(\d+)/);
                        state.pkDurSec = m ? parseInt(m[1], 10) * 60 : 180;
                    });
                });
                var send = rootEl.querySelector('#lhPkSend');
                if (send) send.addEventListener('click', function () { closeModal(); showPkPending(); });
            }
        );
    }

    function showPkPending() {
        var label = state.pkType === 'like' ? '点赞总个数' : '礼物总金额';
        openModal(
            '<div class="lh-obs-modal" role="dialog">' +
            '<div class="lh-obs-modal-head"><h3><i class="fa-solid fa-hourglass-half" style="color:#fbbf24"></i> 等待全员同意 PK</h3>' +
            '<p>' + label + ' · 3 分钟 · 需所有在麦主播同意后开始</p></div>' +
            '<div class="lh-obs-modal-body"><div class="lh-obs-approve-list">' +
            '<div class="lh-obs-approve-row"><div class="av" style="background-image:url(\'' + I.me + '\')"></div>' +
            '<span class="lh-obs-approve-name">' + state.myName + '（发起方）</span>' +
            '<span class="status ok"><i class="fa-solid fa-circle-check"></i>已同意</span></div>' +
            '<div class="lh-obs-approve-row"><div class="av" style="background-image:url(\'' + I.night + '\')"></div>' +
            '<span class="lh-obs-approve-name">夜雨听弦</span>' +
            '<span class="status wait"><i class="fa-solid fa-clock"></i>等待中</span></div></div></div>' +
            '<div class="lh-obs-modal-foot">' +
            '<button type="button" class="btn btn-secondary btn-sm" data-modal-close>取消 PK</button>' +
            '<button type="button" class="btn btn-primary btn-sm" id="lhPkAgree">同意 PK</button></div></div>',
            function (rootEl) {
                var agree = rootEl.querySelector('#lhPkAgree');
                if (agree) agree.addEventListener('click', startPk);
            }
        );
    }

    function startPk() {
        state.pk = true;
        state.pkSettling = false;
        state.pkScoreA = 1240;
        state.pkScoreB = 892;
        state.pkRemaining = state.pkDurSec || 180;
        closeModal();
        clearPkSettlementUi();
        showCohostLayer(cohostStageHtml(true));
        renderCohostMembers();
        syncToolbarState();
        startPkSimulation();
        toast('PK 已开始 · ' + formatPkTimer(state.pkRemaining));
    }

    function startRandomMatch() {
        if (state.cohost || state.matching) return;
        if (audienceMicOn()) {
            toast('观众上麦已开启，请先关闭后再发起主播连麦');
            return;
        }
        if (!isLive()) {
            toast('请先开始直播');
            return;
        }
        state.matching = true;
        setCohostToolbarDisabled(true);
        setDynamic('<p class="lh-cohost-hint lh-cohost-hint--wait"><i class="fa-solid fa-spinner fa-spin"></i> 随机匹配中 · 已等待 0s</p>');
        var sec = 0;
        matchTimer = setInterval(function () {
            sec += 1;
            var hint = dynamic && dynamic.querySelector('.lh-cohost-hint--wait');
            if (hint) {
                hint.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 随机匹配中 · 已等待 ' + sec + 's';
            }
        }, 1000);
        setTimeout(function () { connectCohost('夜雨听弦'); }, 2200);
        syncToolbarState();
    }

    function toggleAudienceMic() {
        if (!audienceMicOn() && isCohostMode()) {
            toast('主播连麦进行中，不可与观众上麦同时开启');
            return;
        }
        setAudienceMic(!audienceMicOn());
        syncToolbarState();
    }

    function onDynamicClick(e) {
        if (e.target.closest('#lhPkDemoEnd')) {
            triggerPkEnd();
            return;
        }
        if (e.target.closest('.lh-cohost-exit')) {
            exitCohost();
        }
    }

    function onStageClick(e) {
        if (e.target.closest('[data-pk-settle-dismiss]')) {
            dismissPkSettlement();
            return;
        }
        if (e.target.closest('.lh-cohost-exit')) exitCohost();
    }

    function bindUi() {
        if (btnMatch) btnMatch.addEventListener('click', startRandomMatch);
        if (btnDirected) btnDirected.addEventListener('click', showDirectedPicker);
        if (btnAud) btnAud.addEventListener('click', toggleAudienceMic);
        if (btnPk) btnPk.addEventListener('click', showPkSetup);
        if (dynamic) dynamic.addEventListener('click', onDynamicClick);
        if (cohostLayer) cohostLayer.addEventListener('click', onStageClick);
    }

    function init(options) {
        hooks = options || {};
        if (hooks.myName) state.myName = hooks.myName;
        stage = $('lhStage');
        cohostLayer = $('lhCohostLayer');
        root = $('lhRoot');
        dynamic = $('lhCohostDynamic');
        btnMatch = $('lhBtnRandomMatch');
        btnDirected = $('lhBtnDirected');
        btnAud = $('lhBtnAudienceMic');
        btnPk = $('lhBtnPk');
        modalHost = $('lhObsModalHost');
        if (!dynamic) return;
        bindUi();
        syncToolbarState();
    }

    global.H5LiveHostCohost = {
        init: init,
        syncToolbarState: syncToolbarState,
        exitCohost: exitCohost,
        isCohostMode: isCohostMode,
        audienceMicOn: audienceMicOn
    };
})(window);
