/**
 * 个人主页 · 紧凑积分行 + 积分任务抽屉
 */
(function () {
    var S = window.FLHomePoints;
    if (!S || !document.getElementById('profilePointsInline')) return;

    var state = { data: null };

    function qs(sel, root) { return (root || document).querySelector(sel); }
    function qsa(sel, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    }
    function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function showToast(msg) {
        var el = qs('#pfToast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        setTimeout(function () { el.classList.remove('show'); }, 2400);
    }

    function statusMeta(task) {
        if (task.status === 'claimed') return { text: '已领取', cls: 'claimed' };
        if (task.status === 'claimable') return { text: '可领取', cls: 'claimable' };
        if (task.status === 'locked') return { text: '未解锁', cls: 'locked' };
        return { text: '进行中', cls: 'progress' };
    }

    function actionLabel(task) {
        if (task.status === 'claimed') return '已领取';
        if (task.status === 'claimable') return '领取';
        if (task.status === 'locked') return '去了解';
        return '去完成';
    }

    function buildProgressHtml(task) {
        if (task.progressType === 'none' || task.status === 'claimed' && task.id === 'act_checkin') {
            return '';
        }
        if (task.progressType === 'daily_claim') {
            var claimed = task.dailyClaimed || 0;
            var max = task.dailyClaimMax || 1;
            var unit = task.claimUnit || '次';
            var pct = Math.min(100, Math.round((claimed / max) * 100));
            return '<div class="prog"><span style="width:' + pct + '%"></span></div>' +
                '<div class="prog-text">今日已领 <strong>' + claimed + '</strong> / 可领 <strong>' + max + '</strong> ' + unit + '</div>';
        }
        if (task.progressType === 'timer') {
            var cur = task.timerCurrent || 0;
            var tot = task.timerTotal || 60;
            var tpct = Math.min(100, Math.round((cur / tot) * 100));
            return '<div class="prog"><span style="width:' + tpct + '%"></span></div>' +
                '<div class="prog-text">浏览倒计时 ' + cur + ' / ' + tot + ' 秒</div>';
        }
        return '';
    }

    function openDrawer() {
        var mask = qs('#hpDrawerMask');
        var drawer = qs('#hpDrawer');
        if (mask) mask.classList.add('is-open');
        if (drawer) drawer.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        var mask = qs('#hpDrawerMask');
        var drawer = qs('#hpDrawer');
        if (mask) mask.classList.remove('is-open');
        if (drawer) drawer.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    function goMall() { location.href = 'points-mall.html'; }

    function applyWalletFromStorage(data) {
        if (window.FLUserRegistry && window.FansloopAuth && window.FansloopAuth.getUserId()) {
            var acc = window.FLUserRegistry.getByUserId(window.FansloopAuth.getUserId());
            if (acc && acc.pointsWallet) return data;
        }
        var saved = S.loadTaskState()._wallet;
        if (saved) {
            if (typeof saved.available === 'number') data.wallet.available = saved.available;
            if (typeof saved.todayEarned === 'number') data.wallet.todayEarned = saved.todayEarned;
        }
        data.wallet.total = S.getTotalPoints(data.wallet);
        return data;
    }

    function renderAll(data) {
        state.data = data;
        renderInline(data);
        renderHeader(data);
        renderDrawer(data);
    }

    function renderInline(data) {
        var w = data.wallet;
        var total = S.getTotalPoints(w);
        var el = qs('#profilePointsInline');
        if (!el) return;
        el.innerHTML =
            '<div class="ppi-info">' +
            '<span class="ic"><i class="fa-solid fa-coins"></i></span>' +
            '<span class="ppi-total"><span class="val">' + S.formatPoints(total) + '</span>总积分</span>' +
            '<span class="sub today-earn">今日已领 <strong>+' + S.formatPoints(w.todayEarned) + '</strong></span>' +
            '</div>' +
            '<button type="button" class="btn-tasks" id="ppBtnTasks"><i class="fa-solid fa-list-check"></i> 积分任务</button>';
        qs('#ppBtnTasks', el).addEventListener('click', openDrawer);
    }

    function renderHeader(data) {
        var btn = qs('#hPointsBtn');
        if (!btn) return;
        var total = S.getTotalPoints(data.wallet);
        btn.innerHTML = '<span class="ic"><i class="fa-solid fa-coins"></i></span><span class="val">' +
            S.formatPoints(total) + '</span><span class="sub">积分</span>';
        btn.title = '总积分 ' + S.formatPoints(total);
        btn.onclick = openDrawer;
    }

    function renderDrawer(data) {
        var w = data.wallet;
        var total = S.getTotalPoints(w);
        var summary = qs('#hpDrawerSummaryCompact');
        if (summary) {
            summary.innerHTML =
                '<span>总积分 <strong>' + S.formatPoints(total) + '</strong></span>' +
                '<span>今日已领 <strong>+' + S.formatPoints(w.todayEarned) + '</strong> / ' + S.formatPoints(w.todayCap) + '</span>';
        }

        var tasksEl = qs('#hpDrawerTasks');
        if (!tasksEl) return;
        tasksEl.innerHTML = data.tasks.map(function (t) {
            var st = statusMeta(t);
            var progHtml = buildProgressHtml(t);
            var cardCls = t.status === 'locked' ? ' is-locked' : (t.status === 'claimed' ? ' is-claimed' : '');
            var btnCls = '';
            if (t.status === 'claimable') btnCls = ' claim';
            if (t.status === 'claimed') btnCls = ' done';
            return '<div class="hp-task-card' + cardCls + '" data-id="' + t.id + '">' +
                '<div class="thumb" style="background-image:url(\'' + t.image + '\')"></div>' +
                '<div class="body">' +
                '<div class="title">' + escapeHtml(t.name) +
                '<span class="hp-task-status ' + st.cls + '">' + st.text + '</span></div>' +
                '<div class="desc">' + escapeHtml(t.rewardDesc) + '</div>' + progHtml +
                '</div>' +
                '<div class="side"><span class="reward">+' + t.reward + '</span>' +
                '<button type="button" class="btn-go' + btnCls + '"' +
                (t.status === 'claimed' ? ' disabled' : '') + '>' + actionLabel(t) + '</button></div></div>';
        }).join('');

        bindTaskActions(tasksEl);
    }

    function markClaimedUI(card, task) {
        var badge = card.querySelector('.hp-task-status');
        var btn = card.querySelector('.btn-go');
        if (badge) {
            badge.textContent = '已领取';
            badge.className = 'hp-task-status claimed';
        }
        if (btn) {
            btn.textContent = '已领取';
            btn.className = 'btn-go done';
            btn.disabled = true;
        }
        card.classList.add('is-claimed');
    }

    function handleTaskAction(task, card) {
        if (task.status === 'claimed') return;

        if (task.actionType === 'claim' && task.status === 'claimable') {
            S.claimTask(task.id).then(function (res) {
                if (!res) return;
                if (res.rejected) {
                    showToast(res.toast || '领取失败');
                    return;
                }
                var data = res.data;
                showToast(res.toast);
                markClaimedUI(card, res.task);
                renderAll(data);
                try {
                    window.dispatchEvent(new CustomEvent('fl-points-data-change', { detail: data }));
                } catch (e) { /* ignore */ }
                state.data = data;
            });
            return;
        }

        if (task.actionType === 'navigate' && task.actionHref) {
            if (task.navigateToast) {
                showToast(task.navigateToast);
                setTimeout(function () { location.href = task.actionHref; }, 500);
            } else {
                location.href = task.actionHref;
            }
        }
    }

    function bindTaskActions(tasksEl) {
        qsa('.hp-task-card', tasksEl).forEach(function (card) {
            var id = card.getAttribute('data-id');
            var task = state.data && state.data.tasks.find(function (t) { return t.id === id; });
            if (!task) return;
            var btn = card.querySelector('.btn-go');
            if (!btn || btn.disabled) return;
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                handleTaskAction(task, card);
            });
        });
    }

    function bindDrawer() {
        qsa('#hpDrawerClose, #hpDrawerCloseFoot').forEach(function (btn) {
            btn.addEventListener('click', closeDrawer);
        });
        var mask = qs('#hpDrawerMask');
        if (mask) mask.addEventListener('click', closeDrawer);
        var mall = qs('#hpDrawerGoMall');
        if (mall) mall.addEventListener('click', goMall);
    }

    function boot() {
        bindDrawer();
        if (new URLSearchParams(location.search).get('pointsReset') === '1') {
            S.resetTaskState();
        }
        S.fetchPointsData().then(function (data) {
            renderAll(applyWalletFromStorage(data));
            if (window.MallBenefitsScenes) window.MallBenefitsScenes.applyAll();
        });

        var params = new URLSearchParams(location.search);
        if (params.get('pointsTasks') === 'open' || params.get('pointsDrawer') === 'open') {
            setTimeout(openDrawer, 100);
        }
        if (params.get('pointsCheckin') === 'claimed') {
            S.saveTaskState({ act_checkin: { status: 'claimed' } });
        }
        if (window.MallBenefitsScenes) {
            setTimeout(function () { window.MallBenefitsScenes.applyAll(); }, 80);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    window.addEventListener('fansloop-auth-change', boot);
    window.addEventListener('fl-points-data-change', function (e) {
        if (e.detail) renderAll(applyWalletFromStorage(e.detail));
    });
})();
