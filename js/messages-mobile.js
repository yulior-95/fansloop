/**
 * 移动端消息：收件箱跳转 + 单聊页
 */
(function () {
    var CONTACTS = [
        { name: '夜雨听弦', nick: '@yeyu_creator', av: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80' },
        { name: 'Mila', nick: '@mila_private', av: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80' },
        { name: 'Luna', nick: '@luna_web3', av: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=120&q=80' },
        { name: 'Ryo', nick: '@ryo_vlog', av: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80' },
        { name: 'Nova', nick: '@nova_room', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80' },
        { name: 'Aria', nick: '@aria_live', av: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80' },
        { name: 'Kenji', nick: '@kenji_film', av: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&q=80' }
    ];
    function peerProfileSlug(name) {
        var i;
        for (i = 0; i < CONTACTS.length; i++) {
            if (CONTACTS[i].name === name) {
                var nick = CONTACTS[i].nick || '';
                return String(nick).replace(/^@/, '') || 'luna_web3';
            }
        }
        if (name === 'Luna') return 'luna_web3';
        return String(name || 'creator').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_\u4e00-\u9fff]/gi, '');
    }

    var MOB_EMOJIS = ['😀', '😂', '🥰', '😎', '👍', '🙏', '🔥', '💜', '🎬', '📷', '✨', '🎉'];
    var GROUP_INBOX_KEY = 'gf_h5_group_inbox_v1';

    function defaultGroupInbox() {
        var list = [
            { id: 'gn1', host: 'Luna 🌙', groupName: 'Luna VIP 摄影群', preview: '邀请你加入订阅者专属群', time: '10 分钟前', members: 128 },
            { id: 'gn2', host: 'Lens 旅记', groupName: '直播粉丝交流群', preview: '邀请你讨论本周直播', time: '1 小时前', members: 56 },
            { id: 'gn3', host: '山野食光', groupName: '美食私域群', preview: '订阅者专属菜谱交流群', time: '2 小时前', members: 210 },
            { id: 'gn4', host: '夜雨听弦', groupName: '播客听友群', preview: '每周直播复盘讨论', time: '3 小时前', members: 89 }
        ];
        var hosts = ['Nova Studio', '海风日记', '晨间咖啡', '云端书客', '东京夜跑团', '胶片少女', 'Mio_摄影', '阿Ken旅行'];
        var i;
        for (i = 0; i < hosts.length; i++) {
            list.push({
                id: 'gn' + (5 + i),
                host: hosts[i],
                groupName: hosts[i] + ' 粉丝群',
                preview: '邀请你加入粉丝交流群',
                time: (4 + i) + ' 小时前',
                members: 40 + i * 17
            });
        }
        return list;
    }

    function loadGroupInbox() {
        try {
            var raw = localStorage.getItem(GROUP_INBOX_KEY);
            if (!raw) return defaultGroupInbox();
            var parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : defaultGroupInbox();
        } catch (e) {
            return defaultGroupInbox();
        }
    }

    function saveGroupInbox(list) {
        try {
            localStorage.setItem(GROUP_INBOX_KEY, JSON.stringify(list));
        } catch (e) { /* ignore */ }
    }

    function groupInboxPreview(list) {
        if (!list.length) return '暂无进群邀请';
        if (list.length === 1) return list[0].groupName;
        return list[0].groupName + ' 等 ' + list.length + ' 条进群邀请';
    }

    function syncGroupHubOnMessagesPage() {
        var list = loadGroupInbox();
        var badge = document.getElementById('chatHubGroupBadge');
        var preview = document.getElementById('chatHubGroupPreview');
        var hub = document.getElementById('chatHubGroup');
        if (badge) {
            badge.textContent = list.length > 99 ? '99+' : String(list.length);
            badge.style.display = list.length ? '' : 'none';
        }
        if (preview) preview.textContent = groupInboxPreview(list);
        if (hub) hub.style.display = list.length ? '' : 'none';
    }

    var PEERS = {
        Luna: {
            av: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80',
            messages: [
                { type: 'call', from: 'them', callKind: 'video', callStatus: 'missed', time: '前天 09:12' },
                { type: 'call', from: 'me', callKind: 'voice', callStatus: 'ended', duration: '5:08', time: '前天 14:30' },
                { type: 'call', from: 'me', callKind: 'video', callStatus: 'declined', time: '昨天 10:05' },
                { type: 'call', from: 'them', callKind: 'voice', callStatus: 'rejected', time: '昨天 11:20' },
                { type: 'call', from: 'me', callKind: 'voice', callStatus: 'cancelled', time: '昨天 15:40' },
                { type: 'call', from: 'them', callKind: 'video', callStatus: 'ended', duration: '1:02', time: '昨天 16:55' },
                { from: 'them', text: '已向你发送新的订阅专属视频 🎬', time: '刚刚' },
                { from: 'me', text: '收到，马上看！', time: '刚刚' },
                { from: 'them', image: true, imageSrc: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400&q=80', time: '昨天 18:20' },
                { from: 'me', image: true, imageSrc: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80', time: '昨天 18:22' },
                { from: 'them', image: true, imageSrc: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80', time: '昨天 18:25' }
            ]
        },
        Mila: {
            av: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80',
            messages: [
                { from: 'them', text: '谢谢你的打赏！已收到 10 USDT 💜', time: '14:32' }
            ]
        },
        Ryo: {
            av: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80',
            messages: [
                { from: 'them', text: '下周会去京都拍新的 vlog，敬请期待～', time: '昨天' }
            ]
        },
        Nova: {
            av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80',
            messages: [
                { from: 'them', text: '新作品～', time: '昨天', image: true }
            ]
        },
        '夜雨听弦': {
            av: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80',
            messages: [
                { from: 'them', text: '已通过你的私聊请求，欢迎交流创作计划。', time: '刚刚' }
            ]
        }
    };
    var DM_REL = {
        Luna: { mutual: true, subscribed: true },
        Mila: { mutual: true, subscribed: false },
        '夜雨听弦': { mutual: true, subscribed: true },
        Ryo: { mutual: false, subscribed: false },
        Nova: { mutual: false, subscribed: false }
    };

    var MUTE_STORAGE_KEY = 'gf_h5_thread_mute_v1';
    var REMARK_STORAGE_KEY = 'gf_h5_thread_remark_v1';
    var remarkModalCtx = { threadKey: '', onSaved: null };
    var remarkModalBound = false;

    function escHtml(s) {
        return String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function readRemarkMap() {
        try {
            return JSON.parse(localStorage.getItem(REMARK_STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    function writeRemarkMap(map) {
        try {
            localStorage.setItem(REMARK_STORAGE_KEY, JSON.stringify(map || {}));
        } catch (e) { /* ignore */ }
    }

    function threadRemarkKey(isGroup, peerName, groupSlug) {
        if (isGroup) return 'group:' + (groupSlug || peerName);
        return peerName;
    }

    function getThreadRemark(key) {
        var v = readRemarkMap()[key];
        return v ? String(v).trim() : '';
    }

    function setThreadRemark(key, val) {
        var map = readRemarkMap();
        val = String(val || '').trim();
        if (val) map[key] = val;
        else delete map[key];
        writeRemarkMap(map);
    }

    function applyInboxRemarks() {
        var map = readRemarkMap();
        document.querySelectorAll('.chat-item[data-peer]').forEach(function (row) {
            var peer = row.getAttribute('data-peer');
            if (!peer || !map[peer]) return;
            var nameEl = row.querySelector('.name');
            if (nameEl) nameEl.textContent = map[peer];
        });
    }

    function readMuteMap() {
        try {
            return JSON.parse(localStorage.getItem(MUTE_STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    function writeMuteMap(map) {
        try {
            localStorage.setItem(MUTE_STORAGE_KEY, JSON.stringify(map || {}));
        } catch (e) { /* ignore */ }
    }

    function isThreadMuted(key) {
        if (!key) return false;
        return !!readMuteMap()[key];
    }

    function setThreadMuted(key, on) {
        if (!key) return;
        var map = readMuteMap();
        if (on) map[key] = true;
        else delete map[key];
        writeMuteMap(map);
    }

    function applyChatItemMuteUi(row, muted) {
        if (!row) return;
        row.classList.toggle('is-muted', !!muted);
        var box = row.querySelector('.avatar-box');
        if (!box) return;
        var badge = box.querySelector('.mute-badge');
        if (muted) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'mute-badge';
                badge.setAttribute('aria-label', '消息免打扰');
                badge.innerHTML = '<i class="fa-solid fa-bell-slash"></i>';
                box.appendChild(badge);
            }
        } else if (badge) {
            badge.remove();
        }
    }

    function applyInboxMutes() {
        document.querySelectorAll('.chat-item[data-peer]').forEach(function (row) {
            var peer = row.getAttribute('data-peer');
            applyChatItemMuteUi(row, isThreadMuted(peer));
        });
    }

    function closeMobRemarkModal() {
        var ovl = document.getElementById('mobImRemarkOvl');
        if (!ovl) return;
        ovl.classList.remove('open');
        ovl.setAttribute('aria-hidden', 'true');
        var mediaOvlEl = document.getElementById('mobChatMediaOvl');
        if (!document.querySelector('.im-more-ovl.open') && !(mediaOvlEl && mediaOvlEl.classList.contains('open'))) {
            document.body.style.overflow = '';
        }
        remarkModalCtx.onSaved = null;
        remarkModalCtx.threadKey = '';
    }

    function openMobRemarkModal(opts) {
        opts = opts || {};
        initMobRemarkModal();
        var ovl = document.getElementById('mobImRemarkOvl');
        if (!ovl) return;
        remarkModalCtx.threadKey = opts.threadKey || '';
        remarkModalCtx.onSaved = typeof opts.onSaved === 'function' ? opts.onSaved : null;
        var titleEl = document.getElementById('mobImRemarkTitle');
        var hintEl = document.getElementById('mobImRemarkHint');
        var originEl = document.getElementById('mobImRemarkOrigin');
        var inp = document.getElementById('mobImRemarkInput');
        if (titleEl) {
            titleEl.innerHTML = '<i class="fa-solid fa-pen"></i> ' + (opts.isGroup ? '设置群聊备注' : '设置备注');
        }
        if (hintEl) {
            hintEl.textContent = opts.isGroup
                ? '备注名将优先显示在群聊列表与顶栏（留空恢复群名）'
                : '备注名将优先显示在会话列表与 @ 提及中';
        }
        if (originEl) {
            originEl.innerHTML = (opts.isGroup ? '群聊：' : '昵称：') +
                '<strong>' + escHtml(opts.originalName || '—') + '</strong>';
        }
        if (inp) {
            inp.placeholder = opts.isGroup ? '输入群聊备注，留空则恢复群名' : '输入备注名，留空则恢复昵称';
            inp.value = opts.currentRemark || getThreadRemark(remarkModalCtx.threadKey);
        }
        ovl.classList.add('open');
        ovl.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(function () { if (inp) { inp.focus(); inp.select(); } }, 120);
    }

    function saveMobRemarkModal() {
        if (!remarkModalCtx.threadKey) {
            closeMobRemarkModal();
            return;
        }
        var inp = document.getElementById('mobImRemarkInput');
        var val = (inp && inp.value || '').trim();
        setThreadRemark(remarkModalCtx.threadKey, val);
        if (remarkModalCtx.onSaved) remarkModalCtx.onSaved(val);
        closeMobRemarkModal();
        toast(val ? '备注已保存，列表将优先显示备注名' : '已清除备注');
    }

    function initMobRemarkModal() {
        if (remarkModalBound) return;
        var ovl = document.getElementById('mobImRemarkOvl');
        if (!ovl) return;
        remarkModalBound = true;
        document.getElementById('mobImRemarkBackdrop')?.addEventListener('click', closeMobRemarkModal);
        document.getElementById('mobImRemarkCancel')?.addEventListener('click', closeMobRemarkModal);
        document.getElementById('mobImRemarkSave')?.addEventListener('click', saveMobRemarkModal);
        var inp = document.getElementById('mobImRemarkInput');
        if (inp) {
            inp.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveMobRemarkModal();
                }
            });
        }
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && ovl.classList.contains('open')) closeMobRemarkModal();
        });
    }

    function toast(msg) {
        if (window.DigitalH5Nav && typeof window.DigitalH5Nav.toast === 'function') {
            window.DigitalH5Nav.toast(msg);
            return;
        }
        if (typeof window.alert === 'function') window.alert(msg);
    }

    function openImMoreOvl(ovl) {
        if (!ovl) return;
        ovl.classList.add('open');
        ovl.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeImMoreOvl(ovl) {
        if (!ovl) return;
        ovl.classList.remove('open');
        ovl.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function bindImMoreSheet(ovl, closeBtn, onAction) {
        if (!ovl) return;
        if (closeBtn) closeBtn.addEventListener('click', function () { closeImMoreOvl(ovl); });
        ovl.addEventListener('click', function (e) {
            if (e.target === ovl) closeImMoreOvl(ovl);
        });
        ovl.querySelectorAll('[data-im-more]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var act = btn.getAttribute('data-im-more');
                closeImMoreOvl(ovl);
                if (onAction) onAction(act, btn);
            });
        });
        if (!ovl.getAttribute('data-im-more-bound')) {
            ovl.setAttribute('data-im-more-bound', '1');
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && ovl.classList.contains('open')) closeImMoreOvl(ovl);
            });
        }
    }

    function initInbox() {
        var chips = Array.prototype.slice.call(document.querySelectorAll('#imlTabs .t[data-filter]'));
        var searchInput = document.getElementById('msgSearchInput');
        var btnMsgNavSearch = document.getElementById('btnMsgNavSearch');
        var chatItems = Array.prototype.slice.call(document.querySelectorAll('.chat-item'));
        var cntAll = document.getElementById('imlCntAll');
        var cntDm = document.getElementById('imlCntDm');
        var cntGroup = document.getElementById('imlCntGroup');
        var curFilter = 'all';
        var ovlAddContact = document.getElementById('ovlAddContact');
        var ovlCreateGroup = document.getElementById('ovlCreateGroup');
        var btnAddContact = document.getElementById('btnAddContact');
        var btnCreateGroup = document.getElementById('btnCreateGroup');
        var btnAddContactIcon = document.getElementById('btnAddContactIcon');
        var btnCreateGroupIcon = document.getElementById('btnCreateGroupIcon');
        var imlUnreadHead = document.getElementById('imlUnreadHead');
        var btnCloseAddContact = document.getElementById('btnCloseAddContact');
        var btnCloseCreateGroup = document.getElementById('btnCloseCreateGroup');
        var btnCancelCreateGroup = document.getElementById('btnCancelCreateGroup');
        var addContactSearch = document.getElementById('addContactSearch');
        var addContactList = document.getElementById('addContactList');
        var groupMemberSearch = document.getElementById('groupMemberSearch');
        var groupMemberList = document.getElementById('groupMemberList');
        var groupNameInput = document.getElementById('groupNameInput');
        var btnConfirmCreateGroup = document.getElementById('btnConfirmCreateGroup');
        var selectedGroupMembers = {};

        function closeOverlay(ovl) {
            if (ovl) ovl.classList.remove('show');
        }
        function openOverlay(ovl) {
            if (ovl) ovl.classList.add('show');
        }
        function mutualContacts() {
            return CONTACTS.filter(function (c) {
                var r = DM_REL[c.name];
                return !!(r && r.mutual);
            });
        }
        function renderContactList(list, q, clickable) {
            var key = String(q || '').trim().toLowerCase();
            var rows = list.filter(function (c) { return !key || c.name.toLowerCase().indexOf(key) >= 0; });
            if (!rows.length) {
                return '<div style="padding:10px 2px;color:var(--text-tertiary);font-size:11px">暂无匹配的互关好友</div>';
            }
            return rows.map(function (c) {
                if (clickable) {
                    return '<button type="button" class="msg-c-row" data-add-name="' + c.name + '" style="width:100%;background:transparent;border:0;text-align:left">' +
                        '<img class="avatar avatar-sm" src="' + c.av + '">' +
                        '<span class="name-wrap"><span class="name">' + c.name + '</span><span class="nick">' + (c.nick || '') + '</span></span>' +
                        '<span class="subtag">互相关注</span>' +
                        '</button>';
                }
                var checked = selectedGroupMembers[c.name] ? 'checked' : '';
                return '<label class="msg-c-row">' +
                    '<img class="avatar avatar-sm" src="' + c.av + '">' +
                    '<span class="name-wrap"><span class="name">' + c.name + '</span><span class="nick">' + (c.nick || '') + '</span></span>' +
                    '<input type="checkbox" data-group-name="' + c.name + '" ' + checked + '>' +
                    '</label>';
            }).join('');
        }
        function refreshAddContacts() {
            if (!addContactList) return;
            addContactList.innerHTML = renderContactList(mutualContacts(), addContactSearch && addContactSearch.value, true);
        }
        function refreshGroupMembers() {
            if (!groupMemberList) return;
            groupMemberList.innerHTML = renderContactList(CONTACTS, groupMemberSearch && groupMemberSearch.value, false);
        }

        function chatTypeMatchesTab(cat, tab) {
            if (cat === 'hub') return tab === 'all' || tab === 'group';
            if (tab === 'all') return true;
            if (tab === 'dm') return cat === 'dm';
            if (tab === 'group') return cat === 'group';
            return cat === tab;
        }

        function unreadSumByType(type) {
            var sum = 0;
            chatItems.forEach(function (row) {
                var cat = row.getAttribute('data-chat-type') || 'dm';
                if (!chatTypeMatchesTab(cat, type)) return;
                var b = row.querySelector('.unread');
                var n = b ? Number((b.textContent || '').trim()) : 0;
                if (n > 0) sum += n;
            });
            return sum;
        }
        function setTabCnt(el, n) {
            if (!el) return;
            el.textContent = String(n);
            el.style.display = n > 0 ? '' : 'none';
        }
        function updateTabUnreadCounts() {
            var all = unreadSumByType('all');
            setTabCnt(cntAll, all);
            setTabCnt(cntDm, unreadSumByType('dm'));
            setTabCnt(cntGroup, unreadSumByType('group'));
            if (imlUnreadHead) {
                imlUnreadHead.textContent = all > 0 ? all + ' 未读' : '暂无未读';
                imlUnreadHead.style.display = all > 0 ? '' : 'none';
            }
        }
        function applyFilter() {
            var q = String(searchInput && searchInput.value || '').trim().toLowerCase();
            chatItems.forEach(function (row) {
                var cat = row.getAttribute('data-chat-type') || 'dm';
                var name = (row.querySelector('.name') ? row.querySelector('.name').textContent : '').toLowerCase();
                var msg = (row.getAttribute('data-text') || row.querySelector('.msg') && row.querySelector('.msg').textContent || '').toLowerCase();
                var catOk = chatTypeMatchesTab(cat, curFilter);
                var qOk = !q || name.indexOf(q) >= 0 || msg.indexOf(q) >= 0;
                row.style.display = (catOk && qOk) ? '' : 'none';
            });
            updateTabUnreadCounts();
        }
        applyInboxRemarks();
        applyInboxMutes();
        document.querySelectorAll('.chat-item[data-peer]').forEach(function (item) {
            item.style.cursor = 'pointer';
            item.addEventListener('click', function () {
                location.href = 'messages-chat.html?peer=' + encodeURIComponent(item.getAttribute('data-peer'));
            });
        });
        chips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                chips.forEach(function (c) { c.classList.remove('active'); });
                chip.classList.add('active');
                curFilter = chip.getAttribute('data-filter') || 'all';
                applyFilter();
            });
        });
        if (searchInput) {
            searchInput.addEventListener('input', applyFilter);
        }
        if (btnMsgNavSearch && searchInput) {
            btnMsgNavSearch.addEventListener('click', function (e) {
                e.preventDefault();
                searchInput.focus();
                try { searchInput.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (err) { /* noop */ }
            });
        }
        function openAddContact() {
            openOverlay(ovlAddContact);
            refreshAddContacts();
        }
        function openCreateGroup() {
            openOverlay(ovlCreateGroup);
            refreshGroupMembers();
        }
        if (btnAddContact) btnAddContact.addEventListener('click', openAddContact);
        if (btnAddContactIcon) btnAddContactIcon.addEventListener('click', openAddContact);
        if (btnCreateGroup) btnCreateGroup.addEventListener('click', openCreateGroup);
        if (btnCreateGroupIcon) btnCreateGroupIcon.addEventListener('click', openCreateGroup);
        if (btnCloseAddContact) btnCloseAddContact.addEventListener('click', function () { closeOverlay(ovlAddContact); });
        if (btnCloseCreateGroup) btnCloseCreateGroup.addEventListener('click', function () { closeOverlay(ovlCreateGroup); });
        if (btnCancelCreateGroup) btnCancelCreateGroup.addEventListener('click', function () { closeOverlay(ovlCreateGroup); });
        if (ovlAddContact) ovlAddContact.addEventListener('click', function (e) { if (e.target === ovlAddContact) closeOverlay(ovlAddContact); });
        if (ovlCreateGroup) ovlCreateGroup.addEventListener('click', function (e) { if (e.target === ovlCreateGroup) closeOverlay(ovlCreateGroup); });
        if (addContactSearch) addContactSearch.addEventListener('input', refreshAddContacts);
        if (groupMemberSearch) groupMemberSearch.addEventListener('input', refreshGroupMembers);
        if (addContactList) {
            addContactList.addEventListener('click', function (e) {
                var row = e.target.closest('[data-add-name]');
                if (!row) return;
                var name = row.getAttribute('data-add-name');
                closeOverlay(ovlAddContact);
                toast('已打开与「' + name + '」的会话');
                location.href = 'messages-chat.html?peer=' + encodeURIComponent(name);
            });
        }
        if (groupMemberList) {
            groupMemberList.addEventListener('change', function (e) {
                var ck = e.target.closest('[data-group-name]');
                if (!ck) return;
                selectedGroupMembers[ck.getAttribute('data-group-name')] = !!ck.checked;
            });
        }
        if (btnConfirmCreateGroup) {
            btnConfirmCreateGroup.addEventListener('click', function () {
                var names = Object.keys(selectedGroupMembers).filter(function (k) { return selectedGroupMembers[k]; });
                var gName = (groupNameInput && groupNameInput.value || '').trim() || '新群聊';
                if (!names.length) {
                    toast('请至少选择 1 位成员');
                    return;
                }
                closeOverlay(ovlCreateGroup);
                toast('已创建群聊：' + gName);
            });
        }
        syncGroupHubOnMessagesPage();
        applyFilter();
    }

    function initGroupInbox() {
        var listEl = document.getElementById('giList');
        var searchInp = document.getElementById('giSearch');
        var navCount = document.getElementById('giNavCount');
        var list = loadGroupInbox();

        function toast(msg) {
            if (window.DigitalH5Nav && DigitalH5Nav.toast) DigitalH5Nav.toast(msg);
            else alert(msg);
        }

        function render() {
            if (navCount) navCount.textContent = list.length ? '(' + list.length + ')' : '';
            if (!listEl) return;
            var q = String(searchInp && searchInp.value || '').trim().toLowerCase();
            var filtered = list.filter(function (n) {
                if (!q) return true;
                var blob = (n.groupName + ' ' + n.host + ' ' + n.preview).toLowerCase();
                return blob.indexOf(q) >= 0;
            });
            if (!filtered.length) {
                listEl.innerHTML = '<div class="gi-empty"><i class="fa-regular fa-folder-open" style="font-size:28px;display:block;margin-bottom:10px;opacity:0.45"></i>暂无进群邀请</div>';
                return;
            }
            listEl.innerHTML = filtered.map(function (n) {
                return '<div class="gi-item" data-gi-id="' + n.id + '">' +
                    '<div class="av"><i class="fa-solid fa-users"></i></div>' +
                    '<div class="body">' +
                    '<div class="name">' + n.groupName + '</div>' +
                    '<div class="sub">' + n.preview + '</div>' +
                    '<div class="meta">' + n.host + ' · ' + n.members + ' 人 · ' + n.time + '</div>' +
                    '</div>' +
                    '<div class="acts">' +
                    '<button type="button" data-gi-reject="' + n.id + '">拒绝</button>' +
                    '<button type="button" class="ok" data-gi-accept="' + n.id + '">同意</button>' +
                    '</div></div>';
            }).join('');
        }

        function removeById(id) {
            list = list.filter(function (n) { return n.id !== id; });
            saveGroupInbox(list);
            render();
        }

        if (listEl) {
            listEl.addEventListener('click', function (e) {
                var accept = e.target.closest('[data-gi-accept]');
                var reject = e.target.closest('[data-gi-reject]');
                if (accept) {
                    var idA = accept.getAttribute('data-gi-accept');
                    var item = list.filter(function (n) { return n.id === idA; })[0];
                    removeById(idA);
                    toast(item ? '已加入「' + item.groupName + '」' : '已同意');
                    return;
                }
                if (reject) {
                    removeById(reject.getAttribute('data-gi-reject'));
                    toast('已拒绝');
                }
            });
        }
        if (searchInp) searchInp.addEventListener('input', render);
        document.getElementById('giRejectAll')?.addEventListener('click', function () {
            if (!list.length) { toast('暂无待处理邀请'); return; }
            if (!window.confirm('拒绝全部 ' + list.length + ' 条进群邀请？')) return;
            list = [];
            saveGroupInbox(list);
            render();
            toast('已全部拒绝');
        });
        document.getElementById('giAcceptAll')?.addEventListener('click', function () {
            if (!list.length) { toast('暂无待处理邀请'); return; }
            var n = list.length;
            list = [];
            saveGroupInbox(list);
            render();
            toast('已同意 ' + n + ' 条邀请');
        });
        render();
    }

    function initChat() {
        var m = /[?&]peer=([^&]+)/.exec(location.search);
        var gm = /[?&]group=([^&]+)/.exec(location.search);
        var name = m ? decodeURIComponent(m[1]) : 'Luna';
        var groupSlug = gm ? decodeURIComponent(gm[1]) : '';
        var groupTitles = {
            'kyoto-creators': '京都创作交流群',
            'gf-creators': 'GOODFANS 创作者互助',
            'luna-fans': 'Luna 粉丝后援会'
        };
        var isGroup = !!groupSlug;
        var data = isGroup
            ? { av: '', messages: [{ from: 'them', text: '欢迎加入群聊', time: '刚刚' }] }
            : (PEERS[name] || { av: '', messages: [{ from: 'them', text: '开始新对话', time: '刚刚' }] });
        var rel = isGroup ? { mutual: true, subscribed: false } : (DM_REL[name] || { mutual: false, subscribed: false });
        var dmLimited = !isGroup && !rel.mutual && !rel.subscribed;

        var title = document.getElementById('chatTitle');
        var headAv = document.getElementById('chatHeadAv');
        var headProfile = document.getElementById('chatHeadProfile');
        var displayName = isGroup ? (groupTitles[groupSlug] || '群聊') : name;
        var threadKey = threadRemarkKey(isGroup, name, groupSlug);

        function applyChatHeaderRemark() {
            var remark = getThreadRemark(threadKey);
            var primary = remark || displayName;
            if (title) {
                if (remark) {
                    title.innerHTML = escHtml(primary) +
                        ' <span class="chat-head-sub">(' + escHtml(displayName) + ')</span>';
                } else {
                    title.textContent = primary;
                }
            }
            var callNameEl = document.getElementById('mobCallName');
            if (callNameEl) callNameEl.textContent = primary;
        }
        initMobRemarkModal();
        applyChatHeaderRemark();
        if (headAv) {
            if (isGroup) {
                headAv.src = 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&q=80';
            } else {
                headAv.src = data.av || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80';
            }
        }
        var limitBanner = document.getElementById('mobDmLimitBanner');
        var limitText = document.getElementById('mobDmLimitText');
        var sentCount = 0;
        var hasReply = false;
        data.messages.forEach(function (m) {
            if (m.from === 'me') sentCount += 1;
            if (m.from === 'them') hasReply = true;
        });
        function syncLimitBanner() {
            if (!limitBanner) return;
            if (!dmLimited) {
                limitBanner.hidden = true;
                return;
            }
            var locked = sentCount >= 1 && !hasReply;
            limitBanner.hidden = false;
            if (limitText) {
                limitText.textContent = locked
                    ? '你已发送首条私信，当前不可继续发送；互关、订阅或对方回复后可解除限制。'
                    : '未互关且未订阅时，仅可发送首条私信；互关、订阅或对方回复后解除限制。';
            }
        }

        var list = document.getElementById('mobMsgList');
        if (!list) return;

        function callLogCopy(msg) {
            var kindLabel = msg.callKind === 'video' ? '视频通话' : '语音通话';
            var st = msg.callStatus;
            if (st === 'ended') {
                return { title: kindLabel, sub: msg.duration ? ('通话时长 ' + msg.duration) : '通话已结束' };
            }
            if (st === 'missed') {
                return { title: kindLabel, sub: msg.from === 'me' ? '对方未接听' : '未接听' };
            }
            if (st === 'rejected') {
                return { title: kindLabel, sub: '已拒绝' };
            }
            if (st === 'declined') {
                return { title: kindLabel, sub: '对方已拒绝' };
            }
            if (st === 'cancelled') {
                return { title: kindLabel, sub: '已取消' };
            }
            return { title: kindLabel, sub: '通话记录' };
        }

        function renderCallLogHtml(msg) {
            var side = msg.from === 'me' ? ' me' : '';
            var copy = callLogCopy(msg);
            var ic = msg.callKind === 'video' ? 'fa-video' : 'fa-phone';
            var icCls = msg.callKind === 'video' ? 'video' : 'voice';
            var stateCls = 'state-' + (msg.callStatus || 'ended');
            var searchKey = (copy.title + ' ' + copy.sub).toLowerCase();
            return '<div class="mob-call-log' + side + ' ' + stateCls + '" data-msg-text="' + searchKey + '">' +
                '<div class="inner"><span class="ic ' + icCls + '"><i class="fa-solid ' + ic + '"></i></span>' +
                '<div class="txt"><div class="t">' + copy.title + '</div><div class="s">' + copy.sub + '</div></div></div>' +
                '<div class="time">' + msg.time + '</div></div>';
        }

        function renderBubbleHtml(msg) {
            if (msg.type === 'call') return renderCallLogHtml(msg);
            var cls = 'mob-bub' + (msg.from === 'me' ? ' me' : '');
            var textKey = (msg.text || '').toLowerCase();
            if (msg.image) {
                var src = msg.imageSrc || 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400';
                return '<div class="' + cls + '" data-msg-text="' + textKey + '"><img src="' + src + '" style="max-width:200px;border-radius:12px;display:block"><div style="font-size:11px;margin-top:4px;opacity:0.7">' + msg.time + '</div></div>';
            }
            return '<div class="' + cls + '" data-msg-text="' + textKey + '">' + msg.text + '<div style="font-size:11px;margin-top:4px;opacity:0.7">' + msg.time + '</div></div>';
        }

        function appendCallLog(callKind, callStatus, from, duration) {
            var timeLabel = '刚刚';
            var msg = { type: 'call', from: from, callKind: callKind, callStatus: callStatus, time: timeLabel };
            if (duration) msg.duration = duration;
            var el = document.createElement('div');
            el.innerHTML = renderCallLogHtml(msg);
            list.appendChild(el.firstChild);
            list.scrollTop = list.scrollHeight;
        }

        list.innerHTML = data.messages.map(renderBubbleHtml).join('');

        if (/[?&]shared=creator(?:&|$)/.test(location.search)) {
            var preview = null;
            try { preview = JSON.parse(sessionStorage.getItem('gf_creator_preview') || 'null'); } catch (e) { preview = null; }
            var cardTitle = (preview && preview.title) || '创作者主页';
            var cardHandle = (preview && preview.handle) ? ('@' + String(preview.handle).replace(/^@/, '')) : '@luna_web3';
            var cardCover = (preview && preview.cover) || (preview && preview.avatar) || 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&q=80';
            var cardAv = (preview && preview.avatar) || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80';
            var card = document.createElement('div');
            card.className = 'mob-bub me';
            card.innerHTML =
                '<div data-share-card="1" data-share-title="' + cardTitle.replace(/"/g, '&quot;') + '" data-share-sub="' + cardHandle.replace(/"/g, '&quot;') + '" data-share-cover="' + cardCover.replace(/"/g, '&quot;') + '" style="border:1px solid var(--border-color);border-radius:12px;overflow:hidden;max-width:240px;background:var(--bg-card)">' +
                '<div style="height:72px;background-size:cover;background-position:center;background-image:url(\'' + cardCover + '\')"></div>' +
                '<div style="padding:8px 10px;display:flex;gap:8px;align-items:center">' +
                '<img src="' + cardAv + '" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover">' +
                '<div style="min-width:0"><div style="font-size:12px;font-weight:700">' + cardTitle + '</div>' +
                '<div style="font-size:10px;color:var(--text-tertiary)">' + cardHandle + '</div></div></div></div>' +
                '<div style="font-size:11px;margin-top:4px;opacity:0.7">刚刚 · 已分享卡片</div>';
            list.appendChild(card);
            list.scrollTop = list.scrollHeight;
            sentCount += 1;
        }

        var input = document.getElementById('mobChatInput');
        var send = document.getElementById('mobChatSend');
        function toast(msg) {
            if (window.DigitalH5Nav && typeof window.DigitalH5Nav.toast === 'function') {
                window.DigitalH5Nav.toast(msg);
                return;
            }
            alert(msg);
        }
        function openPeerProfile() {
            if (isGroup) {
                toast('群资料页演示');
                return;
            }
            location.href = 'creator-profile.html?u=' + encodeURIComponent(peerProfileSlug(name)) + '&from=messages-chat';
        }
        if (headProfile) {
            headProfile.addEventListener('click', openPeerProfile);
            headProfile.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openPeerProfile();
                }
            });
        }
        function sendMsg() {
            var t = (input && input.value || '').trim();
            if (!t) return;
            if (dmLimited && sentCount >= 1 && !hasReply) {
                toast('当前仅可发送首条私信，请等待对方回复或先互关/订阅');
                syncLimitBanner();
                return;
            }
            var bub = document.createElement('div');
            bub.className = 'mob-bub me';
            bub.setAttribute('data-msg-text', t.toLowerCase());
            bub.innerHTML = t + '<div style="font-size:11px;margin-top:4px;opacity:0.7">刚刚</div>';
            list.appendChild(bub);
            input.value = '';
            list.scrollTop = list.scrollHeight;
            sentCount += 1;
            syncLimitBanner();
            if (dmLimited) return;
            setTimeout(function () {
                var r = document.createElement('div');
                r.className = 'mob-bub';
                r.innerHTML = '收到啦～<div style="font-size:11px;margin-top:4px;opacity:0.7">刚刚</div>';
                list.appendChild(r);
                list.scrollTop = list.scrollHeight;
                hasReply = true;
                syncLimitBanner();
            }, 1500);
        }
        if (send) send.addEventListener('click', sendMsg);
        if (input) input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
        });

        document.getElementById('mobBtnVoice')?.addEventListener('click', function () {
            toast('按住说话（原型演示）');
        });

        var searchPanel = document.getElementById('mobChatSearchPanel');
        var searchInput = document.getElementById('mobChatSearchInput');
        var searchHint = document.getElementById('mobChatSearchHint');
        var searchOpen = false;
        function applyChatSearch(q) {
            q = String(q || '').trim().toLowerCase();
            var bubs = list.querySelectorAll('.mob-bub, .mob-call-log');
            var hits = 0;
            bubs.forEach(function (b) {
                var txt = b.getAttribute('data-msg-text') || b.textContent.toLowerCase();
                var ok = !q || txt.indexOf(q) >= 0;
                b.classList.toggle('is-dim', !!q && !ok);
                b.classList.toggle('is-hit', !!q && ok);
                if (ok && q) hits += 1;
            });
            if (searchHint) {
                searchHint.textContent = !q
                    ? '输入关键词高亮匹配消息'
                    : (hits ? '找到 ' + hits + ' 条相关消息' : '无匹配结果');
            }
        }
        document.getElementById('mobBtnChatSearch')?.addEventListener('click', function () {
            searchOpen = !searchOpen;
            if (searchPanel) searchPanel.classList.toggle('show', searchOpen);
            if (searchOpen && searchInput) {
                searchInput.focus();
            } else if (searchInput) {
                searchInput.value = '';
                applyChatSearch('');
            }
        });
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                applyChatSearch(searchInput.value);
            });
        }

        var callOvl = document.getElementById('mobCallOvl');
        var callAv = document.getElementById('mobCallAv');
        var callName = document.getElementById('mobCallName');
        var callStatus = document.getElementById('mobCallStatus');
        var callTimer = document.getElementById('mobCallTimer');
        var callAvWrap = document.getElementById('mobCallAvWrap');
        var callVideoPreview = document.getElementById('mobCallVideoPreview');
        var callOutgoing = document.getElementById('mobCallOutgoing');
        var callIncoming = document.getElementById('mobCallIncoming');
        var callActive = document.getElementById('mobCallActive');
        var callSession = {
            kind: 'voice',
            mode: 'outgoing',
            timerId: null,
            ringId: null,
            seconds: 0,
            incomingFrom: 'them',
            micMuted: false,
            videoOn: true,
            camFront: true,
            speakerOn: false
        };
        var LOCAL_CAM_A = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80';
        var LOCAL_CAM_B = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80';
        var callLocalTag = document.getElementById('mobCallLocalTag');
        var callRemotePip = document.getElementById('mobCallRemotePip');
        var callRingMute = document.getElementById('mobCallRingMute');
        var callRingCam = document.getElementById('mobCallRingCam');
        var callInMute = document.getElementById('mobCallInMute');
        var callInCam = document.getElementById('mobCallInCam');
        var callCamBtn = document.getElementById('mobCallCam');
        var callFlipBtn = document.getElementById('mobCallFlip');
        var callMuteBtn = document.getElementById('mobCallMute');
        var callSpeakerBtn = document.getElementById('mobCallSpeaker');

        function formatCallTimer(sec) {
            var m = Math.floor(sec / 60);
            var s = sec % 60;
            return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
        }

        function syncMicToggleBtn(btn, muted) {
            if (!btn) return;
            btn.classList.toggle('is-off', muted);
            btn.classList.toggle('is-on', !muted);
            var ic = btn.querySelector('i');
            if (ic) ic.className = muted ? 'fa-solid fa-microphone-slash' : 'fa-solid fa-microphone';
            var lbl = btn.querySelector('.lbl');
            if (lbl) lbl.textContent = muted ? '已静音' : (btn.id === 'mobCallMute' ? '静音' : '麦克风');
        }

        function syncCamToggleBtn(btn, on) {
            if (!btn) return;
            btn.classList.toggle('is-off', !on);
            btn.classList.toggle('is-on', on);
            var ic = btn.querySelector('i');
            if (ic) ic.className = on ? 'fa-solid fa-video' : 'fa-solid fa-video-slash';
            var lbl = btn.querySelector('.lbl');
            if (lbl) lbl.textContent = on ? '摄像头' : '已关闭';
        }

        function syncSpeakerBtn(on) {
            if (!callSpeakerBtn) return;
            callSpeakerBtn.classList.toggle('is-on', on);
            var ic = callSpeakerBtn.querySelector('i');
            if (ic) ic.className = on ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        }

        function applyCallMediaUi() {
            var isVideo = callSession.kind === 'video';
            var ringing = callSession.mode === 'outgoing' || callSession.mode === 'incoming';
            [callRingMute, callRingCam, callInMute, callInCam].forEach(function (el) {
                if (!el) return;
                el.hidden = !(isVideo && ringing);
            });
            if (callCamBtn) callCamBtn.hidden = !(isVideo && callSession.mode === 'active');
            if (callFlipBtn) callFlipBtn.hidden = !(isVideo && callSession.mode === 'active');
            if (callSpeakerBtn) callSpeakerBtn.hidden = isVideo && callSession.mode === 'active';

            syncMicToggleBtn(callMuteBtn, callSession.micMuted);
            syncMicToggleBtn(callRingMute, callSession.micMuted);
            syncMicToggleBtn(callInMute, callSession.micMuted);
            syncCamToggleBtn(callRingCam, callSession.videoOn);
            syncCamToggleBtn(callInCam, callSession.videoOn);
            syncCamToggleBtn(callCamBtn, callSession.videoOn);
            syncSpeakerBtn(callSession.speakerOn);

            var avSrc = (headAv && headAv.src) || data.av || '';
            var localCam = callSession.camFront ? LOCAL_CAM_A : LOCAL_CAM_B;

            if (callVideoPreview) {
                if (!isVideo) {
                    callVideoPreview.hidden = true;
                    callVideoPreview.classList.remove('is-cam-off');
                } else {
                    callVideoPreview.hidden = false;
                    callVideoPreview.classList.toggle('is-cam-off', !callSession.videoOn);
                    if (callSession.videoOn) {
                        callVideoPreview.style.backgroundImage = "url('" + localCam + "')";
                    } else if (avSrc) {
                        callVideoPreview.style.backgroundImage = "url('" + avSrc + "')";
                    }
                }
            }
            if (callLocalTag) {
                callLocalTag.hidden = !(isVideo && ringing && callSession.videoOn);
            }
            if (callRemotePip) {
                var showPip = isVideo && callSession.mode === 'active' && callSession.videoOn && avSrc;
                callRemotePip.hidden = !showPip;
                if (showPip) callRemotePip.style.backgroundImage = "url('" + avSrc + "')";
            }
            if (callAvWrap) {
                var hideAv = isVideo && callSession.videoOn && (ringing || callSession.mode === 'active');
                callAvWrap.hidden = hideAv;
            }
        }

        function toggleCallMic() {
            callSession.micMuted = !callSession.micMuted;
            applyCallMediaUi();
            toast(callSession.micMuted ? '麦克风已关闭' : '麦克风已开启');
        }

        function toggleCallVideo() {
            if (callSession.kind !== 'video') return;
            callSession.videoOn = !callSession.videoOn;
            applyCallMediaUi();
            toast(callSession.videoOn ? '摄像头已开启' : '摄像头已关闭');
        }

        function toggleCallSpeaker() {
            callSession.speakerOn = !callSession.speakerOn;
            applyCallMediaUi();
            toast(callSession.speakerOn ? '扬声器已开启' : '听筒播放');
        }

        function flipCallCamera() {
            if (callSession.kind !== 'video') return;
            callSession.camFront = !callSession.camFront;
            applyCallMediaUi();
            toast(callSession.camFront ? '已切换前置摄像头' : '已切换后置摄像头');
        }

        function setCallUiMode(mode) {
            callSession.mode = mode;
            if (callOvl) callOvl.setAttribute('data-mode', mode);
            if (callOutgoing) callOutgoing.hidden = mode !== 'outgoing';
            if (callIncoming) callIncoming.hidden = mode !== 'incoming';
            if (callActive) callActive.hidden = mode !== 'active';
            if (callAvWrap) callAvWrap.classList.toggle('pulse', mode === 'outgoing' || mode === 'incoming');
            if (callTimer) callTimer.hidden = mode !== 'active';
            applyCallMediaUi();
        }

        function clearCallTimers() {
            if (callSession.timerId) {
                clearInterval(callSession.timerId);
                callSession.timerId = null;
            }
            if (callSession.ringId) {
                clearTimeout(callSession.ringId);
                callSession.ringId = null;
            }
        }

        function closeCallOvl() {
            clearCallTimers();
            if (callOvl) {
                callOvl.classList.remove('open');
                callOvl.setAttribute('aria-hidden', 'true');
            }
            if (callVideoPreview) {
                callVideoPreview.hidden = true;
                callVideoPreview.classList.remove('is-cam-off');
            }
            if (callRemotePip) callRemotePip.hidden = true;
            if (callLocalTag) callLocalTag.hidden = true;
            document.body.style.overflow = '';
            callSession.seconds = 0;
            if (callTimer) callTimer.textContent = '00:00';
            callSession.micMuted = false;
            callSession.videoOn = true;
            callSession.camFront = true;
            callSession.speakerOn = false;
            if (callAvWrap) callAvWrap.hidden = false;
            setCallUiMode('outgoing');
            if (callStatus) callStatus.textContent = '';
        }

        function startCallTimer() {
            callSession.seconds = 0;
            if (callTimer) callTimer.textContent = '00:00';
            callSession.timerId = setInterval(function () {
                callSession.seconds += 1;
                if (callTimer) callTimer.textContent = formatCallTimer(callSession.seconds);
            }, 1000);
        }

        function openCallOverlay(kind, mode, statusText) {
            if (!callOvl || isGroup) return;
            callSession.kind = kind;
            setCallUiMode(mode);
            if (callOvl) {
                callOvl.setAttribute('data-kind', kind);
                callOvl.classList.add('open');
                callOvl.setAttribute('aria-hidden', 'false');
            }
            document.body.style.overflow = 'hidden';
            var avSrc = (headAv && headAv.src) || data.av || '';
            if (callAv) callAv.src = avSrc;
            if (callName) callName.textContent = getThreadRemark(threadKey) || displayName;
            if (callStatus) callStatus.textContent = statusText || '';
            applyCallMediaUi();
        }

        function enterActiveCall() {
            setCallUiMode('active');
            if (callStatus) callStatus.textContent = '';
            startCallTimer();
        }

        function endActiveCall() {
            var dur = formatCallTimer(Math.max(1, callSession.seconds));
            appendCallLog(callSession.kind, 'ended', 'me', dur);
            closeCallOvl();
        }

        function startOutgoingCall(kind) {
            if (isGroup) {
                toast('群聊暂不支持通话（演示）');
                return;
            }
            clearCallTimers();
            var label = kind === 'video' ? '正在视频呼叫…' : '正在语音呼叫…';
            openCallOverlay(kind, 'outgoing', label);
            callSession.ringId = setTimeout(function () {
                if (callSession.mode !== 'outgoing') return;
                if (callStatus) callStatus.textContent = '对方未接听';
                setTimeout(function () {
                    appendCallLog(kind, 'missed', 'me');
                    closeCallOvl();
                }, 800);
            }, 5000);
        }

        function showIncomingCall(kind) {
            if (isGroup || !callOvl) return;
            clearCallTimers();
            callSession.incomingFrom = 'them';
            var label = kind === 'video' ? '邀请你视频通话…' : '邀请你语音通话…';
            openCallOverlay(kind, 'incoming', label);
        }

        document.getElementById('mobBtnVideoCall')?.addEventListener('click', function () {
            startOutgoingCall('video');
        });
        document.getElementById('mobBtnVoiceCall')?.addEventListener('click', function () {
            startOutgoingCall('voice');
        });

        document.getElementById('mobCallCancel')?.addEventListener('click', function () {
            if (callSession.mode === 'outgoing') {
                appendCallLog(callSession.kind, 'cancelled', 'me');
            }
            closeCallOvl();
        });
        document.getElementById('mobCallReject')?.addEventListener('click', function () {
            appendCallLog(callSession.kind, 'rejected', 'me');
            closeCallOvl();
        });
        document.getElementById('mobCallAccept')?.addEventListener('click', function () {
            enterActiveCall();
        });
        document.getElementById('mobCallEnd')?.addEventListener('click', endActiveCall);
        callMuteBtn?.addEventListener('click', toggleCallMic);
        callRingMute?.addEventListener('click', toggleCallMic);
        callInMute?.addEventListener('click', toggleCallMic);
        callRingCam?.addEventListener('click', toggleCallVideo);
        callInCam?.addEventListener('click', toggleCallVideo);
        callCamBtn?.addEventListener('click', toggleCallVideo);
        callFlipBtn?.addEventListener('click', flipCallCamera);
        callSpeakerBtn?.addEventListener('click', toggleCallSpeaker);

        if (/[?&]incomingCall=(voice|video)(?:&|$)/.test(location.search)) {
            var incKind = /incomingCall=(video)/.test(location.search) ? 'video' : 'voice';
            setTimeout(function () { showIncomingCall(incKind); }, 400);
        }
        var muted = isThreadMuted(threadKey);
        var moreOvl = document.getElementById('mobChatMoreOvl');
        var moreTitle = document.getElementById('mobChatMoreTitle');
        var muteToggleBtn = document.getElementById('mobBtnMuteToggle');
        var mediaOvl = document.getElementById('mobChatMediaOvl');
        var mediaGrid = document.getElementById('mobChatMediaGrid');
        var mediaLinks = document.getElementById('mobChatMediaLinks');
        var mediaFiles = document.getElementById('mobChatMediaFiles');
        var mediaEmpty = document.getElementById('mobChatMediaEmpty');
        var mediaCount = document.getElementById('mobChatMediaCount');
        var mediaClose = document.getElementById('mobChatMediaClose');
        var mediaTab = 'all';
        var mediaStore = { images: [], links: [], files: [] };
        var mediaPreview = document.getElementById('mobChatMediaPreview');
        var mediaPreviewImg = document.getElementById('mobChatMediaPreviewImg');
        var mediaPreviewClose = document.getElementById('mobChatMediaPreviewClose');

        var DEMO_MEDIA_IMAGES = [
            'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400&q=80',
            'https://images.unsplash.com/photo-1542642745-f03d8e3aa54c?w=400&q=80',
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80'
        ];
        var DEMO_MEDIA_FILES = [
            { name: '订阅专属花絮.pdf', size: '2.4 MB', time: '2026-05-01' },
            { name: '拍摄清单.xlsx', size: '186 KB', time: '2026-04-28' }
        ];

        function syncMuteLabel() {
            if (!muteToggleBtn) return;
            muteToggleBtn.innerHTML = muted
                ? '<i class="fa-regular fa-bell"></i> 关闭免打扰'
                : '<i class="fa-regular fa-bell-slash"></i> 消息免打扰';
        }
        syncMuteLabel();

        function collectChatMedia() {
            var images = [];
            var links = [];
            list.querySelectorAll('.mob-bub img').forEach(function (img) {
                var src = img.getAttribute('src');
                if (src) images.push({ src: src, time: '' });
            });
            list.querySelectorAll('.mob-bub').forEach(function (bub) {
                var card = bub.querySelector('[data-share-card="1"]');
                if (!card) return;
                links.push({
                    title: card.getAttribute('data-share-title') || '分享卡片',
                    sub: card.getAttribute('data-share-sub') || '',
                    cover: card.getAttribute('data-share-cover') || ''
                });
            });
            if (!images.length) {
                DEMO_MEDIA_IMAGES.forEach(function (src) {
                    images.push({ src: src, time: '演示' });
                });
            }
            var files = DEMO_MEDIA_FILES.slice();
            return { images: images, links: links, files: files };
        }

        function openMediaPreview(src) {
            if (!mediaPreview || !mediaPreviewImg || !src) return;
            mediaPreviewImg.src = src;
            mediaPreview.classList.add('open');
            mediaPreview.setAttribute('aria-hidden', 'false');
        }
        function closeMediaPreview() {
            if (!mediaPreview) return;
            mediaPreview.classList.remove('open');
            mediaPreview.setAttribute('aria-hidden', 'true');
            if (mediaPreviewImg) mediaPreviewImg.removeAttribute('src');
        }

        function renderChatMediaView() {
            mediaStore = collectChatMedia();
            var total = mediaStore.images.length + mediaStore.links.length + mediaStore.files.length;
            if (mediaCount) {
                mediaCount.textContent = total
                    ? ('共 ' + total + ' 项 · 图片 ' + mediaStore.images.length + ' · 链接 ' + mediaStore.links.length + ' · 文件 ' + mediaStore.files.length)
                    : '暂无文件';
            }

            var showGrid = mediaTab === 'all' || mediaTab === 'image';
            var showLinks = mediaTab === 'all' || mediaTab === 'link';
            var showFiles = mediaTab === 'all' || mediaTab === 'file';
            var imgs = mediaTab === 'image' ? mediaStore.images : (mediaTab === 'all' ? mediaStore.images : []);
            var lnks = mediaTab === 'link' ? mediaStore.links : (mediaTab === 'all' ? mediaStore.links : []);
            var fls = mediaTab === 'file' ? mediaStore.files : (mediaTab === 'all' ? mediaStore.files : []);

            if (mediaGrid) {
                if (showGrid && imgs.length) {
                    mediaGrid.hidden = false;
                    mediaGrid.innerHTML = imgs.map(function (item) {
                        var src = item.src;
                        return '<button type="button" class="thumb" data-media-src="' + src.replace(/"/g, '&quot;') + '" style="background-image:url(\'' + src.replace(/'/g, '%27') + '\')" aria-label="查看图片"></button>';
                    }).join('');
                } else {
                    mediaGrid.hidden = true;
                    mediaGrid.innerHTML = '';
                }
            }
            if (mediaLinks) {
                if (showLinks && lnks.length) {
                    mediaLinks.hidden = false;
                    mediaLinks.innerHTML = lnks.map(function (item) {
                        var cover = item.cover ? ' style="background-image:url(\'' + item.cover.replace(/'/g, '%27') + '\')"' : '';
                        return '<button type="button" class="im-media-link-row" data-media-link="1">' +
                            '<span class="cover"' + cover + '></span>' +
                            '<span class="meta"><span class="n">' + item.title + '</span><span class="s">' + (item.sub || '分享卡片') + '</span></span>' +
                            '<i class="fa-solid fa-chevron-right" style="color:var(--text-tertiary);font-size:12px"></i></button>';
                    }).join('');
                } else {
                    mediaLinks.hidden = true;
                    mediaLinks.innerHTML = '';
                }
            }
            if (mediaFiles) {
                if (showFiles && fls.length) {
                    mediaFiles.hidden = false;
                    mediaFiles.innerHTML = fls.map(function (item) {
                        return '<div class="im-media-file-row">' +
                            '<i class="fa-regular fa-file-lines"></i>' +
                            '<div class="meta"><div class="n">' + item.name + '</div><div class="s">' + item.size + ' · ' + item.time + '</div></div>' +
                            '<button type="button" class="im-media-dl" aria-label="下载演示" style="border:none;background:transparent;color:#c084fc;font-size:18px;padding:4px"><i class="fa-solid fa-download"></i></button></div>';
                    }).join('');
                } else {
                    mediaFiles.hidden = true;
                    mediaFiles.innerHTML = '';
                }
            }

            var empty = false;
            if (mediaTab === 'image') empty = !imgs.length;
            else if (mediaTab === 'link') empty = !lnks.length;
            else if (mediaTab === 'file') empty = !fls.length;
            else empty = !imgs.length && !lnks.length && !fls.length;
            if (mediaEmpty) mediaEmpty.hidden = !empty;

            if (mediaGrid && !mediaGrid.hidden) {
                mediaGrid.querySelectorAll('.thumb[data-media-src]').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        openMediaPreview(btn.getAttribute('data-media-src'));
                    });
                });
            }
            if (mediaLinks && !mediaLinks.hidden) {
                mediaLinks.querySelectorAll('[data-media-link]').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        toast('打开分享卡片（演示）');
                    });
                });
            }
            if (mediaFiles && !mediaFiles.hidden) {
                mediaFiles.querySelectorAll('.im-media-dl').forEach(function (btn) {
                    btn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        toast('已开始下载（演示）');
                    });
                });
            }
        }

        function setMediaTab(tab) {
            mediaTab = tab || 'all';
            var tabs = mediaOvl ? mediaOvl.querySelectorAll('.im-media-tabs button[data-media-tab]') : [];
            tabs.forEach(function (btn) {
                var on = btn.getAttribute('data-media-tab') === mediaTab;
                btn.classList.toggle('active', on);
                btn.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            renderChatMediaView();
        }

        function openMediaPanel() {
            closeMediaPreview();
            mediaTab = 'all';
            setMediaTab('all');
            if (mediaOvl) {
                mediaOvl.classList.add('open');
                mediaOvl.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
            }
        }
        function closeMediaPanel() {
            closeMediaPreview();
            if (mediaOvl) {
                mediaOvl.classList.remove('open');
                mediaOvl.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        }
        if (mediaClose) mediaClose.addEventListener('click', closeMediaPanel);
        if (mediaPreviewClose) mediaPreviewClose.addEventListener('click', closeMediaPreview);
        if (mediaPreview) {
            mediaPreview.addEventListener('click', function (e) {
                if (e.target === mediaPreview || e.target === mediaPreviewImg) closeMediaPreview();
            });
        }
        if (mediaOvl) {
            mediaOvl.querySelectorAll('.im-media-tabs button[data-media-tab]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    setMediaTab(btn.getAttribute('data-media-tab'));
                });
            });
            mediaOvl.addEventListener('click', function (e) {
                if (e.target === mediaOvl) closeMediaPanel();
            });
            mediaOvl.querySelector('.im-media-panel')?.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        }
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            if (mediaPreview && mediaPreview.classList.contains('open')) {
                closeMediaPreview();
                return;
            }
            if (mediaOvl && mediaOvl.classList.contains('open')) closeMediaPanel();
        });

        document.getElementById('mobBtnChatMore')?.addEventListener('click', function () {
            if (moreTitle) moreTitle.textContent = isGroup ? displayName : ('与「' + displayName + '」聊天');
            syncMuteLabel();
            openImMoreOvl(moreOvl);
        });
        bindImMoreSheet(moreOvl, document.getElementById('mobChatMoreClose'), function (act) {
            if (act === 'profile') openPeerProfile();
            else if (act === 'media') openMediaPanel();
            else if (act === 'search') {
                searchOpen = true;
                if (searchPanel) searchPanel.classList.add('show');
                if (searchInput) searchInput.focus();
            } else if (act === 'mute') {
                muted = !muted;
                setThreadMuted(threadKey, muted);
                syncMuteLabel();
                toast(muted ? '已开启免打扰，列表将显示免打扰图标' : '已关闭消息免打扰');
            } else if (act === 'remark') {
                openMobRemarkModal({
                    isGroup: isGroup,
                    threadKey: threadKey,
                    originalName: displayName,
                    currentRemark: getThreadRemark(threadKey),
                    onSaved: function () {
                        applyChatHeaderRemark();
                    }
                });
            } else if (act === 'clear') {
                if (window.confirm('清空与该用户的聊天记录？')) {
                    list.innerHTML = '';
                    toast('聊天记录已清空');
                }
            } else if (act === 'delete') {
                if (window.confirm('删除该会话？')) {
                    toast('会话已删除（演示）');
                    location.href = 'messages.html';
                }
            } else if (act === 'report') toast('举报已提交（演示）');
        });

        var emojiPanel = document.getElementById('mobEmojiPanel');
        var emojiOpen = false;
        if (emojiPanel) {
            emojiPanel.innerHTML = MOB_EMOJIS.map(function (em) {
                return '<button type="button" data-em="' + em + '">' + em + '</button>';
            }).join('');
            emojiPanel.addEventListener('click', function (e) {
                var btn = e.target.closest('button[data-em]');
                if (!btn || !input) return;
                input.value += btn.getAttribute('data-em');
                input.focus();
            });
        }
        document.getElementById('mobBtnEmoji')?.addEventListener('click', function () {
            emojiOpen = !emojiOpen;
            if (emojiPanel) {
                emojiPanel.classList.toggle('show', emojiOpen);
                emojiPanel.setAttribute('aria-hidden', emojiOpen ? 'false' : 'true');
            }
        });

        var fileInput = document.getElementById('mobChatFile');
        document.getElementById('mobBtnAttach')?.addEventListener('click', function () {
            if (dmLimited && sentCount >= 1 && !hasReply) {
                toast('当前仅可发送首条私信');
                return;
            }
            if (fileInput) fileInput.click();
        });
        if (fileInput) {
            fileInput.addEventListener('change', function () {
                var files = fileInput.files;
                if (!files || !files.length) return;
                Array.prototype.forEach.call(files, function (file) {
                    if (!file.type || file.type.indexOf('image/') !== 0) return;
                    var url = URL.createObjectURL(file);
                    var bubImg = document.createElement('div');
                    bubImg.className = 'mob-bub me';
                    bubImg.setAttribute('data-msg-text', file.name.toLowerCase());
                    bubImg.innerHTML = '<img src="' + url + '" style="max-width:200px;border-radius:12px;display:block" alt="">' +
                        '<div style="font-size:11px;margin-top:4px;opacity:0.7">刚刚 · 图片</div>';
                    list.appendChild(bubImg);
                    sentCount += 1;
                });
                list.scrollTop = list.scrollHeight;
                syncLimitBanner();
                toast('已发送 ' + files.length + ' 张图片');
                fileInput.value = '';
            });
        }

        syncLimitBanner();
    }

    if (document.body.getAttribute('data-page') === 'messages-inbox') initInbox();
    if (document.body.getAttribute('data-page') === 'messages-group-inbox') initGroupInbox();
    if (document.body.getAttribute('data-page') === 'messages-chat') initChat();
})();
