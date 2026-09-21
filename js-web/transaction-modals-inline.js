/**
 * 交易详情 · 申诉 / 分享海报 / 客服 — 父页内联初始化
 */
(function (global) {
    'use strict';

    function resolveModal(host) {
        if (!host) return null;
        if (host.classList && host.classList.contains('modal')) return host;
        return host.querySelector('.modal');
    }

    function parsePageUrl(pageUrl) {
        try {
            var q = pageUrl.indexOf('?');
            return new URLSearchParams(q >= 0 ? pageUrl.slice(q + 1) : '');
        } catch (_) {
            return new URLSearchParams('');
        }
    }

    function closeInline() {
        if (typeof global.FL_closeStandaloneModal === 'function') {
            global.FL_closeStandaloneModal();
        }
    }

    function bindClose(modal, inline, onStandaloneClose) {
        if (!modal) return;
        function close(e) {
            if (e) e.preventDefault();
            if (inline) {
                closeInline();
                return;
            }
            if (typeof onStandaloneClose === 'function') onStandaloneClose();
        }
        modal.querySelectorAll('.close, .close-btn, #appealCloseBtn, #appealCancelBtn').forEach(function (el) {
            el.removeAttribute('onclick');
            el.addEventListener('click', close);
        });
        modal.querySelectorAll('.modal-foot .btn').forEach(function (btn) {
            if (btn.textContent.indexOf('取消') >= 0) {
                btn.removeAttribute('onclick');
                btn.addEventListener('click', close);
            }
        });
    }

    function initAppeal(modal, params, inline) {
        var order = params.get('order') || 'TXN20260425190832';
        var el = modal.querySelector('#orderRef');
        if (el && order) {
            el.value = order;
            el.style.color = '';
            el.style.fontWeight = '700';
        }
        function backToDetail() {
            var ord = (el && el.value) || order;
            global.location.href = 'transaction-detail.html?order=' + encodeURIComponent(ord);
        }
        bindClose(modal, inline, backToDetail);
        modal.querySelectorAll('.reason-grid .r-card').forEach(function (card) {
            card.addEventListener('click', function () {
                modal.querySelectorAll('.reason-grid .r-card').forEach(function (c) {
                    c.classList.remove('active');
                });
                card.classList.add('active');
            });
        });
        var btn = modal.querySelector('#btnAppealSubmit');
        if (btn) {
            btn.addEventListener('click', function () {
                var ref = modal.querySelector('#orderRef');
                var ord = ref && ref.value ? ref.value : order;
                global.location.href =
                    'transaction-appeal-detail.html?appeal=AP20260508120001&order=' +
                    encodeURIComponent(ord);
            });
        }
    }

    function initShare(modal, inline) {
        bindClose(modal, inline, function () {
            global.location.href = 'transaction-detail.html';
        });
        modal.querySelectorAll('.theme-row .th').forEach(function (th) {
            th.addEventListener('click', function () {
                modal.querySelectorAll('.theme-row .th').forEach(function (t) {
                    t.classList.remove('active');
                });
                th.classList.add('active');
            });
        });
    }

    function initContact(modal, inline) {
        bindClose(modal, inline, function () {
            global.location.href = 'transaction-detail.html';
        });
    }

    function init(config) {
        config = config || {};
        var host = config.host;
        var modal = resolveModal(host);
        if (!modal) return;

        var pageUrl = config.page || '';
        var params = parsePageUrl(pageUrl);
        var inline = !!config.inline;

        if (pageUrl.indexOf('transaction-appeal') >= 0) {
            initAppeal(modal, params, inline);
            return;
        }
        if (pageUrl.indexOf('transaction-share-poster') >= 0) {
            initShare(modal, inline);
            return;
        }
        if (pageUrl.indexOf('transaction-contact') >= 0) {
            initContact(modal, inline);
        }
    }

    global.FLTransactionModals = { init: init };

    function bootStandalone() {
        var mask = document.querySelector('body.tx-modal-standalone .modal-mask');
        if (!mask) return;
        var page = global.location.pathname.split('/').pop() + global.location.search;
        init({ host: mask, page: page, inline: false });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootStandalone);
    } else {
        bootStandalone();
    }
})(typeof window !== 'undefined' ? window : globalThis);
