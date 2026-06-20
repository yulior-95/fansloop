/**
 * 设置中心 · 统一左侧导航
 * 所有 settings 子页挂载 data-settings-nav，菜单项与顺序保持一致
 */
(function () {
    var GROUPS = [
        {
            title: "账户",
            items: [
                { id: "account", label: "账户资料", href: "settings.html", icon: "fa-regular fa-user" },
                { id: "security", label: "账户安全", href: "settings-security.html", icon: "fa-solid fa-shield-halved" },
                { id: "wallet", label: "钱包与支付", href: "settings-wallet.html", icon: "fa-solid fa-wallet" },
                { id: "invite", label: "我的邀请人", href: "settings-invite-relation.html", icon: "fa-solid fa-link" }
            ]
        },
        {
            title: "体验",
            items: [
                { id: "notification", label: "通知偏好", href: "settings-notification.html", icon: "fa-regular fa-bell" },
                { id: "privacy", label: "隐私设置", href: "settings-privacy.html", icon: "fa-solid fa-user-shield" },
                { id: "display", label: "外观语言", href: "settings-display.html", icon: "fa-solid fa-palette", navId: "navDisplayLang" },
                { id: "global-access", label: "跨国界无障碍", href: "settings-display.html#ga-global-access", icon: "fa-solid fa-earth-americas", navId: "navGaGlobal" }
            ]
        },
        {
            title: "创作者",
            items: [
                { id: "subscription", label: "会员订阅设置", href: "settings-subscription.html", icon: "fa-solid fa-crown" }
            ]
        },
        {
            title: "关于",
            items: [
                { id: "about", label: "关于 FansLoop", href: "#", icon: "fa-solid fa-circle-info", static: true },
                { id: "terms", label: "条款与协议", href: "#", icon: "fa-solid fa-file-lines", static: true },
                { id: "logout", label: "退出登录", href: "#", icon: "fa-solid fa-right-from-bracket", logout: true }
            ]
        }
    ];

    var PAGE_ACTIVE = {
        "settings.html": "account",
        "settings-security.html": "security",
        "settings-pay-password.html": "security",
        "settings-wallet.html": "wallet",
        "settings-invite-relation.html": "invite",
        "settings-notification.html": "notification",
        "settings-privacy.html": "privacy",
        "settings-display.html": "display",
        "settings-subscription.html": "subscription"
    };

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
            "<span>" + esc(item.label) + "</span>" +
            arrow +
            "</div>"
        );
    }

    function renderNav(activeId) {
        var html = "";
        GROUPS.forEach(function (group) {
            html += '<div class="group-ti">' + esc(group.title) + "</div>";
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

    mount();
})();
