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
    var manageRows = document.getElementById('subManageRows');
    var manageScroll = document.getElementById('subManageScroll');
    var manageSearch = document.getElementById('subManageSearch');
    var manageSummary = document.getElementById('subManageSummary');
    var cancelOverlay = document.getElementById('subCancelOverlay');
    var currentTab = 'feed';
    var cancelTargetName = '';

    var SUB_AUTO_RENEW_KEY = 'fl_sub_auto_renew_v1';
    var manageState = { search: '', page: 1, pageSize: 6, loading: false, hasMore: true };
    var subscribedCreators = [];

    var SUB_MANAGE_EXTRA = [
        { name: '东京夜跑团', av: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200', plan: '月度订阅', price: 24, expire: '2026-07-15 到期', autoRenew: true, hint: '自动续费已开启', subscribedAt: 1738000000 },
        { name: '胶片少女', av: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200', plan: '月度订阅', price: 32, expire: '2026-07-20 到期', autoRenew: true, hint: '自动续费已开启', subscribedAt: 1737000000 },
        { name: '海风日记', av: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200', plan: '月度订阅', price: 18, expire: '2026-08-05 到期', autoRenew: true, hint: '自动续费已开启', subscribedAt: 1736000000 },
        { name: '小鹿订阅', av: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', plan: '月度订阅', price: 28, expire: '2026-08-12 到期', autoRenew: true, hint: '自动续费已开启', subscribedAt: 1735000000 },
        { name: 'NovaFan', av: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', plan: '月度订阅', price: 16, expire: '2026-08-18 到期', autoRenew: false, hint: '自动续费已关闭', subscribedAt: 1734000000 },
        { name: '云端书客', av: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', plan: '月度订阅', price: 42, expire: '2026-09-01 到期', autoRenew: true, hint: '自动续费已开启', subscribedAt: 1733000000 },
        { name: '晨间咖啡', av: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', plan: '月度订阅', price: 16, expire: '2026-09-10 到期', autoRenew: true, hint: '自动续费已开启', subscribedAt: 1732000000 }
    ];

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
        manageState.search = '';
        manageState.page = 1;
        if (manageSearch) manageSearch.value = '';
        renderManageSubscriptions(true);
        if (manageSearch) manageSearch.focus();
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

    document.getElementById('btnCloseManageFt')?.addEventListener('click', closeManage);

    function loadAutoRenewMap() {
        try {
            var raw = localStorage.getItem(SUB_AUTO_RENEW_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function saveAutoRenewMap(map) {
        try { localStorage.setItem(SUB_AUTO_RENEW_KEY, JSON.stringify(map || {})); } catch (e) {}
    }

    function isAutoRenewOn(name, fallback) {
        var map = loadAutoRenewMap();
        if (Object.prototype.hasOwnProperty.call(map, name)) return !!map[name];
        return fallback !== false;
    }

    function setAutoRenewOn(name, on) {
        var map = loadAutoRenewMap();
        map[name] = !!on;
        saveAutoRenewMap(map);
    }

    function parseAvFromCard(card) {
        var img = card.querySelector('.av-wrap .img, .img');
        if (!img) return '';
        var raw = img.style.backgroundImage || getComputedStyle(img).backgroundImage || '';
        var m = raw.match(/url\(["']?([^"')]+)["']?\)/);
        return m ? m[1] : '';
    }

    function buildSubscribedCreators() {
        var byName = {};
        if (rail) {
            rail.querySelectorAll('.creator-col-item[data-creator]').forEach(function (card) {
                var name = card.getAttribute('data-creator');
                if (!name) return;
                var price = 28;
                if (name === '山野食光' || name === '极简料理') price = 18;
                if (name === '代码诗人') price = 38;
                if (name === '夜间速写') price = 22;
                var hint = '自动续费已开启';
                var warn = false;
                if (name === '夜雨听弦') {
                    hint = '3 天后到期';
                    warn = true;
                }
                byName[name] = {
                    name: name,
                    av: parseAvFromCard(card),
                    plan: '月度订阅',
                    price: price,
                    expire: '2026-07-02 到期',
                    autoRenew: name !== '代码诗人',
                    hint: hint,
                    warn: warn,
                    subscribedAt: Number(card.getAttribute('data-subscribed-at') || 0)
                };
            });
        }
        SUB_MANAGE_EXTRA.forEach(function (item) {
            if (!byName[item.name]) byName[item.name] = item;
        });
        subscribedCreators = Object.keys(byName).map(function (k) { return byName[k]; });
        subscribedCreators.sort(function (a, b) {
            return (b.subscribedAt || 0) - (a.subscribedAt || 0);
        });
        subscribedCreators.forEach(function (item) {
            item.autoRenew = isAutoRenewOn(item.name, item.autoRenew);
            if (!item.warn) {
                item.hint = item.autoRenew ? '自动续费已开启' : '自动续费已关闭';
            }
        });
        return subscribedCreators;
    }

    function getFilteredSubscriptions() {
        var q = (manageState.search || '').trim().toLowerCase();
        return subscribedCreators.filter(function (item) {
            if (!q) return true;
            return item.name.toLowerCase().indexOf(q) >= 0;
        });
    }

    function renderManageRow(item) {
        var on = item.autoRenew;
        var hintCls = item.warn ? ' warn' : '';
        var hintHtml = item.warn
            ? '<i class="fa-solid fa-triangle-exclamation"></i> ' + item.hint
            : item.hint;
        return (
            '<div class="sub-manage-row" data-name="' + escHtml(item.name) + '" data-plan="' + escHtml(item.plan) + '" data-price="' + item.price + '" data-expire="' + escHtml(item.expire) + '" data-av="url(\'' + escHtml(item.av) + '\')">' +
            '<div class="av av-sm" style="background-image:url(\'' + escHtml(item.av) + '\')"></div>' +
            '<div class="info"><div class="n">' + escHtml(item.name) + '</div><div class="h' + hintCls + '">' + hintHtml + '</div></div>' +
            '<div class="switch' + (on ? ' on' : '') + '" title="自动续订" data-auto-renew="' + (on ? '1' : '0') + '" aria-label="自动续订"></div>' +
            '<span class="price">' + item.price + '/月</span>' +
            '</div>'
        );
    }

    function escHtml(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    }

    function renderManageSubscriptions(reset) {
        if (!manageRows) return;
        if (!subscribedCreators.length) buildSubscribedCreators();

        var all = getFilteredSubscriptions();
        var end = manageState.page * manageState.pageSize;
        var slice = all.slice(0, end);
        manageState.hasMore = slice.length < all.length;

        if (reset) {
            manageRows.innerHTML = '';
            if (manageScroll) manageScroll.scrollTop = 0;
        }

        var loader = manageRows.querySelector('.sub-manage-lazy-tip');
        if (loader) loader.remove();

        if (!all.length) {
            manageRows.innerHTML = '<div class="sub-manage-empty"><i class="fa-regular fa-face-frown" style="font-size:22px;display:block;margin-bottom:8px;opacity:.5"></i>未找到匹配的订阅创作者</div>';
        } else {
            var current = manageRows.querySelectorAll('.sub-manage-row').length;
            if (reset || slice.length <= current) {
                manageRows.innerHTML = slice.map(renderManageRow).join('');
            } else {
                manageRows.insertAdjacentHTML('beforeend', slice.slice(current).map(renderManageRow).join(''));
            }
            if (manageState.hasMore) {
                manageRows.insertAdjacentHTML('beforeend', '<div class="sub-manage-lazy-tip"><i class="fa-solid fa-arrow-down"></i> 向下滚动加载更多</div>');
            }
        }

        if (manageSummary) {
            manageSummary.textContent = '共 ' + subscribedCreators.length + ' 位订阅创作者 · 当前显示 ' + slice.length + ' / ' + all.length + ' 条';
        }
    }

    function tryLoadMoreSubscriptions() {
        if (!manageScroll || manageState.loading || !manageState.hasMore) return;
        if (manageScroll.scrollTop + manageScroll.clientHeight < manageScroll.scrollHeight - 40) return;
        manageState.loading = true;
        manageState.page += 1;
        renderManageSubscriptions(false);
        manageState.loading = false;
    }

    function bindManageSubscriptions() {
        buildSubscribedCreators();

        if (manageSearch) {
            manageSearch.addEventListener('input', function () {
                manageState.search = manageSearch.value;
                manageState.page = 1;
                renderManageSubscriptions(true);
            });
        }

        if (manageScroll) {
            manageScroll.addEventListener('scroll', tryLoadMoreSubscriptions);
        }

        if (manageRows) {
            manageRows.addEventListener('click', function (e) {
                var sw = e.target.closest('.switch');
                if (sw) {
                    e.stopPropagation();
                    sw.classList.toggle('on');
                    var on = sw.classList.contains('on');
                    sw.setAttribute('data-auto-renew', on ? '1' : '0');
                    var row = sw.closest('.sub-manage-row');
                    var name = row?.getAttribute('data-name');
                    if (name) {
                        setAutoRenewOn(name, on);
                        subscribedCreators.forEach(function (item) {
                            if (item.name === name) {
                                item.autoRenew = on;
                                if (!item.warn) item.hint = on ? '自动续费已开启' : '自动续费已关闭';
                            }
                        });
                        var hint = row.querySelector('.info .h');
                        if (hint && !hint.classList.contains('warn')) {
                            hint.textContent = on ? '自动续费已开启' : '自动续费已关闭';
                        }
                    }
                    toast(on ? '已开启用户的自动续订功能' : '已关闭用户的自动续订功能');
                    return;
                }

                var row = e.target.closest('.sub-manage-row');
                if (!row || e.target.closest('button, a')) return;
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
                var detailAuto = document.getElementById('subDetailAutoRenew');
                if (detailAuto) {
                    var creator = subscribedCreators.filter(function (c) { return c.name === name; })[0];
                    var on = creator && creator.autoRenew;
                    detailAuto.textContent = on ? '已开启' : '已关闭';
                    detailAuto.style.color = on ? '#86efac' : '#fca5a5';
                }
                manageList?.classList.add('hide');
                manageDetail?.classList.add('show');
            });
        }
    }

    bindManageSubscriptions();

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
