/**
 * H5 售后与帮助 · 客服 IM 弹层（挂载于 after-sales.html）
 */
(function (global) {
    function overlayEl() {
        return document.getElementById('txSupportOverlay');
    }

    function setOrderSnapVisible(ovl, show) {
        var snap = ovl && ovl.querySelector('.order-snap');
        if (snap) snap.style.display = show ? '' : 'none';
    }

    function openSupportSheet(opts) {
        opts = opts || {};
        var ovl = overlayEl();
        if (!ovl) return;
        var t = document.getElementById('txSupportSnapTitle');
        var s = document.getElementById('txSupportSnapSub');
        var v = document.getElementById('txSupportSnapAmount');
        if (opts.snapTitle && t) t.textContent = opts.snapTitle;
        if (opts.snapSub && s) s.textContent = opts.snapSub;
        if (opts.snapAmount && v) v.textContent = opts.snapAmount;
        var hasSnap = !!(opts.snapTitle || opts.snapSub || opts.snapAmount);
        if (opts.hideSnap === true) hasSnap = false;
        if (opts.hideSnap === false) hasSnap = true;
        setOrderSnapVisible(ovl, hasSnap);
        ovl.classList.add('is-open');
        document.body.classList.add('td-support-open');
    }

    function openFromSearchParams(search) {
        var params = search instanceof URLSearchParams ? search : new URLSearchParams(search || '');
        if (params.get('support') !== '1') return false;
        openSupportSheet({
            snapTitle: params.get('snapTitle') || '',
            snapSub: params.get('snapSub') || '',
            snapAmount: params.get('snapAmount') || '',
            hideSnap: !params.get('snapTitle') && !params.get('snapSub') && !params.get('snapAmount')
        });
        return true;
    }

    function buildAfterSalesSupportHref(fields) {
        fields = fields || {};
        var q = new URLSearchParams();
        q.set('support', '1');
        ['snapTitle', 'snapSub', 'snapAmount', 'order', 'type', 'from'].forEach(function (key) {
            if (fields[key]) q.set(key, fields[key]);
        });
        return 'after-sales.html?' + q.toString();
    }

    function closeSupportSheet() {
        var ovl = overlayEl();
        if (ovl) ovl.classList.remove('is-open');
        document.body.classList.remove('td-support-open');
    }

    function bindSupportSheet() {
        var ovl = overlayEl();
        if (!ovl || ovl.getAttribute('data-tx-support-bound') === '1') return;
        ovl.setAttribute('data-tx-support-bound', '1');
        var closeBtn = document.getElementById('txSupportClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeSupportSheet);
            closeBtn.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    closeSupportSheet();
                }
            });
        }
        ovl.addEventListener('click', function (e) {
            if (e.target === ovl) closeSupportSheet();
        });
        var sheet = ovl.querySelector('.sheet');
        if (sheet) {
            sheet.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        }
    }

    global.TxSupportSheet = {
        open: openSupportSheet,
        close: closeSupportSheet,
        bind: bindSupportSheet,
        openFromSearchParams: openFromSearchParams,
        buildAfterSalesSupportHref: buildAfterSalesSupportHref
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindSupportSheet);
    } else {
        bindSupportSheet();
    }
})(typeof window !== 'undefined' ? window : this);
