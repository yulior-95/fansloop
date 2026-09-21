/**
 * GOODFANS H5 · 数字橱窗交互联动
 * 各页通过 data-go / data-back / .tab-bar 完成流程跳转
 */
(function (global) {
    var THEME_KEY = 'h5_settings_theme';
    var mql = null;

    function resolveTheme() {
        if (global.FLDisplayPrefs && typeof global.FLDisplayPrefs.resolveTheme === 'function') {
            var p = global.FLDisplayPrefs.load();
            return global.FLDisplayPrefs.resolveTheme(p.theme);
        }
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
            if (el.closest('.num, .cnt, .unread, .badge-num, .create-btn, .st, .btn-primary, .tab-bar, .da-buybar, .home-overlay, .home-sheet, .live-modal-sheet, .creator-search-inline, .tag, .status')) return;
            if (cs.backgroundImage && cs.backgroundImage !== 'none') return;
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

    var TAB_BAR_ICON_STYLES = {
        /* FA Free 无 regular 版 house，未选中用 solid + CSS 描边模拟线条 */
        house: ['fa-solid fa-house', 'fa-solid fa-house'],
        heart: ['fa-solid fa-heart', 'fa-regular fa-heart'],
        message: ['fa-solid fa-message', 'fa-regular fa-message'],
        user: ['fa-solid fa-user', 'fa-regular fa-user'],
        compass: ['fa-solid fa-compass', 'fa-regular fa-compass']
    };

    function tabBarIconKind(icon) {
        var c = icon.className;
        if (/\bfa-house\b/.test(c)) return 'house';
        if (/\bfa-heart\b/.test(c)) return 'heart';
        if (/\bfa-message\b/.test(c) || /\bfa-comment\b/.test(c)) return 'message';
        if (/\bfa-user\b/.test(c)) return 'user';
        if (/\bfa-compass\b/.test(c)) return 'compass';
        return null;
    }

    function syncTabBarIcons() {
        var bar = document.querySelector('.tab-bar');
        if (!bar) return;
        bar.querySelectorAll('.tab-item').forEach(function (item) {
            var icon = item.querySelector('i[class*="fa-"]');
            if (!icon) return;
            var kind = tabBarIconKind(icon);
            var pair = kind && TAB_BAR_ICON_STYLES[kind];
            if (!pair) return;
            icon.className = item.classList.contains('active') ? pair[0] : pair[1];
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
        syncTabBarIcons();
    }

    function bindDefaultBackButtons() {
        document.querySelectorAll('.nav-bar .nav-left .nav-btn').forEach(function (btn) {
            if (btn.getAttribute('data-back') || btn.getAttribute('data-go') || btn.getAttribute('data-nav-search')) return;
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
            el.setAttribute('role', 'status');
            el.setAttribute('aria-live', 'polite');
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(el._t);
        el._t = setTimeout(function () {
            el.classList.remove('show');
        }, 1600);
    }

    function watchOverlaysForLightTheme() {
        if (document.documentElement.getAttribute('data-theme') !== 'light') return;
        if (document.body && document.body.dataset.lightOvlWatch === '1') return;
        if (document.body) document.body.dataset.lightOvlWatch = '1';
        var timer = null;
        var obs = new MutationObserver(function () {
            if (document.documentElement.getAttribute('data-theme') !== 'light') return;
            clearTimeout(timer);
            timer = setTimeout(ensureReadableTextInLightTheme, 80);
        });
        obs.observe(document.body || document.documentElement, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'open']
        });
    }

    function init() {
        applyTheme();
        watchOverlaysForLightTheme();
        bindClicks();
        bindDefaultBackButtons();
        bindTabs();
        if (!mql && global.matchMedia) mql = global.matchMedia('(prefers-color-scheme: dark)');
        if (mql && !mql._h5ThemeBound) {
            mql._h5ThemeBound = true;
            mql.addEventListener('change', function () {
                if (global.FLDisplayPrefs) {
                    var p = global.FLDisplayPrefs.load();
                    if (p.theme === 'auto') applyTheme();
                    return;
                }
                var pref = localStorage.getItem(THEME_KEY) || 'dark';
                if (pref === 'system') applyTheme();
            });
        }
        if (!global._h5DisplayPrefsBound) {
            global._h5DisplayPrefsBound = true;
            global.addEventListener('goodfans-display-change', function () {
                applyTheme();
                watchOverlaysForLightTheme();
            });
        }
    }

    applyTheme();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /** 数字商品详情页：预览 / 本人视角 / 购买栏 */
    function initDaProductDetail(opts) {
        opts = opts || {};
        var params = new URLSearchParams(location.search);
        var preview = params.get('preview') === '1';
        var owner = params.get('owner') === '1';
        var navTitle = document.querySelector('.nav-bar .nav-title');
        if (navTitle) {
            if (preview) navTitle.textContent = '预览';
            else if (owner) navTitle.textContent = '商品详情';
        }
        var shareBtn = document.getElementById('btnShare');
        if (shareBtn) shareBtn.parentNode.removeChild(shareBtn);
        var btn = document.getElementById('btnBuy');
        if (btn && (preview || owner)) {
            btn.disabled = true;
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
            btn.textContent = preview ? '预览不可购买' : '本人不可购买';
            return;
        }
        if (btn && typeof opts.onBuy === 'function') {
            btn.addEventListener('click', opts.onBuy);
        }
    }

    global.DigitalH5Nav = {
        go: go,
        toast: toast,
        bindChips: bindChips,
        bindClicks: bindClicks,
        applyTheme: applyTheme,
        initDaProductDetail: initDaProductDetail
    };
})(window);
