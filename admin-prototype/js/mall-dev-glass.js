/**
 * 双商城玻璃批注 · 悬停时 fixed 定位，避免被 overflow 裁切
 */
(function (global) {
  var PAD = 12;
  var activeWrap = null;

  function getPop(wrap) {
    return wrap.querySelector('.mall-dev-glass-pop');
  }

  function unpin(wrap) {
    var pop = getPop(wrap);
    if (!pop) return;
    pop.classList.remove('mall-dev-glass-pop--fixed');
    pop.style.top = '';
    pop.style.left = '';
    pop.style.width = '';
    pop.style.opacity = '';
    pop.style.visibility = '';
    pop.style.pointerEvents = '';
  }

  function pin(wrap) {
    var pop = getPop(wrap);
    if (!pop) return;
    pop.classList.remove('mall-dev-glass-pop--fixed');
    pop.style.top = '';
    pop.style.left = '';
    pop.style.width = '';

    // 测量前强制可见一帧，避免 opacity:0 时尺寸为 0
    var prev = {
      opacity: pop.style.opacity,
      visibility: pop.style.visibility,
      pointerEvents: pop.style.pointerEvents
    };
    pop.style.opacity = '1';
    pop.style.visibility = 'visible';
    pop.style.pointerEvents = 'auto';

    var rect = pop.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) {
      pop.style.opacity = prev.opacity;
      pop.style.visibility = prev.visibility;
      pop.style.pointerEvents = prev.pointerEvents;
      return;
    }

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

    pop.classList.add('mall-dev-glass-pop--fixed');
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
    pop.style.width = w + 'px';
  }

  function onEnter(e) {
    var wrap = e.currentTarget;
    activeWrap = wrap;
    global.requestAnimationFrame(function () {
      global.requestAnimationFrame(function () { pin(wrap); });
    });
  }

  function onLeave(e) {
    var wrap = e.currentTarget;
    if (activeWrap === wrap) activeWrap = null;
    unpin(wrap);
  }

  function bind(root) {
    var scope = root || document;
    scope.querySelectorAll('.mall-dev-glass-wrap').forEach(function (wrap) {
      if (wrap._mallGlassBound) return;
      wrap._mallGlassBound = true;
      wrap.addEventListener('mouseenter', onEnter);
      wrap.addEventListener('mouseleave', onLeave);
      wrap.addEventListener('focusin', onEnter);
      wrap.addEventListener('focusout', function (ev) {
        if (!wrap.contains(ev.relatedTarget)) onLeave(ev);
      });
    });
  }

  global.MallDevGlass = { bind: bind };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { bind(document); });
  } else {
    bind(document);
  }
})(window);
