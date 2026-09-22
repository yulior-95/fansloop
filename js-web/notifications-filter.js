/**
 * 通知中心 · 分类 Tab 筛选 / 未读计数 / 打赏事件同步
 */
(function () {
    var typeMap = {
        't-tip': 'income',
        't-comment': 'interaction',
        't-like': 'interaction',
        't-sub': 'subscription',
        't-mention': 'interaction',
        't-system': 'system',
        't-live': 'live',
        't-preview': 'live',
        't-expiry': 'expiry',
        't-review': 'review'
    };
    var filterHost = document.getElementById('nfFilter');
    if (!filterHost) return;

    var allItems = [];

    function refreshItems() {
        allItems = Array.prototype.slice.call(document.querySelectorAll('.nf-list .nf-item'));
    }

    refreshItems();

    function actorLabel(role) {
        var key = role === 'creator' ? 'role_creator'
            : role === 'subscriber' ? 'role_subscriber'
            : role === 'platform' ? 'role_platform' : 'role_member';
        if (window.FLI18n && window.FLI18n.t) {
            var localized = window.FLI18n.t(window.FLI18n.getLangCode(), key);
            if (localized) return localized;
        }
        return role === 'creator' ? '创作者'
            : role === 'subscriber' ? '订阅者'
            : role === 'platform' ? '平台' : '用户';
    }

    function applyActorTags() {
        allItems.forEach(function (item) {
            var role = item.getAttribute('data-actor-role');
            if (!role) return;
            var name = item.querySelector('.nf-text b');
            if (!name || (name.nextElementSibling && name.nextElementSibling.classList.contains('nf-actor-tag'))) return;
            var tag = document.createElement('span');
            tag.className = 'nf-actor-tag ' + role;
            tag.textContent = actorLabel(role);
            name.insertAdjacentElement('afterend', tag);
        });
    }

    function resolveType(item) {
        var explicit = item.getAttribute('data-nf-type');
        if (explicit) return explicit;
        var ic = item.querySelector('.nf-ic');
        if (!ic) return 'interaction';
        var key;
        for (key in typeMap) {
            if (ic.classList.contains(key)) return typeMap[key];
        }
        return 'interaction';
    }

    function updateTypeCounts() {
        var incomeCount = document.getElementById('nfCntIncome');
        if (incomeCount) {
            incomeCount.textContent = String(allItems.filter(function (item) {
                return resolveType(item) === 'income';
            }).length);
        }
        var reviewCount = document.getElementById('nfCntReview');
        if (reviewCount) {
            reviewCount.textContent = String(allItems.filter(function (item) {
                return resolveType(item) === 'review';
            }).length);
        }
        var liveCount = document.getElementById('nfCntLive');
        if (liveCount) {
            liveCount.textContent = String(allItems.filter(function (item) {
                return resolveType(item) === 'live';
            }).length);
        }
    }

    function updateUnreadCount() {
        var unread = allItems.filter(function (x) { return x.classList.contains('unread'); }).length;
        var bulk = document.getElementById('nfBulkUnreadCount');
        var chip = document.getElementById('nfCntUnread');
        if (bulk) bulk.textContent = String(unread);
        if (chip) chip.textContent = String(unread);
        if (window.FL_setSidebarUnread) {
            window.FL_setSidebarUnread('notifications', unread);
        } else {
            try {
                if (unread > 0) localStorage.setItem('fl_nf_unread_count', String(unread));
                else localStorage.removeItem('fl_nf_unread_count');
            } catch (e) { /* ignore */ }
            window.dispatchEvent(new CustomEvent('fl-nf-unread-changed'));
        }
    }

    function tipContextLabel(context) {
        return context === 'live' ? '直播打赏' : context === 'message' ? '私信打赏' : context === 'profile' ? '主页打赏' : '动态打赏';
    }

    function appendTipEvent(event) {
        if (!event || !event.id || !event.amount) return null;
        if (document.querySelector('.nf-item[data-tip-event-id="' + event.id + '"]')) return null;
        var day = document.querySelector('.nf-day[data-day="today"]');
        if (!day) return null;
        var item = document.createElement('div');
        item.className = 'nf-item unread';
        item.setAttribute('data-nf-type', 'income');
        item.setAttribute('data-tip-event-id', event.id);
        if (event.context === 'profile') item.setAttribute('data-nf-tip-context', 'profile');
        var icon = document.createElement('div');
        icon.className = 'nf-ic t-tip';
        icon.innerHTML = '<i class="fa-solid fa-gift"></i>';
        var body = document.createElement('div');
        body.className = 'nf-body';
        var text = document.createElement('div');
        text.className = 'nf-text';
        var sender = document.createElement('b');
        sender.textContent = event.sender || '匿名用户';
        var amount = document.createElement('span');
        amount.className = 'amt';
        amount.textContent = '+' + window.FLTipEvents.formatAmount(event.amount) + ' USDT';
        if (event.context === 'profile') {
            text.append(
                sender,
                document.createTextNode(' 在你的 '),
                (function () {
                    var strong = document.createElement('span');
                    strong.style.fontWeight = '700';
                    strong.textContent = '创作者主页';
                    return strong;
                })(),
                document.createTextNode(' 直接打赏了 '),
                amount
            );
        } else {
            text.append(sender, document.createTextNode(' 给你打赏了「' + (event.gift || '心意') + '」 '), amount);
        }
        var meta = document.createElement('div');
        meta.className = 'nf-meta';
        var metaContext = event.context === 'profile'
            ? '创作者主页<span class="dot"></span><span><i class="fa-solid fa-user"></i> 主页打赏</span>'
            : tipContextLabel(event.context);
        meta.innerHTML = '<span><i class="fa-regular fa-clock"></i> 刚刚</span><span class="dot"></span><span>' + metaContext + '</span>';
        body.append(text, meta);
        item.append(icon, body);
        day.parentNode.insertBefore(item, day.nextSibling);
        item.addEventListener('click', function () {
            if (!item.classList.contains('unread')) return;
            item.classList.remove('unread');
            updateUnreadCount();
            var active = filterHost.querySelector('.ck.active');
            if (active && active.getAttribute('data-tab') === 'unread') applyTab('unread');
        });
        return item;
    }

    function syncTipEvents() {
        if (!window.FLTipEvents) return;
        window.FLTipEvents.getAll().forEach(appendTipEvent);
        var total = document.getElementById('nfTipTotal');
        if (total) {
            var base = Number(total.getAttribute('data-base-tips') || 0);
            var extra = window.FLTipEvents.getAll().reduce(function (sum, event) {
                return sum + (Number(event.amount) || 0);
            }, 0);
            total.textContent = (base + extra).toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' USDT';
        }
        refreshItems();
        applyActorTags();
        updateTypeCounts();
        updateUnreadCount();
    }

    function applyTab(tab) {
        filterHost.querySelectorAll('.ck').forEach(function (ck) {
            ck.classList.toggle('active', ck.getAttribute('data-tab') === tab);
        });
        allItems.forEach(function (item) {
            var type = resolveType(item);
            var show = tab === 'all'
                || (tab === 'unread' && item.classList.contains('unread'))
                || (tab === 'expiry' && item.id === 'nfLivePreviewRemind')
                || type === tab;
            item.style.display = show ? '' : 'none';
        });
    }

    filterHost.addEventListener('click', function (e) {
        var ck = e.target.closest('.ck[data-tab]');
        if (!ck) return;
        applyTab(ck.getAttribute('data-tab'));
    });

    allItems.forEach(function (item) {
        item.addEventListener('click', function () {
            if (!item.classList.contains('unread')) return;
            item.classList.remove('unread');
            updateUnreadCount();
            var active = filterHost.querySelector('.ck.active');
            if (active && active.getAttribute('data-tab') === 'unread') applyTab('unread');
        });
    });

    function markAllRead() {
        refreshItems();
        allItems.forEach(function (x) { x.classList.remove('unread'); });
        updateUnreadCount();
        var active = filterHost.querySelector('.ck.active');
        if (active && active.getAttribute('data-tab') === 'unread') applyTab('unread');
        if (window.FL_nfToast) window.FL_nfToast('已全部标记为已读', 'ok');
    }

    document.getElementById('nfMarkAllRead')?.addEventListener('click', function (e) {
        e.preventDefault();
        markAllRead();
    });
    document.getElementById('btnMarkAllReadTop')?.addEventListener('click', markAllRead);

    window.addEventListener('fl-nf-unread-changed', function () {
        refreshItems();
        updateUnreadCount();
    });

    updateTypeCounts();
    updateUnreadCount();
    syncTipEvents();
    applyActorTags();
    window.addEventListener('fl-tip-sent', syncTipEvents);

    var q = new URLSearchParams(location.search);
    applyTab(q.get('tab') || 'unread');
    window.addEventListener('fl-notification-focus-unread', function () {
        applyTab('unread');
    });

    window.FLNotificationsFilter = { applyTab: applyTab, refresh: refreshItems };
})();
