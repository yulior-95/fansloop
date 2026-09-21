(function () {
    'use strict';
    if (!window.TransactionDetailPresets) return;

    var resolved = window.TransactionDetailPresets.resolveParams();
    var type = resolved.type;
    var order = resolved.order;
    var from = resolved.from;
    var cfg = window.TransactionDetailPresets.getConfig(type, order);

    function $(id) {
        return document.getElementById(id);
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function kvHtml(rows) {
        return (rows || []).map(function (r) {
            var copy = r[2]
                ? '<i class="fa-regular fa-copy copy" data-copy="' + esc(r[1]) + '"></i>'
                : '';
            return (
                '<div class="row"><div class="l">' + esc(r[0]) + '</div><div class="v">' + esc(r[1]) + copy + '</div></div>'
            );
        }).join('');
    }

    function heroAmountHtml(raw) {
        var s = String(raw || '');
        var m = s.match(/^([+-])\s*\$?\s*([\d.,]+)/);
        if (m) return '<sup>' + m[1] + ' $</sup>' + m[2];
        return esc(s);
    }

    function progressHtml(timeline) {
        return (timeline || []).map(function (r) {
            var done = r[2] ? ' done' : '';
            return (
                '<div class="step' + done + '"><div class="dot"><i class="fa-solid fa-check"></i></div>' +
                '<div class="nm">' + esc(r[0]) + '</div><div class="ti">' + esc(r[1]) + '</div></div>'
            );
        }).join('');
    }

    var heroIcon = $('tdWebHeroIcon');
    if (heroIcon) {
        heroIcon.style.background = cfg.iconBg;
        heroIcon.innerHTML = '<i class="fa-solid ' + cfg.icon + '"></i>';
    }
    var heroTitle = $('tdWebHeroTitle');
    if (heroTitle) heroTitle.textContent = cfg.heroTitle || cfg.heroType || '交易详情';
    var heroAmt = $('tdWebHeroAmt');
    if (heroAmt) heroAmt.innerHTML = heroAmountHtml(cfg.amount);
    var heroMeta = $('tdWebHeroMeta');
    if (heroMeta) {
        heroMeta.innerHTML = '≈ <b>' + esc(cfg.sub || '') + '</b>';
    }

    var statusTag = $('tdWebStatusTag');
    if (statusTag) {
        statusTag.textContent = cfg.statusText || '已结算';
        statusTag.className = 'tag ' + (cfg.statusTag || 'tag-success');
    }

    var orderEl = $('tdWebOrderId');
    if (orderEl) orderEl.textContent = order;

    var detailKv = $('tdWebDetailKv');
    if (detailKv) {
        var rows = (cfg.info || []).slice();
        if (cfg.calc && cfg.calc.length) {
            cfg.calc.forEach(function (r) {
                rows.push([r[0], r[1]]);
            });
        }
        detailKv.innerHTML = kvHtml(rows);
    }

    var progress = $('tdWebProgress');
    if (progress) progress.innerHTML = progressHtml(cfg.timeline);

    var chainCard = $('tdWebChainCard');
    var chainKv = $('tdWebChainKv');
    if (chainCard && chainKv) {
        if (cfg.chain && cfg.chain.length) {
            chainCard.style.display = '';
            chainKv.innerHTML = kvHtml(cfg.chain);
        } else {
            chainCard.style.display = 'none';
        }
    }

    var relatedCard = $('tdWebRelatedCard');
    if (relatedCard) {
        if (cfg.related) {
            relatedCard.style.display = '';
            var rTitle = $('tdWebRelatedTitle');
            var rMeta = $('tdWebRelatedMeta');
            if (rTitle) rTitle.textContent = cfg.related.title || '';
            if (rMeta) rMeta.textContent = cfg.related.meta || '';
        } else {
            relatedCard.style.display = 'none';
        }
    }

    var userCard = $('tdWebUserCard');
    var asideSplit = $('tdWebAsideSplit');
    if (userCard) {
        if (cfg.cp && !cfg.cp.hide) {
            userCard.style.display = '';
            if (asideSplit) asideSplit.style.display = '';
            var av = $('tdWebUserAv');
            if (av) av.style.backgroundImage = 'url("' + cfg.cp.avatar + '")';
            var nm = $('tdWebUserName');
            if (nm) nm.innerHTML = esc(cfg.cp.name) + ' <i class="fa-solid fa-circle-check"></i>';
            var meta = $('tdWebUserMeta');
            if (meta) meta.textContent = cfg.cp.meta || '';
            var stats = $('tdWebUserStats');
            if (stats && cfg.cp.stats) {
                stats.innerHTML =
                    '<span>' + esc(cfg.cp.stats[0]) + ' <b>' + esc(cfg.cp.stats[1]) + '</b> ' + esc(cfg.cp.stats[2]) + '</span>';
            }
            var msgBtn = $('tdWebUserMsg');
            var profileBtn = $('tdWebUserProfile');
            if (msgBtn) msgBtn.onclick = function () { location.href = cfg.cp.go || 'messages.html'; };
            if (profileBtn) profileBtn.onclick = function () { location.href = cfg.cp.go || 'creator-profile.html'; };
        } else {
            userCard.style.display = 'none';
            if (asideSplit) asideSplit.style.display = 'none';
        }
    }

    function openTxModal(page) {
        if (typeof closeMoreMenu === 'function') closeMoreMenu();
        if (window.FL_openInteractionModal) {
            window.FL_openInteractionModal(page);
        } else {
            location.href = page;
        }
    }

    function bindMenuRow(row, fn) {
        if (!row) return;
        row.addEventListener('click', fn);
        row.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fn();
            }
        });
    }

    function contactModalPage() {
        return 'transaction-contact.html?order=' + encodeURIComponent(order);
    }

    var shareHeadBtn = document.getElementById('tdWebShareBtn');
    if (shareHeadBtn) {
        shareHeadBtn.addEventListener('click', function () {
            openTxModal('transaction-share-poster.html?order=' + encodeURIComponent(order));
        });
    }

    var appealBtn = document.querySelector('[data-td-appeal]');
    if (appealBtn) {
        appealBtn.removeAttribute('onclick');
        appealBtn.addEventListener('click', function () {
            openTxModal('transaction-appeal.html?order=' + encodeURIComponent(order));
        });
    }

    var contactBtn = document.querySelector('[data-td-contact]');
    if (contactBtn) {
        contactBtn.removeAttribute('onclick');
        contactBtn.addEventListener('click', function () {
            openTxModal(contactModalPage());
        });
    }

    var moreMenuModal = document.getElementById('tdWebMoreMenuModal');
    var moreMenuBtn = document.getElementById('tdWebMoreMenuBtn');

    function openMoreMenu() {
        if (!moreMenuModal) return;
        var sub = document.getElementById('tdWebMoreMenuOrder');
        if (sub) sub.textContent = '订单 ' + order;
        moreMenuModal.classList.add('open');
        moreMenuModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeMoreMenu() {
        if (!moreMenuModal) return;
        moreMenuModal.classList.remove('open');
        moreMenuModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    if (moreMenuBtn && moreMenuModal) {
        moreMenuBtn.addEventListener('click', openMoreMenu);
    }

    ['tdWebMoreMenuClose', 'tdWebMoreMenuDismiss'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', closeMoreMenu);
    });

    if (moreMenuModal) {
        moreMenuModal.addEventListener('click', function (e) {
            if (e.target === moreMenuModal) closeMoreMenu();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && moreMenuModal.classList.contains('open')) closeMoreMenu();
        });
    }

    var copyRow = document.getElementById('tdWebMoreCopy');
    if (copyRow) {
        function doCopy() {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(order).catch(function () { /* ignore */ });
            }
            closeMoreMenu();
        }
        copyRow.addEventListener('click', doCopy);
        copyRow.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                doCopy();
            }
        });
    }

    bindMenuRow(document.getElementById('tdWebMoreShare'), function () {
        openTxModal('transaction-share-poster.html?order=' + encodeURIComponent(order));
    });

    bindMenuRow(document.getElementById('tdWebMoreAppeal'), function () {
        openTxModal('transaction-appeal.html?order=' + encodeURIComponent(order));
    });

    bindMenuRow(document.getElementById('tdWebMoreContact'), function () {
        openTxModal(contactModalPage());
    });

    document.querySelectorAll('[data-td-more-stub]').forEach(function (row) {
        bindMenuRow(row, function () {
            closeMoreMenu();
            var msg = row.getAttribute('data-td-more-stub') || '';
            if (msg && typeof window.FL_showToast === 'function') {
                window.FL_showToast(msg, { type: 'info' });
            }
        });
    });

    try {
        var bootParams = new URLSearchParams(location.search);
        var txModal = bootParams.get('txModal');
        if (txModal === 'contact') {
            setTimeout(function () { openTxModal(contactModalPage()); }, 80);
        } else if (txModal === 'appeal') {
            setTimeout(function () {
                openTxModal('transaction-appeal.html?order=' + encodeURIComponent(order));
            }, 80);
        } else if (txModal === 'share') {
            setTimeout(function () {
                openTxModal('transaction-share-poster.html?order=' + encodeURIComponent(order));
            }, 80);
        }
    } catch (_) { /* noop */ }

    var primary = cfg.primary || ['返回账变记录', 'transactions.html', 'fa-list-ul'];
    var backDefault = 'transactions.html';
    if (from === 'creator-income') backDefault = 'creator-income.html';
    if (from === 'search') backDefault = 'transactions-search.html';
    if (from === 'wallet') backDefault = 'wallet.html';

    document.querySelectorAll('[data-td-back]').forEach(function (btn) {
        if (btn.getAttribute('data-td-back-bound') === '1') return;
        btn.setAttribute('data-td-back-bound', '1');
        btn.setAttribute('data-back-fallback', backDefault);
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            location.href = backDefault;
        });
    });

    var injectedBack = document.getElementById('flPageBackBtn');
    if (injectedBack) injectedBack.remove();

    document.querySelectorAll('[data-copy]').forEach(function (el) {
        el.addEventListener('click', function () {
            var val = el.getAttribute('data-copy') || '';
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(val).catch(function () { /* ignore */ });
            }
        });
    });
})();
