/**
 * 打开 / 关闭 MoonPay 图文教程弹窗（依赖 .mp-guide-overlay 与 [data-mp-guide-close]）
 */
(function () {
    function wireOverlay(overlayId) {
        var el = document.getElementById(overlayId);
        if (!el) return;
        el.addEventListener('click', function (e) {
            if (e.target === el) el.classList.remove('open');
        });
        el.querySelectorAll('[data-mp-guide-close]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                el.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }
    document.addEventListener('DOMContentLoaded', function () {
        wireOverlay('mpGuideRecharge');
        wireOverlay('mpGuideWithdraw');
    });
    window.MpGuideOpen = function (which) {
        var id = which === 'withdraw' ? 'mpGuideWithdraw' : 'mpGuideRecharge';
        var el = document.getElementById(id);
        if (!el) return;
        el.classList.add('open');
        document.body.style.overflow = 'hidden';
    };
})();
