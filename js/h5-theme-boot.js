/**
 * H5 主题首屏同步 · 须放在 <head>（common.css 之后）以避免浅色 FOUC
 * 与 digital-h5-nav.js 共用 localStorage key: h5_settings_theme
 */
(function (global) {
    var H5_MAIN_TAB_PAGES = {
        'home.html': true,
        'fl2-home-after-login.html': true,
        'subscriptions.html': true,
        'messages.html': true,
        'profile.html': true
    };

    function currentPageFile() {
        var path = global.location && global.location.pathname ? global.location.pathname : '';
        var file = path.split('/').pop() || '';
        return file.split('?')[0].toLowerCase();
    }

    function applyH5TabBarPolicy() {
        var body = document.body;
        if (!body) return;
        if (body.classList.contains('page-no-tab-bar') || body.classList.contains('h5-main-tab')) return;
        if (body.getAttribute('data-h5-root-tab') === '1') {
            body.classList.add('h5-main-tab');
            return;
        }
        var file = currentPageFile();
        if (H5_MAIN_TAB_PAGES[file]) {
            body.classList.add('h5-main-tab');
        } else {
            body.classList.add('page-no-tab-bar');
        }
    }

    try {
        var theme = 'dark';
        var flRaw = localStorage.getItem('fl_display_prefs_v1');
        if (flRaw) {
            try {
                var fp = JSON.parse(flRaw);
                var mode = fp.theme || 'dark';
                if (mode === 'auto') {
                    theme = (global.matchMedia && global.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
                } else {
                    theme = mode === 'light' ? 'light' : 'dark';
                }
            } catch (e) { /* fall through */ }
        }
        if (!flRaw) {
            var key = 'h5_settings_theme';
            var pref = localStorage.getItem(key) || 'dark';
            theme = pref;
            if (pref === 'system') {
                theme = (global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
            } else if (pref !== 'light') {
                theme = 'dark';
            }
        }
        var root = document.documentElement;
        root.setAttribute('data-theme', theme);
        root.setAttribute('data-fl-high-contrast', '1');
        if (theme === 'light') root.style.colorScheme = 'light';
        else root.style.colorScheme = 'dark';
        function paintBody() {
            if (!document.body) return;
            document.body.classList.toggle('light-bg', theme === 'light');
            document.body.classList.toggle('dark-bg', theme !== 'light');
            applyH5TabBarPolicy();
        }
        if (document.body) paintBody();
        else document.addEventListener('DOMContentLoaded', paintBody);
    } catch (e) { /* ignore */ }

    global.applyH5TabBarPolicy = applyH5TabBarPolicy;
})(window);
