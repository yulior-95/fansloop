/**
 * FansLoop · 全局侧栏展开/收起 + 一屏布局（配合 common-web.css）
 */
(function (global) {
    var STORAGE_KEY = 'fl_sidebar_collapsed';

    function isCollapsed() {
        try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
    }

    function setCollapsed(on) {
        try {
            if (on) localStorage.setItem(STORAGE_KEY, '1');
            else localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
    }

    function applyState(shell, collapsed) {
        if (!shell) return;
        shell.classList.toggle('sidebar-collapsed', collapsed);
        document.documentElement.classList.remove('sidebar-collapsed-pre');
        var btn = shell.querySelector('.s-sidebar-toggle');
        if (btn) {
            btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            btn.title = collapsed ? '展开侧栏' : '收起侧栏';
            btn.setAttribute('aria-label', btn.title);
        }
    }

    function ensureToggle(shell, sidebar) {
        if (shell.querySelector('.s-sidebar-toggle')) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 's-sidebar-toggle';
        btn.setAttribute('aria-controls', 'app-sidebar');
        btn.innerHTML = '<i class="fa-solid fa-angles-left" aria-hidden="true"></i>';
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var next = !shell.classList.contains('sidebar-collapsed');
            setCollapsed(next);
            applyState(shell, next);
        });
        sidebar.appendChild(btn);
    }

    function init() {
        var shell = document.querySelector('.app-shell');
        if (!shell) return;
        var sidebar = shell.querySelector('.app-sidebar');
        if (!sidebar) return;
        if (!sidebar.id) sidebar.id = 'app-sidebar';
        ensureToggle(shell, sidebar);
        applyState(shell, isCollapsed() || document.documentElement.classList.contains('sidebar-collapsed-pre'));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    global.FL_sidebarToggle = function () {
        var shell = document.querySelector('.app-shell');
        if (!shell) return;
        var next = !shell.classList.contains('sidebar-collapsed');
        setCollapsed(next);
        applyState(shell, next);
    };

    /** Header / 侧栏「通知」入口：全局跳转未读列表 */
    var NF_UNREAD_URL = 'notifications.html?tab=unread';

    function isNotificationBellBtn(btn) {
        if (!btn || !btn.classList.contains('h-icon')) return false;
        var bell = btn.querySelector('i.fa-bell, i.fa-regular.fa-bell, i.fa-solid.fa-bell');
        if (!bell) return false;
        if (btn.querySelector('i.fa-bell-slash')) return false;
        if (btn.querySelector('i.fa-comments')) return false;
        return true;
    }

    function bindHeaderNotificationButtons() {
        document.querySelectorAll('.app-header .h-actions .h-icon').forEach(function (btn) {
            if (!isNotificationBellBtn(btn)) return;
            btn.setAttribute('title', '通知');
            if (btn.getAttribute('data-fl-nf-bound') === '1') return;
            btn.setAttribute('data-fl-nf-bound', '1');
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var page = (location.pathname.split('/').pop() || '').toLowerCase();
                if (page === 'notifications.html') {
                    window.dispatchEvent(new CustomEvent('fl-notification-focus-unread'));
                    return;
                }
                location.href = NF_UNREAD_URL;
            });
        });
    }

    function bindSidebarNotificationItems() {
        document.querySelectorAll('.app-sidebar .s-item').forEach(function (item) {
            var lb = item.querySelector('.lb');
            if (!lb || lb.textContent.trim() !== '通知') return;
            if (item.classList.contains('is-guest-lock')) return;
            item.setAttribute('onclick', "location.href='" + NF_UNREAD_URL + "'");
        });
    }

    function initNotificationEntry() {
        bindHeaderNotificationButtons();
        bindSidebarNotificationItems();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotificationEntry);
    } else {
        initNotificationEntry();
    }

    global.FL_bindNotificationEntry = initNotificationEntry;

    /** 全局加载 macOS 风格侧边通知（有 app-shell 的页面） */
    function loadMacNotificationBanner() {
        if (!document.querySelector('.app-shell')) return;
        if (document.querySelector('script[data-fl-mac-notify], script[src*="mac-notification-banner"]')) return;
        var scripts = document.getElementsByTagName('script');
        var base = '';
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src || '';
            if (src.indexOf('app-sidebar-global') >= 0) {
                base = src.replace(/\/js-web\/app-sidebar-global\.js.*$/, '');
                break;
            }
        }
        if (!base) return;
        if (!document.querySelector('link[data-fl-mac-notify-css]')) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = base + '/css-web/mac-notification-banner.css';
            link.setAttribute('data-fl-mac-notify-css', '1');
            document.head.appendChild(link);
        }
        var js = document.createElement('script');
        js.src = base + '/js-web/mac-notification-banner.js';
        js.defer = true;
        js.setAttribute('data-fl-mac-notify', '1');
        document.body.appendChild(js);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadMacNotificationBanner);
    } else {
        loadMacNotificationBanner();
    }

    /** 研发玻璃球气泡 · 全局视口内完整展示 */
    function getJsWebBase() {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src || '';
            if (src.indexOf('app-sidebar-global') >= 0) {
                return src.replace(/\/js-web\/app-sidebar-global\.js.*$/, '');
            }
        }
        return '';
    }

    function loadDevGlassViewport() {
        if (!document.querySelector('.dev-glass-wrap')) return;
        if (document.querySelector('script[data-fl-dev-glass-vp], script[src*="dev-glass-viewport"]')) return;
        var base = getJsWebBase();
        if (!base) return;
        var js = document.createElement('script');
        js.src = base + '/js-web/dev-glass-viewport.js';
        js.defer = true;
        js.setAttribute('data-fl-dev-glass-vp', '1');
        document.body.appendChild(js);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDevGlassViewport);
    } else {
        loadDevGlassViewport();
    }
})(typeof window !== 'undefined' ? window : this);
