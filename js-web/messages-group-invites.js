/**
 * 进群邀请 · 全量列表（热门创作者大量邀请场景）
 */
(function () {
    function buildList() {
        var list = [
            { id: 'i1', group: 'Luna VIP 摄影群', host: 'Luna 🌙', members: 128, msg: '邀请你加入订阅者专属群，获取直播与内容优先通知' },
            { id: 'i2', group: '直播粉丝交流群', host: 'Lens 旅记', members: 56, msg: '本周富士山直播讨论群，欢迎加入' },
            { id: 'i3', group: '美食私域群', host: '山野食光', members: 210, msg: '订阅者专属菜谱交流' },
            { id: 'i4', group: '播客听友群', host: '夜雨听弦', members: 89, msg: '每周直播复盘' }
        ];
        var hosts = ['Nova Studio', '海风日记', '晨间咖啡', '云端书客', '东京夜跑团', '胶片少女', 'Mio_摄影', '阿Ken旅行'];
        var i;
        for (i = 0; i < hosts.length; i++) {
            list.push({
                id: 'i' + (5 + i),
                group: hosts[i] + ' 粉丝群',
                host: hosts[i],
                members: 40 + i * 17,
                msg: '邀请你加入粉丝交流群'
            });
        }
        return list;
    }

    var INVITES = buildList();
    var state = { q: '' };

    function toast(msg) {
        var t = document.getElementById('giToast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(function () { t.classList.remove('show'); }, 2400);
    }

    function filtered() {
        return INVITES.filter(function (inv) {
            if (!state.q) return true;
            var blob = (inv.group + inv.host + inv.msg).toLowerCase();
            return blob.indexOf(state.q) >= 0;
        });
    }

    function render() {
        var box = document.getElementById('giList');
        var badge = document.getElementById('giCount');
        var list = filtered();
        if (badge) badge.textContent = String(INVITES.length);
        if (!box) return;
        if (!list.length) {
            box.innerHTML = '<div style="text-align:center;padding:48px;color:var(--t-tertiary)">无匹配邀请</div>';
            return;
        }
        box.innerHTML = list.map(function (inv) {
            return '<div class="grp-invite-row" data-id="' + inv.id + '">' +
                '<div class="grp-av"><i class="fa-solid fa-users"></i></div>' +
                '<div class="body"><div style="font-weight:800;font-size:14px">' + inv.group + '</div>' +
                '<div style="font-size:12px;color:var(--t-tertiary);margin:4px 0">群主 ' + inv.host + ' · ' + inv.members + ' 人</div>' +
                '<div style="font-size:12.5px;color:var(--t-secondary)">' + inv.msg + '</div></div>' +
                '<div class="acts">' +
                '<button type="button" class="btn btn-sm" data-reject>拒绝</button>' +
                '<button type="button" class="btn btn-sm" style="background:var(--brand-grad);color:#fff;border:none" data-accept>同意加入</button>' +
                '</div></div>';
        }).join('');
    }

    function remove(id) {
        for (var i = 0; i < INVITES.length; i++) {
            if (INVITES[i].id === id) { INVITES.splice(i, 1); break; }
        }
        render();
    }

    function init() {
        render();
        document.getElementById('giSearch')?.addEventListener('input', function (e) {
            state.q = e.target.value.trim().toLowerCase();
            render();
        });
        document.getElementById('giRejectAll')?.addEventListener('click', function () {
            if (!INVITES.length || !confirm('忽略全部 ' + INVITES.length + ' 条进群邀请？')) return;
            INVITES.splice(0, INVITES.length);
            toast('已全部忽略');
            render();
        });
        document.getElementById('giAcceptAll')?.addEventListener('click', function () {
            if (!INVITES.length || !confirm('批量同意 ' + INVITES.length + ' 条？')) return;
            INVITES.splice(0, INVITES.length);
            toast('已批量加入（演示）');
            render();
        });
        document.getElementById('giList')?.addEventListener('click', function (e) {
            var row = e.target.closest('.grp-invite-row');
            if (!row) return;
            var id = row.getAttribute('data-id');
            if (e.target.closest('[data-accept]')) {
                remove(id);
                toast('已加入群聊');
            }
            if (e.target.closest('[data-reject]')) {
                remove(id);
                toast('已拒绝');
            }
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
