/**
 * 我的订阅页 · 管理订阅弹层 / Tab 筛选 / 创作者横滑
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

    function toast(msg) {
        var host = document.getElementById('subToastHost');
        if (!host) return;
        var t = document.createElement('div');
        t.className = 'sub-toast';
        t.textContent = msg;
        host.appendChild(t);
        setTimeout(function () { t.remove(); }, 2600);
    }

    /* 横滑：滚轮纵向 → 横向 */
    if (rail) {
        rail.addEventListener('wheel', function (e) {
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            e.preventDefault();
            rail.scrollLeft += e.deltaY;
        }, { passive: false });

        rail.querySelectorAll('.cr-card').forEach(function (card) {
            card.addEventListener('click', function () {
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
            if (tab === 'feed') show = type === 'post' || type === 'paid' || type === 'preview';
            else if (tab === 'live') show = type === 'live';
            else if (tab === 'paid') show = type === 'paid';
            else if (tab === 'video') show = type === 'video';
            else if (tab === 'latest') show = true;
            el.style.display = show ? '' : 'none';
            if (show) shown++;
        });
        if (tab === 'latest') {
            shown = items.length;
            items.sort(function (a, b) {
                return Number(b.getAttribute('data-sort') || 0) - Number(a.getAttribute('data-sort') || 0);
            });
            items.forEach(function (el) { feedList.appendChild(el); });
        }
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

    /* 管理订阅 */
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
            manageList?.classList.add('hide');
            manageDetail?.classList.add('show');
        });
    });

    document.getElementById('btnManageBack')?.addEventListener('click', function () {
        manageDetail?.classList.remove('show');
        manageList?.classList.remove('hide');
    });

    document.getElementById('btnDetailRenew')?.addEventListener('click', function () {
        toast('续费成功 · 订阅已延长 30 天（原型）');
        closeManage();
    });

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

    document.getElementById('btnBatchRenew')?.addEventListener('click', function () {
        toast('已为 3 位即将到期创作者完成续费（原型）');
        closeManage();
    });

    document.querySelectorAll('.sub-manage-row .switch').forEach(function (sw) {
        sw.addEventListener('click', function (e) {
            e.stopPropagation();
            sw.classList.toggle('on');
            var row = sw.closest('.sub-manage-row');
            toast((sw.classList.contains('on') ? '已开启' : '已关闭') + ' · ' + (row?.getAttribute('data-name') || '') + ' 开播提醒');
        });
    });

    document.querySelectorAll('.expire-row button').forEach(function (btn) {
        if (btn.textContent.trim() === '续费') {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                openManage();
            });
        }
    });

    /* 订阅页 · 直播预告「预约/已预约」切换（仅 session，离页清除） */
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

    applyTab('feed');
})();
