/**
 * Web 私信 IM · 会话列表 / 发消息 / 礼物 / 作品卡片 / 语音 / 搜索 / 更多菜单
 * 不修改其他模块；仅增强 messages.html
 */
(function () {
    var LS_KEY = 'fl_messages_mock_v1';

    var THREADS = [
        {
            id: 'lens',
            name: 'Lens 旅记',
            handle: '@lensjourney',
            av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120',
            category: 'fan',
            tags: ['粉丝'],
            online: true,
            typing: true,
            unread: 1,
            pinned: false,
            time: '2 分钟前',
            preview: '正在输入…',
            previewTyping: true,
            verified: true,
            isFriend: true,
            stats: { fans: '64k', works: '312', active: '88%' },
            relation: ['已互相关注 12 天', '已订阅创作者 · $9.9/月', '总打赏 $48.00'],
            messages: [
                { type: 'day', text: '今天' },
                { from: 'them', type: 'text', text: '嗨 Luna！我看到你最近富士山的那组片子真是太赞了！能跟我分享一下你用什么镜头拍的吗？', time: '14:02' },
                { from: 'me', type: 'text', text: '谢谢你喜欢～主要是 35mm f/1.4 定焦，配 Sony A7R 第四代 📷', time: '14:05', read: true },
                { from: 'me', type: 'image', src: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600', time: '14:05' },
                { from: 'them', type: 'text', text: '这张光线绝了 🤩 想问下你下次还有摄影工作坊吗？', time: '14:08' },
                { from: 'them', type: 'gift', text: '送出礼物 · 樱花信使 × 1 · ≈ $5.00', time: '14:10' },
                { from: 'me', type: 'text', text: '哇 谢谢支持！下个月会有，到时候第一时间邀请你 ✨', time: '14:12', read: true },
                { from: 'them', type: 'share', title: '富士山晨雾 · 35mm 实拍', cover: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400', meta: 'Lens 旅记 · 2.4k 赞', time: '14:14' },
                { from: 'them', type: 'typing' }
            ]
        },
        {
            id: 'food',
            name: '山野食光',
            av: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120',
            category: 'subscriber',
            tags: ['VIP 订阅者'],
            tagClass: 'tag-vip',
            unread: 2,
            time: '14:22',
            preview: '谢谢你订阅我的频道！这是一份…',
            verified: true,
            messages: [
                { type: 'day', text: '今天' },
                { from: 'them', type: 'text', text: '谢谢你订阅我的频道！这是一份订阅者专属菜谱 PDF～', time: '14:20' }
            ]
        },
        {
            id: 'yeyu',
            name: '夜雨听弦',
            av: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
            category: 'fan',
            isFriend: true,
            online: true,
            unread: 1,
            time: '14:08',
            previewYou: true,
            preview: '那首小夜曲真的太美了 🎻',
            messages: [
                { from: 'me', type: 'text', text: '那首小夜曲真的太美了 🎻', time: '14:08', read: true }
            ]
        },
        {
            id: 'code',
            name: '代码诗人',
            av: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=120',
            category: 'fan',
            tags: ['粉丝'],
            time: '昨天',
            preview: '[图片]',
            messages: [
                { from: 'them', type: 'image', src: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=500', time: '昨天' }
            ]
        },
        {
            id: 'silver',
            name: '银盐时代',
            av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120',
            category: 'fan',
            time: '昨天',
            preview: '想和你聊一下合作那个组合包…',
            messages: []
        },
        {
            id: 'official',
            name: 'FansLoop 官方',
            av: '',
            official: true,
            kind: 'dm',
            category: 'system',
            time: '2 天前',
            preview: '本月创作者激励计划已发放…',
            messages: [
                { from: 'them', type: 'text', text: '本月创作者激励计划已发放至钱包，请查收。', time: '2 天前' }
            ]
        },
        {
            id: 'grp-vip',
            kind: 'group',
            name: 'VIP 订阅者群',
            av: '',
            category: 'group',
            myRole: 'owner',
            time: '刚刚',
            preview: 'Luna：本周直播周五 20:00',
            unread: 0,
            memberCount: 128,
            mentionMembers: [
                { id: 'gm1', name: 'Luna 🌙', remark: '', av: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120' },
                { id: 'gm2', name: 'Lens 旅记', remark: '小旅', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120' },
                { id: 'gm3', name: '山野食光', remark: '', av: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120' },
                { id: 'gm4', name: '夜雨听弦', remark: '', av: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120' },
                { id: 'gm5', name: '代码诗人', remark: '', av: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=120' }
            ],
            messages: [
                { type: 'day', text: '今天' },
                { from: 'system', type: 'announce', text: '【群公告】本周五 20:00 订阅者专属直播，请提前打开提醒；群内禁止广告与外链。', time: '10:00' },
                { from: 'them', type: 'text', text: 'Luna 🌙：本周专属直播周五 20:00，记得开提醒', time: '刚刚', sender: 'Luna 🌙' }
            ]
        },
        {
            id: 'grp-live',
            kind: 'group',
            name: '直播粉丝交流群',
            av: '',
            category: 'group',
            myRole: 'admin',
            time: '昨天',
            preview: 'Lens：今晚 21:00 开播',
            memberCount: 892,
            messages: [
                { from: 'them', type: 'text', text: 'Lens 旅记：今晚 21:00 富士山夜景直播', time: '昨天', sender: 'Lens 旅记' }
            ]
        }
    ];

    THREADS.forEach(function (t) {
        if (!t.kind) t.kind = t.official || t.category === 'system' ? 'dm' : 'dm';
    });

    function buildGroupNotifs() {
        var list = [
            { id: 'gn1', type: 'group_invite', host: 'Luna 🌙', groupName: 'Luna VIP 摄影群', preview: '邀请你加入订阅者专属群', time: '10 分钟前', members: 128 },
            { id: 'gn2', type: 'group_invite', host: 'Lens 旅记', groupName: '直播粉丝交流群', preview: '邀请你讨论本周直播', time: '1 小时前', members: 56 },
            { id: 'gn3', type: 'group_invite', host: '山野食光', groupName: '美食私域群', preview: '订阅者专属菜谱交流群', time: '2 小时前', members: 210 },
            { id: 'gn4', type: 'group_invite', host: '夜雨听弦', groupName: '播客听友群', preview: '每周直播复盘讨论', time: '3 小时前', members: 89 }
        ];
        var hosts = ['Nova Studio', '海风日记', '晨间咖啡', '云端书客', '东京夜跑团', '胶片少女', 'Mio_摄影', '阿Ken旅行'];
        var i;
        for (i = 0; i < hosts.length; i++) {
            list.push({
                id: 'gn' + (5 + i),
                type: 'group_invite',
                host: hosts[i],
                groupName: hosts[i] + ' 粉丝群',
                preview: '邀请你加入粉丝交流群',
                time: (4 + i) + ' 小时前',
                members: 40 + i * 17
            });
        }
        return list;
    }

    function buildFriendNotifs() {
        var list = [
            { id: 'fn1', type: 'friend_req', name: '旅行小白', av: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120', preview: '请求添加你为好友', time: '12 分钟前' },
            { id: 'fn2', type: 'stranger_dm', name: '胶片爱好者', av: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120', preview: '你好，想咨询摄影工作坊怎么报名？', time: '1 小时前' },
            { id: 'fn3', type: 'stranger_dm', name: 'ad_robot_888', av: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=120', preview: '加微信领福利…', time: '2 小时前', flagged: true },
            { id: 'fn4', type: 'friend_req', name: '小鹿订阅', av: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120', preview: '请求添加你为好友', time: '25 分钟前' }
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
                type: j % 3 === 0 ? 'friend_req' : 'stranger_dm',
                name: names[j],
                av: avs[j % avs.length],
                preview: j % 3 === 0 ? '请求添加你为好友' : '发来一条私信请求',
                time: (3 + j) + ' 小时前',
                flagged: j === 7
            });
        }
        return list;
    }

    var GROUP_NOTIFS = buildGroupNotifs();
    var FRIEND_NOTIFS = buildFriendNotifs();

    var COMPOSE_USERS = [
        { name: 'Lens 旅记', sub: '互相关注 · 粉丝', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120', threadId: 'lens' },
        { name: '山野食光', sub: 'VIP 订阅者', av: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120', threadId: 'food' },
        { name: '夜雨听弦', sub: '互相关注', av: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120', threadId: 'yeyu' },
        { name: '银盐时代', sub: '已关注', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120', threadId: 'silver' }
    ];

    var CONTACT_GROUPS = [
        { id: 'grp-vip', name: 'VIP 订阅者群', members: 128, sortKey: 'V' },
        { id: 'grp-live', name: '直播粉丝交流群', members: 892, sortKey: 'Z' },
        { id: 'grp-welcome', name: '新粉欢迎群', members: 2041, sortKey: 'X' }
    ];

    var CONTACT_FRIENDS = [
        { id: 'lens', name: 'Lens 旅记', sub: '互相关注 · 粉丝', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120', sortKey: 'L' },
        { id: 'food', name: '山野食光', sub: 'VIP 订阅者', av: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120', sortKey: 'S' },
        { id: 'yeyu', name: '夜雨听弦', sub: '互相关注', av: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120', sortKey: 'Y' },
        { id: 'code', name: '代码诗人', sub: '粉丝', av: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=120', sortKey: 'D' },
        { id: 'silver', name: '银盐时代', sub: '粉丝', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120', sortKey: 'Y' }
    ];

    var GC_FANS = [
        { id: 'f1', name: 'Lens 旅记', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120', tag: 'VIP 订阅者' },
        { id: 'f2', name: '山野食光', av: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120', tag: '订阅者' },
        { id: 'f3', name: '夜雨听弦', av: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120', tag: '互关' },
        { id: 'f4', name: '代码诗人', av: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=120', tag: '粉丝' }
    ];

    var state = {
        tab: 'all',
        activeId: 'lens',
        activeType: 'thread',
        notifInbox: null,
        inboxSearch: '',
        deletedIds: [],
        contactsTab: 'group',
        composeSearch: '',
        contactsSearch: '',
        ctxThreadId: null,
        quote: null,
        searchOpen: false,
        recording: false,
        infoOpen: false,
        confirmCb: null
    };

    var el = {};

    function $(id) { return document.getElementById(id); }

    function toast(msg) {
        var host = el.toastHost;
        if (!host) return;
        var t = host.querySelector('.im-toast') || document.createElement('div');
        t.className = 'im-toast';
        t.textContent = msg;
        if (!t.parentNode) host.appendChild(t);
        requestAnimationFrame(function () { t.classList.add('show'); });
        clearTimeout(t._tm);
        t._tm = setTimeout(function () { t.classList.remove('show'); }, 2600);
    }

    function loadStore() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (!raw) return;
            var data = JSON.parse(raw);
            if (data.pinned) {
                THREADS.forEach(function (t) {
                    t.pinned = data.pinned.indexOf(t.id) >= 0;
                });
            }
            if (data.extraMessages) {
                Object.keys(data.extraMessages).forEach(function (id) {
                    var th = findThread(id);
                    if (th) th.messages = th.messages.concat(data.extraMessages[id]);
                });
            }
            if (data.deleted && data.deleted.length) state.deletedIds = data.deleted.slice();
            if (data.threadMeta) {
                THREADS.forEach(function (t) {
                    var m = data.threadMeta[t.id];
                    if (!m) return;
                    if (m.remark != null) t.remark = m.remark;
                    if (m.convMuted != null) t.convMuted = m.convMuted;
                    if (m.hiddenChat != null) t.hiddenChat = m.hiddenChat;
                    if (m.isFriend != null) t.isFriend = m.isFriend;
                });
            }
            applyRemovedFriendsFromStore();
        } catch (e) { /* ignore */ }
    }

    function applyRemovedFriendsFromStore() {
        if (!window.FL_friendsStore) return;
        THREADS.forEach(function (t) {
            if (t.kind === 'group' || t.official) return;
            if (FL_friendsStore.isRemoved({ threadId: t.id, name: t.name })) {
                t.isFriend = false;
            }
        });
    }

    function isFriendThread(t) {
        if (!t || t.kind === 'group' || t.official) return false;
        if (t.isFriend === false) return false;
        if (t.isFriend === true) return true;
        if (window.FL_friendsStore && FL_friendsStore.isRemoved({ threadId: t.id, name: t.name })) return false;
        var cf = CONTACT_FRIENDS.filter(function (f) { return f.id === t.id; })[0];
        return !!(cf && cf.sub && cf.sub.indexOf('互相关注') >= 0);
    }

    function syncContactsAfterUnfriend(t) {
        var i;
        for (i = COMPOSE_USERS.length - 1; i >= 0; i--) {
            if (COMPOSE_USERS[i].threadId === t.id) {
                COMPOSE_USERS[i].sub = '已解除好友 · 可重新关注';
            }
        }
        for (i = CONTACT_FRIENDS.length - 1; i >= 0; i--) {
            if (CONTACT_FRIENDS[i].id === t.id) {
                CONTACT_FRIENDS.splice(i, 1);
            }
        }
    }

    function updateRelationAfterUnfriend(t) {
        if (!t.relation || !t.relation.length) return;
        t.relation[0] = '已解除好友关系';
    }

    function deleteFriend(id) {
        var t = findThread(id);
        if (!t || !isFriendThread(t)) return;
        openConfirm({
            title: '删除好友',
            body: '删除后将解除互相关注。聊天记录与会话仍保留，你可在「更多」中单独删除会话。确定删除好友？',
            okText: '删除好友',
            onConfirm: function () {
                if (window.FL_friendsStore) {
                    var map = FL_friendsStore.lookup(t.name) || {};
                    FL_friendsStore.removeFriend({
                        threadId: t.id,
                        name: t.name,
                        socialIds: map.socialIds
                    });
                }
                t.isFriend = false;
                saveThreadMeta(t.id, { isFriend: false });
                updateRelationAfterUnfriend(t);
                syncContactsAfterUnfriend(t);
                renderThreadList();
                renderHeader();
                if (state.infoOpen) renderInfoPanel(t);
                toast('已删除好友「' + t.name + '」，双方不再互相关注');
            }
        });
    }

    function updateMoreMenuForThread(t) {
        var btn = $('imDropdownUnfriend');
        if (btn) btn.hidden = !isFriendThread(t);
    }

    function saveThreadMeta(id, patch) {
        try {
            var raw = localStorage.getItem(LS_KEY);
            var data = raw ? JSON.parse(raw) : {};
            if (!data.threadMeta) data.threadMeta = {};
            if (!data.threadMeta[id]) data.threadMeta[id] = {};
            Object.keys(patch).forEach(function (k) { data.threadMeta[id][k] = patch[k]; });
            localStorage.setItem(LS_KEY, JSON.stringify(data));
        } catch (e) { /* ignore */ }
    }

    function displayThreadName(t) {
        if (!t) return '';
        if (t.remark && String(t.remark).trim()) return String(t.remark).trim();
        return t.name;
    }

    function getGroupMentionMembers(t) {
        if (!t || t.kind !== 'group') return [];
        if (t.mentionMembers && t.mentionMembers.length) return t.mentionMembers;
        if (t.members && t.members.length) {
            return t.members.map(function (m) {
                return { id: m.id, name: m.name, remark: m.remark || '', av: m.av };
            });
        }
        return [];
    }

    function formatTextWithMentions(text, thread) {
        if (!text || thread.kind !== 'group') return esc(text);
        var members = getGroupMentionMembers(thread);
        var safe = esc(text);
        members.forEach(function (m) {
            var label = m.remark ? displayThreadName({ name: m.name, remark: m.remark }) : m.name;
            var re = new RegExp('@' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            safe = safe.replace(re, '<span class="msg-mention">@' + esc(label) + '</span>');
            var re2 = new RegExp('@' + m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            safe = safe.replace(re2, '<span class="msg-mention">@' + esc(m.remark ? displayThreadName(m) : m.name) + '</span>');
        });
        return safe;
    }

    function parseMentionsInText(text, thread) {
        var found = [];
        if (!text || thread.kind !== 'group') return found;
        getGroupMentionMembers(thread).forEach(function (m) {
            var labels = [m.name];
            if (m.remark) labels.push(displayThreadName({ name: m.name, remark: m.remark }));
            labels.forEach(function (label) {
                if (text.indexOf('@' + label) >= 0) found.push(m);
            });
        });
        return found;
    }

    function saveDeleted() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            var data = raw ? JSON.parse(raw) : {};
            data.deleted = state.deletedIds.slice();
            localStorage.setItem(LS_KEY, JSON.stringify(data));
        } catch (e) { /* ignore */ }
    }

    function isThreadDeleted(id) {
        return state.deletedIds.indexOf(id) >= 0;
    }

    function restoreThread(id) {
        var i = state.deletedIds.indexOf(id);
        if (i >= 0) {
            state.deletedIds.splice(i, 1);
            saveDeleted();
        }
    }

    function saveExtra(threadId, msg) {
        try {
            var raw = localStorage.getItem(LS_KEY);
            var data = raw ? JSON.parse(raw) : { pinned: [], extraMessages: {} };
            if (!data.extraMessages) data.extraMessages = {};
            if (!data.extraMessages[threadId]) data.extraMessages[threadId] = [];
            data.extraMessages[threadId].push(msg);
            localStorage.setItem(LS_KEY, JSON.stringify(data));
        } catch (e) { /* ignore */ }
    }

    function findThread(id) {
        for (var i = 0; i < THREADS.length; i++) {
            if (THREADS[i].id === id) return THREADS[i];
        }
        return null;
    }

    function findThreadByName(name) {
        var n = decodeURIComponent(name || '').trim();
        for (var i = 0; i < THREADS.length; i++) {
            if (THREADS[i].name === n) return THREADS[i];
        }
        return null;
    }

    function totalUnread() {
        var n = 0;
        THREADS.forEach(function (t) { n += t.unread || 0; });
        n += GROUP_NOTIFS.length + FRIEND_NOTIFS.length;
        return n;
    }

    function filterThreads() {
        return THREADS.filter(function (t) {
            if (isThreadDeleted(t.id)) return false;
            if (state.tab === 'dm') return t.kind !== 'group';
            if (state.tab === 'group') return t.kind === 'group';
            return true;
        }).sort(function (a, b) {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return 0;
        });
    }

    function showMainUi(mode) {
        var isChat = mode === 'chat';
        var isInbox = mode === 'inbox';
        if (el.msgList) el.msgList.style.display = isChat ? '' : 'none';
        if (el.notifInbox) el.notifInbox.hidden = !isInbox;
        var input = document.querySelector('#imThreadCol .imt-input');
        var extras = ['imSearchPanel', 'imQuoteBar', 'imVoiceRec', 'imEmojiPanel'];
        if (input) input.style.display = isChat ? '' : 'none';
        extras.forEach(function (id) {
            var node = document.getElementById(id);
            if (!node) return;
            node.style.display = isChat ? '' : 'none';
        });
        if (el.headProfile) el.headProfile.style.display = isChat ? '' : 'none';
        if (el.imtHead) el.imtHead.style.display = isInbox ? 'none' : '';
        if (el.threadCol) el.threadCol.classList.toggle('im-thread--inbox', isInbox);
    }

    function showChatUi(show) {
        showMainUi(show ? 'chat' : (state.notifInbox ? 'inbox' : 'chat'));
    }

    function openOvl(id) {
        var o = $(id);
        if (!o) return;
        o.classList.add('show');
        o.setAttribute('aria-hidden', 'false');
    }

    function closeOvl(id) {
        var o = $(id);
        if (!o) return;
        o.classList.remove('show');
        o.setAttribute('aria-hidden', 'true');
    }

    function openConfirm(opts) {
        if (!el.confirmOvl) return;
        if (el.confirmTitle) el.confirmTitle.textContent = opts.title || '确认';
        if (el.confirmBody) el.confirmBody.textContent = opts.body || '';
        if (el.confirmOk) el.confirmOk.textContent = opts.okText || '确定';
        state.confirmCb = opts.onConfirm || null;
        openOvl('imConfirmOvl');
    }

    function hideThreadCtx() {
        if (!el.threadCtx) return;
        el.threadCtx.classList.remove('show');
        el.threadCtx.hidden = true;
        state.ctxThreadId = null;
    }

    function showThreadCtx(id, x, y) {
        if (!el.threadCtx) return;
        state.ctxThreadId = id;
        el.threadCtx.style.left = Math.min(x, window.innerWidth - 160) + 'px';
        el.threadCtx.style.top = Math.min(y, window.innerHeight - 60) + 'px';
        el.threadCtx.hidden = false;
        el.threadCtx.classList.add('show');
    }

    function deleteThread(id) {
        var t = findThread(id);
        if (!t || isThreadDeleted(id)) return;
        openConfirm({
            title: '删除会话',
            body: '删除后双方数据都将清除，是否删除？',
            okText: '确定',
            onConfirm: function () {
                state.deletedIds.push(id);
                saveDeleted();
                if (state.activeId === id) {
                    var rest = filterThreads();
                    if (rest.length) selectThread(rest[0].id);
                    else {
                        state.activeId = null;
                        showMainUi('chat');
                        if (el.msgList) el.msgList.innerHTML = '';
                        if (el.headName) el.headName.textContent = '选择会话';
                        if (el.headStatus) el.headStatus.textContent = '';
                    }
                }
                renderThreadList();
                toast('已删除与「' + t.name + '」的会话');
            }
        });
    }

    function globalRejectInbox() {
        var kind = state.notifInbox;
        if (!kind) return;
        var list = getNotifList(kind);
        if (!list.length) {
            toast('暂无待处理通知');
            return;
        }
        var body = kind === 'friend'
            ? '将拒绝本页全部 ' + list.length + ' 条好友申请与陌生人私信，并开启「自动拒绝陌生人私信」。之后陌生人的私信将不再进入待处理列表。（演示）'
            : '将拒绝本页全部 ' + list.length + ' 条进群邀请，并开启「自动拒绝非互关用户的进群邀请」。（演示）';
        openConfirm({
            title: '全局拒绝',
            body: body,
            okText: '确认全局拒绝',
            onConfirm: function () {
                list.splice(0, list.length);
                try {
                    localStorage.setItem('fl_messages_global_reject_' + kind, '1');
                } catch (e) { /* ignore */ }
                toast('已开启全局拒绝，当前待处理已全部拒绝');
                closeNotifInbox();
                renderThreadList();
            }
        });
    }

    function getNotifList(kind) {
        return kind === 'group' ? GROUP_NOTIFS : FRIEND_NOTIFS;
    }

    function hubPreview(list, isGroup) {
        if (!list.length) return '';
        var first = list[0];
        var label = isGroup ? first.groupName : first.name;
        if (list.length === 1) return label;
        return label + ' 等 ' + list.length + ' 条' + (isGroup ? '进群邀请' : '待处理');
    }

    function renderNotifHubRow(kind, list, title, iconClass) {
        var hubActive = state.activeType === 'inbox' && state.notifInbox === kind;
        return '<div class="thread-row notif-hub' + (hubActive ? ' active' : '') + '" data-hub="' + kind + '" role="button">' +
            '<div class="av ' + iconClass + '"><i class="fa-solid ' + (kind === 'group' ? 'fa-users' : 'fa-user-plus') + '"></i></div>' +
            '<div class="info"><div class="top"><div class="name">' + title + '</div><i class="fa-solid fa-chevron-right chev"></i></div>' +
            '<div class="pre">' + esc(hubPreview(list, kind === 'group')) + '</div></div>' +
            '<span class="badge">' + (list.length > 99 ? '99+' : list.length) + '</span></div>';
    }

    function renderNotifInbox() {
        if (!el.notifInbox || !state.notifInbox) return;
        showMainUi('inbox');
        var kind = state.notifInbox;
        var list = getNotifList(kind);
        var q = state.inboxSearch.toLowerCase();
        var filtered = list.filter(function (n) {
            if (!q) return true;
            var blob = (n.groupName || '') + (n.name || '') + (n.host || '') + (n.preview || '');
            return blob.toLowerCase().indexOf(q) >= 0;
        });

        if (el.inboxTitle) el.inboxTitle.textContent = kind === 'group' ? '群聊通知' : '好友通知';
        if (el.inboxCount) el.inboxCount.textContent = filtered.length + ' 条待处理';

        if (!el.inboxList) return;
        if (!filtered.length) {
            el.inboxList.innerHTML = '<div style="padding:32px;text-align:center;color:var(--t-tertiary);font-size:13px">暂无匹配通知</div>';
            return;
        }

        el.inboxList.innerHTML = filtered.map(function (n) {
            var isGroup = n.type === 'group_invite';
            var title = isGroup ? n.groupName : n.name;
            var sub = isGroup ? (n.host + ' · ' + n.members + ' 人') : (n.type === 'friend_req' ? '好友申请' : '陌生人私信');
            var avStyle = n.av ? "background-image:url('" + n.av + "')" : (isGroup ? 'background:linear-gradient(135deg,#10B981,#3B82F6)' : 'background:linear-gradient(135deg,#A855F7,#EC4899)');
            var avInner = n.av ? '' : '<i class="fa-solid ' + (isGroup ? 'fa-users' : 'fa-user-plus') + '"></i>';
            return '<div class="im-inbox-item" data-notif="' + n.id + '">' +
                '<div class="av-sm" style="' + avStyle + '">' + avInner + '</div>' +
                '<div class="body"><div class="name">' + esc(title) + (n.flagged ? ' <span style="color:#F87171">⚠</span>' : '') + '</div>' +
                '<div class="sub">' + esc(n.preview) + '</div>' +
                '<div class="meta">' + esc(sub) + ' · ' + esc(n.time) + '</div></div>' +
                '<div class="quick-acts">' +
                '<button type="button" class="btn btn-sm btn-secondary" data-inbox-reject="' + n.id + '">拒绝</button>' +
                '<button type="button" class="btn btn-sm" style="background:var(--brand-grad);color:#fff;border:none" data-inbox-accept="' + n.id + '">同意</button>' +
                '</div></div>';
        }).join('');
    }

    function openNotifInbox(kind) {
        state.notifInbox = kind;
        state.activeType = 'inbox';
        state.activeId = null;
        state.inboxSearch = '';
        if (el.inboxSearch) el.inboxSearch.value = '';
        setInfoOpen(false);
        renderThreadList();
        renderNotifInbox();
    }

    function closeNotifInbox() {
        state.notifInbox = null;
        state.activeType = 'thread';
        showMainUi('chat');
        renderThreadList();
        renderHeader();
        renderMessages();
    }

    function resolveNotif(nid, accepted) {
        var n = findNotif(nid);
        if (!n) return;
        var kind = removeNotif(nid);
        if (accepted) {
            if (n.type === 'group_invite') {
                toast('已加入「' + n.groupName + '」');
            } else if (n.type === 'friend_req') {
                toast('已添加好友');
            } else {
                toast('已接受私信');
            }
        } else {
            toast('已拒绝');
        }
        renderThreadList();
        if (state.notifInbox && getNotifList(state.notifInbox).length) {
            state.activeType = 'inbox';
            renderNotifInbox();
            showMainUi('inbox');
        } else if (state.notifInbox) {
            closeNotifInbox();
        } else {
            showMainUi('chat');
        }
    }

    function findNotif(id) {
        var i;
        for (i = 0; i < GROUP_NOTIFS.length; i++) if (GROUP_NOTIFS[i].id === id) return GROUP_NOTIFS[i];
        for (i = 0; i < FRIEND_NOTIFS.length; i++) if (FRIEND_NOTIFS[i].id === id) return FRIEND_NOTIFS[i];
        return null;
    }

    function removeNotif(id) {
        var i;
        for (i = 0; i < GROUP_NOTIFS.length; i++) {
            if (GROUP_NOTIFS[i].id === id) { GROUP_NOTIFS.splice(i, 1); return 'group'; }
        }
        for (i = 0; i < FRIEND_NOTIFS.length; i++) {
            if (FRIEND_NOTIFS[i].id === id) { FRIEND_NOTIFS.splice(i, 1); return 'friend'; }
        }
        return null;
    }

    function renderNotifRow(n, isGroup) {
        var active = state.activeType === 'notif' && state.activeNotifId === n.id;
        var cls = 'thread-row notif-row' + (active ? ' active' : '');
        var avCls = isGroup ? 'av-group' : 'av-friend';
        var icon = isGroup ? 'fa-users' : (n.type === 'friend_req' ? 'fa-user-plus' : 'fa-inbox');
        var title = isGroup ? esc(n.groupName) : esc(n.name);
        var sub = isGroup ? ('来自 ' + esc(n.host)) : (n.type === 'friend_req' ? '好友申请' : '陌生人私信');
        return '<div class="' + cls + '" data-notif="' + n.id + '" role="button">' +
            '<div class="av ' + avCls + '" style="' + (n.av ? "background-image:url('" + n.av + "')" : '') + '">' +
            (n.av ? '' : '<i class="fa-solid ' + icon + '"></i>') + '</div>' +
            '<div class="info"><div class="top"><div class="name">' + title + '</div><div class="time">' + esc(n.time) + '</div></div>' +
            '<div class="pre">' + esc(n.preview) + '</div>' +
            '<div class="meta"><span class="tag-mini ' + (isGroup ? 'tag-fan' : 'tag-vip') + '">' + sub + '</span></div></div>' +
            '<span class="badge">1</span></div>';
    }

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function renderThreadList() {
        if (!el.threadList) return;
        var list = filterThreads();
        var html = '';
        var showGroupNotif = state.tab === 'all' || state.tab === 'group';
        var showFriendNotif = state.tab === 'all' || state.tab === 'dm';

        if (showGroupNotif && GROUP_NOTIFS.length) {
            html += renderNotifHubRow('group', GROUP_NOTIFS, '群聊通知', 'hub-group');
        }
        if (showFriendNotif && FRIEND_NOTIFS.length) {
            html += renderNotifHubRow('friend', FRIEND_NOTIFS, '好友通知', 'hub-friend');
        }

        if (list.length) {
            list.forEach(function (t) {
                var active = state.activeType === 'thread' && t.id === state.activeId;
                var cls = 'thread-row' + (t.kind === 'group' ? ' kind-group' : '') + (active ? ' active' : '') + (t.unread ? ' unread' : '') + (t.pinned ? ' pinned' : '') + (t.convMuted ? ' muted' : '');
                var showName = displayThreadName(t);
                var nameSub = t.remark ? '<span class="name-sub" style="font-size:10px;color:var(--t-tertiary);font-weight:400;margin-left:4px">' + esc(t.name) + '</span>' : '';
                var avStyle;
                if (t.kind === 'group') {
                    avStyle = 'background:linear-gradient(135deg,#A855F7,#EC4899);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;border-radius:12px';
                } else if (t.official) {
                    avStyle = 'background:linear-gradient(135deg,#A855F7,#EC4899);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px';
                } else {
                    avStyle = "background-image:url('" + t.av + "')";
                }
                var online = t.online && !t.official && t.kind !== 'group' ? '<span class="online"></span>' : '';
                var pre = '';
                if (t.previewTyping) pre = '<span class="typing">正在输入…</span>';
                else if (t.previewYou) pre = '<span class="you">你：</span>' + esc(t.preview);
                else pre = esc(t.preview || '');
                var tags = (t.tags || []).map(function (tag) {
                    return '<span class="tag-mini ' + (t.tagClass || 'tag-fan') + '">' + esc(tag) + '</span>';
                }).join('');
                if (t.kind === 'group') tags = '<span class="tag-mini tag-fan">' + (t.memberCount || 0) + ' 人</span>';
                var vfy = t.verified ? ' <i class="fa-solid fa-circle-check vfy"></i>' : '';
                var badge = t.unread ? '<span class="badge">' + t.unread + '</span>' : '';
                var avInner = t.official ? '<i class="fa-solid fa-infinity"></i>' : (t.kind === 'group' ? '<i class="fa-solid fa-users"></i>' : '');
                html += '<div class="' + cls + '" data-id="' + t.id + '" role="button" tabindex="0">' +
                    '<div class="av" style="' + avStyle + '">' + avInner + online + '</div>' +
                    '<div class="info"><div class="top"><div class="name">' + esc(showName) + nameSub + vfy + '</div><div class="time">' + esc(t.time || '') + '</div></div>' +
                    '<div class="pre">' + pre + '</div>' +
                    (tags ? '<div class="meta">' + tags + '</div>' : '') +
                    '</div>' + badge + '</div>';
            });
        }

        if (!html) html = '<div style="padding:24px;text-align:center;color:var(--t-tertiary);font-size:12px">暂无会话</div>';
        el.threadList.innerHTML = html;
        if (el.unreadHead) el.unreadHead.textContent = totalUnread() + ' 未读';
    }

    function renderMessage(m, thread) {
        if (m.type === 'day') return '<div class="day-sep"><span>' + esc(m.text) + '</span></div>';
        if (m.type === 'announce' || m.from === 'system') {
            return '<div class="day-sep" style="margin:14px 0"><span style="background:linear-gradient(135deg,rgba(251,191,36,0.25),rgba(168,85,247,0.2));color:var(--t-primary);font-weight:600;max-width:90%;text-align:left;padding:10px 14px;line-height:1.5">' +
                '<i class="fa-solid fa-bullhorn" style="color:#FBBF24;margin-right:6px"></i>' + esc(m.text) + '</span></div>';
        }
        if (m.type === 'typing') {
            return '<div class="msg-row"><div class="av" style="background-image:url(\'' + thread.av + '\')"></div><div class="group">' +
                '<div class="bub" style="display:inline-flex;align-items:center;gap:4px">' +
                '<span class="d" style="width:6px;height:6px;border-radius:50%;background:#999;animation:typing 1.2s ease-in-out infinite"></span>' +
                '<span class="d" style="width:6px;height:6px;border-radius:50%;background:#999;animation:typing 1.2s ease-in-out infinite 0.2s"></span>' +
                '<span class="d" style="width:6px;height:6px;border-radius:50%;background:#999;animation:typing 1.2s ease-in-out infinite 0.4s"></span></div>' +
                '<div class="msg-time">正在输入…</div></div></div>';
        }
        var me = m.from === 'me';
        var rowCls = 'msg-row' + (me ? ' me' : '') + (m.failed ? ' failed' : '') + (m.quoteRef ? ' quote' : '');
        var av = me ? '' : '<div class="av" style="background-image:url(\'' + (thread.official ? '' : thread.av) + '\')"></div>';
        var inner = '';
        if (m.quoteRef) inner += '<div class="msg-quote-ref">' + esc(m.quoteRef) + '</div>';
        if (m.type === 'text') inner += '<div class="bub">' + formatTextWithMentions(m.text, thread) + '</div>';
        else if (m.type === 'image') inner += '<div class="bub image"><img src="' + m.src + '" alt=""></div>';
        else if (m.type === 'gift') inner += '<div class="bub tip"><i class="fa-solid fa-gift"></i>' + esc(m.text) + '</div>';
        else if (m.type === 'share') {
            inner += '<div class="bub share-card" data-share="1"><img src="' + m.cover + '" alt=""><div class="sc-body"><div class="sc-title">' + esc(m.title) + '</div><div class="sc-meta"><i class="fa-solid fa-play"></i> ' + esc(m.meta) + '</div></div></div>';
        } else if (m.type === 'voice') {
            inner += '<div class="bub voice" data-voice="1"><span class="play"><i class="fa-solid fa-play"></i></span><span class="wave"><span></span><span></span><span></span><span></span><span></span></span><span class="dur">' + (m.duration || '0:08') + '</span></div>';
        }
        var time = m.time + (m.read ? ' · 已读' : '');
        var retry = m.failed ? '<button type="button" class="retry-btn" data-retry="' + (m._id || '') + '">发送失败 · 点击重试</button>' : '';
        return '<div class="' + rowCls + '" data-msg-id="' + (m._id || '') + '">' + av + '<div class="group">' + inner +
            '<div class="msg-time">' + esc(time) + '</div>' + retry + '</div></div>';
    }

    function renderMessages() {
        var t = findThread(state.activeId);
        if (!el.msgList) return;
        if (!t) {
            el.msgList.innerHTML = '';
            return;
        }
        el.msgList.innerHTML = t.messages.map(function (m) { return renderMessage(m, t); }).join('');
        el.msgList.scrollTop = el.msgList.scrollHeight;
    }

    function openThreadDetailEntry() {
        var t = findThread(state.activeId);
        if (!t) return;
        if (t.kind === 'group') {
            setInfoOpen(false);
            if (window.FL_openGroupManage) window.FL_openGroupManage();
            return;
        }
        toggleInfoPanel(true);
    }

    function applyThreadHeadChrome(t) {
        var isGroup = t && t.kind === 'group';
        if (el.imtHead) el.imtHead.classList.toggle('is-group', !!isGroup);
        if (el.btnProfile) el.btnProfile.hidden = isGroup || !!(t && t.official);
        if (el.headProfile) {
            el.headProfile.title = isGroup ? '群信息与设置' : '查看用户详情';
            el.headProfile.setAttribute('aria-label', isGroup ? '打开群管理' : '查看用户详情');
        }
    }

    function renderHeader() {
        var t = findThread(state.activeId);
        if (!t || !el.headAv) return;
        if (t.kind === 'group') {
            el.headAv.style.background = 'linear-gradient(135deg,#A855F7,#EC4899)';
            el.headAv.style.backgroundImage = '';
            el.headAv.innerHTML = '<i class="fa-solid fa-users" style="color:#fff;font-size:16px;display:flex;align-items:center;justify-content:center;height:100%;border-radius:12px"></i>';
        } else if (t.official) {
            el.headAv.style.background = 'linear-gradient(135deg,#A855F7,#EC4899)';
            el.headAv.style.backgroundImage = '';
            el.headAv.innerHTML = '<i class="fa-solid fa-infinity" style="color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;height:100%"></i>';
        } else {
            el.headAv.innerHTML = '';
            el.headAv.style.background = '';
            el.headAv.style.backgroundImage = "url('" + t.av + "')";
        }
        if (el.headName) {
            var dn = displayThreadName(t);
            el.headName.innerHTML = esc(dn) + (t.remark ? ' <span style="font-size:11px;color:var(--t-tertiary);font-weight:400">(' + esc(t.name) + ')</span>' : '') +
                (t.verified && t.kind !== 'group' ? ' <i class="fa-solid fa-circle-check" style="color:#3B82F6;font-size:11px"></i>' : '');
        }
        if (el.headStatus) {
            if (t.kind === 'group') el.headStatus.textContent = (t.memberCount || 0) + ' 位成员 · 私域群';
            else if (t.typing) el.headStatus.textContent = '在线 · 正在输入…';
            else if (t.online) el.headStatus.textContent = '在线';
            else el.headStatus.textContent = '离线';
        }
        if (el.inputTa) {
            el.inputTa.placeholder = t.kind === 'group' ? '发送至「' + t.name + '」…' : ('发送消息给 ' + t.name + '…');
        }
        applyThreadHeadChrome(t);
        if (t.kind !== 'group') renderInfoPanel(t);
        updateMoreMenuForThread(t);
        if (window.FL_onThreadHeader) window.FL_onThreadHeader(t);
    }

    function isInfoOverlayMode() {
        return window.matchMedia('(max-width: 1280px)').matches;
    }

    function setInfoOpen(open) {
        state.infoOpen = !!open;
        if (el.layout) el.layout.classList.toggle('im-info-open', state.infoOpen);
        if (el.infoPanel) el.infoPanel.setAttribute('aria-hidden', state.infoOpen ? 'false' : 'true');
        if (el.infoBackdrop) {
            el.infoBackdrop.classList.toggle('show', state.infoOpen && isInfoOverlayMode());
        }
        if (el.btnProfile) el.btnProfile.setAttribute('aria-expanded', state.infoOpen ? 'true' : 'false');
    }

    function toggleInfoPanel(force) {
        setInfoOpen(typeof force === 'boolean' ? force : !state.infoOpen);
    }

    function renderInfoPanel(t) {
        if (!el.infoPanel || !t) return;
        if (t.official) {
            var h3o = el.infoPanel.querySelector('.imi-head h3');
            if (h3o) h3o.textContent = t.name;
            return;
        }
        var big = el.infoPanel.querySelector('.av-big');
        if (big) big.style.backgroundImage = "url('" + t.av + "')";
        var h3 = el.infoPanel.querySelector('.imi-head h3');
        if (h3) {
            var dn2 = displayThreadName(t);
            h3.innerHTML = esc(dn2) + (t.verified ? ' <i class="fa-solid fa-circle-check vfy"></i>' : '');
        }
        var handle = el.infoPanel.querySelector('.imi-head .h');
        if (handle) {
            handle.textContent = t.remark ? ('昵称 ' + t.name + ' · ' + (t.handle || '@user')) : ((t.handle || '') + ' · 旅行摄影');
        }
        if (t.stats) {
            var stats = el.infoPanel.querySelectorAll('.imi-stats .v');
            if (stats[0]) stats[0].textContent = t.stats.fans || '—';
            if (stats[1]) stats[1].textContent = t.stats.works || '—';
            if (stats[2]) stats[2].textContent = t.stats.active || '—';
        }
        var pinSw = el.infoPanel.querySelector('[data-switch="pin"]');
        if (pinSw) pinSw.classList.toggle('on', !!t.pinned);
        var notifySw = el.infoPanel.querySelector('[data-switch="notify"]');
        if (notifySw) notifySw.classList.toggle('on', t.notifyOff !== true);
        var muteBtn = $('imBtnConvMute');
        if (muteBtn) muteBtn.classList.toggle('on', !!t.convMuted);
        var friendActs = $('imFriendActions');
        if (friendActs) friendActs.hidden = !isFriendThread(t);
        var relRows = el.infoPanel.querySelectorAll('.imi-section .imi-row');
        if (relRows[0] && t.relation && t.relation[0]) {
            relRows[0].innerHTML = '<i class="fa-regular fa-heart ic"></i> ' + esc(t.relation[0]);
        }
    }

    function selectThread(id) {
        var t = findThread(id);
        if (!t) return;
        restoreThread(id);
        state.activeType = 'thread';
        state.notifInbox = null;
        state.activeId = id;
        showMainUi('chat');
        setInfoOpen(false);
        t.unread = 0;
        t.previewTyping = false;
        t.typing = false;
        t.messages = t.messages.filter(function (m) { return m.type !== 'typing'; });
        renderThreadList();
        renderHeader();
        renderMessages();
        if (window.FL_onThreadSelected) window.FL_onThreadSelected(t);
        if (el.emptyThread) el.emptyThread.style.display = 'none';
        if (el.threadCol) el.threadCol.style.display = '';
    }

    function addMessage(msg) {
        var t = findThread(state.activeId);
        if (!t) return;
        msg._id = 'm' + Date.now();
        msg.time = formatNow();
        if (msg.from === 'me') {
            msg.read = false;
            setTimeout(function () {
                msg.read = true;
                renderMessages();
            }, 1200);
        }
        if (state.quote) {
            msg.quoteRef = state.quote;
            state.quote = null;
            if (el.quoteBar) el.quoteBar.classList.remove('show');
        }
        t.messages.push(msg);
        t.preview = msg.type === 'text' ? msg.text : msg.type === 'image' ? '[图片]' : msg.type === 'voice' ? '[语音]' : msg.type === 'share' ? '[作品]' : '[消息]';
        t.previewYou = true;
        t.time = '刚刚';
        saveExtra(t.id, msg);
        renderThreadList();
        renderMessages();
    }

    function formatNow() {
        var d = new Date();
        return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    }

    function sendText() {
        var text = (el.inputTa && el.inputTa.value || '').trim();
        if (!text) return;
        var t = findThread(state.activeId);
        var mentions = t ? parseMentionsInText(text, t) : [];
        addMessage({ from: 'me', type: 'text', text: text, mentions: mentions.map(function (m) { return m.id; }) });
        if (el.inputTa) el.inputTa.value = '';
        if (window.FL_hideMentionPicker) window.FL_hideMentionPicker();
        if (t && t.kind === 'group' && mentions.length) {
            mentions.forEach(function (m) {
                toast('已 @' + (m.remark ? displayThreadName({ name: m.name, remark: m.remark }) : m.name) + '，对方将收到提醒');
            });
        }
        simulateReply();
    }

    function simulateReply() {
        var t = findThread(state.activeId);
        if (!t || t.official) return;
        setTimeout(function () {
            addMessage({ from: 'them', type: 'text', text: '收到啦～稍后回复你更多细节 ✨' });
        }, 1800);
    }

    function openGift() {
        if (window.FL_openInteractionModal) {
            window.FL_openInteractionModal('gift-modal.html');
        } else {
            toast('已打开送礼（演示）');
            addMessage({ from: 'me', type: 'gift', text: '送出礼物 · 星月礼盒 × 1 · ≈ $12.00' });
        }
    }

    function toggleEmoji() {
        if (!el.emojiPanel) return;
        el.emojiPanel.classList.toggle('show');
    }

    function insertEmoji(em) {
        if (el.inputTa) {
            el.inputTa.value += em;
            el.inputTa.focus();
        }
    }

    /** 由 messages-share-work.js 调用 */
    window.FL_sendShareWorkMessage = function (work) {
        if (!work) return;
        addMessage({
            from: 'me',
            type: 'share',
            title: work.title,
            cover: work.cover,
            meta: work.meta
        });
    };

    function toggleVoiceRec() {
        if (!el.voiceRec) return;
        state.recording = !state.recording;
        el.voiceRec.classList.toggle('show', state.recording);
        if (state.recording) {
            setTimeout(function () {
                state.recording = false;
                el.voiceRec.classList.remove('show');
                addMessage({ from: 'me', type: 'voice', duration: '0:06' });
                toast('语音已发送');
            }, 2200);
        }
    }

    function toggleSearch() {
        state.searchOpen = !state.searchOpen;
        if (el.searchPanel) el.searchPanel.classList.toggle('show', state.searchOpen);
        if (state.searchOpen && el.searchInput) el.searchInput.focus();
    }

    function runInChatSearch(q) {
        if (!el.searchHits) return;
        var t = findThread(state.activeId);
        if (!t || !q) {
            el.searchHits.innerHTML = '<div style="font-size:12px;color:var(--t-tertiary);padding:8px">输入关键词搜索聊天记录</div>';
            return;
        }
        var hits = [];
        t.messages.forEach(function (m) {
            if (m.type === 'text' && m.text.indexOf(q) >= 0) hits.push(m);
        });
        if (!hits.length) {
            el.searchHits.innerHTML = '<div style="font-size:12px;color:var(--t-tertiary);padding:8px">无匹配结果</div>';
            return;
        }
        el.searchHits.innerHTML = hits.map(function (m) {
            var marked = esc(m.text).replace(new RegExp(escRegex(q), 'gi'), function (x) { return '<mark>' + x + '</mark>'; });
            return '<div class="hit" data-scroll="1">' + marked + ' <span style="opacity:0.6">· ' + esc(m.time) + '</span></div>';
        }).join('');
    }

    function escRegex(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function showMoreMenu(btn) {
        if (!el.dropdown) return;
        updateMoreMenuForThread(findThread(state.activeId));
        var r = btn.getBoundingClientRect();
        el.dropdown.style.left = Math.min(r.left - 160, window.innerWidth - 220) + 'px';
        el.dropdown.style.top = r.bottom + 6 + 'px';
        el.dropdown.classList.add('show');
    }

    function hideDropdown() {
        if (el.dropdown) el.dropdown.classList.remove('show');
    }

    function openDmFromCompose(user) {
        closeOvl('imPanelCompose');
        var t = user.threadId ? findThread(user.threadId) : findThreadByName(user.name);
        if (t) {
            restoreThread(t.id);
            selectThread(t.id);
            return;
        }
        var nid = 'peer_' + Date.now();
        THREADS.unshift({
            id: nid,
            name: user.name,
            av: user.av,
            category: 'fan',
            time: '刚刚',
            preview: '开始新对话',
            messages: [{ type: 'day', text: '今天' }]
        });
        selectThread(nid);
    }

    function renderComposePanel() {
        if (!el.composeList) return;
        var q = state.composeSearch.toLowerCase();
        var html = COMPOSE_USERS.filter(function (u) {
            if (window.FL_friendsStore && FL_friendsStore.isRemoved({ threadId: u.threadId, name: u.name })) return false;
            return !q || u.name.toLowerCase().indexOf(q) >= 0;
        }).map(function (u) {
            return '<div class="im-compose-row" data-compose-id="' + (u.threadId || '') + '" data-compose-name="' + esc(u.name) + '">' +
                '<div class="av" style="background-image:url(\'' + u.av + '\')"></div>' +
                '<div style="flex:1"><div style="font-weight:700;font-size:13px">' + esc(u.name) + '</div>' +
                '<div style="font-size:11px;color:var(--t-tertiary)">' + esc(u.sub) + '</div></div>' +
                '<i class="fa-solid fa-chevron-right" style="color:var(--t-tertiary);font-size:11px"></i></div>';
        }).join('');
        el.composeList.innerHTML = html || '<div style="padding:24px;text-align:center;color:var(--t-tertiary);font-size:12px">无匹配用户</div>';
    }

    function contactsGroupByAlpha(list) {
        var sorted = list.slice().sort(function (a, b) {
            return (a.sortKey || '').localeCompare(b.sortKey || '') || a.name.localeCompare(b.name);
        });
        var map = {};
        sorted.forEach(function (item) {
            var letter = item.sortKey || '#';
            if (!map[letter]) map[letter] = [];
            map[letter].push(item);
        });
        return Object.keys(map).sort().map(function (k) { return { letter: k, items: map[k] }; });
    }

    function renderContactsPanel() {
        if (!el.contactsBody) return;
        var q = state.contactsSearch.toLowerCase();
        var source = state.contactsTab === 'group' ? CONTACT_GROUPS : CONTACT_FRIENDS.filter(function (f) {
            return !window.FL_friendsStore || !FL_friendsStore.isRemoved({ threadId: f.id, name: f.name });
        });
        var filtered = source.filter(function (x) {
            return !q || x.name.toLowerCase().indexOf(q) >= 0 || (x.sub && x.sub.toLowerCase().indexOf(q) >= 0);
        });
        var sections = contactsGroupByAlpha(filtered);
        if (!sections.length) {
            el.contactsBody.innerHTML = '<div style="padding:32px;text-align:center;color:var(--t-tertiary);font-size:12px">无匹配联系人</div>';
            return;
        }
        var html = '';
        sections.forEach(function (sec) {
            html += '<div class="im-alpha">' + sec.letter + '</div>';
            sec.items.forEach(function (item) {
                if (state.contactsTab === 'group') {
                    html += '<div class="im-contact-row" data-contact-group="' + item.id + '">' +
                        '<div class="av grp"><i class="fa-solid fa-users"></i></div>' +
                        '<div style="flex:1"><div style="font-weight:700;font-size:13px">' + esc(item.name) + '</div>' +
                        '<div style="font-size:11px;color:var(--t-tertiary)">' + item.members + ' 人 · 群聊</div></div>' +
                        '<i class="fa-solid fa-chevron-right" style="color:var(--t-tertiary);font-size:11px"></i></div>';
                } else {
                    html += '<div class="im-contact-row" data-contact-friend="' + item.id + '">' +
                        '<div class="av" style="background-image:url(\'' + item.av + '\')"></div>' +
                        '<div style="flex:1"><div style="font-weight:700;font-size:13px">' + esc(item.name) + '</div>' +
                        '<div style="font-size:11px;color:var(--t-tertiary)">' + esc(item.sub) + '</div></div>' +
                        '<i class="fa-solid fa-chevron-right" style="color:var(--t-tertiary);font-size:11px"></i></div>';
                }
            });
        });
        el.contactsBody.innerHTML = html;
    }

    function renderGcFans(filter) {
        if (!el.gcFanList) return;
        var q = (filter || '').toLowerCase();
        el.gcFanList.innerHTML = GC_FANS.filter(function (f) {
            return !q || f.name.toLowerCase().indexOf(q) >= 0;
        }).map(function (f) {
            return '<label class="grp-fan-row">' +
                '<input type="checkbox" name="imGcFan" value="' + f.id + '" />' +
                '<div class="av" style="background-image:url(\'' + f.av + '\')"></div>' +
                '<div style="flex:1"><div style="font-weight:700;font-size:13px">' + f.name + '</div>' +
                '<div style="font-size:11px;color:var(--t-tertiary)">' + f.tag + '</div></div></label>';
        }).join('');
    }

    function openComposePanel() {
        state.composeSearch = '';
        if (el.composeSearch) el.composeSearch.value = '';
        renderComposePanel();
        openOvl('imPanelCompose');
    }

    function openContactsPanel() {
        state.contactsSearch = '';
        if (el.contactsSearch) el.contactsSearch.value = '';
        renderContactsPanel();
        openOvl('imPanelContacts');
    }

    function openGroupCreatePanel() {
        var notice = $('imGcNotice');
        if (notice) {
            try {
                var need = localStorage.getItem('fl_group_invite_need_consent') !== '0';
                notice.innerHTML = need
                    ? '<i class="fa-solid fa-shield-halved"></i> 已开启进群需确认，邀请将进入对方「群聊通知」。'
                    : '<i class="fa-solid fa-bolt"></i> 已关闭进群确认，选中粉丝将直接入群。';
            } catch (e) {
                notice.innerHTML = '<i class="fa-solid fa-shield-halved"></i> 邀请将发送至对方群聊通知列表。';
            }
        }
        renderGcFans('');
        openOvl('imPanelGroupCreate');
    }

    function submitGroupCreate() {
        var name = (el.gcName && el.gcName.value || '').trim();
        if (!name) { toast('请填写群名称'); return; }
        var checked = document.querySelectorAll('input[name="imGcFan"]:checked');
        if (!checked.length) { toast('请至少选择一位粉丝'); return; }
        var nid = 'grp_' + Date.now();
        THREADS.unshift({
            id: nid,
            kind: 'group',
            name: name,
            av: '',
            category: 'group',
            memberCount: checked.length + 12,
            time: '刚刚',
            preview: '群聊已创建，已发送邀请',
            messages: [{ type: 'day', text: '今天' }, { from: 'them', type: 'text', text: '欢迎加入「' + name + '」', time: '刚刚', sender: '系统' }]
        });
        restoreThread(nid);
        closeOvl('imPanelGroupCreate');
        state.tab = 'group';
        if (el.tabs) {
            el.tabs.querySelectorAll('.t').forEach(function (x) {
                x.classList.toggle('active', x.getAttribute('data-tab') === 'group');
            });
        }
        selectThread(nid);
        toast('群聊「' + name + '」已创建，已向 ' + checked.length + ' 人发送邀请');
    }

    function bindPanelCloses() {
        document.querySelectorAll('[data-close]').forEach(function (node) {
            if (node._imCloseBound) return;
            node._imCloseBound = true;
            node.addEventListener('click', function () {
                var id = node.getAttribute('data-close');
                if (id) closeOvl(id);
            });
        });
    }

    function bindEvents() {
        if (el.threadList) {
            el.threadList.addEventListener('click', function (e) {
                var hub = e.target.closest('[data-hub]');
                if (hub) {
                    openNotifInbox(hub.getAttribute('data-hub'));
                    return;
                }
                var row = e.target.closest('.thread-row[data-id]');
                if (!row) return;
                selectThread(row.getAttribute('data-id'));
            });
            el.threadList.addEventListener('contextmenu', function (e) {
                var row = e.target.closest('.thread-row[data-id]');
                if (!row) return;
                e.preventDefault();
                hideThreadCtx();
                showThreadCtx(row.getAttribute('data-id'), e.clientX, e.clientY);
            });
        }

        if (el.threadCtx) {
            el.threadCtx.addEventListener('click', function (e) {
                var btn = e.target.closest('[data-thread-action]');
                if (!btn || !state.ctxThreadId) return;
                if (btn.getAttribute('data-thread-action') === 'delete') {
                    deleteThread(state.ctxThreadId);
                }
                hideThreadCtx();
            });
        }

        if (el.inboxList) {
            el.inboxList.addEventListener('click', function (e) {
                var acc = e.target.closest('[data-inbox-accept]');
                var rej = e.target.closest('[data-inbox-reject]');
                if (acc) {
                    e.stopPropagation();
                    resolveNotif(acc.getAttribute('data-inbox-accept'), true);
                    return;
                }
                if (rej) {
                    e.stopPropagation();
                    resolveNotif(rej.getAttribute('data-inbox-reject'), false);
                }
            });
        }

        if (el.inboxBack) el.inboxBack.addEventListener('click', closeNotifInbox);
        if (el.inboxSearch) {
            el.inboxSearch.addEventListener('input', function () {
                state.inboxSearch = el.inboxSearch.value.trim();
                renderNotifInbox();
            });
        }
        if (el.inboxRejectAll) el.inboxRejectAll.addEventListener('click', globalRejectInbox);
        if (el.inboxAcceptAll) {
            el.inboxAcceptAll.addEventListener('click', function () {
                var list = getNotifList(state.notifInbox);
                if (!list.length) return;
                if (!window.confirm('批量同意 ' + list.length + ' 条？（演示）')) return;
                list.splice(0, list.length);
                toast('已批量处理');
                closeNotifInbox();
                renderThreadList();
            });
        }

        if (el.confirmOk) {
            el.confirmOk.addEventListener('click', function () {
                if (state.confirmCb) state.confirmCb();
                state.confirmCb = null;
                closeOvl('imConfirmOvl');
            });
        }

        if (el.btnCompose) el.btnCompose.addEventListener('click', openComposePanel);
        if (el.btnContacts) el.btnContacts.addEventListener('click', openContactsPanel);
        if (el.btnGroupCreate) el.btnGroupCreate.addEventListener('click', openGroupCreatePanel);
        if (el.composeSearch) {
            el.composeSearch.addEventListener('input', function () {
                state.composeSearch = el.composeSearch.value.trim();
                renderComposePanel();
            });
        }
        if (el.composeList) {
            el.composeList.addEventListener('click', function (e) {
                var row = e.target.closest('[data-compose-name]');
                if (!row) return;
                var name = row.getAttribute('data-compose-name');
                var user = COMPOSE_USERS.filter(function (u) { return u.name === name; })[0];
                if (user) openDmFromCompose(user);
            });
        }
        if (el.contactsTabs) {
            el.contactsTabs.addEventListener('click', function (e) {
                var btn = e.target.closest('button[data-tab]');
                if (!btn) return;
                el.contactsTabs.querySelectorAll('button').forEach(function (b) { b.classList.remove('on'); });
                btn.classList.add('on');
                state.contactsTab = btn.getAttribute('data-tab');
                renderContactsPanel();
            });
        }
        if (el.contactsSearch) {
            el.contactsSearch.addEventListener('input', function () {
                state.contactsSearch = el.contactsSearch.value.trim();
                renderContactsPanel();
            });
        }
        if (el.contactsBody) {
            el.contactsBody.addEventListener('click', function (e) {
                var g = e.target.closest('[data-contact-group]');
                var f = e.target.closest('[data-contact-friend]');
                closeOvl('imPanelContacts');
                if (g) {
                    var th = findThread(g.getAttribute('data-contact-group'));
                    if (th) selectThread(th.id);
                    else {
                        state.tab = 'group';
                        if (el.tabs) {
                            el.tabs.querySelectorAll('.t').forEach(function (x) {
                                x.classList.toggle('active', x.getAttribute('data-tab') === 'group');
                            });
                        }
                        renderThreadList();
                        toast('请在群聊列表中选择会话');
                    }
                    return;
                }
                if (f) {
                    var tid = f.getAttribute('data-contact-friend');
                    var th2 = findThread(tid);
                    if (th2) selectThread(th2.id);
                }
            });
        }
        if (el.gcFanSearch) {
            el.gcFanSearch.addEventListener('input', function () {
                renderGcFans(el.gcFanSearch.value.trim());
            });
        }
        if (el.gcSubmit) el.gcSubmit.addEventListener('click', submitGroupCreate);

        if (el.tabs) {
            el.tabs.addEventListener('click', function (e) {
                var t = e.target.closest('.t[data-tab]');
                if (!t) return;
                el.tabs.querySelectorAll('.t').forEach(function (x) { x.classList.remove('active'); });
                t.classList.add('active');
                state.tab = t.getAttribute('data-tab') || 'all';
                renderThreadList();
            });
        }

        if (el.listSearch) {
            el.listSearch.addEventListener('input', function () {
                var q = el.listSearch.value.trim().toLowerCase();
                el.threadList.querySelectorAll('.thread-row, .im-list-section').forEach(function (row) {
                    if (row.classList.contains('im-list-section')) return;
                    var name = (row.querySelector('.name') || {}).textContent || '';
                    var pre = (row.querySelector('.pre') || {}).textContent || '';
                    row.style.display = !q || (name + pre).toLowerCase().indexOf(q) >= 0 ? '' : 'none';
                });
            });
        }

        if (el.btnSend) el.btnSend.addEventListener('click', sendText);
        if (el.inputTa) {
            el.inputTa.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendText();
                }
            });
        }

        if (el.btnEmoji) el.btnEmoji.addEventListener('click', toggleEmoji);
        if (el.emojiPanel) {
            el.emojiPanel.addEventListener('click', function (e) {
                var b = e.target.closest('button[data-em]');
                if (b) insertEmoji(b.getAttribute('data-em'));
            });
        }
        if (el.btnImage) el.btnImage.addEventListener('click', function () {
            addMessage({ from: 'me', type: 'image', src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600' });
            toast('图片已发送（演示）');
        });
        if (el.btnAttach) el.btnAttach.addEventListener('click', function () { toast('附件功能演示中'); });
        if (el.btnVoice) el.btnVoice.addEventListener('click', toggleVoiceRec);
        if (el.btnGift) el.btnGift.addEventListener('click', openGift);
        if (el.btnSharePost) {
            el.btnSharePost.addEventListener('click', function () {
                if (window.FL_openShareWorkModal) window.FL_openShareWorkModal();
                else toast('分享作品（请加载 messages-share-work.js）');
            });
        }

        if (el.btnSearch) el.btnSearch.addEventListener('click', toggleSearch);
        if (el.searchInput) el.searchInput.addEventListener('input', function () { runInChatSearch(el.searchInput.value.trim()); });

        if (el.btnMore) el.btnMore.addEventListener('click', function (e) {
            e.stopPropagation();
            if (el.dropdown && el.dropdown.classList.contains('show')) hideDropdown();
            else showMoreMenu(el.btnMore);
        });

        if (el.dropdown) {
            el.dropdown.addEventListener('click', function (e) {
                e.stopPropagation();
                var b = e.target.closest('button[data-action]');
                if (!b) return;
                hideDropdown();
                var act = b.getAttribute('data-action');
                var t = findThread(state.activeId);
                if (act === 'remark') {
                    if (window.FL_openRemarkModal) window.FL_openRemarkModal();
                } else if (act === 'unfriend') {
                    if (t) deleteFriend(t.id);
                } else if (act === 'clear') {
                    if (t && window.confirm('清空与该用户的聊天记录？')) {
                        t.messages = [{ type: 'day', text: '今天' }];
                        renderMessages();
                        toast('聊天记录已清空');
                    }
                } else if (act === 'delete') {
                    if (t) deleteThread(t.id);
                } else if (act === 'report') {
                    if (window.FL_openReportModal) window.FL_openReportModal();
                }
            });
        }

        document.addEventListener('click', function (e) {
            if (el.dropdown && !el.dropdown.contains(e.target) && e.target !== el.btnMore) hideDropdown();
            if (el.threadCtx && !el.threadCtx.contains(e.target)) hideThreadCtx();
        });

        if (el.quoteClose) el.quoteClose.addEventListener('click', function () {
            state.quote = null;
            if (el.quoteBar) el.quoteBar.classList.remove('show');
        });

        if (el.msgList) {
            el.msgList.addEventListener('contextmenu', function (e) {
                var bub = e.target.closest('.bub');
                if (!bub) return;
                e.preventDefault();
                var txt = bub.textContent.trim().slice(0, 40);
                state.quote = txt;
                if (el.quoteBar) {
                    el.quoteBar.classList.add('show');
                    el.quoteBar.querySelector('.txt').textContent = '回复：' + txt;
                }
            });
            el.msgList.addEventListener('click', function (e) {
                if (e.target.closest('[data-share]')) {
                    toast('打开作品详情（演示）');
                }
                if (e.target.closest('[data-voice]')) {
                    toast('播放语音（演示）');
                }
                if (e.target.closest('.retry-btn')) {
                    toast('已重新发送');
                }
            });
        }

        if (el.headProfile) {
            el.headProfile.addEventListener('click', function () { openThreadDetailEntry(); });
            el.headProfile.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openThreadDetailEntry();
                }
            });
        }
        if (el.btnProfile) el.btnProfile.addEventListener('click', function (e) {
            e.stopPropagation();
            openThreadDetailEntry();
        });
        if (el.infoClose) el.infoClose.addEventListener('click', function () { setInfoOpen(false); });
        if (el.infoBackdrop) {
            el.infoBackdrop.addEventListener('click', function (e) {
                e.stopPropagation();
                setInfoOpen(false);
            });
        }

        if ($('imRowDeleteFriend')) {
            $('imRowDeleteFriend').addEventListener('click', function () {
                var t = findThread(state.activeId);
                if (t) deleteFriend(t.id);
            });
            $('imRowDeleteFriend').addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    var t = findThread(state.activeId);
                    if (t) deleteFriend(t.id);
                }
            });
        }

        if (el.infoPanel) {
            el.infoPanel.addEventListener('click', function (e) {
                e.stopPropagation();
                var sw = e.target.closest('[data-switch]');
                if (!sw) return;
                sw.classList.toggle('on');
                var key = sw.getAttribute('data-switch');
                var t = findThread(state.activeId);
                if (key === 'pin' && t) {
                    t.pinned = sw.classList.contains('on');
                    renderThreadList();
                    toast(t.pinned ? '已置顶会话' : '已取消置顶');
                }
                if (key === 'notify' && t) {
                    t.notifyOff = !sw.classList.contains('on');
                    toast(sw.classList.contains('on') ? '已开启消息通知' : '已关闭推送通知');
                }
            });
        }

        window.addEventListener('message', function (e) {
            if (!e.data || e.data.type !== 'fansloop-gift-sent') return;
            addMessage({ from: 'me', type: 'gift', text: '送出礼物 · ' + (e.data.label || '星月礼盒') + ' · ≈ $' + (e.data.amount || '12') });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && state.infoOpen) setInfoOpen(false);
        });
    }

    function parsePeer() {
        var m = /[?&]peer=([^&]+)/.exec(location.search);
        if (!m) return;
        var th = findThreadByName(decodeURIComponent(m[1]));
        if (th) selectThread(th.id);
        else {
            THREADS.unshift({
                id: 'peer_' + Date.now(),
                name: decodeURIComponent(m[1]),
                av: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
                category: 'fan',
                time: '刚刚',
                preview: '开始新对话',
                messages: [{ type: 'day', text: '今天' }]
            });
            selectThread(THREADS[0].id);
        }
    }

    function init() {
        el.threadList = $('imThreadList');
        el.msgList = $('imMsgList');
        el.tabs = $('imlTabs');
        el.listSearch = $('imListSearch');
        el.unreadHead = $('imUnreadHead');
        el.headAv = $('imHeadAv');
        el.headName = $('imHeadName');
        el.headStatus = $('imHeadStatus');
        el.inputTa = $('imInputTa');
        el.btnSend = $('imBtnSend');
        el.btnEmoji = $('imBtnEmoji');
        el.btnImage = $('imBtnImage');
        el.btnAttach = $('imBtnAttach');
        el.btnVoice = $('imBtnVoice');
        el.btnGift = $('imBtnGift');
        el.btnSharePost = $('imBtnSharePost');
        el.btnSearch = $('imBtnSearch');
        el.btnMore = $('imBtnMore');
        el.emojiPanel = $('imEmojiPanel');
        el.voiceRec = $('imVoiceRec');
        el.searchPanel = $('imSearchPanel');
        el.searchInput = $('imSearchInput');
        el.searchHits = $('imSearchHits');
        el.dropdown = $('imDropdown');
        el.quoteBar = $('imQuoteBar');
        el.quoteClose = $('imQuoteClose');
        el.toastHost = $('imToastHost');
        el.infoPanel = $('imInfoPanel');
        el.layout = $('imLayout');
        el.infoBackdrop = $('imInfoBackdrop');
        el.infoClose = $('imInfoClose');
        el.headProfile = $('imHeadProfile');
        el.btnProfile = $('imBtnProfile');
        el.emptyThread = $('imEmptyThread');
        el.threadCol = $('imThreadCol');
        el.notifInbox = $('imNotifInbox');
        el.inboxList = $('imNotifInboxList');
        el.inboxTitle = $('imInboxTitle');
        el.inboxCount = $('imInboxCount');
        el.inboxSearch = $('imInboxSearch');
        el.inboxBack = $('imInboxBack');
        el.inboxRejectAll = $('imInboxRejectAll');
        el.inboxAcceptAll = $('imInboxAcceptAll');
        el.confirmOvl = $('imConfirmOvl');
        el.confirmTitle = $('imConfirmTitle');
        el.confirmBody = $('imConfirmBody');
        el.confirmOk = $('imConfirmOk');
        el.threadCtx = $('imThreadCtxMenu');
        el.btnCompose = $('imBtnCompose');
        el.btnContacts = $('imBtnContacts');
        el.btnGroupCreate = $('imBtnGroupCreate');
        el.composeList = $('imComposeList');
        el.composeSearch = $('imComposeSearch');
        el.contactsBody = $('imContactsBody');
        el.contactsSearch = $('imContactsSearch');
        el.contactsTabs = $('imContactsTabs');
        el.gcFanList = $('imGcFanList');
        el.gcFanSearch = $('imGcFanSearch');
        el.gcName = $('imGcName');
        el.gcSubmit = $('imGcSubmit');
        el.imtHead = document.querySelector('#imThreadCol .imt-head');

        if (!el.threadList) return;
        bindPanelCloses();

        window.addEventListener('resize', function () {
            if (el.infoBackdrop && state.infoOpen) {
                el.infoBackdrop.classList.toggle('show', isInfoOverlayMode());
            }
        });

        loadStore();
        bindEvents();
        setInfoOpen(false);
        parsePeer();
        selectThread(state.activeId);

        if (/[?&]share=open/.test(location.search) && window.FL_openShareWorkModal) {
            setTimeout(function () { window.FL_openShareWorkModal(); }, 400);
        }
        if (/[?&]panel=open/.test(location.search)) {
            setTimeout(function () { openThreadDetailEntry(); }, 300);
        }
        if (/[?&]panel=compose/.test(location.search)) {
            setTimeout(openComposePanel, 400);
        }
        if (/[?&]panel=contacts/.test(location.search)) {
            setTimeout(openContactsPanel, 400);
        }
        if (/[?&]panel=group-create/.test(location.search)) {
            setTimeout(openGroupCreatePanel, 400);
        }
        if (/[?&]panel=group-manage/.test(location.search)) {
            setTimeout(function () {
                selectThread('grp-vip');
                if (window.FL_openGroupManage) window.FL_openGroupManage();
            }, 450);
        }
        var inboxM = /[?&]inbox=(group|friend)/.exec(location.search);
        if (inboxM) {
            setTimeout(function () { openNotifInbox(inboxM[1]); }, 350);
        }
        var tabM = /[?&]tab=(\w+)/.exec(location.search);
        if (tabM && el.tabs) {
            state.tab = tabM[1];
            el.tabs.querySelectorAll('.t').forEach(function (x) {
                x.classList.toggle('active', x.getAttribute('data-tab') === state.tab);
            });
            renderThreadList();
        }
        showChatUi(state.activeType === 'thread');
        renderThreadList();

        var emojis = ['😀', '😍', '🥰', '😂', '🙏', '👍', '🔥', '✨', '🎉', '💜', '📷', '🎬', '💰', '🌸'];
        if (el.emojiPanel) {
            el.emojiPanel.innerHTML = emojis.map(function (e) {
                return '<button type="button" data-em="' + e + '">' + e + '</button>';
            }).join('');
        }

        window.addEventListener('fl-friend-removed', function () {
            applyRemovedFriendsFromStore();
            renderThreadList();
            var t = findThread(state.activeId);
            if (t) {
                renderHeader();
                if (state.infoOpen && t.kind !== 'group') renderInfoPanel(t);
            }
        });
    }

    window.FL_messagesApi = {
        findThread: findThread,
        selectThread: selectThread,
        renderMessages: renderMessages,
        renderHeader: renderHeader,
        renderThreadList: renderThreadList,
        toast: toast,
        openConfirm: openConfirm,
        closeOvl: closeOvl,
        openOvl: openOvl,
        esc: esc,
        state: state,
        deleteThread: deleteThread,
        deleteFriend: deleteFriend,
        isFriendThread: isFriendThread,
        isThreadDeleted: isThreadDeleted,
        displayThreadName: displayThreadName,
        getGroupMentionMembers: getGroupMentionMembers,
        saveThreadMeta: saveThreadMeta
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
