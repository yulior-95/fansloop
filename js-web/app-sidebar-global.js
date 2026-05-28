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

    /** 全局直播悬浮窗（站内页面切换保持） */
    var LIVE_PIP_KEY = 'fl_live_pip_state';

    function readLivePipState() {
        try {
            var raw = localStorage.getItem(LIVE_PIP_KEY) || '';
            var obj = raw ? JSON.parse(raw) : null;
            if (!obj || typeof obj !== 'object') return null;
            return obj;
        } catch (e) { return null; }
    }

    function writeLivePipState(state) {
        try {
            if (!state || !state.active) localStorage.removeItem(LIVE_PIP_KEY);
            else localStorage.setItem(LIVE_PIP_KEY, JSON.stringify(state));
        } catch (e) {}
    }

    function injectLivePipStyle() {
        if (document.getElementById('flGlobalPipStyle')) return;
        var style = document.createElement('style');
        style.id = 'flGlobalPipStyle';
        style.textContent =
            '.fl-live-pip{position:fixed;right:20px;bottom:20px;width:320px;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.18);background:#000;z-index:10090;box-shadow:0 22px 60px rgba(0,0,0,.6);display:none;}' +
            '.fl-live-pip.show{display:block;}' +
            '.fl-live-pip .hd{height:40px;padding:0 10px;background:rgba(16,18,30,.94);display:flex;align-items:center;justify-content:space-between;color:#fff;font-size:11px;font-weight:700;}' +
            '.fl-live-pip .hd .title{display:inline-flex;align-items:center;gap:6px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
            '.fl-live-pip .hd .title i{color:#ef4444;font-size:8px;}' +
            '.fl-live-pip .hd .actions{display:flex;gap:6px;}' +
            '.fl-live-pip .hd button{height:26px;padding:0 8px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;font-size:10px;font-weight:700;cursor:pointer;}' +
            '.fl-live-pip .hd button.back{background:linear-gradient(135deg,#8B5CF6,#EC4899);border:none;}' +
            '.fl-live-pip .body{aspect-ratio:16/9;position:relative;background:url("https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200") center/cover no-repeat;}' +
            '.fl-live-pip .body:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 52%,rgba(0,0,0,.66));}' +
            '.fl-live-pip .body .tx{position:absolute;left:10px;right:10px;bottom:8px;z-index:2;color:#fff;font-size:11px;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,.65);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}';
        document.head.appendChild(style);
    }

    function ensureLivePipNode() {
        var node = document.getElementById('flGlobalLivePip');
        if (node) return node;
        node = document.createElement('div');
        node.id = 'flGlobalLivePip';
        node.className = 'fl-live-pip';
        node.innerHTML =
            '<div class="hd">' +
            '  <span class="title"><i class="fa-solid fa-circle"></i><span data-pip-title>直播中</span></span>' +
            '  <div class="actions">' +
            '    <button type="button" class="back" data-pip-back><i class="fa-solid fa-up-right-and-down-left-from-center"></i> 回到页面</button>' +
            '    <button type="button" data-pip-close><i class="fa-solid fa-xmark"></i></button>' +
            '  </div>' +
            '</div>' +
            '<div class="body"><span class="tx" data-pip-tx>直播进行中</span></div>';
        document.body.appendChild(node);
        return node;
    }

    function resolveBackByRole(role) {
        return role === 'host' ? 'create-live-host.html' : 'live-detail.html';
    }

    function renderLivePip(state) {
        injectLivePipStyle();
        var node = ensureLivePipNode();
        if (!state || !state.active) {
            node.classList.remove('show');
            return;
        }
        node.classList.add('show');
        var title = state.title || '直播中';
        var role = state.role === 'host' ? 'host' : 'viewer';
        var back = state.back || resolveBackByRole(role);

        var titleEl = node.querySelector('[data-pip-title]');
        var txEl = node.querySelector('[data-pip-tx]');
        var btnBack = node.querySelector('[data-pip-back]');
        var btnClose = node.querySelector('[data-pip-close]');
        if (titleEl) titleEl.textContent = role === 'host' ? '主播端直播中' : '直播中';
        if (txEl) txEl.textContent = title;

        if (btnBack && btnBack.getAttribute('data-bound') !== '1') {
            btnBack.setAttribute('data-bound', '1');
            btnBack.addEventListener('click', function () {
                var s = readLivePipState() || {};
                location.href = s.back || resolveBackByRole(s.role);
            });
        }
        if (btnClose && btnClose.getAttribute('data-bound') !== '1') {
            btnClose.setAttribute('data-bound', '1');
            btnClose.addEventListener('click', function () {
                writeLivePipState(null);
                node.classList.remove('show');
            });
        }
    }

    function initLivePip() {
        var state = readLivePipState();
        if (state && state.active) renderLivePip(state);
    }

    global.FL_openGlobalLivePip = function (payload) {
        var state = payload || {};
        state.active = true;
        state.role = state.role === 'host' ? 'host' : 'viewer';
        state.back = state.back || resolveBackByRole(state.role);
        writeLivePipState(state);
        renderLivePip(state);
    };
    global.FL_closeGlobalLivePip = function () {
        writeLivePipState(null);
        renderLivePip(null);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLivePip);
    } else {
        initLivePip();
    }
})(typeof window !== 'undefined' ? window : this);
