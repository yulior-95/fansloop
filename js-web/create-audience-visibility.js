/**
 * 创建页 · 「谁可以看」选择弹窗
 */
(function () {
    var row = document.getElementById('rowAudienceVisibility');
    var overlay = document.getElementById('crAudienceOverlay');
    var valEl = document.getElementById('crAudienceVal');
    if (!row || !overlay || !valEl) return;

    var LABELS = {
        public: '所有人',
        fans: '仅粉丝',
        subscribers: '仅订阅者'
    };
    var current = 'public';
    var pending = current;

    function syncOptUi(value) {
        overlay.querySelectorAll('.schedule-opt[data-audience]').forEach(function (opt) {
            var on = opt.getAttribute('data-audience') === value;
            opt.classList.toggle('selected', on);
            var input = opt.querySelector('input[type="radio"]');
            if (input) input.checked = on;
        });
    }

    function renderValue() {
        var label = LABELS[current] || LABELS.public;
        valEl.innerHTML = label + ' <i class="fa-solid fa-chevron-right" style="font-size: 10px; margin-left: 6px"></i>';
    }

    function open() {
        pending = current;
        syncOptUi(pending);
        overlay.classList.add('show');
        overlay.setAttribute('aria-hidden', 'false');
    }

    function close() {
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
    }

    function confirm() {
        current = pending;
        renderValue();
        close();
        try {
            window.dispatchEvent(new CustomEvent('fl-create-audience-change', { detail: { value: current, label: LABELS[current] } }));
        } catch (e) { /* ignore */ }
    }

    row.addEventListener('click', open);
    row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
        }
    });

    overlay.querySelectorAll('.schedule-opt[data-audience]').forEach(function (opt) {
        opt.addEventListener('click', function (e) {
            if (e.target.tagName === 'INPUT') return;
            pending = opt.getAttribute('data-audience') || 'public';
            syncOptUi(pending);
        });
        var input = opt.querySelector('input[type="radio"]');
        if (input) {
            input.addEventListener('change', function () {
                if (input.checked) {
                    pending = input.value;
                    syncOptUi(pending);
                }
            });
        }
    });

    document.getElementById('crAudienceClose')?.addEventListener('click', close);
    document.getElementById('crAudienceCancel')?.addEventListener('click', close);
    document.getElementById('crAudienceConfirm')?.addEventListener('click', confirm);

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('show')) close();
    });

    renderValue();
    window.FL_createAudience = {
        get: function () { return current; },
        set: function (v) {
            if (!LABELS[v]) return;
            current = v;
            renderValue();
        }
    };
})();
