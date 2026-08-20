/**
 * 创作者统一橱窗页 · 本人管理 / 访客购买 / 预览访客
 */
(function (global) {
    var activeTab = 'digital';

    function qs(sel, root) { return (root || document).querySelector(sel); }
    function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    function param(name) {
        try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; }
    }
    function toast(msg, isErr) {
        if (global.DigitalAssetPages && global.DigitalAssetPages.toast) {
            return global.DigitalAssetPages.toast(msg, isErr);
        }
        alert(msg);
    }
    function fmt(n) {
        return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function confirmAct(opts) {
        if (global.DigitalAssetCommerceModal && global.DigitalAssetCommerceModal.confirm) {
            return global.DigitalAssetCommerceModal.confirm(opts);
        }
        if (window.confirm(opts.message || opts.title)) {
            if (typeof opts.onConfirm === 'function') opts.onConfirm();
        }
    }

    function currentUserId() {
        if (global.DigitalAssetCommerceModal && global.DigitalAssetCommerceModal.currentUserId) {
            return global.DigitalAssetCommerceModal.currentUserId();
        }
        if (global.GoodfansAuth && global.GoodfansAuth.getUserId) {
            return global.GoodfansAuth.getUserId() || (global.DigitalAssetsStore && global.DigitalAssetsStore.DEMO_CREATOR);
        }
        return (global.DigitalAssetsStore && global.DigitalAssetsStore.DEMO_CREATOR) || 'demo_uid_882910';
    }

    /** 本人管理：?owner=1 且非预览 */
    function isManageMode() {
        var explicit = param('owner') === '1' || param('mine') === '1' || param('manage') === '1';
        return explicit && !isPreviewMode();
    }
    /** 预览访客：从本人橱窗点「预览访客」 */
    function isPreviewMode() {
        return param('preview') === '1';
    }
    /** 卡片/购买层是否按访客 UI 渲染（含预览） */
    function isVisitorChrome() {
        return !isManageMode();
    }
    function isOwnerMode() {
        return isManageMode();
    }

    function creatorId() {
        var Store = global.DigitalAssetsStore;
        return param('creatorId') || (Store && Store.DEMO_CREATOR) || 'demo_uid_882910';
    }
    function isSelfShowcase() {
        return creatorId() === currentUserId();
    }
    function creatorName() {
        var n = param('name');
        if (n) {
            try { return decodeURIComponent(n); } catch (e) { return n; }
        }
        var Store = global.DigitalAssetsStore;
        var cid = creatorId();
        if (Store) {
            var dig = Store.list({ creatorId: cid });
            if (dig[0] && dig[0].creatorName) return dig[0].creatorName;
        }
        return 'Luna 🌙';
    }

    function digitalList(cid) {
        var Store = global.DigitalAssetsStore;
        if (!Store) return [];
        if (isManageMode()) {
            return Store.list({ creatorId: cid }).filter(function (p) {
                return !p.removedFromShowcase && p.status !== 'draft';
            });
        }
        return Store.list({ creatorId: cid, listedOnly: true });
    }
    function affiliateList(cid) {
        var Aff = global.AffiliateShowcaseStore;
        return Aff ? Aff.listShowcase(cid) : [];
    }

    function renderStats(root, cid) {
        if (!root) return;
        var Orders = global.DigitalAssetOrdersStore;
        var Aff = global.AffiliateShowcaseStore;
        var digEarn = Orders ? Orders.sumCreatorEarnings(cid) : 0;
        var digOrders = Orders ? Orders.listOrders({ creatorId: cid }).length : 0;
        var affEarn = Aff ? Aff.sumCreatorCommissions(cid) : 0;
        var affOrders = Aff ? Aff.listCommissions({ creatorId: cid }).length : 0;
        root.innerHTML =
            '<div class="cs-stats">' +
            '<div class="cs-stat"><div class="lb">数字商品</div><div class="v">' + digitalList(cid).length + '</div><div class="sub">橱窗在架 / 管理中</div></div>' +
            '<div class="cs-stat"><div class="lb">实体选品</div><div class="v">' + affiliateList(cid).length + '</div><div class="sub">推广件数</div></div>' +
            '<div class="cs-stat cs-stat-link" role="link" tabindex="0" data-cs-earn="digital" title="查看数字资产账变">' +
            '<div class="lb">数字销售实得</div><div class="v gold">' + fmt(digEarn) + '</div><div class="sub">' + digOrders + ' 笔订单 · 查看账变</div></div>' +
            '<div class="cs-stat cs-stat-link" role="link" tabindex="0" data-cs-earn="affiliate" title="查看联盟佣金账变">' +
            '<div class="lb">联盟佣金实得</div><div class="v green">' + fmt(affEarn) + '</div><div class="sub">' + affOrders + ' 笔回传 · 查看账变</div></div>' +
            '</div>';
        qsa('[data-cs-earn]', root).forEach(function (el) {
            function go() {
                var kind = el.getAttribute('data-cs-earn');
                location.href = 'transactions.html?type=' + encodeURIComponent(kind === 'affiliate' ? 'affiliate' : 'digital');
            }
            el.addEventListener('click', go);
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
            });
        });
    }

    function digitalCard(p, manage) {
        var Store = global.DigitalAssetsStore;
        var Orders = global.DigitalAssetOrdersStore;
        var type = Store ? Store.typeLabel(p.assetType) : p.assetType;
        var left = Store ? Store.remaining(p) : null;
        var preview = isPreviewMode();
        var asVisitor = isVisitorChrome() && !preview;
        var entBuyer = asVisitor && Orders ? Orders.DEMO_BUYER : null;
        var owned = Orders && Orders.hasEntitlement(p.id, entBuyer || undefined);
        var soldout = p.status === 'sold_out';
        var delisted = p.status === 'delisted';
        var rejected = p.status === 'rejected';
        var pending = p.status === 'pending_review';
        var canBuy = !manage && !preview && p.status === 'listed' && !owned &&
            (p.supplyMode === 'unlimited' || (left !== null && left > 0));
        var supply = p.supplyMode === 'limited'
            ? ('限量 ' + p.supplyTotal + ' 份 · 剩余 ' + left)
            : ('不限个数 · 已售 ' + (p.soldCount || 0));
        var badge = soldout
            ? '<span class="badge soldout">售罄</span>'
            : (delisted
                ? '<span class="badge soldout">已下架</span>'
                : (rejected
                    ? '<span class="badge soldout">已驳回</span>'
                    : (pending
                        ? '<span class="badge">审核中</span>'
                        : '<span class="badge">' + esc(type) + '</span>')));
        if (p.pinned) badge += '<span class="badge pin">置顶</span>';

        var rejectBanner = '';
        if (manage && rejected && p.rejectReason) {
            rejectBanner = '<div class="cs-reject-banner"><i class="fa-solid fa-circle-exclamation"></i> 驳回原因：' +
                esc(p.rejectReason) + '</div>';
        } else if (manage && pending) {
            rejectBanner = '<div class="cs-pending-banner"><i class="fa-solid fa-clock"></i> 已提交审核，请耐心等待平台结果 · ' +
                (p.autoList === false ? '通过后保持下架，可手动上架' : '通过后自动上架') + '</div>';
        }

        var foot = '';
        if (manage) {
            var actions = '<button type="button" class="btn btn-sm js-cs-da-view" data-id="' + esc(p.id) + '">查看</button>';
            if (rejected) {
                actions += '<button type="button" class="btn btn-sm js-cs-da-edit" data-id="' + esc(p.id) + '">修改</button>' +
                    '<button type="button" class="btn btn-sm btn-primary js-cs-da-resubmit" data-id="' + esc(p.id) + '">重新提交</button>';
            } else if (pending) {
                actions += '<span class="chip sm">待审核</span>';
            } else {
                actions += '<button type="button" class="btn btn-sm js-cs-da-edit" data-id="' + esc(p.id) + '">编辑</button>' +
                    '<button type="button" class="btn btn-sm js-cs-da-pin" data-id="' + esc(p.id) + '">' + (p.pinned ? '取消置顶' : '置顶') + '</button>';
                if (p.status === 'listed' || p.status === 'sold_out') {
                    actions += '<button type="button" class="btn btn-sm js-cs-da-delist" data-id="' + esc(p.id) + '">下架</button>';
                } else if (delisted) {
                    if (p.forceDelisted) {
                        actions += '<span class="chip sm">运营强制下架</span>';
                    } else {
                        actions += '<button type="button" class="btn btn-sm btn-primary js-cs-da-relist" data-id="' + esc(p.id) + '">上架</button>';
                        actions += '<button type="button" class="btn btn-sm js-cs-da-remove" data-id="' + esc(p.id) + '">移除</button>';
                    }
                } else {
                    actions += '<span class="chip sm">' + esc(Store.statusLabel(p.status)) + '</span>';
                }
            }
            foot = '<div class="cs-card-foot">' + actions + '</div>';
        } else if (preview) {
            foot = '<div class="cs-card-foot">' +
                '<button type="button" class="btn btn-sm js-cs-da-view" data-id="' + esc(p.id) + '">详情</button>' +
                '<button type="button" class="btn btn-sm" disabled>预览不可购</button></div>';
        } else if (owned) {
            foot = '<div class="cs-card-foot"><button type="button" class="btn btn-sm js-cs-da-view" data-id="' + esc(p.id) + '">查看</button>' +
                '<button type="button" class="btn btn-sm" disabled>已拥有</button></div>';
        } else if (soldout) {
            foot = '<div class="cs-card-foot"><button type="button" class="btn btn-sm js-cs-da-view" data-id="' + esc(p.id) + '">查看</button>' +
                '<button type="button" class="btn btn-sm" disabled>已售罄</button></div>';
        } else {
            foot = '<div class="cs-card-foot">' +
                '<button type="button" class="btn btn-sm js-cs-da-view" data-id="' + esc(p.id) + '">详情</button>' +
                '<button type="button" class="btn btn-primary btn-sm js-cs-da-buy" data-id="' + esc(p.id) + '"' +
                (canBuy ? '' : ' disabled') + '>购买 · ' + Number(p.priceUsdt).toFixed(2) + ' USDT</button></div>';
        }

        return (
            '<article class="cs-card' + (delisted ? ' is-delisted' : '') + (rejected ? ' is-rejected' : '') + (pending ? ' is-pending' : '') + '" data-kind="digital" data-id="' + esc(p.id) + '">' +
            '<div class="cover js-cs-da-view" data-id="' + esc(p.id) + '" role="button" tabindex="0">' + badge +
            '<img src="' + esc(p.coverUrl) + '" alt="" loading="lazy"></div>' +
            '<div class="body">' +
            '<div class="type">' + esc(type) +
            (manage ? ' · ' + esc(p.id) : '') +
            (delisted ? ' · 已下架' : '') +
            (rejected ? ' · 已驳回' : '') +
            (pending ? ' · 审核中' : '') + '</div>' +
            '<h3 class="js-cs-da-view" data-id="' + esc(p.id) + '" style="cursor:pointer">' + esc(p.title) + '</h3>' +
            '<div class="meta"><span class="price">' + Number(p.priceUsdt).toFixed(2) + ' USDT</span></div>' +
            '<div class="supply">' + esc(supply) + '</div>' +
            rejectBanner +
            foot +
            '</div></article>'
        );
    }

    function affiliateCard(item, manage) {
        var p = item.product;
        if (!p) return '';
        var Catalog = global.AffiliateCatalogStore;
        var cat = Catalog ? Catalog.categoryName(p.categoryId) : p.categoryId;
        var rate = Math.round((p.commissionRate || 0) * 1000) / 10;
        var preview = isPreviewMode();
        var foot;
        if (manage) {
            foot = '<div class="cs-card-foot">' +
                '<button type="button" class="btn btn-sm js-cs-af-pin" data-id="' + esc(p.id) + '">' + (item.pinned ? '取消置顶' : '置顶') + '</button>' +
                '<button type="button" class="btn btn-sm js-cs-af-remove" data-id="' + esc(p.id) + '">移除</button></div>';
        } else if (preview && isSelfShowcase()) {
            foot = '<div class="cs-card-foot"><button type="button" class="btn btn-sm" disabled>预览不可购</button></div>';
        } else {
            foot = '<div class="cs-card-foot"><button type="button" class="btn btn-primary btn-sm js-cs-af-buy" data-id="' + esc(p.id) + '">去购买</button></div>';
        }

        return (
            '<article class="cs-card" data-kind="affiliate" data-id="' + esc(p.id) + '">' +
            '<div class="cover">' +
            '<span class="badge">' + esc(cat) + '</span>' +
            (item.pinned ? '<span class="badge pin">置顶</span>' : '') +
            '<img src="' + esc(p.imageUrl) + '" alt="" loading="lazy"></div>' +
            '<div class="body">' +
            '<div class="type">实体选品 · 佣金 ' + rate + '%</div>' +
            '<h3>' + esc(p.title) + '</h3>' +
            '<div class="meta"><span class="price green">' + esc(p.priceDisplay) + '</span></div>' +
            '<div class="supply">' + (manage ? '推广商品 · 可置顶或移除' : '外跳第三方完成支付与履约') + '</div>' +
            foot +
            '</div></article>'
        );
    }

    function reload() {
        init(true);
    }

    function openDaDetail(id) {
        var Modal = global.DigitalAssetCommerceModal;
        if (!Modal) return;
        Modal.openDetail(id, {
            ownerView: isManageMode(),
            preview: isPreviewMode() && isSelfShowcase(),
            asVisitor: isVisitorChrome() && !isPreviewMode(),
            onDone: reload
        });
    }

    function bindActions(root, cid) {
        var Modal = global.DigitalAssetCommerceModal;
        qsa('.js-cs-da-buy', root).forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (!Modal) return toast('支付模块未加载', true);
                Modal.openPurchase(btn.getAttribute('data-id'), {
                    preview: isPreviewMode() && isSelfShowcase(),
                    asVisitor: isVisitorChrome() && !isPreviewMode(),
                    onDone: reload
                });
            });
        });
        qsa('.js-cs-da-view', root).forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.stopPropagation();
                openDaDetail(el.getAttribute('data-id'));
            });
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openDaDetail(el.getAttribute('data-id'));
                }
            });
        });
        qsa('.js-cs-da-edit', root).forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (!Modal) return;
                Modal.openDetail(btn.getAttribute('data-id'), {
                    ownerView: true,
                    onDone: reload
                });
                // 打开后自动进入编辑：短延迟等 DOM
                setTimeout(function () {
                    var editBtn = document.querySelector('#daCmDetailBody [data-da-act="edit"]');
                    if (editBtn) editBtn.click();
                }, 50);
            });
        });
        qsa('.js-cs-da-pin', root).forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var res = global.DigitalAssetsStore.togglePin(btn.getAttribute('data-id'));
                if (!res.ok) return toast(res.error || '操作失败', true);
                toast(res.pinned ? '已置顶（数字商品仅可置顶 1 个）' : '已取消置顶');
                reload();
            });
        });
        qsa('.js-cs-da-delist', root).forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var id = btn.getAttribute('data-id');
                var p = global.DigitalAssetsStore.getById(id);
                confirmAct({
                    title: '确认下架',
                    message: '确定下架「' + (p && p.title || '该商品') + '」吗？下架后新访客不可购买；已进入支付确认的用户仍可完成当前订单。',
                    okText: '确认下架',
                    danger: true,
                    onConfirm: function () {
                        global.DigitalAssetsStore.delist(id);
                        toast('已下架');
                        reload();
                    }
                });
            });
        });
        qsa('.js-cs-da-relist', root).forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var id = btn.getAttribute('data-id');
                var p = global.DigitalAssetsStore.relist(id);
                var blocked = global.DigitalAssetsStore.creatorRelistBlocked(global.DigitalAssetsStore.getById(id));
                if (!p) return toast(blocked || '上架失败', true);
                toast(p.status === 'sold_out' ? '已恢复展示（售罄）' : '已重新上架');
                reload();
            });
        });
        qsa('.js-cs-da-resubmit', root).forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var id = btn.getAttribute('data-id');
                var p = global.DigitalAssetsStore.submitForReview(id);
                if (!p) return toast('提交失败', true);
                toast('已重新提交审核');
                reload();
            });
        });
        qsa('.js-cs-da-remove', root).forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var id = btn.getAttribute('data-id');
                var p = global.DigitalAssetsStore.getById(id);
                confirmAct({
                    title: '移除橱窗',
                    message: '确定将「' + (p && p.title || '该商品') + '」从橱窗移除吗？移除后不再出现在橱窗列表中。',
                    okText: '确认移除',
                    danger: true,
                    onConfirm: function () {
                        var res = global.DigitalAssetsStore.removeFromShowcase(id);
                        if (!res.ok) return toast(res.error || '移除失败', true);
                        toast('已从橱窗移除');
                        reload();
                    }
                });
            });
        });
        qsa('.js-cs-af-buy', root).forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (isPreviewMode() && isSelfShowcase()) {
                    toast('预览模式不可购买', true);
                    return;
                }
                if (global.AffiliateCommercePages) {
                    global.AffiliateCommercePages.openExternal(btn.getAttribute('data-id'), 'creator_showcase');
                    setTimeout(reload, 500);
                }
            });
        });
        qsa('.js-cs-af-pin', root).forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var res = global.AffiliateShowcaseStore.togglePin(btn.getAttribute('data-id'), cid);
                if (!res.ok) return toast(res.error || '操作失败', true);
                toast(res.pinned ? '已置顶（实体选品仅可置顶 1 个）' : '已取消置顶');
                reload();
            });
        });
        qsa('.js-cs-af-remove', root).forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var id = btn.getAttribute('data-id');
                confirmAct({
                    title: '移除选品',
                    message: '确定从橱窗移除该实体选品吗？移除后可在选品库重新加入。',
                    okText: '确认移除',
                    danger: true,
                    onConfirm: function () {
                        global.AffiliateShowcaseStore.removeFromShowcase(id, cid);
                        toast('已从橱窗移除');
                        reload();
                    }
                });
            });
        });
    }

    function renderPanel(cid, manage) {
        var root = qs('#csPanelRoot');
        if (!root) return;
        var dig = digitalList(cid);
        var aff = affiliateList(cid);
        var digCnt = qs('#csTabDigCnt');
        var affCnt = qs('#csTabAffCnt');
        if (digCnt) digCnt.textContent = String(dig.length);
        if (affCnt) affCnt.textContent = String(aff.length);

        if (activeTab === 'digital') {
            root.innerHTML = dig.length
                ? '<div class="cs-grid">' + dig.map(function (p) { return digitalCard(p, manage); }).join('') + '</div>'
                : '<div class="cs-empty">暂无数字商品' + (manage ? ' · 点击上方「创建数字商品」发布' : '') + '</div>';
        } else {
            root.innerHTML = aff.length
                ? '<div class="cs-grid">' + aff.map(function (it) { return affiliateCard(it, manage); }).join('') + '</div>'
                : '<div class="cs-empty">暂无实体选品' + (manage ? ' · 点击上方「从商品中心选品」添加' : '') + '</div>';
        }
        bindActions(root, cid);
    }

    function syncChrome(manage, name) {
        var heroTitle = qs('#csHeroTitle');
        var ownerBar = qs('#csOwnerBar');
        var stats = qs('#csStats');
        var switchBtn = qs('#csSwitchMode');
        var headerTitle = qs('#csHeaderTitle');
        var preview = isPreviewMode();
        var modeLabel = manage ? '本人管理' : (preview ? '访客预览' : '访客浏览');

        if (heroTitle) {
            heroTitle.innerHTML = esc(name) + ' · 创作者橱窗 <span class="chip' + (manage ? ' active' : '') + '" id="csModeTag">' +
                modeLabel + '</span>';
        }
        if (headerTitle) {
            headerTitle.textContent = name + ' · 橱窗' + (preview ? '（预览）' : '');
        }

        if (ownerBar) {
            ownerBar.hidden = !manage;
            ownerBar.style.display = manage ? 'flex' : 'none';
        }
        if (stats) {
            stats.hidden = !manage;
            stats.style.display = manage ? '' : 'none';
        }

        // 本人橱窗可预览访客；预览中可返回管理；纯访客不显示切换
        if (switchBtn) {
            if (manage) {
                switchBtn.style.display = '';
                switchBtn.textContent = '预览访客';
            } else if (preview && isSelfShowcase()) {
                switchBtn.style.display = '';
                switchBtn.textContent = '返回管理';
            } else {
                switchBtn.style.display = 'none';
            }
        }

        var backBtn = qs('#csBackProfile');
        if (backBtn) {
            var from = param('from');
            var backHref = 'profile.html';
            if (manage && from === 'catalog') backHref = 'affiliate-catalog.html';
            else if (manage || (preview && isSelfShowcase())) backHref = 'profile.html';
            else backHref = 'creator-profile.html';
            backBtn.onclick = function () { location.href = backHref; };
            backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> 返回';
        }

        var banner = qs('#csPreviewBanner');
        if (preview && isSelfShowcase()) {
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'csPreviewBanner';
                banner.className = 'cs-preview-banner';
                var main = qs('.app-main');
                var tabs = qs('#csTabs');
                if (main && tabs) main.insertBefore(banner, tabs);
            }
            banner.hidden = false;
            banner.innerHTML = '<i class="fa-solid fa-eye"></i> 正在预览访客视角 · 不可真实购买 · <button type="button" class="btn btn-sm btn-primary" id="csExitPreview">返回管理</button>';
            var exit = qs('#csExitPreview');
            if (exit && !exit._bound) {
                exit._bound = true;
                exit.addEventListener('click', function () {
                    var q = new URLSearchParams();
                    q.set('owner', '1');
                    q.set('name', creatorName());
                    if (activeTab === 'affiliate') q.set('tab', 'affiliate');
                    location.href = 'creator-showcase.html?' + q.toString();
                });
            }
        } else if (banner) {
            banner.hidden = true;
        }
    }

    function applyTabFromQuery() {
        var tab = (param('tab') || '').toLowerCase();
        if (tab === 'aff' || tab === 'physical') tab = 'affiliate';
        if (tab !== 'digital' && tab !== 'affiliate') return;
        activeTab = tab;
        qsa('#csTabs .tt[data-cs-tab], #csTabs .chip[data-cs-tab]').forEach(function (c) {
            var on = c.getAttribute('data-cs-tab') === tab;
            c.classList.toggle('active', on);
            c.setAttribute('aria-selected', on ? 'true' : 'false');
        });
    }

    function syncTabInUrl() {
        try {
            var u = new URL(location.href);
            if (activeTab === 'affiliate') u.searchParams.set('tab', 'affiliate');
            else u.searchParams.delete('tab');
            history.replaceState(null, '', u.pathname + u.search + u.hash);
        } catch (e) { /* ignore */ }
    }

    function bindTabs() {
        qsa('#csTabs .tt[data-cs-tab], #csTabs .chip[data-cs-tab]').forEach(function (chip) {
            chip.addEventListener('click', function () {
                activeTab = chip.getAttribute('data-cs-tab') || 'digital';
                qsa('#csTabs .tt[data-cs-tab], #csTabs .chip[data-cs-tab]').forEach(function (c) {
                    c.classList.toggle('active', c === chip);
                    c.setAttribute('aria-selected', c === chip ? 'true' : 'false');
                });
                syncTabInUrl();
                renderPanel(creatorId(), isManageMode());
            });
        });
    }

    function buildQuery(extra) {
        var q = new URLSearchParams();
        q.set('name', creatorName());
        if (activeTab === 'affiliate') q.set('tab', 'affiliate');
        Object.keys(extra || {}).forEach(function (k) {
            if (extra[k] != null && extra[k] !== '') q.set(k, extra[k]);
        });
        return 'creator-showcase.html?' + q.toString();
    }

    function init(skipToast) {
        var manage = isManageMode();
        var cid = creatorId();
        var name = creatorName();
        // 仅首次进入读 URL Tab；reload（如下架后）保持当前数字资产 / 实体选品 Tab
        if (!skipToast) applyTabFromQuery();
        syncChrome(manage, name);
        if (manage) renderStats(qs('#csStats'), cid);
        renderPanel(cid, manage);

        var tabs = qs('#csTabs');
        if (tabs && !tabs._bound) {
            tabs._bound = true;
            bindTabs();
        }
        var switchBtn = qs('#csSwitchMode');
        if (switchBtn && !switchBtn._bound) {
            switchBtn._bound = true;
            switchBtn.addEventListener('click', function () {
                if (isManageMode()) {
                    location.href = buildQuery({ preview: '1' });
                } else {
                    location.href = buildQuery({ owner: '1' });
                }
            });
        }
        var createDigBtn = qs('#csCreateDigitalBtn');
        if (createDigBtn && !createDigBtn._bound) {
            createDigBtn._bound = true;
            createDigBtn.addEventListener('click', function () {
                location.href = 'create-digital-asset.html?from=showcase';
            });
        }
        if (!skipToast && manage && param('from') === 'catalog' && activeTab === 'affiliate') {
            toast('已回到橱窗 · 实体选品');
        }

        var openId = param('open');
        if (openId && global.DigitalAssetCommerceModal && !init._opened) {
            init._opened = true;
            openDaDetail(openId);
        }
    }

    global.CreatorShowcasePage = {
        init: init,
        isOwnerMode: isOwnerMode,
        isManageMode: isManageMode,
        creatorId: creatorId,
        creatorName: creatorName
    };
})(typeof window !== 'undefined' ? window : this);
