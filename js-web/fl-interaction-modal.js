/**
 * 信息流内打开评论 / 分享 / 送礼弹窗：
 * - 若在 yanshi-web.html 等父页的 iframe 中 → postMessage 由父页顶栏覆盖层承载 modal iframe
 * - 若单独打开 home.html → 使用本页的 #flStandaloneModalRoot
 */
(function () {
  let root = null;
  let iframeEl = null;

  function bindElements() {
    root = document.getElementById('flStandaloneModalRoot');
    iframeEl = root ? root.querySelector('iframe') : null;
  }

  window.FL_closeStandaloneModal = function () {
    bindElements();
    if (!root || !iframeEl) return;
    root.style.display = 'none';
    root.setAttribute('aria-hidden', 'true');
    root.classList.remove('fl-modal--comment', 'fl-modal--danmaku', 'fl-modal--default');
    iframeEl.src = 'about:blank';
  };

  window.FL_openInteractionModal = function (page) {
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({ type: 'fansloop-open-modal', page: page }, '*');
        return;
      } catch (_) { /* 继续本页兜底 */ }
    }
    bindElements();
    if (!root || !iframeEl) {
      window.location.href = page;
      return;
    }
    iframeEl.src = page;
    root.classList.remove('fl-modal--comment', 'fl-modal--danmaku', 'fl-modal--default');
    if (page.indexOf('danmaku-send-modal') >= 0) {
      root.classList.add('fl-modal--danmaku');
      iframeEl.style.width = 'min(500px, calc(100vw - 32px))';
      iframeEl.style.height = 'min(420px, calc(100vh - 32px))';
    } else if (page.indexOf('comment-modal') >= 0) {
      root.classList.add('fl-modal--comment');
      iframeEl.style.width = 'min(940px, calc(100vw - 32px))';
      iframeEl.style.height = 'min(920px, calc(100vh - 32px))';
    } else {
      root.classList.add('fl-modal--default');
      iframeEl.style.width = 'min(940px, calc(100vw - 32px))';
      iframeEl.style.height = 'min(920px, calc(100vh - 32px))';
    }
    root.style.display = 'flex';
    root.setAttribute('aria-hidden', 'false');
  };

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'fansloop-close-modal') return;
    window.FL_closeStandaloneModal();
  });

  function attachRootClick() {
    bindElements();
    if (!root) return;
    root.addEventListener('click', function () {
      window.FL_closeStandaloneModal();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    bindElements();
    if (root && root.style.display === 'flex') window.FL_closeStandaloneModal();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachRootClick);
  else attachRootClick();
})();
