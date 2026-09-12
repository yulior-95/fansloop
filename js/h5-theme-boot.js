/**
 * H5 主题首屏同步 · 须放在 <head>（common.css 之后）以避免浅色 FOUC
 * 与 digital-h5-nav.js 共用 localStorage key: h5_settings_theme
 */
(function (global) {
    try {
        var key = 'h5_settings_theme';
        var pref = localStorage.getItem(key) || 'dark';
        var theme = pref;
        if (pref === 'system') {
            theme = (global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
        } else if (pref !== 'light') {
            theme = 'dark';
        }
        var root = document.documentElement;
        root.setAttribute('data-theme', theme);
        if (theme === 'light') root.style.colorScheme = 'light';
        else root.style.colorScheme = 'dark';
        function paintBody() {
            if (!document.body) return;
            document.body.classList.toggle('light-bg', theme === 'light');
            document.body.classList.toggle('dark-bg', theme !== 'light');
        }
        if (document.body) paintBody();
        else document.addEventListener('DOMContentLoaded', paintBody);
    } catch (e) { /* ignore */ }
})(window);
