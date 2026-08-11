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

        var forcedType = (param('type') || '').toLowerCase();
        var fromShowcase = param('from') === 'showcase';
        var isNftWizard = forcedType === 'nft' && !!qs('#daSteps');
        var step = 1;
        var totalSteps = 4;

        var typeSel = qs('#daAssetType');
        if (typeSel) {
            typeSel.innerHTML = Store.ASSET_TYPES.map(function (t) {
                return '<option value="' + t.id + '">' + t.label + '</option>';
            }).join('');
            if (forcedType) {
                var match = Store.ASSET_TYPES.some(function (t) { return t.id === forcedType; });
                if (match) typeSel.value = forcedType;
            }
            if (isNftWizard) {
                typeSel.value = 'nft';
                typeSel.disabled = true;
            }
        }

        var backBtn = qs('#daBackShowcase');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                location.href = fromShowcase
                    ? 'creator-showcase.html?owner=1&tab=digital'
                    : 'digital-asset-store.html?mine=1';
            });
        }

        function afterSaveRedirect(p, submitted) {
            if (fromShowcase) {
                location.href = 'creator-showcase.html?owner=1&tab=digital' +
                    (p && p.id ? '&open=' + encodeURIComponent(p.id) : '');
                return;
            }
            if (submitted) {
                location.href = 'digital-asset-store.html?mine=1';
                return;
            }
            location.href = 'digital-asset-detail.html?id=' + encodeURIComponent(p.id);
        }

        function collectTraits() {
            var list = qs('#daTraitsList');
            if (!list) return [];
            return qsa('.da-trait-row', list).map(function (row) {
                var k = qs('.da-trait-key', row);
                var v = qs('.da-trait-val', row);
                return {
                    trait_type: k ? k.value.trim() : '',
                    value: v ? v.value.trim() : ''
                };
            }).filter(function (t) { return t.trait_type && t.value; });
        }

        function addTraitRow(traitType, value) {
            var list = qs('#daTraitsList');
            if (!list) return;
            var row = document.createElement('div');
            row.className = 'da-trait-row';
            row.innerHTML =
                '<input class="da-trait-key" type="text" placeholder="属性名" maxlength="40" value="' + esc(traitType || '') + '">' +
                '<input class="da-trait-val" type="text" placeholder="属性值" maxlength="80" value="' + esc(value || '') + '">' +
                '<button type="button" class="btn btn-sm da-trait-del" aria-label="删除属性"><i class="fa-solid fa-xmark"></i></button>';
            list.appendChild(row);
            qs('.da-trait-del', row).addEventListener('click', function () { row.remove(); });
        }

        function collect() {
            var mode = qs('#daSupplyMode').value;
            var cover = qs('#daCover').value.trim();
            var content = qs('#daContent').value.trim();
            var assetType = typeSel ? typeSel.value : 'other';
            if (isNftWizard) assetType = 'nft';
            return {
                title: qs('#daTitle').value.trim(),
                description: qs('#daDesc').value.trim(),
                coverUrl: cover || 'https://images.unsplash.com/photo-1727722158074-b7916daf6af4?w=800&q=80',
                assetType: assetType,
                contentFiles: [content || 'https://example.com/nft-media.bin'],
                priceUsdt: parseFloat(qs('#daPrice').value) || 0,
                supplyMode: mode,
                supplyTotal: mode === 'limited' ? (parseInt(qs('#daSupplyTotal').value, 10) || 100) : 0,
                soldCount: 0,
                nftTraits: collectTraits(),
                chainNetwork: (qs('#daChain') && qs('#daChain').value) || 'Polygon'
            };
        }

        function validateStep(n, data) {
            if (n === 1) {
                if (!data.title) return '请填写 NFT 名称';
                if (!data.description) return '请填写商品描述';
                return null;
            }
            if (n === 2) {
                if (!qs('#daCover').value.trim()) return '请填写封面图 URL';
                if (!qs('#daContent').value.trim()) return '请填写数字内容 / 媒体 URL';
                return null;
            }
            if (n === 3) {
                if (data.priceUsdt <= 0) return '请设置有效价格';
                if (data.supplyMode === 'limited' && data.supplyTotal < 1) return '限量发行数量至少为 1';
                return null;
            }
            if (n === 4) {
                var agree = qs('#daAgree');
                if (agree && !agree.checked) return '请先确认版权与审核规范';
                return null;
            }
            return null;
        }

        function validate(data) {
            if (!data.title) return '请填写商品名称';
            if (data.priceUsdt <= 0) return '请设置有效价格';
            if (data.supplyMode === 'limited' && data.supplyTotal < 1) return '限量发行数量至少为 1';
            return null;
        }

        function renderConfirm(data) {
            var card = qs('#daConfirmCard');
            if (!card) return;
            var traits = (data.nftTraits || []).map(function (t) {
                return '<span class="da-trait-chip">' + esc(t.trait_type) + ' · ' + esc(t.value) + '</span>';
            }).join('') || '<span class="da-muted">未配置 Traits</span>';
            var supply = data.supplyMode === 'limited'
                ? ('限量 ' + data.supplyTotal + ' 份')
                : '无限发行';
            card.innerHTML =
                '<div class="da-confirm-cover"><img src="' + esc(data.coverUrl) + '" alt=""></div>' +
                '<div class="da-confirm-body">' +
                '<div class="k">类型</div><div class="v">' + esc(Store.typeLabel(data.assetType)) + '</div>' +
                '<div class="k">名称</div><div class="v">' + esc(data.title) + '</div>' +
                '<div class="k">描述</div><div class="v">' + esc(data.description) + '</div>' +
                '<div class="k">价格</div><div class="v">' + Number(data.priceUsdt).toFixed(2) + ' USDT</div>' +
                '<div class="k">发行</div><div class="v">' + esc(supply) + ' · ' + esc(data.chainNetwork) + '</div>' +
                '<div class="k">媒体</div><div class="v trunc">' + esc(data.contentFiles[0] || '') + '</div>' +
                '<div class="k">Traits</div><div class="v da-confirm-traits">' + traits + '</div>' +
                '</div>';
        }

        function setStep(n) {
            step = Math.max(1, Math.min(totalSteps, n));
            qsa('.da-step', qs('#daSteps')).forEach(function (el) {
                var s = parseInt(el.getAttribute('data-step'), 10);
                el.classList.toggle('is-active', s === step);
                el.classList.toggle('is-done', s < step);
            });
            qsa('.da-step-panel', form).forEach(function (panel) {
                var s = parseInt(panel.getAttribute('data-panel'), 10);
                var on = s === step;
                panel.hidden = !on;
                panel.classList.toggle('is-active', on);
            });
            var prev = qs('#btnDaPrev');
            var next = qs('#btnDaNext');
            var submit = qs('#btnDaSubmit');
            if (prev) prev.hidden = step <= 1;
            if (next) next.hidden = step >= totalSteps;
            if (submit) submit.hidden = step < totalSteps;
            if (step === totalSteps) renderConfirm(collect());
        }

        var supplyMode = qs('#daSupplyMode');
        if (supplyMode) {
            supplyMode.addEventListener('change', function () {
                var wrap = qs('#daSupplyTotalWrap');
                if (wrap) wrap.style.display = this.value === 'limited' ? '' : 'none';
            });
        }

        var coverInput = qs('#daCover');
        var coverPreview = qs('#daCoverPreview');
        var coverImg = qs('#daCoverImg');
        function refreshCoverPreview() {
            if (!coverInput || !coverPreview || !coverImg) return;
            var url = coverInput.value.trim();
            if (!url) {
                coverPreview.hidden = true;
                return;
            }
            coverImg.src = url;
            coverPreview.hidden = false;
        }
        if (coverInput) {
            coverInput.addEventListener('input', refreshCoverPreview);
            coverInput.addEventListener('change', refreshCoverPreview);
        }

        var traitAdd = qs('#daTraitAdd');
        if (traitAdd) {
            traitAdd.addEventListener('click', function () { addTraitRow('', ''); });
            if (!qs('#daTraitsList') || !qs('#daTraitsList').children.length) {
                addTraitRow('Rarity', 'Rare');
                addTraitRow('Scene', 'Night Street');
            }
        }

        if (isNftWizard) {
            setStep(1);
            var btnPrev = qs('#btnDaPrev');
            var btnNext = qs('#btnDaNext');
            if (btnPrev) {
                btnPrev.addEventListener('click', function () { setStep(step - 1); });
            }
            if (btnNext) {
                btnNext.addEventListener('click', function () {
                    var data = collect();
                    var err = validateStep(step, data);
                    if (err) return toast(err, true);
                    setStep(step + 1);
                });
            }
        } else {
            var wizardBits = [qs('#btnDaPrev'), qs('#btnDaNext'), qs('#daSteps')];
            wizardBits.forEach(function (el) { if (el) el.hidden = true; });
            var submitOnly = qs('#btnDaSubmit');
            if (submitOnly) submitOnly.hidden = false;
        }

        qs('#btnDaSaveDraft').addEventListener('click', function () {
            var data = collect();
            if (isNftWizard) {
                var e1 = validateStep(1, data);
                if (e1) return toast(e1, true);
            } else {
                var err = validate(data);
                if (err) return toast(err, true);
            }
            var p = Store.create(Object.assign(data, { status: 'draft' }));
            toast('草稿已保存');
            setTimeout(function () { afterSaveRedirect(p, false); }, 700);
        });

        qs('#btnDaSubmit').addEventListener('click', function () {
            var data = collect();
            var err;
            if (isNftWizard) {
                err = validateStep(1, data) || validateStep(2, data) || validateStep(3, data) || validateStep(4, data);
            } else {
                err = validate(data);
            }
            if (err) return toast(err, true);
            var p = Store.create(Object.assign(data, { status: 'pending_review' }));
            toast('已提交审核，请在橱窗查看进度');
            setTimeout(function () { afterSaveRedirect(p, true); }, 700);
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
