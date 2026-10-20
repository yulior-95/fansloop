/**
 * 话题广场 Hero · 标题 N（有效话题总数）
 * 产品定义：docs/prototype-topics-search-requirements.html §1.3
 * 原型：数榜单 DOM 总行数（含懒加载未展示行）；与首屏条数无关。上线：GET /topics/stats/summary → validTopicCount
 */
(function () {
    function countValidTopics() {
        var cards = document.querySelectorAll(
            '.tp-leaderboard .tp-lb-row[data-topic-valid="1"], .h5-tp-leaderboard .h5-lb-row[data-topic-valid="1"]'
        );
        if (!cards.length) {
            cards = document.querySelectorAll('.tp-leaderboard .tp-lb-row, .h5-tp-leaderboard .h5-lb-row');
        }
        var seen = Object.create(null);
        var n = 0;
        cards.forEach(function (card) {
            if (card.getAttribute('data-topic-valid') === '0') return;
            var id = card.getAttribute('data-topic-id');
            if (!id) {
                var hashEl = card.querySelector('.tp-lb-title, .h5-lb-title');
                id = hashEl ? hashEl.textContent.replace(/\s+/g, ' ').trim() : '';
            }
            if (!id) id = 'idx-' + n;
            if (seen[id]) return;
            seen[id] = true;
            n += 1;
        });
        return n;
    }

    function formatHeroTotal(n) {
        if (n <= 0) return '0';
        if (n >= 1000) return Math.floor(n / 100) * 100 + '+';
        if (n >= 100) return Math.floor(n / 10) * 10 + '+';
        return String(n);
    }

    function paint() {
        var el = document.getElementById('topicsHeroTotal');
        if (!el) return;
        el.textContent = formatHeroTotal(countValidTopics());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', paint);
    } else {
        paint();
    }
})();
