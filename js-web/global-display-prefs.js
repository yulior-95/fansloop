/**
 * FansLoop · 全局外观偏好（主题 / 字体 / 动效 / 毛玻璃 / 高对比 / 无衬线）
 * 写入 localStorage，全站通过 html 属性即时生效
 */
(function (global) {
    var STORAGE = 'fl_display_prefs_v1';

    var FONT_SCALES = [0.875, 0.9375, 1, 1.0625, 1.125];
    var FONT_LABELS = ['80%', '90%', '100%', '106%', '112%'];

    var DEFAULTS = {
        theme: 'dark',
        fontScaleIndex: 2,
        highContrast: false,
        sansFont: false,
        uiMotion: true,
        glass: true
    };

    function load() {
        try {
            var raw = localStorage.getItem(STORAGE);
            if (!raw) return Object.assign({}, DEFAULTS);
            return Object.assign({}, DEFAULTS, JSON.parse(raw));
        } catch (e) {
            return Object.assign({}, DEFAULTS);
        }
    }

    function save(prefs) {
        try {
            localStorage.setItem(STORAGE, JSON.stringify(prefs));
        } catch (e) { /* ignore */ }
    }

    function resolveTheme(theme) {
        if (theme === 'auto') {
            return global.matchMedia && global.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }
        return theme === 'light' ? 'light' : 'dark';
    }

    function apply(prefs) {
        prefs = prefs || load();
        var html = document.documentElement;
        var resolved = resolveTheme(prefs.theme);

        html.setAttribute('data-fl-theme', resolved);
        html.setAttribute('data-fl-theme-mode', prefs.theme || 'dark');
        html.setAttribute('data-fl-high-contrast', prefs.highContrast ? '1' : '0');
        html.setAttribute('data-fl-sans', prefs.sansFont ? '1' : '0');
        html.setAttribute('data-fl-motion', prefs.uiMotion === false ? '0' : '1');
        html.setAttribute('data-fl-glass', prefs.glass === false ? '0' : '1');

        var idx = prefs.fontScaleIndex;
        if (idx == null || idx < 0 || idx >= FONT_SCALES.length) idx = DEFAULTS.fontScaleIndex;
        html.setAttribute('data-fl-font-scale', String(idx));
        html.style.setProperty('--fl-font-scale', String(FONT_SCALES[idx]));
    }

    function set(partial) {
        var prefs = Object.assign(load(), partial || {});
        save(prefs);
        apply(prefs);
        try {
            global.dispatchEvent(new CustomEvent('fansloop-display-change', { detail: prefs }));
        } catch (e) { /* ignore */ }
        return prefs;
    }

    function reset() {
        save(Object.assign({}, DEFAULTS));
        apply(DEFAULTS);
        return Object.assign({}, DEFAULTS);
    }

    /* 首屏同步应用，减少主题闪烁 */
    apply(load());

    if (global.matchMedia) {
        global.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
            var p = load();
            if (p.theme === 'auto') apply(p);
        });
    }

    global.FLDisplayPrefs = {
        STORAGE: STORAGE,
        DEFAULTS: DEFAULTS,
        FONT_SCALES: FONT_SCALES,
        FONT_LABELS: FONT_LABELS,
        load: load,
        save: save,
        apply: apply,
        set: set,
        reset: reset,
        resolveTheme: resolveTheme
    };
})(window);
