/**
 * 分享弹窗 · 父页内联注入后的初始化（关闭、海报预览、复制链接）
 */
(function (global) {
    function dismissModal(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (typeof global.FL_closeStandaloneModal === 'function') {
            global.FL_closeStandaloneModal();
            return;
        }
        if (global.parent && global.parent !== global) {
            try {
                global.parent.postMessage({ type: 'fansloop-close-modal' }, '*');
                return;
            } catch (_) { /* noop */ }
        }
        if (global.history.length > 1) global.history.back();
    }

    function toast(msg) {
        if (typeof global.toast === 'function') {
            global.toast(msg);
            return;
        }
        var t = document.getElementById('flSidebarToast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'flSidebarToast';
            t.style.cssText =
                'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:100070;' +
                'padding:10px 18px;border-radius:10px;background:rgba(16,18,30,0.96);' +
                'border:1px solid rgba(168,85,247,0.4);color:#fff;font-size:12px;font-weight:600;' +
                'box-shadow:0 12px 40px rgba(0,0,0,0.45);opacity:0;transition:opacity 0.2s;pointer-events:none;';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.opacity = '1';
        clearTimeout(t._hideTimer);
        t._hideTimer = setTimeout(function () { t.style.opacity = '0'; }, 2200);
    }

    function bindDismiss(host) {
        if (!host) return;
        host.querySelectorAll('.share-head .close, [data-fl-modal-dismiss]').forEach(function (el) {
            el.addEventListener('click', dismissModal);
        });
    }

    function bindPoster(host) {
        if (!host) return;
        var btn = host.querySelector('#btnPosterInline');
        var ovl = host.querySelector('#posterInlineOvl');
        var closeBtn = host.querySelector('#closePosterInline');
        if (!btn || !ovl) return;
        btn.addEventListener('click', function () {
            ovl.classList.add('show');
        });
        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                ovl.classList.remove('show');
            });
        }
        ovl.addEventListener('click', function (e) {
            if (e.target === ovl) ovl.classList.remove('show');
        });
    }

    function bindCopy(host) {
        if (!host) return;
        var copyBtn = host.querySelector('.link-card .copy');
        var urlEl = host.querySelector('.link-card .url');
        if (!copyBtn || !urlEl) return;
        copyBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var text = (urlEl.textContent || '').trim();
            if (!text) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () {
                    toast('链接已复制');
                }).catch(function () {
                    toast('链接已复制（原型）');
                });
            } else {
                toast('链接已复制（原型）');
            }
        });
        host.querySelectorAll('.plat').forEach(function (plat) {
            plat.addEventListener('click', function () {
                var name = (plat.querySelector('.nm') || {}).textContent || '平台';
                toast('已跳转 ' + name.trim() + '（原型）');
            });
        });
    }

    function init(host) {
        host = host || document.body;
        bindDismiss(host);
        bindPoster(host);
        bindCopy(host);
    }

    global.FLShareModalInline = { init: init };

    function autoInitStandalone() {
        if (document.getElementById('flStandaloneModalRoot')) return;
        if (!document.querySelector('.share-modal')) return;
        init(document.body);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInitStandalone);
    } else {
        autoInitStandalone();
    }
})(typeof window !== 'undefined' ? window : this);
