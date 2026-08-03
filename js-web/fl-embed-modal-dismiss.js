(function () {
  function dismissModal(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (window.parent !== window) {
      try {
        window.parent.postMessage({ type: 'goodfans-close-modal' }, '*');
        return;
      } catch (_) { /* fall through */ }
    }
    if (window.history.length > 1) window.history.back();
  }

  function bind() {
    document.querySelectorAll('.close').forEach(function (el) {
      el.addEventListener('click', dismissModal);
    });
    document.querySelectorAll('[data-fl-modal-dismiss]').forEach(function (el) {
      el.addEventListener('click', dismissModal);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
