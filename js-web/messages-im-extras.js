/**
 * 私信 IM 扩展：备注弹窗、举报、聊天文件、@ 提及、详情侧栏快捷操作
 */
(function () {
    var LS_REPORTS = 'fl_admin_reports_v1';
    var mentionState = { open: false, start: 0, filter: '', active: 0 };

    function api() { return window.FL_messagesApi; }

    function $(id) { return document.getElementById(id); }

    function activeThread() {
        var a = api();
        return a ? a.findThread(a.state.activeId) : null;
    }

    function bindPanelCloses() {
        document.querySelectorAll('[data-close]').forEach(function (node) {
            if (node._imExtraClose) return;
            node._imExtraClose = true;
            node.addEventListener('click', function () {
                var id = node.getAttribute('data-close');
                if (id) api().closeOvl(id);
            });
        });
    }

    /* —— 备注 —— */
    window.FL_openRemarkModal = function () {
        var t = activeThread();
        var a = api();
        if (!t || !a) return;
        var isGroup = t.kind === 'group';
        var title = $('imRemarkTitle');
        var hint = $('imRemarkHint');
        var inp = $('imRemarkInput');
        if (title) {
            title.innerHTML = '<i class="fa-solid fa-pen"></i> ' + (isGroup ? '设置群聊备注' : '设置备注');
        }
        if (hint) {
            hint.textContent = isGroup
                ? '备注名将优先显示在群聊列表与顶栏（原名：' + t.name + '）'
                : '备注名将优先显示在会话列表与 @ 提及中';
        }
        if (inp) {
            inp.placeholder = isGroup ? '输入群聊备注，留空则恢复群名' : '输入备注名，留空则恢复昵称';
            inp.value = t.remark || '';
        }
        a.openOvl('imRemarkOvl');
        if (inp) setTimeout(function () { inp.focus(); }, 200);
    };

    function saveRemark() {
        var t = activeThread();
        var a = api();
        if (!t || !a) return;
        var val = ($('imRemarkInput') && $('imRemarkInput').value || '').trim();
        t.remark = val;
        a.saveThreadMeta(t.id, { remark: val });
        a.closeOvl('imRemarkOvl');
        a.renderThreadList();
        a.renderHeader();
        a.toast(val ? '备注已保存，列表将优先显示备注名' : '已清除备注');
    }

    /* —— 举报 —— */
    window.FL_openReportModal = function () {
        var t = activeThread();
        var a = api();
        if (!t || !a) return;
        var isGroup = t.kind === 'group';
        var title = $('imReportTitle');
        var hint = $('imReportHint');
        if (title) {
            title.innerHTML = '<i class="fa-solid fa-flag"></i> ' + (isGroup ? '举报群聊' : '举报用户');
        }
        if (hint) {
            hint.textContent = isGroup
                ? '举报对象：「' + t.name + '」· 将提交至后台举报反馈管理列表'
                : '举报对象：「' + t.name + '」· 将提交至后台举报反馈管理列表';
        }
        var detail = $('imReportDetail');
        if (detail) detail.value = '';
        a.openOvl('imReportOvl');
    };

    function submitReport() {
        var t = activeThread();
        var a = api();
        if (!t || !a) return;
        var reasonEl = document.querySelector('input[name="imReportReason"]:checked');
        var reason = reasonEl ? reasonEl.value : 'other';
        var detail = ($('imReportDetail') && $('imReportDetail').value || '').trim();
        var record = {
            id: 'rp_' + Date.now(),
            threadId: t.id,
            targetKind: t.kind || 'dm',
            targetName: t.name,
            targetHandle: t.handle || '',
            reason: reason,
            detail: detail,
            reporter: '当前创作者',
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        try {
            var list = JSON.parse(localStorage.getItem(LS_REPORTS) || '[]');
            list.unshift(record);
            localStorage.setItem(LS_REPORTS, JSON.stringify(list));
        } catch (e) { /* ignore */ }
        a.closeOvl('imReportOvl');
        a.toast('举报已提交至后台管理 · 举报反馈列表（演示）');
    }

    /* —— 聊天文件 —— */
    function openMediaGallery() {
        var t = activeThread();
        var a = api();
        if (!t || !a) return;
        var imgs = [];
        t.messages.forEach(function (m) {
            if (m.type === 'image' && m.src) imgs.push(m.src);
            if (m.type === 'share' && m.cover) imgs.push(m.cover);
        });
        if (!imgs.length) {
            imgs = [
                'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400',
                'https://images.unsplash.com/photo-1542642745-f03d8e3aa54c?w=400',
                'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
                'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400',
                'https://images.unsplash.com/photo-1542435503-956c469947f6?w=400'
            ];
        }
        var grid = $('imMediaGridLg');
        if (grid) {
            grid.innerHTML = imgs.map(function (src) {
                return '<img src="' + src + '" alt="" />';
            }).join('');
        }
        var cnt = $('imMediaCount');
        if (cnt) cnt.textContent = String(imgs.length);
        a.openOvl('imMediaOvl');
    }

    /* —— @ 提及 —— */
    function getMentionQuery(ta) {
        var val = ta.value;
        var pos = ta.selectionStart;
        var before = val.slice(0, pos);
        var at = before.lastIndexOf('@');
        if (at < 0) return null;
        var chunk = before.slice(at + 1);
        if (/\s/.test(chunk)) return null;
        return { at: at, filter: chunk.toLowerCase(), pos: pos };
    }

    function mentionLabel(m) {
        var a = api();
        if (m.remark) return a.displayThreadName({ name: m.name, remark: m.remark });
        return m.name;
    }

    function filteredMembers(t, filter) {
        return api().getGroupMentionMembers(t).filter(function (m) {
            if (!filter) return true;
            var blob = (m.name + (m.remark || '') + mentionLabel(m)).toLowerCase();
            return blob.indexOf(filter) >= 0;
        });
    }

    function renderMentionPicker(list) {
        var box = $('imMentionPicker');
        if (!box) return;
        if (!list.length) {
            box.innerHTML = '<div style="padding:12px;font-size:12px;color:var(--t-tertiary);text-align:center">无匹配成员</div>';
            box.hidden = false;
            return;
        }
        var a = api();
        box.innerHTML = list.map(function (m, i) {
            var sub = m.remark ? ('昵称 ' + m.name) : '';
            return '<div class="im-mention-item' + (i === mentionState.active ? ' active' : '') + '" data-idx="' + i + '">' +
                '<div class="av" style="background-image:url(\'' + m.av + '\')"></div>' +
                '<div><div>' + a.esc(mentionLabel(m)) + '</div>' +
                (sub ? '<div class="sub">' + a.esc(sub) + '</div>' : '') + '</div></div>';
        }).join('');
        box.hidden = false;
        mentionState.open = true;
        mentionState._list = list;
    }

    window.FL_hideMentionPicker = function () {
        var box = $('imMentionPicker');
        if (box) box.hidden = true;
        mentionState.open = false;
    };

    function insertMention(ta, label, atPos, cursorPos) {
        var before = ta.value.slice(0, atPos);
        var after = ta.value.slice(cursorPos);
        ta.value = before + '@' + label + ' ' + after;
        var np = before.length + label.length + 2;
        ta.selectionStart = ta.selectionEnd = np;
        ta.focus();
        window.FL_hideMentionPicker();
    }

    function onInputMention() {
        var ta = $('imInputTa');
        var t = activeThread();
        if (!ta || !t || t.kind !== 'group') {
            window.FL_hideMentionPicker();
            return;
        }
        var q = getMentionQuery(ta);
        if (!q) {
            window.FL_hideMentionPicker();
            return;
        }
        mentionState.start = q.at;
        mentionState.filter = q.filter;
        mentionState.active = 0;
        renderMentionPicker(filteredMembers(t, q.filter));
    }

    function pickMentionByIndex(idx) {
        var ta = $('imInputTa');
        var list = mentionState._list;
        if (!ta || !list || !list[idx]) return;
        var m = list[idx];
        var q = getMentionQuery(ta);
        if (!q) return;
        insertMention(ta, mentionLabel(m), q.at, q.pos);
    }

    function bindMention() {
        var ta = $('imInputTa');
        var box = $('imMentionPicker');
        if (!ta) return;
        ta.addEventListener('input', onInputMention);
        ta.addEventListener('keydown', function (e) {
            if (!mentionState.open || !mentionState._list) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                mentionState.active = Math.min(mentionState.active + 1, mentionState._list.length - 1);
                renderMentionPicker(mentionState._list);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                mentionState.active = Math.max(mentionState.active - 1, 0);
                renderMentionPicker(mentionState._list);
            } else if (e.key === 'Enter' && mentionState._list.length) {
                e.preventDefault();
                pickMentionByIndex(mentionState.active);
            } else if (e.key === 'Escape') {
                window.FL_hideMentionPicker();
            }
        });
        if (box) {
            box.addEventListener('click', function (e) {
                var item = e.target.closest('.im-mention-item');
                if (!item) return;
                pickMentionByIndex(parseInt(item.getAttribute('data-idx'), 10));
            });
        }
    }

    function bindInfoPanel() {
        $('imBtnUserProfile')?.addEventListener('click', function () {
            var t = activeThread();
            if (!t || t.kind === 'group') {
                api().toast('群聊无个人主页，请查看群管理');
                return;
            }
            api().toast('打开「' + api().displayThreadName(t) + '」的创作者主页（演示）');
            window.open('profile.html?user=' + encodeURIComponent(t.handle || t.name), '_blank');
        });
        $('imBtnWorksStat')?.addEventListener('click', function () {
            var t = activeThread();
            if (!t || t.kind === 'group') return;
            api().toast('进入用户详情 · 作品列表（演示）');
            window.open('profile.html?user=' + encodeURIComponent(t.handle || t.name) + '&tab=works', '_blank');
        });
        $('imBtnConvMute')?.addEventListener('click', function () {
            var t = activeThread();
            var a = api();
            if (!t || !a) return;
            t.convMuted = !t.convMuted;
            a.saveThreadMeta(t.id, { convMuted: t.convMuted });
            this.classList.toggle('on', t.convMuted);
            a.renderThreadList();
            a.toast(t.convMuted ? '已开启免打扰，左侧显示免打扰图标' : '已关闭免打扰');
        });
        $('imSharedMedia')?.addEventListener('click', openMediaGallery);
        $('imSharedMedia')?.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMediaGallery(); }
        });
    }

    function init() {
        bindPanelCloses();
        $('imRemarkSave')?.addEventListener('click', saveRemark);
        $('imReportSubmit')?.addEventListener('click', submitReport);
        bindMention();
        bindInfoPanel();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 80); });
    else setTimeout(init, 80);
})();
