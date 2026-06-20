/**
 * FansLoop · 全局侧栏展开/收起 + 一屏布局（配合 common-web.css）
 * · 统一侧栏导航：各子页面菜单结构一致
 */
(function (global) {
    /* 外观偏好首屏同步（与 global-display-prefs.js 一致） */
    try {
        var FONT_SCALES = [0.875, 0.9375, 1, 1.0625, 1.125];
        var raw = localStorage.getItem('fl_display_prefs_v1');
        var p = raw ? JSON.parse(raw) : {};
        var theme = p.theme || 'dark';
        var resolved = theme === 'auto'
            ? (global.matchMedia && global.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
            : (theme === 'light' ? 'light' : 'dark');
        var html = document.documentElement;
        html.setAttribute('data-fl-theme', resolved);
        html.setAttribute('data-fl-theme-mode', theme);
        html.setAttribute('data-fl-high-contrast', p.highContrast ? '1' : '0');
        html.setAttribute('data-fl-sans', p.sansFont ? '1' : '0');
        html.setAttribute('data-fl-motion', p.uiMotion === false ? '0' : '1');
        html.setAttribute('data-fl-glass', p.glass === false ? '0' : '1');
        var idx = p.fontScaleIndex != null ? p.fontScaleIndex : 2;
        if (idx < 0 || idx >= FONT_SCALES.length) idx = 2;
        html.setAttribute('data-fl-font-scale', String(idx));
        html.style.setProperty('--fl-font-scale', String(FONT_SCALES[idx]));
        html.setAttribute('data-fl-timezone', p.timezone || 'system');
    } catch (e) { /* ignore */ }

    var STORAGE_KEY = 'fl_sidebar_collapsed';
    var NAV_CONTEXT_KEY = 'fl_sidebar_nav_context';

    function detectScriptBase() {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src || '';
            if (src.indexOf('app-sidebar-global') >= 0) {
                return src.replace(/\/js-web\/app-sidebar-global\.js.*$/, '/js-web/');
            }
        }
        return '../js-web/';
    }

    function ensureAuthPrototype(cb) {
        if (global.FansloopAuth && global.FLAuthUiSync) {
            if (cb) cb();
            return;
        }
        if (global.__flAuthProtoLoading) {
            global.addEventListener('fl-auth-prototype-ready', function once() {
                global.removeEventListener('fl-auth-prototype-ready', once);
                if (cb) cb();
            });
            return;
        }
        global.__flAuthProtoLoading = true;
        var base = detectScriptBase();
        var queue = [
            'user-prototype-registry.js', 'user-assets-store.js', 'pay-password-store.js',
            'auth-session.js', 'auth-ui-sync.js', 'creator-income-store.js', 'creator-pro-store.js',
            'sidebar-bottom-interactions.js'
        ];
        function loadNext(idx) {
            if (idx >= queue.length) {
                global.__flAuthProtoLoading = false;
                try {
                    global.dispatchEvent(new CustomEvent('fl-auth-prototype-ready'));
                } catch (e) { /* ignore */ }
                if (cb) cb();
                return;
            }
            var s = document.createElement('script');
            s.src = base + queue[idx];
            s.onload = function () { loadNext(idx + 1); };
            s.onerror = function () { loadNext(idx + 1); };
            document.head.appendChild(s);
        }
        loadNext(0);
    }

    function isValidNavId(id) {
        if (!id) return false;
        for (var gi = 0; gi < SIDEBAR_NAV.length; gi++) {
            var items = SIDEBAR_NAV[gi].items;
            for (var ii = 0; ii < items.length; ii++) {
                if (items[ii].id === id) return true;
            }
        }
        return false;
    }

    function readNavContext() {
        var p = new URLSearchParams(location.search);
        var fromUrl = p.get('nav');
        if (fromUrl && isValidNavId(fromUrl)) return fromUrl;
        try {
            var stored = sessionStorage.getItem(NAV_CONTEXT_KEY) || '';
            return isValidNavId(stored) ? stored : '';
        } catch (e) {
            return '';
        }
    }

    function persistNavContext(activeId) {
        if (!isValidNavId(activeId)) return;
        try {
            sessionStorage.setItem(NAV_CONTEXT_KEY, activeId);
        } catch (e) {}
    }

    /** 跳转他人主页时附带当前模块，侧栏保持来源高亮 */
    function navContextProfileUrl(base, navId) {
        var url = base || 'creator-profile.html';
        var id = navId || readNavContext() || detectActiveNavId(currentPageName());
        if (!isValidNavId(id)) return url;
        var sep = url.indexOf('?') >= 0 ? '&' : '?';
        return url + sep + 'nav=' + encodeURIComponent(id);
    }

    /** 侧栏角标 / chip（动态项见 applySidebarIndicators） */
    var SIDEBAR_INDICATORS = {
        create: { badge: 2, badgeVariant: 'warn' },
        messages: { badgeKey: 'messages', defaultBadge: 8 },
        notifications: { badgeKey: 'notifications', defaultBadge: 12 },
        'creator-income': { chipKey: 'creator-income' },
        'points-mall': { chip: 'Hot', chipClass: 'chip--mall-hot' }
    };

    var NF_UNREAD_LS = 'fl_nf_unread_count';
    var MSG_UNREAD_LS = 'fl_msg_unread_count';

    /** 全站统一侧栏菜单 */
    var SIDEBAR_NAV = [
        {
            section: '主导航',
            sectionKey: 'nav_section_main',
            items: [
                { id: 'home', label: '首页', i18nKey: 'nav_home', href: 'home.html', icon: 'fa-solid fa-house' },
                { id: 'subscriptions', label: '订阅', i18nKey: 'nav_subscriptions', href: 'subscriptions.html', icon: 'fa-solid fa-crown' },
                { id: 'discover', label: '发现', i18nKey: 'nav_discover', href: 'discover.html', icon: 'fa-solid fa-compass' },
                { id: 'create', label: '创建内容', i18nKey: 'nav_create', href: 'create.html', icon: 'fa-solid fa-pen-to-square' }
            ]
        },
        {
            section: '互动',
            sectionKey: 'nav_section_interact',
            items: [
                { id: 'messages', label: '消息', i18nKey: 'nav_messages', href: 'messages.html', icon: 'fa-regular fa-comments' },
                { id: 'notifications', label: '通知', i18nKey: 'nav_notifications', href: 'notifications.html?tab=unread', icon: 'fa-regular fa-bell' }
            ]
        },
        {
            section: '资产',
            sectionKey: 'nav_section_assets',
            items: [
                { id: 'wallet', label: '钱包', i18nKey: 'nav_wallet', href: 'wallet.html', icon: 'fa-solid fa-wallet' },
                { id: 'creator-income', label: '创作者收入', i18nKey: 'nav_creator_income', href: 'creator-income.html', icon: 'fa-solid fa-coins' },
                { id: 'points-mall', label: '积分商城', i18nKey: 'nav_points_mall', href: 'points-mall.html', icon: 'fa-solid fa-store' },
                { id: 'transactions', label: '账变记录', i18nKey: 'nav_transactions', href: 'transactions.html', icon: 'fa-solid fa-list-ul' }
            ]
        },
        {
            section: '个人',
            sectionKey: 'nav_section_personal',
            items: [
                { id: 'profile', label: '我的主页', i18nKey: 'nav_profile', href: 'profile.html', icon: 'fa-regular fa-user' },
                { id: 'settings', label: '设置', i18nKey: 'nav_settings', href: 'settings.html', icon: 'fa-solid fa-gear' }
            ]
        }
    ];

    var DEFAULT_BOTTOM =
        '<div class="s-bottom">' +
        '  <div class="s-pro-card" data-fl-pro-card>' +
        '    <div class="crown"><i class="fa-solid fa-crown"></i></div>' +
        '    <h4>升级 Creator Pro</h4>' +
        '    <p>解锁高级数据 / 优先推流</p>' +
        '    <button type="button" data-fl-pro-upgrade>立即升级</button>' +
        '  </div>' +
        '  <div class="s-user">' +
        '    <div class="av" style="background-image: url(\'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80\')"></div>' +
        '    <div class="info">' +
        '      <div class="name-row">' +
        '        <span class="n">Luna 🌙</span>' +
        '        <span class="s-member-tag" data-fl-member-tag hidden><i class="fa-solid fa-crown"></i> 会员</span>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>';

    function currentPageName() {
        return (location.pathname.split('/').pop() || 'home.html').split('?')[0].toLowerCase();
    }

    function detectActiveNavId(page) {
        if (page === 'creator-profile.html') {
            return readNavContext();
        }
        if (page === 'home.html' || page === 'guest-home.html' || page === 'yanshi-web.html') return 'home';
        if (page === 'subscriptions.html') return 'subscriptions';
        if (
            page === 'discover.html' || page === 'topics.html' || page === 'topic-detail.html' ||
            page === 'bookmarks.html' || page.indexOf('live-') === 0 || page.indexOf('proto-discover') === 0
        ) return 'discover';
        if (page.indexOf('create') === 0) return 'create';
        if (page.indexOf('messages') === 0) return 'messages';
        if (page.indexOf('notification') === 0) return 'notifications';
        if (page === 'points-mall.html') return 'points-mall';
        if (page === 'creator-income.html') return 'creator-income';
        if (page.indexOf('transaction') === 0) return 'transactions';
        if (
            page.indexOf('wallet') === 0 || page.indexOf('recharge') === 0 ||
            page.indexOf('withdraw') === 0 || page.indexOf('funds-') === 0 ||
            page.indexOf('kyc-') === 0
        ) return 'wallet';
        if (page === 'profile.html' || page === 'profile-invite-center.html') return 'profile';
        if (page.indexOf('settings') === 0) return 'settings';
        return '';
    }

    function readStoredCount(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            if (raw !== null && raw !== '') {
                var n = parseInt(raw, 10);
                if (!isNaN(n) && n >= 0) return n;
            }
        } catch (e) { /* ignore */ }
        return typeof fallback === 'number' ? fallback : 0;
    }

    function getSidebarBadgeValue(ind) {
        if (!ind || !ind.badgeKey) return 0;
        if (ind.badgeKey === 'notifications') return readStoredCount(NF_UNREAD_LS, ind.defaultBadge);
        if (ind.badgeKey === 'messages') return readStoredCount(MSG_UNREAD_LS, ind.defaultBadge);
        return ind.defaultBadge || 0;
    }

    function badgeStyleAttr(variant) {
        if (variant === 'warn') return ' style="background:rgba(245,158,11,0.25);color:#FBBF24"';
        return '';
    }

    function buildIndicatorHtml(item) {
        var ind = SIDEBAR_INDICATORS[item.id];
        if (!ind) return '';
        var html = '';
        if (ind.badge != null) {
            html += '<span class="badge" data-sidebar-badge="' + item.id + '"' + badgeStyleAttr(ind.badgeVariant) + '>' + ind.badge + '</span>';
        } else if (ind.badgeKey) {
            var val = getSidebarBadgeValue(ind);
            if (val > 0) {
                html += '<span class="badge" data-sidebar-badge="' + item.id + '">' + val + '</span>';
            }
        }
        if (ind.chip && !ind.chipKey) {
            html += '<span class="chip' + (ind.chipClass ? ' ' + ind.chipClass : '') +
                '" data-sidebar-chip="' + item.id + '">' + ind.chip + '</span>';
        }
        return html;
    }

    function getCreatorIncomeChipData() {
        if (global.FLCreatorIncomeStore && global.FLCreatorIncomeStore.getSidebarChip) {
            return global.FLCreatorIncomeStore.getSidebarChip();
        }
        return null;
    }

    function applyCreatorIncomeChip(sidebar, row) {
        row = row || sidebar.querySelector('.s-item[data-nav-id="creator-income"]');
        if (!row) return;
        var chip = row.querySelector('[data-sidebar-chip="creator-income"]');
        var data = getCreatorIncomeChipData();
        if (data) {
            if (!chip) {
                chip = document.createElement('span');
                chip.className = 'chip chip--income-month';
                chip.setAttribute('data-sidebar-chip', 'creator-income');
                chip.setAttribute('tabindex', '0');
                row.appendChild(chip);
            }
            chip.textContent = data.text;
            chip.setAttribute('title', data.title);
            chip.setAttribute('aria-label', data.title);
            chip.setAttribute('data-fl-chip-tip', data.hint);
        } else if (chip) {
            chip.remove();
        }
    }

    function applySidebarIndicators(sidebar) {
        sidebar = sidebar || document.querySelector('.app-sidebar');
        if (!sidebar) return;
        Object.keys(SIDEBAR_INDICATORS).forEach(function (id) {
            var ind = SIDEBAR_INDICATORS[id];
            var row = sidebar.querySelector('.s-item[data-nav-id="' + id + '"]');
            if (!row) return;

            if (ind.badgeKey) {
                var val = getSidebarBadgeValue(ind);
                var badge = row.querySelector('[data-sidebar-badge="' + id + '"]');
                if (val > 0) {
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'badge';
                        badge.setAttribute('data-sidebar-badge', id);
                        row.appendChild(badge);
                    }
                    badge.textContent = String(val);
                } else if (badge) {
                    badge.remove();
                }
            }

            if (ind.chipKey === 'creator-income') {
                applyCreatorIncomeChip(sidebar, row);
            }
        });
    }

    function sidebarDict(code) {
        code = code || (global.FansLoopLang ? global.FansLoopLang.getLang() : 'zh-CN');
        var d = (global.FansLoopLang && global.FansLoopLang.DICT && global.FansLoopLang.DICT[code]) || {};
        var en = (global.FansLoopLang && global.FansLoopLang.DICT && global.FansLoopLang.DICT.en) || {};
        return function (key, fallback) {
            return d[key] || en[key] || fallback;
        };
    }

    function findSidebarRow(sidebar, item) {
        var row = sidebar.querySelector('.s-item[data-nav-id="' + item.id + '"]');
        if (row) return row;
        var items = sidebar.querySelectorAll('.s-item');
        for (var i = 0; i < items.length; i++) {
            var onclick = items[i].getAttribute('onclick') || '';
            if (onclick.indexOf(item.href) >= 0) return items[i];
        }
        return null;
    }

    function applySidebarI18n(code) {
        var sidebar = document.querySelector('.app-sidebar');
        if (!sidebar) return;
        var t = sidebarDict(code);
        SIDEBAR_NAV.forEach(function (group, gi) {
            var sections = sidebar.querySelectorAll('.s-section');
            if (sections[gi] && group.sectionKey) {
                sections[gi].textContent = t(group.sectionKey, group.section);
            }
            group.items.forEach(function (item) {
                var row = findSidebarRow(sidebar, item);
                if (!row) return;
                var lb = row.querySelector('.lb');
                if (lb && item.i18nKey) lb.textContent = t(item.i18nKey, item.label);
            });
        });
    }

    global.FL_applySidebarI18n = applySidebarI18n;

    document.addEventListener('fansloop-lang-change', function (e) {
        applySidebarI18n(e.detail && e.detail.code);
        applySidebarIndicators();
    });

    function buildSidebarNavHtml(activeId) {
        var t = sidebarDict();
        var html = '';
        SIDEBAR_NAV.forEach(function (group) {
            html += '<div class="s-section">' + t(group.sectionKey, group.section) + '</div>';
            group.items.forEach(function (item) {
                var cls = 's-item' + (item.id === activeId ? ' active' : '');
                html += '<div class="' + cls + '" data-nav-id="' + item.id + '" onclick="location.href=\'' + item.href + '\'">' +
                    '<span class="ic"><i class="' + item.icon + '"></i></span>' +
                    '<span class="lb">' + t(item.i18nKey, item.label) + '</span>' +
                    buildIndicatorHtml(item) +
                    '</div>';
            });
        });
        return html;
    }

    function renderUnifiedSidebarNav(sidebar) {
        if (!sidebar) return;
        var brand = sidebar.querySelector('.s-brand');
        var brandHtml = brand ? brand.outerHTML : '';
        var bottomHtml = DEFAULT_BOTTOM;
        var page = currentPageName();
        var activeId = detectActiveNavId(page);
        if (page !== 'creator-profile.html' && activeId) {
            persistNavContext(activeId);
        }
        sidebar.innerHTML = brandHtml + buildSidebarNavHtml(activeId) + bottomHtml;
        sidebar.setAttribute('data-fl-nav-unified', '1');
        applySidebarIndicators(sidebar);
        applySidebarI18n();
        if (typeof bindSidebarNotificationItems === 'function') {
            bindSidebarNotificationItems();
        }
        if (global.FLAuthUiSync && global.FLAuthUiSync.apply) {
            global.FLAuthUiSync.apply();
        }
        if (global.FL_applySidebarBottom) {
            global.FL_applySidebarBottom();
        }
        setTimeout(function () {
            if (global.MallBenefitsScenes && global.MallBenefitsScenes.applyAvatarFrameScene) {
                global.MallBenefitsScenes.applyAvatarFrameScene();
            }
        }, 0);
    }

    global.FL_renderSidebarNav = renderUnifiedSidebarNav;
    global.FL_sidebarNavConfig = SIDEBAR_NAV;
    global.FL_sidebarIndicators = SIDEBAR_INDICATORS;
    global.FL_applySidebarIndicators = applySidebarIndicators;
    global.FL_setSidebarUnread = function (key, count) {
        var ls = key === 'messages' ? MSG_UNREAD_LS : NF_UNREAD_LS;
        try {
            if (count > 0) localStorage.setItem(ls, String(count));
            else localStorage.removeItem(ls);
        } catch (e) { /* ignore */ }
        applySidebarIndicators();
    };
    global.FL_navContextProfileUrl = navContextProfileUrl;
    global.FL_persistNavContext = persistNavContext;

    window.addEventListener('fl-nf-unread-changed', function () {
        applySidebarIndicators();
    });
    window.addEventListener('fl-sidebar-indicators-changed', function () {
        applySidebarIndicators();
    });
    window.addEventListener('fl-creator-income-change', function () {
        applySidebarIndicators();
    });
    global.addEventListener('fl-auth-prototype-ready', function () {
        applySidebarIndicators();
    });

    function isCollapsed() {
        try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
    }

    function setCollapsed(on) {
        try {
            if (on) localStorage.setItem(STORAGE_KEY, '1');
            else localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
    }

    function applyState(shell, collapsed) {
        if (!shell) return;
        shell.classList.toggle('sidebar-collapsed', collapsed);
        document.documentElement.classList.remove('sidebar-collapsed-pre');
        var btn = shell.querySelector('.s-sidebar-toggle');
        if (btn) {
            btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            btn.title = collapsed ? '展开侧栏' : '收起侧栏';
            btn.setAttribute('aria-label', btn.title);
        }
    }

    function ensureToggle(shell, sidebar) {
        if (shell.querySelector('.s-sidebar-toggle')) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 's-sidebar-toggle';
        btn.setAttribute('aria-controls', 'app-sidebar');
        btn.innerHTML = '<i class="fa-solid fa-angles-left" aria-hidden="true"></i>';
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var next = !shell.classList.contains('sidebar-collapsed');
            setCollapsed(next);
            applyState(shell, next);
        });
        sidebar.appendChild(btn);
    }

    function injectSidebarBottomAssets() {
        var base = detectScriptBase().replace(/\/js-web\/$/, '');
        if (!document.querySelector('link[data-fl-sidebar-bottom-css]')) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = base + '/css-web/sidebar-bottom.css';
            link.setAttribute('data-fl-sidebar-bottom-css', '1');
            document.head.appendChild(link);
        }
    }

    function init() {
        var shell = document.querySelector('.app-shell');
        if (!shell) return;
        injectSidebarBottomAssets();
        ensureAuthPrototype(function () {
            var sidebar = shell.querySelector('.app-sidebar');
            if (!sidebar) return;
            if (!sidebar.id) sidebar.id = 'app-sidebar';
            renderUnifiedSidebarNav(sidebar);
            ensureToggle(shell, sidebar);
            applyState(shell, isCollapsed() || document.documentElement.classList.contains('sidebar-collapsed-pre'));
            if (global.FLAuthUiSync && global.FLAuthUiSync.apply) {
                global.FLAuthUiSync.apply();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    global.FL_sidebarToggle = function () {
        var shell = document.querySelector('.app-shell');
        if (!shell) return;
        var next = !shell.classList.contains('sidebar-collapsed');
        setCollapsed(next);
        applyState(shell, next);
    };

    /** Header / 侧栏「通知」入口：全局跳转未读列表 */
    var NF_UNREAD_URL = 'notifications.html?tab=unread';

    function isNotificationBellBtn(btn) {
        if (!btn || !btn.classList.contains('h-icon')) return false;
        var bell = btn.querySelector('i.fa-bell, i.fa-regular.fa-bell, i.fa-solid.fa-bell');
        if (!bell) return false;
        if (btn.querySelector('i.fa-bell-slash')) return false;
        if (btn.querySelector('i.fa-comments')) return false;
        return true;
    }

    function bindHeaderNotificationButtons() {
        document.querySelectorAll('.app-header .h-actions .h-icon').forEach(function (btn) {
            if (!isNotificationBellBtn(btn)) return;
            btn.setAttribute('title', '通知');
            if (btn.getAttribute('data-fl-nf-bound') === '1') return;
            btn.setAttribute('data-fl-nf-bound', '1');
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var page = (location.pathname.split('/').pop() || '').toLowerCase();
                if (page === 'notifications.html') {
                    window.dispatchEvent(new CustomEvent('fl-notification-focus-unread'));
                    return;
                }
                location.href = NF_UNREAD_URL;
            });
        });
    }

    function bindSidebarNotificationItems() {
        document.querySelectorAll('.app-sidebar .s-item').forEach(function (item) {
            var lb = item.querySelector('.lb');
            if (!lb || lb.textContent.trim() !== '通知') return;
            if (item.classList.contains('is-guest-lock')) return;
            item.setAttribute('onclick', "location.href='" + NF_UNREAD_URL + "'");
        });
    }

    function initNotificationEntry() {
        bindHeaderNotificationButtons();
        bindSidebarNotificationItems();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotificationEntry);
    } else {
        initNotificationEntry();
    }

    global.FL_bindNotificationEntry = initNotificationEntry;

    /** 全局加载 macOS 风格侧边通知（有 app-shell 的页面） */
    function loadMacNotificationBanner() {
        if (!document.querySelector('.app-shell')) return;
        if (document.querySelector('script[data-fl-mac-notify], script[src*="mac-notification-banner"]')) return;
        var scripts = document.getElementsByTagName('script');
        var base = '';
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src || '';
            if (src.indexOf('app-sidebar-global') >= 0) {
                base = src.replace(/\/js-web\/app-sidebar-global\.js.*$/, '');
                break;
            }
        }
        if (!base) return;
        if (!document.querySelector('link[data-fl-mac-notify-css]')) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = base + '/css-web/mac-notification-banner.css';
            link.setAttribute('data-fl-mac-notify-css', '1');
            document.head.appendChild(link);
        }
        var js = document.createElement('script');
        js.src = base + '/js-web/mac-notification-banner.js';
        js.defer = true;
        js.setAttribute('data-fl-mac-notify', '1');
        document.body.appendChild(js);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadMacNotificationBanner);
    } else {
        loadMacNotificationBanner();
    }

    /** 研发玻璃球气泡 · 全局视口内完整展示 */
    function getJsWebBase() {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src || '';
            if (src.indexOf('app-sidebar-global') >= 0) {
                return src.replace(/\/js-web\/app-sidebar-global\.js.*$/, '');
            }
        }
        return '';
    }

    function loadDevGlassViewport() {
        if (!document.querySelector('.dev-glass-wrap')) return;
        if (document.querySelector('script[data-fl-dev-glass-vp], script[src*="dev-glass-viewport"]')) return;
        var base = getJsWebBase();
        if (!base) return;
        var js = document.createElement('script');
        js.src = base + '/js-web/dev-glass-viewport.js';
        js.defer = true;
        js.setAttribute('data-fl-dev-glass-vp', '1');
        document.body.appendChild(js);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDevGlassViewport);
    } else {
        loadDevGlassViewport();
    }

    /** 积分商城权益 · 全站头像框（依赖 app-shell 页面） */
    function loadMallBenefitsScenes() {
        if (!document.querySelector('.app-shell')) return;
        if (document.querySelector('script[data-fl-mall-benefits], script[src*="mall-benefits-scenes"]')) return;
        var base = getJsWebBase();
        if (!base) return;
        function loadScenes() {
            var js = document.createElement('script');
            js.src = base + '/js-web/mall-benefits-scenes.js';
            js.onload = function () {
                setTimeout(function () {
                    if (global.MallBenefitsScenes && global.MallBenefitsScenes.applyAvatarFrameScene) {
                        global.MallBenefitsScenes.applyAvatarFrameScene();
                    }
                }, 50);
            };
            js.setAttribute('data-fl-mall-benefits', '1');
            document.body.appendChild(js);
        }
        if (global.MallVouchersStore) {
            loadScenes();
            return;
        }
        if (document.querySelector('script[src*="mall-vouchers-store"]')) {
            var wait = setInterval(function () {
                if (global.MallVouchersStore) {
                    clearInterval(wait);
                    loadScenes();
                }
            }, 50);
            setTimeout(function () { clearInterval(wait); }, 5000);
            return;
        }
        var storeJs = document.createElement('script');
        storeJs.src = base + '/js-web/mall-vouchers-store.js';
        storeJs.onload = loadScenes;
        document.body.appendChild(storeJs);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadMallBenefitsScenes);
    } else {
        loadMallBenefitsScenes();
    }

    /** 全局直播悬浮窗（站内页面切换保持） */
    var LIVE_PIP_KEY = 'fl_live_pip_state';

    function readLivePipState() {
        try {
            var raw = localStorage.getItem(LIVE_PIP_KEY) || '';
            var obj = raw ? JSON.parse(raw) : null;
            if (!obj || typeof obj !== 'object') return null;
            return obj;
        } catch (e) { return null; }
    }

    function writeLivePipState(state) {
        try {
            if (!state || !state.active) localStorage.removeItem(LIVE_PIP_KEY);
            else localStorage.setItem(LIVE_PIP_KEY, JSON.stringify(state));
        } catch (e) {}
    }

    function injectLivePipStyle() {
        if (document.getElementById('flGlobalPipStyle')) return;
        var style = document.createElement('style');
        style.id = 'flGlobalPipStyle';
        style.textContent =
            '.fl-live-pip{position:fixed;right:20px;bottom:20px;width:320px;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.18);background:#000;z-index:10090;box-shadow:0 22px 60px rgba(0,0,0,.6);display:none;}' +
            '.fl-live-pip.show{display:block;}' +
            '.fl-live-pip .hd{height:40px;padding:0 10px;background:rgba(16,18,30,.94);display:flex;align-items:center;justify-content:space-between;color:#fff;font-size:11px;font-weight:700;}' +
            '.fl-live-pip .hd .title{display:inline-flex;align-items:center;gap:6px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
            '.fl-live-pip .hd .title i{color:#ef4444;font-size:8px;}' +
            '.fl-live-pip .hd .actions{display:flex;gap:6px;}' +
            '.fl-live-pip .hd button{height:26px;padding:0 8px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;font-size:10px;font-weight:700;cursor:pointer;}' +
            '.fl-live-pip .hd button.back{background:linear-gradient(135deg,#8B5CF6,#EC4899);border:none;}' +
            '.fl-live-pip .body{aspect-ratio:16/9;position:relative;background:url("https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200") center/cover no-repeat;}' +
            '.fl-live-pip .body:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 52%,rgba(0,0,0,.66));}' +
            '.fl-live-pip .body .tx{position:absolute;left:10px;right:10px;bottom:8px;z-index:2;color:#fff;font-size:11px;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,.65);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}';
        document.head.appendChild(style);
    }

    function ensureLivePipNode() {
        var node = document.getElementById('flGlobalLivePip');
        if (node) return node;
        node = document.createElement('div');
        node.id = 'flGlobalLivePip';
        node.className = 'fl-live-pip';
        node.innerHTML =
            '<div class="hd">' +
            '  <span class="title"><i class="fa-solid fa-circle"></i><span data-pip-title>直播中</span></span>' +
            '  <div class="actions">' +
            '    <button type="button" class="back" data-pip-back><i class="fa-solid fa-up-right-and-down-left-from-center"></i> 回到页面</button>' +
            '    <button type="button" data-pip-close><i class="fa-solid fa-xmark"></i></button>' +
            '  </div>' +
            '</div>' +
            '<div class="body"><span class="tx" data-pip-tx>直播进行中</span></div>';
        document.body.appendChild(node);
        return node;
    }

    function resolveBackByRole(role) {
        return role === 'host' ? 'create-live-host.html' : 'live-detail.html';
    }

    function renderLivePip(state) {
        injectLivePipStyle();
        var node = ensureLivePipNode();
        if (!state || !state.active) {
            node.classList.remove('show');
            return;
        }
        node.classList.add('show');
        var title = state.title || '直播中';
        var role = state.role === 'host' ? 'host' : 'viewer';
        var back = state.back || resolveBackByRole(role);

        var titleEl = node.querySelector('[data-pip-title]');
        var txEl = node.querySelector('[data-pip-tx]');
        var btnBack = node.querySelector('[data-pip-back]');
        var btnClose = node.querySelector('[data-pip-close]');
        if (titleEl) titleEl.textContent = role === 'host' ? '主播端直播中' : '直播中';
        if (txEl) txEl.textContent = title;

        if (btnBack && btnBack.getAttribute('data-bound') !== '1') {
            btnBack.setAttribute('data-bound', '1');
            btnBack.addEventListener('click', function () {
                var s = readLivePipState() || {};
                location.href = s.back || resolveBackByRole(s.role);
            });
        }
        if (btnClose && btnClose.getAttribute('data-bound') !== '1') {
            btnClose.setAttribute('data-bound', '1');
            btnClose.addEventListener('click', function () {
                writeLivePipState(null);
                node.classList.remove('show');
            });
        }
    }

    function initLivePip() {
        var state = readLivePipState();
        if (state && state.active) renderLivePip(state);
    }

    global.FL_openGlobalLivePip = function (payload) {
        var state = payload || {};
        state.active = true;
        state.role = state.role === 'host' ? 'host' : 'viewer';
        state.back = state.back || resolveBackByRole(state.role);
        writeLivePipState(state);
        renderLivePip(state);
    };
    global.FL_closeGlobalLivePip = function () {
        writeLivePipState(null);
        renderLivePip(null);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLivePip);
    } else {
        initLivePip();
    }
})(typeof window !== 'undefined' ? window : this);
