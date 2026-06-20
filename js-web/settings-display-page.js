/**
 * 设置 · 外观与语言页交互
 */
(function () {
    var FONT_LABELS = window.FLDisplayPrefs ? window.FLDisplayPrefs.FONT_LABELS : ['80%', '90%', '100%', '106%', '112%'];

    var LANG_MAP = [
        { code: 'zh-CN', flag: '🇨🇳', name: '简体中文' },
        { code: 'zh-TW', flag: '🇹🇼', name: '繁體中文' },
        { code: 'en', flag: '🇺🇸', name: 'English' },
        { code: 'ja', flag: '🇯🇵', name: '日本語' },
        { code: 'ko', flag: '🇰🇷', name: '한국어' },
        { code: 'es', flag: '🇪🇸', name: 'Español' },
        { code: 'fr', flag: '🇫🇷', name: 'Français' },
        { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
        { code: 'pt-BR', flag: '🇵🇹', name: 'Português' },
        { code: 'ru', flag: '🇷🇺', name: 'Русский' },
        { code: 'ar', flag: '🇸🇦', name: 'العربية' },
        { code: 'th', flag: '🇹🇭', name: 'ไทย' },
        { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt' },
        { code: 'id', flag: '🇮🇩', name: 'Indonesia' },
        { code: 'it', flag: '🇮🇹', name: 'Italiano' }
    ];

    function $(id) { return document.getElementById(id); }

    function toast(msg) {
        var el = $('dispPageToast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { el.classList.remove('show'); }, 2400);
    }

    function prefs() {
        return window.FLDisplayPrefs ? window.FLDisplayPrefs.load() : {};
    }

    function setPref(partial) {
        if (!window.FLDisplayPrefs) return;
        window.FLDisplayPrefs.set(partial);
    }

    function syncThemeCards() {
        var p = prefs();
        document.querySelectorAll('.theme-card[data-theme]').forEach(function (card) {
            card.classList.toggle('active', card.getAttribute('data-theme') === p.theme);
        });
    }

    function syncFontSlider() {
        var p = prefs();
        var slider = $('dispFontSlider');
        var valEl = $('dispFontVal');
        var idx = p.fontScaleIndex != null ? p.fontScaleIndex : 2;
        if (slider) {
            slider.value = String(idx);
            updateRangeFill(slider);
        }
        if (valEl) valEl.textContent = FONT_LABELS[idx] || '100%';
        updateFontPreview(idx);
    }

    function updateRangeFill(slider) {
        if (!slider) return;
        var min = Number(slider.min || 0);
        var max = Number(slider.max || 4);
        var val = Number(slider.value || 0);
        var pct = ((val - min) / (max - min)) * 100;
        slider.style.background = 'linear-gradient(90deg, var(--brand-purple) 0%, var(--brand-pink) ' + pct + '%, var(--bg-input) ' + pct + '%, var(--bg-input) 100%)';
    }

    function updateFontPreview(idx) {
        var mul = window.FLDisplayPrefs ? window.FLDisplayPrefs.FONT_SCALES[idx] : 1;
        var box = $('dispFontPreview');
        if (!box) return;
        box.style.fontSize = '';
        var h = box.querySelector('.fp-h');
        var b = box.querySelector('.fp-b');
        if (h) h.style.fontSize = (18 * mul) + 'px';
        if (b) b.style.fontSize = (13.5 * mul) + 'px';
    }

    function syncSwitches() {
        var p = prefs();
        var map = {
            swHighContrast: p.highContrast,
            swSansFont: p.sansFont,
            swUiMotion: p.uiMotion !== false,
            swGlass: p.glass !== false
        };
        Object.keys(map).forEach(function (id) {
            var el = $(id);
            if (el) {
                el.classList.toggle('on', !!map[id]);
                el.setAttribute('aria-checked', map[id] ? 'true' : 'false');
            }
        });
    }

    function syncLangGrid() {
        var code = window.FansLoopLang ? window.FansLoopLang.getLang() : 'zh-CN';
        document.querySelectorAll('.lang-item[data-lang]').forEach(function (item) {
            item.classList.toggle('on', item.getAttribute('data-lang') === code);
        });
    }

    function bindTheme() {
        document.querySelectorAll('.theme-card[data-theme]').forEach(function (card) {
            function pick() {
                var theme = card.getAttribute('data-theme');
                setPref({ theme: theme });
                syncThemeCards();
                var labels = { dark: '深色', light: '浅色', auto: '跟随系统' };
                toast('已切换为「' + (labels[theme] || theme) + '」主题 · 全站已生效');
            }
            card.addEventListener('click', pick);
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    pick();
                }
            });
        });
    }

    function bindFontSlider() {
        var slider = $('dispFontSlider');
        if (!slider) return;
        slider.addEventListener('input', function () {
            var idx = Number(slider.value);
            setPref({ fontScaleIndex: idx });
            updateRangeFill(slider);
            var valEl = $('dispFontVal');
            if (valEl) valEl.textContent = FONT_LABELS[idx];
            updateFontPreview(idx);
        });
        slider.addEventListener('change', function () {
            toast('字体大小已设为 ' + FONT_LABELS[Number(slider.value)] + ' · 全站已生效');
        });
    }

    function bindSwitch(id, key, labelOn, labelOff) {
        var el = $(id);
        if (!el) return;
        function toggle() {
            var next = !el.classList.contains('on');
            var patch = {};
            patch[key] = next;
            setPref(patch);
            el.classList.toggle('on', next);
            el.setAttribute('aria-checked', next ? 'true' : 'false');
            toast(next ? labelOn : labelOff);
        }
        el.addEventListener('click', toggle);
        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });
    }

    function bindLang() {
        document.querySelectorAll('.lang-item[data-lang]').forEach(function (item) {
            item.addEventListener('click', function () {
                var code = item.getAttribute('data-lang');
                if (window.FansLoopLang) {
                    window.FansLoopLang.setLang(code);
                } else {
                    try { localStorage.setItem('fansloop-ui-lang', code); } catch (e) { /* ignore */ }
                }
                syncLangGrid();
                toast('界面语言已切换 · 全站菜单与按钮已更新');
            });
        });

        var search = $('dispLangSearch');
        if (search) {
            search.addEventListener('input', function () {
                var q = search.value.trim().toLowerCase();
                document.querySelectorAll('.lang-item[data-lang]').forEach(function (item) {
                    var name = (item.querySelector('.nm')?.textContent || '').toLowerCase();
                    var code = item.getAttribute('data-lang').toLowerCase();
                    item.style.display = !q || name.indexOf(q) >= 0 || code.indexOf(q) >= 0 ? '' : 'none';
                });
            });
        }
    }

    function bindReset() {
        $('btnDispReset')?.addEventListener('click', function () {
            if (!window.FLDisplayPrefs) return;
            window.FLDisplayPrefs.reset();
            syncThemeCards();
            syncFontSlider();
            syncSwitches();
            syncLangGrid();
            if (window.FansLoopLang) window.FansLoopLang.setLang('zh-CN');
            toast('已恢复默认外观设置');
        });
    }

    function init() {
        syncThemeCards();
        syncFontSlider();
        syncSwitches();
        syncLangGrid();
        bindTheme();
        bindFontSlider();
        bindSwitch('swHighContrast', 'highContrast', '高对比模式已开启 · 全站文字对比度提升', '高对比模式已关闭');
        bindSwitch('swSansFont', 'sansFont', '已切换为系统无衬线字体 · 全站生效', '已恢复 Inter 默认字体');
        bindSwitch('swUiMotion', 'uiMotion', '界面动画已开启', '界面动画已关闭 · 全站减少动效');
        bindSwitch('swGlass', 'glass', '背景毛玻璃已开启', '背景毛玻璃已关闭 · 全站使用实色背景');
        bindLang();
        bindReset();

        document.addEventListener('fansloop-lang-change', function () {
            syncLangGrid();
        });

        document.addEventListener('fansloop-display-change', function () {
            syncThemeCards();
            syncFontSlider();
            syncSwitches();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
