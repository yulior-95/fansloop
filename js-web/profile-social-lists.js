/**
 * 个人主页 · 粉丝 / 关注 / 订阅者列表弹窗
 */
(function () {
    var sheet = document.getElementById('sheetSocialList');
    var listEl = document.getElementById('socialListBody');
    var searchEl = document.getElementById('socialListSearch');
    var titleEl = document.getElementById('socialListTitle');
    var menuEl = document.getElementById('socialMoreMenu');
    var toast = document.getElementById('pfToast');
    var currentType = null;
    var menuTargetId = null;

    if (!sheet || !listEl) return;

    var AV = [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120',
        'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=120'
    ];

    var store = {
        fans: [
            { id: 'f1', name: '阿Ken旅行', av: AV[3], followsMe: true, iFollow: false, isLive: true, profilePage: 'creator-profile.html', livePage: 'live-detail.html?host=aken' },
            { id: 'f2', name: 'Mio_摄影', av: AV[1], followsMe: true, iFollow: true, profilePage: 'creator-profile.html', livePage: 'live-detail.html' },
            { id: 'f3', name: '东京夜跑团', av: AV[4], followsMe: true, iFollow: false, isLive: true, profilePage: 'creator-profile.html', livePage: 'live-detail.html?host=nightrun' },
            { id: 'f4', name: '胶片少女', av: AV[2], followsMe: true, iFollow: true, profilePage: 'creator-profile.html', livePage: 'live-detail.html' },
            { id: 'f5', name: '山野食光', av: AV[6], followsMe: true, iFollow: false, profilePage: 'creator-profile.html', livePage: 'live-detail.html' },
            { id: 'f6', name: '代码诗人', av: AV[7], followsMe: true, iFollow: false, profilePage: 'creator-profile.html', livePage: 'live-detail.html' }
        ],
        following: [
            { id: 'g1', name: 'Lens 旅记', av: AV[2], iFollow: true, followsMe: true, unreadWorks: 5, remark: '', specialFollow: true, isLive: false, profilePage: 'creator-profile.html', livePage: 'live-detail.html' },
            { id: 'g2', name: '夜雨听弦', av: AV[3], iFollow: true, followsMe: true, unreadWorks: 0, remark: '播客搭子', specialFollow: false, isLive: true, profilePage: 'creator-profile.html', livePage: 'live-detail.html?host=yeyu' },
            { id: 'g3', name: '银盐时代', av: AV[5], iFollow: true, unreadWorks: 12, remark: '', specialFollow: false, isLive: false, profilePage: 'creator-profile.html', livePage: 'live-detail.html' },
            { id: 'g4', name: '声音之外', av: AV[0], iFollow: true, unreadWorks: 3, remark: '', specialFollow: true, isLive: false, profilePage: 'creator-profile.html', livePage: 'live-detail.html' },
            { id: 'g5', name: '极简料理', av: AV[6], iFollow: true, unreadWorks: 0, remark: '', specialFollow: false, profilePage: 'creator-profile.html', livePage: 'live-detail.html' }
        ],
        subscribers: [
            { id: 's1', name: '小鹿订阅', av: AV[0], subscribed: true, planPrice: 28, profilePage: 'creator-profile.html', livePage: 'live-detail.html' },
            { id: 's2', name: 'NovaFan', av: AV[4], subscribed: false, planPrice: 16, isLive: true, profilePage: 'creator-profile.html', livePage: 'live-detail.html?host=nova' },
            { id: 's3', name: '云端书客', av: AV[1], subscribed: true, planPrice: 42, profilePage: 'creator-profile.html', livePage: 'live-detail.html' },
            { id: 's4', name: '晨间咖啡', av: AV[6], subscribed: false, planPrice: 16, profilePage: 'creator-profile.html', livePage: 'live-detail.html' },
            { id: 's5', name: '海风日记', av: AV[5], subscribed: true, planPrice: 28, profilePage: 'creator-profile.html', livePage: 'live-detail.html' }
        ]
    };

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 2600);
    }

    function findItem(id) {
        var list = store[currentType] || [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) return list[i];
        }
        return null;
    }

    function isMutualFriend(item) {
        if (!item) return false;
        if (currentType === 'following') return !!item.followsMe;
        if (currentType === 'fans') return !!(item.iFollow && item.followsMe);
        return false;
    }

    function applyRemovedFromStore() {
        if (!window.FL_friendsStore) return;
        store.following = store.following.filter(function (item) {
            return !FL_friendsStore.isRemoved({ name: item.name, socialId: item.id });
        });
        store.fans.forEach(function (item) {
            if (FL_friendsStore.isRemoved({ name: item.name, socialId: item.id })) {
                item.iFollow = false;
            }
        });
    }

    function removeFriendFromProfile(item) {
        var msg = '删除后将解除与「' + item.name + '」的互相关注。对方仍可能关注你，你可在粉丝列表中管理。确定删除好友？';
        if (!window.confirm(msg)) return;
        var map = (window.FL_friendsStore && FL_friendsStore.lookup(item.name)) || {};
        if (window.FL_friendsStore) {
            FL_friendsStore.removeFriend({
                name: item.name,
                socialId: item.id,
                threadId: map.threadId,
                socialIds: map.socialIds
            });
        }
        if (currentType === 'following') {
            store.following = store.following.filter(function (x) { return x.id !== item.id; });
        }
        store.fans.forEach(function (f) {
            if (f.name === item.name) f.iFollow = false;
        });
        store.following.forEach(function (g) {
            if (g.name === item.name) g.iFollow = false;
        });
        closeMenu();
        showToast('已删除好友「' + item.name + '」');
        renderList();
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

    function escHtml(s) {
        var d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function displayNameHtml(item) {
        var base = escHtml(item.name);
        if (currentType === 'following' && item.remark) {
            return base + '<span class="pf-name-remark">' + escHtml(item.remark) + '</span>';
        }
        return base;
    }

    function renderAvatarHtml(item) {
        var inner;
        if (item.isLive) {
            inner =
                '<span class="pf-av-wrap is-live">' +
                '<span class="av" style="background-image:url(\'' + item.av + '\')"></span>' +
                '<span class="badge-live">直播中</span></span>';
        } else {
            inner = '<span class="av" style="background-image:url(\'' + item.av + '\')"></span>';
        }
        return (
            '<button type="button" class="pf-av-hit" data-action="open-profile" data-id="' + item.id + '" title="' +
            (item.isLive ? '进入直播间' : '查看主页') + '">' + inner + '</button>'
        );
    }

    function navigateToUser(item) {
        if (!item) return;
        var url = item.isLive && item.livePage ? item.livePage : (item.profilePage || 'creator-profile.html');
        showToast(item.isLive ? '进入「' + item.name + '」直播间' : '查看「' + item.name + '」主页');
        setTimeout(function () { location.href = url; }, 350);
    }

    function restoreSocialList() {
        sheet.classList.remove('is-under-subscribe');
        if (currentType) {
            sheet.classList.add('show');
            sheet.setAttribute('aria-hidden', 'false');
        }
        closeMenu();
        var ovl = document.getElementById('ovlSubscribe');
        if (ovl) ovl.classList.remove('show');
    }

    function renderList() {
        var q = (searchEl && searchEl.value || '').trim().toLowerCase();
        var items = (store[currentType] || []).filter(function (it) {
            if (!q) return true;
            if (it.name.toLowerCase().indexOf(q) >= 0) return true;
            if (it.remark && it.remark.toLowerCase().indexOf(q) >= 0) return true;
            return false;
        });

        if (!items.length) {
            listEl.innerHTML = '<div class="pf-social-empty"><i class="fa-regular fa-face-meh" style="font-size:28px;display:block;margin-bottom:10px;opacity:0.5"></i>未找到匹配用户</div>';
            return;
        }

        listEl.innerHTML = items.map(function (item) {
            var btn = '';
            if (currentType === 'fans') {
                var fb = fanBtnLabel(item);
                btn = '<button type="button" class="btn-act ' + fb.cls + '" data-action="fan-follow" data-id="' + item.id + '">' + fb.text + '</button>';
            } else if (currentType === 'following') {
                btn = '<button type="button" class="btn-act following" data-action="unfollow" data-id="' + item.id + '">已关注</button>';
            } else if (currentType === 'subscribers') {
                var sb = subBtnLabel(item);
                btn = '<button type="button" class="btn-act ' + sb.cls + '" data-action="subscribe" data-id="' + item.id + '">' + sb.text + '</button>';
            }

            var unread = '';
            if (currentType === 'following' && item.unreadWorks > 0) {
                unread = '<button type="button" class="pf-social-unread" data-action="open-unread" data-id="' + item.id + '">' +
                    '<i class="fa-solid fa-circle-play"></i> ' + item.unreadWorks + ' 个作品未看</button>';
            }
            if (currentType === 'following' && item.isLive && !item.unreadWorks) {
                unread = '<div class="sub is-live-txt"><i class="fa-solid fa-signal"></i> 正在直播</div>';
            }
            var sub = '';
            var liveSub = '';
            if (currentType === 'fans' && item.isLive) {
                liveSub = '<div class="sub is-live-txt"><i class="fa-solid fa-signal"></i> 正在直播</div>';
            } else if (currentType === 'subscribers' && item.subscribed) {
                sub = '当前订阅中';
            } else if (currentType === 'subscribers' && item.isLive) {
                liveSub = '<div class="sub is-live-txt"><i class="fa-solid fa-signal"></i> 正在直播</div>';
            }

            return (
                '<div class="pf-social-row" data-id="' + item.id + '">' +
                renderAvatarHtml(item) +
                '<div class="meta"><div class="nm">' + displayNameHtml(item) + '</div>' +
                (sub ? '<div class="sub">' + sub + '</div>' : '') + liveSub + unread + '</div>' +
                '<div class="pf-social-actions">' + btn +
                '<button type="button" class="pf-social-more" data-action="more" data-id="' + item.id + '" aria-label="更多"><i class="fa-solid fa-ellipsis"></i></button>' +
                '</div></div>'
            );
        }).join('');
    }

    function openList(type) {
        currentType = type;
        var titles = { fans: '粉丝', following: '关注', subscribers: '订阅者' };
        var icons = { fans: 'fa-user-group', following: 'fa-user-plus', subscribers: 'fa-crown' };
        if (titleEl) {
            titleEl.innerHTML = '<i class="fa-solid ' + icons[type] + '" style="color:#C084FC"></i> ' + (titles[type] || '');
        }
        if (searchEl) searchEl.value = '';
        renderList();
        sheet.classList.add('show');
        sheet.setAttribute('aria-hidden', 'false');
        closeMenu();
    }

    function closeList() {
        sheet.classList.remove('show');
        sheet.setAttribute('aria-hidden', 'true');
        closeMenu();
    }

    function closeMenu() {
        if (menuEl) {
            menuEl.classList.remove('show');
            menuEl.style.display = 'none';
        }
        menuTargetId = null;
    }

    function openMenu(anchor, item) {
        if (!menuEl) return;
        menuTargetId = item.id;
        var html = '';
        if (currentType === 'fans') {
            html =
                '<button type="button" data-menu="dm"><i class="fa-regular fa-envelope"></i> 私信</button>' +
                (isMutualFriend(item) ? '<button type="button" class="danger" data-menu="delete-friend"><i class="fa-solid fa-user-minus"></i> 删除好友</button>' : '') +
                '<button type="button" data-menu="report"><i class="fa-solid fa-flag"></i> 举报</button>' +
                '<button type="button" class="danger" data-menu="block"><i class="fa-solid fa-ban"></i> 拉黑</button>';
        } else if (currentType === 'following') {
            html =
                (isMutualFriend(item) ? '<button type="button" class="danger" data-menu="delete-friend"><i class="fa-solid fa-user-minus"></i> 删除好友</button>' : '') +
                '<button type="button" data-menu="unfollow"><i class="fa-solid fa-user-minus"></i> 取消关注</button>' +
                '<button type="button" data-menu="remark"><i class="fa-solid fa-pen"></i> 设置备注</button>' +
                '<button type="button" data-menu="special">' +
                '<i class="fa-solid fa-star"></i> 特别关注' +
                '<span class="toggle-dot' + (item.specialFollow ? ' on' : '') + '"></span></button>';
        } else if (currentType === 'subscribers') {
            html = '<button type="button" data-menu="dm"><i class="fa-regular fa-envelope"></i> 私信</button>';
        }
        menuEl.innerHTML = html;
        menuEl.style.display = 'block';
        menuEl.classList.add('show');
        var r = anchor.getBoundingClientRect();
        var mh = menuEl.offsetHeight || 120;
        menuEl.style.top = Math.min(r.bottom + 4, window.innerHeight - mh - 8) + 'px';
        menuEl.style.left = Math.max(8, r.right - 168) + 'px';
    }

    function openDm(name) {
        showToast('正在打开与「' + name + '」的私信（原型）');
        setTimeout(function () {
            location.href = 'messages.html?peer=' + encodeURIComponent(name);
        }, 600);
    }

    function showPushDemo(name) {
        var el = document.getElementById('pfPushDemo');
        if (!el) return;
        el.querySelector('.push-name').textContent = name;
        el.querySelector('.push-body').textContent = '发布了新作品 · 你开启了特别关注，已推送系统通知';
        el.classList.add('show');
        setTimeout(function () { el.classList.remove('show'); }, 4200);
    }

    document.querySelectorAll('.pst-clickable[data-social-list]').forEach(function (pst) {
        pst.addEventListener('click', function () {
            openList(pst.getAttribute('data-social-list'));
        });
        pst.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openList(pst.getAttribute('data-social-list'));
            }
        });
    });

    document.getElementById('btnCloseSocialList')?.addEventListener('click', closeList);
    sheet.addEventListener('click', function (e) {
        if (e.target === sheet) closeList();
    });
    searchEl?.addEventListener('input', renderList);

    listEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var id = btn.getAttribute('data-id');
        var item = findItem(id);
        if (!item) return;

        if (btn.getAttribute('data-action') === 'open-profile') {
            e.stopPropagation();
            navigateToUser(item);
            return;
        }

        if (btn.getAttribute('data-action') === 'fan-follow') {
            if (item.iFollow) {
                item.iFollow = false;
                showToast('已取消关注「' + item.name + '」');
            } else {
                item.iFollow = true;
                showToast(item.followsMe ? '已互相关注「' + item.name + '」' : '关注成功');
            }
            renderList();
            return;
        }

        if (btn.getAttribute('data-action') === 'unfollow') {
            item.iFollow = false;
            showToast('已取消关注「' + item.name + '」');
            renderList();
            return;
        }

        if (btn.getAttribute('data-action') === 'subscribe') {
            if (item.subscribed) {
                item.subscribed = false;
                showToast('已取消对「' + item.name + '」的订阅（原型）');
                renderList();
                return;
            }
            var fake = document.createElement('button');
            fake.setAttribute('data-creator', item.name);
            fake.setAttribute('data-plan', String(item.planPrice || 16));
            fake.setAttribute('data-av', item.av);
            fake.setAttribute('data-sub-mode', 'subscribe');
            if (window.FL_openSubscribeModal) {
                closeMenu();
                sheet.classList.add('is-under-subscribe');
                sheet.classList.add('show');
                sheet.setAttribute('aria-hidden', 'false');
                window._pfSubPendingId = id;
                window.FL_openSubscribeModal(fake);
            } else {
                showToast('打开订阅流程（原型）');
            }
            return;
        }

        if (btn.getAttribute('data-action') === 'open-unread') {
            e.stopPropagation();
            if (window.PfUnreadViewer) window.PfUnreadViewer.open(id);
            else showToast('未看作品浏览（原型）');
            return;
        }

        if (btn.getAttribute('data-action') === 'more') {
            e.stopPropagation();
            openMenu(btn, item);
        }
    });

    menuEl?.addEventListener('click', function (e) {
        var mb = e.target.closest('[data-menu]');
        if (!mb) return;
        var item = findItem(menuTargetId);
        if (!item) return;
        var action = mb.getAttribute('data-menu');

        if (action === 'dm') {
            closeMenu();
            openDm(item.name);
            return;
        }
        if (action === 'report') {
            closeMenu();
            openSubSheet('sheetReportUser', item.name);
            return;
        }
        if (action === 'block') {
            closeMenu();
            openSubSheet('sheetBlockUser', item.name);
            return;
        }
        if (action === 'delete-friend') {
            removeFriendFromProfile(item);
            return;
        }
        if (action === 'unfollow') {
            item.iFollow = false;
            closeMenu();
            showToast('已取消关注「' + item.name + '」');
            renderList();
            return;
        }
        if (action === 'remark') {
            closeMenu();
            openRemarkSheet(item);
            return;
        }
        if (action === 'special') {
            item.specialFollow = !item.specialFollow;
            closeMenu();
            if (item.specialFollow) {
                showToast('已开启特别关注 · 新作品将推送通知');
                showPushDemo(item.name);
            } else {
                showToast('已关闭特别关注');
            }
            renderList();
        }
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.pf-social-more') && !e.target.closest('#socialMoreMenu')) {
            closeMenu();
        }
    });

    var remarkTargetId = null;

    function openSubSheet(id, name) {
        var el = document.getElementById(id);
        var nameEl = document.getElementById(id === 'sheetReportUser' ? 'reportUserName' : 'blockUserName');
        if (nameEl) nameEl.textContent = name;
        if (el) {
            el.classList.add('show');
            el.setAttribute('aria-hidden', 'false');
        }
    }

    function openRemarkSheet(item) {
        remarkTargetId = item.id;
        document.getElementById('remarkUserName').textContent = item.name;
        var input = document.getElementById('remarkUserInput');
        if (input) {
            input.value = item.remark || '';
            setTimeout(function () { input.focus(); }, 80);
        }
        var el = document.getElementById('sheetRemarkUser');
        if (el) {
            el.classList.add('show');
            el.setAttribute('aria-hidden', 'false');
        }
    }

    function closeRemarkSheet() {
        remarkTargetId = null;
        closeSubSheet('sheetRemarkUser');
    }

    function closeSubSheet(id) {
        var el = document.getElementById(id);
        if (el) {
            el.classList.remove('show');
            el.setAttribute('aria-hidden', 'true');
        }
    }

    document.getElementById('btnReportSubmit')?.addEventListener('click', function () {
        var name = document.getElementById('reportUserName')?.textContent || '';
        showToast('已提交对「' + name + '」的举报，我们将尽快处理（原型）');
        closeSubSheet('sheetReportUser');
    });
    document.getElementById('btnBlockConfirm')?.addEventListener('click', function () {
        var name = document.getElementById('blockUserName')?.textContent || '';
        showToast('已将「' + name + '」加入黑名单（原型）');
        closeSubSheet('sheetBlockUser');
    });
    document.querySelectorAll('[data-close-social-sub]').forEach(function (b) {
        b.addEventListener('click', function () {
            var id = b.getAttribute('data-close-social-sub');
            if (id === 'sheetRemarkUser') closeRemarkSheet();
            else closeSubSheet(id);
        });
    });
    document.getElementById('btnRemarkSave')?.addEventListener('click', function () {
        var item = findItem(remarkTargetId);
        if (!item) return;
        var val = (document.getElementById('remarkUserInput')?.value || '').trim();
        item.remark = val;
        closeRemarkSheet();
        renderList();
        showToast(val ? '备注已保存，列表将显示为「' + item.name + ' · ' + val + '」' : '备注已清除');
    });
    ['sheetReportUser', 'sheetBlockUser', 'sheetRemarkUser'].forEach(function (id) {
        document.getElementById(id)?.addEventListener('click', function (e) {
            if (e.target.id === id) {
                if (id === 'sheetRemarkUser') closeRemarkSheet();
                else closeSubSheet(id);
            }
        });
    });

    function markSubscriberPaid() {
        if (window._pfSubPendingId && currentType === 'subscribers') {
            var it = findItem(window._pfSubPendingId);
            if (it) {
                it.subscribed = true;
                renderList();
            }
        }
    }

    function finishSubscribeOverlay() {
        restoreSocialList();
        window._pfSubPendingId = null;
    }

    window.addEventListener('fl-subscribe-paid', markSubscriberPaid);
    document.getElementById('btnDoneSubscribe')?.addEventListener('click', function () {
        markSubscriberPaid();
        finishSubscribeOverlay();
    });
    window.addEventListener('fl-subscribe-closed', finishSubscribeOverlay);

    if (window.FL_closeSubscribeModal && !window.FL_closeSubscribeModal._pfWrapped) {
        var origClose = window.FL_closeSubscribeModal;
        window.FL_closeSubscribeModal = function () {
            origClose();
            finishSubscribeOverlay();
        };
        window.FL_closeSubscribeModal._pfWrapped = true;
    }

    applyRemovedFromStore();
    window.addEventListener('fl-friend-removed', function () {
        applyRemovedFromStore();
        if (currentType) renderList();
    });

    var params = new URLSearchParams(window.location.search);
    var social = params.get('social');
    if (social && store[social]) {
        setTimeout(function () { openList(social); }, 400);
    }

    window.PfSocialLists = {
        openList: openList,
        closeList: closeList,
        getStore: function () { return store; },
        toast: showToast
    };
})();
