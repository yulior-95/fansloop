/**
 * 设置中心 · 统一左侧导航
 * 所有 settings 子页挂载 data-settings-nav，菜单项与顺序保持一致
 */
(function () {
    var GROUPS = [
        {
            title: "账户",
            titleKey: "set_grp_account",
            items: [
                { id: "account", label: "账户资料", i18nKey: "set_nav_account", href: "settings.html", icon: "fa-regular fa-user" },
                { id: "security", label: "账户安全", i18nKey: "set_nav_security", href: "settings-security.html", icon: "fa-solid fa-shield-halved" },
                { id: "wallet", label: "钱包与支付", i18nKey: "set_nav_wallet", href: "settings-wallet.html", icon: "fa-solid fa-wallet" }
            ]
        },
        {
            title: "体验",
            titleKey: "set_grp_experience",
            items: [
                { id: "notification", label: "通知偏好", i18nKey: "set_nav_notification", href: "settings-notification.html", icon: "fa-regular fa-bell" },
                { id: "privacy", label: "隐私设置", i18nKey: "set_nav_privacy", href: "settings-privacy.html", icon: "fa-solid fa-user-shield" },
                { id: "display", label: "外观语言", i18nKey: "set_nav_display", href: "settings-display.html", icon: "fa-solid fa-palette", navId: "navDisplayLang" },
                { id: "global-access", label: "跨国界无障碍", i18nKey: "set_nav_global_access", href: "settings-display.html#ga-global-access", icon: "fa-solid fa-earth-americas", navId: "navGaGlobal" }
            ]
        },
        {
            title: "创作者",
            titleKey: "set_grp_creator",
            items: [
                { id: "subscription", label: "会员订阅设置", i18nKey: "set_nav_subscription", href: "settings-subscription.html", icon: "fa-solid fa-crown" }
            ]
        },
        {
            title: "关于",
            titleKey: "set_grp_about",
            items: [
                { id: "about", label: "关于 FansLoop", i18nKey: "set_nav_about", href: "settings-about.html", icon: "fa-solid fa-circle-info" },
                { id: "terms", label: "条款与协议", i18nKey: "set_nav_terms", href: "settings-terms.html", icon: "fa-solid fa-file-lines" },
                { id: "logout", label: "退出登录", i18nKey: "set_nav_logout", href: "#", icon: "fa-solid fa-right-from-bracket", logout: true }
            ]
        }
    ];

    var PAGE_ACTIVE = {
        "settings.html": "account",
        "settings-security.html": "security",
        "settings-pay-password.html": "security",
        "settings-wallet.html": "wallet",
        "settings-notification.html": "notification",
        "settings-privacy.html": "privacy",
        "settings-display.html": "display",
        "settings-subscription.html": "subscription",
        "settings-about.html": "about",
        "settings-terms.html": "terms"
    };

    function tr(key, fallback) {
        if (window.FLI18n && window.FLI18n.t) {
            var code = window.FansLoopLang ? window.FansLoopLang.getLang() : "zh-CN";
            return window.FLI18n.t(code, key) || fallback;
        }
        return fallback;
    }

    function resolveActiveId() {
        if (document.body.dataset.settingsNavActive) {
            return document.body.dataset.settingsNavActive;
        }
        var page = (location.pathname.split("/").pop() || "settings.html").split("?")[0];
        if (page === "settings-display.html" && location.hash === "#ga-global-access") {
            return "global-access";
        }
        return PAGE_ACTIVE[page] || "";
    }

    function esc(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/"/g, "&quot;");
    }

    function renderItem(item, activeId) {
        var isActive = item.id === activeId;
        var cls = "nav-item" + (isActive ? " active" : "") + (item.logout ? " nav-item-logout" : "");
        var style = item.logout ? ' style="color:var(--danger-light)"' : "";
        var icStyle = item.logout ? ' style="color:var(--danger-light)"' : "";
        var arrow = isActive ? '<span class="arrow"><i class="fa-solid fa-chevron-right"></i></span>' : "";
        var href = item.href || "#";
        var onclick = "";
        var label = tr(item.i18nKey, item.label);

        if (item.logout) {
            onclick = "";
        } else if (item.static) {
            onclick = "";
        } else if (!isActive) {
            onclick = ' onclick="location.href=\'' + item.href.replace(/'/g, "\\'") + '\'"';
        }

        var idAttr = item.navId ? ' id="' + item.navId + '"' : "";
        var roleAttr = item.navId === "navGaGlobal" ? ' role="button" tabindex="0"' : "";

        return (
            '<div class="' + cls + '"' + style + idAttr + roleAttr + onclick + ">" +
            '<span class="ic"' + icStyle + '><i class="' + item.icon + '"></i></span>' +
            "<span>" + esc(label) + "</span>" +
            arrow +
            "</div>"
        );
    }

    function renderNav(activeId) {
        var html = "";
        GROUPS.forEach(function (group) {
            html += '<div class="group-ti">' + esc(tr(group.titleKey, group.title)) + "</div>";
            group.items.forEach(function (item) {
                html += renderItem(item, activeId);
            });
        });
        return html;
    }

    function mount() {
        var activeId = resolveActiveId();
        var html = renderNav(activeId);
        document.querySelectorAll("[data-settings-nav]").forEach(function (el) {
            el.innerHTML = html;
            el.setAttribute("aria-label", tr("set_nav_aria", "设置导航"));
        });
        document.dispatchEvent(new CustomEvent("settings-nav-mounted"));
        if (!document.querySelector('script[src*="settings-app-header.js"]')) {
            var s = document.createElement('script');
            var base = '';
            var scripts = document.getElementsByTagName('script');
            for (var i = 0; i < scripts.length; i++) {
                var src = scripts[i].src || '';
                if (src.indexOf('settings-nav') >= 0) {
                    base = src.replace(/\/js-web\/settings-nav\.js.*$/, '/js-web/');
                    break;
                }
            }
            s.src = (base || '../js-web/') + 'settings-app-header.js';
            document.body.appendChild(s);
        } else if (window.FL_applySettingsAppHeader) {
            window.FL_applySettingsAppHeader();
        }
    }

    window.FL_applySettingsNavI18n = function () {
        mount();
    };

    document.addEventListener("fansloop-lang-change", function () {
        mount();
    });

    mount();
})();
