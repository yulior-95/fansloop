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
            '<span class="ic"><i class="' + ICON_CLASS + '"></i></span>' +
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
        if (global.FLWebIcons && typeof global.FLWebIcons.refresh === 'function') {
            global.FLWebIcons.refresh(root || document);
        }
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

    global.FLPointsHeaderUi = {
        ICON_CLASS: ICON_CLASS,
        markup: markup,
        paint: paint,
        ensureDefault: ensureDefault,
        afterPaint: afterPaint
    };
})(typeof window !== 'undefined' ? window : this);
