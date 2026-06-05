/**
 * 群聊管理：公告、成员/管理员、禁言、转让、解散、退出
 * 依赖 messages-page.js · FL_messagesApi
 */
(function () {
    var api;
    var el = {};
    var pickState = { mode: null, selectedId: null };

    var DEFAULT_MEMBERS = [
        { id: 'gm1', name: 'Luna 🌙', av: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120', role: 'owner' },
        { id: 'gm2', name: 'Lens 旅记', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120', role: 'admin' },
        { id: 'gm3', name: '山野食光', av: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120', role: 'member' },
        { id: 'gm4', name: '夜雨听弦', av: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120', role: 'member' },
        { id: 'gm5', name: '代码诗人', av: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=120', role: 'member' },
        { id: 'gm6', name: '小鹿订阅', av: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120', role: 'member' }
    ];

    /** 互关好友（与 messages-page MUTUAL_FOLLOW_USERS 一致） */
    var MUTUAL_FOLLOW_FALLBACK = [
        { id: 'lens', name: 'Lens 旅记', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120', sub: '互相关注 · 粉丝' },
        { id: 'yeyu', name: '夜雨听弦', av: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120', sub: '互相关注' },
        { id: 'code', name: '代码诗人', av: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=120', sub: '互相关注' },
        { id: 'mila', name: 'Mila', av: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120', sub: '互相关注' }
    ];

    function getMutualFollowList() {
        var a = getApi();
        if (a && a.getMutualFollowUsers) return a.getMutualFollowUsers();
        return MUTUAL_FOLLOW_FALLBACK.slice();
    }

    var addPickState = { selected: {}, q: '' };

    function $(id) { return document.getElementById(id); }

    function getApi() {
        return api || window.FL_messagesApi;
    }

    function activeGroup() {
        var a = getApi();
        if (!a) return null;
        var t = a.findThread(a.state.activeId);
        return t && t.kind === 'group' ? t : null;
    }

    function ensureGroupMeta(t) {
        if (!t || t.kind !== 'group' || t._groupReady) return;
        t._groupReady = true;
        if (!t.myRole) t.myRole = t.id === 'grp-vip' ? 'owner' : (t.id === 'grp-live' ? 'admin' : 'member');
        if (!t.members) t.members = DEFAULT_MEMBERS.map(function (m) {
            return { id: m.id, name: m.name, av: m.av, role: m.role };
        });
        if (!t.mutedIds) t.mutedIds = [];
        if (!t.announcement && t.id === 'grp-vip') {
            t.announcement = {
                text: '本周五 20:00 订阅者专属直播，请提前打开提醒；群内禁止广告与外链。',
                publisher: 'Luna 🌙',
                time: '今天 10:00'
            };
        }
    }

    function memberInGroup(t, contactId, contactName) {
        return t.members.some(function (m) {
            return m.id === contactId || m.name === contactName;
        });
    }

    function getAddableFriends(t) {
        return getMutualFollowList().filter(function (f) {
            return !memberInGroup(t, f.id, f.name);
        });
    }

    function isOwner(t) { return t.myRole === 'owner'; }
    function isAdmin(t) { return t.myRole === 'admin'; }
    function canManageMembers(t) { return isOwner(t) || isAdmin(t); }
    function canManageAdmins(t) { return isOwner(t); }

    function roleLabel(role) {
        if (role === 'owner') return '群主';
        if (role === 'admin') return '管理员';
        return '成员';
    }

    function renderGroupNotice(t) {
        if (!el.noticeBar) return;
        if (!t || t.kind !== 'group' || !t.announcement || !t.announcement.text) {
            el.noticeBar.hidden = true;
            return;
        }
        el.noticeBar.hidden = false;
        el.noticeBar.classList.remove('collapsed');
        if (el.noticeMeta) {
            el.noticeMeta.textContent = t.announcement.publisher + ' · ' + (t.announcement.time || '');
        }
        if (el.noticeText) el.noticeText.textContent = t.announcement.text;
    }

    function publishAnnouncement(text) {
        var t = activeGroup();
        var a = getApi();
        if (!t || !a || !canManageMembers(t)) return;
        var body = (text || '').trim();
        if (!body) { a.toast('请输入公告内容'); return; }
        t.announcement = {
            text: body,
            publisher: '我（' + roleLabel(t.myRole) + '）',
            time: '刚刚'
        };
        t.messages.push({
            type: 'day',
            text: '今天'
        });
        t.messages.push({
            from: 'system',
            type: 'announce',
            text: '【群公告】' + body,
            time: '刚刚'
        });
        renderGroupNotice(t);
        a.renderMessages();
        a.toast('群公告已发布，全体成员可见');
        renderManageBody();
    }

    function memberRow(m, t) {
        var a = getApi();
        var muted = (t.mutedIds || []).indexOf(m.id) >= 0;
        var tags = '<span class="grp-role-tag ' + m.role + '">' + roleLabel(m.role) + '</span>';
        if (muted) tags += ' <span class="grp-role-tag muted">已禁言</span>';
        var acts = '';
        if (canManageMembers(t) && m.role !== 'owner') {
            if (!muted) acts += '<button type="button" class="btn btn-sm btn-secondary" data-mute="' + m.id + '">禁言</button>';
            else acts += '<button type="button" class="btn btn-sm btn-secondary" data-unmute="' + m.id + '">解除禁言</button>';
            acts += '<button type="button" class="btn btn-sm btn-secondary" data-remove="' + m.id + '">移除</button>';
        }
        if (isOwner(t) && m.role === 'member') {
            acts += '<button type="button" class="btn btn-sm" style="background:var(--brand-grad);color:#fff;border:none" data-promote="' + m.id + '">设为管理员</button>';
        }
        if (isOwner(t) && m.role === 'admin') {
            acts += '<button type="button" class="btn btn-sm btn-secondary" data-demote="' + m.id + '">取消管理员</button>';
        }
        return '<div class="im-grp-member-row" data-mid="' + m.id + '">' +
            '<div class="av" style="background-image:url(\'' + m.av + '\')"></div>' +
            '<div class="info"><div class="name">' + a.esc(m.name) + '</div>' +
            '<div class="sub">' + tags + '</div></div>' +
            (acts ? '<div class="acts">' + acts + '</div>' : '') +
            '</div>';
    }

    function renderManageBody() {
        var t = activeGroup();
        if (!el.manageBody || !t) return;
        ensureGroupMeta(t);
        var a = getApi();
        var html = '';

        html += '<p class="im-panel-hint" style="margin-bottom:16px">当前身份：<b>' + roleLabel(t.myRole) + '</b> · ' + t.members.length + ' 位成员</p>';

        html += '<section class="im-grp-sec">';
        html += '<div class="im-grp-sec-h"><h4><i class="fa-solid fa-bullhorn"></i> 群公告</h4></div>';
        if (!canManageMembers(t)) {
            html += '<p class="im-panel-hint">仅群主和管理员可编辑</p>';
            if (t.announcement && t.announcement.text) {
                html += '<div style="font-size:13px;line-height:1.55;padding:10px 12px;border-radius:8px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.3)">' + a.esc(t.announcement.text) + '</div>';
            }
        } else {
            html += '<p class="im-panel-hint">发布后聊天页顶部强展示</p>';
            html += '<div class="im-grp-notice-editor"><textarea id="imGrpNoticeInput" placeholder="输入群公告内容…">' +
                (t.announcement ? a.esc(t.announcement.text) : '') + '</textarea>' +
                '<button type="button" class="btn" id="imGrpPublishNotice" style="background:var(--brand-grad);color:#fff;border:none;width:100%"><i class="fa-solid fa-bullhorn"></i> 发布公告</button></div>';
        }
        html += '</section>';

        html += '<section class="im-grp-sec">';
        html += '<div class="im-grp-sec-h"><h4><i class="fa-solid fa-users"></i> 成员 · ' + t.members.length + '</h4>';
        if (canManageMembers(t)) {
            html += '<button type="button" class="btn btn-sm" id="imGrpAddMember" style="background:var(--brand-grad);color:#fff;border:none;flex-shrink:0"><i class="fa-solid fa-user-plus"></i> 添加</button>';
        }
        html += '</div>';
        t.members.forEach(function (m) { html += memberRow(m, t); });
        html += '</section>';

        html += '<section class="im-grp-sec">';
        html += '<div class="im-grp-danger" style="margin:0;border:none;padding:0;background:transparent">';
        html += '<h4 style="margin-bottom:10px"><i class="fa-solid fa-triangle-exclamation"></i> 群操作</h4>';
        if (isOwner(t)) {
            html += '<button type="button" class="btn btn-secondary" data-grp-transfer style="width:100%;margin-bottom:8px;justify-content:center"><i class="fa-solid fa-crown"></i> 转让群主</button>';
            html += '<button type="button" class="btn btn-secondary" data-grp-dissolve style="width:100%;margin-bottom:8px;justify-content:center;color:#F87171;border-color:rgba(248,113,113,0.5)"><i class="fa-solid fa-ban"></i> 解散群聊</button>';
        }
        html += '<button type="button" class="btn btn-secondary" data-grp-leave style="width:100%;justify-content:center"><i class="fa-solid fa-right-from-bracket"></i> ' +
            (isOwner(t) ? '退出并转让群主' : '退出群聊') + '</button>';
        html += '</div></section>';

        el.manageBody.innerHTML = html;
        if (el.manageTitle) el.manageTitle.innerHTML = '<i class="fa-solid fa-users-gear"></i> ' + a.esc(t.name);
    }

    function updateAddConfirmBtn() {
        var n = Object.keys(addPickState.selected).length;
        if (el.addConfirm) {
            el.addConfirm.disabled = n < 1;
            el.addConfirm.innerHTML = '<i class="fa-solid fa-check"></i> 添加选中' + (n ? ' (' + n + ')' : '');
        }
    }

    function renderAddMemberList() {
        var t = activeGroup();
        var a = getApi();
        if (!el.addList || !t || !a) return;
        var q = addPickState.q.toLowerCase();
        var list = getAddableFriends(t).filter(function (f) {
            return !q || f.name.toLowerCase().indexOf(q) >= 0 || (f.sub && f.sub.toLowerCase().indexOf(q) >= 0);
        });
        if (!list.length) {
            el.addList.innerHTML = '<div class="im-grp-add-empty"><i class="fa-solid fa-user-check"></i><br>暂无可添加的互关好友<br><span style="font-size:11px">互关列表中已在群内的成员已自动过滤</span></div>';
            updateAddConfirmBtn();
            return;
        }
        el.addList.innerHTML = list.map(function (f) {
            var sel = !!addPickState.selected[f.id];
            return '<label class="im-grp-add-row' + (sel ? ' selected' : '') + '" data-aid="' + f.id + '">' +
                '<input type="checkbox"' + (sel ? ' checked' : '') + ' />' +
                '<div class="av" style="background-image:url(\'' + f.av + '\')"></div>' +
                '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px">' + a.esc(f.name) + '</div>' +
                '<div class="sub">' + a.esc(f.sub) + '</div></div></label>';
        }).join('');
        updateAddConfirmBtn();
    }

    function openAddMemberPicker() {
        var t = activeGroup();
        var a = getApi();
        if (!t || !a || !canManageMembers(t)) return;
        addPickState.selected = {};
        addPickState.q = '';
        if (el.addSearch) el.addSearch.value = '';
        renderAddMemberList();
        a.openOvl('imPanelGroupAddMember');
    }

    function confirmAddMembers() {
        var t = activeGroup();
        var a = getApi();
        if (!t || !a) return;
        var ids = Object.keys(addPickState.selected);
        if (!ids.length) return;
        var added = 0;
        ids.forEach(function (id) {
            var f = ADDRESS_BOOK_FRIENDS.filter(function (x) { return x.id === id; })[0];
            if (!f || memberInGroup(t, f.id, f.name)) return;
            t.members.push({ id: f.id, name: f.name, av: f.av, role: 'member' });
            added++;
        });
        t.memberCount = t.members.length;
        a.closeOvl('imPanelGroupAddMember');
        a.toast('已添加 ' + added + ' 位成员');
        renderManageBody();
        a.renderHeader();
    }

    function openPickMember(mode) {
        var t = activeGroup();
        var a = getApi();
        if (!t || !a) return;
        pickState.mode = mode;
        pickState.selectedId = null;
        if (el.pickTitle) {
            el.pickTitle.textContent = mode === 'transfer' ? '转让群主' : '退出并转让群主';
        }
        if (el.pickHint) {
            el.pickHint.textContent = mode === 'transfer'
                ? '请选择一位群成员担任新群主，转让后立即生效。'
                : '你是群主，退出前须指定新群主，退出后你将不再接收本群消息。';
        }
        var candidates = t.members.filter(function (m) {
            return m.role !== 'owner';
        });
        if (!el.pickList) return;
        el.pickList.innerHTML = candidates.map(function (m) {
            return '<div class="im-grp-pick-item" data-pick="' + m.id + '">' +
                '<div class="av" style="background-image:url(\'' + m.av + '\')"></div>' +
                '<div style="font-weight:700;font-size:13px">' + a.esc(m.name) + '</div></div>';
        }).join('');
        if (el.pickConfirm) el.pickConfirm.disabled = true;
        a.openOvl('imGrpPickMemberOvl');
    }

    function confirmPick() {
        var t = activeGroup();
        var a = getApi();
        if (!t || !pickState.selectedId) return;
        var newOwner = t.members.filter(function (m) { return m.id === pickState.selectedId; })[0];
        if (!newOwner) return;
        t.members.forEach(function (m) {
            if (m.id === pickState.selectedId) m.role = 'owner';
            else if (m.role === 'owner') m.role = 'member';
        });
        if (pickState.mode === 'transfer') {
            t.myRole = 'member';
            a.closeOvl('imGrpPickMemberOvl');
            a.toast('已成功将群主转让给「' + newOwner.name + '」');
            renderManageBody();
            a.renderHeader();
        } else if (pickState.mode === 'leave-owner') {
            t.myRole = 'member';
            a.closeOvl('imGrpPickMemberOvl');
            a.closeOvl('imPanelGroupManage');
            leaveGroup(false);
            a.toast('已转让给「' + newOwner.name + '」并退出群聊');
        }
    }

    function leaveGroup(confirmOwner) {
        var t = activeGroup();
        var a = getApi();
        if (!t || !a) return;
        if (isOwner(t) && confirmOwner !== false) {
            openPickMember('leave-owner');
            return;
        }
        a.deleteThread(t.id);
        a.closeOvl('imPanelGroupManage');
    }

    function dissolveGroup() {
        var t = activeGroup();
        var a = getApi();
        if (!t || !isOwner(t)) return;
        a.openConfirm({
            title: '解散群聊',
            body: '解散后所有成员将被移出，聊天记录不可恢复。确定解散「' + t.name + '」？',
            okText: '确认解散',
            onConfirm: function () {
                a.deleteThread(t.id);
                a.closeOvl('imPanelGroupManage');
                a.toast('群聊已解散');
            }
        });
    }

    function transferGroup() {
        var t = activeGroup();
        if (!t || !isOwner(t)) return;
        openPickMember('transfer');
    }

    function bindManageEvents() {
        if (el.manageBody) {
            el.manageBody.addEventListener('click', function (e) {
                var t = activeGroup();
                var a = getApi();
                if (!t || !a) return;
                if (e.target.id === 'imGrpPublishNotice' || e.target.closest('#imGrpPublishNotice')) {
                    var inp = $('imGrpNoticeInput');
                    publishAnnouncement(inp ? inp.value : '');
                    return;
                }
                if (e.target.id === 'imGrpAddMember' || e.target.closest('#imGrpAddMember')) {
                    openAddMemberPicker();
                    return;
                }
                var mute = e.target.closest('[data-mute]');
                if (mute && canManageMembers(t)) {
                    var mid = mute.getAttribute('data-mute');
                    if (t.mutedIds.indexOf(mid) < 0) t.mutedIds.push(mid);
                    a.toast('已禁言该成员');
                    renderManageBody();
                    return;
                }
                var unmute = e.target.closest('[data-unmute]');
                if (unmute) {
                    var mid2 = unmute.getAttribute('data-unmute');
                    t.mutedIds = (t.mutedIds || []).filter(function (x) { return x !== mid2; });
                    a.toast('已解除禁言');
                    renderManageBody();
                    return;
                }
                var rem = e.target.closest('[data-remove]');
                if (rem && canManageMembers(t)) {
                    var rid = rem.getAttribute('data-remove');
                    t.members = t.members.filter(function (m) { return m.id !== rid; });
                    t.memberCount = Math.max(1, (t.memberCount || 1) - 1);
                    a.toast('已移出群聊');
                    renderManageBody();
                    return;
                }
                var promote = e.target.closest('[data-promote]');
                if (promote && isOwner(t)) {
                    var pid = promote.getAttribute('data-promote');
                    t.members.forEach(function (m) { if (m.id === pid) m.role = 'admin'; });
                    a.toast('已设为管理员');
                    renderManageBody();
                    return;
                }
                var demote = e.target.closest('[data-demote]');
                if (demote && isOwner(t)) {
                    var did = demote.getAttribute('data-demote');
                    t.members.forEach(function (m) { if (m.id === did) m.role = 'member'; });
                    a.toast('已取消管理员');
                    renderManageBody();
                    return;
                }
                if (e.target.closest('[data-grp-transfer]')) { transferGroup(); return; }
                if (e.target.closest('[data-grp-dissolve]')) { dissolveGroup(); return; }
                if (e.target.closest('[data-grp-leave]')) {
                    if (isOwner(t)) openPickMember('leave-owner');
                    else {
                        a.openConfirm({
                            title: '退出群聊',
                            body: '退出后将不再接收「' + t.name + '」的消息，是否退出？',
                            okText: '确认退出',
                            onConfirm: function () { leaveGroup(false); }
                        });
                    }
                }
            });
        }
        if (el.pickList) {
            el.pickList.addEventListener('click', function (e) {
                var item = e.target.closest('[data-pick]');
                if (!item) return;
                pickState.selectedId = item.getAttribute('data-pick');
                el.pickList.querySelectorAll('.im-grp-pick-item').forEach(function (n) {
                    n.classList.toggle('selected', n.getAttribute('data-pick') === pickState.selectedId);
                });
                if (el.pickConfirm) el.pickConfirm.disabled = false;
            });
        }
        if (el.pickConfirm) el.pickConfirm.addEventListener('click', confirmPick);
        if (el.addSearch) {
            el.addSearch.addEventListener('input', function () {
                addPickState.q = el.addSearch.value.trim();
                renderAddMemberList();
            });
        }
        if (el.addList) {
            el.addList.addEventListener('change', function (e) {
                if (e.target.type !== 'checkbox') return;
                var row = e.target.closest('[data-aid]');
                if (!row) return;
                var id = row.getAttribute('data-aid');
                if (e.target.checked) addPickState.selected[id] = true;
                else delete addPickState.selected[id];
                updateAddConfirmBtn();
                row.classList.toggle('selected', e.target.checked);
            });
        }
        if (el.addConfirm) el.addConfirm.addEventListener('click', confirmAddMembers);
        if (el.noticeFold) {
            el.noticeFold.addEventListener('click', function () {
                if (el.noticeBar) el.noticeBar.classList.toggle('collapsed');
            });
        }
    }

    window.FL_openGroupManage = function () {
        var t = activeGroup();
        var a = getApi();
        if (!t || !a) return;
        ensureGroupMeta(t);
        renderManageBody();
        a.openOvl('imPanelGroupManage');
    };

    window.FL_onThreadSelected = function (t) {
        if (!t || t.kind !== 'group') {
            if (el.noticeBar) el.noticeBar.hidden = true;
            return;
        }
        ensureGroupMeta(t);
        renderGroupNotice(t);
    };

    window.FL_onThreadHeader = function () { /* 顶栏模式由 messages-page applyThreadHeadChrome 处理 */ };

    function init() {
        api = window.FL_messagesApi;
        el.noticeBar = $('imGroupNotice');
        el.noticeMeta = $('imGroupNoticeMeta');
        el.noticeText = $('imGroupNoticeText');
        el.noticeFold = $('imGroupNoticeFold');
        el.manageBody = $('imGrpManageBody');
        el.manageTitle = $('imGrpManageTitle');
        el.addList = $('imGrpAddList');
        el.addSearch = $('imGrpAddSearch');
        el.addConfirm = $('imGrpAddConfirm');
        el.pickList = $('imGrpPickList');
        el.pickTitle = $('imGrpPickTitle');
        el.pickHint = $('imGrpPickHint');
        el.pickConfirm = $('imGrpPickConfirm');
        bindManageEvents();
        var t = api && api.findThread(api.state.activeId);
        if (t && t.kind === 'group') window.FL_onThreadSelected(t);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(init, 50);
        });
    } else {
        setTimeout(init, 50);
    }
})();
