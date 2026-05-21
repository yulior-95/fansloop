/**
 * 全站全局搜索 · 下拉（历史 / 热门 / 推荐关注）
 */
(function () {
    var HOT_TOPICS = [
        { t: '# 富士山日出', sub: '2.1k 帖子 · 趋势 +18%', href: 'topic-detail.html' },
        { t: '# Web3 创作者经济', sub: '8.4k 帖子', href: 'topics.html' },
        { t: '# 春日 Vlog', sub: '1.2k 帖子', href: 'topic-detail.html' },
        { t: '# 一首歌的故事', sub: '920 帖子', href: 'topic-detail.html' }
    ];
    var RECOMMEND_FOLLOW = [
        { n: '银盐时代', h: '摄影 · 1.2k 粉丝', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80' },
        { n: '夜间速写', h: '绘画 · 856 粉丝', av: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80' },
        { n: '代码诗人', h: '科技 · 2.4k 粉丝', av: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=80' }
    ];
    var GS_ITEMS = [
        { t: '创作者 Luna', sub: '@luna · 认证创作者', href: 'profile.html' },
        { t: '# 富士山日出', sub: '话题 · 2.1k 帖子', href: 'topic-detail.html' },
        { t: '京都樱花摄影教程', sub: '内容 · Lens 旅记', href: 'discover.html' },
        { t: 'Web3 创作者经济', sub: '话题', href: 'topics.html' }
    ];
    var HISTORY_KEY = 'fl_search_history';

    function toast(msg) {
        if (typeof window.toast === 'function') {
            window.toast(msg);
            return;
        }
        var host = document.getElementById('toastHostF');
        if (!host) return;
        var t = document.createElement('div');
        t.className = 'toast-f';
        t.textContent = msg;
        host.appendChild(t);
        setTimeout(function () { t.remove(); }, 2400);
    }

    function loadHistory() {
        try {
            return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }
    function saveHistory(list) {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
        } catch (e) {}
    }
    function pushHistory(q) {
        q = (q || '').trim();
        if (!q) return;
        var list = loadHistory().filter(function (x) { return x !== q; });
        list.unshift(q);
        saveHistory(list.slice(0, 8));
    }

    function bindSearch(wrap) {
        if (!wrap || wrap.getAttribute('data-gs-bound') === '1') return;
        var gInp = wrap.querySelector('input[type="search"], input[type="text"]');
        var gDrop = wrap.querySelector('.gs-drop');
        if (!gInp || !gDrop) return;
        wrap.setAttribute('data-gs-bound', '1');

        function renderSearchDrop() {
            var q = (gInp.value || '').trim().toLowerCase();
            var history = loadHistory();
            var html = '';

            html += '<div class="gs-drop-sec"><div class="gs-sec-hd"><span>历史搜索</span>';
            html += '<button type="button" class="btn-clear-search-history">清空</button></div>';
            if (history.length) {
                html += '<div class="gs-history-tags">';
                history.forEach(function (h) {
                    html += '<button type="button" data-hist="' + h.replace(/"/g, '&quot;') + '">' + h + '</button>';
                });
                html += '</div>';
            } else {
                html += '<p style="font-size:11px;color:var(--t-quaternary);margin:0">暂无历史记录</p>';
            }
            html += '</div>';

            html += '<div class="gs-drop-sec"><div class="gs-sec-hd"><span>热门话题</span></div>';
            HOT_TOPICS.forEach(function (x) {
                html += '<button type="button" class="gs-drop-row" data-href="' + x.href + '"><i class="fa-solid fa-fire" style="color:#F472B6"></i><span class="info"><span class="n">' + x.t + '</span><span class="h">' + x.sub + '</span></span></button>';
            });
            html += '</div>';

            html += '<div class="gs-drop-sec"><div class="gs-sec-hd"><span>推荐关注</span><a href="discover.html" style="font-size:11px;color:var(--brand-purple)">发现页</a></div>';
            RECOMMEND_FOLLOW.forEach(function (x) {
                html += '<button type="button" class="gs-drop-row" data-href="creator-profile.html">' +
                    '<span class="av av-sm" style="background-image:url(\'' + x.av + '\')"></span>' +
                    '<span class="info"><span class="n">' + x.n + '</span><span class="h">' + x.h + '</span></span>' +
                    '<span class="follow-mini">+ 关注</span></button>';
            });
            html += '</div>';

            if (q) {
                var hits = GS_ITEMS.filter(function (x) {
                    return x.t.toLowerCase().includes(q) || x.sub.toLowerCase().includes(q);
                });
                if (hits.length) {
                    html += '<div class="gs-drop-sec"><div class="gs-sec-hd"><span>搜索结果</span></div>';
                    hits.forEach(function (x) {
                        html += '<button type="button" class="gs-drop-row" data-href="' + x.href + '"><span class="info"><span class="n">' + x.t + '</span><span class="h">' + x.sub + '</span></span></button>';
                    });
                    html += '</div>';
                }
            }

            gDrop.innerHTML = html;
            gDrop.classList.add('show');

            gDrop.querySelectorAll('.btn-clear-search-history').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    saveHistory([]);
                    renderSearchDrop();
                    toast('已清空历史搜索');
                });
            });
            gDrop.querySelectorAll('[data-hist]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    gInp.value = btn.getAttribute('data-hist');
                    pushHistory(gInp.value);
                    renderSearchDrop();
                });
            });
            gDrop.querySelectorAll('[data-href]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var href = btn.getAttribute('data-href');
                    if (href) location.href = href;
                });
            });
        }

        function submitSearch() {
            pushHistory(gInp.value);
            toast('已搜索：' + (gInp.value || '热门推荐'));
            gDrop.classList.remove('show');
        }

        gInp.addEventListener('focus', renderSearchDrop);
        gInp.addEventListener('click', renderSearchDrop);
        gInp.addEventListener('input', renderSearchDrop);
        gInp.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitSearch();
            }
        });
    }

    function initAll() {
        document.querySelectorAll('.app-header .h-search-unified').forEach(bindSearch);
    }

    initAll();
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.h-search-unified')) {
            document.querySelectorAll('.h-search-unified .gs-drop.show').forEach(function (d) {
                d.classList.remove('show');
            });
        }
    });
    document.addEventListener('DOMContentLoaded', initAll);
})();
