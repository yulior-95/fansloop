(function () {
    var Store = window.FLInviteDataStore;
    var M = window.AdminModal;
    if (!Store) return;

    var tbody = document.getElementById('invTableBody');
    var pagerMount = document.getElementById('invPager');
    var pager = null;
    var filteredRows = [];
    var urlMonthOnly = false;

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function renderStats() {
        var s = Store.getPlatformStats();
        document.getElementById('invStatRow').innerHTML =
            '<div class="inv-stat-card"><div class="k">今日新增邀请</div><div class="v">' + s.todayInvites + '</div></div>' +
            '<div class="inv-stat-card"><div class="k">本月有效邀请</div><div class="v" style="color:#1890ff">' + s.monthValid + '</div></div>' +
            '<div class="inv-stat-card"><div class="k">累计邀请注册</div><div class="v">' + Store.fmt(s.totalInvites) + '</div></div>' +
            '<div class="inv-stat-card"><div class="k">累计发放奖励积分</div><div class="v" style="color:#faad14">' + Store.fmt(s.totalRewardPts) + '</div></div>';
    }

    function renderTable(rows) {
        if (!tbody) return;
        var pageRows = pager ? pager.getSlice(rows) : rows;
        if (!pageRows.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">暂无邀请记录</td></tr>';
            return;
        }
        tbody.innerHTML = pageRows.map(function (r) {
            var pts = r.reward > 0 ? '+' + Store.fmt(r.reward) : (r.status === 'capped' ? '—' : '0');
            var ptsColor = r.reward > 0 ? 'color:#52c41a;font-weight:600' : 'color:rgba(0,0,0,.45)';
            return '<tr>' +
                '<td>' + esc(r.registeredAt) + '</td>' +
                '<td><div>' + esc(r.inviterNickname) + '</div><div style="font-size:11px;color:rgba(0,0,0,.45)">UID ' + esc(r.inviterUid) + '</div></td>' +
                '<td><code style="font-size:12px">' + esc(r.inviteCode) + '</code></td>' +
                '<td><div>' + esc(r.inviteeNickname) + '</div><div style="font-size:11px;color:rgba(0,0,0,.45)">UID ' + esc(r.inviteeUid) + '</div></td>' +
                '<td style="' + ptsColor + '">' + pts + '</td>' +
                '<td>' + Store.statusTag(r.status) + '</td>' +
                '</tr>';
        }).join('');
    }

    function applyFilter() {
        filteredRows = Store.filterRecords({
            inviterUid: (document.getElementById('invFilterInviter').value || '').trim(),
            inviteeUid: (document.getElementById('invFilterInvitee').value || '').trim(),
            keyword: (document.getElementById('invFilterKeyword').value || '').trim(),
            status: document.getElementById('invFilterStatus').value,
            monthOnly: urlMonthOnly
        });
        if (pager) {
            pager.resetPage();
            pager.setTotal(filteredRows.length);
        }
        renderTable(filteredRows);
    }

    function applyUrlParams() {
        var params = new URLSearchParams(location.search);
        var inviterUid = params.get('inviterUid') || '';
        var inviterName = params.get('inviterName') || '';
        urlMonthOnly = params.get('monthOnly') === '1';
        var banner = document.getElementById('invFilterBanner');

        if (inviterUid) {
            document.getElementById('invFilterInviter').value = inviterUid;
        }
        if (params.get('status')) {
            document.getElementById('invFilterStatus').value = params.get('status');
        }
        if (params.get('keyword')) {
            document.getElementById('invFilterKeyword').value = params.get('keyword');
        }

        if (banner && inviterUid) {
            var scope = urlMonthOnly ? ' · 本月有效邀请' : '';
            banner.style.display = 'block';
            banner.innerHTML = '当前查看邀请人：<strong>UID ' + esc(inviterUid) +
                (inviterName ? ' · ' + esc(inviterName) : '') + '</strong>' + esc(scope) +
                ' <a href="invite-data.html" style="margin-left:12px">查看全平台</a>';
        }
    }

    document.getElementById('btnInvQuery').addEventListener('click', function () {
        applyFilter();
        M.toast('已查询（原型）');
    });

    document.getElementById('btnInvExport').addEventListener('click', function () {
        if (!window.AdminExport) return;
        AdminExport.confirm({
            title: '导出邀请数据',
            body: '<p style="margin:0">导出全平台邀请注册与奖励发放记录。</p>',
            exportType: '邀请数据',
            sourcePage: 'invite-data.html',
            conditionsText: '筛选条件：当前页筛选'
        });
    });

    if (pagerMount && window.AdminPager) {
        pager = window.AdminPager.create({
            mount: pagerMount,
            pageSize: 10,
            onChange: function () { renderTable(filteredRows); }
        });
    }

    renderStats();
    applyUrlParams();
    Store.fetchPlatformRecords().then(function () {
        applyFilter();
    });
})();
