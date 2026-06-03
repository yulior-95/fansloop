/**
 * 删除好友 · 跨页面演示存储（私信 IM ↔ 个人主页社交列表）
 */
(function (global) {
    var KEY = 'fl_removed_friends_v1';

    var NAME_MAP = {
        'lens 旅记': { threadId: 'lens', socialIds: ['g1'] },
        'lens': { threadId: 'lens', socialIds: ['g1'] },
        '夜雨听弦': { threadId: 'yeyu', socialIds: ['g2'] },
        'mio_摄影': { threadId: null, socialIds: ['f2'] },
        '胶片少女': { threadId: null, socialIds: ['f4'] }
    };

    function normName(name) {
        return String(name || '').trim().toLowerCase();
    }

    function load() {
        try {
            var raw = localStorage.getItem(KEY);
            if (!raw) return { threadIds: [], names: [], socialIds: [] };
            var data = JSON.parse(raw);
            return {
                threadIds: data.threadIds || [],
                names: data.names || [],
                socialIds: data.socialIds || []
            };
        } catch (e) {
            return { threadIds: [], names: [], socialIds: [] };
        }
    }

    function save(data) {
        try {
            localStorage.setItem(KEY, JSON.stringify(data));
        } catch (e) { /* ignore */ }
        try {
            global.dispatchEvent(new CustomEvent('fl-friend-removed', { detail: data }));
        } catch (e2) { /* ignore */ }
    }

    function lookup(name) {
        var n = normName(name);
        return NAME_MAP[n] || NAME_MAP[String(name || '').trim()] || null;
    }

    function isRemoved(opts) {
        var data = load();
        if (opts.threadId && data.threadIds.indexOf(opts.threadId) >= 0) return true;
        if (opts.socialId && data.socialIds.indexOf(opts.socialId) >= 0) return true;
        if (opts.name && data.names.indexOf(normName(opts.name)) >= 0) return true;
        return false;
    }

    function removeFriend(opts) {
        opts = opts || {};
        var data = load();
        var map = lookup(opts.name) || {};
        var threadId = opts.threadId || map.threadId;
        var socialIds = (opts.socialIds || map.socialIds || []).slice();
        if (opts.socialId && socialIds.indexOf(opts.socialId) < 0) socialIds.push(opts.socialId);

        if (threadId && data.threadIds.indexOf(threadId) < 0) data.threadIds.push(threadId);
        socialIds.forEach(function (sid) {
            if (sid && data.socialIds.indexOf(sid) < 0) data.socialIds.push(sid);
        });
        if (opts.name) {
            var nn = normName(opts.name);
            if (nn && data.names.indexOf(nn) < 0) data.names.push(nn);
        }
        save(data);
        return data;
    }

    function restoreFriend(opts) {
        opts = opts || {};
        var data = load();
        var map = lookup(opts.name) || {};
        var threadId = opts.threadId || map.threadId;
        if (threadId) data.threadIds = data.threadIds.filter(function (x) { return x !== threadId; });
        if (opts.socialId) data.socialIds = data.socialIds.filter(function (x) { return x !== opts.socialId; });
        (opts.socialIds || map.socialIds || []).forEach(function (sid) {
            data.socialIds = data.socialIds.filter(function (x) { return x !== sid; });
        });
        if (opts.name) {
            var nn = normName(opts.name);
            data.names = data.names.filter(function (x) { return x !== nn; });
        }
        save(data);
    }

    global.FL_friendsStore = {
        KEY: KEY,
        load: load,
        isRemoved: isRemoved,
        removeFriend: removeFriend,
        restoreFriend: restoreFriend,
        lookup: lookup
    };
})(window);
