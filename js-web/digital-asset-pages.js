/**
 * 数字资产页通用渲染 / 交互
 */
(function (global) {
    function qs(sel, root) { return (root || document).querySelector(sel); }
    function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

    function toast(msg, isErr) {
        var el = qs('#daToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'daToast';
            el.className = 'da-toast';
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.className = 'da-toast show' + (isErr ? ' err' : '');
        clearTimeout(el._t);
        el._t = setTimeout(function () { el.classList.remove('show'); }, 2600);
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function supplyHtml(p) {
        var Store = global.DigitalAssetsStore;
        if (!p || p.supplyMode !== 'limited') {
            return '<div class="supply">无限发行 · 已售 ' + (p.soldCount || 0) + '</div>';
        }
        var left = Store.remaining(p);
        var pct = p.supplyTotal ? Math.min(100, Math.round((p.soldCount / p.supplyTotal) * 100)) : 0;
        return '<div class="supply">限量 ' + p.supplyTotal + ' · 已售 ' + p.soldCount + ' · 剩余 ' + left +
            '<div class="bar"><i style="width:' + pct + '%"></i></div></div>';
    }

    function cardHtml(p) {
        var Store = global.DigitalAssetsStore;
        var soldout = p.status === 'sold_out';
        var badge = soldout
            ? '<span class="badge soldout">售罄</span>'
            : '<span class="badge">' + esc(Store.typeLabel(p.assetType)) + '</span>';
        return (
            '<article class="da-card" data-id="' + esc(p.id) + '" role="link" tabindex="0">' +
            '<div class="cover">' + badge + '<img src="' + esc(p.coverUrl) + '" alt=""></div>' +
            '<div class="body">' +
            '<div class="type">' + esc(Store.typeLabel(p.assetType)) + '</div>' +
            '<h3>' + esc(p.title) + '</h3>' +
            '<div class="meta"><span class="price">' + Number(p.priceUsdt).toFixed(2) + ' USDT</span>' +
            '<span>' + esc(p.creatorName || '') + '</span></div>' +
            supplyHtml(p) +
            '</div></article>'
        );
    }

    function bindCards(root) {
        qsa('.da-card', root).forEach(function (card) {
            function go() {
                var id = card.getAttribute('data-id');
                if (global.DigitalAssetCommerceModal) {
                    var p = global.DigitalAssetsStore && global.DigitalAssetsStore.getById(id);
                    var own = global.DigitalAssetCommerceModal.isOwnProduct && global.DigitalAssetCommerceModal.isOwnProduct(p);
                    global.DigitalAssetCommerceModal.openDetail(id, {
                        ownerView: !!own,
                        onDone: function () {
                            if (typeof global.__daReloadStore === 'function') global.__daReloadStore();
                        }
                    });
                    return;
                }
                location.href = 'digital-asset-detail.html?id=' + encodeURIComponent(id);
            }
            card.addEventListener('click', go);
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
            });
        });
    }

    function renderStoreGrid(container, filter) {
        var Store = global.DigitalAssetsStore;
        if (!container || !Store) return;
        var list = Store.list(filter || { listedOnly: true });
        if (!list.length) {
            container.innerHTML = '<div class="da-empty">暂无上架数字资产</div>';
            return;
        }
        container.innerHTML = '<div class="da-grid">' + list.map(cardHtml).join('') + '</div>';
        bindCards(container);
    }

    function param(name) {
        try {
            return new URLSearchParams(location.search).get(name);
        } catch (e) {
            return null;
        }
    }

    function initDetailPage() {
        var id = param('id');
        var from = param('from') || '';
        if (!id) {
            var root = qs('#daDetailRoot');
            if (root) root.innerHTML = '<div class="da-empty">商品不存在或已删除</div>';
            return;
        }
        // 详情改为弹窗：回跳到来源页并自动打开
        var target;
        if (from === 'showcase' || from === 'creator-showcase') {
            target = 'creator-showcase.html?open=' + encodeURIComponent(id);
            var name = param('name');
            var owner = param('owner');
            if (name) target += '&name=' + encodeURIComponent(name);
            if (owner === '1') target += '&owner=1';
        } else if (from === 'my') {
            target = 'my-digital-assets.html?open=' + encodeURIComponent(id);
        } else {
            target = 'digital-asset-store.html?open=' + encodeURIComponent(id);
        }
        location.replace(target);
    }

    function initCreatePage() {
        var Store = global.DigitalAssetsStore;
        var form = qs('#daCreateForm');
        if (!form || !Store) return;

        var typeSel = qs('#daAssetType');
        if (typeSel) {
            typeSel.innerHTML = Store.ASSET_TYPES.map(function (t) {
                return '<option value="' + t.id + '">' + t.label + '</option>';
            }).join('');
        }

        function collect() {
            var mode = qs('#daSupplyMode').value;
            return {
                title: qs('#daTitle').value.trim(),
                description: qs('#daDesc').value.trim(),
                coverUrl: qs('#daCover').value.trim() || 'https://images.unsplash.com/photo-1727722158074-b7916daf6af4?w=800&q=80',
                assetType: qs('#daAssetType').value,
                contentFiles: [qs('#daContent').value.trim() || 'https://example.com/asset.bin'],
                priceUsdt: parseFloat(qs('#daPrice').value) || 0,
                supplyMode: mode,
                supplyTotal: mode === 'limited' ? (parseInt(qs('#daSupplyTotal').value, 10) || 100) : 0,
                soldCount: 0
            };
        }

        function validate(data) {
            if (!data.title) return '请填写商品名称';
            if (data.priceUsdt <= 0) return '请设置有效价格';
            if (data.supplyMode === 'limited' && data.supplyTotal < 1) return '限量发行数量至少为 1';
            return null;
        }

        qs('#daSupplyMode').addEventListener('change', function () {
            qs('#daSupplyTotalWrap').style.display = this.value === 'limited' ? '' : 'none';
        });

        qs('#btnDaSaveDraft').addEventListener('click', function () {
            var data = collect();
            var err = validate(data);
            if (err) return toast(err, true);
            var p = Store.create(Object.assign(data, { status: 'draft' }));
            toast('草稿已保存');
            setTimeout(function () { location.href = 'digital-asset-detail.html?id=' + encodeURIComponent(p.id); }, 700);
        });

        qs('#btnDaSubmit').addEventListener('click', function () {
            var data = collect();
            var err = validate(data);
            if (err) return toast(err, true);
            var p = Store.create(Object.assign(data, { status: 'pending_review' }));
            toast('已提交审核');
            setTimeout(function () { location.href = 'digital-asset-store.html?mine=1'; }, 700);
        });
    }

    function initMyAssetsPage() {
        var Orders = global.DigitalAssetOrdersStore;
        var Store = global.DigitalAssetsStore;
        var root = qs('#daMyAssets');
        if (!root || !Orders) return;
        var list = Orders.listEntitlements();
        if (!list.length) {
            root.innerHTML = '<div class="da-empty">还没有数字资产 · <a href="digital-asset-store.html" style="color:#C084FC">去 Creator Store 逛逛</a></div>';
            return;
        }
        root.innerHTML = '<div class="da-ent-list">' + list.map(function (e) {
            return (
                '<div class="da-ent-item">' +
                '<img src="' + esc(e.coverUrl) + '" alt="">' +
                '<div class="info"><h3>' + esc(e.productTitle) + '</h3>' +
                '<div class="sub">' + esc(Store ? Store.typeLabel(e.assetType) : e.assetType) +
                ' · ' + esc(e.creatorName) + ' · 获得于 ' + esc(e.grantedAt) + '</div></div>' +
                '<a class="btn btn-secondary btn-sm" href="digital-asset-detail.html?id=' + encodeURIComponent(e.productId) + '">查看</a>' +
                '</div>'
            );
        }).join('') + '</div>';
    }

    function initCreatorManageList(container) {
        var Store = global.DigitalAssetsStore;
        if (!container || !Store) return;
        var list = Store.list({ creatorId: Store.DEMO_CREATOR });
        if (!list.length) {
            container.innerHTML = '<div class="da-empty">尚未创建数字资产</div>';
            return;
        }
        container.innerHTML = '<div class="da-grid">' + list.map(function (p) {
            return cardHtml(p).replace('</div></article>',
                '<div class="supply" style="margin-top:8px">状态：' + esc(Store.statusLabel(p.status)) + '</div></div></article>');
        }).join('') + '</div>';
        bindCards(container);
    }

    global.DigitalAssetPages = {
        toast: toast,
        renderStoreGrid: renderStoreGrid,
        initDetailPage: initDetailPage,
        initCreatePage: initCreatePage,
        initMyAssetsPage: initMyAssetsPage,
        initCreatorManageList: initCreatorManageList,
        cardHtml: cardHtml,
        bindCards: bindCards
    };
})(typeof window !== 'undefined' ? window : this);
