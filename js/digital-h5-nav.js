/**
 * GOODFANS H5 · 数字橱窗交互联动
 * 各页通过 data-go / data-back / .tab-bar 完成流程跳转
 */
(function (global) {
    function go(href) {
        if (!href) return;
        location.href = href;
    }

    function bindClicks(root) {
        var scope = root || document;
        scope.querySelectorAll('[data-go]').forEach(function (el) {
            el.style.cursor = el.style.cursor || 'pointer';
            el.addEventListener('click', function (e) {
                if (el.tagName === 'A') return;
                e.preventDefault();
                e.stopPropagation();
                go(el.getAttribute('data-go'));
            });
        });
        scope.querySelectorAll('[data-back]').forEach(function (el) {
            el.style.cursor = el.style.cursor || 'pointer';
            el.addEventListener('click', function (e) {
                e.preventDefault();
                var fallback = el.getAttribute('data-back') || 'profile.html';
                if (history.length > 1) history.back();
                else go(fallback);
            });
        });
    }

    function bindTabs() {
        var map = {
            '首页': 'home.html',
            '订阅': 'subscriptions.html',
            '发现': 'search.html',
            '消息': 'messages.html',
            '我的': 'profile.html'
        };
        document.querySelectorAll('.tab-bar .tab-item').forEach(function (item) {
            var span = item.querySelector('span');
            var label = span ? span.textContent : item.textContent;
            label = String(label || '').trim();
            var href = map[label];
            if (!href) {
                if (label.indexOf('首页') >= 0) href = map['首页'];
                else if (label.indexOf('订阅') >= 0) href = map['订阅'];
                else if (label.indexOf('发现') >= 0) href = map['发现'];
                else if (label.indexOf('消息') >= 0) href = map['消息'];
                else if (label.indexOf('我的') >= 0) href = map['我的'];
            }
            if (!href) return;
            item.style.cursor = 'pointer';
            item.addEventListener('click', function () { go(href); });
        });
        var create = document.querySelector('.tab-bar .tab-create, .tab-bar .create-btn');
        if (create) {
            var btn = create.classList.contains('create-btn') ? create : create.querySelector('.create-btn') || create;
            btn.style.cursor = 'pointer';
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                go('create.html');
            });
        }
    }

    function bindChips(selector, onChange) {
        var wrap = document.querySelector(selector);
        if (!wrap) return;
        wrap.querySelectorAll('.da-chip').forEach(function (chip) {
            chip.style.cursor = 'pointer';
            chip.addEventListener('click', function () {
                wrap.querySelectorAll('.da-chip').forEach(function (c) { c.classList.remove('on'); });
                chip.classList.add('on');
                if (typeof onChange === 'function') onChange(chip.textContent.trim(), chip);
            });
        });
    }

    function toast(msg) {
        var el = document.getElementById('daToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'daToast';
            el.className = 'da-toast';
            document.body.appendChild(el);
        }
        el.style.position = 'fixed';
        el.style.left = '50%';
        el.style.bottom = 'calc(var(--tab-bar-height, 64px) + 22px)';
        el.style.transform = 'translateX(-50%) translateY(6px)';
        el.style.padding = '9px 14px';
        el.style.borderRadius = '999px';
        el.style.background = 'rgba(20,20,30,0.92)';
        el.style.border = '1px solid rgba(255,255,255,0.18)';
        el.style.color = '#fff';
        el.style.fontSize = '12px';
        el.style.lineHeight = '1.35';
        el.style.whiteSpace = 'nowrap';
        el.style.maxWidth = 'calc(100vw - 32px)';
        el.style.overflow = 'hidden';
        el.style.textOverflow = 'ellipsis';
        el.style.backdropFilter = 'blur(8px)';
        el.style.boxShadow = '0 8px 22px rgba(0,0,0,0.32)';
        el.style.zIndex = '9999';
        el.style.pointerEvents = 'none';
        el.style.opacity = '0';
        el.style.transition = 'opacity .18s ease, transform .18s ease';
        el.textContent = msg;
        el.style.display = 'block';
        requestAnimationFrame(function () {
            el.style.opacity = '1';
            el.style.transform = 'translateX(-50%) translateY(0)';
        });
        clearTimeout(el._t);
        el._t = setTimeout(function () {
            el.style.opacity = '0';
            el.style.transform = 'translateX(-50%) translateY(6px)';
            setTimeout(function () { el.style.display = 'none'; }, 180);
        }, 1600);
    }

    function init() {
        bindClicks();
        bindTabs();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    global.DigitalH5Nav = {
        go: go,
        toast: toast,
        bindChips: bindChips,
        bindClicks: bindClicks
    };
})(window);
