/**
 * 个人主页 · 已购数字作品 Tab（与 my-digital-assets 同源订单库）
 */
(function (global) {
    var ROOT_SEL = '#daProfileOwned, #daProfileOwnedH5';

    function syncCount() {
        var n = 0;
        try {
            if (global.DigitalAssetOrdersStore) {
                n = global.DigitalAssetOrdersStore.listEntitlements().length;
            }
        } catch (e) { /* ignore */ }
        var el = document.getElementById('profileOwnedCnt');
        if (el) el.textContent = String(n);
        var h5 = document.getElementById('pfOwnedTabCnt');
        if (h5) h5.textContent = n > 0 ? String(n) : '';
    }

    function renderAll() {
        if (!global.DigitalAssetPages || !global.DigitalAssetPages.initMyAssetsPage) return;
        document.querySelectorAll(ROOT_SEL).forEach(function (root) {
            var layout = root.id === 'daProfileOwnedH5' ? 'h5' : 'web';
            global.DigitalAssetPages.initMyAssetsPage({
                root: root,
                layout: layout,
                hideRefund: true,
                viewFrom: 'profile'
            });
        });
        syncCount();
    }

    function init() {
        if (!global.DigitalAssetOrdersStore) return;
        renderAll();
        if (init._bound) return;
        init._bound = true;
        global.addEventListener('fl-digital-purchase', renderAll);
        global.addEventListener('fl-digital-refund', renderAll);
        global.addEventListener('fl-digital-after-sales-done', renderAll);
        global.addEventListener('fl-auth-prototype-ready', renderAll);
        global.addEventListener('goodfans-auth-change', renderAll);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    global.ProfileOwnedDigital = { init: init, refresh: renderAll, syncCount: syncCount };
})(typeof window !== 'undefined' ? window : this);
