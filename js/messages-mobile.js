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
                { from: 'them', text: '已向你发送新的订阅专属视频 🎬', time: '刚刚' },
                { from: 'me', text: '收到，马上看！', time: '刚刚' }
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

        function toast(msg) {
            if (window.DigitalH5Nav && typeof window.DigitalH5Nav.toast === 'function') window.DigitalH5Nav.toast(msg);
        }
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
            setTabCnt(cntAll, unreadSumByType('all'));
            setTabCnt(cntDm, unreadSumByType('dm'));
            setTabCnt(cntGroup, unreadSumByType('group'));
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
        if (btnAddContact) {
            btnAddContact.addEventListener('click', function () {
                openOverlay(ovlAddContact);
                refreshAddContacts();
            });
        }
        if (btnCreateGroup) {
            btnCreateGroup.addEventListener('click', function () {
                openOverlay(ovlCreateGroup);
                refreshGroupMembers();
            });
        }
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
        if (title) title.textContent = displayName;
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

        function renderBubbleHtml(msg) {
            var cls = 'mob-bub' + (msg.from === 'me' ? ' me' : '');
            var textKey = (msg.text || '').toLowerCase();
            if (msg.image) {
                var src = msg.imageSrc || 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400';
                return '<div class="' + cls + '" data-msg-text="' + textKey + '"><img src="' + src + '" style="max-width:200px;border-radius:12px;display:block"><div style="font-size:11px;margin-top:4px;opacity:0.7">' + msg.time + '</div></div>';
            }
            return '<div class="' + cls + '" data-msg-text="' + textKey + '">' + msg.text + '<div style="font-size:11px;margin-top:4px;opacity:0.7">' + msg.time + '</div></div>';
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
                '<div style="border:1px solid var(--border-color);border-radius:12px;overflow:hidden;max-width:240px;background:var(--bg-card)">' +
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
            var bubs = list.querySelectorAll('.mob-bub');
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

        document.getElementById('mobBtnVoiceCall')?.addEventListener('click', function () {
            toast('正在呼叫 ' + displayName + '（语音通话演示）');
        });
        document.getElementById('mobBtnVideoCall')?.addEventListener('click', function () {
            toast('正在发起与 ' + displayName + ' 的视频通话（演示）');
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
