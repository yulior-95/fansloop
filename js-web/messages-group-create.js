/**
 * 创建粉丝群 · 选择粉丝邀请
 */
(function () {
    var LS_CONSENT = 'fl_group_invite_need_consent';

    var FANS = [
        { id: 'f1', name: 'Lens 旅记', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120', tag: '互关' },
        { id: 'f3', name: '夜雨听弦', av: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120', tag: '互关' },
        { id: 'f4', name: '代码诗人', av: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=120', tag: '互关' },
        { id: 'f6', name: 'Mila', av: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120', tag: '互关' }
    ];

    function needConsent() {
        try { return localStorage.getItem(LS_CONSENT) !== '0'; } catch (e) { return true; }
    }

    function toast(msg) {
        var t = document.getElementById('gcToast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(function () { t.classList.remove('show'); }, 2800);
    }

    function renderFans(filter) {
        var list = document.getElementById('gcFanList');
        if (!list) return;
        var q = (filter || '').toLowerCase();
        list.innerHTML = FANS.filter(function (f) {
            return !q || f.name.toLowerCase().indexOf(q) >= 0;
        }).map(function (f) {
            return '<label class="grp-fan-row">' +
                '<input type="checkbox" name="fan" value="' + f.id + '" />' +
                '<div class="av" style="background-image:url(\'' + f.av + '\')"></div>' +
                '<div style="flex:1"><div style="font-weight:700;font-size:13px">' + f.name + '</div>' +
                '<div style="font-size:11px;color:var(--t-tertiary)">' + f.tag + '</div></div></label>';
        }).join('');
    }

    function init() {
        var notice = document.getElementById('gcConsentNotice');
        if (notice) {
            if (needConsent()) {
                notice.innerHTML = '<i class="fa-solid fa-shield-halved"></i> 你已开启「进群需本人同意」。邀请将发送至对方的 <b>进群邀请</b> 列表，同意后才加入群聊。';
            } else {
                notice.innerHTML = '<i class="fa-solid fa-bolt"></i> 你已关闭进群确认，选中的互关好友将 <b>直接加入</b> 群聊并收到系统通知。';
            }
        }
        renderFans('');
        var search = document.getElementById('gcFanSearch');
        if (search) search.addEventListener('input', function () { renderFans(search.value.trim()); });

        document.getElementById('gcSubmit')?.addEventListener('click', function () {
            var name = (document.getElementById('gcName')?.value || '').trim();
            if (!name) { toast('请填写群名称'); return; }
            var checked = document.querySelectorAll('input[name="fan"]:checked');
            if (!checked.length) { toast('请至少选择一位粉丝'); return; }
            var btn = document.getElementById('gcSubmit');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 创建中…';
            setTimeout(function () {
                if (needConsent()) {
                    toast('群聊已创建，已向 ' + checked.length + ' 人发送进群邀请');
                    location.href = 'messages-group-invites.html?role=creator';
                } else {
                    toast('群聊已创建，' + checked.length + ' 人已加入');
                    location.href = 'messages-group.html';
                }
            }, 900);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
