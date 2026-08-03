/**
 * 设置子页 · 顶栏与账户安全等主场景对齐（搜索 / 通知 / 私信 / 充值 / 头像）
 */
(function () {
    var AVATAR_URL = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80';

    function tr(key, fallback) {
        if (window.FLI18n && window.FLI18n.t) {
            var code = window.GoodFansLang ? window.GoodFansLang.getLang() : 'zh-CN';
            return window.FLI18n.t(code, key) || fallback;
        }
        return fallback;
    }

    function searchPlaceholder() {
        return tr('search_ph', '搜索创作者、内容或话题…');
    }

    function scriptBase() {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src || '';
            if (src.indexOf('settings-app-header') >= 0 || src.indexOf('settings-nav') >= 0) {
                return src.replace(/\/js-web\/[^/]+$/, '/js-web/');
            }
        }
        return '../js-web/';
    }

    function ensureGlobalSearch() {
        if (document.querySelector('script[src*="global-search.js"]')) return;
        var s = document.createElement('script');
        s.src = scriptBase() + 'global-search.js';
        document.body.appendChild(s);
    }

    function beforeAvatar(actions, node) {
        var av = actions.querySelector('.h-avatar');
        if (av) actions.insertBefore(node, av);
        else actions.appendChild(node);
    }

    function hasIcon(actions, iconClass) {
        return !!actions.querySelector('i.' + iconClass.split(' ').join('.'));
    }

    function ensureSearch(header) {
        var ph = searchPlaceholder();
        var search = header.querySelector('.h-search-live.h-search-unified');
        if (!search) {
            var old = header.querySelector('.h-search');
            if (old) old.remove();
            header.insertAdjacentHTML(
                'afterbegin',
                '<div class="h-search h-search-live h-search-unified">' +
                '<div class="hs-inner"><i class="fa-solid fa-magnifying-glass"></i>' +
                '<input type="search" placeholder="' + ph + '" data-i18n-src-ph="搜索创作者、内容或话题…" autocomplete="off" />' +
                '</div><div class="gs-drop"></div></div>'
            );
            return;
        }
        if (!search.querySelector('.gs-drop')) {
            search.insertAdjacentHTML('beforeend', '<div class="gs-drop"></div>');
        }
        var inp = search.querySelector('input[type="search"], input[type="text"]');
        if (inp) {
            inp.type = 'search';
            if (!inp.getAttribute('data-i18n-src-ph')) {
                inp.setAttribute('data-i18n-src-ph', inp.placeholder || '搜索创作者、内容或话题…');
            }
            inp.placeholder = ph;
            if (!inp.hasAttribute('autocomplete')) inp.setAttribute('autocomplete', 'off');
        }
    }

    function ensureActions(header) {
        var actions = header.querySelector('.h-actions');
        if (!actions) {
            actions = document.createElement('div');
            actions.className = 'h-actions';
            header.appendChild(actions);
        }

        if (!hasIcon(actions, 'fa-bell')) {
            var bell = document.createElement('button');
            bell.type = 'button';
            bell.className = 'h-icon';
            bell.innerHTML = '<i class="fa-regular fa-bell"></i><span class="dot"></span>';
            beforeAvatar(actions, bell);
        } else {
            var bellBtn = actions.querySelector('i.fa-bell');
            if (bellBtn && !bellBtn.closest('.h-icon').querySelector('.dot')) {
                bellBtn.closest('.h-icon').insertAdjacentHTML('beforeend', '<span class="dot"></span>');
            }
        }

        if (!hasIcon(actions, 'fa-comments')) {
            var msg = document.createElement('button');
            msg.type = 'button';
            msg.className = 'h-icon';
            msg.setAttribute('onclick', "location.href='messages.html'");
            msg.innerHTML = '<i class="fa-regular fa-comments"></i>';
            beforeAvatar(actions, msg);
        }

        var rechargeLabel = tr('recharge', '充值');
        if (!actions.querySelector('.h-cta')) {
            var cta = document.createElement('button');
            cta.type = 'button';
            cta.className = 'h-cta';
            cta.setAttribute('onclick', "location.href='wallet.html'");
            cta.setAttribute('data-i18n-src', '充值');
            cta.innerHTML = '<i class="fa-solid fa-bolt"></i>' + rechargeLabel;
            beforeAvatar(actions, cta);
        } else {
            var ctaBtn = actions.querySelector('.h-cta');
            if (ctaBtn) {
                ctaBtn.setAttribute('data-i18n-src', '充值');
                var icon = ctaBtn.querySelector('i');
                ctaBtn.textContent = '';
                if (icon) ctaBtn.appendChild(icon);
                ctaBtn.appendChild(document.createTextNode(rechargeLabel));
            }
        }

        var av = actions.querySelector('.h-avatar');
        if (!av) {
            av = document.createElement('div');
            av.className = 'h-avatar';
            actions.appendChild(av);
        }
        av.style.backgroundImage = "url('" + AVATAR_URL + "')";
        if (!av.getAttribute('onclick')) {
            av.setAttribute('onclick', "location.href='profile.html'");
        }
    }

    function apply() {
        if (!document.body.classList.contains('page-settings')) return;
        var header = document.querySelector('.app-header');
        if (!header) return;
        ensureSearch(header);
        ensureActions(header);
        ensureGlobalSearch();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply);
    } else {
        apply();
    }

    document.addEventListener('goodfans-lang-change', apply);

    window.FL_applySettingsAppHeader = apply;
})();
