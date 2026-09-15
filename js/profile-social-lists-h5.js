/**
 * H5 个人主页 · 粉丝 / 关注 / 订阅者列表（对齐 Web profile-social-lists.js）
 */
(function () {
    var params = new URLSearchParams(location.search);
    var currentType = params.get('type') || 'fans';
    if (['fans', 'following', 'subscribers'].indexOf(currentType) < 0) currentType = 'fans';

    var listEl = document.getElementById('pslList');
    var searchEl = document.getElementById('pslSearch');
    var titleEl = document.getElementById('pslTitle');
    var menuEl = document.getElementById('pslMenu');

    var AV = [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120'
    ];

    var store = {
        fans: [
            { id: 'f1', name: '阿Ken旅行', av: AV[3], followsMe: true, iFollow: false, isLive: true },
            { id: 'f2', name: 'Mio_摄影', av: AV[1], followsMe: true, iFollow: true },
            { id: 'f3', name: '东京夜跑团', av: AV[4], followsMe: true, iFollow: false, isLive: true },
            { id: 'f4', name: '胶片少女', av: AV[2], followsMe: true, iFollow: true },
            { id: 'f5', name: '山野食光', av: AV[6], followsMe: true, iFollow: false },
            { id: 'f6', name: '代码诗人', av: AV[0], followsMe: true, iFollow: false }
        ],
        following: [
            { id: 'g1', name: 'Lens 旅记', av: AV[2], iFollow: true, followsMe: true, remark: '' },
            { id: 'g2', name: '夜雨听弦', av: AV[3], iFollow: true, followsMe: true, remark: '播客搭子', isLive: true },
            { id: 'g3', name: '银盐时代', av: AV[5], iFollow: true, unreadWorks: 0 },
            { id: 'g4', name: '声音之外', av: AV[0], iFollow: true, followsMe: false },
            { id: 'g5', name: '极简料理', av: AV[6], iFollow: true }
        ],
        subscribers: [
            { id: 's1', name: '小鹿订阅', av: AV[0], subscribed: true, planPrice: 28 },
            { id: 's2', name: 'NovaFan', av: AV[4], subscribed: false, planPrice: 16, isLive: true },
            { id: 's3', name: '云端书客', av: AV[1], subscribed: true, planPrice: 42 },
            { id: 's4', name: '晨间咖啡', av: AV[6], subscribed: false, planPrice: 16 },
            { id: 's5', name: '海风日记', av: AV[5], subscribed: true, planPrice: 28 }
        ]
    };

    var titles = { fans: '粉丝', following: '关注', subscribers: '订阅者' };

    function toast(msg) {
        if (window.DigitalH5Nav && typeof window.DigitalH5Nav.toast === 'function') window.DigitalH5Nav.toast(msg);
    }

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function findItem(id) {
        var list = store[currentType] || [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) return list[i];
        }
        return null;
    }

    function fanBtnLabel(item) {
        if (item.iFollow && item.followsMe) return { text: '互相关注', cls: 'mutual' };
        if (item.iFollow) return { text: '已关注', cls: 'following' };
        return { text: '回关', cls: 'primary' };
    }

    function subBtnLabel(item) {
        return item.subscribed
            ? { text: '互相订阅', cls: 'mutual' }
            : { text: '订阅', cls: 'primary' };
    }

    function closeMenu() {
        if (!menuEl) return;
        menuEl.classList.remove('show');
        menuEl.style.display = 'none';
        menuEl._targetId = null;
    }

    function renderList() {
        if (!listEl) return;
        var q = (searchEl && searchEl.value || '').trim().toLowerCase();
        var items = (store[currentType] || []).filter(function (it) {
            if (!q) return true;
            if (it.name.toLowerCase().indexOf(q) >= 0) return true;
            if (it.remark && it.remark.toLowerCase().indexOf(q) >= 0) return true;
            return false;
        });
        if (!items.length) {
            listEl.innerHTML = '<div class="psl-empty">未找到匹配用户</div>';
            return;
        }
        listEl.innerHTML = items.map(function (item) {
            var btn = '';
            if (currentType === 'fans') {
                var fb = fanBtnLabel(item);
                btn = '<button type="button" class="psl-act ' + fb.cls + '" data-action="fan-follow" data-id="' + item.id + '">' + fb.text + '</button>';
            } else if (currentType === 'following') {
                btn = '<button type="button" class="psl-act following" data-action="unfollow" data-id="' + item.id + '">已关注</button>';
            } else {
                var sb = subBtnLabel(item);
                btn = '<button type="button" class="psl-act ' + sb.cls + '" data-action="subscribe" data-id="' + item.id + '">' + sb.text + '</button>';
            }
            var sub = '';
            if (currentType === 'subscribers' && item.subscribed) sub = '<div class="psl-sub">当前订阅中</div>';
            if (item.isLive) sub = '<div class="psl-sub live"><i class="fa-solid fa-signal"></i> 正在直播</div>';
            var remark = (currentType === 'following' && item.remark)
                ? '<span class="psl-remark">' + esc(item.remark) + '</span>' : '';
            return (
                '<div class="psl-row" data-id="' + item.id + '">' +
                '<button type="button" class="psl-av" data-action="open-profile" data-id="' + item.id + '">' +
                '<img src="' + esc(item.av) + '" alt="">' +
                (item.isLive ? '<span class="live-dot">直播</span>' : '') +
                '</button>' +
                '<div class="psl-meta"><div class="nm">' + esc(item.name) + remark + '</div>' + sub + '</div>' +
                '<div class="psl-actions">' + btn +
                '<button type="button" class="psl-more" data-action="more" data-id="' + item.id + '"><i class="fa-solid fa-ellipsis"></i></button>' +
                '</div></div>'
            );
        }).join('');
    }

    function openMenu(anchor, item) {
        if (!menuEl) return;
        menuEl._targetId = item.id;
        var html = '';
        if (currentType === 'fans') {
            html = '<button type="button" data-menu="dm"><i class="fa-regular fa-envelope"></i> 私信</button>' +
                '<button type="button" data-menu="report"><i class="fa-solid fa-flag"></i> 举报</button>';
        } else if (currentType === 'following') {
            html = '<button type="button" data-menu="unfollow"><i class="fa-solid fa-user-minus"></i> 取消关注</button>' +
                '<button type="button" data-menu="dm"><i class="fa-regular fa-envelope"></i> 私信</button>';
        } else {
            html = '<button type="button" data-menu="dm"><i class="fa-regular fa-envelope"></i> 私信</button>';
        }
        menuEl.innerHTML = html;
        menuEl.style.display = 'block';
        menuEl.classList.add('show');
        var r = anchor.getBoundingClientRect();
        menuEl.style.top = Math.min(r.bottom + 4, window.innerHeight - 120) + 'px';
        menuEl.style.left = Math.max(8, r.right - 140) + 'px';
    }

    if (titleEl) titleEl.textContent = titles[currentType] || '列表';
    renderList();

    if (searchEl) searchEl.addEventListener('input', renderList);

    if (listEl) {
        listEl.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-action]');
            if (!btn) return;
            var id = btn.getAttribute('data-id');
            var item = findItem(id);
            if (!item) return;

            if (btn.getAttribute('data-action') === 'open-profile') {
                location.href = item.isLive ? 'home.html' : 'creator-profile.html';
                return;
            }
            if (btn.getAttribute('data-action') === 'fan-follow') {
                if (item.iFollow) {
                    item.iFollow = false;
                    toast('已取消关注「' + item.name + '」');
                } else {
                    item.iFollow = true;
                    toast(item.followsMe ? '已互相关注「' + item.name + '」' : '关注成功');
                }
                renderList();
                return;
            }
            if (btn.getAttribute('data-action') === 'unfollow') {
                store.following = store.following.filter(function (x) { return x.id !== item.id; });
                toast('已取消关注「' + item.name + '」');
                renderList();
                return;
            }
            if (btn.getAttribute('data-action') === 'subscribe') {
                item.subscribed = !item.subscribed;
                toast(item.subscribed ? '已与「' + item.name + '」互相订阅' : '已取消订阅');
                renderList();
                return;
            }
            if (btn.getAttribute('data-action') === 'more') {
                e.stopPropagation();
                openMenu(btn, item);
            }
        });
    }

    if (menuEl) {
        menuEl.addEventListener('click', function (e) {
            var mb = e.target.closest('[data-menu]');
            if (!mb) return;
            var item = findItem(menuEl._targetId);
            if (!item) return;
            var action = mb.getAttribute('data-menu');
            closeMenu();
            if (action === 'dm') {
                location.href = 'messages.html?peer=' + encodeURIComponent(item.name);
                return;
            }
            if (action === 'unfollow') {
                store.following = store.following.filter(function (x) { return x.id !== item.id; });
                toast('已取消关注「' + item.name + '」');
                renderList();
                return;
            }
            if (action === 'report') toast('举报已提交（原型）');
        });
    }

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.psl-more') && !e.target.closest('#pslMenu')) closeMenu();
    });
})();
