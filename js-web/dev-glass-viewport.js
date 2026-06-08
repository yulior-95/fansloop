/**
 * 研发玻璃球 · 气泡视口内完整展示（不改变球体/气泡 CSS 布局，悬停时 fixed 定位防裁切）
 */
(function (global) {
    var PAD = 12;
    var activeWrap = null;

    function getPop(wrap) {
        return wrap.querySelector('.dev-glass-pop');
    }

    function clampRect(rect) {
        var vw = global.innerWidth;
        var vh = global.innerHeight;
        var top = rect.top;
        var left = rect.left;
        var w = rect.width;
        var h = rect.height;
        if (top < PAD) top = PAD;
        if (left < PAD) left = PAD;
        if (left + w > vw - PAD) left = Math.max(PAD, vw - PAD - w);
        if (top + h > vh - PAD) top = Math.max(PAD, vh - PAD - h);
        return { top: top, left: left, width: w, height: h };
    }

    function pinPop(wrap) {
        var pop = getPop(wrap);
        if (!pop) return;

        var tries = 0;
        function measureAndPin() {
            var rect = pop.getBoundingClientRect();
            if ((rect.width < 2 || rect.height < 2) && tries++ < 10) {
                global.requestAnimationFrame(measureAndPin);
                return;
            }
            var c = clampRect(rect);
            pop.classList.add('dev-glass-pop--viewport-fixed');
            pop.style.top = c.top + 'px';
            pop.style.left = c.left + 'px';
            if (c.width > 0) pop.style.width = c.width + 'px';
            pop.style.right = 'auto';
            pop.style.bottom = 'auto';
            pop.style.transform = 'none';
            pop.style.zIndex = '100002';
        }

        global.requestAnimationFrame(function () {
            global.requestAnimationFrame(measureAndPin);
        });
    }

    function unpinPop(wrap) {
        var pop = getPop(wrap);
        if (!pop) return;
        pop.classList.remove('dev-glass-pop--viewport-fixed');
        pop.style.removeProperty('top');
        pop.style.removeProperty('left');
        pop.style.removeProperty('right');
        pop.style.removeProperty('bottom');
        pop.style.removeProperty('width');
        pop.style.removeProperty('transform');
        pop.style.removeProperty('z-index');
    }

    function activate(wrap) {
        if (!wrap || activeWrap === wrap) return;
        if (activeWrap) deactivate(activeWrap);
        activeWrap = wrap;
        pinPop(wrap);
    }

    function deactivate(wrap) {
        if (!wrap) return;
        unpinPop(wrap);
        if (activeWrap === wrap) activeWrap = null;
    }

    function onPointerOver(e) {
        var wrap = findWrap(e.target);
        if (!wrap) return;
        var rel = e.relatedTarget;
        if (rel && wrap.contains(rel)) return;
        activate(wrap);
    }

    function findWrap(el) {
        if (!el || !el.closest) return null;
        var wrap = el.closest('.dev-glass-wrap');
        if (wrap) return wrap;
        var pop = el.closest('.dev-glass-pop');
        return pop ? pop.closest('.dev-glass-wrap') : null;
    }

    function onPointerOut(e) {
        var wrap = findWrap(e.target);
        if (!wrap) return;
        var rel = e.relatedTarget;
        if (rel && wrap.contains(rel)) return;
        deactivate(wrap);
    }

    function onFocusIn(e) {
        var wrap = e.target.closest('.dev-glass-wrap');
        if (wrap) activate(wrap);
    }

    function onFocusOut(e) {
        var wrap = e.target.closest('.dev-glass-wrap');
        if (!wrap) return;
        var rel = e.relatedTarget;
        if (rel && wrap.contains(rel)) return;
        deactivate(wrap);
    }

    function bind() {
        document.addEventListener('mouseover', onPointerOver, true);
        document.addEventListener('mouseout', onPointerOut, true);
        document.addEventListener('focusin', onFocusIn, true);
        document.addEventListener('focusout', onFocusOut, true);
        global.addEventListener('resize', function () {
            if (activeWrap) pinPop(activeWrap);
        });
        global.addEventListener('scroll', function () {
            if (activeWrap) pinPop(activeWrap);
        }, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }

    global.FL_devGlassViewportRefresh = function () {
        if (activeWrap) pinPop(activeWrap);
    };
})();
