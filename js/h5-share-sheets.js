/**
 * H5 分享底部弹层：主面板 · 私聊 · 群聊
 */
(function (global) {
    function toast(msg) {
        if (global.DigitalH5Nav && typeof global.DigitalH5Nav.toast === 'function') {
            global.DigitalH5Nav.toast(msg);
        }
    }

    function init(opts) {
        if (!opts) return;
        var openBtn = typeof opts.openBtn === 'string' ? document.querySelector(opts.openBtn) : opts.openBtn;
        var overlay = document.getElementById(opts.overlayId || 'h5ShareOverlay');
        var mainSheet = document.getElementById(opts.mainSheetId || 'h5ShareSheet');
        var dmSheet = document.getElementById(opts.dmSheetId || 'h5ShareDmSheet');
        var groupSheet = document.getElementById(opts.groupSheetId || 'h5ShareGroupSheet');
        if (!openBtn || !overlay || !mainSheet) return;

        var friends = opts.friends || [];
        var groups = opts.groups || [];
        var dmSelected = {};
        var groupSelectedId = null;

        var dmList = document.getElementById(opts.dmListId || 'h5ShareDmList');
        var dmSearch = document.getElementById(opts.dmSearchId || 'h5ShareDmSearch');
        var dmSend = document.getElementById(opts.dmSendId || 'h5ShareDmSend');
        var dmHint = document.getElementById(opts.dmHintId || 'h5ShareDmHint');
        var groupList = document.getElementById(opts.groupListId || 'h5ShareGroupList');
        var groupSearch = document.getElementById(opts.groupSearchId || 'h5ShareGroupSearch');
        var groupSend = document.getElementById(opts.groupSendId || 'h5ShareGroupSend');
        var groupHint = document.getElementById(opts.groupHintId || 'h5ShareGroupHint');

        function meta() {
            return (typeof opts.getMeta === 'function' ? opts.getMeta() : {}) || {};
        }

        function fillMainPreview() {
            var m = meta();
            var thumb = document.getElementById(opts.thumbId || 'h5ShareThumb');
            var title = document.getElementById(opts.titleId || 'h5ShareTitle');
            var by = document.getElementById(opts.byId || 'h5ShareBy');
            var urlEl = document.getElementById(opts.urlId || 'h5ShareUrl');
            if (thumb && m.thumb) thumb.src = m.thumb;
            if (title) title.textContent = m.title || '分享内容';
            if (by) by.textContent = m.by || '';
            if (urlEl) urlEl.textContent = m.url || 'https://goodfans.io/u/share';
        }

        function closeAll() {
            overlay.classList.remove('show');
            [mainSheet, dmSheet, groupSheet].forEach(function (el) {
                if (el) el.classList.remove('show');
            });
        }

        function openMain() {
            fillMainPreview();
            closeAll();
            overlay.classList.add('show');
            mainSheet.classList.add('show');
        }

        function openDm() {
            dmSelected = {};
            if (dmSearch) dmSearch.value = '';
            renderDmList('');
            syncDmFoot();
            mainSheet.classList.remove('show');
            if (dmSheet) dmSheet.classList.add('show');
        }

        function openGroup() {
            groupSelectedId = null;
            if (groupSearch) groupSearch.value = '';
            renderGroupList('');
            syncGroupFoot();
            mainSheet.classList.remove('show');
            if (groupSheet) groupSheet.classList.add('show');
        }

        function dmNames() {
            return friends.filter(function (f) { return dmSelected[f.id]; }).map(function (f) { return f.name; });
        }

        function renderDmList(filter) {
            if (!dmList) return;
            var q = (filter || '').toLowerCase().trim();
            dmList.innerHTML = friends.filter(function (f) {
                return !q || f.name.toLowerCase().indexOf(q) >= 0 || (f.handle || '').toLowerCase().indexOf(q) >= 0;
            }).map(function (f) {
                var on = dmSelected[f.id] ? ' on' : '';
                return '<button type="button" class="share-dm-row' + on + '" data-id="' + f.id + '">' +
                    '<img src="' + f.av + '" alt="">' +
                    '<span class="meta"><span class="nm">' + f.name + '</span>' +
                    '<span class="sub">' + (f.handle || '') + ' · 互关</span></span>' +
                    '<span class="chk"><i class="fa-solid fa-check"></i></span></button>';
            }).join('') || '<div class="share-dm-empty">无匹配好友</div>';
        }

        function syncDmFoot() {
            var names = dmNames();
            if (dmHint) dmHint.textContent = names.length ? ('已选 ' + names.length + ' 人：' + names.join('、')) : '未选择';
            if (dmSend) dmSend.disabled = !names.length;
        }

        function renderGroupList(filter) {
            if (!groupList) return;
            var q = (filter || '').toLowerCase().trim();
            groupList.innerHTML = groups.filter(function (g) {
                return !q || g.name.toLowerCase().indexOf(q) >= 0;
            }).map(function (g) {
                var on = groupSelectedId === g.id ? ' on' : '';
                return '<button type="button" class="share-dm-row share-group-row' + on + '" data-id="' + g.id + '">' +
                    '<span class="grp-av"><i class="fa-solid fa-user-group"></i></span>' +
                    '<span class="meta"><span class="nm">' + g.name + '</span>' +
                    '<span class="sub">' + (g.members || '') + ' 人 · 群聊</span></span>' +
                    '<span class="chk"><i class="fa-solid fa-check"></i></span></button>';
            }).join('') || '<div class="share-dm-empty">无匹配群聊</div>';
        }

        function syncGroupFoot() {
            var g = groups.filter(function (x) { return x.id === groupSelectedId; })[0];
            if (groupHint) groupHint.textContent = g ? ('已选：' + g.name) : '未选择群聊';
            if (groupSend) groupSend.disabled = !g;
        }

        openBtn.addEventListener('click', openMain);
        overlay.addEventListener('click', closeAll);

        document.getElementById(opts.mainCloseId || 'h5ShareClose')?.addEventListener('click', closeAll);
        document.getElementById(opts.openDmId || 'h5ShareOpenDm')?.addEventListener('click', openDm);
        document.getElementById(opts.openGroupId || 'h5ShareOpenGroup')?.addEventListener('click', openGroup);

        document.getElementById(opts.dmCloseId || 'h5ShareDmClose')?.addEventListener('click', function () {
            if (dmSheet) dmSheet.classList.remove('show');
            mainSheet.classList.add('show');
        });
        document.getElementById(opts.groupCloseId || 'h5ShareGroupClose')?.addEventListener('click', function () {
            if (groupSheet) groupSheet.classList.remove('show');
            mainSheet.classList.add('show');
        });

        document.getElementById(opts.copyId || 'h5ShareCopy')?.addEventListener('click', function () {
            toast('链接已复制');
        });

        var grid = document.getElementById(opts.gridId || 'h5ShareGrid');
        if (grid) {
            grid.addEventListener('click', function (e) {
                var btn = e.target.closest('[data-share]');
                if (!btn) return;
                var map = {
                    wechat: '微信', x: 'X', facebook: 'Facebook', instagram: 'Instagram',
                    telegram: 'Telegram', discord: 'Discord', qq: 'QQ', weibo: '微博',
                    reddit: 'Reddit', line: 'LINE'
                };
                toast((map[btn.getAttribute('data-share')] || '分享') + '成功');
                closeAll();
            });
        }

        if (dmList) {
            dmList.addEventListener('click', function (e) {
                var row = e.target.closest('.share-dm-row');
                if (!row) return;
                var id = row.getAttribute('data-id');
                if (dmSelected[id]) delete dmSelected[id];
                else dmSelected[id] = true;
                renderDmList(dmSearch ? dmSearch.value : '');
                syncDmFoot();
            });
        }
        if (dmSearch) dmSearch.addEventListener('input', function () { renderDmList(dmSearch.value); });

        if (groupList) {
            groupList.addEventListener('click', function (e) {
                var row = e.target.closest('.share-group-row');
                if (!row) return;
                groupSelectedId = row.getAttribute('data-id');
                renderGroupList(groupSearch ? groupSearch.value : '');
                syncGroupFoot();
            });
        }
        if (groupSearch) groupSearch.addEventListener('input', function () { renderGroupList(groupSearch.value); });

        if (dmSend) {
            dmSend.addEventListener('click', function () {
                var names = dmNames();
                if (!names.length) return;
                var picked = friends.filter(function (f) { return dmSelected[f.id]; });
                closeAll();
                toast('已分享到私聊：' + names.join('、'));
                if (typeof opts.onDmSend === 'function') {
                    opts.onDmSend(picked, meta());
                } else if (picked[0] && picked[0].chatUrl) {
                    global.location.href = picked[0].chatUrl;
                }
            });
        }

        if (groupSend) {
            groupSend.addEventListener('click', function () {
                var g = groups.filter(function (x) { return x.id === groupSelectedId; })[0];
                if (!g) return;
                closeAll();
                toast('已分享到群聊：' + g.name);
                if (typeof opts.onGroupSend === 'function') {
                    opts.onGroupSend(g, meta());
                } else if (g.chatUrl) {
                    global.location.href = g.chatUrl;
                }
            });
        }
    }

    global.H5ShareSheets = { init: init };
})(window);
