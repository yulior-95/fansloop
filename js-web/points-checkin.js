/**
 * 每日签到 · 连续阶梯 + Header 入口 + 签到弹窗
 * 对接：POST /api/v1/points/tasks/act_checkin/claim
 */
(function (global) {
    var LS = 'fl_checkin_state_v1';
    var TASK_ID = 'act_checkin';
    var LADDER = [10, 20, 30, 50, 70, 85, 100];

    function pad(n) {
        return n < 10 ? '0' + n : '' + n;
    }

    function todayKey() {
        var d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function dateKeyOffset(days) {
        var d = new Date();
        d.setDate(d.getDate() + days);
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function daysBetween(a, b) {
        var pa = a.split('-').map(Number);
        var pb = b.split('-').map(Number);
        var da = new Date(pa[0], pa[1] - 1, pa[2]);
        var db = new Date(pb[0], pb[1] - 1, pb[2]);
        return Math.round((db - da) / 86400000);
    }

    function userId() {
        if (global.FansloopAuth && global.FansloopAuth.getUserId) {
            return global.FansloopAuth.getUserId() || 'default';
        }
        return 'default';
    }

    function readAll() {
        try {
            return JSON.parse(localStorage.getItem(LS) || '{}');
        } catch (e) {
            return {};
        }
    }

    function writeState(state) {
        var all = readAll();
        all[userId()] = state;
        try {
            localStorage.setItem(LS, JSON.stringify(all));
        } catch (e) { /* ignore */ }
    }

    function readState() {
        var all = readAll();
        return all[userId()] || { streakDay: 0, lastCheckinDate: null, totalCheckins: 0 };
    }

    function rewardForDay(day) {
        var idx = Math.min(Math.max(day, 1), LADDER.length) - 1;
        return LADDER[idx];
    }

    function resolveNextStreakDay(state) {
        var today = todayKey();
        if (!state.lastCheckinDate) return 1;
        if (state.lastCheckinDate === today) return state.streakDay || 1;
        var gap = daysBetween(state.lastCheckinDate, today);
        if (gap > 1) return 1;
        if (gap === 1) return (state.streakDay >= LADDER.length) ? 1 : (state.streakDay || 0) + 1;
        return 1;
    }

    function getStatus() {
        var state = readState();
        var today = todayKey();
        var checkedToday = state.lastCheckinDate === today;
        var nextStreakDay = resolveNextStreakDay(state);
        var displayStreak = checkedToday ? state.streakDay : Math.max(0, nextStreakDay - 1);

        return {
            canClaim: !checkedToday,
            checkedToday: checkedToday,
            streakDay: state.streakDay || 0,
            displayStreak: displayStreak,
            nextStreakDay: nextStreakDay,
            nextReward: rewardForDay(nextStreakDay),
            ladder: LADDER.slice(),
            totalCheckins: state.totalCheckins || 0,
            lastCheckinDate: state.lastCheckinDate
        };
    }

    function syncTasks(tasks) {
        var st = getStatus();
        return (tasks || []).map(function (t) {
            if (t.id !== TASK_ID) return t;
            var row = Object.assign({}, t);
            row.actionType = 'claim';
            row.progressType = 'none';
            row.reward = st.nextReward;
            row.rewardDesc = st.checkedToday
                ? '今日已签到 · 连续 ' + st.streakDay + ' 天'
                : '连续签到第 ' + st.nextStreakDay + ' 天 · +' + st.nextReward + ' 积分';
            row.status = st.canClaim ? 'claimable' : 'claimed';
            row.claimToast = '签到成功 +' + (st.checkedToday ? st.ladder[Math.min(st.streakDay, LADDER.length) - 1] : st.nextReward) + ' 积分';
            return row;
        });
    }

    function recordClaim(streakDay) {
        var state = readState();
        state.streakDay = streakDay;
        state.lastCheckinDate = todayKey();
        state.totalCheckins = (state.totalCheckins || 0) + 1;
        writeState(state);
    }

    function claim() {
        var st = getStatus();
        if (!st.canClaim) {
            return Promise.resolve({ ok: false, reason: '今日已签到', status: st });
        }
        if (!global.FLHomePoints || !global.FLHomePoints.claimTask) {
            return Promise.resolve({ ok: false, reason: '积分服务不可用' });
        }
        return global.FLHomePoints.claimTask(TASK_ID).then(function (res) {
            if (!res || res.rejected) {
                return { ok: false, reason: (res && res.toast) || '签到失败' };
            }
            recordClaim(st.nextStreakDay);
            var status = getStatus();
            try {
                global.dispatchEvent(new CustomEvent('fl-checkin-change', { detail: status }));
            } catch (e) { /* ignore */ }
            return {
                ok: true,
                reward: res.task && res.task.reward,
                streakDay: st.nextStreakDay,
                toast: '签到成功 +' + (res.task && res.task.reward) + ' 积分 · 连续 ' + st.nextStreakDay + ' 天',
                data: res.data,
                status: status
            };
        });
    }

    function toast(msg) {
        var host = document.getElementById('toastHostF') || document.getElementById('pfToast');
        if (!host) return;
        var t = document.createElement('div');
        t.className = host.id === 'pfToast' ? 'show' : 'toast-f';
        if (host.id === 'pfToast') {
            host.textContent = msg;
            host.classList.add('show');
            setTimeout(function () { host.classList.remove('show'); }, 2600);
            return;
        }
        t.textContent = msg;
        host.appendChild(t);
        setTimeout(function () { t.remove(); }, 2600);
    }

    function renderLadder(st) {
        var html = '';
        for (var i = 0; i < LADDER.length; i++) {
            var day = i + 1;
            var cls = 'checkin-day';
            if (st.checkedToday && day <= st.streakDay) cls += ' is-done';
            else if (!st.checkedToday && day < st.nextStreakDay) cls += ' is-done';
            else if (!st.checkedToday && day === st.nextStreakDay) cls += ' is-today';
            html += '<div class="' + cls + '">' +
                '<div class="d">D' + day + '</div>' +
                '<div class="p">+' + LADDER[i] + '</div></div>';
        }
        return html;
    }

    function renderModal(root, st) {
        var streakTxt = st.checkedToday
            ? '已连续签到 <strong>' + st.streakDay + '</strong> 天'
            : '下一档：第 <strong>' + st.nextStreakDay + '</strong> 天 · +' + st.nextReward + ' 积分';
        root.innerHTML =
            '<div class="checkin-sheet" role="dialog" aria-label="每日签到">' +
            '<button type="button" class="checkin-close" id="checkinClose" aria-label="关闭"><i class="fa-solid fa-xmark"></i></button>' +
            '<div class="checkin-head"><i class="fa-solid fa-calendar-check"></i><h3>每日签到</h3>' +
            '<p>' + streakTxt + '</p></div>' +
            '<div class="checkin-ladder">' + renderLadder(st) + '</div>' +
            '<div class="checkin-meta">累计签到 <strong>' + st.totalCheckins + '</strong> 次 · 断签后从第 1 天重新累计</div>' +
            '<button type="button" class="checkin-claim' + (st.canClaim ? '' : ' is-done') + '" id="checkinClaimBtn"' +
            (st.canClaim ? '' : ' disabled') + '>' +
            (st.canClaim ? '<i class="fa-solid fa-gift"></i> 立即签到 +' + st.nextReward : '<i class="fa-solid fa-circle-check"></i> 今日已签到') +
            '</button></div>';
    }

    function ensureModalRoot() {
        var root = document.getElementById('checkinModalRoot');
        if (root) return root;
        root = document.createElement('div');
        root.id = 'checkinModalRoot';
        root.className = 'checkin-modal-root';
        root.setAttribute('aria-hidden', 'true');
        document.body.appendChild(root);
        return root;
    }

    function updateHeaderBtn(st) {
        var btn = document.getElementById('hCheckinBtn');
        if (!btn) return;
        btn.classList.toggle('has-reward', !!st.canClaim);
        btn.title = st.canClaim ? '每日签到 · 可领取 +' + st.nextReward : '今日已签到 · 连续 ' + st.streakDay + ' 天';
    }

    function bindModalEvents(root) {
        root.addEventListener('click', function (e) {
            if (e.target === root) closeModal();
        });
        var closeBtn = document.getElementById('checkinClose');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        var claimBtn = document.getElementById('checkinClaimBtn');
        if (claimBtn && !claimBtn.disabled) {
            claimBtn.addEventListener('click', function () {
                claimBtn.disabled = true;
                claim().then(function (res) {
                    if (!res.ok) {
                        toast(res.reason || '签到失败');
                        claimBtn.disabled = false;
                        return;
                    }
                    toast(res.toast);
                    if (res.data) {
                        try {
                            global.dispatchEvent(new CustomEvent('fl-points-data-change', { detail: res.data }));
                        } catch (e) { /* ignore */ }
                    }
                    openModal();
                });
            });
        }
    }

    function openModal() {
        var root = ensureModalRoot();
        var st = getStatus();
        renderModal(root, st);
        bindModalEvents(root);
        root.classList.add('show');
        root.setAttribute('aria-hidden', 'false');
        updateHeaderBtn(st);
    }

    function closeModal() {
        var root = document.getElementById('checkinModalRoot');
        if (!root) return;
        root.classList.remove('show');
        root.setAttribute('aria-hidden', 'true');
    }

    function bindHeaderBtn() {
        var btn = document.getElementById('hCheckinBtn');
        if (!btn || btn.getAttribute('data-fl-checkin-bound') === '1') return;
        btn.setAttribute('data-fl-checkin-bound', '1');
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            openModal();
        });
    }

    function refresh() {
        var st = getStatus();
        updateHeaderBtn(st);
        return st;
    }

    function init() {
        bindHeaderBtn();
        refresh();
    }

    global.FLCheckin = {
        TASK_ID: TASK_ID,
        LADDER: LADDER,
        getStatus: getStatus,
        syncTasks: syncTasks,
        recordClaim: recordClaim,
        claim: claim,
        openModal: openModal,
        closeModal: closeModal,
        refresh: refresh
    };

    global.FL_openCheckinModal = openModal;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    global.addEventListener('fansloop-auth-change', refresh);
    global.addEventListener('fl-checkin-change', refresh);
})(typeof window !== 'undefined' ? window : this);
