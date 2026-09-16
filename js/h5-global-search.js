/**
 * H5 首页 · 全局搜索浮层（对齐 Web global-search.js · fl_search_history）
 */
(function (global) {
    var HISTORY_KEY = 'fl_search_history';
    var HOT_TOPICS = [
        { t: '# 富士山日出', sub: '2.1k 帖子 · 趋势 +18%', href: 'search.html?q=' + encodeURIComponent('富士山日出') },
        { t: '# Web3 创作者经济', sub: '8.4k 帖子', href: 'search.html?q=' + encodeURIComponent('Web3 创作者经济') },
        { t: '# 春日 Vlog', sub: '1.2k 帖子', href: 'search.html?q=' + encodeURIComponent('春日 Vlog') },
        { t: '# 一首歌的故事', sub: '920 帖子', href: 'search.html?q=' + encodeURIComponent('一首歌的故事') }
    ];
    var RECOMMEND_FOLLOW = [
        { n: '银盐时代', h: '摄影 · 1.2k 粉丝', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80', href: 'creator-profile.html' },
        { n: '夜间速写', h: '绘画 · 856 粉丝', av: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80', href: 'creator-profile.html' },
        { n: '代码诗人', h: '科技 · 2.4k 粉丝', av: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=80', href: 'creator-profile.html' }
    ];
    var GS_ITEMS = [
        { t: '创作者 Luna', sub: '@luna · 认证创作者', href: 'creator-profile.html' },
        { t: '# 富士山日出', sub: '话题 · 2.1k 帖子', href: 'search.html?q=' + encodeURIComponent('富士山日出') },
        { t: '京都樱花摄影教程', sub: '内容 · Lens 旅记', href: 'search.html?q=' + encodeURIComponent('京都樱花') },
        { t: 'Web3 创作者经济', sub: '话题', href: 'search.html?q=' + encodeURIComponent('Web3 创作者经济') }
    ];

    function toast(msg) {
        if (global.DigitalH5Nav && typeof global.DigitalH5Nav.toast === 'function') {
            global.DigitalH5Nav.toast(msg);
            return;
        }
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
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
        } catch (e) { /* ignore */ }
    }
    function pushHistory(q) {
        q = (q || '').trim();
        if (!q) return;
        var list = loadHistory().filter(function (x) { return x !== q; });
        list.unshift(q);
        saveHistory(list.slice(0, 8));
    }

    function openPanel() {
        var overlay = document.getElementById('h5SearchOverlay');
        var panel = document.getElementById('h5SearchPanel');
        var inp = document.getElementById('h5GlobalSearchInp');
        if (!overlay || !panel) return;
        overlay.classList.add('show');
        panel.classList.add('show');
        document.body.classList.add('h5-search-open');
        renderDrop();
        setTimeout(function () {
            if (inp) {
                inp.focus();
                try { inp.select(); } catch (err) { /* noop */ }
            }
        }, 120);
    }

    function closePanel() {
        var overlay = document.getElementById('h5SearchOverlay');
        var panel = document.getElementById('h5SearchPanel');
        if (overlay) overlay.classList.remove('show');
        if (panel) panel.classList.remove('show');
        document.body.classList.remove('h5-search-open');
    }

    function goSearchPage(q) {
        q = (q || '').trim();
        if (q) pushHistory(q);
        closePanel();
        global.location.href = 'search.html?q=' + encodeURIComponent(q || '');
    }

    function renderDrop() {
        var drop = document.getElementById('h5GlobalSearchDrop');
        var inp = document.getElementById('h5GlobalSearchInp');
        if (!drop) return;
        var q = (inp && inp.value || '').trim().toLowerCase();
        var history = loadHistory();
        var html = '';

        html += '<div class="h5-gs-sec"><div class="h5-gs-hd"><span>历史搜索</span>';
        html += '<button type="button" class="h5-gs-clear">清空</button></div>';
        if (history.length) {
            html += '<div class="h5-gs-tags">';
            history.forEach(function (h) {
                html += '<button type="button" class="h5-gs-tag" data-hist="' + esc(h) + '">' + esc(h) + '</button>';
            });
            html += '</div>';
        } else {
            html += '<p class="h5-gs-empty">暂无历史记录</p>';
        }
        html += '</div>';

        html += '<div class="h5-gs-sec"><div class="h5-gs-hd"><span>热门话题</span></div>';
        HOT_TOPICS.forEach(function (x) {
            html += '<button type="button" class="h5-gs-row" data-href="' + esc(x.href) + '">' +
                '<i class="fa-solid fa-fire" style="color:#F472B6"></i>' +
                '<span class="info"><span class="n">' + esc(x.t) + '</span><span class="h">' + esc(x.sub) + '</span></span></button>';
        });
        html += '</div>';

        html += '<div class="h5-gs-sec"><div class="h5-gs-hd"><span>推荐关注</span>' +
            '<button type="button" class="h5-gs-link" data-href="search.html">搜索页</button></div>';
        RECOMMEND_FOLLOW.forEach(function (x) {
            html += '<button type="button" class="h5-gs-row" data-href="' + esc(x.href) + '">' +
                '<span class="av" style="background-image:url(\'' + x.av + '\')"></span>' +
                '<span class="info"><span class="n">' + esc(x.n) + '</span><span class="h">' + esc(x.h) + '</span></span>' +
                '<span class="follow-mini">+ 关注</span></button>';
        });
        html += '</div>';

        if (q) {
            var hits = GS_ITEMS.filter(function (x) {
                return x.t.toLowerCase().indexOf(q) >= 0 || x.sub.toLowerCase().indexOf(q) >= 0;
            });
            if (hits.length) {
                html += '<div class="h5-gs-sec"><div class="h5-gs-hd"><span>搜索结果</span></div>';
                hits.forEach(function (x) {
                    html += '<button type="button" class="h5-gs-row" data-href="' + esc(x.href) + '">' +
                        '<span class="info"><span class="n">' + esc(x.t) + '</span><span class="h">' + esc(x.sub) + '</span></span></button>';
                });
                html += '</div>';
            }
        }

        drop.innerHTML = html;

        drop.querySelectorAll('.h5-gs-clear').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                saveHistory([]);
                renderDrop();
                toast('已清空历史搜索');
            });
        });
        drop.querySelectorAll('[data-hist]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (inp) inp.value = btn.getAttribute('data-hist') || '';
                pushHistory(inp.value);
                renderDrop();
            });
        });
        drop.querySelectorAll('[data-href]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var href = btn.getAttribute('data-href');
                closePanel();
                if (href) global.location.href = href;
            });
        });
    }

    function bind() {
        var openBtn = document.querySelector('.top-nav .search-icon');
        var overlay = document.getElementById('h5SearchOverlay');
        var cancel = document.getElementById('h5SearchCancel');
        var inp = document.getElementById('h5GlobalSearchInp');
        if (!openBtn || !document.getElementById('h5SearchPanel')) return;

        openBtn.setAttribute('role', 'button');
        openBtn.setAttribute('tabindex', '0');
        openBtn.setAttribute('aria-label', '搜索');
        openBtn.style.cursor = 'pointer';

        openBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            openPanel();
        });
        openBtn.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openPanel();
            }
        });

        if (overlay) {
            overlay.addEventListener('click', closePanel);
        }
        if (cancel) {
            cancel.addEventListener('click', function (e) {
                e.preventDefault();
                closePanel();
            });
        }
        if (inp) {
            inp.addEventListener('input', renderDrop);
            inp.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    goSearchPage(inp.value);
                }
                if (e.key === 'Escape') closePanel();
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && document.body.classList.contains('h5-search-open')) {
                closePanel();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
})(typeof window !== 'undefined' ? window : this);
