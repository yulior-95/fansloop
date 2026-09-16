(function () {
    function toast(msg) {
        if (window.DigitalH5Nav && window.DigitalH5Nav.toast) {
            window.DigitalH5Nav.toast(msg);
            return;
        }
        var el = document.getElementById('setPageToast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { el.classList.remove('show'); }, 2400);
    }

    window.H5SettingsCommon = { toast: toast };

    var resetBtn = document.getElementById('btnNotifReset');
    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            toast('已恢复默认通知偏好（原型）');
        });
    }

    if (document.querySelector('.notif-table-wrap')) {
        document.querySelectorAll('.switch').forEach(function (sw) {
            if (sw.dataset.h5Bound === '1') return;
            sw.dataset.h5Bound = '1';
            function toggle() {
                sw.classList.toggle('on');
                var on = sw.classList.contains('on');
                if (sw.hasAttribute('aria-checked')) {
                    sw.setAttribute('aria-checked', on ? 'true' : 'false');
                }
            }
            sw.addEventListener('click', toggle);
            sw.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle();
                }
            });
        });
    }
})();
