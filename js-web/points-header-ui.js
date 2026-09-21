/**
 * 顶栏积分按钮 · 统一 markup（Web / H5 原型同源）
 */
(function (global) {
    var ICON_CLASS = 'fa-solid fa-coins';

    function formatPlaceholder(val) {
        return val != null && val !== '' ? String(val) : '—';
    }

    function markup(totalFormatted) {
        return (
            '<span class="ic"><i class="' + ICON_CLASS + '" data-fl-icon-skip="1" aria-hidden="true"></i></span>' +
            '<span class="val">' + formatPlaceholder(totalFormatted) + '</span>' +
            '<span class="sub">积分</span>'
        );
    }

    function needsHydrate(btn) {
        if (!btn) return false;
        var ic = btn.querySelector('.ic');
        if (!ic) return true;
        return !ic.querySelector('i[class*="fa-"], svg.lucide');
    }

    function afterPaint(root) {
        /* 积分入口固定 FA 硬币，不参与 Lucide 迁移 */
    }

    function paint(btn, totalFormatted, title) {
        if (!btn) return;
        btn.innerHTML = markup(totalFormatted);
        if (title) btn.title = title;
        afterPaint(btn);
    }

    function ensureDefault(btn) {
        if (!btn) return;
        if (needsHydrate(btn)) {
            paint(btn, btn.querySelector('.val') && btn.querySelector('.val').textContent);
        }
    }

    function bindIconsReady() {
        global.addEventListener('fl-web-icons-ready', function () {
            global.document.querySelectorAll('#hPointsBtn').forEach(ensureDefault);
        });
    }

    global.FLPointsHeaderUi = {
        ICON_CLASS: ICON_CLASS,
        markup: markup,
        paint: paint,
        ensureDefault: ensureDefault,
        afterPaint: afterPaint
    };

    bindIconsReady();
})(typeof window !== 'undefined' ? window : this);
