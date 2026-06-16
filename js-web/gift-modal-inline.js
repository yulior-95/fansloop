/**
 * 打赏弹窗 · 父页内联注入后的初始化（关闭、加成卡、礼物选择）
 */
(function (global) {
  function bindDismiss(host) {
    if (!host) return;
    host.querySelectorAll('.close, [data-fl-modal-dismiss]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof global.FL_closeStandaloneModal === 'function') {
          global.FL_closeStandaloneModal();
        }
      });
    });
  }

  function init(host, pageUrl) {
    if (!host) return;
    bindDismiss(host);
    var qs = (pageUrl && pageUrl.indexOf('?') >= 0) ? pageUrl.split('?')[1] : '';
    if (global.FL_applyGiftContext) {
      global.FL_applyGiftContext(host, qs);
    }
    if (global.FLTipBonus && typeof global.FLTipBonus.initGiftModal === 'function') {
      global.FLTipBonus.initGiftModal({ query: qs });
    }
  }

  global.FLGiftModalInline = { init: init };
})(typeof window !== 'undefined' ? window : this);
