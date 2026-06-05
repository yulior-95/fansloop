/**
 * 邀请数据中心 · 列表 / 奖励明细 / 额度条
 */
(function () {
    var FL = window.FLInviteReward;
    if (!FL) return;

    var MOCK_INVITEES = [
        { uid: 'u8821', name: 'Mika 胶片', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80', at: '2026-06-04 09:12', reward: 200, status: 'ok' },
        { uid: 'u7712', name: '阿Ken · 街拍', avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200', at: '2026-06-03 21:40', reward: 200, status: 'ok' },
        { uid: 'u6603', name: 'Sora旅行记', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=80', at: '2026-06-02 14:08', reward: 200, status: 'ok' },
        { uid: 'u5594', name: '夜猫子剪辑', avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200', at: '2026-06-01 11:22', reward: 0, status: 'pending' },
        { uid: 'u4485', name: 'LoopKid', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', at: '2026-05-28 08:55', reward: 200, status: 'ok' }
    ];

    var MOCK_REWARDS = [
        { at: '2026-06-04 09:12', user: 'Mika 胶片', type: '注册奖励', amt: 200, capHit: false },
        { at: '2026-06-03 21:40', user: '阿Ken · 街拍', type: '注册奖励', amt: 200, capHit: false },
        { at: '2026-06-03 18:02', user: '—', type: '计时任务', amt: 50, capHit: false },
        { at: '2026-06-02 14:08', user: 'Sora旅行记', type: '注册奖励', amt: 200, capHit: false },
        { at: '2026-06-01 23:59', user: '—', type: '邀请奖励（日上限）', amt: 0, capHit: true },
        { at: '2026-05-28 08:55', user: 'LoopKid', type: '注册奖励', amt: 200, capHit: false }
    ];

    function pct(earned, cap) {
        if (!cap) return 0;
        return Math.min(100, Math.round((earned / cap) * 100));
    }

    function renderCaps(cfg) {
        var c = cfg.caps;
        var dailyBar = document.getElementById('capDailyBar');
        var inviteDailyBar = document.getElementById('capInviteDailyBar');
        var inviteTotalBar = document.getElementById('capInviteTotalBar');
        if (dailyBar) {
            var p1 = pct(c.dailyPointsEarned, c.dailyPointsCap);
            dailyBar.style.width = p1 + '%';
            dailyBar.parentElement.classList.toggle('warn', p1 >= 85);
            var el = document.getElementById('capDailyText');
            if (el) el.textContent = FL.formatPoints(c.dailyPointsEarned) + ' / ' + FL.formatPoints(c.dailyPointsCap);
        }
        if (inviteDailyBar) {
            var p2 = pct(c.inviteRewardDailyEarned, c.inviteRewardDailyCap);
            inviteDailyBar.style.width = p2 + '%';
            inviteDailyBar.parentElement.classList.toggle('warn', p2 >= 85);
            var el2 = document.getElementById('capInviteDailyText');
            if (el2) el2.textContent = FL.formatPoints(c.inviteRewardDailyEarned) + ' / ' + FL.formatPoints(c.inviteRewardDailyCap);
        }
        if (inviteTotalBar) {
            var p3 = pct(c.inviteRewardTotalEarned, c.inviteRewardTotalCap);
            inviteTotalBar.style.width = p3 + '%';
            var el3 = document.getElementById('capInviteTotalText');
            if (el3) el3.textContent = FL.formatPoints(c.inviteRewardTotalEarned) + ' / ' + FL.formatPoints(c.inviteRewardTotalCap);
        }
        var tip = document.getElementById('inviteCapTip');
        if (tip) tip.textContent = FL.formatInviteRewardTip(cfg);
    }

    function renderInvitees(filter) {
        var box = document.getElementById('inviteUserList');
        if (!box) return;
        var q = (filter || '').toLowerCase();
        var list = MOCK_INVITEES.filter(function (u) {
            return !q || u.name.toLowerCase().indexOf(q) >= 0 || u.uid.indexOf(q) >= 0;
        });
        if (!list.length) {
            box.innerHTML = '<div style="text-align:center;padding:40px;color:var(--t-tertiary);font-size:13px;">暂无匹配用户</div>';
            return;
        }
        box.innerHTML = list.map(function (u) {
            var st = u.status === 'ok'
                ? '<span class="status ok">已发放</span>'
                : '<span class="status pending">待风控</span>';
            var pts = u.reward > 0 ? '+' + FL.formatPoints(u.reward) + ' 积分' : '待发放';
            return '<article class="inv-user-row" role="button" tabindex="0" data-uid="' + u.uid + '">' +
                '<div class="av" style="background-image:url(\'' + u.avatar + '\')"></div>' +
                '<div class="body"><div class="nm">' + u.name + '</div>' +
                '<div class="meta">UID ' + u.uid + ' · 注册 ' + u.at + '</div></div>' +
                '<div class="acts"><span class="pts">' + pts + '</span>' + st + '</div></article>';
        }).join('');
        var cnt = document.getElementById('tabInviteeCount');
        if (cnt) cnt.textContent = String(MOCK_INVITEES.length);
    }

    function renderRewards() {
        var tbody = document.getElementById('inviteRewardTbody');
        if (!tbody) return;
        tbody.innerHTML = MOCK_REWARDS.map(function (r) {
            var cap = r.capHit ? '<span class="tag-cap">已达上限</span>' : '';
            var amt = r.capHit ? '—' : '+' + FL.formatPoints(r.amt);
            return '<tr><td>' + r.at + '</td><td>' + r.user + '</td><td>' + r.type + '</td>' +
                '<td class="amt">' + amt + '</td><td>' + cap + '</td></tr>';
        }).join('');
        var total = MOCK_REWARDS.filter(function (r) { return !r.capHit; })
            .reduce(function (s, r) { return s + r.amt; }, 0);
        var el = document.getElementById('inviteRewardTotal');
        if (el) el.textContent = FL.formatPoints(total);
    }

    function switchTab(name) {
        document.querySelectorAll('.inv-tabs .tab').forEach(function (t) {
            t.classList.toggle('active', t.getAttribute('data-tab') === name);
        });
        document.querySelectorAll('[data-inv-panel]').forEach(function (p) {
            p.style.display = p.getAttribute('data-inv-panel') === name ? '' : 'none';
        });
    }

    window.FL_profileInviteSwitchTab = switchTab;

    FL.fetchConfig().then(function (cfg) {
        renderCaps(cfg);
        renderInvitees('');
        renderRewards();
        var tipBanner = document.getElementById('inviteRewardTipBanner');
        if (tipBanner) tipBanner.textContent = FL.formatInviteRewardTip(cfg);
    });

    document.querySelectorAll('.inv-tabs .tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            switchTab(tab.getAttribute('data-tab'));
        });
    });

    var search = document.getElementById('inviteUserSearch');
    if (search) {
        search.addEventListener('input', function () {
            renderInvitees(search.value.trim());
        });
    }

    var params = new URLSearchParams(location.search);
    if (params.get('view') === 'invite' || document.getElementById('profileViewInvite')) {
        if (params.get('tab') === 'rewards') switchTab('rewards');
        if (params.get('tab') === 'rules') switchTab('rules');
    }
})();
