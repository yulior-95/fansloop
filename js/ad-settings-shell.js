/**
 * 广告 · 设置内嵌导航（WEB 设置区 / H5 设置页，单页多视图）
 */
(function (global) {
    var TITLES = {
        center: '广告中心',
        create: '创建广告',
        detail: '广告详情',
        stats: '广告数据',
        wallet: '广告账户',
        apply: '广告主申请'
    };

    function isSettingsAdPage() {
        return !!document.getElementById('adSettingsStage');
    }

    function parseRoute() {
        var sp = new URLSearchParams(location.search);
        var hash = (location.hash || '').replace(/^#/, '');
        var view = sp.get('view') || '';
        if (!view && hash.indexOf('view=') === 0) view = hash.split('=')[1] || '';
        if (!view || !TITLES[view]) view = 'center';
        return { view: view, id: sp.get('id') || '' };
    }

    function setCrumb(view) {
        var curr = document.getElementById('adSettingsCrumbCurr');
        if (curr) curr.textContent = TITLES[view] || TITLES.center;
        var h1 = document.getElementById('adSettingsPageTitle');
        if (h1) h1.textContent = TITLES[view] || TITLES.center;
        var navTitle = document.getElementById('adSettingsNavTitle');
        if (navTitle) navTitle.textContent = TITLES[view] || TITLES.center;
    }

    function show(view, params) {
        params = params || {};
        if (!isSettingsAdPage()) return false;
        view = TITLES[view] ? view : 'center';
        document.querySelectorAll('.ad-set-view').forEach(function (el) {
            el.classList.toggle('on', el.getAttribute('data-ad-view') === view);
        });
        document.body.setAttribute('data-ad-page', view === 'center' ? 'center' : view);
        setCrumb(view);
        var q = params.id ? '?view=' + encodeURIComponent(view) + '&id=' + encodeURIComponent(params.id) : (view === 'center' ? '' : '?view=' + encodeURIComponent(view));
        try {
            history.replaceState({ adView: view, id: params.id || '' }, '', 'settings-ad.html' + q);
        } catch (e) { /* file:// */ }
        if (global.FLAdUser && FLAdUser.bootView) FLAdUser.bootView(view, params);
        return true;
    }

    function go(view, params) {
        if (show(view, params)) return;
        var q = '';
        if (params && params.id) q = '?view=' + encodeURIComponent(view) + '&id=' + encodeURIComponent(params.id);
        else if (view && view !== 'center') q = '?view=' + encodeURIComponent(view);
        location.href = 'settings-ad.html' + q;
    }

    function onBack() {
        var route = parseRoute();
        if (route.view !== 'center') {
            show('center', {});
            return;
        }
        location.href = document.body.classList.contains('page-settings-h5') ? 'settings.html' : 'settings.html';
    }

    function boot() {
        if (!isSettingsAdPage()) return;
        var route = parseRoute();
        show(route.view, { id: route.id });
        var back = document.getElementById('adSettingsBack');
        if (back) back.onclick = function (e) {
            e.preventDefault();
            onBack();
        };
    }

    global.FLAdSettings = { go: go, show: show, boot: boot, isSettingsAdPage: isSettingsAdPage };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})(window);
