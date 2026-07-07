/**
 * 评论弹窗 · 父页内联注入后的初始化（关闭、输入区原型交互、权益场景）
 */
(function (global) {
    function bindDismiss(host) {
        if (!host) return;
        host.querySelectorAll('.cm-head .close, [data-fl-modal-dismiss]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof global.FL_closeStandaloneModal === 'function') {
                    global.FL_closeStandaloneModal();
                }
            });
        });
    }

    function toast(msg) {
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

    function bindInput(host) {
        var input = host.querySelector('.cm-input-bar input');
        var send = host.querySelector('.cm-input-bar .send');
        if (send && input) {
            send.addEventListener('click', function () {
                var val = (input.value || '').trim();
                if (!val) {
                    toast('请输入评论内容');
                    return;
                }
                toast('评论已发送（原型）');
                input.value = '';
            });
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    send.click();
                }
            });
        }
        host.querySelectorAll('.cm-emoji-bar .em').forEach(function (em) {
            em.addEventListener('click', function () {
                if (!input) return;
                var ch = (em.textContent || '').trim();
                if (!ch || ch.indexOf('+') >= 0) return;
                input.value += ch;
                input.focus();
            });
        });
    }

    function applyBenefitScene(pageUrl) {
        var qs = pageUrl && pageUrl.indexOf('?') >= 0 ? pageUrl.split('?')[1] : '';
        var scene = new URLSearchParams(qs).get('benefitScene');
        if (!scene || !global.MallBenefitsScenes) return;
        if (global.MallVouchersStore && global.MallVouchersStore.ensureDemoScene) {
            global.MallVouchersStore.ensureDemoScene(scene);
        }
        if (global.MallBenefitsScenes.applyCommentHighlightScene) {
            global.MallBenefitsScenes.applyCommentHighlightScene();
        }
    }

    function init(host, pageUrl) {
        if (!host) return;
        bindDismiss(host);
        bindInput(host);
        applyBenefitScene(pageUrl);
    }

    global.FLCommentModalInline = { init: init };
})(typeof window !== 'undefined' ? window : this);
