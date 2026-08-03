/**
 * 挂载订阅弹层 DOM（与 home / profile / 发现详情共用 subscribe-modal.js）
 */
(function () {
    function mount() {
        if (document.getElementById('ovlSubscribe')) return Promise.resolve();
        return fetch('partials/subscribe-overlay.html')
            .then(function (r) { return r.text(); })
            .then(function (html) {
                var wrap = document.createElement('div');
                wrap.innerHTML = html;
                while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
                if (window.FL_bindSubscribeUI) window.FL_bindSubscribeUI();
            })
            .catch(function () {
                console.warn('[GOODFANS] subscribe-overlay mount failed');
            });
    }

    window.FL_mountSubscribeOverlay = mount;

    if (document.getElementById('ovlSubscribe')) return;

    if (document.body && document.body.getAttribute('data-fl-subscribe-overlay') === '1') {
        mount();
    }
})();
