/**
 * 私信请求全量列表 · 陌生人私信（已取消好友申请）
 */
(function () {
    function buildList() {
        var list = [
            { id: 'fn2', type: 'stranger_dm', name: '旅行小白', av: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120', preview: '你好，看到你的富士山作品很喜欢！', time: '12 分钟前' },
            { id: 'fn3', type: 'stranger_dm', name: 'ad_robot_888', av: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=120', preview: '加微信领福利…', time: '2 小时前', flagged: true }
        ];
        var names = ['Studio_K', '粉丝A17', '路人乙', '摄影学徒', '订阅者Tom', 'NightOwl', 'DayLight', 'MintTea', 'UrbanCat', 'LakeView', 'Echo_99', 'PixelFan'];
        var avs = [
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
            'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=120',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120'
        ];
        var j;
        for (j = 0; j < names.length; j++) {
            list.push({
                id: 'fn' + (5 + j),
                type: 'stranger_dm',
                name: names[j],
                av: avs[j % avs.length],
                preview: '发来一条私信',
                time: (3 + j) + ' 小时前',
                flagged: j === 7
            });
        }
        return list;
    }

    var ALL = buildList();
    var state = { q: '' };

    function toast(msg) {
        var t = document.getElementById('fnToast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(function () { t.classList.remove('show'); }, 2400);
    }

    function filtered() {
        return ALL.filter(function (n) {
            if (state.q) {
                var blob = (n.name + n.preview).toLowerCase();
                if (blob.indexOf(state.q) < 0) return false;
            }
            return true;
        });
    }

    function render() {
        var box = document.getElementById('fnList');
        var badge = document.getElementById('fnCount');
        var list = filtered();
        if (badge) badge.textContent = String(ALL.length);
        if (!box) return;
        if (!list.length) {
            box.innerHTML = '<div style="text-align:center;padding:48px;color:var(--t-tertiary)">无匹配项</div>';
            return;
        }
        box.innerHTML = list.map(function (n) {
            return '<div class="grp-invite-row" data-id="' + n.id + '">' +
                '<div class="av" style="width:52px;height:52px;border-radius:50%;background-image:url(\'' + n.av + '\');background-size:cover;flex-shrink:0"></div>' +
                '<div class="body"><div style="font-weight:800;font-size:14px">' + n.name + (n.flagged ? ' <span style="color:#F87171">⚠</span>' : '') + '</div>' +
                '<div style="font-size:11px;color:var(--brand-purple);margin:4px 0">陌生人私信</div>' +
                '<div style="font-size:12.5px;color:var(--t-secondary)">' + n.preview + '</div>' +
                '<div style="font-size:11px;color:var(--t-tertiary);margin-top:4px">' + n.time + '</div></div>' +
                '<div class="acts"><button type="button" class="btn btn-sm" data-reject>拒绝</button>' +
                '<button type="button" class="btn btn-sm" style="background:var(--brand-grad);color:#fff;border:none" data-accept>接受</button></div></div>';
        }).join('');
    }

    function remove(id) {
        for (var i = 0; i < ALL.length; i++) {
            if (ALL[i].id === id) { ALL.splice(i, 1); break; }
        }
        render();
    }

    function init() {
        document.getElementById('fnSearch')?.addEventListener('input', function (e) {
            state.q = e.target.value.trim().toLowerCase();
            render();
        });
        document.getElementById('fnRejectAll')?.addEventListener('click', function () {
            if (!ALL.length || !confirm('忽略全部 ' + ALL.length + ' 条？')) return;
            ALL.splice(0, ALL.length);
            toast('已全部忽略');
            render();
        });
        document.getElementById('fnList')?.addEventListener('click', function (e) {
            var row = e.target.closest('.grp-invite-row');
            if (!row) return;
            var id = row.getAttribute('data-id');
            if (e.target.closest('[data-accept]')) { remove(id); toast('已接受，会话已移入列表'); }
            if (e.target.closest('[data-reject]')) { remove(id); toast('已拒绝'); }
        });
        render();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
