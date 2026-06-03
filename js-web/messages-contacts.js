/**
 * 消息 · 通讯录（群聊 / 好友 · 字母索引）
 */
(function () {
    var GROUPS = [
        { id: 'grp-vip', name: 'VIP 订阅者群', members: 128, sortKey: 'V' },
        { id: 'grp-live', name: '直播粉丝交流群', members: 892, sortKey: 'Z' },
        { id: 'grp-welcome', name: '新粉欢迎群', members: 2041, sortKey: 'X' }
    ];

    var FRIENDS = [
        { id: 'lens', name: 'Lens 旅记', sub: '互相关注 · 粉丝', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120', sortKey: 'L' },
        { id: 'food', name: '山野食光', sub: 'VIP 订阅者', av: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120', sortKey: 'S' },
        { id: 'yeyu', name: '夜雨听弦', sub: '互相关注', av: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120', sortKey: 'Y' },
        { id: 'code', name: '代码诗人', sub: '粉丝', av: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=120', sortKey: 'D' },
        { id: 'silver', name: '银盐时代', sub: '粉丝', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120', sortKey: 'Y' },
        { id: 'mila', name: 'Mila', sub: '订阅者', av: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120', sortKey: 'M' },
        { id: 'nova', name: 'Nova', sub: '粉丝', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120', sortKey: 'N' }
    ];

    var state = { tab: 'group', q: '' };

    function sortByKey(list) {
        return list.slice().sort(function (a, b) {
            return a.sortKey.localeCompare(b.sortKey) || a.name.localeCompare(b.name);
        });
    }

    function groupByAlpha(list) {
        var sorted = sortByKey(list);
        var map = {};
        sorted.forEach(function (item) {
            var letter = item.sortKey || '#';
            if (!map[letter]) map[letter] = [];
            map[letter].push(item);
        });
        return Object.keys(map).sort().map(function (k) { return { letter: k, items: map[k] }; });
    }

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function render() {
        var body = document.getElementById('contactsBody');
        if (!body) return;
        var q = state.q.toLowerCase();
        var source = state.tab === 'group' ? GROUPS : FRIENDS;
        var filtered = source.filter(function (x) {
            return !q || x.name.toLowerCase().indexOf(q) >= 0 || (x.sub && x.sub.toLowerCase().indexOf(q) >= 0);
        });
        var sections = groupByAlpha(filtered);
        if (!sections.length) {
            body.innerHTML = '<div style="padding:40px;text-align:center;color:var(--t-tertiary);font-size:13px">无匹配联系人</div>';
            return;
        }
        var html = '';
        sections.forEach(function (sec) {
            html += '<div class="im-alpha">' + sec.letter + '</div>';
            sec.items.forEach(function (item) {
                if (state.tab === 'group') {
                    html += '<div class="im-contact-row" data-href="messages.html?tab=group">' +
                        '<div class="av grp"><i class="fa-solid fa-users"></i></div>' +
                        '<div class="body"><div class="name">' + esc(item.name) + '</div>' +
                        '<div class="sub">' + item.members + ' 人 · 群聊</div></div>' +
                        '<i class="fa-solid fa-chevron-right" style="color:var(--t-tertiary);font-size:11px"></i></div>';
                } else {
                    html += '<div class="im-contact-row" data-href="messages.html?peer=' + encodeURIComponent(item.name) + '">' +
                        '<div class="av" style="background-image:url(\'' + item.av + '\')"></div>' +
                        '<div class="body"><div class="name">' + esc(item.name) + '</div>' +
                        '<div class="sub">' + esc(item.sub) + '</div></div>' +
                        '<i class="fa-solid fa-chevron-right" style="color:var(--t-tertiary);font-size:11px"></i></div>';
                }
            });
        });
        body.innerHTML = html;
    }

    function init() {
        document.querySelectorAll('#contactsTabs button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('#contactsTabs button').forEach(function (b) { b.classList.remove('on'); });
                btn.classList.add('on');
                state.tab = btn.getAttribute('data-tab');
                render();
            });
        });
        var search = document.getElementById('contactsSearch');
        if (search) search.addEventListener('input', function () {
            state.q = search.value.trim();
            render();
        });
        document.getElementById('contactsBody')?.addEventListener('click', function (e) {
            var row = e.target.closest('[data-href]');
            if (row) location.href = row.getAttribute('data-href');
        });
        render();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
