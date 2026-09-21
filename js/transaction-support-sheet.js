/**
 * H5 账变详情 · 客服 IM 弹层
 */
(function (global) {
    function overlayEl() {
        return document.getElementById('txSupportOverlay');
    }

    function openSupportSheet(opts) {
        opts = opts || {};
        var ovl = overlayEl();
        if (!ovl) return;
        if (opts.snapTitle) {
            var t = document.getElementById('txSupportSnapTitle');
            if (t) t.textContent = opts.snapTitle;
        }
        if (opts.snapSub) {
            var s = document.getElementById('txSupportSnapSub');
            if (s) s.textContent = opts.snapSub;
        }
        if (opts.snapAmount) {
            var v = document.getElementById('txSupportSnapAmount');
            if (v) v.textContent = opts.snapAmount;
        }
        ovl.classList.add('is-open');
        document.body.classList.add('td-support-open');
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
        bind: bindSupportSheet
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindSupportSheet);
    } else {
        bindSupportSheet();
    }
})(typeof window !== 'undefined' ? window : this);
