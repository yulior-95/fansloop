/**
 * 实体联盟橱窗 / 选品页交互
 */
(function (global) {
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function toast(msg, isErr) {
        if (global.DigitalAssetPages && global.DigitalAssetPages.toast) {
            return global.DigitalAssetPages.toast(msg, isErr);
        }
        alert(msg);
    }

    function catalogCardHtml(p) {
        var productId = p.id;
        var inShowcase = !!(global.AffiliateShowcaseStore && global.AffiliateShowcaseStore.hasInShowcase(
            global.AffiliateShowcaseStore.DEMO_CREATOR, productId));
        var Catalog = global.AffiliateCatalogStore;
        var cat = Catalog ? Catalog.categoryName(p.categoryId) : p.categoryId;
        var rate = Math.round((p.commissionRate || 0) * 1000) / 10;
        var tags = (p.tags || []).slice(0, 3).join(' / ');
        var foot = inShowcase
            ? '<div class="cs-card-foot"><button type="button" class="btn btn-sm" disabled>已在橱窗</button></div>'
            : '<div class="cs-card-foot"><button type="button" class="btn btn-primary btn-sm js-af-add" data-id="' + esc(productId) + '">加入橱窗</button></div>';

        return (
            '<article class="cs-card af-catalog-card" data-kind="affiliate" data-id="' + esc(productId) + '">' +
            '<div class="cover">' +
            '<span class="badge">' + esc(cat) + '</span>' +
            (inShowcase ? '<span class="badge pin">已选</span>' : '') +
            '<img src="' + esc(p.imageUrl) + '" alt="" loading="lazy"></div>' +
            '<div class="body">' +
            '<div class="type">实体选品 · 佣金 ' + rate + '%</div>' +
            '<h3>' + esc(p.title) + '</h3>' +
            '<div class="meta"><span class="price green">' + esc(p.priceDisplay) + '</span></div>' +
            '<div class="supply">' + esc(tags || '外跳第三方完成支付与履约') + '</div>' +
            foot +
            '</div></article>'
        );
    }

    function rowHtml(item, opts) {
        opts = opts || {};
        var p = item.product || item;
        var productId = p.id;
        var pinned = !!item.pinned;
        var Catalog = global.AffiliateCatalogStore;
        var cat = Catalog ? Catalog.categoryName(p.categoryId) : p.categoryId;
        var rate = Math.round((p.commissionRate || 0) * 1000) / 10;

        var actions =
            '<button type="button" class="btn btn-primary js-af-buy" data-id="' + esc(productId) + '">去购买</button>' +
            (opts.creatorManage
                ? '<button type="button" class="btn js-af-pin" data-id="' + esc(productId) + '">' + (pinned ? '取消置顶' : '置顶') + '</button>' +
                  '<button type="button" class="btn js-af-remove" data-id="' + esc(productId) + '">移除</button>'
                : '');

        return (
            '<div class="af-row" data-id="' + esc(productId) + '">' +
            '<img src="' + esc(p.imageUrl) + '" alt="">' +
            '<div>' +
            '<div class="title">' + esc(p.title) + (pinned ? '<span class="af-pin">置顶</span>' : '') + '</div>' +
            '<div class="sub">' + esc(cat) + ' · ' + esc((p.tags || []).slice(0, 3).join(' / ')) + '</div>' +
            '<div class="price">' + esc(p.priceDisplay) + '</div>' +
            '<div class="commission">联盟佣金 ' + rate + '% · 外跳第三方成交</div>' +
            '</div>' +
            '<div class="actions">' + actions + '</div>' +
            '</div>'
        );
    }

    function renderShowcaseList(list, opts) {
        opts = opts || {};
        if (!list || !list.length) {
            return '<div class="af-empty">橱窗暂无商品 · <a href="affiliate-catalog.html" style="color:#38BDF8">去选品库添加</a></div>';
        }
        if (opts.cards) {
            return '<div class="cs-grid">' + list.map(function (it) {
                var p = it.product;
                if (!p) return '';
                var Catalog = global.AffiliateCatalogStore;
                var cat = Catalog ? Catalog.categoryName(p.categoryId) : p.categoryId;
                var rate = Math.round((p.commissionRate || 0) * 1000) / 10;
                var foot = opts.creatorManage
                    ? ('<div class="cs-card-foot">' +
                        '<button type="button" class="btn btn-sm js-af-pin" data-id="' + esc(p.id) + '">' + (it.pinned ? '取消置顶' : '置顶') + '</button>' +
                        '<button type="button" class="btn btn-sm js-af-remove" data-id="' + esc(p.id) + '">移除</button></div>')
                    : ('<div class="cs-card-foot"><button type="button" class="btn btn-primary btn-sm js-af-buy" data-id="' + esc(p.id) + '">去购买</button></div>');
                return (
                    '<article class="cs-card" data-kind="affiliate" data-id="' + esc(p.id) + '">' +
                    '<div class="cover"><span class="badge">' + esc(cat) + '</span>' +
                    (it.pinned ? '<span class="badge pin">置顶</span>' : '') +
                    '<img src="' + esc(p.imageUrl) + '" alt="" loading="lazy"></div>' +
                    '<div class="body"><div class="type">实体选品 · 佣金 ' + rate + '%</div>' +
                    '<h3>' + esc(p.title) + '</h3>' +
                    '<div class="meta"><span class="price green">' + esc(p.priceDisplay) + '</span></div>' +
                    '<div class="supply">外跳第三方完成支付与履约</div>' + foot +
                    '</div></article>'
                );
            }).join('') + '</div>';
        }
        return '<div class="af-list">' + list.map(function (it) {
            return rowHtml(it, { mode: 'showcase', creatorManage: !!opts.creatorManage, compact: opts.compact });
        }).join('') + '</div>';
    }

    function renderCatalogList(products) {
        if (!products.length) return '<div class="af-empty">暂无匹配商品</div>';
        return '<div class="cs-grid af-catalog-grid">' + products.map(catalogCardHtml).join('') + '</div>';
    }

    function openExternal(productId, source) {
        var Aff = global.AffiliateShowcaseStore;
        if (!Aff) return;
        var res = Aff.recordClickAndMaybeConvert(productId, {
            source: source || 'showcase',
            simulateConvert: true
        });
        if (!res.ok) {
            toast(res.error || '跳转失败', true);
            return;
        }
        var msg = '已记录推广点击';
        if (res.commission) {
            msg += ' · 模拟成交佣金创作者实得 ' + Number(res.commission.creatorShare).toFixed(2) + ' USDT';
        }
        toast(msg);
        setTimeout(function () {
            window.open(res.affiliateUrl, '_blank', 'noopener');
        }, 400);
    }

    function bindShowcaseActions(root) {
        root = root || document;
        root.querySelectorAll('.js-af-buy').forEach(function (btn) {
            btn.addEventListener('click', function () {
                openExternal(btn.getAttribute('data-id'), 'showcase');
            });
        });
        root.querySelectorAll('.js-af-pin').forEach(function (btn) {
            btn.addEventListener('click', function () {
                global.AffiliateShowcaseStore.togglePin(btn.getAttribute('data-id'));
                toast('已更新置顶');
                if (typeof global.__afReloadShowcase === 'function') global.__afReloadShowcase();
            });
        });
        root.querySelectorAll('.js-af-remove').forEach(function (btn) {
            btn.addEventListener('click', function () {
                global.AffiliateShowcaseStore.removeFromShowcase(btn.getAttribute('data-id'));
                toast('已从橱窗移除');
                if (typeof global.__afReloadShowcase === 'function') global.__afReloadShowcase();
            });
        });
        root.querySelectorAll('.js-af-add').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var res = global.AffiliateShowcaseStore.addToShowcase(btn.getAttribute('data-id'));
                if (!res.ok) return toast(res.error || '添加失败', true);
                toast('已加入个人橱窗');
                if (typeof global.__afReloadCatalog === 'function') global.__afReloadCatalog();
            });
        });
    }

    function initCatalogPage() {
        var Catalog = global.AffiliateCatalogStore;
        var root = document.getElementById('afCatalogRoot');
        var catSel = document.getElementById('afCatFilter');
        var qInput = document.getElementById('afSearch');
        if (!root || !Catalog) return;

        if (catSel) {
            catSel.innerHTML = '<option value="">全部分类</option>' +
                Catalog.listCategories().map(function (c) {
                    return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>';
                }).join('');
        }

        function reload() {
            var products = Catalog.listProducts({
                enabledOnly: true,
                categoryId: catSel && catSel.value ? catSel.value : '',
                q: qInput ? qInput.value.trim() : ''
            });
            root.innerHTML = renderCatalogList(products);
            bindShowcaseActions(root);
        }
        global.__afReloadCatalog = reload;
        if (catSel) catSel.addEventListener('change', reload);
        if (qInput) qInput.addEventListener('input', reload);
        reload();
    }

    function initShowcasePage() {
        var Aff = global.AffiliateShowcaseStore;
        var root = document.getElementById('afShowcaseRoot');
        if (!root || !Aff) return;
        var manage = /[?&]manage=1/.test(location.search);
        function reload() {
            var list = Aff.listShowcase(Aff.DEMO_CREATOR);
            root.innerHTML = renderShowcaseList(list, { creatorManage: manage });
            bindShowcaseActions(root);
        }
        global.__afReloadShowcase = reload;
        reload();
    }

    global.AffiliateCommercePages = {
        renderShowcaseList: renderShowcaseList,
        renderCatalogList: renderCatalogList,
        bindShowcaseActions: bindShowcaseActions,
        initCatalogPage: initCatalogPage,
        initShowcasePage: initShowcasePage,
        openExternal: openExternal,
        toast: toast
    };
})(typeof window !== 'undefined' ? window : this);
