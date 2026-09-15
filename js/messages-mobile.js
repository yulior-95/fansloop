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

        function unreadSumByType(type) {
            var sum = 0;
            chatItems.forEach(function (row) {
                var cat = row.getAttribute('data-chat-type') || 'dm';
                if (type !== 'all' && cat !== type) return;
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
                var catOk = curFilter === 'all' || cat === curFilter;
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
        var composeBtn = document.querySelector('.nav-right .nav-btn');
        if (composeBtn) {
            composeBtn.addEventListener('click', function () {
                openOverlay(ovlAddContact);
                refreshAddContacts();
            });
        }
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
        applyFilter();
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
        if (title) title.textContent = isGroup ? (groupTitles[groupSlug] || '群聊') : name;
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

        list.innerHTML = data.messages.map(function (msg) {
            var cls = 'mob-bub' + (msg.from === 'me' ? ' me' : '');
            if (msg.image) return '<div class="' + cls + '"><img src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400" style="max-width:200px;border-radius:12px;display:block"><div style="font-size:11px;margin-top:4px;opacity:0.7">' + msg.time + '</div></div>';
            return '<div class="' + cls + '">' + msg.text + '<div style="font-size:11px;margin-top:4px;opacity:0.7">' + msg.time + '</div></div>';
        }).join('');

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

        document.getElementById('mobBtnGift')?.addEventListener('click', function () {
            alert('打开送礼（移动端演示）');
        });
        document.getElementById('mobBtnVoice')?.addEventListener('click', function () {
            toast('按住说话（原型演示）');
        });
        syncLimitBanner();
    }

    if (document.body.getAttribute('data-page') === 'messages-inbox') initInbox();
    if (document.body.getAttribute('data-page') === 'messages-chat') initChat();
})();
