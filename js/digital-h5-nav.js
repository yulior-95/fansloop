/**
 * GOODFANS H5 · 数字橱窗交互联动
 * 各页通过 data-go / data-back / .tab-bar 完成流程跳转
 */
(function (global) {
    var THEME_KEY = 'h5_settings_theme';
    var mql = null;

    function resolveTheme() {
        var pref = localStorage.getItem(THEME_KEY) || 'dark';
        if (pref === 'system') {
            if (!mql && global.matchMedia) mql = global.matchMedia('(prefers-color-scheme: dark)');
            return mql && mql.matches ? 'dark' : 'light';
        }
        return pref === 'light' ? 'light' : 'dark';
    }

    function applyTheme() {
        var theme = resolveTheme();
        var root = document.documentElement;
        root.setAttribute('data-theme', theme);
        if (document.body) {
            document.body.classList.toggle('light-bg', theme === 'light');
            document.body.classList.toggle('dark-bg', theme !== 'light');
        }
        if (theme === 'light') {
            requestAnimationFrame(function () {
                ensureReadableTextInLightTheme();
                setTimeout(ensureReadableTextInLightTheme, 120);
            });
        } else {
            clearReadableTextFix();
        }
        return theme;
    }

    function parseRgbColor(input) {
        if (!input || input === 'transparent') return null;
        var m = String(input).match(/rgba?\(([^)]+)\)/i);
        if (!m) return null;
        var parts = m[1].split(',').map(function (v) { return parseFloat(v.trim()); });
        if (parts.length < 3) return null;
        return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    }

    function luminance(c) {
        function chan(v) {
            v = v / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        }
        return 0.2126 * chan(c.r) + 0.7152 * chan(c.g) + 0.0722 * chan(c.b);
    }

    function getEffectiveBackgroundColor(el) {
        var node = el;
        while (node && node !== document.documentElement) {
            var bg = parseRgbColor(global.getComputedStyle(node).backgroundColor);
            if (bg && bg.a > 0.05) return bg;
            node = node.parentElement;
        }
        return parseRgbColor(global.getComputedStyle(document.body || document.documentElement).backgroundColor) || { r: 245, g: 246, b: 251, a: 1 };
    }

    function clearReadableTextFix() {
        document.querySelectorAll('[data-light-text-fixed="1"]').forEach(function (el) {
            el.style.color = '';
            el.removeAttribute('data-light-text-fixed');
        });
    }

    function ensureReadableTextInLightTheme() {
        if (document.documentElement.getAttribute('data-theme') !== 'light') return;
        var selector = 'p,span,div,a,button,label,strong,small,li,h1,h2,h3,h4,h5,h6';
        document.querySelectorAll(selector).forEach(function (el) {
            if (!el || !el.textContent || !el.textContent.trim()) return;
            if (el.children.length && el.textContent.trim().length <= 1) return;
            var cs = global.getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') return;
            var fg = parseRgbColor(cs.color);
            if (!fg || fg.a <= 0.1) return;
            var bg = getEffectiveBackgroundColor(el);
            var fgLum = luminance(fg);
            var bgLum = luminance(bg);
            var lowContrastInLight = fgLum > 0.78 && bgLum > 0.72;
            if (!lowContrastInLight) return;
            el.style.color = 'var(--text-primary)';
            el.setAttribute('data-light-text-fixed', '1');
        });
    }

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

    function bindDefaultBackButtons() {
        document.querySelectorAll('.nav-bar .nav-left .nav-btn').forEach(function (btn) {
            if (btn.getAttribute('data-back') || btn.getAttribute('data-go')) return;
            if (btn.dataset.autoBackBound === '1') return;
            btn.dataset.autoBackBound = '1';
            btn.style.cursor = btn.style.cursor || 'pointer';
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                if (history.length > 1) history.back();
                else go('profile.html');
            });
        });
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
        var isLight = (document.documentElement.getAttribute('data-theme') === 'light');
        el.style.background = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(20,20,30,0.92)';
        el.style.border = isLight ? '1px solid rgba(22,24,38,0.12)' : '1px solid rgba(255,255,255,0.18)';
        el.style.color = isLight ? '#161826' : '#fff';
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
        applyTheme();
        bindClicks();
        bindDefaultBackButtons();
        bindTabs();
        if (!mql && global.matchMedia) mql = global.matchMedia('(prefers-color-scheme: dark)');
        if (mql && !mql._h5ThemeBound) {
            mql._h5ThemeBound = true;
            mql.addEventListener('change', function () {
                var pref = localStorage.getItem(THEME_KEY) || 'dark';
                if (pref === 'system') applyTheme();
            });
        }
    }

    applyTheme();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    global.DigitalH5Nav = {
        go: go,
        toast: toast,
        bindChips: bindChips,
        bindClicks: bindClicks,
        applyTheme: applyTheme
    };
})(window);
