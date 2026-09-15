/**
 * GOODFANS Web · 视口 meta + 断点标记 + 窄屏侧栏建议
 * 由 app-sidebar-global.js / page-back-nav.js 按脚本路径自动加载。
 */
(function (global) {
    'use strict';

    var doc = global.document;
    var html = doc && doc.documentElement;
    if (!html || html.getAttribute('data-fl-responsive-ready') === '1') return;
    html.setAttribute('data-fl-responsive-ready', '1');

    function ensureViewportMeta() {
        if (!doc.head) return;
        var existing = doc.querySelector('meta[name="viewport"]');
        var content = 'width=device-width, initial-scale=1, viewport-fit=cover';
        if (existing) {
            if (!existing.getAttribute('content')) existing.setAttribute('content', content);
            return;
        }
        var meta = doc.createElement('meta');
        meta.name = 'viewport';
        meta.content = content;
        doc.head.appendChild(meta);
    }

    function breakpointFor(w) {
        if (w >= 2560) return '2xl';
        if (w >= 1920) return 'xl';
        if (w >= 1536) return 'lg';
        if (w >= 1280) return 'md';
        if (w >= 1100) return 'sm';
        return 'xs';
    }

    function applyBreakpoint() {
        var w = global.innerWidth || html.clientWidth || 1280;
        var bp = breakpointFor(w);
        html.setAttribute('data-fl-bp', bp);
        html.style.setProperty('--fl-viewport-w', w + 'px');
        html.style.setProperty('--fl-responsive-font-boost', w >= 2560 ? '1.03' : '1');

        if (w < 1100) {
            html.setAttribute('data-fl-narrow', '1');
        } else {
            html.removeAttribute('data-fl-narrow');
        }

        try {
            var shell = doc.querySelector('.app-shell');
            if (!shell || w >= 1100) return;
            var userCollapsed = localStorage.getItem('fl_sidebar_collapsed');
            if (userCollapsed === '0') return;
            shell.classList.add('sidebar-collapsed');
        } catch (e) { /* ignore */ }
    }

    ensureViewportMeta();
    applyBreakpoint();

    var resizeTimer;
    global.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(applyBreakpoint, 120);
    });

    global.FL_responsiveLayout = {
        refresh: applyBreakpoint,
        breakpoint: function () {
            return html.getAttribute('data-fl-bp') || 'md';
        }
    };
})(typeof window !== 'undefined' ? window : globalThis);
