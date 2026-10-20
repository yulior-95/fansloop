/**
 * 话题排行榜 · 搜索「热门话题」等与广场榜对齐（本周排行前 N）
 * 原型：优先读当前页 .tp-leaderboard / .h5-tp-leaderboard 行；否则用与 topics.html 同步的兜底前 4 名
 */
(function (global) {
    /** 与 pages-web/topics.html 榜 1～4 行一致（榜变动时同步此处） */
    var FALLBACK_ROWS = [
        { title: '# 富士山日出', posts: '18.6K 帖', trend: '+186%', href: 'topic-detail.html' },
        { title: '# Apex 大师之路', posts: '12.4K 帖', trend: '+98%', href: 'topic-detail.html' },
        { title: '# 雨夜小提琴', posts: '9.8K 帖', trend: '+72%', href: 'topic-detail.html' },
        { title: '# 城市街拍', posts: '7.6K 帖', trend: '+38%', href: 'topic-detail.html' }
    ];

    function hrefFromRow(row) {
        var oc = row.getAttribute('onclick') || '';
        var m = oc.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
        if (m && m[1]) return m[1];
        return 'topic-detail.html';
    }

    function text(el) {
        return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '';
    }

    function rowFromElement(row) {
        if (!row) return null;
        if (row.getAttribute('data-topic-valid') === '0') return null;
        var title = text(row.querySelector('.tp-lb-title, .h5-lb-title'));
        if (!title) return null;
        var statsWrap = row.querySelector('.tp-lb-stats, .h5-lb-stats');
        var posts = '';
        if (statsWrap && statsWrap.querySelector('span')) {
            posts = text(statsWrap.querySelector('span'));
        }
        var trend = text(row.querySelector('.tp-lb-grow, .h5-lb-grow'));
        trend = trend.replace(/[^\d+%\-~]/g, '').trim();
        if (trend && trend.indexOf('%') === -1 && /^\+?\d/.test(trend)) trend = trend + '%';
        return {
            title: title,
            posts: posts,
            trend: trend,
            href: hrefFromRow(row)
        };
    }

    function toHotItem(row) {
        var sub = row.posts || '';
        if (row.trend) {
            sub = sub ? sub + ' · 趋势 ' + row.trend : '趋势 ' + row.trend;
        }
        return { t: row.title, sub: sub, href: row.href || 'topic-detail.html' };
    }

    function getLeaderboardRowsFromDom(limit) {
        limit = limit || 4;
        var nodes = document.querySelectorAll(
            '.tp-leaderboard .tp-lb-row, .h5-tp-leaderboard .h5-lb-row'
        );
        var out = [];
        for (var i = 0; i < nodes.length && out.length < limit; i++) {
            var parsed = rowFromElement(nodes[i]);
            if (parsed) out.push(parsed);
        }
        return out;
    }

    function getTopicsLeaderboardHotTopics(limit) {
        limit = typeof limit === 'number' ? limit : 4;
        var rows = getLeaderboardRowsFromDom(limit);
        if (rows.length < limit) {
            for (var j = 0; j < FALLBACK_ROWS.length && rows.length < limit; j++) {
                var fb = FALLBACK_ROWS[j];
                var dup = rows.some(function (r) { return r.title === fb.title; });
                if (!dup) rows.push(fb);
            }
        }
        return rows.slice(0, limit).map(toHotItem);
    }

    global.FL_getTopicsLeaderboardHotTopics = getTopicsLeaderboardHotTopics;
    global.FL_topicsLeaderboardFallbackTop4 = FALLBACK_ROWS;
})(typeof window !== 'undefined' ? window : this);
