/**
 * 信息流内打开评论 / 分享 / 送礼弹窗：
 * - 若在 yanshi-web.html 等父页的 iframe 中 → postMessage 由父页顶栏覆盖层承载 modal iframe
 * - 若单独打开 home.html → 使用本页的 #flStandaloneModalRoot
 * - 打赏弹窗（gift-modal）默认内联注入同源 DOM，便于选中内部元素微调（非 iframe）
 * - 分享弹窗（share-modal）同上：模糊蒙层 + 面板内联，无 iframe 蓝底
 */
(function () {
  var root = null;
  var iframeEl = null;
  var inlineHost = null;

  function bindElements() {
    root = document.getElementById('flStandaloneModalRoot');
    if (!root) return;
    iframeEl = root.querySelector('iframe');
    inlineHost = root.querySelector('.fl-modal-inline-host');
    if (!inlineHost) {
      inlineHost = document.createElement('div');
      inlineHost.className = 'fl-modal-inline-host';
      inlineHost.setAttribute('hidden', '');
      root.appendChild(inlineHost);
    }
  }

  function clearInline() {
    bindElements();
    if (inlineHost) {
      inlineHost.innerHTML = '';
      inlineHost.setAttribute('hidden', '');
    }
    if (root) root.classList.remove('fl-modal--inline');
    if (iframeEl) iframeEl.style.display = '';
  }

  window.FL_closeStandaloneModal = function () {
    bindElements();
    if (!root) return;
    clearInline();
    if (iframeEl) iframeEl.src = 'about:blank';
    root.style.display = 'none';
    root.setAttribute('aria-hidden', 'true');
    root.classList.remove('fl-modal--comment', 'fl-modal--danmaku', 'fl-modal--share', 'fl-modal--gift', 'fl-modal--default', 'fl-modal--inline');
  };

  function scriptBase() {
    var el = document.querySelector('script[src*="fl-interaction-modal"]');
    if (el && el.src) {
      return el.src.replace(/fl-interaction-modal\.js.*$/, '');
    }
    return '../js-web/';
  }

  function loadScriptOnce(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  function ensureGiftDeps() {
    var base = scriptBase();
    return loadScriptOnce(base + 'mall-vouchers-store.js')
      .then(function () { return loadScriptOnce(base + 'gift-modal-context.js'); })
      .then(function () { return loadScriptOnce(base + 'gift-tip-bonus.js'); })
      .then(function () { return loadScriptOnce(base + 'gift-modal-inline.js'); });
  }

  function ensureCommentModalCss() {
    if (document.querySelector('link[data-fl-comment-modal-css]')) return;
    var base = scriptBase().replace(/\/js-web\/$/, '');
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = base + '/css-web/comment-modal.css';
    link.setAttribute('data-fl-comment-modal-css', '1');
    document.head.appendChild(link);
  }

  function ensureCommentBenefitCss() {
    if (document.querySelector('link[data-fl-mall-benefits-css]')) return;
    var base = scriptBase().replace(/\/js-web\/$/, '');
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = base + '/css-web/mall-benefits-scenes.css';
    link.setAttribute('data-fl-mall-benefits-css', '1');
    document.head.appendChild(link);
  }

  function ensureShareModalCss() {
    if (document.querySelector('link[data-fl-share-modal-css]')) return;
    var base = scriptBase().replace(/\/js-web\/$/, '');
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = base + '/css-web/share-modal.css';
    link.setAttribute('data-fl-share-modal-css', '1');
    document.head.appendChild(link);
  }

  function ensureShareDeps() {
    var base = scriptBase();
    return loadScriptOnce(base + 'share-modal-inline.js');
  }

  function openShareInline(page) {
    bindElements();
    if (!root || !inlineHost) {
      window.location.href = page;
      return;
    }
    ensureShareModalCss();
    fetch(page)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        return ensureShareDeps().then(function () { return html; });
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var modal = doc.querySelector('.share-modal');
        if (!modal) {
          if (iframeEl) {
            iframeEl.src = page;
            root.classList.add('fl-modal--share');
            root.style.display = 'flex';
            root.setAttribute('aria-hidden', 'false');
          }
          return;
        }
        clearInline();
        inlineHost.appendChild(document.importNode(modal, true));
        var poster = doc.querySelector('.poster-inline-overlay');
        if (poster) inlineHost.appendChild(document.importNode(poster, true));
        inlineHost.removeAttribute('hidden');
        if (iframeEl) iframeEl.style.display = 'none';
        root.classList.remove('fl-modal--comment', 'fl-modal--danmaku', 'fl-modal--gift', 'fl-modal--default');
        root.classList.add('fl-modal--share', 'fl-modal--inline');
        root.style.display = 'flex';
        root.setAttribute('aria-hidden', 'false');
        if (window.FLShareModalInline) {
          window.FLShareModalInline.init(inlineHost);
        }
      })
      .catch(function () {
        if (iframeEl) {
          iframeEl.src = page;
          root.classList.add('fl-modal--share');
        }
        root.style.display = 'flex';
        root.setAttribute('aria-hidden', 'false');
      });
  }

  function ensureCommentDeps(page) {
    var base = scriptBase();
    var qs = page.indexOf('?') >= 0 ? page.split('?')[1] : '';
    var scene = new URLSearchParams(qs).get('benefitScene');
    var chain = Promise.resolve();
    if (scene) {
      ensureCommentBenefitCss();
      chain = chain
        .then(function () { return loadScriptOnce(base + 'mall-vouchers-store.js'); })
        .then(function () { return loadScriptOnce(base + 'mall-benefits-scenes.js'); });
    }
    return chain.then(function () { return loadScriptOnce(base + 'comment-modal-inline.js'); });
  }

  function openCommentInline(page) {
    bindElements();
    if (!root || !inlineHost) {
      window.location.href = page;
      return;
    }
    ensureCommentModalCss();
    fetch(page)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        return ensureCommentDeps(page).then(function () { return html; });
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var modal = doc.querySelector('.cm-modal');
        if (!modal) {
          if (iframeEl) {
            iframeEl.src = page;
            root.style.display = 'flex';
            root.setAttribute('aria-hidden', 'false');
          }
          return;
        }
        clearInline();
        inlineHost.appendChild(document.importNode(modal, true));
        inlineHost.removeAttribute('hidden');
        if (iframeEl) iframeEl.style.display = 'none';
        root.classList.remove('fl-modal--danmaku', 'fl-modal--share', 'fl-modal--gift', 'fl-modal--default', 'fl-modal--inline');
        root.classList.add('fl-modal--comment', 'fl-modal--inline');
        root.style.display = 'flex';
        root.setAttribute('aria-hidden', 'false');
        if (window.FLCommentModalInline) {
          window.FLCommentModalInline.init(inlineHost, page);
        }
      })
      .catch(function () {
        if (iframeEl) iframeEl.src = page;
        root.classList.add('fl-modal--comment');
        root.style.display = 'flex';
        root.setAttribute('aria-hidden', 'false');
      });
  }

  function openGiftInline(page) {
    bindElements();
    if (!root || !inlineHost) {
      window.location.href = page;
      return;
    }
    fetch(page)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        return ensureGiftDeps().then(function () { return html; });
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var modal = doc.querySelector('.gift-modal');
        if (!modal) {
          if (iframeEl) {
            iframeEl.src = page;
            root.style.display = 'flex';
          }
          return;
        }
        clearInline();
        inlineHost.appendChild(document.importNode(modal, true));
        inlineHost.removeAttribute('hidden');
        if (iframeEl) iframeEl.style.display = 'none';
        root.classList.remove('fl-modal--comment', 'fl-modal--danmaku', 'fl-modal--share', 'fl-modal--default');
        root.classList.add('fl-modal--gift', 'fl-modal--inline');
        root.style.display = 'flex';
        root.setAttribute('aria-hidden', 'false');
        if (window.FLGiftModalInline) {
          window.FLGiftModalInline.init(inlineHost, page);
        }
      })
      .catch(function () {
        if (iframeEl) iframeEl.src = page;
        root.style.display = 'flex';
        root.setAttribute('aria-hidden', 'false');
      });
  }

  window.FL_openInteractionModal = function (page) {
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({ type: 'goodfans-open-modal', page: page }, '*');
        return;
      } catch (_) { /* 继续本页兜底 */ }
    }
    bindElements();
    if (!root) {
      window.location.href = page;
      return;
    }

    if (page.indexOf('gift-modal') >= 0) {
      openGiftInline(page);
      return;
    }

    if (page.indexOf('comment-modal') >= 0) {
      openCommentInline(page);
      return;
    }

    if (page.indexOf('share-modal') >= 0) {
      openShareInline(page);
      return;
    }

    clearInline();
    if (!iframeEl) {
      window.location.href = page;
      return;
    }

    iframeEl.src = page;
    root.classList.remove('fl-modal--comment', 'fl-modal--danmaku', 'fl-modal--share', 'fl-modal--gift', 'fl-modal--default', 'fl-modal--inline');
    if (page.indexOf('danmaku-send-modal') >= 0) {
      root.classList.add('fl-modal--danmaku');
      iframeEl.style.width = 'min(500px, calc(100vw - 32px))';
      iframeEl.style.height = 'min(420px, calc(100vh - 32px))';
    } else {
      root.classList.add('fl-modal--default');
      iframeEl.style.width = root.classList.contains('fl-interaction-ovl') ? '' : 'min(940px, calc(100vw - 32px))';
      iframeEl.style.height = root.classList.contains('fl-interaction-ovl') ? '' : 'min(920px, calc(100vh - 32px))';
    }
    root.style.display = 'flex';
    root.setAttribute('aria-hidden', 'false');
  };

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'goodfans-close-modal') return;
    window.FL_closeStandaloneModal();
  });

  function attachRootClick() {
    bindElements();
    if (!root) return;
    root.addEventListener('click', function (e) {
      if (e.target === root || e.target === inlineHost) {
        window.FL_closeStandaloneModal();
        return;
      }
      var backdrop = root.querySelector('.fl-modal-backdrop');
      if (backdrop && e.target === backdrop) {
        window.FL_closeStandaloneModal();
      }
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    bindElements();
    if (root && root.style.display === 'flex') window.FL_closeStandaloneModal();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attachRootClick);
  else attachRootClick();

  try {
    var gp = new URLSearchParams(location.search);
    if (gp.get('gift') === 'open' || gp.get('gift') === '1') {
      var giftPage = 'gift-modal.html?ctx=' + encodeURIComponent(gp.get('ctx') || 'feed');
      if (gp.get('bonus')) giftPage += '&bonus=' + encodeURIComponent(gp.get('bonus'));
      if (gp.get('creator')) giftPage += '&creator=' + encodeURIComponent(gp.get('creator'));
      setTimeout(function () {
        window.FL_openInteractionModal(giftPage);
      }, 400);
    }
  } catch (e) { /* noop */ }
})();
