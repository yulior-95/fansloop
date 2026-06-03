/**
 * 发现页 · 游客 / 登录 · 免费 / 付费 Teaser 访问规则（OnlyFans 风格公域逻辑）
 */
(function (global) {
    var SUBS_KEY = 'fl_disc_mock_subs';

    function isGuest() {
        var qs = new URLSearchParams(location.search);
        if (qs.get('guest') === '1') return true;
        if (qs.get('guest') === '0') return false;
        if (/discover-guest\.html/i.test(location.pathname)) return true;
        return false;
    }

    function isPaidPost(p) {
        if (!p || p.live) return false;
        return !!(p.premium || p.payType === 'subscribe' || p.payType === 'ppv');
    }

    function isFreePost(p) {
        return !isPaidPost(p) && !p.live;
    }

    function getSubscribedCreators() {
        try {
            var raw = localStorage.getItem(SUBS_KEY);
            if (raw) return JSON.parse(raw);
        } catch (_) { /* noop */ }
        return [];
    }

    function canViewFull(p) {
        if (!p) return false;
        if (p.live || !isPaidPost(p)) return true;
        var subs = getSubscribedCreators();
        if (p.creatorId && subs.indexOf(p.creatorId) >= 0) return true;
        return false;
    }

    function needsTeaser(p) {
        return isPaidPost(p) && !canViewFull(p);
    }

    function parseLikes(p) {
        if (typeof p.likes === 'number') return p.likes;
        var s = String(p.likes || '0');
        var n = parseFloat(s.replace(/[^\d.]/g, '')) || 0;
        if (/k/i.test(s)) n *= 1000;
        if (/w|万/i.test(s)) n *= 10000;
        return n;
    }

    function hotScore(p) {
        var likes = parseLikes(p);
        var comments = typeof p.comments === 'number' ? p.comments : 0;
        var boost = p.featured ? 800 : 0;
        return likes + comments * 2 + boost;
    }

    function rankPosts(list) {
        return list.slice().sort(function (a, b) {
            var sa = hotScore(a);
            var sb = hotScore(b);
            if (needsTeaser(a)) sa *= 0.55;
            if (needsTeaser(b)) sb *= 0.55;
            return sb - sa;
        });
    }

    function filterFeedForDiscover(categoryId) {
        var T = global.FL_DISCOVER_TAXONOMY;
        if (!T) return [];
        var list = T.filterPosts(categoryId || 'all');
        if (isGuest()) {
            return rankPosts(list.filter(isFreePost)).slice(0, 5);
        }
        return rankPosts(list);
    }

    function payLabel(p) {
        if (p.payType === 'ppv' && p.price != null) return '$' + p.price + ' 解锁';
        if (p.price != null) return '订阅专享 · $' + p.price + '/月';
        return '订阅专享';
    }

    function subscribePrice(p) {
        return p.subscribePrice != null ? p.subscribePrice : 28;
    }

    function paidPostCount(p) {
        return p.paidPostCount != null ? p.paidPostCount : 12;
    }

    global.FL_DISCOVER_ACCESS = {
        isGuest: isGuest,
        isPaidPost: isPaidPost,
        isFreePost: isFreePost,
        canViewFull: canViewFull,
        needsTeaser: needsTeaser,
        filterFeedForDiscover: filterFeedForDiscover,
        payLabel: payLabel,
        subscribePrice: subscribePrice,
        paidPostCount: paidPostCount,
        hotScore: hotScore,
        rankPosts: rankPosts,
        getSubscribedCreators: getSubscribedCreators
    };
})(window);
