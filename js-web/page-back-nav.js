/**
 * GOODFANS Web · 子页面统一返回
 * - 主导航页不注入
 * - 已有明确返回控件的页面不重复注入
 * - 优先 history.back()，无历史时回退到映射父页
 */
(function (global) {
    var doc = global.document;
    if (doc && doc.documentElement && doc.documentElement.getAttribute('data-fl-page-back-ready') === '1') {
        return;
    }
    if (doc && doc.documentElement) {
        doc.documentElement.setAttribute('data-fl-page-back-ready', '1');
    }

    var MAIN_PAGES = {
        'home.html': 1,
        'guest-home.html': 1,
        'subscriptions.html': 1,
        'discover.html': 1,
        'create.html': 1,
        'messages.html': 1,
        'notifications.html': 1,
        'wallet.html': 1,
        'creator-income.html': 1,
        'points-mall.html': 1,
        'transactions.html': 1,
        'profile.html': 1,
        'settings.html': 1,
        'index.html': 1,
        'yanshi-web.html': 1
    };

    var FALLBACK = {
        'settings-account.html': 'settings.html',
        'settings-security.html': 'settings.html',
        'settings-security-binding.html': 'settings-security.html',
        'settings-pay-password.html': 'settings-security.html',
        'settings-wallet.html': 'settings.html',
        'settings-notification.html': 'settings.html',
        'settings-privacy.html': 'settings.html',
        'settings-display.html': 'settings.html',
        'settings-global-access.html': 'settings-display.html#ga-global-access',
        'settings-subscription.html': 'settings.html',
        'settings-about.html': 'settings.html',
        'settings-terms.html': 'settings.html',
        'settings-live.html': 'settings.html',
        'settings-invite-relation.html': 'settings.html',
        'settings-creator-earnings.html': 'settings.html',

        'recharge.html': 'wallet.html',
        'recharge-fiat.html': 'wallet.html',
        'recharge-fiat-verify.html': 'recharge-fiat.html',
        'recharge-fiat-bind.html': 'recharge-fiat.html',
        'recharge-fiat-switch-card.html': 'recharge-fiat.html',
        'recharge-timeout.html': 'wallet.html',
        'withdraw-usdt.html': 'wallet.html',
        'withdraw-fiat.html': 'wallet.html',
        'withdraw-fiat-edit.html': 'withdraw-fiat.html',
        'withdraw-fiat-verify.html': 'withdraw-fiat.html',
        'withdraw-fiat-verify-pwd.html': 'withdraw-fiat.html',
        'withdraw-fiat-success.html': 'wallet.html',
        'withdraw-recipient-add.html': 'withdraw-usdt.html',
        'withdraw-help-modal.html': 'withdraw-fiat.html',
        'transfer.html': 'wallet.html',
        'wallet-address-book.html': 'wallet.html',
        'wallet-list-full.html': 'wallet.html',
        'funds-history.html': 'wallet.html',
        'funds-flow-detail.html': 'funds-history.html',

        'transactions-search.html': 'transactions.html',
        'transactions-export.html': 'transactions.html',
        'transaction-detail.html': 'transactions.html',
        'transaction-appeal.html': 'transaction-detail.html',
        'transaction-appeal-detail.html': 'transactions.html',
        'transaction-contact.html': 'transaction-detail.html',
        'transaction-more-menu.html': 'transaction-detail.html',
        'transaction-share-poster.html': 'transaction-detail.html',

        'messages-compose.html': 'messages.html',
        'messages-contacts.html': 'messages.html',
        'messages-requests.html': 'messages.html',
        'messages-interactions.html': 'messages.html',
        'messages-friend-notifications.html': 'messages.html',
        'messages-group.html': 'messages.html',
        'messages-group-create.html': 'messages.html',
        'messages-group-settings.html': 'messages-group.html',
        'messages-group-invites.html': 'messages.html',
        'messages-translate-demo.html': 'settings-display.html#ga-global-access',

        'notification-center.html': 'notifications.html',
        'notification-detail.html': 'notifications.html',
        'notification-home-entry.html': 'notifications.html',
        'notification-system-tab.html': 'notifications.html',
        'notification-mac-banner.html': 'notifications.html',
        'notification-mac-on-home.html': 'home.html',

        'create-live-host.html': 'create.html',
        'create-digital-asset.html': 'create.html',
        'create-publish-image.html': 'create.html',
        'create-publish-video.html': 'create.html',
        'create-publish-live.html': 'create.html',
        'create-publish-paid.html': 'create.html',

        'digital-asset-store.html': 'profile.html',
        'digital-asset-detail.html': 'digital-asset-store.html',
        'my-digital-assets.html': 'profile.html',
        'creator-showcase.html': 'profile.html',
        'affiliate-catalog.html': 'creator-showcase.html',
        'affiliate-showcase.html': 'creator-showcase.html',

        'live-detail.html': 'home.html',
        'live-detail-ab.html': 'home.html',
        'live-all.html': 'home.html',
        'live-translate-demo.html': 'settings-display.html#ga-global-access',
        'live-pip-global.html': 'home.html',

        'topic-detail.html': 'topics.html',
        'topics.html': 'discover.html',
        'bookmarks.html': 'profile.html',
        'creator-profile.html': 'discover.html',
        'home-ab-feed.html': 'home.html',
        'home-points-ledger.html': 'home.html',
        'home-points-header.html': 'home.html',
        'points-tier-info.html': 'profile.html',
        'profile-invite-center.html': 'profile.html',

        'kyc-intro.html': 'settings.html',
        'kyc-status.html': 'settings.html',
        'kyc-upload-id.html': 'kyc-intro.html',
        'kyc-face-verify.html': 'kyc-upload-id.html',
        'kyc-face-mobile.html': 'kyc-face-verify.html',
        'kyc-doc-pending.html': 'kyc-status.html',
        'kyc-doc-result.html': 'kyc-status.html',
        'kyc-complete.html': 'settings.html',
        'kyc-submit-success.html': 'settings.html',
        'kyc-wallet-verify.html': 'wallet.html',
        'kyc-third-party.html': 'kyc-intro.html',
        'kyc-admin-list.html': 'settings.html',

        'onboarding-profile-complete.html': 'home.html',
        'flow-subscribe-creator.html': 'subscriptions.html',
        'flow-unlock-paid.html': 'discover.html'
    };

    function loc() {
        return global.location || {};
    }

    function pageName() {
        var L = loc();
        var path = String(L.pathname || '').replace(/\\/g, '/');
        var name = path.split('/').pop() || '';
        if (!name || name.indexOf('.html') < 0) {
            name = String(L.href || '').split('/').pop() || '';
            name = name.split('?')[0].split('#')[0];
        }
        return String(name || '').split('?')[0].split('#')[0];
    }

    function resolveFallback(name) {
        if (FALLBACK[name]) return FALLBACK[name];
        var path = String(loc().pathname || '').replace(/\\/g, '/');
        if (path.indexOf('/obs-cohost-pk/') >= 0) return '../create-live-host.html';
        if (/^settings-/.test(name)) return 'settings.html';
        if (/^recharge/.test(name) || /^withdraw/.test(name) || /^transfer/.test(name) || /^wallet-/.test(name) || /^funds-/.test(name)) return 'wallet.html';
        if (/^transaction/.test(name)) return 'transactions.html';
        if (/^messages-/.test(name)) return 'messages.html';
        if (/^notification/.test(name)) return 'notifications.html';
        if (/^create-/.test(name)) return 'create.html';
        if (/^kyc-/.test(name)) return 'settings.html';
        if (/^live-/.test(name)) return 'home.html';
        if (/^modal-/.test(name)) return 'home.html';
        if (/^proto-/.test(name)) return 'home.html';
        if (/^host-/.test(name) || /^viewer-/.test(name)) return '../create-live-host.html';
        return 'home.html';
    }

    function sameOriginReferrer() {
        try {
            var refRaw = (doc && doc.referrer) || '';
            if (!refRaw) return false;
            var ref = new URL(refRaw);
            return ref.origin === loc().origin;
        } catch (e) {
            return false;
        }
    }

    function goBack(fallback) {
        var fb = fallback || resolveFallback(pageName());
        var canBack = false;
        try {
            canBack = (global.history && global.history.length > 1) && sameOriginReferrer();
        } catch (e) {
            canBack = false;
        }
        if (canBack) {
            global.history.back();
            return;
        }
        global.location.href = fb;
    }

    function hasExistingBackControl() {
        if (!doc || !doc.querySelector) return false;
        if (doc.querySelector('[data-fl-page-back]')) return true;
        if (typeof doc.getElementById === 'function' && doc.getElementById('flPageBackBtn')) return true;
        var sels = [
            'a.back',
            '.pti-back',
            '.ld-ab-back',
            '#btnBack',
            '#linkBack',
            '#btnManageBack',
            'a[href][title*="返回"]',
            'button[title*="返回"]'
        ];
        for (var i = 0; i < sels.length; i++) {
            if (doc.querySelector(sels[i])) return true;
        }
        var scope = doc.querySelector('.page-head, .af-top, .app-header .h-actions');
        var root = scope || doc.querySelector('main.app-main, .app-main, main');
        if (!root || !root.querySelectorAll) return false;
        var candidates = root.querySelectorAll('a, button');
        var limit = Math.min(candidates.length, 12);
        for (var j = 0; j < limit; j++) {
            var el = candidates[j];
            var t = String((el.textContent || '')).replace(/\s+/g, '');
            if (t.indexOf('返回') >= 0 || t.indexOf('上一步') >= 0) return true;
        }
        return false;
    }

    function ensureStyle() {
        if (!doc || !doc.head) return;
        if (doc.getElementById && doc.getElementById('flPageBackStyle')) return;
        var css = doc.createElement('style');
        css.id = 'flPageBackStyle';
        css.textContent = [
            '.fl-page-back{display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 12px;border-radius:999px;border:1px solid var(--border);background:var(--bg-elevated,rgba(255,255,255,.06));color:var(--t-secondary,#A0A0B0);font-size:12.5px;font-weight:600;cursor:pointer;text-decoration:none;transition:.15s;white-space:nowrap}',
            '.fl-page-back:hover{color:#fff;border-color:rgba(168,85,247,.45);background:rgba(168,85,247,.14)}',
            '.fl-page-back i{font-size:12px}',
            '.page-head.page-head--detail .ph-l .fl-page-back{margin-bottom:10px}',
            '.fl-page-back-wrap{display:flex;align-items:center;gap:10px;margin-bottom:14px}',
            '.fl-page-back-float{position:fixed;top:78px;left:88px;z-index:120}',
            'html.sidebar-collapsed-pre .fl-page-back-float,html.sidebar-collapsed .fl-page-back-float{left:24px}',
            '@media (max-width:1100px){.fl-page-back-float{left:16px;top:70px}}'
        ].join('');
        doc.head.appendChild(css);
    }

    function makeBtn(fallback) {
        var btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'fl-page-back';
        btn.id = 'flPageBackBtn';
        btn.setAttribute('data-fl-page-back', '1');
        btn.setAttribute('data-back-fallback', fallback);
        btn.innerHTML = '<i class="fa-solid fa-arrow-left"></i><span>返回</span>';
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            goBack(fallback);
        });
        return btn;
    }

    function inject() {
        var name = pageName();
        if (!name || MAIN_PAGES[name]) return;
        if (doc && doc.body && doc.body.getAttribute('data-fl-no-page-back') === '1') return;
        if (hasExistingBackControl()) {
            bindLooseBackControls(resolveFallback(name));
            return;
        }

        ensureStyle();
        var fallback = resolveFallback(name);
        var btn = makeBtn(fallback);

        var detailHead = doc.querySelector('.page-head.page-head--detail .ph-l');
        if (detailHead) {
            detailHead.insertBefore(btn, detailHead.firstChild);
            return;
        }

        var pageHead = doc.querySelector('main.app-main > .page-head .ph-l, .app-main > .page-head .ph-l');
        if (pageHead) {
            pageHead.insertBefore(btn, pageHead.firstChild);
            return;
        }

        var crumbRow = doc.querySelector('main.app-main > .breadcrumb-row, .app-main > .breadcrumb-row');
        if (crumbRow && crumbRow.parentNode) {
            var wrapCrumb = doc.createElement('div');
            wrapCrumb.className = 'fl-page-back-wrap';
            wrapCrumb.appendChild(btn);
            crumbRow.parentNode.insertBefore(wrapCrumb, crumbRow);
            return;
        }

        var pageHeadRoot = doc.querySelector('main.app-main > .page-head, .app-main > .page-head');
        if (pageHeadRoot && pageHeadRoot.parentNode) {
            var wrap = doc.createElement('div');
            wrap.className = 'fl-page-back-wrap';
            wrap.appendChild(btn);
            pageHeadRoot.parentNode.insertBefore(wrap, pageHeadRoot);
            return;
        }

        var main = doc.querySelector('main.app-main, .app-main, main');
        if (main) {
            var wrap2 = doc.createElement('div');
            wrap2.className = 'fl-page-back-wrap';
            wrap2.appendChild(btn);
            main.insertBefore(wrap2, main.firstChild);
            return;
        }

        if (doc.body) {
            btn.classList.add('fl-page-back-float');
            doc.body.appendChild(btn);
        }
    }

    function bindLooseBackControls(fallback) {
        if (!doc || !doc.querySelectorAll) return;
        var nodes = doc.querySelectorAll('[data-fl-back], [data-back-fallback]');
        for (var i = 0; i < nodes.length; i++) {
            (function (el) {
                if (el.getAttribute('data-fl-back-bound') === '1') return;
                el.setAttribute('data-fl-back-bound', '1');
                el.addEventListener('click', function (e) {
                    if (el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href') !== '#') return;
                    e.preventDefault();
                    goBack(el.getAttribute('data-back-fallback') || fallback);
                });
            })(nodes[i]);
        }

        var linkBack = typeof doc.getElementById === 'function' ? doc.getElementById('linkBack') : null;
        if (linkBack && linkBack.getAttribute('data-fl-back-bound') !== '1') {
            linkBack.setAttribute('data-fl-back-bound', '1');
            linkBack.addEventListener('click', function (e) {
                var href = linkBack.getAttribute('href');
                if (href && href !== '#') return;
                e.preventDefault();
                goBack(fallback);
            });
        }
    }

    function init() {
        inject();
        bindLooseBackControls(resolveFallback(pageName()));
    }

    if (!doc || doc.readyState === 'loading') {
        if (global.addEventListener) {
            global.addEventListener('DOMContentLoaded', init);
        } else if (doc && doc.addEventListener) {
            doc.addEventListener('DOMContentLoaded', init);
        }
    } else {
        init();
    }

    global.FL_pageBack = goBack;
    global.FL_pageBackFallback = function () {
        return resolveFallback(pageName());
    };
})(typeof window !== 'undefined' ? window : this);
