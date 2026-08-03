/**
 * 统一 App 侧栏菜单（与 profile / wallet 等主场景一致）
 * 在 body 上设置 data-fl-standard-sidebar="1" 且 data-fl-nav="profile|home|…" 启用
 */
(function (global) {
    var ITEMS = [
        { section: '主导航', rows: [
            { key: 'home', href: 'home.html', icon: 'fa-solid fa-house', label: '首页' },
            { key: 'subscriptions', href: 'subscriptions.html', icon: 'fa-solid fa-crown', label: '订阅' },
            { key: 'discover', href: 'discover.html', icon: 'fa-solid fa-compass', label: '发现' },
            { key: 'create', href: 'create.html', icon: 'fa-solid fa-pen-to-square', label: '创建内容' }
        ]},
        { section: '互动', rows: [
            { key: 'messages', href: 'messages.html', icon: 'fa-regular fa-comments', label: '消息', badge: '8' },
            { key: 'notifications', href: 'notifications.html?tab=unread', icon: 'fa-regular fa-bell', label: '通知', badge: '12' }
        ]},
        { section: '资产', rows: [
            { key: 'wallet', href: 'wallet.html', icon: 'fa-solid fa-wallet', label: '钱包' },
            { key: 'creator-income', href: 'creator-income.html', icon: 'fa-solid fa-coins', label: '创作者收入' },
            { key: 'points-mall', href: 'points-mall.html', icon: 'fa-solid fa-store', label: '积分商城' },
            { key: 'transactions', href: 'transactions.html', icon: 'fa-solid fa-list-ul', label: '账变记录' }
        ]},
        { section: '个人', rows: [
            { key: 'profile', href: 'profile.html', icon: 'fa-regular fa-user', label: '我的主页' },
            { key: 'settings', href: 'settings.html', icon: 'fa-solid fa-gear', label: '设置' }
        ]}
    ];

    var AVATAR = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80';

    function detectNavKey() {
        var file = (location.pathname.split('/').pop() || '').replace(/\.html.*/, '.html');
        if (!file || file === 'profile.html') return 'profile';
        if (file.indexOf('settings') === 0) return 'settings';
        if (file === 'home.html') return 'home';
        if (file === 'subscriptions.html') return 'subscriptions';
        if (file === 'discover.html') return 'discover';
        if (file === 'create.html') return 'create';
        if (file === 'messages.html' || file.indexOf('messages-') === 0) return 'messages';
        if (file.indexOf('notification') === 0) return 'notifications';
        if (file === 'wallet.html' || file.indexOf('wallet-') === 0) return 'wallet';
        if (file === 'creator-income.html') return 'creator-income';
        if (file === 'points-mall.html') return 'points-mall';
        if (file.indexOf('transaction') === 0) return 'transactions';
        return '';
    }

    function render(active) {
        var html = '<div class="s-brand"><div class="logo"><i class="fa-solid fa-infinity"></i></div>' +
            '<div class="name">GOODFANS<span>Web3 Creator</span></div></div>';
        ITEMS.forEach(function (grp) {
            html += '<div class="s-section">' + grp.section + '</div>';
            grp.rows.forEach(function (r) {
                var cls = 's-item' + (r.key === active ? ' active' : '');
                html += '<div class="' + cls + '" onclick="location.href=\'' + r.href + '\'">' +
                    '<span class="ic"><i class="' + r.icon + '"></i></span><span class="lb">' + r.label + '</span>';
                if (r.badge) html += '<span class="badge">' + r.badge + '</span>';
                if (r.chip) html += '<span class="chip">' + r.chip + '</span>';
                html += '</div>';
            });
        });
        html += '<div class="s-bottom"><div class="s-user">' +
            '<div class="av" style="background-image:url(\'' + AVATAR + '\')"></div>' +
            '<div class="info"><div class="n">Luna 🌙</div><div class="e">Creator</div></div></div></div>';
        return html;
    }

    function apply() {
        if (document.body.getAttribute('data-fl-standard-sidebar') !== '1') return;
        var shell = document.querySelector('.app-shell');
        if (!shell) return;
        var sidebar = shell.querySelector('.app-sidebar');
        if (!sidebar) return;
        var active = document.body.getAttribute('data-fl-nav') || detectNavKey();
        sidebar.id = 'app-sidebar';
        sidebar.innerHTML = render(active);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply);
    } else {
        apply();
    }

    global.FL_renderStandardSidebar = apply;
})(typeof window !== 'undefined' ? window : this);
