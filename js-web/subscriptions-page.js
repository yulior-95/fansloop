/**
 * 我的订阅页 · 管理订阅 / Tab 筛选 / 左栏创作者（25%）
 */
(function () {
    var rail = document.getElementById('creatorRail');
    var feedList = document.getElementById('subFeedList');
    var feedEmpty = document.getElementById('subFeedEmpty');
    var tabs = document.querySelectorAll('.sub-tabs .tab[data-sub-tab]');
    var manageOverlay = document.getElementById('subManageOverlay');
    var manageDetail = document.getElementById('subManageDetail');
    var manageList = document.getElementById('subManageList');
    var cancelOverlay = document.getElementById('subCancelOverlay');
    var currentTab = 'feed';
    var cancelTargetName = '';

    var SUB_READ_SET_KEY = 'fl_sub_read_item_ids_v1';
    var SUB_UNREAD_COUNT_KEY = 'fl_sub_unread_counts_v1';

    function toast(msg) {
        var host = document.getElementById('subToastHost');
        if (!host) return;
        var t = document.createElement('div');
        t.className = 'sub-toast';
        t.textContent = msg;
        host.appendChild(t);
        setTimeout(function () { t.remove(); }, 2600);
    }

    function safeJsonParse(str, fallback) {
        try { return JSON.parse(str); } catch (e) { return fallback; }
    }

    function getReadSet() {
        try {
            var raw = localStorage.getItem(SUB_READ_SET_KEY) || '[]';
            var arr = safeJsonParse(raw, []);
            if (!Array.isArray(arr)) return new Set();
            return new Set(arr.filter(Boolean));
        } catch (e) {
            return new Set();
        }
    }

    function saveReadSet(set) {
        try { localStorage.setItem(SUB_READ_SET_KEY, JSON.stringify(Array.from(set))); } catch (e) {}
    }

    function getUnreadCounts() {
        var defaults = {};
        tabs.forEach(function (t) {
            var tab = t.getAttribute('data-sub-tab');
            var num = t.querySelector('.num');
            var v = Number(num?.getAttribute('data-unread-count') || 0);
            defaults[tab] = isFinite(v) ? v : 0;
        });
        try {
            var raw = localStorage.getItem(SUB_UNREAD_COUNT_KEY);
            if (!raw) return defaults;
            var obj = safeJsonParse(raw, {});
            if (!obj || typeof obj !== 'object') return defaults;
            return Object.assign({}, defaults, obj);
        } catch (e) {
            return defaults;
        }
    }

    function saveUnreadCounts(counts) {
        try { localStorage.setItem(SUB_UNREAD_COUNT_KEY, JSON.stringify(counts || {})); } catch (e) {}
    }

    function formatCount(n) {
        if (!isFinite(n)) return '0';
        if (n >= 100) return '99+';
        if (n < 0) return '0';
        return String(n);
    }

    function setTabCount(tabKey, n) {
        var el = document.querySelector('.sub-tabs .tab[data-sub-tab="' + tabKey + '"] .num');
        if (!el) return;
        el.textContent = formatCount(n);
    }

    function applyAllTabCounts(counts) {
        Object.keys(counts || {}).forEach(function (k) { setTabCount(k, Number(counts[k] || 0)); });
    }

    function tabKeyForCard(card) {
        var type = card?.getAttribute('data-sub-type') || '';
        if (type === 'post') return 'feed';
        if (type === 'live' || type === 'preview') return 'live';
        if (type === 'paid' || type === 'video') return 'paid';
        return '';
    }

    function markCardReadUI(card) {
        if (!card) return;
        card.classList.add('is-read');
        card.setAttribute('data-unread', '0');
    }

    function initUnreadReadState() {
        if (!feedList) return;
        var readSet = getReadSet();

        // 离开页面再回来：已读条目从列表消失（本次点击不立即消失）
        feedList.querySelectorAll('.sub-feed-card[data-item-id]').forEach(function (card) {
            var id = card.getAttribute('data-item-id');
            if (id && readSet.has(id)) {
                card.style.display = 'none';
                markCardReadUI(card);
            }
        });

        var counts = getUnreadCounts();
        applyAllTabCounts(counts);
    }

    function sortCreatorCol() {
        if (!rail) return;
        var items = Array.prototype.slice.call(rail.querySelectorAll('.creator-col-item'));
        items.sort(function (a, b) {
            var liveA = Number(a.getAttribute('data-live') || 0);
            var liveB = Number(b.getAttribute('data-live') || 0);
            if (liveB !== liveA) return liveB - liveA;
            return Number(b.getAttribute('data-subscribed-at') || 0) - Number(a.getAttribute('data-subscribed-at') || 0);
        });
        items.forEach(function (el) { rail.appendChild(el); });
    }

    sortCreatorCol();

    if (rail) {
        rail.querySelectorAll('.cr-card').forEach(function (card) {
            card.addEventListener('click', function () {
                rail.querySelectorAll('.creator-col-item').forEach(function (c) {
                    c.classList.remove('active');
                });
                card.classList.add('active');
                var name = card.getAttribute('data-creator') || card.querySelector('.nm')?.textContent;
                toast('查看创作者：' + (name || ''));
                var href = card.getAttribute('data-href');
                if (href) setTimeout(function () { location.href = href; }, 400);
            });
        });
    }

    function getItems() {
        return feedList ? Array.prototype.slice.call(feedList.querySelectorAll('[data-sub-type]')) : [];
    }

    function parseBgUrl(el) {
        if (!el) return '';
        var raw = '';
        if (el.style && el.style.backgroundImage) raw = el.style.backgroundImage;
        if (!raw) raw = getComputedStyle(el).backgroundImage || '';
        var m = raw.match(/url\(["']?([^"')]+)["']?\)/);
        return m ? m[1] : '';
    }

    function openPostDetailFromCard(card) {
        if (!card) return;
        if (typeof window.FL_openContentDetail !== 'function') {
            toast('详情抽屉脚本未加载');
            return;
        }
        var title = card.querySelector('.sfc-title')?.textContent?.trim() || '图文详情';
        var author = card.querySelector('.sfc-creator-name')?.textContent?.trim() || '创作者';
        var authorAv = parseBgUrl(card.querySelector('.sfc-av'));
        var cover = parseBgUrl(card.querySelector('.sfc-cover-img')) || parseBgUrl(card.querySelector('.sfc-cover-mosaic .m-cell'));
        var desc = '来自订阅动态的图文帖，支持查看完整内容、评论、点赞与打赏。';

        var likes = '0';
        var comments = '0';
        card.querySelectorAll('.sfc-stats span').forEach(function (s) {
            var txt = s.textContent || '';
            if (txt.indexOf('心') >= 0 || txt.indexOf('赞') >= 0 || txt.indexOf('❤') >= 0) likes = txt.replace(/[^\d.kK,]/g, '') || likes;
            if (txt.indexOf('评') >= 0 || txt.indexOf('讨论') >= 0) comments = txt.replace(/[^\d.kK,]/g, '') || comments;
        });
        var tips = card.getAttribute('data-tip-count') || '0';

        window.FL_openContentDetail({
            title: title,
            image: cover,
            author: author,
            authorAv: authorAv,
            desc: desc,
            likes: likes,
            comments: comments
        });

        var likeEl = document.getElementById('subCddLike');
        var cmEl = document.getElementById('subCddComment');
        var tipEl = document.getElementById('subCddTip');
        if (likeEl) likeEl.textContent = likes;
        if (cmEl) cmEl.textContent = comments;
        if (tipEl) tipEl.textContent = tips;
    }

    function markAsRead(card) {
        if (!card) return;
        var isUnread = String(card.getAttribute('data-unread') || '') === '1';
        var id = card.getAttribute('data-item-id') || '';
        var tabKey = tabKeyForCard(card);
        if (!isUnread) return;

        // 1) 点击即已读：未读数量 -1
        var counts = getUnreadCounts();
        if (tabKey) {
            counts[tabKey] = Math.max(0, Number(counts[tabKey] || 0) - 1);
            applyAllTabCounts(counts);
            saveUnreadCounts(counts);
        }

        // 2) 已读后数据仍在当前列表位置：只做 UI 置灰，不移除 DOM
        markCardReadUI(card);

        // 3) 切换到其他页面再回来才消失：记录 readSet，在下次 init 时隐藏
        if (id) {
            var set = getReadSet();
            set.add(id);
            saveReadSet(set);
        }
    }

    function bindPostDetailDrawer() {
        if (!feedList) return;
        feedList.addEventListener('click', function (e) {
            var card = e.target.closest('.sub-feed-card[data-sub-type="post"]');
            if (!card) return;
            if (e.target.closest('.sfc-footer button, .sfc-footer .a-btn, .sub-preview-book-wrap')) return;
            e.preventDefault();
            e.stopPropagation();
            markAsRead(card);
            openPostDetailFromCard(card);
        });
    }

    function applyTab(tab) {
        currentTab = tab;
        tabs.forEach(function (t) {
            t.classList.toggle('active', t.getAttribute('data-sub-tab') === tab);
        });
        var items = getItems();
        var shown = 0;
        items.forEach(function (el) {
            var type = el.getAttribute('data-sub-type');
            var show = false;
            if (tab === 'feed') show = type === 'post';
            else if (tab === 'live') show = type === 'live' || type === 'preview';
            else if (tab === 'paid') show = type === 'paid' || type === 'video';
            el.style.display = show ? '' : 'none';
            if (show) shown++;
        });
        if (feedEmpty) feedEmpty.style.display = shown ? 'none' : 'block';
    }

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            applyTab(tab.getAttribute('data-sub-tab'));
        });
    });

    document.getElementById('btnSubRefresh')?.addEventListener('click', function () {
        toast('已刷新订阅 Feed（原型）');
        applyTab(currentTab);
    });

    function openManage() {
        manageOverlay?.classList.add('show');
        manageDetail?.classList.remove('show');
        manageList?.classList.remove('hide');
    }
    function closeManage() {
        manageOverlay?.classList.remove('show');
        cancelOverlay?.classList.remove('show');
    }

    document.getElementById('btnManageSubs')?.addEventListener('click', openManage);
    document.getElementById('btnCloseManage')?.addEventListener('click', closeManage);
    manageOverlay?.addEventListener('click', function (e) {
        if (e.target === manageOverlay) closeManage();
    });

    document.querySelectorAll('.sub-manage-row').forEach(function (row) {
        row.addEventListener('click', function (e) {
            if (e.target.closest('button, .switch, a')) return;
            var name = row.getAttribute('data-name');
            var plan = row.getAttribute('data-plan');
            var price = row.getAttribute('data-price');
            var expire = row.getAttribute('data-expire');
            document.getElementById('subDetailName').textContent = name;
            document.getElementById('subDetailPlan').textContent = plan;
            document.getElementById('subDetailPrice').textContent = price + ' USDT / 月';
            document.getElementById('subDetailExpire').textContent = expire;
            document.getElementById('subDetailAv').style.backgroundImage = row.getAttribute('data-av') || '';
            var renewBtn = document.getElementById('btnDetailRenew');
            if (renewBtn) {
                renewBtn.setAttribute('data-creator', name || '');
                renewBtn.setAttribute('data-plan', price || '28');
                var avRaw = row.getAttribute('data-av') || '';
                var avUrl = avRaw.replace(/^url\(['"]?|['"]?\)$/g, '');
                if (avUrl) renewBtn.setAttribute('data-av', avUrl);
            }
            manageList?.classList.add('hide');
            manageDetail?.classList.add('show');
        });
    });

    document.getElementById('btnDetailRenew')?.addEventListener('click', function (e) {
        e.stopPropagation();
        openRenewModal({
            creator: this.getAttribute('data-creator') || document.getElementById('subDetailName')?.textContent,
            price: this.getAttribute('data-plan') || '28',
            av: this.getAttribute('data-av') || ''
        });
    });

    document.getElementById('btnManageBack')?.addEventListener('click', function () {
        manageDetail?.classList.remove('show');
        manageList?.classList.remove('hide');
    });

    function openRenewModal(opts) {
        var creator = opts.creator || '创作者';
        var price = opts.price || '28';
        var av = opts.av || '';
        var btn = document.createElement('button');
        btn.setAttribute('data-creator', creator);
        btn.setAttribute('data-plan', String(price));
        if (av) btn.setAttribute('data-av', av);
        btn.setAttribute('data-sub-mode', 'renew');
        if (window.FL_openSubscribeModal) {
            window.FL_openSubscribeModal(btn);
        } else {
            toast('续费弹窗未加载（原型）');
        }
    }

    document.getElementById('btnDetailProfile')?.addEventListener('click', function () {
        location.href = 'creator-profile.html';
    });

    document.querySelectorAll('[data-sub-cancel]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            cancelTargetName = btn.getAttribute('data-sub-cancel') || document.getElementById('subDetailName')?.textContent || '';
            document.getElementById('subCancelName').textContent = cancelTargetName;
            cancelOverlay?.classList.add('show');
        });
    });

    document.getElementById('btnCancelDismiss')?.addEventListener('click', function () {
        cancelOverlay?.classList.remove('show');
    });
    document.getElementById('btnCancelConfirm')?.addEventListener('click', function () {
        toast('已取消对「' + cancelTargetName + '」的订阅（原型）');
        cancelOverlay?.classList.remove('show');
        closeManage();
    });

    document.querySelectorAll('.sub-manage-row .switch').forEach(function (sw) {
        sw.addEventListener('click', function (e) {
            e.stopPropagation();
            sw.classList.toggle('on');
            var on = sw.classList.contains('on');
            sw.setAttribute('data-auto-renew', on ? '1' : '0');
            var row = sw.closest('.sub-manage-row');
            var hint = row?.querySelector('.info .h');
            if (hint && !hint.classList.contains('warn')) {
                hint.textContent = on ? '自动续费已开启' : '自动续费已关闭';
            }
            toast(on ? '已开启用户的自动续订功能' : '已关闭用户的自动续订功能');
        });
    });

    document.querySelectorAll('.btn-sub-renew').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            openRenewModal({
                creator: btn.getAttribute('data-creator'),
                price: btn.getAttribute('data-plan'),
                av: btn.getAttribute('data-av')
            });
        });
    });

    var SESSION_PREVIEW_KEY = 'sub_page_preview_booked';
    var previewBookBtn = document.getElementById('subPreviewBookBtn');

    function isPreviewBooked() {
        try { return sessionStorage.getItem(SESSION_PREVIEW_KEY) === '1'; } catch (e) { return false; }
    }
    function setPreviewBooked(on) {
        try {
            if (on) sessionStorage.setItem(SESSION_PREVIEW_KEY, '1');
            else sessionStorage.removeItem(SESSION_PREVIEW_KEY);
        } catch (e) {}
    }
    function syncPreviewBookBtn() {
        if (!previewBookBtn) return;
        var booked = isPreviewBooked();
        previewBookBtn.classList.toggle('is-booked', booked);
        var icon = previewBookBtn.querySelector('i');
        var lbl = previewBookBtn.querySelector('.lbl');
        if (icon) icon.className = booked ? 'fa-solid fa-bell' : 'fa-regular fa-bell';
        if (lbl) lbl.textContent = booked ? '已预约' : '预约提醒';
    }

    if (previewBookBtn) {
        syncPreviewBookBtn();
        previewBookBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (isPreviewBooked()) {
                setPreviewBooked(false);
                syncPreviewBookBtn();
                toast('已取消预约 · 可再次点击「预约提醒」');
            } else {
                setPreviewBooked(true);
                syncPreviewBookBtn();
                toast('已预约 · 开播前将通过系统消息提醒您（离开本页后状态重置）');
            }
        });
    }

    document.querySelectorAll('.sfc-footer button, .sfc-footer .a-btn, .sub-preview-book-wrap').forEach(function (el) {
        el.addEventListener('click', function (e) { e.stopPropagation(); });
    });

    initUnreadReadState();
    bindPostDetailDrawer();

    applyTab('feed');

    var params = new URLSearchParams(window.location.search);
    if (params.get('manage') === 'open') {
        setTimeout(openManage, 320);
    }
})();
