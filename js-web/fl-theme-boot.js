/**
 * 首屏主题同步（须在 common-web.css 之前加载，避免浅色 FOUC）
 * 与 global-display-prefs.js / app-sidebar-global.js 逻辑一致
 */
(function (g) {
    try {
        var FONT_SCALES = [0.875, 0.9375, 1, 1.0625, 1.125];
        var raw = g.localStorage.getItem('fl_display_prefs_v1');
        var p = raw ? JSON.parse(raw) : {};
        var theme = p.theme || 'dark';
        var resolved = theme === 'auto'
            ? (g.matchMedia && g.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
            : (theme === 'light' ? 'light' : 'dark');
        var html = document.documentElement;
        html.setAttribute('data-fl-theme', resolved);
        html.setAttribute('data-fl-theme-mode', theme);
        html.setAttribute('data-fl-high-contrast', p.highContrast ? '1' : '0');
        html.setAttribute('data-fl-sans', p.sansFont ? '1' : '0');
        html.setAttribute('data-fl-motion', p.uiMotion === false ? '0' : '1');
        html.setAttribute('data-fl-glass', p.glass === false ? '0' : '1');
        var idx = p.fontScaleIndex != null ? p.fontScaleIndex : 2;
        if (idx < 0 || idx >= FONT_SCALES.length) idx = 2;
        html.setAttribute('data-fl-font-scale', String(idx));
        html.style.setProperty('--fl-font-scale', String(FONT_SCALES[idx]));
        html.setAttribute('data-fl-timezone', p.timezone || 'system');
        html.setAttribute('data-theme', resolved);
        html.style.colorScheme = resolved === 'light' ? 'light' : 'dark';
        if (g.localStorage.getItem('fl_sidebar_collapsed') === '1') {
            html.classList.add('sidebar-collapsed-pre');
        }
    } catch (e) { /* ignore */ }
})(window);
