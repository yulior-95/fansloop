/**
 * 首页积分 · 条带 / Header / 抽屉交互
 */
(function () {
    var S = window.FLHomePoints;
    if (!S) return;

    function qs(sel, root) { return (root || document).querySelector(sel); }
    function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

    function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function taskProgressPct(task) {
        if (task.progressType === 'daily_claim') {
            return Math.min(100, Math.round(((task.dailyClaimed || 0) / (task.dailyClaimMax || 1)) * 100));
        }
        if (task.progressType === 'timer') {
            return Math.min(100, Math.round(((task.timerCurrent || 0) / (task.timerTotal || 60)) * 100));
        }
        if (!task.progress) return 0;
        return Math.min(100, Math.round((task.progress.current / task.progress.total) * 100));
    }

    function taskProgressHtml(task) {
        if (task.progressType === 'none' || task.progressType === undefined && !task.progress) {
            return '<div class="desc">' + escapeHtml(task.rewardDesc) + '</div>';
        }
        if (task.progressType === 'daily_claim') {
            var pct = taskProgressPct(task);
            var unit = task.claimUnit || '次';
            return '<div class="prog"><span style="width:' + pct + '%"></span></div>' +
                '<div class="desc">今日已领 ' + (task.dailyClaimed || 0) + ' / 可领 ' + (task.dailyClaimMax || 0) + ' ' + unit + '</div>';
        }
        if (task.progressType === 'timer') {
            var tp = taskProgressPct(task);
            return '<div class="prog"><span style="width:' + tp + '%"></span></div>' +
                '<div class="desc">浏览倒计时 ' + (task.timerCurrent || 0) + ' / ' + (task.timerTotal || 60) + ' 秒</div>';
        }
        if (task.progress) {
            var p = taskProgressPct(task);
            return '<div class="prog"><span style="width:' + p + '%"></span></div>' +
                '<div class="desc">' + task.progress.current + ' / ' + task.progress.total + ' ' + task.progress.unit + '</div>';
        }
        return '<div class="desc">' + escapeHtml(task.rewardDesc) + '</div>';
    }

    function taskActionLabel(task) {
        if (task.status === 'claimable') return '领取';
        if (task.status === 'locked') return '去了解';
        return '去完成';
    }

    function renderStrip(data) {
        var w = data.wallet;
        var pct = w.todayCap ? Math.min(100, Math.round((w.todayEarned / w.todayCap) * 100)) : 0;
        var strip = qs('#homePointsStrip');
        if (!strip) return;
        strip.innerHTML =
            '<div class="hp-main">' +
            '<div class="hp-label"><i class="fa-solid fa-coins"></i>我的积分</div>' +
            '<div class="hp-balance"><span class="big" id="hpAvailBig">' + S.formatPoints(w.available) + '</span><span style="font-size:12px;color:var(--t-secondary)">可用积分</span></div>' +
            '<div class="hp-pools">' +
            '<span class="hp-pool frozen"><i class="fa-solid fa-snowflake"></i> 冷静中 <strong>' + S.formatPoints(w.frozen) + '</strong></span>' +
            '<span class="hp-pool"><i class="fa-solid fa-circle-info"></i> ' + escapeHtml(w.frozenHint) + '</span>' +
            '</div>' +
            '<div class="hp-progress">' +
            '<div class="row"><span>今日获取进度</span><span>' + S.formatPoints(w.todayEarned) + ' / ' + S.formatPoints(w.todayCap) + '</span></div>' +
            '<div class="bar"><span style="width:' + pct + '%"></span></div>' +
            '</div></div>' +
            '<div class="hp-actions">' +
            '<button type="button" class="btn btn-primary" id="hpGoMallStrip"><i class="fa-solid fa-store"></i> 积分商城</button>' +
            '<button type="button" class="hp-detail-link" id="hpOpenDrawerStrip">查看任务与明细 <i class="fa-solid fa-chevron-right"></i></button>' +
            '</div>';
        qs('#hpGoMallStrip', strip).addEventListener('click', goMall);
        qs('#hpOpenDrawerStrip', strip).addEventListener('click', openDrawer);
    }

    function renderHeader(data) {
        var btn = qs('#hPointsBtn');
        if (!btn) return;
        var w = data.wallet;
        btn.innerHTML =
            '<span class="ic"><i class="fa-solid fa-coins"></i></span>' +
            '<span class="val">' + S.formatPoints(w.available) + '</span>' +
            '<span class="sub">积分</span>';
        btn.title = '可用 ' + S.formatPoints(w.available) + ' · 冷静中 ' + S.formatPoints(w.frozen);
    }

    function renderAside(data) {
        var mount = qs('#hpAsideMount');
        if (!mount) return;
        var w = data.wallet;
        var tasksHtml = data.tasks.slice(0, 4).map(function (t) {
            var claim = t.status === 'claimable' ? '<span class="tag-claim">可领</span>' : '';
            return '<div class="hp-task-row" data-href="' + escapeHtml(t.actionHref || t.href || '') + '">' +
                '<div class="thumb" style="background-image:url(\'' + t.image + '\')"></div>' +
                '<div class="info"><div class="n">' + escapeHtml(t.name) + claim + '</div>' +
                '<div class="s">' + escapeHtml(t.rewardDesc) + '</div></div>' +
                '<span class="pts">+' + t.reward + '</span></div>';
        }).join('');
        mount.innerHTML =
            '<div class="hp-aside-hero"><div class="overlay">' +
            '<h3><i class="fa-solid fa-coins" style="color:#FBBF24"></i>积分账户</h3>' +
            '<p style="font-size:11px;color:rgba(255,255,255,0.75)">可用于订阅抵扣、解锁内容、商城兑换</p>' +
            '<div class="amt">' + S.formatPoints(w.available) + '</div>' +
            '<p style="font-size:10px;color:rgba(255,255,255,0.6)">冷静中 ' + S.formatPoints(w.frozen) + ' · ' + data.coolingPeriodDays + ' 天期满可用</p>' +
            '<button type="button" class="btn btn-primary btn-sm btn-block" id="hpAsideMall" style="margin-top:10px"><i class="fa-solid fa-store"></i> 去积分商城</button>' +
            '</div></div>' +
            '<div class="aside-card"><div class="ah"><h4><i class="fa-solid fa-list-check" style="color:#10B981"></i>赚积分任务</h4>' +
            '<a href="#" id="hpAsideMore">全部</a></div><div class="ab">' + tasksHtml + '</div></div>';
        qs('#hpAsideMall', mount).addEventListener('click', goMall);
        qs('#hpAsideMore', mount).addEventListener('click', function (e) { e.preventDefault(); openDrawer(); });
        qsa('.hp-task-row', mount).forEach(function (row) {
            row.addEventListener('click', function () {
                var href = row.getAttribute('data-href');
                if (href) location.href = href;
            });
        });
    }

    function renderDrawerTasks(data) {
        var el = qs('#hpDrawerTasks');
        if (!el) return;
        el.innerHTML = data.tasks.map(function (t) {
            var cls = t.status === 'locked' ? ' is-locked' : '';
            var btnCls = t.status === 'claimable' ? ' claim' : '';
            return '<div class="hp-task-card' + cls + '" data-id="' + t.id + '" data-href="' + escapeHtml(t.actionHref || t.href || '') + '">' +
                '<div class="thumb" style="background-image:url(\'' + t.image + '\')"></div>' +
                '<div class="body"><div class="title"><i class="fa-solid ' + t.icon + '" style="color:' + t.iconColor + '"></i> ' +
                escapeHtml(t.name) + '</div>' + taskProgressHtml(t) + '</div>' +
                '<div class="side"><span class="reward">+' + t.reward + '</span>' +
                '<button type="button" class="btn-go' + btnCls + '">' + taskActionLabel(t) + '</button></div></div>';
        }).join('');
        qsa('.hp-task-card', el).forEach(function (card) {
            var href = card.getAttribute('data-href');
            var id = card.getAttribute('data-id');
            card.querySelector('.btn-go').addEventListener('click', function (e) {
                e.stopPropagation();
                if (card.querySelector('.btn-go.claim') && id) {
                    S.claimTask(id).then(function (res) {
                        if (!res) return;
                        if (res.rejected) {
                            toast(res.toast || '领取失败');
                            return;
                        }
                        toast(res.toast || '领取成功');
                        var btn = card.querySelector('.btn-go');
                        if (btn) {
                            btn.textContent = '已领取';
                            btn.disabled = true;
                            btn.classList.remove('claim');
                        }
                        card.classList.add('is-claimed');
                        refreshAll(res.data);
                    });
                    return;
                }
                if (href) location.href = href;
            });
        });
    }

    function renderDrawerLedger(data) {
        var el = qs('#hpDrawerLedger');
        if (!el) return;
        el.innerHTML = data.ledger.map(function (row) {
            var icCls = row.status === 'frozen' ? 'frozen' : row.type;
            var ic = row.type === 'spend' ? 'fa-bag-shopping' : (row.status === 'frozen' ? 'fa-snowflake' : 'fa-plus');
            var amtCls = row.points > 0 ? 'plus' : 'minus';
            var amtTxt = row.points > 0 ? '+' + S.formatPoints(row.points) : S.formatPoints(row.points);
            var sub = row.time;
            if (row.status === 'frozen' && row.unfreezeAt) sub += ' · ' + row.unfreezeAt + ' 解冻';
            return '<div class="hp-ledger-row">' +
                '<div class="ic ' + icCls + '"><i class="fa-solid ' + ic + '"></i></div>' +
                '<div class="info"><div class="t">' + escapeHtml(row.task) + '</div><div class="s">' + sub + '</div></div>' +
                '<span class="amt ' + amtCls + '">' + amtTxt + '</span></div>';
        }).join('');
    }

    function renderDrawerMall(data) {
        var el = qs('#hpMallPreview');
        if (!el) return;
        el.innerHTML = data.mallHot.map(function (item) {
            return '<div class="hp-mall-item" role="button" tabindex="0">' +
                '<div class="img" style="background-image:url(\'' + item.image + '\')"></div>' +
                '<div class="meta"><div class="n">' + escapeHtml(item.name) + '</div>' +
                '<div class="c"><i class="fa-solid fa-coins"></i> ' + S.formatPoints(item.cost) + '</div></div></div>';
        }).join('');
        qsa('.hp-mall-item', el).forEach(function (item) {
            item.addEventListener('click', goMall);
        });
    }

    function renderDrawerSummary(data) {
        var w = data.wallet;
        var avail = qs('#hpDrawerAvail');
        var frozen = qs('#hpDrawerFrozen');
        var today = qs('#hpDrawerToday');
        if (avail) avail.textContent = S.formatPoints(w.available);
        if (frozen) frozen.textContent = S.formatPoints(w.frozen);
        if (today) today.textContent = S.formatPoints(w.todayEarned);
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

    function toast(msg) {
        var host = qs('#toastHostF');
        if (!host) return;
        var t = document.createElement('div');
        t.className = 'toast-f';
        t.textContent = msg;
        host.appendChild(t);
        setTimeout(function () { t.remove(); }, 2400);
    }

    function bindDrawerTabs() {
        qsa('.hp-drawer-tabs button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tab = btn.getAttribute('data-tab');
                qsa('.hp-drawer-tabs button').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                qsa('.hp-drawer-panel').forEach(function (p) {
                    p.classList.toggle('active', p.id === 'hpPanel' + tab);
                });
            });
        });
    }

    function initLayout() {
        var params = new URLSearchParams(location.search);
        var grid = qs('.feed-grid');
        if (params.get('pointsAside') === '1' && grid) {
            grid.classList.remove('feed-grid--immersive');
            grid.classList.add('feed-grid--with-points');
            var aside = qs('#feedAsidePoints');
            if (aside) aside.hidden = false;
        }
    }

    function refreshAll(data) {
        renderStrip(data);
        renderHeader(data);
        renderAside(data);
        renderDrawerSummary(data);
        renderDrawerTasks(data);
        renderDrawerLedger(data);
        renderDrawerMall(data);
        if (window.MallBenefitsScenes) window.MallBenefitsScenes.applyAll();
    }

    function boot() {
        initLayout();
        S.fetchPointsData().then(refreshAll);

        var hBtn = qs('#hPointsBtn');
        if (hBtn) hBtn.addEventListener('click', openDrawer);

        var closeBtn = qs('#hpDrawerClose');
        if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
        var closeFoot = qs('#hpDrawerCloseFoot');
        if (closeFoot) closeFoot.addEventListener('click', closeDrawer);
        var mask = qs('#hpDrawerMask');
        if (mask) mask.addEventListener('click', closeDrawer);

        var footMall = qs('#hpDrawerGoMall');
        if (footMall) footMall.addEventListener('click', goMall);

        bindDrawerTabs();

        var params = new URLSearchParams(location.search);
        if (params.get('pointsDrawer') === 'open') openDrawer();
        if (params.get('pointsTab') === 'ledger') {
            openDrawer();
            var ledgerBtn = qs('.hp-drawer-tabs button[data-tab="Ledger"]');
            if (ledgerBtn) ledgerBtn.click();
        }
        if (window.MallBenefitsScenes) {
            setTimeout(function () { window.MallBenefitsScenes.applyAll(); }, 50);
        }
    }

    window.addEventListener('goodfans-auth-change', function () {
        S.fetchPointsData().then(refreshAll);
    });
    window.addEventListener('fl-points-data-change', function (e) {
        if (e.detail) refreshAll(e.detail);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
