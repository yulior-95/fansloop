/**
 * 话题排行榜 · 懒加载（滚到底 + 点击「加载更多」）
 * 需求：docs/prototype-topics-search-requirements.html §1.2
 * 原型：展示带 .is-lazy-hidden 的行；上线：改为请求分页接口并 append。
 */
(function () {
    /** 原型每批 5 条；上线改为接口 pageSize */
    var BATCH = 5;
    var loading = false;

    function boards() {
        return document.querySelectorAll('.tp-leaderboard, .h5-tp-leaderboard');
    }

    function hiddenRows(board) {
        return board.querySelectorAll('.tp-lb-row.is-lazy-hidden, .h5-lb-row.is-lazy-hidden');
    }

    function loadMore(board) {
        if (loading) return false;
        var hidden = hiddenRows(board);
        if (!hidden.length) return false;
        loading = true;
        var n = 0;
        hidden.forEach(function (row) {
            if (n >= BATCH) return;
            row.classList.remove('is-lazy-hidden');
            n += 1;
        });
        loading = false;
        return true;
    }

    function loadAllBoards() {
        var any = false;
        boards().forEach(function (board) {
            if (loadMore(board)) any = true;
        });
        syncFooter();
        return any;
    }

    function syncFooter() {
        var btn = document.getElementById('tpLbLoadMore');
        if (!btn) return;
        var left = 0;
        boards().forEach(function (board) {
            left += hiddenRows(board).length;
        });
        if (left === 0) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> 已加载全部话题';
        }
    }

    /** 哨兵首屏常在视口内，IO 会连触发直到榜末；须用户先滚动再允许滚到底自动加载 */
    function bindScrollGate(scrollRoot) {
        var gate = false;
        function open() {
            gate = true;
        }
        if (scrollRoot) {
            scrollRoot.addEventListener('scroll', open, { passive: true });
        }
        window.addEventListener('scroll', open, { passive: true });
        return function () {
            return gate;
        };
    }

    function bind() {
        var btn = document.getElementById('tpLbLoadMore');
        if (btn) {
            btn.addEventListener('click', function () {
                loadAllBoards();
            });
        }

        var sentinel = document.getElementById('tpLbSentinel');
        var scrollRoot =
            document.querySelector('main.app-main') ||
            document.querySelector('.h5-topics-page .app-content') ||
            null;
        var scrollGateOpen = bindScrollGate(scrollRoot);

        if (sentinel && 'IntersectionObserver' in window) {
            var loadedWhileVisible = false;
            var io = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (entry) {
                        if (!entry.isIntersecting) {
                            loadedWhileVisible = false;
                            return;
                        }
                        if (!scrollGateOpen() || loadedWhileVisible) return;
                        if (loadAllBoards()) loadedWhileVisible = true;
                    });
                },
                { root: scrollRoot, rootMargin: '80px', threshold: 0 }
            );
            io.observe(sentinel);
        } else if (sentinel) {
            var scrollLoaded = false;
            var onScroll = function () {
                if (!scrollGateOpen()) return;
                var rootRect = scrollRoot
                    ? scrollRoot.getBoundingClientRect()
                    : { bottom: window.innerHeight, top: 0 };
                var rect = sentinel.getBoundingClientRect();
                var visible = rect.top <= rootRect.bottom + 80;
                if (!visible) {
                    scrollLoaded = false;
                    return;
                }
                if (scrollLoaded) return;
                if (loadAllBoards()) scrollLoaded = true;
            };
            (scrollRoot || window).addEventListener('scroll', onScroll, { passive: true });
        }

        syncFooter();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
})();
